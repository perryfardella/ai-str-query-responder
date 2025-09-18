import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - AI STR Query Responder",
  description:
    "Privacy policy for AI STR Query Responder - WhatsApp Business automation for short-term rentals",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </header>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                AI STR Query Responder (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
                &ldquo;us&rdquo;) is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our WhatsApp Business
                automation service for short-term rental properties.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                By using our service, you agree to the collection and use of
                information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                2.1 Personal Information
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Email address and account credentials</li>
                <li>WhatsApp Business account information</li>
                <li>Phone numbers associated with your business</li>
                <li>Property information and details you provide</li>
                <li>
                  Billing and payment information (processed securely through
                  Stripe)
                </li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                2.2 WhatsApp Messages and Communications
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>
                  Messages received through your WhatsApp Business account
                </li>
                <li>Message content, timestamps, and metadata</li>
                <li>
                  Contact information of message senders (phone numbers, profile
                  names)
                </li>
                <li>AI-generated responses and conversation history</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                2.3 Technical Information
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Usage statistics and application logs</li>
                <li>Webhook and API interaction data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Provide and maintain our WhatsApp automation service</li>
                <li>Process and respond to WhatsApp messages using AI</li>
                <li>
                  Manage your property information and guest communications
                </li>
                <li>Process payments and manage subscriptions</li>
                <li>Improve our AI responses and service quality</li>
                <li>Send service-related notifications and updates</li>
                <li>Provide customer support and technical assistance</li>
                <li>Comply with legal obligations and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. AI Processing and Data Usage
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our AI system processes WhatsApp messages to generate automated
                responses:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>
                  Messages are analyzed using third-party AI services (OpenAI,
                  Anthropic, etc.)
                </li>
                <li>
                  Conversation context and property information are used to
                  generate relevant responses
                </li>
                <li>
                  AI confidence scores determine whether responses are sent
                  automatically or require human review
                </li>
                <li>
                  Message data may be used to improve AI response quality and
                  accuracy
                </li>
                <li>
                  We do not use your data to train AI models for other customers
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may share your information in the following circumstances:
              </p>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                5.1 Service Providers
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Supabase (database and authentication services)</li>
                <li>Vercel (hosting and deployment)</li>
                <li>Stripe (payment processing)</li>
                <li>AI service providers (OpenAI, Anthropic, etc.)</li>
                <li>Meta/Facebook (WhatsApp Business API)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                5.2 Legal Requirements
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may disclose your information if required by law, court
                order, or to protect our rights and safety.
              </p>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                5.3 Business Transfers
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                In the event of a merger, acquisition, or sale of assets, your
                information may be transferred to the new entity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate security measures to protect your
                information:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Encryption in transit and at rest</li>
                <li>Secure API endpoints with authentication</li>
                <li>Regular security updates and monitoring</li>
                <li>Access controls and audit logging</li>
                <li>Compliance with industry security standards</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                However, no method of transmission over the internet is 100%
                secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Data Retention
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain your information for as long as necessary to provide
                our services:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Account information: Until account deletion</li>
                <li>
                  WhatsApp messages: 90 days for operational purposes, longer if
                  required by law
                </li>
                <li>
                  Property information: Until you remove it or delete your
                  account
                </li>
                <li>
                  Payment records: As required by tax and accounting regulations
                </li>
                <li>
                  Logs and analytics: Up to 12 months for service improvement
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Your Rights (GDPR/CCPA)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>
                  <strong>Access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Rectification:</strong> Correct inaccurate or
                  incomplete data
                </li>
                <li>
                  <strong>Erasure:</strong> Request deletion of your data
                </li>
                <li>
                  <strong>Portability:</strong> Receive your data in a
                  structured format
                </li>
                <li>
                  <strong>Restriction:</strong> Limit how we process your data
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain types of
                  processing
                </li>
                <li>
                  <strong>Withdraw consent:</strong> Revoke previously given
                  consent
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                To exercise these rights, please contact us using the
                information provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Third-Party Services
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our service integrates with third-party platforms that have
                their own privacy policies:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>WhatsApp Business API (Meta Privacy Policy)</li>
                <li>OpenAI (OpenAI Privacy Policy)</li>
                <li>Stripe (Stripe Privacy Policy)</li>
                <li>Supabase (Supabase Privacy Policy)</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                We recommend reviewing their privacy policies to understand how
                they handle your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Children&apos;s Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Our service is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13. If we become aware that we have collected personal
                information from a child under 13, we will take steps to delete
                such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. International Data Transfers
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Your information may be transferred to and processed in
                countries other than your own. We ensure appropriate safeguards
                are in place to protect your data in accordance with applicable
                data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &ldquo;Last updated&rdquo; date.
                Changes are effective immediately upon posting.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                13. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Email:</strong> me@perryfardella.com
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Response Time:</strong> We aim to respond to privacy
                  inquiries within 30 days.
                </p>
              </div>
            </section>
          </div>

          <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} AI STR Query Responder. All rights
                reserved.
              </p>
              <Link
                href="/"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
