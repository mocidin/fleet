import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { authenticateApiRoute } from '@/lib/utils/apiAuth';

export const runtime = 'nodejs';
export const maxDuration = 800;

const PRIMARY = '#0284C7';

// EPHEMERAL: logo creator. "Keep this one for now" writes the chosen mark into app/icon.svg on Dom's machine,
// so the favicon, apple icon, Open Graph and Twitter images (all rendered from icon.svg at request time)
// follow the trial brand until it is baked or reverted. Development only, never on Vercel.
export async function PUT(req: Request) {
  if (process.env.NODE_ENV !== 'development') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const auth = await authenticateApiRoute(req);
  if (auth instanceof Response) return auth;
  const body = (await req.json().catch(() => null)) as { viewBox?: string; d?: string; stroke?: number; rule?: string; primary?: string } | null;
  if (!body?.d || !body.viewBox) return NextResponse.json({ error: 'viewBox and d are required' }, { status: 400 });
  const primary = /^#[0-9a-fA-F]{6}$/.test(body.primary ?? '') ? body.primary! : PRIMARY;
  const paint = body.stroke
    ? `fill="none" stroke="${primary}" stroke-width="${body.stroke}" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${primary}"${body.rule ? ` fill-rule="${body.rule}" clip-rule="${body.rule}"` : ''}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="${body.viewBox}" fill="none"><path ${paint} d="${body.d}"/></svg>\n`;
  await fs.writeFile(path.join(process.cwd(), 'app', 'icon.svg'), svg, 'utf8');
  console.log('[lab keep] app/icon.svg rewritten with the trial mark');
  return NextResponse.json({ ok: true });
}
