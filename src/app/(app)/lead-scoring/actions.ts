
// src/app/(app)/lead-scoring/actions.ts
"use server";

import { aiLeadScoring, type AiLeadScoringInput, type AiLeadScoringOutput } from "@/ai/flows/ai-lead-scoring";
import { getAdminApp } from "@/lib/firebase/admin";
import { ScoringRule } from "@/types";
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

const ScoringRuleSchema = z.object({
  attribute: z.string(),
  condition: z.string(),
  value: z.union([z.string(), z.number()]),
  weight: z.number(),
});

export async function addScoringRule(
  rule: z.infer<typeof ScoringRuleSchema>,
): Promise<{ id: string } | { error: string }> {
  const db = getAdminApp().firestore();
  const docRef = await db.collection("scoringRules").add(rule);
  return { id: docRef.id };
}

// Helper function to check for existing rules
// This is a simplified check and might need refinement based on your definition of a "duplicate"
export async function getScoringRules(): Promise<ScoringRule[]> {
  const db = getAdminApp().firestore();
  const snapshot = await db.collection('scoringRules').get();
  const rules: ScoringRule[] = [];
  snapshot.forEach(doc => {
    // We need to cast here as Firestore document data doesn't automatically include the id
    // and the value type might not be strictly enforced without explicit typing during addition
    rules.push({ id: doc.id, ...doc.data() } as ScoringRule);
  });
  return rules;
}

export async function addDefaultScoringRules(): Promise<void> {
  const defaultRules = [
    {
      attribute: "Intent & Readiness to Buy/Sell",
      condition: "equals",
      value: "Ready to Buy/Sell Now",
      weight: 20,
    },
    {
      attribute: "Intent & Readiness to Buy/Sell",
      condition: "equals",
      value: "Indicated 1–3 months timeline",
      weight: 15,
    },
    {
      attribute: "Intent & Readiness to Buy/Sell",
      condition: "equals",
      value: "Longer timeline (>6 months)",
      weight: 5,
    },
    {
      attribute: "Intent & Readiness to Buy/Sell",
      condition: "equals",
      value: "Requested a showing or appointment",
      weight: 25,
    },
    {
      attribute: "Intent & Readiness to Buy/Sell",
      condition: "equals",
      value: "Filled out Home Valuation form",
      weight: 20,
    },
    {
      attribute: "Budget and Financing",
      condition: "equals",
      value: "Stated budget within your target range",
      weight: 15,
    },
    {
      attribute: "Budget and Financing",
      condition: "equals",
      value: "Pre-approved for mortgage",
      weight: 20,
    },
    {
      attribute: "Budget and Financing",
      condition: "equals",
      value: "No budget or vague answers",
      weight: -5,
    },
    {
      attribute: "Property Preferences",
      condition: "equals",
      value: "Saved listings or created alerts",
      weight: 10,
    },
    {
      attribute: "Property Preferences",
      condition: "equals",
      value: "Looked at high-value listings",
      weight: 10,
    },
    {
      attribute: "Property Preferences",
      condition: "equals",
      value: "Narrow search area",
      weight: 10,
    },
    {
      attribute: "Property Preferences",
      condition: "equals",
      value: "Multiple property types selected",
      weight: -5,
    },
    // Add the rest of your default rules here following the same structure
  ];

  const existingRules = await getScoringRules();

  for (const defaultRule of defaultRules) {
    const exists = existingRules.some(
      (rule) =>
        rule.attribute === defaultRule.attribute &&
        rule.condition === defaultRule.condition &&
        rule.value === defaultRule.value &&
        rule.weight === defaultRule.weight
    );

    if (!exists) {
      await addScoringRule(defaultRule);
    }
  }
}

export async function deleteScoringRule(
  id: string,
): Promise<{ success: boolean } | { error: string }> {
  const db = getAdminApp().firestore();
  try {
    await db.collection("scoringRules").doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting scoring rule:", error);
    return { error: "Failed to delete scoring rule. " + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function updateScoringRule(
  id: string,
  rule: z.infer<typeof ScoringRuleSchema>,
): Promise<{ success: boolean } | { error: string }> {
  const db = getAdminApp().firestore();
  try {
    await db.collection("scoringRules").doc(id).update(rule);
    return { success: true };
  } catch (error) {
    console.error("Error updating scoring rule:", error);
    return { error: "Failed to update scoring rule. " + (error instanceof Error ? error.message : String(error)) };
  }
}
