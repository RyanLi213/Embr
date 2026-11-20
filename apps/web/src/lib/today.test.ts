import { describe, expect, it } from "vitest";

import { formatDateLabel, greetingFor, toDateKey, weekOf } from "./today";

// Local times. Note: months count from 0, so 10 is November.
const at = (month: number, day: number, hour = 9, minute = 0) =>
  new Date(2026, month, day, hour, minute).getTime();

describe("greetingFor", () => {
  it.each([
    [4, 59, "Good evening"],
    [5, 0, "Good morning"],
    [11, 59, "Good morning"],
    [12, 0, "Good afternoon"],
    [16, 59, "Good afternoon"],
    [17, 0, "Good evening"],
    [23, 30, "Good evening"],
  ])("at %i:%i says %s", (hour, minute, expected) => {
    expect(greetingFor(at(10, 18, hour, minute))).toBe(expected);
  });
});

describe("formatDateLabel", () => {
  it("writes the weekday, month and day", () => {
    expect(formatDateLabel(at(10, 18))).toBe("Wednesday, November 18");
  });
});

describe("toDateKey", () => {
  it("pads the month and day", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("uses the local date late in the evening, not UTC's", () => {
    expect(toDateKey(at(10, 18, 23, 59))).toBe("2026-11-18");
  });
});

describe("weekOf", () => {
  it("runs Monday to Sunday around a Wednesday", () => {
    const week = weekOf(at(10, 18));

    expect(week.map((d) => d.date)).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
    expect(week.map((d) => d.when)).toEqual([
      "past",
      "past",
      "today",
      "future",
      "future",
      "future",
      "future",
    ]);
    expect(week[0].name).toBe("Monday");
  });

  it("puts Sunday at the end of the week, not the start", () => {
    const week = weekOf(at(10, 22)); // a Sunday
    expect(week[0].date).toBe("2026-11-16");
    expect(week[6]).toMatchObject({ date: "2026-11-22", when: "today" });
  });

  it("crosses into the previous month", () => {
    const week = weekOf(at(10, 1)); // Sunday, November 1
    expect(week[0].date).toBe("2026-10-26");
  });
});
