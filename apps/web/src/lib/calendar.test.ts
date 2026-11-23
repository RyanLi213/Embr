import { describe, expect, it } from "vitest";

import {
  addMonths,
  dayLabel,
  describeDay,
  monthLabel,
  monthLayout,
  monthOf,
  whenIs,
} from "./calendar";

describe("monthOf", () => {
  it("counts months from 1, not 0 like JavaScript does", () => {
    expect(monthOf(new Date(2026, 10, 22, 19).getTime())).toEqual({ year: 2026, month: 11 });
  });
});

describe("addMonths", () => {
  it.each([
    { name: "goes back a month", from: { year: 2026, month: 11 }, count: -1, to: { year: 2026, month: 10 } },
    { name: "goes back into last year", from: { year: 2026, month: 1 }, count: -1, to: { year: 2025, month: 12 } },
    { name: "goes forward into next year", from: { year: 2026, month: 12 }, count: 1, to: { year: 2027, month: 1 } },
    { name: "goes back more than a year", from: { year: 2026, month: 3 }, count: -15, to: { year: 2024, month: 12 } },
    { name: "stays put for 0", from: { year: 2026, month: 11 }, count: 0, to: { year: 2026, month: 11 } },
  ])("$name", ({ from, count, to }) => {
    expect(addMonths(from, count)).toEqual(to);
  });
});

describe("monthLabel", () => {
  it("writes the month and year", () => {
    expect(monthLabel({ year: 2026, month: 11 })).toBe("November 2026");
  });
});

describe("monthLayout", () => {
  it("pushes a month that starts on Sunday to the end of the first week", () => {
    const { blanks, dates } = monthLayout({ year: 2026, month: 11 }); // November 1 is a Sunday

    expect(blanks).toBe(6);
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe("2026-11-01");
    expect(dates.at(-1)).toBe("2026-11-30");
  });

  it("needs no blanks when a month starts on Monday", () => {
    expect(monthLayout({ year: 2026, month: 6 }).blanks).toBe(0); // June 1 is a Monday
  });

  it.each([
    { name: "a 31-day month", year: 2026, month: 12, days: 31 },
    { name: "February", year: 2026, month: 2, days: 28 },
    { name: "February in a leap year", year: 2028, month: 2, days: 29 },
  ])("has the right number of days in $name", ({ year, month, days }) => {
    expect(monthLayout({ year, month }).dates).toHaveLength(days);
  });
});

describe("dayLabel", () => {
  it("writes a saved date in words", () => {
    expect(dayLabel("2026-11-22")).toBe("Sunday, November 22");
  });
});

describe("whenIs", () => {
  it.each([
    { date: "2026-11-21", when: "past" },
    { date: "2026-11-22", when: "today" },
    { date: "2026-11-23", when: "future" },
    { date: "2025-12-31", when: "past" },
    { date: "2027-01-01", when: "future" },
  ])("calls $date $when", ({ date, when }) => {
    expect(whenIs(date, "2026-11-22")).toBe(when);
  });
});

describe("describeDay", () => {
  it.each([
    { when: "past", colour: "good", says: "good day" },
    { when: "today", colour: "flare", says: "today, flare day" },
    { when: "past", colour: undefined, says: "no check-in" },
    { when: "today", colour: undefined, says: "today, not checked in yet" },
    { when: "future", colour: undefined, says: "still to come" },
  ] as const)("says “$says”", ({ when, colour, says }) => {
    expect(describeDay(when, colour)).toBe(says);
  });
});
