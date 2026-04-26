/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: 'googleai/gemini-2.5-flash',
});
