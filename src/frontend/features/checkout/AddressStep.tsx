'use client';

import type { FormEvent, InputHTMLAttributes } from 'react';
import Button from '@/frontend/components/Button';
import TextInput from '@/frontend/components/TextInput';
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
}

function Field({ label, name, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <TextInput name={name} {...props} />
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
              <Field label="City" name="city" placeholder="Mumbai" />
              <Field label="State" name="state" placeholder="Maharashtra" />
            </div>
            <Field label="Postal code" name="pincode" placeholder="400001" inputMode="numeric" />

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
