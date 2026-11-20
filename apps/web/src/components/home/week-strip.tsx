"use client";

import { weekOf, type WeekDay } from "@/lib/today";
import { useCurrentHour } from "@/lib/use-current-hour";
import { cn } from "@/lib/utils";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// What a screen reader says for each day
const DESCRIPTION: Record<WeekDay["when"], string> = {
  past: "no check-in",
  today: "today, not checked in yet",
  future: "still to come",
};

function dotStyle(when: WeekDay["when"] | undefined) {
  if (when === "today") return "border-2 border-ember bg-card";
  if (when === "future") return "border border-dashed border-[#d7cbbb]";
  return "bg-muted";
}

/**
 * This week as seven dots, Monday to Sunday, with today circled. The dots
 * get their good, okay or hard colours once check-ins are saved (next branch).
 */
export function WeekStrip() {
  const hour = useCurrentHour();
  const days = hour === null ? null : weekOf(hour);

  return (
    <ol aria-label="This week" className="mt-[18px] flex justify-between md:mt-[23px]">
      {LETTERS.map((letter, i) => {
        const day = days?.[i];
        const isToday = day?.when === "today";
        return (
          <li
            key={i}
            className="min-w-[35px] text-center text-xs font-extrabold text-muted-foreground md:min-w-[43px]"
          >
            <span aria-hidden>{letter}</span>
            {day && <span className="sr-only">{`${day.name}: ${DESCRIPTION[day.when]}`}</span>}
            <span
              aria-hidden
              className={cn(
                "mx-auto mt-1.5 grid size-[34px] place-items-center rounded-full md:size-[38px]",
                dotStyle(day?.when),
              )}
            >
              {isToday && <span className="size-2 rounded-full bg-ember" />}
            </span>
            {isToday && (
              <span aria-hidden className="mt-1 block text-[11px] text-primary">
                Today
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
