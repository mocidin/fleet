// EPHEMERAL: resolves icons for the Logo Creator, from the curated list first, then a per-browser cache, then a fetch from game-icons on GitHub.
import { useSyncExternalStore } from "react";
import { LAB_ICONS, type LabIcon } from "./icons";

const CACHE_KEY = "logo-creator:icon-cache";
const cache = new Map<string, LabIcon>();
const pending = new Map<string, Promise<LabIcon | null>>();
const listeners = new Set<() => void>();
let version = 0;
let loaded = false;

function loadCache() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") as Record<string, LabIcon>;
    for (const k in raw) cache.set(k, raw[k]);
  } catch {}
}

// Debounced: browsing a whole author lands hundreds of icons in a burst, one write per icon would be O(n^2).
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function saveCache() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(cache)));
    } catch {}
  }, 500);
}

export function resolveIcon(by: string, name: string): LabIcon | undefined {
  loadCache();
  return LAB_ICONS.find((i) => i.name === name && i.by === by) ?? cache.get(`${by}/${name}`);
}

export function fetchIcon(by: string, name: string): Promise<LabIcon | null> {
  const have = resolveIcon(by, name);
  if (have) return Promise.resolve(have);
  const key = `${by}/${name}`;
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const p = fetch(`https://raw.githubusercontent.com/game-icons/icons/master/${by}/${name}.svg`)
    .then((r) => (r.ok ? r.text() : ""))
    .then((svg) => {
      const ds = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]).filter((d) => !/^M0 0h512v512H0z/i.test(d));
      if (!ds.length) return null;
      const icon: LabIcon = { name, by, viewBox: "0 0 512 512", d: ds.join(" ") };
      cache.set(key, icon);
      saveCache();
      version++;
      listeners.forEach((l) => l());
      return icon;
    })
    .catch(() => null)
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}

export function useIconVersion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => 0,
  );
}
