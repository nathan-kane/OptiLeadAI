import { PageHeader } from '@/components/page-header';
import { EmailPersonalizationForm } from '@/components/email-personalization-form';

export default function EmailPersonalizationPage() {
  return (
    <>
      <PageHeader
        title="AI Email Personalization Tool"
        description="Generate tailored email snippets to boost engagement with your leads."
      />
      <EmailPersonalizationForm />
    </>
  );
}
