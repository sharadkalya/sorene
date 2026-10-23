/** Saved-payment-methods card (display only until payments ship). */
export default function PaymentMethodsSection() {
  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3">
        <h2 className="text-xl font-semibold">Payment methods</h2>
        <p className="text-sm text-base-content/60">No saved payment methods yet.</p>
      </div>
    </section>
  );
}
