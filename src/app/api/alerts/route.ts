/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAlerts, refreshAlerts, cacheStatus, sourceStatuses } from '@/lib/alert-service';

// Upstream feeds are polled on the service's own 30-minute cache, so this route
// must not be statically prerendered at build time.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

  try {
    const alerts = forceRefresh ? await refreshAlerts() : await fetchAlerts();
    const status = cacheStatus();
    const sources = sourceStatuses();
    const degraded = sources.some(source => !source.ok);

    return NextResponse.json(
      { alerts, cache: status, sources, degraded },
      {
        headers: {
          // Allow browsers/CDNs to serve the cached response for 30 minutes,
          // and serve stale data for up to 1 hour while revalidating in the background.
          // A degraded result is held only briefly so recovery shows up quickly.
          'Cache-Control': degraded
            ? 'public, max-age=60, stale-while-revalidate=1800'
            : 'public, max-age=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    // Reached only when every source failed AND no cached data exists
    // (memory or disk) to fall back on.
    console.error('[api/alerts] Unable to serve alerts:', error);
    return NextResponse.json(
      {
        alerts: [],
        cache: cacheStatus(),
        sources: sourceStatuses(),
        degraded: true,
        error: 'Alert sources are unavailable and no cached data exists yet. Please try again shortly.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
