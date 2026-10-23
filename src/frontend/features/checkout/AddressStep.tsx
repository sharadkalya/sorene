'use client';

import { useRef, useState, type FormEvent, type InputHTMLAttributes, type Ref } from 'react';
import Button from '@/frontend/components/Button';
import TextInput from '@/frontend/components/TextInput';
import { lookupPincode } from './api';
import type { Address, Customer } from './types';

interface AddressStepProps {
  customer: Customer;
  mode: 'select' | 'form';
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  busy: boolean;
  error: string | null;
  onUseSelected: () => void;
  onAddNew: () => void;
  onBackToSelection: () => void;
  onSubmitForm: (event: FormEvent<HTMLFormElement>) => void;
}

function formatAddress(address: Address): string {
  return [address.fullName, address.line1, address.line2, address.city, address.state, address.pincode, address.phone]
    .filter(Boolean)
    .join(', ');
}

interface FieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'name'> {
  label: string;
  name: string;
  inputRef?: Ref<HTMLInputElement>;
}

function Field({ label, name, inputRef, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <TextInput name={name} ref={inputRef} {...props} />
    </div>
  );
}

/** Delivery-address step: select a saved address or enter a new one. */
export default function AddressStep({
  customer,
  mode,
  selectedAddressId,
  onSelectAddress,
  busy,
  error,
  onUseSelected,
  onAddNew,
  onBackToSelection,
  onSubmitForm,
}: AddressStepProps) {
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const pincodeRef = useRef<HTMLInputElement>(null);
  const [lookup, setLookup] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  async function handleLookup(rawPincode: string) {
    const pincode = rawPincode.trim();
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      setLookup({ status: 'error', message: 'Enter a valid 6-digit pincode.' });
      return;
    }

    setLookup({ status: 'loading', message: '' });
    try {
      const result = await lookupPincode(pincode);
      if (cityRef.current) cityRef.current.value = result.city;
      if (stateRef.current) stateRef.current.value = result.state;
      setLookup({ status: 'success', message: `Found ${result.city}, ${result.state}.` });
    } catch (error) {
      setLookup({
        status: 'error',
        message: error instanceof Error ? error.message : "We couldn't find that pincode.",
      });
    }
  }

  if (mode === 'form') {
    return (
      <section className="card bg-base-100 border border-base-300">
        <div className="card-body gap-5">
          <div>
            <h2 className="text-xl font-semibold">Delivery address</h2>
            <p className="text-sm text-base-content/60 mt-1">Tell us where to deliver your order.</p>
          </div>

          {error && <div className="alert alert-error text-sm">{error}</div>}

          <form onSubmit={onSubmitForm} className="space-y-4">
            <Field label="Full name" name="fullName" placeholder="Jane Doe" autoComplete="name" />
            <Field
              label="Phone number"
              name="phone"
              placeholder="+91 98765 43210"
              type="tel"
              autoComplete="tel"
              defaultValue={customer.phone}
            />
            <Field label="Address line 1" name="line1" placeholder="House no, street, area" />
            <Field label="Address line 2 (optional)" name="line2" placeholder="Landmark, apartment" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City" name="city" placeholder="Mumbai" inputRef={cityRef} />
              <Field label="State" name="state" placeholder="Maharashtra" inputRef={stateRef} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <Field
                  label="Postal code"
                  name="pincode"
                  placeholder="400001"
                  inputMode="numeric"
                  inputRef={pincodeRef}
                  onBlur={(event) => {
                    const value = event.currentTarget.value.trim();
                    if (value) handleLookup(value);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleLookup(pincodeRef.current?.value ?? '')}
                disabled={busy || lookup.status === 'loading'}
              >
                {lookup.status === 'loading' ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Auto-fill'
                )}
              </Button>
            </div>

            {lookup.status === 'success' && (
              <div className="alert alert-success text-sm">{lookup.message}</div>
            )}
            {lookup.status === 'error' && (
              <div className="alert alert-error text-sm">{lookup.message}</div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-sm" /> : 'Save & continue'}
              </Button>
              {customer.addresses.length > 0 && (
                <Button type="button" onClick={onBackToSelection} variant="outline" disabled={busy}>
                  Back to saved addresses
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-5">
        <div>
          <h2 className="text-xl font-semibold">Delivery address</h2>
          <p className="text-sm text-base-content/60 mt-1">Choose where we should send your order.</p>
        </div>

        {error && <div className="alert alert-error text-sm">{error}</div>}

        <div className="space-y-3">
          {customer.addresses.map((address) => (
            <label
              key={address.id}
              className="flex items-start gap-3 rounded-box border border-base-300 p-4 cursor-pointer hover:border-primary"
            >
              <input
                type="radio"
                name="delivery-address"
                className="radio radio-primary mt-1"
                checked={selectedAddressId === address.id}
                onChange={() => onSelectAddress(address.id)}
              />
              <span className="text-sm leading-relaxed">{formatAddress(address)}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onUseSelected} variant="primary" disabled={busy || !selectedAddressId}>
            Deliver to this address
          </Button>
          <Button onClick={onAddNew} variant="outline" disabled={busy}>
            Add a new address
          </Button>
        </div>
      </div>
    </section>
  );
}
