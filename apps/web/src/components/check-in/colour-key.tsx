import type { DayColour } from "@/lib/check-in";
import { COLOUR_NAMES } from "@/lib/check-in-questions";
import { cn } from "@/lib/utils";

import { DAY_DOT } from "./day-colours";

const COLOURS: readonly DayColour[] = ["good", "okay", "hard", "flare"];

/** What each day colour means, shown under the week strip and the calendar. */
export function ColourKey({ className }: { className?: string }) {
  return (
    <ul
      aria-label="Colour key"
      className={cn("flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-muted-foreground", className)}
    >
      {COLOURS.map((colour) => (
        <li key={colour} className="flex items-center gap-1.5">
          <span aria-hidden className={`size-2 rounded-full ${DAY_DOT[colour]}`} />
          {COLOUR_NAMES[colour]}
        </li>
      ))}
    </ul>
  );
}
