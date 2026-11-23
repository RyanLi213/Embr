import { fireEvent, render, screen } from "@testing-library/react";
import { Activity } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckIn } from "@/lib/check-in";
import { saveCheckIn } from "@/lib/store-load-check-in";

import { CheckInScreen } from "./check-in-screen";

const TODAY = "2026-11-22";

const checkIn = (answers: Partial<CheckIn> = {}): CheckIn => ({
  date: TODAY,
  pain: 2,
  stiffness: 2,
  energy: 4,
  mood: 4,
  overall: 4,
  flare: false,
  note: "",
  ...answers,
});

const heading = () => screen.getByRole("heading", { level: 1 });

describe("CheckInScreen", () => {
  beforeEach(() => {
    localStorage.clear();
    // Only the clock is faked, so everything else runs as normal
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 22, 19)); // 7 pm on November 22
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts the check-in when there is none for today", () => {
    saveCheckIn(checkIn({ date: "2026-11-21" })); // yesterday's doesn't count
    render(<CheckInScreen />);

    expect(heading()).toHaveTextContent("How is your pain today?");
  });

  it("thanks the person once the check-in is saved", () => {
    render(<CheckInScreen />);

    for (const answer of ["A whisper", "A little tight", "Burning bright", "Light", "A good day", "No"]) {
      fireEvent.click(screen.getByRole("radio", { name: answer }));
      fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    }
    fireEvent.click(screen.getByRole("button", { name: /Finish check-in/ }));

    expect(heading()).toHaveTextContent("You did something kind for yourself.");
    expect(heading()).toHaveFocus();
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Back to home/ })).toHaveAttribute("href", "/");
  });

  it("shows today's answers when already checked in", () => {
    saveCheckIn(checkIn({ pain: 4, flare: true, note: "Busy day" }));
    render(<CheckInScreen />);

    expect(heading()).toHaveTextContent("Here’s how today felt.");
    expect(
      screen.getByText("Pain was loud and your mood felt light. You marked it as a flare day."),
    ).toBeInTheDocument();
    expect(screen.getByText("Loud")).toBeInTheDocument();
    expect(screen.getByText("Busy day")).toBeInTheDocument();
    expect(screen.getByText("Today’s colour: Flare")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/");
  });

  it("lets today's answers be changed, starting from them", () => {
    saveCheckIn(checkIn({ pain: 4 }));
    render(<CheckInScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Change answers/ }));
    expect(heading()).toHaveTextContent("How is your pain today?");
    expect(screen.getByRole("radio", { name: "Loud" })).toBeChecked();

    // Back from the first question returns to the summary, not home
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(heading()).toHaveTextContent("Here’s how today felt.");
  });

  // Found by the end-to-end test: Next.js hides a page you leave (with
  // React's <Activity>) and shows it again, state and all, when you return
  it("shows today's answers, not the thank-you, when coming back after finishing", () => {
    const { rerender } = render(
      <Activity mode="visible">
        <CheckInScreen />
      </Activity>,
    );
    for (const answer of ["A whisper", "A little tight", "Burning bright", "Light", "A good day", "No"]) {
      fireEvent.click(screen.getByRole("radio", { name: answer }));
      fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    }
    fireEvent.click(screen.getByRole("button", { name: /Finish check-in/ }));
    expect(heading()).toHaveTextContent("You did something kind for yourself.");

    // Leave the page, then come back
    rerender(
      <Activity mode="hidden">
        <CheckInScreen />
      </Activity>,
    );
    rerender(
      <Activity mode="visible">
        <CheckInScreen />
      </Activity>,
    );
    expect(heading()).toHaveTextContent("Here’s how today felt.");
  });

  it("waits for the browser before showing anything", () => {
    const html = renderToString(<CheckInScreen />);

    expect(html).toContain("aria-busy");
    expect(html).not.toContain("How is your pain today?");
  });
});
