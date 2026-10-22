'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Button from '@/frontend/components/Button';
import { useAppSelector } from '@/frontend/store/hooks';
import { useIsClient } from '@/frontend/hooks/useIsClient';
import { selectCartItems, selectCartSubtotal } from '@/frontend/store/slices/cart.slice';
import { formatPrice } from '@/frontend/features/storefront/format';
import AddressStep from './AddressStep';
import AuthStep from './AuthStep';
import { addCustomerAddress, requestOtp, verifyOtp } from './api';
import type { Customer } from './types';

/** Two-step checkout: sign in (WhatsApp OTP), then choose an address. */
export default function CheckoutFlow({ initialCustomer }: { initialCustomer: Customer | null }) {
  const router = useRouter();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);

  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const isClient = useIsClient();

  if (!isClient) {
    return <div className="max-w-2xl mx-auto px-4 py-8" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-4">Checkout</h1>
        <p className="text-base-content/60 mb-6">Your cart is empty.</p>
        <Button href="/shop" variant="primary">
          Start Shopping
        </Button>
      </div>
    );
  }

  const savedAddresses = customer?.addresses ?? [];
  const addressMode: 'select' | 'form' =
    savedAddresses.length > 0 && !showAddressForm ? 'select' : 'form';

  async function handleSendOtp() {
    if (phoneDigits.length < 7 || phoneDigits.length > 13) {
      setAuthError('Please enter a valid mobile number.');
      return;
    }

    setBusy(true);
    setAuthError(null);
    try {
      await requestOtp(`${countryCode}${phoneDigits}`);
      setAuthStep('otp');
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'We could not send a code right now. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }

    setBusy(true);
    setAuthError(null);
    try {
      const next = await verifyOtp(`${countryCode}${phoneDigits}`, otp);
      setCustomer(next);
      setAuthError(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not verify your code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function goToOrder(addressId: string) {
    router.push(`/order?address=${encodeURIComponent(addressId)}`);
  }

  function handleUseSelected() {
    if (!selectedAddressId) {
      setAddressError('Please select an address to continue.');
      return;
    }
    goToOrder(selectedAddressId);
  }

  async function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      fullName: String(form.get('fullName') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      line1: String(form.get('line1') ?? '').trim(),
      line2: String(form.get('line2') ?? '').trim() || undefined,
      city: String(form.get('city') ?? '').trim(),
      state: String(form.get('state') ?? '').trim(),
      pincode: String(form.get('pincode') ?? '').trim(),
    };

    setBusy(true);
    setAddressError(null);
    try {
      const address = await addCustomerAddress(input);
      goToOrder(address.id);
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Could not save your address. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <Link href="/cart" className="text-sm font-medium text-primary hover:underline">
          ← Back to cart
        </Link>
      </div>

      <ul className="steps w-full mb-8">
        <li className="step step-primary">Sign in</li>
        <li className={`step ${customer ? 'step-primary' : ''}`}>Address</li>
        <li className="step">Review</li>
      </ul>

      <div className="space-y-6">
        {customer ? (
          <AddressStep
            customer={customer}
            mode={addressMode}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            busy={busy}
            error={addressError}
            onUseSelected={handleUseSelected}
            onAddNew={() => {
              setAddressError(null);
              setShowAddressForm(true);
            }}
            onBackToSelection={() => {
              setAddressError(null);
              setShowAddressForm(false);
            }}
            onSubmitForm={handleAddressSubmit}
          />
        ) : (
          <AuthStep
            step={authStep}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            phoneDigits={phoneDigits}
            onPhoneDigitsChange={setPhoneDigits}
            otp={otp}
            onOtpChange={setOtp}
            busy={busy}
            error={authError}
            onSendOtp={handleSendOtp}
            onVerifyOtp={handleVerifyOtp}
            onBackToPhone={() => {
              setAuthError(null);
              setAuthStep('phone');
            }}
          />
        )}

        <aside className="card bg-base-200">
          <div className="card-body">
            <h2 className="font-semibold">Order summary</h2>
            <div className="flex justify-between text-sm text-base-content/70">
              <span>{items.reduce((total, item) => total + item.quantity, 0)} item(s)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-base-content/50">
              Shipping and payment are handled on the next step.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
