import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'LeadGen Pro',
    timestamp: new Date().toISOString(),
  });
}
