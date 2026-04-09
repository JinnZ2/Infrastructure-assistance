import { NextRequest, NextResponse } from 'next/server';
import { fetchAlerts, refreshAlerts, cacheStatus } from '@/lib/alert-service';

export async function GET(request: NextRequest) {
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

  const alerts = forceRefresh ? await refreshAlerts() : await fetchAlerts();
  const status = cacheStatus();

  return NextResponse.json(
    { alerts, cache: status },
    {
      headers: {
        // Allow browsers/CDNs to serve the cached response for 30 minutes,
        // and serve stale data for up to 1 hour while revalidating in the background.
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      },
    }
  );
}
