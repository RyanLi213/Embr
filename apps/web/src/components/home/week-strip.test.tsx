import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckIn } from "@/lib/check-in";
import { saveCheckIn } from "@/lib/store-load-check-in";

import { WeekStrip } from "./week-strip";

const checkIn = (date: string, answers: Partial<CheckIn> = {}): CheckIn => ({
  date,
  pain: 2,
  stiffness: 2,
  energy: 4,
  mood: 4,
  overall: 4,
  flare: false,
  note: "",
  ...answers,
});

describe("WeekStrip", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("colours each day by its check-in", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 9)); // a Wednesday
    saveCheckIn(checkIn("2026-11-16")); // Monday: a good day
    saveCheckIn(checkIn("2026-11-17", { flare: true })); // Tuesday: a flare
    saveCheckIn(checkIn("2026-11-18", { pain: 5, stiffness: 5, energy: 1, mood: 1, overall: 1 }));

    render(<WeekStrip />);
    const days = within(screen.getByRole("list", { name: "This week" })).getAllByRole("listitem");

    expect(days[0]).toHaveTextContent("Monday: good day");
    expect(days[1]).toHaveTextContent("Tuesday: flare day");
    expect(days[2]).toHaveTextContent("Wednesday: today, hard day");
    expect(days[3]).toHaveTextContent("Thursday: still to come");
  });

  it("lists this week from Monday and points out today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 9)); // a Wednesday

    render(<WeekStrip />);
    const days = within(screen.getByRole("list", { name: "This week" })).getAllByRole("listitem");

    expect(days).toHaveLength(7);
    expect(days[0]).toHaveTextContent("Monday: no check-in");
    expect(days[2]).toHaveTextContent("Wednesday: today, not checked in yet");
    expect(days[2]).toHaveTextContent("Today");
    expect(days[6]).toHaveTextContent("Sunday: still to come");
  });

  it("shows plain dots on the server, before the visitor's date is known", () => {
    const html = renderToString(<WeekStrip />);

    expect(html).toContain("This week");
    expect(html).not.toContain("Today");
  });
});
