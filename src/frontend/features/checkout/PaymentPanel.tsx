'use client';

import { useState } from 'react';
import Button from '@/frontend/components/Button';
import { formatPrice } from '@/frontend/features/storefront/format';
import { useAppDispatch } from '@/frontend/store/hooks';
import { clearCart } from '@/frontend/store/slices/cart.slice';
import { createPaymentOrder, verifyPayment } from './api';
import { loadRazorpayScript, openRazorpayCheckout, type RazorpaySuccessResponse } from './razorpay';

const STORE_NAME = 'SORvÈNE';

type PaymentStatus = 'idle' | 'starting' | 'paying' | 'verifying' | 'cancelled' | 'failed';

interface PaymentPanelProps {
  addressId: string;
  items: { slug: string; quantity: number }[];
  total: number;
  prefillName?: string;
  prefillContact?: string;
  /** Called with the new order number after the payment is verified. */
  onSuccess: (orderNumber: string) => void;
}

/**
 * Payment action card. Creates a payment order, opens the hosted checkout, and
 * verifies the signature. The server places the order only after the payment
 * succeeds; failures/cancellations leave the cart intact for a retry.
 */
export default function PaymentPanel({
  addressId,
  items,
  total,
  prefillName,
  prefillContact,
  onSuccess,
}: PaymentPanelProps) {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSuccess(response: RazorpaySuccessResponse) {
    setStatus('verifying');
    setError(null);
    try {
      const result = await verifyPayment({
        providerOrderId: response.razorpay_order_id,
        providerPaymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      });
      dispatch(clearCart());
      onSuccess(result.orderNumber);
    } catch (err) {
      setStatus('failed');
      setError(
        err instanceof Error ? err.message : 'We could not verify your payment. Please contact support.',
      );
    }
  }

  async function startPayment() {
    setStatus('starting');
    setError(null);
    try {
      await loadRazorpayScript();
      const payment = await createPaymentOrder(addressId, items);

      openRazorpayCheckout({
        key: payment.publicKey,
        amount: payment.amountInPaise,
        currency: payment.currency,
        name: STORE_NAME,
        order_id: payment.providerOrderId,
        prefill: { name: prefillName, contact: prefillContact },
        handler: handleSuccess,
        modal: {
          // Fires when the user closes the checkout without completing it.
          ondismiss: () => setStatus((prev) => (prev === 'paying' ? 'cancelled' : prev)),
        },
      });
      setStatus('paying');
    } catch (err) {
      setStatus('failed');
      setError(
        err instanceof Error ? err.message : 'We could not start the payment. Please try again.',
      );
    }
  }

  const busy = status === 'starting' || status === 'paying' || status === 'verifying';

  return (
    <div className="card bg-base-200 mb-6">
      <div className="card-body gap-4">
        <p className="text-sm text-base-content/60">
          Complete the payment to place your order. You can retry if the payment is interrupted.
        </p>

        {status === 'cancelled' && (
          <div className="alert alert-warning text-sm">
            Payment was not completed. You can try again.
          </div>
        )}
        {status === 'failed' && <div className="alert alert-error text-sm">{error}</div>}
        {status === 'verifying' && (
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <span className="loading loading-spinner loading-sm" />
            Verifying your payment…
          </div>
        )}
        {status === 'paying' && (
          <p className="text-sm text-base-content/60">
            Complete the payment in the secure checkout window.
          </p>
        )}

        <div className="card-actions justify-end">
          <Button onClick={startPayment} variant="primary" disabled={busy}>
            {busy ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              `Pay ${formatPrice(total)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
