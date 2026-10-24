// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('./api', () => ({
  createPaymentOrder: vi.fn(),
  verifyPayment: vi.fn(),
}));

vi.mock('./razorpay', () => ({
  loadRazorpayScript: vi.fn(),
  openRazorpayCheckout: vi.fn(),
}));

vi.mock('@/frontend/store/hooks', () => ({
  useAppDispatch: () => vi.fn(),
}));

vi.mock('@/frontend/store/slices/cart.slice', () => ({
  clearCart: vi.fn(),
}));

import { createPaymentOrder, verifyPayment } from './api';
import { loadRazorpayScript, openRazorpayCheckout, type RazorpayCheckoutOptions } from './razorpay';
import PaymentPanel from './PaymentPanel';

const createPaymentOrderMock = vi.mocked(createPaymentOrder);
const verifyPaymentMock = vi.mocked(verifyPayment);
const loadRazorpayScriptMock = vi.mocked(loadRazorpayScript);
const openRazorpayCheckoutMock = vi.mocked(openRazorpayCheckout);

const payment = {
  provider: 'razorpay',
  providerOrderId: 'order_provider_1',
  amountInPaise: 48000,
  currency: 'INR',
  publicKey: 'rzp_test_TestKey',
};

let capturedOptions: RazorpayCheckoutOptions | undefined;

function renderPanel(onSuccess: (orderNumber: string) => void = vi.fn()) {
  return render(
    <PaymentPanel
      addressId="a1"
      items={[{ slug: 'the-arch-bag', quantity: 2 }]}
      total={480}
      prefillName="Jane Doe"
      prefillContact="+919876543210"
      onSuccess={onSuccess}
    />,
  );
}

async function openCheckout(onSuccess?: (orderNumber: string) => void) {
  const view = renderPanel(onSuccess);
  fireEvent.click(view.getByRole('button', { name: /Pay/ }));
  await waitFor(() => expect(openRazorpayCheckoutMock).toHaveBeenCalledTimes(1));
  return view;
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedOptions = undefined;
  loadRazorpayScriptMock.mockResolvedValue();
  openRazorpayCheckoutMock.mockImplementation((options) => {
    capturedOptions = options;
  });
});

afterEach(() => {
  cleanup();
});

describe('PaymentPanel', () => {
  it('renders the pay button with the order total', () => {
    const view = renderPanel();

    expect(view.getByRole('button', { name: /Pay/ })).toBeTruthy();
  });

  it('creates a payment order and opens the checkout with mapped options', async () => {
    createPaymentOrderMock.mockResolvedValue(payment);

    await openCheckout();

    expect(createPaymentOrderMock).toHaveBeenCalledWith('a1', [{ slug: 'the-arch-bag', quantity: 2 }]);
    expect(capturedOptions).toMatchObject({
      key: 'rzp_test_TestKey',
      amount: 48000,
      currency: 'INR',
      order_id: 'order_provider_1',
      prefill: { name: 'Jane Doe', contact: '+919876543210' },
    });
  });

  it('verifies the signature and reports the order number on success', async () => {
    createPaymentOrderMock.mockResolvedValue(payment);
    verifyPaymentMock.mockResolvedValue({
      verified: true,
      status: 'paid',
      orderId: 'o1',
      orderNumber: 'SR-20261023-1234',
    });
    const onSuccess = vi.fn();

    await openCheckout(onSuccess);

    capturedOptions!.handler({
      razorpay_order_id: 'order_provider_1',
      razorpay_payment_id: 'pay_provider_1',
      razorpay_signature: 'a'.repeat(64),
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('SR-20261023-1234'));
    expect(verifyPaymentMock).toHaveBeenCalledWith({
      providerOrderId: 'order_provider_1',
      providerPaymentId: 'pay_provider_1',
      signature: 'a'.repeat(64),
    });
  });

  it('shows an error and allows retry when verification fails', async () => {
    createPaymentOrderMock.mockResolvedValue(payment);
    verifyPaymentMock.mockRejectedValue(new Error('Payment verification failed.'));
    const onSuccess = vi.fn();

    const view = await openCheckout(onSuccess);

    capturedOptions!.handler({
      razorpay_order_id: 'order_provider_1',
      razorpay_payment_id: 'pay_provider_1',
      razorpay_signature: 'a'.repeat(64),
    });

    await waitFor(() => expect(view.getByText('Payment verification failed.')).toBeTruthy());
    expect(view.getByRole('button', { name: /Pay/ })).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows a cancelled notice when the checkout is dismissed', async () => {
    createPaymentOrderMock.mockResolvedValue(payment);

    const view = await openCheckout();
    // Wait until the checkout is open ('paying') before dismissing it.
    await waitFor(() =>
      expect(view.getByText('Complete the payment in the secure checkout window.')).toBeTruthy(),
    );

    capturedOptions!.modal!.ondismiss!();

    await waitFor(() =>
      expect(view.getByText('Payment was not completed. You can try again.')).toBeTruthy(),
    );
  });

  it('shows an error when the payment order cannot be created', async () => {
    createPaymentOrderMock.mockRejectedValue(
      new Error('We could not start the payment. Please try again.'),
    );

    const view = renderPanel();
    fireEvent.click(view.getByRole('button', { name: /Pay/ }));

    await waitFor(() =>
      expect(view.getByText('We could not start the payment. Please try again.')).toBeTruthy(),
    );
    expect(openRazorpayCheckoutMock).not.toHaveBeenCalled();
  });
});

