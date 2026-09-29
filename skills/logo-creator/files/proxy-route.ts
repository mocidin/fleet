import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

// EPHEMERAL: Logo Creator dev proxy. Forwards the panel's saved-combo reads and writes to the hub's
// /api/lab with the HYPERTHEORY bearer, so the token never reaches the browser. Development only.
const HUB = process.env.HUB_URL || 'http://localhost:3000';

async function forward(req: Request, method: 'GET' | 'PUT') {
  if (process.env.NODE_ENV !== 'development') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!process.env.HYPERTHEORY) return NextResponse.json({ error: 'HYPERTHEORY is not set' }, { status: 500 });
  const url = new URL(req.url);
  try {
    const res = await fetch(`${HUB}/api/lab${url.search}`, {
      method,
      headers: { authorization: `Bearer ${process.env.HYPERTHEORY}`, 'content-type': 'application/json' },
      body: method === 'PUT' ? await req.text() : undefined,
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  } catch (e) {
    console.error('[lab proxy] hub unreachable:', e);
    return NextResponse.json({ error: 'hub unreachable' }, { status: 502 });
  }
}

export const GET = (req: Request) => forward(req, 'GET');
export const PUT = (req: Request) => forward(req, 'PUT');
