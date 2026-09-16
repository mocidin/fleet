"use client"; // EPHEMERAL: logo creator
import Link from "next/link";
import { GiAtomicSlashes } from "react-icons/gi";
// EPHEMERAL: logo creator wiring, remove the creator imports and branches once a logo is chosen.
import { CASING, HOVERS, TRACKING, pathProps, svgProps, useLab } from "./creator/store";

// Global wordmark. Orbitron is the official logo face; Atomic Slashes is the mark.
export default function AppLogo({ href }: { href: string }) {
  const lab = useLab(); // EPHEMERAL: logo creator
  const hover = lab.hover === null ? "" : HOVERS[lab.hover]?.cls ?? ""; // EPHEMERAL: logo creator
  return (
    <Link href={href} aria-label="Hypertheory" className="group flex items-center gap-1">
      {lab.icon ? ( // EPHEMERAL: logo creator
        <svg
          viewBox={lab.icon.viewBox}
          {...svgProps(lab.icon)}
          className={`text-main shrink-0 ${hover}`}
          style={{ width: lab.size, height: lab.size }}
        >
          <path d={lab.icon.d} {...pathProps(lab.icon)} />
        </svg>
      ) : (
        <GiAtomicSlashes className={`w-5 h-5 text-main shrink-0 ${hover}`} />
      )}
      <span
        className={`text-base text-main ${TRACKING[lab.tracking]} ${lab.fontFamily ? "" : "font-medium font-orbitron"}`}
        style={lab.fontFamily ? { fontFamily: lab.fontFamily, fontWeight: lab.weight } : undefined}
      >
        {CASING[lab.casing]}
      </span>
    </Link>
  );
}
