import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import PrivacyPolicyContent from './privacy-content';

export default function PrivacyPolicy() {

  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">Loading...</div>}>
      <PrivacyPolicyContent />
    </Suspense>
  );
}
