import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: any = null;
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      try { body = JSON.parse(text); } catch { body = { raw: text }; }
    }
    // Best-effort logging
    console.log('[analytics] batch', Array.isArray(body?.events) ? body.events.length : 1);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.warn('[analytics] ingest error', e);
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
}


