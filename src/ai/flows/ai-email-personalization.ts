// src/ai/flows/ai-email-personalization.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized content snippets for lead nurturing emails.
 *
 * - generatePersonalizedEmailSnippet - A function that takes lead data as input and returns a personalized email snippet.
 * - GeneratePersonalizedEmailSnippetInput - The input type for the generatePersonalizedEmailSnippet function.
 * - GeneratePersonalizedEmailSnippetOutput - The return type for the generatePersonalizedEmailSnippet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedEmailSnippetInputSchema = z.object({
  leadName: z.string().describe('The name of the lead.'),
  leadCompany: z.string().describe('The company the lead works for.'),
  leadIndustry: z.string().describe('The industry the lead is in.'),
  leadJobTitle: z.string().describe('The job title of the lead.'),
  leadWebsiteEngagement: z
    .string()
    .describe(
      'A description of the lead website engagement, including pages visited and content consumed.'
    ),
  companyValueProposition: z
    .string()
    .describe('The value proposition of our company.'),
});
export type GeneratePersonalizedEmailSnippetInput = z.infer<
  typeof GeneratePersonalizedEmailSnippetInputSchema
>;

const GeneratePersonalizedEmailSnippetOutputSchema = z.object({
  emailSnippet: z
    .string()
    .describe(
      'A personalized content snippet for a lead nurturing email, tailored to the lead data.'
    ),
});
export type GeneratePersonalizedEmailSnippetOutput = z.infer<
  typeof GeneratePersonalizedEmailSnippetOutputSchema
>;

export async function generatePersonalizedEmailSnippet(
  input: GeneratePersonalizedEmailSnippetInput
): Promise<GeneratePersonalizedEmailSnippetOutput> {
  return generatePersonalizedEmailSnippetFlow(input);
}

const generatePersonalizedEmailSnippetPrompt = ai.definePrompt({
  name: 'generatePersonalizedEmailSnippetPrompt',
  input: {schema: GeneratePersonalizedEmailSnippetInputSchema},
  output: {schema: GeneratePersonalizedEmailSnippetOutputSchema},
  prompt: `You are an AI assistant specialized in creating personalized email snippets for lead nurturing.

  Based on the following lead data and our company's value proposition, generate a short, engaging email snippet that will resonate with the lead and encourage them to learn more about our product.

  Lead Name: {{{leadName}}}
  Lead Company: {{{leadCompany}}}
  Lead Industry: {{{leadIndustry}}}
  Lead Job Title: {{{leadJobTitle}}}
  Lead Website Engagement: {{{leadWebsiteEngagement}}}
  Company Value Proposition: {{{companyValueProposition}}}

  Email Snippet:`,
});

const generatePersonalizedEmailSnippetFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedEmailSnippetFlow',
    inputSchema: GeneratePersonalizedEmailSnippetInputSchema,
    outputSchema: GeneratePersonalizedEmailSnippetOutputSchema,
  },
  async input => {
    const {output} = await generatePersonalizedEmailSnippetPrompt(input);
    return output!;
  }
);
