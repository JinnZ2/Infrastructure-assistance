/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
