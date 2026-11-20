import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WeekStrip } from "./week-strip";

describe("WeekStrip", () => {
  afterEach(() => {
    vi.useRealTimers();
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
