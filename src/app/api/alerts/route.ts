import { NextResponse } from 'next/server';
import { fetchAlerts } from '@/lib/alert-service';

export async function GET() {
  const alerts = await fetchAlerts();
  return NextResponse.json(alerts);
}
