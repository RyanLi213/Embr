"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { addMonths, monthOf } from "@/lib/calendar";
import { toDateKey } from "@/lib/today";
import { useCheckIns } from "@/lib/use-check-ins";
import { useCurrentHour } from "@/lib/use-current-hour";

import { DayDetails } from "./day-details";
import { MonthGrid } from "./month-grid";

/** The month calendar and the picked day's details, side by side on computers. */
export function CalendarView() {
  const hour = useCurrentHour();
  const checkIns = useCheckIns();
  // How many months back from this one, and the day that was tapped, if any
  const [monthsBack, setMonthsBack] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const details = useRef<HTMLElement>(null);

  function pickDay(date: string) {
    // Show the new day straight away, so the scroll below sees its real size
    flushSync(() => setPicked(date));
    // On phones the details sit below the calendar, out of sight. Scroll just
    // enough to show them; nothing moves if they're already in view.
    details.current?.scrollIntoView({ block: "nearest" });
  }

  // Saved check-ins and today's date are only known in the browser
  if (hour === null || checkIns === null) return <div aria-busy className="min-h-[520px]" />;

  const today = toDateKey(hour);
  const month = addMonths(monthOf(hour), -monthsBack);
  // Until a day is tapped, this month shows today, and other months show nothing
  const selected = picked ?? (monthsBack === 0 ? today : null);

  function showMonth(back: number) {
    setMonthsBack(back);
    setPicked(null);
  }

  return (
    <div className="grid items-start gap-[22px] xl:grid-cols-[minmax(0,1.6fr)_minmax(270px,0.75fr)]">
      <MonthGrid
        month={month}
        today={today}
        checkIns={checkIns}
        selected={selected}
        onSelect={pickDay}
        onPrevious={() => showMonth(monthsBack + 1)}
        onNext={() => showMonth(monthsBack - 1)}
        canGoNext={monthsBack > 0}
      />
      <DayDetails
        ref={details}
        date={selected}
        today={today}
        checkIn={selected ? checkIns[selected] : undefined}
      />
    </div>
  );
}
