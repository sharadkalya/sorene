'use client';

import { useState } from 'react';
import AuthStep from '@/frontend/features/checkout/AuthStep';
import { requestOtp, verifyOtp } from '@/frontend/features/checkout/api';

interface SignedOutProps {
  onSignedIn: () => void;
}

/** OTP sign-in prompt shown when a visitor opens the account page signed out. */
export default function SignedOut({ onSignedIn }: SignedOutProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phone = `${countryCode}${phoneDigits}`;

  const handleSendOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send a code right now.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(phone, otp);
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not verify your code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <AuthStep
        step={step}
        countryCode={countryCode}
        onCountryCodeChange={setCountryCode}
        phoneDigits={phoneDigits}
        onPhoneDigitsChange={setPhoneDigits}
        otp={otp}
        onOtpChange={setOtp}
        busy={busy}
        error={error}
        onSendOtp={handleSendOtp}
        onVerifyOtp={handleVerifyOtp}
        onBackToPhone={() => setStep('phone')}
      />
      <p className="text-center text-sm text-base-content/60 mt-4">
        Please sign in to view your profile, addresses, and wishlist.
      </p>
    </div>
  );
}
