/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-alert-details.ts';
import '@/ai/flows/triage-alert.ts';