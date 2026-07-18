export interface IconOpts {
  /** Kantenlänge in px (Standard 512). */
  size?: number;
  /** Eckenrundung des Hintergrunds als Anteil der Kantenlänge (0 = eckig). */
  radius?: number;
  /** Innenabstand des „t" als Anteil der Kantenlänge (Safe-Zone). */
  pad?: number;
  /** Gold-Punkt anzeigen (bei sehr kleinen Größen weglassen). */
  dot?: boolean;
  /** Hintergrundfarbe (Standard weiß; für Apple ohne Transparenz). */
  bg?: string;
}

export function iconSvg(opts?: IconOpts): string;
export function iconDataUri(opts?: IconOpts): string;
