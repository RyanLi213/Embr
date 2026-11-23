import type { DayColour } from "@/lib/check-in";

/** A solid dot for each day colour, as in the colour key */
export const DAY_DOT: Record<DayColour, string> = {
  good: "bg-day-good",
  okay: "bg-day-okay",
  hard: "bg-day-hard",
  flare: "bg-day-flare",
};

/** A soft square with a darker dot, for the month calendar (from the Figma) */
export const DAY_SQUARE: Record<DayColour, { square: string; dot: string }> = {
  good: { square: "bg-[#e3f5e9]", dot: "bg-[#4c9c68]" },
  okay: { square: "bg-[#fff2d4]", dot: "bg-[#d4941c]" },
  hard: { square: "bg-[#ffe2e7]", dot: "bg-[#d95369]" },
  flare: { square: "bg-[#f0ddf4]", dot: "bg-[#9552a4]" },
};

/** A soft background with a darker tick, for the week strip (from the Figma) */
export const DAY_TINT: Record<DayColour, string> = {
  good: "bg-[#c6ecd3] text-[#186d3e]",
  okay: "bg-[#ffdda0] text-[#805005]",
  hard: "bg-[#ffc4cd] text-[#a22e41]",
  flare: "bg-[#f0ddf4] text-[#9552a4]",
};
