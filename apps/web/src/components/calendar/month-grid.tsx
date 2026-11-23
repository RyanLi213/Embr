import { ChevronLeft, ChevronRight } from "lucide-react";

import { ColourKey } from "@/components/check-in/colour-key";
import { DAY_SQUARE } from "@/components/check-in/day-colours";
import { Button } from "@/components/ui/button";
import { dayLabel, describeDay, type Month, monthLabel, monthLayout, whenIs } from "@/lib/calendar";
import { type CheckIn, type DayColour, dayColour } from "@/lib/check-in";
import type { CheckIns } from "@/lib/store-load-check-in";
import type { WeekDay } from "@/lib/today";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type MonthGridProps = {
  month: Month;
  /** Today as YYYY-MM-DD */
  today: string;
  checkIns: CheckIns;
  /** The day whose details are showing, if any */
  selected: string | null;
  onSelect: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  /** Off while showing this month: later months have no check-ins yet */
  canGoNext: boolean;
};

/** One month of days, Monday first, each coloured by its check-in. */
export function MonthGrid({
  month,
  today,
  checkIns,
  selected,
  onSelect,
  onPrevious,
  onNext,
  canGoNext,
}: MonthGridProps) {
  const { blanks, dates } = monthLayout(month);

  return (
    <section
      aria-labelledby="month-heading"
      className="rounded-[22px] border border-border bg-card px-2.5 py-[17px] shadow-[0_6px_20px_rgb(55_36_21/0.035)] md:p-7"
    >
      <div className="mb-[22px] flex items-center justify-between px-1.5 md:px-0">
        <MonthButton label="Previous month" onClick={onPrevious}>
          <ChevronLeft />
        </MonthButton>
        {/* Read out again when the month changes */}
        <h2 id="month-heading" aria-live="polite" className="text-2xl font-extrabold tracking-[-0.02em]">
          {monthLabel(month)}
        </h2>
        <MonthButton label="Next month" onClick={onNext} disabled={!canGoNext}>
          <ChevronRight />
        </MonthButton>
      </div>

      <div className="grid grid-cols-7 gap-[3px] md:gap-[7px]">
        {/* Each day's button already says its weekday, so screen readers skip these */}
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            aria-hidden
            className="pt-[5px] pb-2 text-center text-[10px] font-black text-muted-foreground uppercase"
          >
            {weekday}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden />
        ))}
        {dates.map((date) => (
          <DaySquare
            key={date}
            date={date}
            when={whenIs(date, today)}
            checkIn={checkIns[date]}
            selected={date === selected}
            onSelect={onSelect}
          />
        ))}
      </div>

      <ColourKey className="mt-[22px] justify-center gap-x-3 md:gap-x-5" />
    </section>
  );
}

type MonthButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function MonthButton({ label, onClick, disabled, children }: MonthButtonProps) {
  return (
    <Button
      variant="outline"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="size-12 rounded-full bg-card text-muted-foreground [&_svg:not([class*='size-'])]:size-6"
    >
      {children}
    </Button>
  );
}

type DaySquareProps = {
  date: string;
  when: WeekDay["when"];
  checkIn: CheckIn | undefined;
  selected: boolean;
  onSelect: (date: string) => void;
};

/** One day. Future days can't be tapped: there is nothing to show yet. */
function DaySquare({ date, when, checkIn, selected, onSelect }: DaySquareProps) {
  const colour = checkIn ? dayColour(checkIn) : undefined;

  return (
    <button
      type="button"
      aria-label={`${dayLabel(date)}: ${describeDay(when, colour)}`}
      aria-pressed={selected}
      disabled={when === "future"}
      onClick={() => onSelect(date)}
      className={cn(
        "relative aspect-square min-h-[43px] rounded-[10px] border-2 border-transparent font-extrabold transition-transform md:min-h-12 md:rounded-[14px]",
        squareStyle(when, colour),
        selected && "scale-[0.96] border-foreground",
      )}
    >
      {Number(date.slice(8))}
      {colour && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-1 left-1/2 size-[7px] -translate-x-1/2 rounded-full md:bottom-2",
            DAY_SQUARE[colour].dot,
          )}
        />
      )}
    </button>
  );
}

function squareStyle(when: WeekDay["when"], colour: DayColour | undefined) {
  // Today keeps its colour once checked in, with an ember ring to find it
  if (colour) return cn(DAY_SQUARE[colour].square, when === "today" && "ring-2 ring-ember ring-offset-2");
  if (when === "today") return "bg-primary text-primary-foreground";
  if (when === "future") return "border-dashed border-[#e6dccd] text-muted-foreground";
  return "bg-[#faf8f4]";
}
