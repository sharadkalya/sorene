import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — SORvÈNE',
  description: 'How SORvÈNE collects, uses, and protects your personal information.',
};

/** Public privacy policy (linked from Meta's WhatsApp configuration and the storefront). */
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
      <p className="text-sm text-base-content/60 mb-10">Last updated: 22 October 2026</p>

      <div className="space-y-8 text-base-content/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">1. Who we are</h2>
          <p>
            SORvÈNE (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the website
            sorvenestudio.com (&ldquo;the Site&rdquo;), a store for structured leather handbags. This
            policy explains what personal information we collect, why we collect it, and the choices
            you have about it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">2. Information we collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Contact details</strong> — your phone number (used to verify your identity with a
              one-time code and to deliver your order), your name, and the shipping address you provide
              at checkout.
            </li>
            <li>
              <strong>Email address</strong> — only if you choose to receive updates from us.
            </li>
            <li>
              <strong>Order information</strong> — the items in your cart and the delivery address you
              select.
            </li>
            <li>
              <strong>Technical information</strong> — your IP address (used for security and abuse
              prevention), browser and device details, and cookie/session data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">3. How we use your information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To verify your phone number by sending a one-time verification code.</li>
            <li>To process your order and deliver it to the address you provide.</li>
            <li>To contact you about your order or, if you opt in, to send updates and offers.</li>
            <li>To protect the Site against fraud, abuse, and misuse (for example, rate limiting).</li>
            <li>To maintain and improve the Site.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">4. Legal basis for processing</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Performance of a contract</strong> — processing needed to fulfil and deliver your
              order.
            </li>
            <li>
              <strong>Consent</strong> — sending marketing communications, where you have opted in.
            </li>
            <li>
              <strong>Legitimate interests</strong> — securing the Site, preventing fraud, and improving
              our service, balanced against your rights.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">5. How we share your information</h2>
          <p className="mb-3">We do not sell your personal information. We share it only as follows:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>WhatsApp (Meta)</strong> — your phone number is passed to WhatsApp to deliver the
              one-time verification code. Meta&rsquo;s handling of that data is governed by its own
              privacy policy.
            </li>
            <li>
              <strong>Service providers</strong> — we use third parties to operate the Site, including
              email delivery (Resend), database hosting (MongoDB Atlas), and media storage (Cloudflare
              R2). A payment processor (Razorpay) will process payments when checkout launches.
            </li>
            <li>
              <strong>Legal requirements</strong> — where disclosure is required by law or to protect our
              rights and the security of our users.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">6. Cookies and local storage</h2>
          <p>
            We use strictly necessary cookies and browser storage: a session cookie to keep you signed in,
            and local storage to remember the items in your cart. These are required for the Site to
            function and are not used for advertising or cross-site tracking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">7. Data retention</h2>
          <p>
            We keep your information only as long as necessary. Cart contents are stored on your device
            until you clear them. Account and order information is retained for as long as needed to
            provide our services and meet legal and accounting obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">8. Security</h2>
          <p>
            We take reasonable technical and organisational measures to protect your data, including
            encryption in transit (HTTPS), hashing of one-time codes, signed session cookies, and
            server-side access controls.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">9. Your rights</h2>
          <p className="mb-3">Depending on where you live, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access the personal information we hold about you.</li>
            <li>Ask us to correct or delete your information.</li>
            <li>Withdraw consent you have previously given.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Receive a copy of your data in a portable format.</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, contact us using the details below.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">10. Children</h2>
          <p>
            The Site is not directed at children, and we do not knowingly collect personal information
            from anyone under the age of 18.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">11. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top
            reflects the most recent changes. Continued use of the Site after changes take effect
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-base-content mb-3">12. Contact us</h2>
          <p>
            If you have questions about this policy or wish to exercise your rights, email us at{' '}
            <a href="mailto:hello@sorvenestudio.com" className="text-primary hover:underline">
              hello@sorvenestudio.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
