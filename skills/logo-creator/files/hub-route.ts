import { NextResponse } from 'next/server';
import { authenticateApiRoute } from '@/lib/utils/apiAuth';
import { hypertheoryDb } from '@/lib/supabase/hypertheory';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Logo Creator storage (the dev-only logo, font and color picker each fleet app can mount). One row per
// brand in the hub's `lab` table: `saved` is the bookmarked combos, `current` is the combo chosen as the
// brand, which the hub's own AppBadge renders live. The apps reach this through their own dev proxy with
// the HYPERTHEORY bearer, so the source of truth outlives any browser's localStorage.
export async function GET(req: Request) {
  const auth = await authenticateApiRoute(req);
  if (auth instanceof Response) return auth;
  if (!auth.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const brand = new URL(req.url).searchParams.get('brand');
  if (!brand) return NextResponse.json({ error: 'brand is required' }, { status: 400 });
  const db = await hypertheoryDb();
  const { data, error } = await db.from('lab').select('saved, current').eq('brand', brand).maybeSingle();
  if (error) {
    console.error('[lab] read failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ saved: data?.saved ?? [], current: data?.current ?? null });
}

export async function PUT(req: Request) {
  const auth = await authenticateApiRoute(req);
  if (auth instanceof Response) return auth;
  if (!auth.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { brand?: string; saved?: unknown[]; current?: unknown; clear?: boolean } | null;
  if (!body?.brand) return NextResponse.json({ error: 'brand is required' }, { status: 400 });
  const row: Record<string, unknown> = { brand: body.brand, updated: new Date().toISOString() };
  if (Array.isArray(body.saved)) {
    // An empty list only lands when the caller says so: a stray script or test must never wipe a brand's combos.
    if (body.saved.length === 0 && !body.clear) return NextResponse.json({ error: 'refusing to clear without clear: true' }, { status: 409 });
    row.saved = body.saved;
  }
  if ('current' in body) row.current = body.current ?? null;
  if (!('saved' in row) && !('current' in row)) return NextResponse.json({ error: 'saved or current is required' }, { status: 400 });
  const db = await hypertheoryDb();
  // Upsert only the columns sent, so a saved-list write never touches current and vice versa.
  const { error } = await db.from('lab').upsert(row, { onConflict: 'brand' });
  if (error) {
    console.error('[lab] write failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
