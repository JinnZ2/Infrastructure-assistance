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
- **Data service** in `src/lib/alert-service.ts` (cache + source orchestration, server-only)
- **Source integrations** in `src/lib/sources/` (one module per upstream feed)
- **API routes** in `src/app/api/` (REST endpoints)
- **Path alias**: `@/` maps to `src/`

### Server/client boundary

`alert-service.ts` imports `alert-cache.ts`, which uses `fs`. It must never be
imported from a client component or the build fails with `Can't resolve 'fs'`.
Pure helpers the dashboard needs live in `src/lib/alert-filters.ts` instead —
put new client-safe helpers there, not in the service.

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
- `src/lib/alert-service.ts` - Cache + source orchestration (server-only)
- `src/lib/alert-filters.ts` - Client-safe alert filtering
- `src/lib/alert-cache.ts` - 30-minute TTL cache with disk persistence
- `src/lib/sources/index.ts` - Concurrent fetch/merge across enabled sources
- `src/lib/sources/config.ts` - Env-driven source configuration
- `src/lib/mock-data.ts` - Demo data (MOCK_ALERTS, REGIONS)
- `src/lib/types.ts` - TypeScript interfaces (InfrastructureAlert, SourceStatus)
- `docs/blueprint.md` - Design specification and style guidelines
- `docs/FALSIFICATION_LOG.md` - Claims already tested, what falsified them, and
  the open unknowns. **Read this before assuming an integration is verified** —
  it records which assumptions have been run and which have not.
- `legacy/README.md` - Retired artifacts kept with the bounds they held under

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

1. Add the source to the `AlertSource` union in `src/lib/types.ts`
2. Create `src/lib/sources/<source>.ts` exporting two things:
   - a pure `normalize<Source>(raw)` that maps the upstream payload to
     `InfrastructureAlert[]` (keep it pure — it is the testable part), and
   - an async `fetch<Source>()` that calls the API via `fetchJson`/`fetchText`
     from `./http` and hands the result to the normalizer
3. Register the fetcher in the `FETCHERS` map in `src/lib/sources/index.ts`
4. If it needs credentials or an endpoint, add a config reader in
   `src/lib/sources/config.ts` and document the variables in `.env.example`
5. The API route serves the merged result automatically

Conventions for source modules:

- Never invent thresholds or severities — map from what the feed publishes, and
  if a judgement needs a threshold, read it from the upstream data (see how
  `usgs.ts` joins WaterWatch flood stages)
- Prefer an authoritative state field from the feed; fall back to
  `stateForPoint()` only when the feed gives coordinates alone
- Throw on failure rather than returning `[]` — the aggregator isolates each
  source and reports the error through `SourceStatus`

## Environment Variables

- `GOOGLE_GENAI_API_KEY` - Required for AI summarization and triage features
- `ALERT_SOURCES` - Which feeds to query (default `NOAA,USGS`)
- `ALERTS_USE_MOCK` - Set `true` to serve `mock-data.ts` offline
- See `.env.example` for the full list

## Retiring Code

Superseded code goes to `legacy/`, not to `git rm`. Add an entry to
`legacy/README.md` recording what it claimed, the bounds under which that held,
the commit that ended it, and what precedent still carries. `legacy/` stays
inside the `tsconfig.json` include so retired code keeps typechecking — if it
stops compiling, that is a result to read, not a warning to silence.

When a test falsifies an assumption, append an entry to
`docs/FALSIFICATION_LOG.md` rather than silently fixing the code. Compute
expected values independently of the implementation — every bug caught so far
produced *plausible* output that a snapshot of existing behavior would have
enshrined.

## Known Limitations

- No test suite exists yet
- No authentication or persistent storage
- Point-to-state inference uses bounding boxes; border cases may mis-attribute
- Open511, FIRMS, and NBI stay disabled until their configuration is supplied
