import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { authenticateApiRoute } from '@/lib/utils/apiAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

// EPHEMERAL: logo creator. "Make this my logo" bakes the chosen combo into the real code on Dom's machine and
// commits it locally (never pushes): app/icon.svg, LogoIcon.tsx, AppLogo.tsx, the root layout's font loaders,
// the globals @theme font token (plus primary and hover keyframes when chosen), the hub AppBadge copy, and the
// Logo Creator's own idea of "current" so the panel keeps working against the new brand. Development only.

type Body = {
  icon: string; by: string; font: string; body: string; primary: string;
  casing: 'lower' | 'title' | 'upper'; tracking: 'tight' | 'normal' | 'wide'; weight: number; size: number; hover: string;
  viewBox: string; d: string; stroke?: number; rule?: string;
};

const run = promisify(execFile);
const root = process.cwd();
const at = (...p: string[]) => path.join(root, ...p);
const read = (p: string) => fs.readFile(at(p), 'utf8');
const write = (p: string, s: string) => fs.writeFile(at(p), s, 'utf8');

const WEIGHT_CLASS: Record<number, string> = { 100: 'font-thin', 200: 'font-extralight', 300: 'font-light', 400: 'font-normal', 500: 'font-medium', 600: 'font-semibold', 700: 'font-bold', 800: 'font-extrabold', 900: 'font-black' };
const TRACKING: Record<Body['tracking'], string> = { tight: 'tracking-tight', normal: 'tracking-normal', wide: 'tracking-widest' };
const CASING: Record<Body['casing'], string> = { lower: 'hypertheory', title: 'Hypertheory', upper: 'HYPERTHEORY' };
// Mirrors HOVERS in the creator store (group-hover) and HOVER_ANIM in AppBadge (group-hover/logo).
const HOVER_CLS: Record<string, string> = {
  none: '',
  rotate: 'transition-transform duration-500 ease-in-out group-hover:rotate-90',
  spin: 'transition-transform duration-700 ease-in-out group-hover:rotate-360',
  flip: 'transition-transform duration-700 ease-in-out group-hover:transform-[rotateY(360deg)]',
  lift: 'transition-transform duration-500 ease-in-out group-hover:-translate-y-0.5',
  grow: 'transition-transform duration-300 ease-out group-hover:scale-125',
  tilt: 'transition-transform duration-300 ease-out group-hover:rotate-12',
  wiggle: 'lab-wiggle', bounce: 'lab-bounce', pulse: 'lab-pulse',
  glow: 'transition-[filter] duration-300 group-hover:drop-shadow-[0_0_6px_currentColor]',
  fire: 'lab-fire',
};
const KEYFRAME_HOVERS = new Set(['wiggle', 'bounce', 'pulse', 'fire']);
const isCurrent = (name: string) => /^Current \(/.test(name);
const exportName = (font: string) => font.replace(/ /g, '_');
const nearest = (weights: string[], w: number) => weights.filter((x) => x !== 'variable').map(Number).sort((a, b) => Math.abs(a - w) - Math.abs(b - w))[0] ?? w;

export async function PUT(req: Request) {
  if (process.env.NODE_ENV !== 'development') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const auth = await authenticateApiRoute(req);
  if (auth instanceof Response) return auth;
  if (!auth.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b?.d || !b.viewBox || !b.font) return NextResponse.json({ error: 'combo with icon path is required' }, { status: 400 });

  // The panel sends the current wordmark font as "Current (X)"; the real name is what the loader needs.
  if (isCurrent(b.font)) b.font = b.font.slice(9, -1);
  const fontData = JSON.parse(await read('node_modules/next/dist/compiled/@next/font/dist/google/font-data.json')) as Record<string, { weights: string[] }>;
  const loader = (font: string, weight: number | number[], variable?: string) => {
    const info = fontData[font];
    if (!info) throw new Error(`unknown Google font ${font}`);
    const fixed = !info.weights.includes('variable');
    const ws = (Array.isArray(weight) ? weight : [weight]).map((w) => String(nearest(info.weights, w)));
    const args = [`subsets: ["latin"]`, ...(fixed ? [`weight: [${[...new Set(ws)].map((w) => `"${w}"`).join(', ')}]`] : []), ...(variable ? [`variable: "${variable}"`] : [])];
    return `${exportName(font)}({ ${args.join(', ')} })`;
  };
  const touched: string[] = [];
  const stamp = new Date().toISOString().slice(0, 10);
  const strokeAttrs = b.stroke ? `fill="none" stroke="currentColor" strokeWidth={${b.stroke}} strokeLinecap="round" strokeLinejoin="round"` : `fill="currentColor"`;
  const ruleAttrs = b.rule ? ` fillRule="${b.rule}" clipRule="${b.rule}"` : '';
  const credit = b.by === 'hypertheory' ? 'the Hypertheory mark' : `${b.icon} by ${b.by}, game-icons.net (CC BY 3.0)`;

  // 1. icon.svg, monochrome like the hub's original.
  const svgPaint = b.stroke ? `fill="none" stroke="#171717" stroke-width="${b.stroke}" stroke-linecap="round" stroke-linejoin="round"` : `fill="#171717"${b.rule ? ` fill-rule="${b.rule}" clip-rule="${b.rule}"` : ''}`;
  const dark = b.stroke ? 'path{stroke:#fafafa}' : 'path{fill:#fafafa}';
  await write('app/icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="${b.viewBox}" fill="none"><style>@media(prefers-color-scheme:dark){${dark}}</style><path ${svgPaint} d="${b.d}"/></svg>\n`);
  touched.push('app/icon.svg');

  // 2. LogoIcon.tsx
  await write('app/components/logo/LogoIcon.tsx', `// Hypertheory mark: ${credit}. Baked from the Logo Creator ${stamp}. app/icon.svg carries the same path.
export default function LogoIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="${b.viewBox}" ${strokeAttrs} className={className} style={style} aria-hidden="true">
      <path d="${b.d}"${ruleAttrs} />
    </svg>
  );
}
`);
  touched.push('app/components/logo/LogoIcon.tsx');

  // 3. AppLogo.tsx, lab wiring kept so the panel keeps swapping over the new brand until it is removed.
  const hover = HOVER_CLS[b.hover] ?? '';
  const slug = b.font.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fontVar = `--font-${slug}`;
  await write('app/components/logo/AppLogo.tsx', `"use client"; // EPHEMERAL: logo creator
import Link from "next/link";
import LogoIcon from "./LogoIcon";
// EPHEMERAL: logo creator wiring, remove the creator imports and branches once the Logo Creator is removed.
import { CASING, HOVERS, TRACKING, pathProps, svgProps, useLab } from "./creator/store";

// Global wordmark. ${b.font} is the logo face; ${credit} is the mark. Baked from the Logo Creator ${stamp}.
export default function AppLogo({ href }: { href: string }) {
  const lab = useLab(); // EPHEMERAL: logo creator
  const hover = lab.hover === null ? "${hover}" : HOVERS[lab.hover]?.cls ?? ""; // EPHEMERAL: logo creator
  return (
    <Link href={href} aria-label="Hypertheory" className="group flex items-center gap-1">
      {lab.icon ? ( // EPHEMERAL: logo creator
        <svg
          viewBox={lab.icon.viewBox}
          {...svgProps(lab.icon)}
          className={\`text-main shrink-0 \${hover}\`}
          style={{ width: lab.size, height: lab.size }}
        >
          <path d={lab.icon.d} {...pathProps(lab.icon)} />
        </svg>
      ) : (
        <LogoIcon className={\`w-[${b.size}px] h-[${b.size}px] text-main shrink-0 \${hover}\`} />
      )}
      <span
        className={\`text-base text-main \${TRACKING[lab.tracking]} \${lab.fontFamily ? "" : "${WEIGHT_CLASS[b.weight] ?? 'font-medium'} font-${slug}"}\`}
        style={lab.fontFamily ? { fontFamily: lab.fontFamily, fontWeight: lab.weight } : undefined}
      >
        {CASING[lab.casing]}
      </span>
    </Link>
  );
}
`);
  touched.push('app/components/logo/AppLogo.tsx');

  // 4. Root layout: logo font loader (and body font when changed), plus the fire filter when that hover is chosen.
  let layout = await read('app/layout.tsx');
  const importLine = layout.match(/import \{([^}]*)\} from "next\/font\/google";/);
  if (!importLine) throw new Error('font import not found in app/layout.tsx');
  const names = new Set(importLine[1].split(',').map((s) => s.trim()).filter(Boolean));
  names.add(exportName(b.font));
  if (!isCurrent(b.body)) names.add(exportName(b.body));
  layout = layout.replace(importLine[0], `import { ${[...names].join(', ')} } from "next/font/google";`);
  // The wordmark font follows the hub's proven pattern (see Orbitron): a next/font loader whose variable is
  // --font-<slug>, a matching @theme token, and the font-<slug> utility on the wordmark. A font the layout
  // already loads that way is reused untouched.
  layout = layout.replace(/^.*\/\/ LOGO FONT.*\n/m, '').replace(/ \$\{logoFont\.variable\}/, '');
  if (!layout.includes(`variable: "${fontVar}"`)) {
    const logoLine = `const logoFont = ${loader(b.font, b.weight, fontVar)}; // LOGO FONT, baked from the Logo Creator`;
    layout = layout.replace(/(const orbitron = .*\n)/, `$1${logoLine}\n`);
    layout = layout.replace('${orbitron.variable}', '${orbitron.variable} ${logoFont.variable}');
  }
  layout = layout.replace(/^.*\/\/ BODY FONT.*\n/m, '');
  if (!isCurrent(b.body)) {
    const bodyLine = `const bodyFont = ${loader(b.body, [400, 500, 600, 700])}; // BODY FONT, baked from the Logo Creator`;
    layout = layout.replace(/(\/\/ LOGO FONT.*\n)/, `$1${bodyLine}\n`);
  }
  layout = layout.replace(/className=\{`\$\{(montserrat|bodyFont)\.className\}/, `className={\`\${${isCurrent(b.body) ? 'montserrat' : 'bodyFont'}.className}`);
  layout = layout.replace(/import FireFilter from "@\/app\/components\/logo\/FireFilter";\n/, '').replace(/\s*<FireFilter \/>/, '');
  if (b.hover === 'fire') {
    layout = layout.replace('import Pulse from "@/app/components/Pulse";\n', 'import Pulse from "@/app/components/Pulse";\nimport FireFilter from "@/app/components/logo/FireFilter";\n');
    layout = layout.replace('<Pulse />', '<Pulse />\n                <FireFilter />');
    await write('app/components/logo/FireFilter.tsx', `// The fire hover's turbulence filter, referenced by the .lab-fire rule in globals.css. Baked from the Logo Creator ${stamp}.
export default function FireFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter id="lab-fire" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.07 0.14" numOctaves="2" seed="1" result="noise">
            <animate attributeName="baseFrequency" values="0.07 0.14;0.1 0.18;0.06 0.12;0.09 0.15;0.07 0.14" dur="0.9s" repeatCount="indefinite" />
            <animate attributeName="seed" values="1;3;5;7;2;4;6;8" calcMode="discrete" dur="1.3s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
`);
    touched.push('app/components/logo/FireFilter.tsx');
  }
  await write('app/layout.tsx', layout);
  touched.push('app/layout.tsx');

  // 5. globals.css: the font token, the primary when changed, hover keyframes when needed.
  let css = await read('app/globals.css');
  css = css.replace(/  \/\* The baked wordmark font[^\n]*\n  --font-[a-z0-9-]+: var\(--font-[a-z0-9-]+\), sans-serif;\n/, '');
  if (!css.includes(`${fontVar}:`)) css = css.replace(/(  --font-orbitron: [^\n]*\n)/, `$1  /* The baked wordmark font, loaded in app/layout.tsx as ${fontVar}. */\n  ${fontVar}: var(${fontVar}), sans-serif;\n`);
  const creator = await read('app/components/logo/creator/LogoCreator.tsx');
  const currentPrimary = creator.match(/const CURRENT_PRIMARY = "([^"]+)"/)?.[1] ?? '#34D399';
  if (b.primary.toUpperCase() !== currentPrimary.toUpperCase()) {
    const n = parseInt(b.primary.replace('#', ''), 16);
    const [r, g, bl] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    css = css.replace(/--primary-rgb: [^;]+;/, `--primary-rgb: ${r}, ${g}, ${bl};`);
    css = css.replace(/--primary-dark: rgb\([^)]*\);/, `--primary-dark: rgb(${Math.round(r * 0.85)}, ${Math.round(g * 0.85)}, ${Math.round(bl * 0.85)});`);
  }
  if (KEYFRAME_HOVERS.has(b.hover) && !css.includes('/* LOGO HOVER */')) {
    css += `
/* LOGO HOVER */
@keyframes lab-wiggle { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-12deg) } 75% { transform: rotate(12deg) } }
@keyframes lab-bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes lab-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.2) } }
.group:hover .lab-wiggle { animation: lab-wiggle 0.5s ease-in-out }
.group:hover .lab-bounce { animation: lab-bounce 0.5s ease-in-out }
.group:hover .lab-pulse { animation: lab-pulse 0.5s ease-in-out }
@keyframes lab-fire { 0%,100% { transform: skewX(0) scaleY(1) } 20% { transform: skewX(-5deg) scaleY(1.06) } 45% { transform: skewX(4deg) scaleY(0.97) } 70% { transform: skewX(-3deg) scaleY(1.04) } }
.lab-fire { transform-origin: 50% 100% }
.group:hover .lab-fire { animation: lab-fire 0.8s ease-in-out infinite; filter: url(#lab-fire) drop-shadow(0 0 2px currentColor) }
`;
  }
  await write('app/globals.css', css);
  touched.push('app/globals.css');

  // 6. The hub's AppBadge copy of the mark and its config row.
  let badge = await read('app/admin/metrics/views/AppBadge.tsx');
  badge = badge.replace(/\/\/ Hypertheory[^\n]*\nconst HypertheoryIcon: IconComponent = \(\{ className, style \}\) => \([\s\S]*?\n\);\n/, `// Hypertheory: ${credit}, verbatim from hypertheory/app/components/logo/LogoIcon.tsx
const HypertheoryIcon: IconComponent = ({ className, style }) => (
  <svg viewBox="${b.viewBox}" ${strokeAttrs} className={className} style={style} aria-hidden="true">
    <path d="${b.d}"${ruleAttrs} />
  </svg>
);
`);
  const badgeAnim = hover.replace(/group-hover:/g, 'group-hover/logo:');
  badge = badge.replace(/  hypertheory: \{ Icon: HypertheoryIcon, [^\n]*\},\n/, `  hypertheory: { Icon: HypertheoryIcon, font: 'font-${slug} ${WEIGHT_CLASS[b.weight] ?? 'font-medium'}', color: '${b.primary}', anim: '${badgeAnim}' },\n`);
  await write('app/admin/metrics/views/AppBadge.tsx', badge);
  touched.push('app/admin/metrics/views/AppBadge.tsx');

  // 7. The Logo Creator now treats this combo as "current".
  const oldFont = creator.match(/const CURRENT_FONT = "([^"]+)"/)?.[1] ?? '';
  const oldBody = creator.match(/const CURRENT_BODY = "([^"]+)"/)?.[1] ?? '';
  const newFont = `Current (${b.font})`;
  const newBody = `Current (${isCurrent(b.body) ? b.body.slice(9, -1) : b.body})`;
  let next = creator.split(oldFont).join(newFont).split(oldBody).join(newBody);
  next = next.replace(/const CURRENT_PRIMARY = "[^"]+"/, `const CURRENT_PRIMARY = "${b.primary.toUpperCase()}"`);
  next = next.replace(/const SAVED_DEFAULT: Saved = \{[^\n]*\};/, `const SAVED_DEFAULT: Saved = { icon: "current", by: "hypertheory", font: CURRENT_FONT, body: CURRENT_BODY, primary: CURRENT_PRIMARY, casing: "${b.casing}", tracking: "${b.tracking}", weight: ${b.weight}, size: ${b.size}, hover: "${b.hover}" };`);
  await write('app/components/logo/creator/LogoCreator.tsx', next);
  let store = await read('app/components/logo/creator/store.ts');
  store = store.replace(/  weight: \d+,\n  casing: "[a-z]+",\n  tracking: "[a-z]+",\n  size: \d+,/, `  weight: ${b.weight},\n  casing: "${b.casing}",\n  tracking: "${b.tracking}",\n  size: ${b.size},`);
  await write('app/components/logo/creator/store.ts', store);
  let icons = await read('app/components/logo/creator/icons.ts');
  icons = icons.replace(/  \{ name: "current", by: "hypertheory", [^\n]*\},\n/, `  { name: "current", by: "hypertheory", viewBox: "${b.viewBox}", d: "${b.d}"${b.stroke ? `, stroke: ${b.stroke}` : ''}${b.rule ? `, rule: "${b.rule}"` : ''} },\n`);
  await write('app/components/logo/creator/icons.ts', icons);
  touched.push('app/components/logo/creator/LogoCreator.tsx', 'app/components/logo/creator/store.ts', 'app/components/logo/creator/icons.ts');

  // 8. One local commit, never a push.
  const summary = `${b.icon} by ${b.by}, ${b.font} ${b.weight} ${b.casing} ${b.tracking}, size ${b.size}, hover ${b.hover}${isCurrent(b.body) ? '' : `, body ${b.body}`}${b.primary.toUpperCase() === currentPrimary.toUpperCase() ? '' : `, primary ${b.primary}`}`;
  try {
    await run('git', ['add', ...touched], { cwd: root });
    await run('git', ['commit', '-q', '-m', `Hypertheory logo baked from the Logo Creator: ${summary}\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`], { cwd: root });
    const { stdout } = await run('git', ['rev-parse', '--short', 'HEAD'], { cwd: root });
    console.log('[lab bake] committed', stdout.trim(), summary);
    return NextResponse.json({ ok: true, commit: stdout.trim(), summary });
  } catch (e) {
    console.error('[lab bake] files written but the commit failed:', e);
    return NextResponse.json({ ok: true, commit: null, summary });
  }
}
