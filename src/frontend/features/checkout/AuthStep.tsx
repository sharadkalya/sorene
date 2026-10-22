'use client';

import Button from '@/frontend/components/Button';
import Select from '@/frontend/components/Select';
import TextInput from '@/frontend/components/TextInput';

export const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'US / Canada (+1)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+61', label: 'Australia (+61)' },
];

interface AuthStepProps {
  step: 'phone' | 'otp';
  countryCode: string;
  onCountryCodeChange: (value: string) => void;
  phoneDigits: string;
  onPhoneDigitsChange: (value: string) => void;
  otp: string;
  onOtpChange: (value: string) => void;
  busy: boolean;
  error: string | null;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onBackToPhone: () => void;
}

/** Phone entry + OTP verification for the sign-in step of checkout. */
export default function AuthStep({
  step,
  countryCode,
  onCountryCodeChange,
  phoneDigits,
  onPhoneDigitsChange,
  otp,
  onOtpChange,
  busy,
  error,
  onSendOtp,
  onVerifyOtp,
  onBackToPhone,
}: AuthStepProps) {
  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-5">
        <div>
          <h2 className="text-xl font-semibold">Verify your phone number</h2>
          <p className="text-sm text-base-content/60 mt-1">
            We&apos;ll send a one-time code to confirm it&apos;s you.
          </p>
        </div>

        {error && <div className="alert alert-error text-sm">{error}</div>}

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Mobile number</span>
              <div className="flex gap-2">
                <Select
                  value={countryCode}
                  onChange={(event) => onCountryCodeChange(event.target.value)}
                  className="w-40"
                  aria-label="Country code"
                >
                  {COUNTRY_CODES.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {entry.label}
                    </option>
                  ))}
                </Select>
                <TextInput
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  maxLength={13}
                  value={phoneDigits}
                  onChange={(event) => onPhoneDigitsChange(event.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            <Button onClick={onSendOtp} variant="primary" disabled={busy} className="w-full">
              {busy ? <span className="loading loading-spinner loading-sm" /> : 'Send verification code'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-base-content/60">
              We sent a 6-digit code to {countryCode} {phoneDigits}.
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Verification code</span>
              <TextInput
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                maxLength={6}
                value={otp}
                onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, ''))}
              />
            </div>
            <Button onClick={onVerifyOtp} variant="primary" disabled={busy} className="w-full">
              {busy ? <span className="loading loading-spinner loading-sm" /> : 'Verify & continue'}
            </Button>
            <button
              type="button"
              onClick={onBackToPhone}
              className="text-sm text-primary hover:underline"
              disabled={busy}
            >
              Use a different number
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
