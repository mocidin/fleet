// The fleet LinkedIn cover: one design, every app's colors. A halftone lattice in
// the Cognition grammar (rigid 8px lattice, blocky patchwork islands of dot tiers
// with ragged cell-by-cell borders, a discrete flat-top honeycomb on its own
// coarser pitch, one dense corner, faint panels, pinpoint texture everywhere, no
// text, no blur), with every tone derived from the app's --primary-rgb so the
// same file reads as that brand. Usage:
//   node linkedin-cover.mjs <app-key> [light|dark] [seed] [variant] [left]
// 'left' (mosaic) fades the tiles out across the left third for LinkedIn's photo.
// Variants layer extra detail on the same lattice: classic (the reference
// grammar), circuit (right-angle traces between dots, hollow ring dots), halftone
// (dot size sweeps with a smooth field), dual (two honeycombs at two scales plus a
// diamond lattice region), engineered (graph-paper hairlines, hollow hexes mixed
// with filled, sparse x-marks).
// Writes ~/Downloads/<app>-linkedin-cover-<theme>-<date>.png at LinkedIn's
// 1512x256 cover spec.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';
// The fleet checkout: the parent of the repo the command runs in, so the same
// script works on the laptop and in a cloud session.
const FLEET = process.env.FLEET_DIR ?? path.resolve(execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim(), '..');
const sharp = createRequire(path.join(FLEET, 'hypertheory', 'package.json'))('sharp');
const [app, theme = 'light', seedArg = '7', variant = 'classic', flag = ''] = process.argv.slice(2);
const clearLeft = flag === 'left';
if (!app) { console.error('usage: linkedin-cover.mjs <app-key> [light|dark] [seed]'); process.exit(1); }
const css = fs.readFileSync(path.join(FLEET, app, 'app', 'globals.css'), 'utf8');
const rgb = css.match(/--primary-rgb:\s*([\d\s,]+);/)?.[1].split(',').map(n => Number(n.trim()));
if (!rgb || rgb.length !== 3) throw new Error(`no --primary-rgb in ${app}/app/globals.css`);
const stamp = new Date(); const tag = `${stamp.toISOString().slice(0, 10)}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}`;
const outPath = path.join(os.homedir(), 'Downloads', `${app}-linkedin-cover-${variant}${clearLeft ? '-left' : ''}-${theme}-seed${seedArg}-${tag}.png`);
const W = 1512, H = 256, S = 2, CW = W * S, CH = H * S, PITCH = 8 * S, HEX_PITCH = 16 * S;
let seed = Number(seedArg) * 7919 + 13; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
// Every tone is the primary mixed toward white (light) or toward a deep shade of
// its own hue (dark), by the same ratios that were tuned on Recruiterbase's blue.
const hex2 = n => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
const mix = (a, b, t) => `#${a.map((c, i) => hex2(c + (b[i] - c) * t)).join('')}`;
const WHITE = [255, 255, 255];
const deep = rgb.map(c => c * 0.16 + 6);   // near-black in the brand's own hue
// 'white' is the light palette on a pure white ground with no panels; 'brand'
// is the profile photo's ground (solid primary) with every tile a tint toward white.
const P = theme === 'brand'
  ? { base: mix(rgb, WHITE, 0), panel: mix(rgb, WHITE, 0), pin: mix(rgb, WHITE, 0.16), small: mix(rgb, WHITE, 0.32), medium: mix(rgb, WHITE, 0.50), hex: mix(rgb, WHITE, 0.44), dense: mix(rgb, WHITE, 0.86), dense2: mix(rgb, WHITE, 0.70), xmark: mix(rgb, WHITE, 0.32), bigHex: mix(rgb, WHITE, 0.24) }
  : theme === 'white'
  ? { base: '#ffffff', panel: '#ffffff', pin: mix(rgb, WHITE, 0.80), small: mix(rgb, WHITE, 0.58), medium: mix(rgb, WHITE, 0.46), hex: mix(rgb, WHITE, 0.50), dense: mix(rgb, WHITE, 0.18), dense2: mix(rgb, WHITE, 0.30), xmark: mix(rgb, WHITE, 0.56), bigHex: mix(rgb, WHITE, 0.70) }
  : theme === 'dark'
  ? { base: mix(rgb, deep, 1), panel: mix(rgb, deep, 0.94), pin: mix(rgb, deep, 0.82), small: mix(rgb, deep, 0.68), medium: mix(rgb, deep, 0.58), hex: mix(rgb, deep, 0.62), dense: mix(rgb, deep, 0.38), dense2: mix(rgb, deep, 0.48), xmark: mix(rgb, deep, 0.68), bigHex: mix(rgb, deep, 0.76) }
  : { base: mix(rgb, WHITE, 0.86), panel: mix(rgb, WHITE, 0.90), pin: mix(rgb, WHITE, 0.76), small: mix(rgb, WHITE, 0.56), medium: mix(rgb, WHITE, 0.46), hex: mix(rgb, WHITE, 0.50), dense: mix(rgb, WHITE, 0.18), dense2: mix(rgb, WHITE, 0.30), xmark: mix(rgb, WHITE, 0.56), bigHex: mix(rgb, WHITE, 0.70) };
// Blocky islands: a rectangle, optionally cut by a diagonal, so silhouettes read
// as panels rather than coastlines.
const island = (x, y, w, h, cut = null) => ({ x, y, w, h, cut });
const inside = (px, py, i) => px >= i.x && px <= i.x + i.w && py >= i.y && py <= i.y + i.h && (!i.cut || (px - i.x) * i.cut.a + (py - i.y) * i.cut.b < i.cut.c);
const border = (px, py, i) => Math.min(px - i.x, i.x + i.w - px, py - i.y, i.y + i.h - py) / PITCH;   // in cells
const ragged = (px, py, i) => { const b = border(px, py, i); return b >= 2 || rnd() < 0.35 + b * 0.3; };
// Placed islands, so a new one can be kept clear of every earlier one: no two
// islands touch, and a diagonal cut only ever trims a corner (never a sliver).
const placed = [];
const MARGIN = PITCH * 2;
const clear = (r) => placed.every(o => r.x + r.w + MARGIN < o.x || o.x + o.w + MARGIN < r.x || r.y + r.h + MARGIN < o.y || o.y + o.h + MARGIN < r.y);
const clearBy = (r, margin) => placed.every(o => r.x + r.w + margin < o.x || o.x + o.w + margin < r.x || r.y + r.h + margin < o.y || o.y + o.h + margin < r.y);
const rect = (minW, maxW, minH, maxH) => {
  // A full margin first, then a touching-only rule, then a smaller island: a
  // crowded field still gets its islands, and they still never overlap.
  for (const [margin, shrink, tries] of [[MARGIN, 1, 60], [0, 1, 40], [0, 0.6, 40]]) {
    for (let attempt = 0; attempt < tries; attempt++) {
      const w = (minW + rnd() * (maxW - minW)) * S * shrink, h = (minH + rnd() * (maxH - minH)) * S * shrink;
      const cut = rnd() < 0.5 ? { a: 1, b: rnd() < 0.5 ? 1 : -1, c: w + h * 0.55 } : null;
      const r = island(rnd() * (CW - w), rnd() * (CH - h), w, h, cut);
      if (clearBy(r, margin)) { placed.push(r); return r; }
    }
  }
  return island(-1000, -1000, 1, 1, null);   // truly no room: an island nobody sees
};
const hexIsland = island(CW * (0.40 + rnd() * 0.12), CH * 0.28, 300 * S, CH * 0.72, { a: -1, b: 1.2, c: 60 * S });
const denseA = island(-10 * S, -10 * S, 230 * S, 85 * S, { a: 1, b: 1.6, c: 300 * S });
const denseB = island(CW * 0.62, 0, 150 * S, 55 * S, null);
const smallTR = island(CW * 0.78, CH * 0.35, 210 * S, 100 * S, { a: 1, b: -1, c: 250 * S });
placed.push(hexIsland, denseA, denseB, smallTR);
const mediumIslands = [...Array(4)].map(() => rect(90, 220, 40, 120));
const smallIslands = [...Array(6)].map(() => rect(60, 260, 30, 140));
const bridges = [rect(70, 100, 40, 60), rect(80, 110, 50, 70)];
const notch = island(hexIsland.x + hexIsland.w * 0.55, hexIsland.y, 70 * S, 60 * S, null);   // bitten out of the honeycomb
let out = `<rect width="100%" height="100%" fill="${P.base}"/>`;
for (let i = 0; i < 5; i++) {
  if (P.panel === P.base || variant === 'mosaic') { rnd(); rnd(); rnd(); continue; }   // flat ground: same random draws, no panels
  const x = rnd() * CW, w = (200 + rnd() * 380) * S, y = rnd() < 0.5 ? 0 : rnd() * CH * 0.45;
  out += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(CH - y).toFixed(0)}" fill="${P.panel}"/>`;
}
if (P.panel !== P.base && variant !== 'mosaic') out += `<polygon points="${CW * 0.40},0 ${CW * 0.50},0 ${CW * 0.90},${CH} ${CW * 0.80},${CH}" fill="${P.panel}"/>`;
const circle = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${c}"/>`;
const ring = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(1.1 * S).toFixed(1)}"/>`;
const diamond = (x, y, r, c) => `<polygon points="${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}" fill="${c}"/>`;
const sweep = (x, y) => 0.5 + 0.5 * Math.sin(x * 0.0019 + y * 0.004) * Math.cos(y * 0.0031 - x * 0.0009 + 0.8);   // halftone tone field
const diamondZone = island(CW * 0.04, CH * 0.45, 260 * S, CH * 0.55, { a: -1, b: 1, c: 40 * S });
// Graph-paper hairlines every eight cells, barely there.
if (variant === 'engineered') {
  for (let x = PITCH * 8; x < CW; x += PITCH * 8) out += `<line x1="${x}" y1="0" x2="${x}" y2="${CH}" stroke="${P.pin}" stroke-width="${S}" stroke-opacity="0.7"/>`;
  for (let y = PITCH * 8; y < CH; y += PITCH * 8) out += `<line x1="0" y1="${y}" x2="${CW}" y2="${y}" stroke="${P.pin}" stroke-width="${S}" stroke-opacity="0.7"/>`;
}
const hex = (x, y, r, c) => `<polygon points="${[0, 1, 2, 3, 4, 5].map(i => `${(x + r * Math.cos(i * Math.PI / 3)).toFixed(1)},${(y + r * Math.sin(i * Math.PI / 3)).toFixed(1)}`).join(' ')}" fill="${c}"/>`;
// ---- Whole-pattern variants (replace the halftone field entirely) ----------
const finish = async () => {
  const shapes = (out.match(/<(rect|circle|polygon|path)\b/g) || []).length;
  if (shapes < 200) throw new Error(`${variant} rendered almost nothing (${shapes} shapes); refusing to write a blank banner`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">${out}</svg>`;
  await sharp(Buffer.from(svg)).resize(W, H, { kernel: 'lanczos3' }).png().toFile(outPath);
  console.log(`${outPath} (${theme}, ${variant})`);
};
// The tonal field's axis turns with the seed, so a family never repeats its silhouette.
const ang = rnd() * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang);
const noise = (x, y) => { const u = x * ca - y * sa, v = x * sa + y * ca; return 0.5 + 0.5 * Math.sin(u * 0.0024 + v * 0.0051) * Math.cos(v * 0.0029 - u * 0.0013 + 0.7) + 0.25 * Math.sin(u * 0.0071 + v * 0.0032); };
if (['mosaic', 'dither', 'iso', 'plus'].includes(variant)) placed.length = 0;
if (variant === 'mosaic') {
  // FINAL (Dom, 2026-08-29): tiny square tiles on a fine 6px lattice, tone from a
  // smooth field quantized to three tints, with occasional 2x2 merged squares
  // inside a few blocky zones (never anything bigger, never a rectangle) and
  // every edge dissolving cell by cell. No panels: only squares, ever. With the
  // 'left' flag the field fades out across the left third, where LinkedIn's
  // profile photo sits. Do not restyle this; new looks get their own variant.
  const T = 6 * S, tones = [null, P.pin, P.small, P.medium];
  const leftFade = (x) => { if (!clearLeft) return 1; const t = (x / CW - 0.06) / 0.30; return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); };
  const mergeZones = [...Array(4)].map(() => rect(80, 200, 40, 110));
  const value = (x, y) => Math.max(0, Math.min(1, (noise(x, y) * 0.9 + 0.08) * leftFade(x)));
  const stepAt = (x, y) => { const v = value(x, y); return v < 0.36 ? 0 : v < 0.56 ? 1 : v < 0.76 ? 2 : 3; };
  const taken = new Set();
  for (let y = 0; y < CH; y += T) for (let x = 0; x < CW; x += T) {
    if (taken.has(`${x},${y}`)) continue;
    const v = Math.max(0, Math.min(1, value(x, y) + (rnd() - 0.5) * 0.25));
    const step = v < 0.36 ? 0 : v < 0.56 ? 1 : v < 0.76 ? 2 : 3;
    if (!tones[step]) continue;
    // Cells near a tone boundary drop out at random, so every edge dissolves.
    const nearest = Math.min(Math.abs(v - 0.36), Math.abs(v - 0.56), Math.abs(v - 0.76));
    if (nearest < 0.05 && rnd() < 0.5) continue;
    if (clearLeft && rnd() > leftFade(x)) continue;
    const big = step >= 2 && mergeZones.some(z => inside(x, y, z)) && rnd() < 0.5 && x + T < CW && y + T < CH
      && stepAt(x + T, y) >= 2 && stepAt(x, y + T) >= 2 && stepAt(x + T, y + T) >= 2;
    const size = big ? T * 2 - 1.5 * S : T - 1.5 * S;
    if (big) { taken.add(`${x + T},${y}`); taken.add(`${x},${y + T}`); taken.add(`${x + T},${y + T}`); }
    out += `<rect x="${x + 0.75 * S}" y="${y + 0.75 * S}" width="${size}" height="${size}" fill="${tones[step]}"/>`;
  }
  await finish(); process.exit(0);
}
if (variant === 'dither') {
  // An ordered (Bayer) dither of a slow tonal wave: a pixel-art gradient, every
  // dot the same size, only the arrangement carries the tone.
  const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  for (let y = PITCH / 2, j = 0; y < CH; y += PITCH, j++) for (let x = PITCH / 2, i = 0; x < CW; x += PITCH, i++) {
    const v = noise(x * 1.4, y * 1.4);
    const on = v * 16 > B[j % 4][i % 4];
    if (on) out += circle(x, y, 2.2 * S, v > 0.75 ? P.medium : v > 0.55 ? P.small : P.pin);
  }
  await finish(); process.exit(0);
}
if (variant === 'iso') {
  // An isometric lattice with clusters of shaded cubes, three faces in three
  // tones, on a sparse field of iso vertices.
  const a = 22 * S, h = a * Math.sqrt(3) / 2;
  const cube = (cx, cy) => {
    const top = `${cx},${cy - a} ${cx + h},${cy - a / 2} ${cx},${cy} ${cx - h},${cy - a / 2}`;
    const left = `${cx - h},${cy - a / 2} ${cx},${cy} ${cx},${cy + a} ${cx - h},${cy + a / 2}`;
    const right = `${cx},${cy} ${cx + h},${cy - a / 2} ${cx + h},${cy + a / 2} ${cx},${cy + a}`;
    return `<polygon points="${top}" fill="${P.pin}"/><polygon points="${left}" fill="${P.small}"/><polygon points="${right}" fill="${P.medium}"/>`;
  };
  const clusters = [...Array(7)].map(() => rect(90, 260, 60, 150));
  // Inside a cluster the cubes stack face to face on the true isometric
  // lattice (that is the look); clusters never touch each other (placed with a
  // margin); and a straight run never exceeds three cubes.
  const cubes = new Set();
  const key = (r, c) => `${r},${c}`;
  for (let row = 0, y = a * 1.5; y < CH - a * 1.5; y += a * 1.5, row++) for (let col = 0, x = (row % 2) * h + h; x < CW - h; x += h * 2, col++) {
    if (clusters.some(c => inside(x, y, c)) && rnd() < 0.8) cubes.add(key(row, col));
    else if (rnd() < 0.5) out += circle(x, y, 0.9 * S, P.pin);
  }
  // Straight runs of four or more, on any of the three axes, lose their fourth
  // cube: the horizontal axis is (row, col+1); the two diagonals step a row and
  // half a column, which on this stagger is (row+1, col) and (row+1, col+1)
  // depending on the row's parity.
  const axes = [[0, 1], [1, 0], [1, 1]];
  for (const k of [...cubes]) {
    const [r, c] = k.split(',').map(Number);
    for (const [dr, dc0] of axes) {
      let n = 1;
      for (let i = 1; i < 4; i++) {
        const rr = r + dr * i;
        const cc = dr === 0 ? c + dc0 * i : c + (dc0 === 0 ? -Math.floor((rr - r + (r % 2)) / 2) : Math.ceil((rr - r + (r % 2 ? 0 : 1)) / 2) - (r % 2 ? 0 : 1));
        if (cubes.has(key(rr, cc))) n++; else break;
      }
      if (n >= 4) { cubes.delete(k); break; }
    }
  }
  for (const k of cubes) {
    const [r, c] = k.split(',').map(Number);
    out += cube((r % 2) * h + h + c * h * 2, a * 1.5 + r * a * 1.5);
  }
  await finish(); process.exit(0);
}
if (variant === 'plus') {
  // A field of tiny plus signs that thicken into crosses and bars inside blocky
  // islands: the registration-mark look.
  const plus = (x, y, arm, w, c) => `<path d="M${x - arm} ${y}h${arm * 2}M${x} ${y - arm}v${arm * 2}" stroke="${c}" stroke-width="${w}"/>`;
  const thick = [...Array(5)].map(() => rect(80, 240, 40, 140)), bars = [...Array(3)].map(() => rect(120, 300, 30, 90));
  for (let y = PITCH / 2; y < CH; y += PITCH) for (let x = PITCH / 2; x < CW; x += PITCH) {
    const t = [...thick, ...bars].find(i => inside(x, y, i));
    if (t) {
      const bd = border(x, y, t);
      if (bd >= 3 || rnd() < 0.3 + bd * 0.25) out += rnd() < 0.15
        ? `<rect x="${x - 3.4 * S}" y="${y - 1.1 * S}" width="${6.8 * S}" height="${2.2 * S}" fill="${P.medium}"/>`
        : plus(x, y, 3.2 * S, 1.6 * S, bars.includes(t) ? P.medium : P.small);
    }
    else if (rnd() < 0.6) out += plus(x, y, 1.4 * S, 0.9 * S, P.pin);
  }
  await finish(); process.exit(0);
}
// Square lattice: every tier but the honeycomb.
for (let y = PITCH / 2; y < CH; y += PITCH) for (let x = PITCH / 2; x < CW; x += PITCH) {
  // The honeycomb owns its cells, its notch stays empty apart from pinpoint
  // texture, and a two-cell moat keeps every island off it.
  if (inside(x, y, hexIsland)) { if (inside(x, y, notch) && rnd() < 0.5) out += circle(x, y, 0.9 * S, P.pin); continue; }
  if (border(x, y, hexIsland) > -2.2 && border(x, y, hexIsland) <= 0) { if (rnd() < 0.5) out += circle(x, y, 0.9 * S, P.pin); continue; }
  if (inside(x, y, denseA)) { if (ragged(x, y, denseA)) out += circle(x, y, (theme === 'dark' ? 2.9 : 2.6) * S, P.dense); continue; }
  if (inside(x, y, denseB)) { if (ragged(x, y, denseB)) out += circle(x, y, 2.2 * S, P.dense2); continue; }
  if (inside(x, y, smallTR)) { if (ragged(x, y, smallTR) && rnd() < 0.9) out += circle(x, y, 1.8 * S, P.small); continue; }
  const m = mediumIslands.find(i => inside(x, y, i));
  if (m) {
    if (!ragged(x, y, m)) continue;
    if (variant === 'circuit' && rnd() < 0.35) out += ring(x, y, 3.2 * S, P.medium);
    else if (variant === 'halftone') out += circle(x, y, (1.2 + 3.2 * sweep(x, y)) * S, P.medium);
    else out += circle(x, y, 3.4 * S, P.medium);
    continue;
  }
  if (variant === 'dual' && inside(x, y, diamondZone)) { if (ragged(x, y, diamondZone)) out += diamond(x, y, 2.6 * S, P.small); continue; }
  const s = [...smallIslands, ...bridges].find(i => inside(x, y, i));
  if (s) { if (ragged(x, y, s)) out += circle(x, y, 1.6 * S, P.small); continue; }
  if (x > 150 * S && x < 250 * S && y > 120 * S && rnd() < 0.3) { out += `<path d="M${x - 2 * S} ${y - 2 * S}l${4 * S} ${4 * S}M${x + 2 * S} ${y - 2 * S}l${-4 * S} ${4 * S}" stroke="${P.xmark}" stroke-width="${1.1 * S}"/>`; continue; }
  if (variant === 'halftone') { const t = sweep(x, y); if (rnd() < 0.85) out += circle(x, y, (0.5 + 2.2 * t * t) * S, t > 0.6 ? P.small : P.pin); continue; }
  if (variant === 'engineered' && rnd() < 0.012) { out += `<path d="M${x - 2 * S} ${y - 2 * S}l${4 * S} ${4 * S}M${x + 2 * S} ${y - 2 * S}l${-4 * S} ${4 * S}" stroke="${P.small}" stroke-width="${1.1 * S}"/>`; continue; }
  if (rnd() < 0.72) out += circle(x, y, 0.9 * S, P.pin);
}
// Circuit traces: right-angle runs between lattice points inside the medium
// islands, the way copper runs between pads.
if (variant === 'circuit') {
  for (let i = 0; i < 70; i++) {
    const m = mediumIslands[Math.floor(rnd() * mediumIslands.length)];
    const x0 = m.x + Math.round(rnd() * m.w / PITCH) * PITCH + PITCH / 2, y0 = m.y + Math.round(rnd() * m.h / PITCH) * PITCH + PITCH / 2;
    const dx = (rnd() < 0.5 ? -1 : 1) * PITCH * (2 + Math.floor(rnd() * 6)), dy = (rnd() < 0.5 ? -1 : 1) * PITCH * (1 + Math.floor(rnd() * 4));
    out += `<path d="M${x0} ${y0}h${dx}v${dy}" fill="none" stroke="${P.medium}" stroke-width="${1.2 * S}" stroke-linecap="round"/>`;
    out += ring(x0 + dx, y0 + dy, 2.4 * S, P.medium);
  }
}
// Honeycomb: flat-top hexes on a coarser staggered pitch, never touching.
for (let row = 0, y = hexIsland.y + HEX_PITCH / 2; y < hexIsland.y + hexIsland.h; y += HEX_PITCH * 0.87, row++) {
  for (let x = hexIsland.x + HEX_PITCH / 2 + (row % 2) * HEX_PITCH / 2; x < hexIsland.x + hexIsland.w; x += HEX_PITCH) {
    if (!inside(x, y, hexIsland) || inside(x, y, notch)) continue;
    // The bottom rows thin out instead of ending in a point.
    const bottom = (hexIsland.y + hexIsland.h - y) / HEX_PITCH;
    if (ragged(x, y, hexIsland) && (bottom > 2.5 || rnd() < 0.45 + bottom * 0.2)) {
      if (variant === 'engineered' && rnd() < 0.4) out += `<polygon points="${[0, 1, 2, 3, 4, 5].map(i => `${(x + 6.6 * S * Math.cos(i * Math.PI / 3)).toFixed(1)},${(y + 6.6 * S * Math.sin(i * Math.PI / 3)).toFixed(1)}`).join(' ')}" fill="none" stroke="${P.hex}" stroke-width="${1.2 * S}"/>`;
      else out += hex(x, y, 6.6 * S, P.hex);
    }
  }
}
// A second, finer honeycomb top-center for the dual variant.
if (variant === 'dual') {
  const fine = island(CW * 0.30, 0, 200 * S, CH * 0.42, { a: 1, b: 1.4, c: 240 * S });
  const FP = HEX_PITCH * 0.6;
  // A shade lighter than the big honeycomb so the two scales read apart, and
  // its bottom rows thin out instead of stopping on a line.
  const fineTone = theme === 'dark' ? mix(rgb, deep, 0.72) : theme === 'brand' ? mix(rgb, WHITE, 0.22) : mix(rgb, WHITE, 0.62);
  for (let row = 0, y = FP / 2; y < fine.y + fine.h; y += FP * 0.87, row++) for (let x = fine.x + FP / 2 + (row % 2) * FP / 2; x < fine.x + fine.w; x += FP) {
    const bottom = (fine.y + fine.h - y) / FP;
    if (inside(x, y, fine) && ragged(x, y, fine) && (bottom > 3 || rnd() < 0.3 + bottom * 0.22)) out += hex(x, y, 3.8 * S, fineTone);
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">${out}</svg>`;
await sharp(Buffer.from(svg)).resize(W, H, { kernel: 'lanczos3' }).png().toFile(outPath);
console.log(`${outPath} (${theme}, base ${P.base}, ${(out.match(/<circle/g) || []).length} dots, ${(out.match(/<polygon/g) || []).length} hexes)`);
