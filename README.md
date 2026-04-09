# InfraGuard

Real-time infrastructure alert aggregation, visualization, and AI-powered summarization for the Upper Midwest region.

## Overview

InfraGuard is a Next.js dashboard that collects infrastructure alerts from multiple sources (NOAA, Open511, USGS, NBI, FIRMS) and presents them on an interactive map with a filterable alert feed. It uses Genkit with Google Gemini to generate concise AI summaries of complex alert descriptions.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, standalone output) |
| UI | React 19, Tailwind CSS 3, shadcn/ui (Radix primitives) |
| AI | Genkit 1.28 + Google GenAI plugin (Gemini 2.5 Flash) |
| Backend | Firebase App Hosting |
| Language | TypeScript 5 |
| Icons | Lucide React |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

## Project Structure

```
src/
├── ai/                         # Genkit AI integration
│   ├── genkit.ts               # Genkit initialization & config
│   ├── dev.ts                  # Development entry point for flows
│   └── flows/
│       └── summarize-alert-details.ts  # Alert summarization flow
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Inter font, metadata)
│   ├── page.tsx                # Main InfraGuard dashboard
│   ├── globals.css             # CSS variables, theme, animations
│   └── favicon.ico
├── components/
│   ├── dashboard/              # Custom dashboard components
│   │   ├── AlertCard.tsx       # Alert card in sidebar feed
│   │   ├── AlertDetailPanel.tsx # Detail view with AI summary
│   │   └── MapMock.tsx         # Interactive map visualization
│   └── ui/                     # shadcn/ui component library
├── hooks/
│   ├── use-mobile.tsx          # Responsive breakpoint hook
│   └── use-toast.ts            # Toast notification state
└── lib/
    ├── types.ts                # TypeScript interfaces
    ├── mock-data.ts            # Demo alerts & region definitions
    ├── utils.ts                # cn() utility (clsx + tailwind-merge)
    └── placeholder-images.*    # Placeholder image URLs
docs/
└── blueprint.md                # Design specification
```

## Prerequisites

- Node.js 18+
- npm
- A Google GenAI API key (for AI summarization)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required values (see `.env.example`).

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Run the Genkit dev UI (optional):**
   ```bash
   npm run genkit:dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run genkit:dev` | Start Genkit development UI |
| `npm run genkit:watch` | Start Genkit with file watching |

## Features

- **Alert Feed** - Searchable, filterable sidebar with real-time alert cards
- **Map Visualization** - Interactive map with color-coded severity markers and pulse animations for critical alerts
- **AI Summarization** - One-click Gemini-powered summaries of complex alert descriptions
- **Responsive Layout** - Collapsible sidebar, desktop detail panel, mobile overlay modal
- **Region Filtering** - Filter alerts by Upper Midwest states (MN, WI, MI, IA, IL, ND, SD)

## Deployment

Configured for Firebase App Hosting via `apphosting.yaml`. The app builds as a standalone Next.js output.

## Current Limitations

- Uses mock data (no live API integrations yet)
- No authentication or authorization
- No persistent database for alert history
- No automated tests
- Map is a stylized mock (no real mapping library)

## License

Private
