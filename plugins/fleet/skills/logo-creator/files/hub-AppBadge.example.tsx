"use client";
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { readQ } from '@/lib/utils/readQ';
import type { BrandCurrent } from '@/app/admin/brand';
import StonedIcon from '@/app/components/logo/StonedIcon';

type IconComponent = (props: { className?: string; style?: React.CSSProperties }) => React.ReactElement;

// Ghostplug — verbatim from ghostplug/app/components/logo/LogoIcon.tsx
const GhostplugIcon: IconComponent = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} style={style} aria-hidden="true">
    <path
      d="M 12 6 C 23 4.5 1 2.5 13.5 1"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M 3 11 C 3 8.5 6 6 12 6 C 18 6 21 8.5 21 11 L 21 17 A 2 2 0 0 1 19 19 L 5 19 A 2 2 0 0 1 3 17 Z M 9 12.5 m -2 0 a 2 2.4 0 1 0 4 0 a 2 2.4 0 1 0 -4 0 M 15 12.5 m -2 0 a 2 2.4 0 1 0 4 0 a 2 2.4 0 1 0 -4 0"
    />
    <rect x="7.3" y="19" width="2.4" height="4" rx="0.5" />
    <rect x="14.3" y="19" width="2.4" height="4" rx="0.5" />
  </svg>
);

// BrandFlare — 4-point spark, verbatim from brandflare/app/components/logo/LogoIcon.tsx.
const BrandflareIcon: IconComponent = ({ className, style }) => (
  <svg viewBox="2 2 20 20" fill="currentColor" stroke="none" className={className} style={style} aria-hidden="true">
    <path d="M12 2C12.8 8.5 15.5 11.2 22 12C15.5 12.8 12.8 15.5 12 22C11.2 15.5 8.5 12.8 2 12C8.5 11.2 11.2 8.5 12 2Z" />
  </svg>
);

// Hypertheory — knot, verbatim from hypertheory/app/components/logo/AppLogo.tsx
const HypertheoryIcon: IconComponent = ({ className, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M4 12 C4 8 8 6 12 12 C16 18 20 16 20 12 C20 8 16 6 12 12 C8 18 4 16 4 12 Z" />
  </svg>
);

// Recruiterbase — tapered solid-crown layers, verbatim from recruiterbase/app/components/logo/LogoIcon.tsx
const RecruiterbaseIcon: IconComponent = ({ className, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path
      d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
      fill="currentColor"
      className="transition-transform duration-500 ease-in-out group-hover/logo:translate-y-[-1.5px]"
    />
    <path d="M2.7 12a.93 1 0 0 0 .54.91l8 3.91a1.86 2 0 0 0 1.53 0l7.98-3.9A.93 1 0 0 0 21.3 12" />
    <path
      d="M3.6 17a.84 1 0 0 0 .49.91l7.22 3.91a1.68 2 0 0 0 1.39 0l7.21-3.9A.84 1 0 0 0 20.4 17"
      className="transition-transform duration-500 ease-in-out group-hover/logo:translate-y-px"
    />
  </svg>
);

// StonedIcon's SVG uses its native 800×700 viewBox; wrap so the badge can size it via className.
const StonedgptIcon: IconComponent = ({ className, style }) => (
  <span className={`inline-flex ${className ?? ''}`} style={style}>
    <StonedIcon className="w-full h-full" />
  </span>
);

interface AppConfig {
  Icon: IconComponent;
  // Each sibling's own AppLogo dictates the font + weight: Ghostplug = Space Grotesk medium,
  // StonedGPT = Poppins semibold, BrandFlare = Montserrat medium, RecruiterBase = Montserrat
  // semibold, Hypertheory = Poppins light. Hypertheory's layout loads all of these.
  font: string;
  color: string;
  // Each sibling's own logo hover effect, verbatim (Recruiterbase's lives on the
  // icon's paths; Hypertheory's mark intentionally has none, per Dom).
  anim: string;
}

const CONFIGS: Record<string, AppConfig> = {
  ghostplug: { Icon: GhostplugIcon, font: 'font-space-grotesk font-medium', color: '#FF4500', anim: 'transition-transform duration-500 ease-in-out group-hover/logo:-translate-y-0.5' },
  stonedgpt: { Icon: StonedgptIcon, font: 'font-poppins font-semibold', color: '#22C55E', anim: 'transition-transform duration-700 ease-in-out group-hover/logo:transform-[rotateY(360deg)]' },
  brandflare: { Icon: BrandflareIcon, font: 'font-montserrat font-medium', color: '#0095FF', anim: 'transition-transform duration-500 ease-in-out group-hover/logo:rotate-90' },
  recruiterbase: { Icon: RecruiterbaseIcon, font: 'font-montserrat font-semibold', color: '#3B82F6', anim: '' },
  hypertheory: { Icon: HypertheoryIcon, font: 'font-poppins font-light', color: '#34D399', anim: '' },
};

interface AppBadgeProps {
  appKey: string;
  name: string;
  /** Extra classes for the wrapping flex container (e.g. `flex-1 min-w-0`). */
  className?: string;
  /** Override the brand color (for hovered/dimmed states). */
  iconColor?: string;
}

// A brand chosen in an app's Logo Creator (hub lab.current) overrides the verbatim copy above, so the
// hub reflects the new mark, wordmark font, casing and color as soon as it is picked. The Google font is
// pulled at runtime for the badge only; the app's own layout loads it properly once the brand is baked.
const FIRE_FILTER = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="brand-fire" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="0.07 0.14" numOctaves="2" seed="1" result="noise"><animate attributeName="baseFrequency" values="0.07 0.14;0.1 0.18;0.06 0.12;0.09 0.15;0.07 0.14" dur="0.9s" repeatCount="indefinite"/><animate attributeName="seed" values="1;3;5;7;2;4;6;8" calcMode="discrete" dur="1.3s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>`;
function ensureFireFilter() {
  if (typeof document === 'undefined' || document.getElementById('brand-fire-filter')) return;
  const host = document.createElement('div');
  host.id = 'brand-fire-filter';
  host.innerHTML = FIRE_FILTER;
  document.body.appendChild(host);
}
const loadedFonts = new Set<string>();
function ensureFont(family: string) {
  if (typeof document === 'undefined' || loadedFonts.has(family) || family.startsWith('Current')) return;
  loadedFonts.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}
// Hover keys from the Logo Creator, in the hub's own group naming (literal so Tailwind generates them).
const HOVER_ANIM: Record<string, string> = {
  none: '',
  rotate: 'transition-transform duration-500 ease-in-out group-hover/logo:rotate-90',
  spin: 'transition-transform duration-700 ease-in-out group-hover/logo:rotate-360',
  flip: 'transition-transform duration-700 ease-in-out group-hover/logo:transform-[rotateY(360deg)]',
  lift: 'transition-transform duration-500 ease-in-out group-hover/logo:-translate-y-0.5',
  grow: 'transition-transform duration-300 ease-out group-hover/logo:scale-125',
  tilt: 'transition-transform duration-300 ease-out group-hover/logo:rotate-12',
  wiggle: 'transition-transform duration-300 ease-out group-hover/logo:rotate-12',
  bounce: 'transition-transform duration-300 ease-out group-hover/logo:-translate-y-1',
  pulse: 'transition-transform duration-300 ease-out group-hover/logo:scale-125',
  glow: 'transition-[filter] duration-300 group-hover/logo:drop-shadow-[0_0_6px_currentColor]',
  fire: 'brand-fire',
};
const CASE = { lower: 'lowercase', title: 'none', upper: 'uppercase' } as const;
const TRACK = { tight: '-0.025em', normal: '0', wide: '0.1em' } as const;

export default function AppBadge({ appKey, name, className = '', iconColor }: AppBadgeProps) {
  const { data: current } = useQuery({ queryKey: ['admin', 'brandCurrent'], queryFn: () => readQ<Record<string, BrandCurrent>>('fetchBrandCurrent'), staleTime: 60_000 });
  const live = current?.[appKey];
  useEffect(() => {
    if (live) ensureFont(live.font);
    if (live?.hover === 'fire') ensureFireFilter();
  }, [live]);
  if (live) {
    const svgProps = live.stroke
      ? { fill: 'none', stroke: 'currentColor', strokeWidth: live.stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
      : { fill: 'currentColor' };
    return (
      <span className={`group/logo inline-flex items-center gap-1.5 min-w-0 ${className}`}>
        <svg viewBox={live.viewBox} {...svgProps} className={`w-3.5 h-3.5 shrink-0 ${live.hover ? HOVER_ANIM[live.hover] ?? '' : CONFIGS[appKey]?.anim ?? ''}`} style={{ color: iconColor ?? live.primary }}>
          <path d={live.d} {...(live.rule ? { fillRule: live.rule, clipRule: live.rule } : {})} />
        </svg>
        <span
          className="truncate"
          style={{ fontFamily: live.font.startsWith('Current') ? undefined : `"${live.font}", sans-serif`, fontWeight: live.weight, textTransform: CASE[live.casing], letterSpacing: TRACK[live.tracking] }}
        >
          {name}
        </span>
      </span>
    );
  }
  const config = CONFIGS[appKey];
  if (!config) {
    return <span className={className}>{name}</span>;
  }
  const { Icon, font, color, anim } = config;
  return (
    <span className={`group/logo inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <Icon className={`w-3.5 h-3.5 shrink-0 ${anim}`} style={{ color: iconColor ?? color }} />
      <span className={`truncate ${font}`}>{name}</span>
    </span>
  );
}
