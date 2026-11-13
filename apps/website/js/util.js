// Small helpers shared by the scene and the Embr character.

export const NS = 'http://www.w3.org/2000/svg';

/** Create an SVG element with attributes, optionally appended to a parent. */
export function make(tag, attrs = {}, parent) {
  const node = document.createElementNS(NS, tag);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  if (parent) parent.appendChild(node);
  return node;
}

/** Seeded random numbers, so the drawn scene looks the same on every visit. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** 0..1 progress of p between a and b */
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const f1 = (n) => Math.round(n * 10) / 10;

/** Height of the walking ground (world units) at position x. Shared by the
 *  hills and by Embr, so his feet always land on the grass. */
export const groundY = (x) => 662 + 22 * Math.sin(x / 520 + 1.1) + 9 * Math.sin(x / 230 + 0.3);
