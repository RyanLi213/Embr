import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckIn } from "@/lib/check-in";
import { saveCheckIn } from "@/lib/store-load-check-in";

import { TodayCard } from "./today-card";

const checkIn = (date: string): CheckIn => ({
  date,
  pain: 2,
  stiffness: 2,
  energy: 4,
  mood: 4,
  overall: 4,
  flare: false,
  note: "",
});

describe("TodayCard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 22, 19));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invites a check-in when there is none for today", () => {
    saveCheckIn(checkIn("2026-11-21")); // yesterday's doesn't count
    render(<TodayCard />);

    expect(screen.getByRole("heading", { name: "Take a moment for you" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start today’s check-in/ })).toHaveAttribute(
      "href",
      "/check-in",
    );
  });

  it("shows today's check-in as done, with a one-line summary", () => {
    saveCheckIn(checkIn("2026-11-22"));
    render(<TodayCard />);

    expect(
      screen.getByRole("heading", { name: "You showed up for yourself today." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pain was a whisper and your mood felt light.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View today’s check-in/ })).toHaveAttribute(
      "href",
      "/check-in",
    );
  });

  it("stays hidden on the server until the browser's check-ins are known", () => {
    expect(renderToString(<TodayCard />)).toContain("opacity-0");
  });
});
