// EPHEMERAL: logo creator store. AppLogo reads it; the LogoCreator panel writes it. Delete this folder once a logo is chosen.
import { useSyncExternalStore } from "react";

export type Casing = "lower" | "title" | "upper";
export type Tracking = "tight" | "normal" | "wide";

export type LabIconRef = { viewBox: string; d: string; stroke?: number; rule?: "evenodd" };

export const svgProps = (i: LabIconRef) =>
  i.stroke
    ? { fill: "none", stroke: "currentColor", strokeWidth: i.stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    : { fill: "currentColor" };
export const pathProps = (i: LabIconRef) => (i.rule ? { fillRule: i.rule, clipRule: i.rule } : {});

// Logo hover effects. Keys travel with a saved combo (and to the hub, which maps them to its own classes);
// the class strings must stay literal here so Tailwind generates them. Hypertheory's current mark has no hover effect.
export const HOVERS: Record<string, { label: string; cls: string }> = {
  none: { label: "None", cls: "" },
  rotate: { label: "Quarter turn", cls: "transition-transform duration-500 ease-in-out group-hover:rotate-90" },
  spin: { label: "Full spin", cls: "transition-transform duration-700 ease-in-out group-hover:rotate-360" },
  flip: { label: "Flip", cls: "transition-transform duration-700 ease-in-out group-hover:transform-[rotateY(360deg)]" },
  lift: { label: "Lift", cls: "transition-transform duration-500 ease-in-out group-hover:-translate-y-0.5" },
  grow: { label: "Grow", cls: "transition-transform duration-300 ease-out group-hover:scale-125" },
  tilt: { label: "Tilt", cls: "transition-transform duration-300 ease-out group-hover:rotate-12" },
  wiggle: { label: "Wiggle", cls: "lab-wiggle" },
  bounce: { label: "Bounce", cls: "lab-bounce" },
  pulse: { label: "Pulse", cls: "lab-pulse" },
  glow: { label: "Glow", cls: "transition-[filter] duration-300 group-hover:drop-shadow-[0_0_6px_currentColor]" },
  fire: { label: "Fire", cls: "lab-fire" },
};
export const HOVER_CSS = `
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

// Fire: an animated turbulence field displaces the mark's edges so the flame tongues lick and flicker while
// hovered (the transform above adds the breathing). Injected once, outside the panel, so the header keeps its
// effect while the panel is hidden.
export const FIRE_FILTER = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="lab-fire" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="0.07 0.14" numOctaves="2" seed="1" result="noise"><animate attributeName="baseFrequency" values="0.07 0.14;0.1 0.18;0.06 0.12;0.09 0.15;0.07 0.14" dur="0.9s" repeatCount="indefinite"/><animate attributeName="seed" values="1;3;5;7;2;4;6;8" calcMode="discrete" dur="1.3s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>`;

export function ensureLabStyles() {
  if (typeof document === "undefined" || document.getElementById("lab-hover-css")) return;
  const style = document.createElement("style");
  style.id = "lab-hover-css";
  style.textContent = HOVER_CSS;
  document.head.appendChild(style);
  const host = document.createElement("div");
  host.id = "lab-fire-filter";
  host.innerHTML = FIRE_FILTER;
  document.body.appendChild(host);
}

export type LabState = {
  hover: string | null;
  icon: LabIconRef | null;
  fontFamily: string | null;
  weight: number;
  casing: Casing;
  tracking: Tracking;
  size: number;
};

export const DEFAULT_LAB: LabState = {
  hover: null,
  icon: null,
  fontFamily: null,
  weight: 500,
  casing: "upper",
  tracking: "wide",
  size: 20,
};

let state: LabState = DEFAULT_LAB;
const listeners = new Set<() => void>();

export function setLab(next: Partial<LabState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function useLab(): LabState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => DEFAULT_LAB,
  );
}

export const BRAND = "Hypertheory";

export const CASING: Record<Casing, string> = {
  lower: BRAND.toLowerCase(),
  title: BRAND,
  upper: BRAND.toUpperCase(),
};

export const TRACKING: Record<Tracking, string> = {
  tight: "tracking-tight",
  normal: "tracking-normal",
  wide: "tracking-widest",
};
