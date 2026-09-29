"use client"; // EPHEMERAL: logo creator
import Link from "next/link";
import LogoIcon from "./LogoIcon";
// EPHEMERAL: logo creator wiring, remove the creator imports and branches once a logo is chosen.
import { CASING, HOVERS, TRACKING, pathProps, svgProps, useLab } from "./creator/store";

export default function AppLogo({ href }: { href: string }) {
  const lab = useLab(); // EPHEMERAL: logo creator
  const hover = lab.hover === null ? "transition-transform duration-500 ease-in-out group-hover:-translate-y-0.5" : HOVERS[lab.hover]?.cls ?? ""; // EPHEMERAL: logo creator
  return (
    <Link href={href} className="group flex items-center gap-1">
      {lab.icon ? ( // EPHEMERAL: logo creator
        <svg
          viewBox={lab.icon.viewBox}
          {...svgProps(lab.icon)}
          className={`text-primary shrink-0 ${hover}`}
          style={{ width: lab.size, height: lab.size }}
        >
          <path d={lab.icon.d} {...pathProps(lab.icon)} />
        </svg>
      ) : (
        <LogoIcon className={`w-5.5 h-5.5 text-primary ${hover}`} />
      )}
      <span
        className={`text-sm md:text-base text-main ${TRACKING[lab.tracking]} ${lab.fontFamily ? "" : "font-medium font-display"}`}
        style={lab.fontFamily ? { fontFamily: lab.fontFamily, fontWeight: lab.weight } : undefined}
      >
        {CASING[lab.casing]}
      </span>
    </Link>
  );
}
