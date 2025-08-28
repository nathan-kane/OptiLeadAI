"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

export default function PrivacyPolicyContent() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return') || '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href={returnUrl}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-600">Version 1.0 | Effective Date: 8/25/2025</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <div>
            <p className="text-slate-700 leading-relaxed">
              OptiLeads ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and safeguard your personal information when you use our application, website, and related services (collectively, the "Services").
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Information We Collect</h2>
            <p className="text-slate-700 mb-4">When you use OptiLeads, we may collect the following types of information:</p>
            <ul className="space-y-3 text-slate-700">
              <li><strong>Account Information:</strong> Name, email address, phone number, password, and billing details when you register or subscribe.</li>
              <li><strong>Lead & Contact Data:</strong> Information about leads, prospects, or clients you add to the platform (names, phone numbers, emails, notes).</li>
              <li><strong>Call Data:</strong> Transcripts, call duration, and outcomes from AI-powered calls made using the app.</li>
              <li><strong>Usage Data:</strong> Device type, IP address, app interactions, and log data to improve performance.</li>
              <li><strong>Payment Information:</strong> Processed securely via third-party payment providers (e.g., Stripe). We do not store credit card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-slate-700 mb-4">We use the information we collect to:</p>
            <ul className="space-y-2 text-slate-700">
              <li>• Provide, maintain, and improve our Services.</li>
              <li>• Automate lead generation, nurturing, and CRM tasks.</li>
              <li>• Personalize your experience and provide customer support.</li>
              <li>• Communicate with you regarding updates, features, or promotions.</li>
              <li>• Ensure security and prevent fraudulent or unauthorized use.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Sharing of Information</h2>
            <p className="text-slate-700 mb-4">We do not sell your personal data. We may share information only in these cases:</p>
            <ul className="space-y-3 text-slate-700">
              <li><strong>Service Providers:</strong> With trusted vendors (e.g., hosting, analytics, payment processors) who help operate our Services.</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process.</li>
              <li><strong>Business Transfers:</strong> If we merge, sell, or transfer part of our business, your data may be included as part of the transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Data Retention</h2>
            <ul className="space-y-3 text-slate-700">
              <li>• We retain user accounts and lead data for as long as your account is active.</li>
              <li>• You may request deletion of your data at any time by contacting us at <a href="mailto:nkane1234@gmail.com" className="text-blue-600 hover:underline">nkane1234@gmail.com</a>.</li>
              <li>• Call transcripts from unsuccessful leads may be deleted automatically as part of our retention policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Security</h2>
            <p className="text-slate-700">
              We implement industry-standard security measures to protect your information, including encryption, secure data storage, and access controls. However, no method of transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Your Rights</h2>
            <p className="text-slate-700 mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="space-y-2 text-slate-700">
              <li>• Access the personal data we hold about you.</li>
              <li>• Request correction or deletion of your data.</li>
              <li>• Opt-out of marketing communications.</li>
              <li>• Request portability of your data.</li>
            </ul>
            <p className="text-slate-700 mt-4">
              To exercise your rights, contact us at <a href="mailto:nkane1234@gmail.com" className="text-blue-600 hover:underline">nkane1234@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Children's Privacy</h2>
            <p className="text-slate-700">
              Our Services are not directed to individuals under 18. We do not knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Changes to This Policy</h2>
            <p className="text-slate-700">
              We reserve the right to update this Privacy Policy from time to time. Updates will be posted within the app and on our website, accompanied by a new "Effective Date."
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have any questions about this Privacy Policy or how your data is handled, please contact us at:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-slate-700 font-medium">OptiLeads Privacy Team</p>
              <p className="text-slate-700">Email: <a href="mailto:nkane1234@gmail.com" className="text-blue-600 hover:underline">nkane1234@gmail.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
