import type { CSSProperties } from "react";

/**
 * Compass mark: a carved sun-compass dial (bearing notches) around a compass rose. North is a
 * Tiwaz rune (ᛏ), the Norse arrow of guidance, and the faint diagonals echo the eight arms of the
 * Vegvísir way-finder stave.
 */
const palette = {
  "--ring": "#1d5fea",
  "--arm": "#1b3fa9",
  "--arm-l": "#59a1fb",
  "--north": "#f59e0b",
  "--north-d": "#b45309",
  "--hub": "#0f172a",
  "--hole": "#ffffff",
} as CSSProperties;

export function CompassMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={palette} aria-hidden>
      <circle cx="16" cy="16" r="14.2" fill="none" stroke="var(--ring)" strokeWidth="1.6"/>
      <line x1="20.44" y1="5.28" x2="21.05" y2="3.8" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="24.63" y1="7.37" x2="25.33" y2="6.67" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="26.72" y1="11.56" x2="28.2" y2="10.95" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="26.72" y1="20.44" x2="28.2" y2="21.05" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="24.63" y1="24.63" x2="25.33" y2="25.33" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="20.44" y1="26.72" x2="21.05" y2="28.2" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="11.56" y1="26.72" x2="10.95" y2="28.2" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="7.37" y1="24.63" x2="6.67" y2="25.33" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="5.28" y1="20.44" x2="3.8" y2="21.05" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="5.28" y1="11.56" x2="3.8" y2="10.95" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="7.37" y1="7.37" x2="6.67" y2="6.67" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="11.56" y1="5.28" x2="10.95" y2="3.8" stroke="var(--ring)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="18.4" y1="13.6" x2="22.22" y2="9.78" stroke="var(--arm)" strokeWidth="1.2" strokeLinecap="round" opacity=".55"/>
      <line x1="20.47" y1="9.37" x2="22.63" y2="11.53" stroke="var(--arm)" strokeWidth="1.2" strokeLinecap="round" opacity=".55"/>
      <line x1="18.4" y1="18.4" x2="22.22" y2="22.22" stroke="var(--arm)" strokeWidth="1.2" strokeLinecap="round" opacity=".55"/>
      <line x1="22.63" y1="20.47" x2="20.47" y2="22.63" stroke="var(--arm)" strokeWidth="1.2" strokeLinecap="round" opacity=".55"/>
      <line x1="13.6" y1="18.4" x2="9.78" y2="22.22" stroke="var(--arm)" strokeWidth="1.2" strokeLinecap="round" opacity=".55"/>
      <line x1="11.53" y1="22.63" x2="9.37" y2="20.47" stroke="var(--arm)" strokeWidth="1.2" strokeLinecap="round" opacity=".55"/>
      <line x1="13.6" y1="13.6" x2="9.78" y2="9.78" stroke="var(--arm)" strokeWidth="1.2" strokeLinecap="round" opacity=".55"/>
      <line x1="9.37" y1="11.53" x2="11.53" y2="9.37" stroke="var(--arm)" strokeWidth="1.2" strokeLinecap="round" opacity=".55"/>
      <path d="M16 4L13.3 16L16 16Z" fill="var(--north)"/>
      <path d="M16 4L18.7 16L16 16Z" fill="var(--north-d)"/>
      <path d="M26.4 16L16 13.3L16 16Z" fill="var(--arm-l)"/>
      <path d="M26.4 16L16 18.7L16 16Z" fill="var(--arm)"/>
      <path d="M16 26.4L18.7 16L16 16Z" fill="var(--arm-l)"/>
      <path d="M16 26.4L13.3 16L16 16Z" fill="var(--arm)"/>
      <path d="M5.6 16L16 18.7L16 16Z" fill="var(--arm-l)"/>
      <path d="M5.6 16L16 13.3L16 16Z" fill="var(--arm)"/>
      <line x1="16" y1="4" x2="12.92" y2="7.97" stroke="var(--north-d)" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="16" y1="4" x2="19.08" y2="7.97" stroke="var(--north-d)" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="1.9" fill="var(--hub)"/>
      <circle cx="16" cy="16" r="0.8" fill="var(--hole)"/>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <CompassMark />
      <span>Compass</span>
    </span>
  );
}
