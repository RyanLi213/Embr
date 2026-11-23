"use client";

import { Check } from "lucide-react";

import { DAY_TINT } from "@/components/check-in/day-colours";
import { describeDay } from "@/lib/calendar";
import { type DayColour, dayColour } from "@/lib/check-in";
import { weekOf, type WeekDay } from "@/lib/today";
import { useCheckIns } from "@/lib/use-check-ins";
import { useCurrentHour } from "@/lib/use-current-hour";
import { cn } from "@/lib/utils";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function dotStyle(when: WeekDay["when"] | undefined, colour: DayColour | undefined) {
  if (colour) return cn(DAY_TINT[colour], when === "today" && "ring-2 ring-ember ring-offset-2");
  if (when === "today") return "border-2 border-ember bg-card";
  if (when === "future") return "border border-dashed border-[#d7cbbb]";
  return "bg-muted";
}

/** This week as seven dots, Monday to Sunday, coloured by each day's check-in. */
export function WeekStrip() {
  const hour = useCurrentHour();
  const checkIns = useCheckIns();
  const days = hour === null ? null : weekOf(hour);

  return (
    <ol aria-label="This week" className="mt-[18px] flex justify-between md:mt-[23px]">
      {LETTERS.map((letter, i) => {
        const day = days?.[i];
        const isToday = day?.when === "today";
        const saved = day && checkIns?.[day.date];
        const colour = saved ? dayColour(saved) : undefined;
        return (
          <li
            key={i}
            className="min-w-[35px] text-center text-xs font-extrabold text-muted-foreground md:min-w-[43px]"
          >
            <span aria-hidden>{letter}</span>
            {day && <span className="sr-only">{`${day.name}: ${describeDay(day.when, colour)}`}</span>}
            <span
              aria-hidden
              className={cn(
                "mx-auto mt-1.5 grid size-[34px] place-items-center rounded-full md:size-[38px]",
                dotStyle(day?.when, colour),
              )}
            >
              {colour ? (
                <Check className="size-[18px]" />
              ) : (
                isToday && <span className="size-2 rounded-full bg-ember" />
              )}
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
