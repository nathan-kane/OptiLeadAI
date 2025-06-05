// src/app/(app)/email-personalization/actions.ts
"use server";

import { generatePersonalizedEmailSnippet, type GeneratePersonalizedEmailSnippetInput, type GeneratePersonalizedEmailSnippetOutput } from "@/ai/flows/ai-email-personalization";
import { z } from "zod";

const EmailPersonalizationFormSchema = z.object({
  leadName: z.string().min(1, "Lead name is required."),
  leadCompany: z.string().min(1, "Lead company is required."),
  leadIndustry: z.string().min(1, "Lead industry is required."),
  leadJobTitle: z.string().min(1, "Lead job title is required."),
  leadWebsiteEngagement: z.string().min(10, "Website engagement details must be at least 10 characters."),
  companyValueProposition: z.string().min(10, "Company value proposition must be at least 10 characters."),
});

export type EmailPersonalizationFormState = {
  message?: string;
  fields?: Record<string, string>;
  issues?: string[];
  result?: GeneratePersonalizedEmailSnippetOutput;
};

export async function generateSnippetAction(
  prevState: EmailPersonalizationFormState | undefined,
  data: FormData
): Promise<EmailPersonalizationFormState> {
  const formData = Object.fromEntries(data);
  const parsed = EmailPersonalizationFormSchema.safeParse(formData);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return {
      message: "Invalid form data",
      issues: issues,
      fields: formData as Record<string, string>,
    };
  }

  try {
    const aiInput: GeneratePersonalizedEmailSnippetInput = {
      leadName: parsed.data.leadName,
      leadCompany: parsed.data.leadCompany,
      leadIndustry: parsed.data.leadIndustry,
      leadJobTitle: parsed.data.leadJobTitle,
      leadWebsiteEngagement: parsed.data.leadWebsiteEngagement,
      companyValueProposition: parsed.data.companyValueProposition,
    };
    const result = await generatePersonalizedEmailSnippet(aiInput);
    return { message: "Email snippet generated successfully!", result };
  } catch (error) {
     console.error("AI Email Personalization Error:", error);
    return {
      message: "Failed to generate snippet. " + (error instanceof Error ? error.message : String(error)),
      fields: formData as Record<string, string>,
    };
  }
}
