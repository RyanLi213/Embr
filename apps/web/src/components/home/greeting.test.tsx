import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Greeting } from "./greeting";

describe("Greeting", () => {
  beforeEach(() => {
    vi.useFakeTimers(); // a fake clock the test can set and move forward
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("greets by time of day and shows today's date", () => {
    vi.setSystemTime(new Date(2026, 10, 18, 9, 30)); // Wednesday, Nov 18, 9:30 am

    render(<Greeting />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Good morning, friend.");
    expect(screen.getByText("Wednesday, November 18")).toHaveAttribute("dateTime", "2026-11-18");
  });

  it("changes the greeting when the hour turns, without a reload", () => {
    vi.setSystemTime(new Date(2026, 10, 18, 11, 59, 30));
    render(<Greeting />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Good morning");

    act(() => {
      vi.advanceTimersByTime(60 * 1000); // one minute later: 12:00:30
    });

    expect(heading).toHaveTextContent("Good afternoon, friend.");
  });

  it("starts hidden on the server, which can't know the visitor's time", () => {
    const html = renderToString(<Greeting />);

    expect(html).toContain("Hello");
    expect(html).toContain("opacity-0");
  });
});
