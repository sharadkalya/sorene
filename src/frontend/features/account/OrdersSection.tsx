import Button from '@/frontend/components/Button';

/** Account page card linking to the customer's order history. */
export default function OrdersSection() {
  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Your orders</h2>
          <Button href="/account/orders" variant="ghost" size="sm">
            View all
          </Button>
        </div>
        <p className="text-sm text-base-content/60">Review your order history and track status.</p>
      </div>
    </section>
  );
}
