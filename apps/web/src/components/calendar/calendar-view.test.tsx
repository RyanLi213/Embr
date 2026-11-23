import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckIn } from "@/lib/check-in";
import { saveCheckIn } from "@/lib/store-load-check-in";

import { CalendarView } from "./calendar-view";

// Made-up answers: a good day unless a test changes some of them
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

const HARD = { pain: 4, stiffness: 3, energy: 2, mood: 2, overall: 2 };

/** A day's button, found by the start of what a screen reader says */
const day = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}:`) });
const details = () => screen.getByRole("region", { name: /day|check-in/i });
const dayHeading = () => screen.getByRole("heading", { level: 2, name: /day|check-in/i });

describe("CalendarView", () => {
  beforeEach(() => {
    localStorage.clear();
    // Only the clock is faked, so everything else runs as normal
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 22, 19)); // 7 pm on Sunday, November 22
    // The test browser can't scroll, so stand in for it
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on this month, showing today", () => {
    render(<CalendarView />);

    expect(screen.getByRole("heading", { name: "November 2026" })).toBeInTheDocument();
    expect(day("Sunday, November 22")).toHaveAccessibleName(
      "Sunday, November 22: today, not checked in yet",
    );
    expect(day("Sunday, November 22")).toHaveAttribute("aria-pressed", "true");
    expect(dayHeading()).toHaveTextContent("No check-in yet");
    expect(screen.getByRole("link", { name: "Check in now" })).toHaveAttribute("href", "/check-in");
  });

  it("tells each day's colour from its check-in", () => {
    saveCheckIn(checkIn("2026-11-21"));
    saveCheckIn(checkIn("2026-11-20", HARD));
    saveCheckIn(checkIn("2026-11-09", { flare: true }));
    render(<CalendarView />);

    expect(day("Saturday, November 21")).toHaveAccessibleName("Saturday, November 21: good day");
    expect(day("Friday, November 20")).toHaveAccessibleName("Friday, November 20: hard day");
    expect(day("Monday, November 9")).toHaveAccessibleName("Monday, November 9: flare day");
    expect(day("Thursday, November 19")).toHaveAccessibleName("Thursday, November 19: no check-in");
  });

  it.each([
    { name: "good", answers: {}, heading: "A good day" },
    { name: "okay", answers: { pain: 3, stiffness: 3, energy: 3, mood: 3, overall: 3 }, heading: "An okay day" },
    { name: "hard", answers: HARD, heading: "A harder day" },
    { name: "flare", answers: { flare: true }, heading: "A flare day" },
  ])("names a $name day", ({ answers, heading }) => {
    saveCheckIn(checkIn("2026-11-20", answers));
    render(<CalendarView />);

    fireEvent.click(day("Friday, November 20"));
    expect(dayHeading()).toHaveTextContent(heading);
  });

  it("shows a past day's answers and note when it is tapped", () => {
    saveCheckIn(checkIn("2026-11-20", { ...HARD, note: "Felt better after a warm shower" }));
    render(<CalendarView />);

    fireEvent.click(day("Friday, November 20"));

    expect(day("Friday, November 20")).toHaveAttribute("aria-pressed", "true");
    expect(day("Sunday, November 22")).toHaveAttribute("aria-pressed", "false");
    const panel = details();
    expect(panel).toHaveTextContent("Friday, November 20");
    expect(panel).toHaveTextContent("Pain was loud and your mood felt a bit grey.");
    expect(within(panel).getByText("Pain").nextSibling).toHaveTextContent("Loud");
    expect(within(panel).getByText("Overall").nextSibling).toHaveTextContent("Rough edges");
    expect(panel).toHaveTextContent("Note: “Felt better after a warm shower”");
    // Only today's check-in can be opened again
    expect(within(panel).queryByRole("link")).not.toBeInTheDocument();
  });

  it("scrolls the details into view after a tap, for phones", () => {
    render(<CalendarView />);

    fireEvent.click(day("Thursday, November 19"));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("offers today's check-in once it is done", () => {
    saveCheckIn(checkIn("2026-11-22"));
    render(<CalendarView />);

    expect(dayHeading()).toHaveTextContent("A good day");
    expect(screen.getByRole("link", { name: "View today’s check-in" })).toHaveAttribute(
      "href",
      "/check-in",
    );
  });

  it("says so when a past day has no check-in", () => {
    render(<CalendarView />);

    fireEvent.click(day("Thursday, November 19"));

    expect(dayHeading()).toHaveTextContent("No check-in");
    expect(details()).toHaveTextContent("There isn’t a check-in for this day.");
    expect(screen.queryByRole("link", { name: "Check in now" })).not.toBeInTheDocument();
  });

  it("doesn't let future days be picked", () => {
    render(<CalendarView />);

    expect(day("Monday, November 23")).toBeDisabled();
    expect(day("Monday, November 23")).toHaveAccessibleName("Monday, November 23: still to come");
  });

  it("goes back a month and forward again, but not past this month", () => {
    saveCheckIn(checkIn("2026-10-15"));
    render(<CalendarView />);
    const next = screen.getByRole("button", { name: "Next month" });
    expect(next).toBeDisabled();

    fireEvent.click(day("Friday, November 20"));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeInTheDocument();
    expect(day("Thursday, October 15")).toHaveAccessibleName("Thursday, October 15: good day");
    // The day picked in November doesn't stay picked
    expect(screen.getByRole("heading", { level: 2, name: "Pick a day" })).toBeInTheDocument();
    expect(next).toBeEnabled();

    fireEvent.click(next);
    expect(screen.getByRole("heading", { name: "November 2026" })).toBeInTheDocument();
    expect(day("Sunday, November 22")).toHaveAttribute("aria-pressed", "true");
  });

  it("waits for the browser before showing any days", () => {
    const html = renderToString(<CalendarView />);

    expect(html).toContain("aria-busy");
    expect(html).not.toContain("November");
  });
});
