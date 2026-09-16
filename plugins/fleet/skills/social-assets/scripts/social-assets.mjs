// The social identity kit for one fleet app: the profile photo and THREE header
// candidates to choose from, all in the app's own colors. The default family is
// mosaic (the pixel-block die Dom picked 2026-08-29), each candidate at its own
// seed; --variant random draws from the whole approved pool instead. Usage:
//   node social-assets.mjs <app-key> [--variant <family>|random] [--theme light|dark|white|brand] [--seed N] [--count 3]
// --seed with --count 1 reproduces one exact header. Prints every path with its
// variant and seed.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const app = args.find(a => !a.startsWith('--'));
if (!app) { console.error('usage: social-assets.mjs <app-key> [--variant ...] [--theme light|dark|white|brand] [--seed N]'); process.exit(1); }
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i !== -1 && args[i + 1] ? args[i + 1] : fallback; };
const theme = opt('theme', 'light');
// The families Dom approved (2026-08-29, the 2:18 batch plus the halftone
// classics), each at a fresh seed; circuit and engineered stay opt-in only.
const POOL = ['classic', 'classic', 'dual', 'halftone', 'plus', 'dither', 'mosaic', 'iso'];   // all reviewed and passing, 2026-08-29
const wanted = opt('variant', 'mosaic');
const count = Number(opt('count', '3'));
const seedOpt = opt('seed', null);
// Three draws, seeds never repeated (families as distinct as the pool allows when random).
const families = new Set(POOL);
const draws = [];
const usedSeeds = new Set();
while (draws.length < count) {
  const pool = wanted !== 'random' ? [wanted] : (families.size ? [...families] : POOL);
  const variant = pool[Math.floor(Math.random() * pool.length)];
  families.delete(variant);
  let seed = seedOpt && draws.length === 0 ? Number(seedOpt) : 1 + Math.floor(Math.random() * 97);
  while (usedSeeds.has(seed)) seed = 1 + Math.floor(Math.random() * 97);
  usedSeeds.add(seed);
  draws.push({ variant, seed });
}

const here = path.dirname(new URL(import.meta.url).pathname);
const run = (script, extra) => {
  const r = spawnSync('node', [script, ...extra], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(r.status ?? 1); }
  return r.stdout.trim();
};
console.log(run(path.join(here, 'profile-photo.mjs'), [app]));
for (const { variant, seed } of draws) {
  console.log(run(path.join(here, 'linkedin-cover.mjs'), [app, theme, String(seed), variant]));
  console.log(`   header candidate: ${variant}, seed ${seed} (reproduce with --variant ${variant} --seed ${seed} --count 1)`);
  if (variant === 'mosaic') {   // the LinkedIn cut: same seed, tiles fading out where the profile photo sits
    console.log(run(path.join(here, 'linkedin-cover.mjs'), [app, theme, String(seed), variant, 'left']));
    console.log(`   left-clear cut of seed ${seed}`);
  }
}
