# CLAUDE.md

Development guide for Claude Code working on the InfraGuard project.

## Build & Run Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run genkit:dev   # Genkit dev UI with flows
npm run genkit:watch # Genkit with file watching
```

## Project Architecture

- **Next.js 15 App Router** with React 19 and TypeScript
- **Genkit AI** for LLM flows (Google Gemini 2.5 Flash)
- **shadcn/ui** components in `src/components/ui/` (do not manually edit these)
- **Custom components** in `src/components/dashboard/`
- **AI flows** in `src/ai/flows/` (must use `'use server'` directive)
- **Data service** in `src/lib/alert-service.ts` (abstraction over data sources)
- **API routes** in `src/app/api/` (REST endpoints)
- **Path alias**: `@/` maps to `src/`

## Code Conventions

- All custom components use `"use client"` directive
- AI flow files use `"use server"` directive
- Styling: Tailwind CSS utility classes, `cn()` helper from `@/lib/utils`
- Types: defined in `src/lib/types.ts`
- State: React hooks (useState, useMemo, useCallback) - no external state management
- Formatting: follow existing patterns (no Prettier config, use ESLint)
- Accessibility: all interactive elements must have `aria-label` attributes
- Error handling: show user-facing error messages, not just console.error

## Key Files

- `src/app/page.tsx` - Main dashboard (InfraGuardDashboard component)
- `src/app/error.tsx` - Route-level error boundary
- `src/app/loading.tsx` - Route-level loading skeleton
- `src/app/api/alerts/route.ts` - Alert data API endpoint
- `src/ai/genkit.ts` - Genkit singleton initialization
- `src/ai/flows/summarize-alert-details.ts` - AI summarization flow
- `src/ai/flows/triage-alert.ts` - AI triage flow (risk assessment + actions)
- `src/lib/alert-service.ts` - Data fetching and filtering service
- `src/lib/mock-data.ts` - Demo data (MOCK_ALERTS, REGIONS)
- `src/lib/types.ts` - TypeScript interfaces (InfrastructureAlert, RegionFocus)
- `docs/blueprint.md` - Design specification and style guidelines

## Adding New AI Flows

1. Create a new file in `src/ai/flows/`
2. Add `'use server'` at the top
3. Import `ai` from `@/ai/genkit`
4. Define input/output schemas with Zod (`z` from `genkit`)
5. Create the flow with `ai.defineFlow()`
6. Export both the function and its types
7. Import the flow in `src/ai/dev.ts`

## Adding New UI Components

- Use `npx shadcn@latest add <component>` for shadcn/ui components
- Custom components go in `src/components/dashboard/`
- Follow existing patterns: typed props interface, `cn()` for conditional classes

## Adding New Data Sources

1. Add a fetcher function in `src/lib/alert-service.ts`
2. Normalize the response to `InfrastructureAlert` type
3. Add the source to the `AlertSource` union in `src/lib/types.ts`
4. The API route at `src/app/api/alerts/route.ts` will automatically serve the data

## Environment Variables

- `GOOGLE_GENAI_API_KEY` - Required for AI summarization and triage features
- See `.env.example` for the full list

## Known Limitations

- Mock data only (no live API integrations yet) — swap `fetchAlerts()` in alert-service.ts
- No test suite exists yet
- Map is a stylized mock (no real mapping library)
- No authentication or persistent storage
