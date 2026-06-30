export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-4 text-sm text-muted-foreground">Last updated: June 30, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Information We Collect</h2>
          <p>
            We collect information you provide directly: name, email, phone number, delivery
            addresses, and payment method (Cash on Delivery). We also collect device and usage
            data such as IP address, browser type, and pages visited.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. How We Use Your Information</h2>
          <p>
            We use your information to process and deliver orders, send order updates via SMS and
            email, provide customer support, improve our services, and detect fraud.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. SMS &amp; OTP Communications</h2>
          <p>
            By creating an account, you consent to receive transactional SMS messages including
            One-Time Passwords (OTP) for authentication and order delivery notifications. Message
            and data rates may apply.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Data Sharing</h2>
          <p>
            We share your data only with: delivery partners (name, phone, address), SMS/OTP
            providers (phone number), and payment processors. We do not sell your personal data
            to third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Data Security</h2>
          <p>
            We use industry-standard encryption (HTTPS/TLS) and secure authentication (JWT tokens)
            to protect your data. Passwords are stored using bcrypt hashing.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">6. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We do not use
            third-party tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Your Rights</h2>
          <p>
            You may access, update, or delete your account information at any time through your
            account settings or by contacting us. You may opt out of promotional communications.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">8. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Order history is
            retained for legal and accounting purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">9. Contact</h2>
          <p>
            For privacy-related questions or to exercise your rights, contact us at
            support@apnakit.in.
          </p>
        </section>
      </div>
    </div>
  );
}
