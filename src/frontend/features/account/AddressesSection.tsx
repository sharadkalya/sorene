import type { AccountAddress } from './account.types';

interface AddressesSectionProps {
  addresses: AccountAddress[];
}

/** Read-only list of the customer's saved delivery addresses. */
export default function AddressesSection({ addresses }: AddressesSectionProps) {
  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-4">
        <h2 className="text-xl font-semibold">Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-base-content/60">No saved addresses yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((address) => (
              <div key={address.id} className="border border-base-300 rounded-box p-4 flex flex-col gap-1">
                <span className="font-medium">{address.fullName}</span>
                <span className="text-sm text-base-content/70">
                  {[address.line1, address.line2, address.city, address.state, address.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </span>
                <span className="text-sm text-base-content/70">{address.phone}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
