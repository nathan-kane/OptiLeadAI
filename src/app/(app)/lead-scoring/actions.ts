// src/app/(app)/lead-scoring/actions.ts
"use server";

import { aiLeadScoring, type AiLeadScoringInput, type AiLeadScoringOutput } from "@/ai/flows/ai-lead-scoring";
import { z } from "zod";

const LeadScoringFormSchema = z.object({
  leadData: z.string().min(10, "Lead data must be at least 10 characters."),
  scoringRules: z.string().min(10, "Scoring rules must be at least 10 characters."),
  dataValidationResults: z.string().optional(),
});

export type LeadScoringFormState = {
  message?: string;
  fields?: Record<string, string>;
  issues?: string[];
  result?: AiLeadScoringOutput;
};

export async function calculateScoreAction(
  prevState: LeadScoringFormState | undefined,
  data: FormData
): Promise<LeadScoringFormState> {
  const formData = Object.fromEntries(data);
  const parsed = LeadScoringFormSchema.safeParse(formData);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return {
      message: "Invalid form data",
      issues: issues,
      fields: formData as Record<string, string>,
    };
  }

  try {
    const aiInput: AiLeadScoringInput = {
      leadData: parsed.data.leadData,
      scoringRules: parsed.data.scoringRules,
      dataValidationResults: parsed.data.dataValidationResults,
    };
    const result = await aiLeadScoring(aiInput);
    return { message: "Score calculated successfully!", result };
  } catch (error) {
    console.error("AI Lead Scoring Error:", error);
    return {
      message: "Failed to calculate score. " + (error instanceof Error ? error.message : String(error)),
      fields: formData as Record<string, string>,
    };
  }
}
