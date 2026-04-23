import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[var(--cth-surface-deep)] text-[var(--cth-admin-muted)]">
      <nav className="border-b border-white/5 bg-[var(--cth-surface-deep)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))' }}>⌂</div>
            <div className="leading-none">
              <span className="font-display text-sm font-bold text-white">Core Truth </span>
              <span className="font-display text-sm font-bold text-[var(--cth-admin-accent)]">House</span>
            </div>
          </Link>
          <Link to="/" className="text-sm text-[var(--cth-admin-muted)] hover:text-white transition-colors">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--cth-admin-ruby)] mb-12">Effective Date: April 1, 2025 | Last Updated: April 1, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed">

          <p>Welcome to Core Truth House ("we," "us," "our," or the "Platform"). By accessing or using our Platform, including all services, features, content, and tools provided at coretruthhouse.com (the "Site"), you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.</p>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">1. Overview of Services</h2>
            <p>Core Truth House is an AI-powered brand operating system that enables users to build, manage, and grow their personal or business brand through structured modules including:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Brand Foundation Builder</li>
              <li>Content Studio (AI-assisted content generation)</li>
              <li>Offer Builder</li>
              <li>Systems Builder</li>
              <li>Identity Studio</li>
              <li>Launch Planner</li>
            </ul>
            <p className="mt-2">These tools are powered by a proprietary "Brand Memory" engine that personalizes all outputs based on user-provided data.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">2. Eligibility</h2>
            <p>You must be at least 18 years old to create an account and use the Platform. By registering, you represent that you have the legal capacity to enter into a binding agreement.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">3. Account Registration</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>You agree to provide accurate, current, and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to accept responsibility for all activities that occur under your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">4. Subscription Plans and Payments</h2>
            <p>Core Truth House operates on a tiered subscription model:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong className="text-white">The Foundation</strong> – Free tier with limited access</li>
              <li><strong className="text-white">The Structure</strong> – $97/month</li>
              <li><strong className="text-white">The House</strong> – $197/month</li>
              <li><strong className="text-white">The Estate</strong> – $397/month</li>
            </ul>
            <ul className="list-disc ml-6 mt-4 space-y-2">
              <li>All paid plans are billed monthly or annually at a discounted rate.</li>
              <li>Payments are processed through Stripe. By subscribing, you agree to Stripe's terms of service.</li>
              <li>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.</li>
              <li>No refunds will be issued for partial months of service unless required by law.</li>
              <li>We reserve the right to modify pricing with 30 days' notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">5. AI-Generated Content</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Content generated through our AI tools is created using third-party large language models integrated into our proprietary Brand Memory system.</li>
              <li>You retain ownership of the final content you save, download, or export from the Platform.</li>
              <li>We do not guarantee the originality, accuracy, or legal compliance of AI-generated content.</li>
              <li>You are solely responsible for reviewing, editing, and using generated content in compliance with applicable laws.</li>
              <li>We are not liable for any consequences arising from the use of AI-generated content, including but not limited to trademark or copyright infringement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">6. Brand Memory and Data Usage</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Brand Memory stores user-submitted data (niche, audience, tone, offers, messaging, etc.) to personalize AI outputs.</li>
              <li>We do not sell, share, or use your Brand Memory data for training external AI models.</li>
              <li>You may delete your Brand Memory data at any time by contacting support or using the account settings tools.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">7. Intellectual Property</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>All original platform design, branding, code, and system architecture are the intellectual property of Core Truth House Ltd.</li>
              <li>Users may not copy, reverse-engineer, or redistribute any part of the Platform.</li>
              <li>Content created by users using our tools belongs to the user, subject to Section 5 above.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">8. Acceptable Use</h2>
            <p>You agree not to use the Platform to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Generate or distribute content that is unlawful, fraudulent, misleading, defamatory, or harmful</li>
              <li>Attempt to interfere with the operation or security of the Platform</li>
              <li>Use automated bots, scrapers, or extraction tools to access the Platform</li>
              <li>Violate the intellectual property or privacy rights of any third party</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Core Truth House is provided "as is" and "as available" without warranties of any kind.</li>
              <li>We are not liable for indirect, incidental, consequential, or punitive damages.</li>
              <li>Our total liability shall not exceed the amount paid by you to us in the 12 months preceding the claim.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">10. Termination</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>You may terminate your account at any time by contacting support.</li>
              <li>We may suspend or terminate accounts for violation of these Terms or at our sole discretion with reasonable notice.</li>
              <li>Upon termination, your data may be retained for up to 30 days before deletion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">11. Dispute Resolution</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>These Terms are governed by and construed under the laws of the jurisdiction in which Core Truth House Ltd. is registered.</li>
              <li>Any disputes shall first be addressed through good-faith negotiation.</li>
              <li>If unresolved, disputes shall be settled through binding arbitration under applicable rules.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">12. Modifications</h2>
            <p>We reserve the right to update these Terms at any time. Material changes will be communicated via email or in-app notification. Continued use of the Platform after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">13. Contact</h2>
            <p>For questions or concerns regarding these Terms, contact us at:</p>
            <p className="mt-2"><strong className="text-white">Core Truth House Ltd.</strong><br />Email: legal@coretruthhouse.com</p>
          </section>

        </div>
      </main>
    </div>
  );
}
