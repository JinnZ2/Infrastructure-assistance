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
- **Path alias**: `@/` maps to `src/`

## Code Conventions

- All custom components use `"use client"` directive
- AI flow files use `"use server"` directive
- Styling: Tailwind CSS utility classes, `cn()` helper from `@/lib/utils`
- Types: defined in `src/lib/types.ts`
- State: React hooks (useState, useMemo) - no external state management
- Formatting: follow existing patterns (no Prettier config, use ESLint)

## Key Files

- `src/app/page.tsx` - Main dashboard (InfraGuardDashboard component)
- `src/ai/genkit.ts` - Genkit singleton initialization
- `src/ai/flows/summarize-alert-details.ts` - AI summarization flow
- `src/lib/mock-data.ts` - Demo data (MOCK_ALERTS, REGIONS)
- `src/lib/types.ts` - TypeScript interfaces (InfrastructureAlert, RegionFocus)
- `docs/blueprint.md` - Design specification and style guidelines

## Adding New AI Flows

1. Create a new file in `src/ai/flows/`
2. Add `'use server'` at the top
3. Import `ai` from `@/ai/genkit`
4. Define input/output schemas with Zod (`z` from `genkit`)
5. Create the flow with `ai.defineFlow()`
6. Import the flow in `src/ai/dev.ts`

## Adding New UI Components

- Use `npx shadcn@latest add <component>` for shadcn/ui components
- Custom components go in `src/components/dashboard/`
- Follow existing patterns: typed props interface, `cn()` for conditional classes

## Environment Variables

- `GOOGLE_GENAI_API_KEY` - Required for AI summarization features
- See `.env.example` for the full list

## Known Issues

- `next.config.ts` has `ignoreBuildErrors` and `ignoreDuringBuilds` flags (should be removed once type/lint errors are resolved)
- Mock data only - no live API integrations
- No test suite exists yet
- Package name in `package.json` is "nextn" (placeholder from scaffolding)
