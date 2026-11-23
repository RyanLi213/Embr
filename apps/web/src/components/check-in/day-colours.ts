import type { DayColour } from "@/lib/check-in";

/** A solid dot for each day colour, as in the colour key */
export const DAY_DOT: Record<DayColour, string> = {
  good: "bg-day-good",
  okay: "bg-day-okay",
  hard: "bg-day-hard",
  flare: "bg-day-flare",
};

/** A soft background with a darker tick, for the week strip (from the Figma) */
export const DAY_TINT: Record<DayColour, string> = {
  good: "bg-[#c6ecd3] text-[#186d3e]",
  okay: "bg-[#ffdda0] text-[#805005]",
  hard: "bg-[#ffc4cd] text-[#a22e41]",
  flare: "bg-[#f0ddf4] text-[#9552a4]",
};
