'use server';

/**
 * @fileOverview A lead scoring AI agent.
 *
 * - aiLeadScoring - A function that handles the lead scoring process.
 * - AiLeadScoringInput - The input type for the aiLeadScoring function.
 * - AiLeadScoringOutput - The return type for the aiLeadScoring function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiLeadScoringInputSchema = z.object({
  leadData: z
    .string()
    .describe('Data about the lead, including details like industry, company size, job title, and website engagement.'),
  scoringRules: z
    .string()
    .describe('The rules to use for scoring the lead, defined by the user.'),
  dataValidationResults: z
    .string()
    .optional()
    .describe('Results from data validation checks on the lead data, if available.'),
});
export type AiLeadScoringInput = z.infer<typeof AiLeadScoringInputSchema>;

const AiLeadScoringOutputSchema = z.object({
  leadScore: z.number().describe('The calculated score for the lead.'),
  priority: z.string().describe('The priority of the lead (e.g., High, Medium, Low) based on the score.'),
  rationale: z.string().describe('Explanation of why the lead received the score it did.'),
});
export type AiLeadScoringOutput = z.infer<typeof AiLeadScoringOutputSchema>;

export async function aiLeadScoring(input: AiLeadScoringInput): Promise<AiLeadScoringOutput> {
  return aiLeadScoringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiLeadScoringPrompt',
  input: {schema: AiLeadScoringInputSchema},
  output: {schema: AiLeadScoringOutputSchema},
  prompt: `You are an AI assistant that scores leads based on provided data and scoring rules.

  Here's the lead data:
  {{leadData}}

  Here are the scoring rules defined by the user:
  {{scoringRules}}

  Here are the results from data validation checks (if available):
  {{#if dataValidationResults}}
  {{dataValidationResults}}
  {{else}}
  No data validation results provided.
  {{/if}}

  Based on this information, calculate a lead score, determine the lead's priority, and provide a rationale for the score.
  Follow this format:
  \nleadScore: <calculated_score>\npriority: <priority_level>\nrationale: <score_rationale>`,
});

const aiLeadScoringFlow = ai.defineFlow(
  {
    name: 'aiLeadScoringFlow',
    inputSchema: AiLeadScoringInputSchema,
    outputSchema: AiLeadScoringOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    // Parse the output to extract leadScore, priority, and rationale
    const leadScoreMatch = output!.text.match(/leadScore: (.+)/);
    const priorityMatch = output!.text.match(/priority: (.+)/);
    const rationaleMatch = output!.text.match(/rationale: (.+)/);

    const leadScore = leadScoreMatch ? parseFloat(leadScoreMatch[1]) : 0;
    const priority = priorityMatch ? priorityMatch[1].trim() : 'Low';
    const rationale = rationaleMatch ? rationaleMatch[1].trim() : 'No rationale provided.';

    return {
      leadScore: leadScore,
      priority: priority,
      rationale: rationale,
    };
  }
);
