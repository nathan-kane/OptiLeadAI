"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

function TermsAndConditionsContent() {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms and Conditions</h1>
          <p className="text-slate-600">Effective Date: 8/25/2025</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <div>
            <p className="text-slate-700 leading-relaxed">
              Welcome to OptiLeads. These Terms and Conditions ("Terms") govern your use of our web application, services, and features (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not use the Service.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Eligibility</h2>
            <p className="text-slate-700">
              You must be at least 18 years old to use OptiLeads. By using the Service, you represent and warrant that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Accounts</h2>
            <ul className="space-y-3 text-slate-700">
              <li>• You must provide accurate and complete information when creating an account.</li>
              <li>• You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>• You are responsible for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Use of the Service</h2>
            <p className="text-slate-700 mb-4">
              OptiLeads provides tools for lead generation, CRM functionality, and calling automation.
              By using the Service, you agree that:
            </p>
            <ul className="space-y-3 text-slate-700 mb-4">
              <li>• You will use the Service only for lawful purposes and in compliance with all federal, state, and local laws, including but not limited to the Telephone Consumer Protection Act (TCPA), the Telemarketing Sales Rule (TSR), and the National/State Do Not Call (DNC) regulations.</li>
              <li>• You are solely responsible for ensuring that any lead lists or contact data you upload are lawful, accurate, and compliant with all consent requirements.</li>
            </ul>
            <p className="text-slate-700 mb-3">You may not:</p>
            <ul className="space-y-2 text-slate-700 ml-4">
              <li>• Upload or attempt to contact numbers from the DNC registry without documented consent.</li>
              <li>• Use the Service to send robocalls, prerecorded messages, or SMS texts without the required consent.</li>
              <li>• Use the Service for spamming, harassment, or deceptive marketing practices.</li>
              <li>• Reverse engineer, copy, or resell the Service.</li>
              <li>• Attempt to gain unauthorized access to our systems or data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. User Responsibility for Compliance</h2>
            <ul className="space-y-3 text-slate-700">
              <li>• You represent and warrant that you have obtained all necessary rights, permissions, and consents to contact the individuals in your uploaded lists.</li>
              <li>• OptiLeads does not verify or scrub your lists against the DNC registry or other compliance databases unless expressly stated.</li>
              <li>• You acknowledge and agree that you are the caller of record for compliance purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Intellectual Property</h2>
            <ul className="space-y-3 text-slate-700">
              <li>• All content, trademarks, logos, and software associated with OptiLeads are the property of OptiLeads and are protected by intellectual property laws.</li>
              <li>• You are granted a limited, non-exclusive, non-transferable license to use the Service for your business purposes. You may not reproduce, distribute, or create derivative works without our prior written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Payments and Subscriptions</h2>
            <ul className="space-y-3 text-slate-700">
              <li>• Certain features may require a paid subscription.</li>
              <li>• By subscribing, you agree to pay all fees associated with your plan.</li>
              <li>• Fees are non-refundable unless otherwise stated in writing.</li>
              <li>• We reserve the right to change pricing and will provide advance notice of any changes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Data and Privacy</h2>
            <p className="text-slate-700">
              Your use of the Service is also governed by our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>. By using OptiLeads, you consent to the collection and use of information as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Third-Party Services</h2>
            <p className="text-slate-700">
              The Service may integrate with third-party services (e.g., payment processors, communication APIs, CRM tools). We are not responsible for the content, policies, or actions of third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Disclaimers</h2>
            <ul className="space-y-3 text-slate-700">
              <li>• The Service is provided "as is" and "as available" without warranties of any kind.</li>
              <li>• We do not guarantee that the Service will be uninterrupted, error-free, or free of harmful components.</li>
              <li>• We make no warranty as to the accuracy, legality, or compliance of any lead lists or contact data uploaded by users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Limitation of Liability</h2>
            <div className="text-slate-700 space-y-3">
              <p>To the fullest extent permitted by law:</p>
              <ul className="space-y-2 ml-4">
                <li>• OptiLeads and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits or data, arising out of or related to your use of the Service.</li>
                <li>• OptiLeads shall not be liable for any regulatory fines, penalties, or legal fees arising from your violation of telemarketing, privacy, or consumer protection laws.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Indemnification</h2>
            <p className="text-slate-700 mb-3">
              You agree to indemnify, defend, and hold harmless OptiLeads, its officers, employees, and affiliates from and against any claims, damages, fines, penalties, liabilities, or expenses (including reasonable attorneys' fees) arising out of:
            </p>
            <ul className="space-y-2 text-slate-700 ml-4">
              <li>• Your violation of these Terms.</li>
              <li>• Your use of the Service in violation of TCPA, DNC, or other telemarketing laws.</li>
              <li>• Any disputes or claims made by individuals you contact using the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Termination</h2>
            <ul className="space-y-3 text-slate-700">
              <li>• We may suspend or terminate your account if you violate these Terms.</li>
              <li>• Upon termination, your right to use the Service will cease immediately. Provisions relating to intellectual property, compliance, limitation of liability, and indemnification shall survive termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Governing Law</h2>
            <p className="text-slate-700">
              These Terms are governed by and construed under the laws of the United States and the State of Utah, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">14. Changes to These Terms</h2>
            <p className="text-slate-700">
              We may update these Terms at any time. If we make significant changes, we will notify you via the Service or email. Continued use of the Service constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">15. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have questions about these Terms, contact us at:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-slate-700 font-medium">OptiLeads</p>
              <p className="text-slate-700">Email: <a href="mailto:nkane1234@gmail.com" className="text-blue-600 hover:underline">nkane1234@gmail.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditionsContent;
