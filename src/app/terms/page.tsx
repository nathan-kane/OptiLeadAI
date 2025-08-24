import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import TermsAndConditionsContent from './terms-content';

export default function TermsAndConditions() {

  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">Loading...</div>}>
      <TermsAndConditionsContent />
    </Suspense>
  );
}
