
'use server';

import { getAdminApp } from '@/lib/firebase/admin';
import type { Lead } from '@/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const AddLeadFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(), // Make phone number required
  phone: z.string().optional(),
});

export type AddLeadFormState = {
  message?: string;
  fields?: Record<string, string>;
  issues?: string[];
  success?: boolean;
};

export async function addLeadAction(
  prevState: AddLeadFormState | undefined,
  data: FormData
): Promise<AddLeadFormState> {
  const formData = Object.fromEntries(data);
  const parsed = AddLeadFormSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      message: 'Invalid form data.',
      issues: parsed.error.issues.map((issue) => issue.message),
      fields: formData as Record<string, string>,
      success: false,
    };
  }

  try {
    const adminApp = getAdminApp();
    const firestore = adminApp.firestore();

    const newLead: Omit<Lead, 'id'> = {
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      jobTitle: parsed.data.jobTitle || '',
      industry: parsed.data.industry || '',
      phone: parsed.data.phone || '', // Ensure phone is included
      score: 0, // Initial score, can be updated by AI later
      priority: 'Low',
      status: 'New',
      lastInteraction: new Date().toISOString().split('T')[0],
      dataValidationStatus: 'Unverified',
    };

    await firestore.collection('leads').add(newLead);

    // Revalidate the dashboard path to show the new lead
    revalidatePath('/dashboard');

    return {
      message: `Lead "${parsed.data.name}" added successfully.`,
      success: true,
    };
  } catch (error) {
    console.error('Error adding lead:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      message: `Failed to add lead: ${errorMessage}`,
      fields: formData as Record<string, string>,
      success: false,
    };
  }
}
