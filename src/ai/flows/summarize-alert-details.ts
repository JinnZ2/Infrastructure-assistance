'use server';
/**
 * @fileOverview A Genkit flow that summarizes complex infrastructure alert descriptions.
 *
 * - summarizeAlertDetails - A function that handles the alert summarization process.
 * - SummarizeAlertDetailsInput - The input type for the summarizeAlertDetails function.
 * - SummarizeAlertDetailsOutput - The return type for the summarizeAlertDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAlertDetailsInputSchema = z.object({
  alertDescription: z
    .string()
    .describe('The detailed and potentially complex description of an infrastructure alert.'),
});
export type SummarizeAlertDetailsInput = z.infer<typeof SummarizeAlertDetailsInputSchema>;

const SummarizeAlertDetailsOutputSchema = z.object({
  summary: z.string().describe('A concise and easy-to-understand summary of the alert description.'),
});
export type SummarizeAlertDetailsOutput = z.infer<typeof SummarizeAlertDetailsOutputSchema>;

export async function summarizeAlertDetails(
  input: SummarizeAlertDetailsInput
): Promise<SummarizeAlertDetailsOutput> {
  return summarizeAlertDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAlertDetailsPrompt',
  input: { schema: SummarizeAlertDetailsInputSchema },
  output: { schema: SummarizeAlertDetailsOutputSchema },
  prompt: `You are an AI assistant designed to summarize critical infrastructure alerts.
Your goal is to extract the most important information from the provided alert description and present it concisely.

Alert Description: {{{alertDescription}}}

Please provide a summary that is brief, clear, and highlights the key impact or action required.`,}
);

const summarizeAlertDetailsFlow = ai.defineFlow(
  {
    name: 'summarizeAlertDetailsFlow',
    inputSchema: SummarizeAlertDetailsInputSchema,
    outputSchema: SummarizeAlertDetailsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI model did not return a valid output.');
      }
      return output;
    } catch (error) {
      console.error('Error in summarizeAlertDetailsFlow:', error);
      // Re-throw the error to ensure the caller knows the operation failed.
      throw error;
    }
  }
);
