// Renders a fleet app's social profile photo: the app's own brand mark
// (app/icon.svg, the fleet source of truth) in white, centered on a solid
// square of the app's primary color, 1080x1080, mark at 56% of the canvas so it
// sits comfortably inside a circular crop. Usage:
//   node profile-photo.mjs <app-key> [size] [mark-fraction] [--notion]
// e.g. node profile-photo.mjs ghostplug        -> ~/Downloads/ghostplug-profile-photo-<date>.png
//      node profile-photo.mjs ghostplug --notion -> ~/Downloads/ghostplug-notion-icon-<date>.png
// --notion renders the Notion page / workspace icon instead: Notion's documented
// 280x280, NO background (transparent), the mark alone in Notion's flat icon
// gray #d4d4d4, sized so the mark's own ink spans 80% of the canvas. Notion
// paints its own tinted rounded square behind the icon, so an uploaded colored
// square fights it; every icon in the Hypertheory workspace is transparent gray
// (Notion's built-in _gray glyphs and the uploaded custom ones, measured
// 2026-09-08: rgb 212,212,212, ink 210 of 256 px = 82%), and Dom took 2% off
// that. FRACTION sizes the SVG box, which carries slack around the ink, so 0.86
// there lands the ink at 0.80.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';
import { createRequire } from 'node:module';

// The fleet checkout: the parent of the repo the command runs in, so the same
// script works on the laptop and in a cloud session.
const FLEET = process.env.FLEET_DIR ?? path.resolve(execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim(), '..');
const sharp = createRequire(path.join(FLEET, 'hypertheory', 'package.json'))('sharp');

const notion = process.argv.includes('--notion');
const [app, sizeArg, fracArg] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!app) { console.error('usage: profile-photo.mjs <app-key> [size] [mark-fraction] [--notion]'); process.exit(1); }
const SIZE = Number(sizeArg) || (notion ? 280 : 1080);
const FRACTION = Number(fracArg) || (notion ? 0.86 : 0.56);
const NOTION_GRAY = '#d4d4d4';
const repo = path.join(FLEET, app);

// The primary color comes from the app's own tokens, never guessed.
const css = fs.readFileSync(path.join(repo, 'app', 'globals.css'), 'utf8');
const rgb = css.match(/--primary-rgb:\s*([\d\s,]+);/)?.[1].split(',').map(n => Number(n.trim()));
if (!rgb || rgb.length !== 3) throw new Error(`no --primary-rgb in ${app}/app/globals.css`);
let primary = `#${rgb.map(n => n.toString(16).padStart(2, '0')).join('')}`;

// Every brand-colored fill and stroke in the mark turns white; nothing else is
// touched, so the geometry is exactly the site's. A monochrome brand (every
// color in the mark is a gray, like Hypertheory's near-black / near-white
// minotaur) has no brand hue, so its ground is the mark's own darkest gray
// rather than the UI's accent token.
let svg = fs.readFileSync(path.join(repo, 'app', 'icon.svg'), 'utf8');
const colors = new Set(svg.match(/#[0-9a-fA-F]{6}\b/g) || []);
const gray = c => { const [r, g, b] = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); return Math.max(r, g, b) - Math.min(r, g, b) <= 8; };
if (colors.size && [...colors].every(gray)) primary = [...colors].sort((a, b) => parseInt(a.slice(1), 16) - parseInt(b.slice(1), 16))[0];
for (const c of colors) svg = svg.split(c).join(notion ? NOTION_GRAY : '#ffffff');
const MARK = Math.round(SIZE * FRACTION);
svg = svg.replace(/width="[^"]*" height="[^"]*"/, `width="${MARK}" height="${MARK}"`);

const stamp = new Date(); const tag = `${stamp.toISOString().slice(0, 10)}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}`;
const out = path.join(os.homedir(), 'Downloads', `${app}-${notion ? 'notion-icon' : 'profile-photo'}-${tag}.png`);
const mark = await sharp(Buffer.from(svg)).png().toBuffer();
await sharp({ create: notion
    ? { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    : { width: SIZE, height: SIZE, channels: 3, background: primary } })
  .composite([{ input: mark, left: Math.round((SIZE - MARK) / 2), top: Math.round((SIZE - MARK) / 2) }])
  .png().toFile(out);
console.log(notion
  ? `${out} (${SIZE}x${SIZE}, transparent background, ${NOTION_GRAY} mark at ${Math.round(FRACTION * 100)}%)`
  : `${out} (${SIZE}x${SIZE}, ${primary} background, white mark at ${Math.round(FRACTION * 100)}%)`);
