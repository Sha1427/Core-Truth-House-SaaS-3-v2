import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#1c0828] text-[#c7a09d]">
      <nav className="border-b border-white/5 bg-[#1c0828]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}>⌂</div>
            <div className="leading-none">
              <span className="font-display text-sm font-bold text-white">Core Truth </span>
              <span className="font-display text-sm font-bold text-[#e04e35]">House</span>
            </div>
          </Link>
          <Link to="/" className="text-sm text-[#a08aaa] hover:text-white transition-colors">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#763b5b] mb-12">Effective Date: April 1, 2025 | Last Updated: April 1, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed">

          <p>Core Truth House Ltd. ("we," "us," "our") values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect data when you use the Core Truth House platform ("Platform") and associated services.</p>
          <p>By using the Platform, you consent to the practices described in this policy.</p>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">1. Information We Collect</h2>
            <h3 className="text-base font-semibold text-white mt-6 mb-3">a. Information You Provide</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Account registration details (name, email address, password)</li>
              <li>Billing information (processed securely by Stripe; we do not store full card details)</li>
              <li>Brand data entered through the Brand Foundation, Content Studio, Offer Builder, Systems Builder, Identity Studio, and Launch Planner modules</li>
              <li>Brand Memory data (niche, audience, tone, messaging, offers, and visual preferences)</li>
              <li>Uploaded brand assets (logos, images, files)</li>
              <li>Content generated, saved, or exported through the Platform</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">b. Information Collected Automatically</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>IP address, browser type, device type, operating system</li>
              <li>Pages viewed, features used, and time spent on the Platform</li>
              <li>Cookies, session identifiers, and analytics data</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">c. Third-Party Data</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Authentication data from third-party login providers (e.g., Clerk, Google, Apple)</li>
              <li>Payment processing data from Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">2. How We Use Your Information</h2>
            <p>We use collected data to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve the Platform and its features</li>
              <li>Personalize your experience, including AI-generated content via Brand Memory</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send transactional and service-related communications</li>
              <li>Detect and prevent fraud, abuse, or security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-4 font-semibold text-white">We do not sell your personal data or Brand Memory information to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">3. Brand Memory and AI Data Handling</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Brand Memory stores brand-specific data you provide (e.g., niche, voice, messaging, audience) to personalize AI-generated outputs across all Platform modules.</li>
              <li>Your Brand Memory data is used solely to improve your experience on this Platform.</li>
              <li>We do not share your Brand Memory data with any third-party AI model providers for the purpose of training or fine-tuning external models.</li>
              <li>Prompts sent to AI services may temporarily include your Brand Memory data to generate results, but are not retained by external providers beyond the immediate processing window.</li>
              <li>You can view, edit, or delete your Brand Memory data at any time from within your account settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">4. Data Storage and Security</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>All data is stored using industry-standard encryption at rest and in transit.</li>
              <li>We use secure cloud infrastructure with access controls, logging, and monitoring.</li>
              <li>Payment data is handled entirely by Stripe and subject to Stripe's PCI-DSS compliance standards.</li>
              <li>While we take reasonable precautions, no system is completely immune to security risks. You are responsible for maintaining the security of your login credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">5. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Authenticate users and maintain sessions</li>
              <li>Analyze usage patterns and improve performance</li>
              <li>Deliver personalized experiences</li>
            </ul>
            <p className="mt-2">You may manage cookie preferences through your browser settings. Disabling cookies may affect certain features of the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">6. Third-Party Services</h2>
            <p>We integrate the following third-party services:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong className="text-white">Clerk</strong> – User authentication and session management</li>
              <li><strong className="text-white">Stripe</strong> – Payment processing</li>
              <li><strong className="text-white">AI Providers</strong> – Content generation (Claude, GPT, Sora)</li>
              <li><strong className="text-white">Analytics</strong> – Usage and performance tracking</li>
            </ul>
            <p className="mt-2">Each third-party service is governed by its own privacy policy and terms of use. We recommend reviewing their policies directly.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to or restrict certain processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time (without affecting lawfulness of prior processing)</li>
            </ul>
            <p className="mt-2">To exercise your rights, contact us at <strong className="text-white">privacy@coretruthhouse.com</strong>.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">8. Data Retention</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Account data is retained for as long as your account is active.</li>
              <li>Upon account deletion, your data will be removed within 30 days, except where retention is required by law.</li>
              <li>Payment records may be retained for up to 7 years to comply with financial regulations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">9. Children's Privacy</h2>
            <p>The Platform is not intended for users under the age of 18. We do not knowingly collect personal data from minors. If we become aware of such collection, we will promptly delete it.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. If we make significant changes, we will notify you via email or in-app notification. Continued use of the Platform constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-white mt-10 mb-4">11. Contact</h2>
            <p>For privacy-related inquiries, contact us at:</p>
            <p className="mt-2"><strong className="text-white">Core Truth House Ltd.</strong><br />Email: privacy@coretruthhouse.com</p>
          </section>

        </div>
      </main>
    </div>
  );
}
