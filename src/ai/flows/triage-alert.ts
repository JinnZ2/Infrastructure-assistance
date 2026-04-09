'use server';
/**
 * @fileOverview AI triage flow that analyzes an infrastructure alert and
 * returns a severity assessment with recommended response actions.
 *
 * - triageAlert - Analyzes an alert and returns prioritized actions.
 * - TriageAlertInput - Input type.
 * - TriageAlertOutput - Output type with assessment and actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TriageAlertInputSchema = z.object({
  title: z.string().describe('The alert title.'),
  description: z.string().describe('The full alert description.'),
  severity: z.string().describe('Current severity level: Critical, Warning, or Info.'),
  category: z.string().describe('Alert category: Weather, Bridge, Wildfire, Road, Flood, Rail, or Pipeline.'),
  locationName: z.string().optional().describe('Human-readable location name.'),
});
export type TriageAlertInput = z.infer<typeof TriageAlertInputSchema>;

const TriageAlertOutputSchema = z.object({
  assessment: z.string().describe('A 1-2 sentence risk assessment of the alert.'),
  impactLevel: z.enum(['low', 'moderate', 'high', 'critical']).describe('Assessed impact level.'),
  actions: z.array(z.object({
    label: z.string().describe('Short action label (imperative verb phrase).'),
    priority: z.enum(['immediate', 'soon', 'monitor']).describe('Action urgency.'),
  })).describe('Recommended response actions, ordered by priority.'),
  affectedSystems: z.array(z.string()).describe('Infrastructure systems likely affected.'),
});
export type TriageAlertOutput = z.infer<typeof TriageAlertOutputSchema>;

export async function triageAlert(input: TriageAlertInput): Promise<TriageAlertOutput> {
  return triageAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'triageAlertPrompt',
  input: { schema: TriageAlertInputSchema },
  output: { schema: TriageAlertOutputSchema },
  prompt: `You are an infrastructure incident response analyst. Analyze the following alert and provide a triage assessment.

Title: {{{title}}}
Category: {{{category}}}
Severity: {{{severity}}}
Location: {{{locationName}}}
Description: {{{description}}}

Provide:
1. A concise risk assessment (1-2 sentences).
2. An impact level (low/moderate/high/critical) based on the actual content, not just the stated severity.
3. 3-5 specific, actionable response steps ordered by priority (immediate, soon, or monitor).
4. A list of infrastructure systems likely affected (e.g., "highway traffic", "residential power", "emergency services").

Be practical and specific to the alert type and location.`,
});

const triageAlertFlow = ai.defineFlow(
  {
    name: 'triageAlertFlow',
    inputSchema: TriageAlertInputSchema,
    outputSchema: TriageAlertOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid triage output.');
    }
    return output;
  }
);
