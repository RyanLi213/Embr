/**
 * Helpers for the month calendar. Like the rest of the app, everything uses
 * the visitor's own clock and time zone.
 */

import type { DayColour } from "./check-in";
import { formatDateLabel, toDateKey, type WeekDay } from "./today";

/** A month of a year. `month` counts from 1 (January) to 12 (December). */
export type Month = { year: number; month: number };

/** The month a moment falls in */
export function monthOf(time: number): Month {
  const date = new Date(time);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** The month `count` months later, or earlier when `count` is negative */
export function addMonths({ year, month }: Month, count: number): Month {
  // Date rolls over by itself: month 13 becomes January of the next year
  const date = new Date(year, month - 1 + count, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** For example "November 2026" */
export function monthLabel({ year, month }: Month): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });
}

export type MonthLayout = {
  /** Empty squares before the 1st, so it sits under the right weekday */
  blanks: number;
  /** Every day of the month, as YYYY-MM-DD */
  dates: string[];
};

/** How a month sits on a calendar whose weeks start on Monday, as in the design. */
export function monthLayout({ year, month }: Month): MonthLayout {
  const first = new Date(year, month - 1, 1);
  // Day 0 of the next month is the last day of this one: 28, 29, 30 or 31
  const length = new Date(year, month, 0).getDate();
  return {
    blanks: (first.getDay() + 6) % 7, // getDay() counts from Sunday = 0
    dates: Array.from({ length }, (_, i) => toDateKey(new Date(year, month - 1, i + 1))),
  };
}

/** A day (YYYY-MM-DD) in words, for example "Sunday, November 22" */
export function dayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return formatDateLabel(new Date(year, month - 1, day).getTime());
}

/** Whether a day (YYYY-MM-DD) is before, on or after today */
export function whenIs(date: string, today: string): WeekDay["when"] {
  // Dates written as YYYY-MM-DD sort in the same order as the days themselves
  if (date < today) return "past";
  if (date === today) return "today";
  return "future";
}

// What a screen reader says for a day with no check-in
const NO_CHECK_IN: Record<WeekDay["when"], string> = {
  past: "no check-in",
  today: "today, not checked in yet",
  future: "still to come",
};

/** What a screen reader says about a day, for example "today, good day" */
export function describeDay(when: WeekDay["when"], colour: DayColour | undefined): string {
  if (!colour) return NO_CHECK_IN[when];
  return when === "today" ? `today, ${colour} day` : `${colour} day`;
}
