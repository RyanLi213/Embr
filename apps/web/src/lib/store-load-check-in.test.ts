import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckIn } from "./check-in";
import {
  loadCheckIns,
  saveCheckIn,
  STORAGE_KEY,
  subscribeToCheckIns,
} from "./store-load-check-in";

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

describe("check-in storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has no check-ins before the first one", () => {
    expect(loadCheckIns()).toEqual({});
  });

  it("saves a check-in and reads it back, by day", () => {
    saveCheckIn(checkIn("2026-11-22"));
    expect(loadCheckIns()).toEqual({ "2026-11-22": checkIn("2026-11-22") });
  });

  it("keeps one check-in per day: saving again replaces it", () => {
    saveCheckIn(checkIn("2026-11-22", { pain: 2 }));
    saveCheckIn(checkIn("2026-11-22", { pain: 4 }));
    expect(loadCheckIns()["2026-11-22"]?.pain).toBe(4);
    expect(Object.keys(loadCheckIns())).toHaveLength(1);
  });

  it("keeps other days when saving a new one", () => {
    saveCheckIn(checkIn("2026-11-21"));
    saveCheckIn(checkIn("2026-11-22"));
    expect(Object.keys(loadCheckIns()).sort()).toEqual(["2026-11-21", "2026-11-22"]);
  });

  it("refuses to save a check-in that breaks the rules", () => {
    expect(() => saveCheckIn(checkIn("2026-11-22", { pain: 9 }))).toThrow();
    expect(loadCheckIns()).toEqual({});
  });

  it("ignores saved data that is not readable, instead of crashing", () => {
    localStorage.setItem(STORAGE_KEY, "not json {");
    expect(loadCheckIns()).toEqual({});
  });

  it.each(["null", "42", '"text"'])("ignores saved data that is not a list of days (%s)", (saved) => {
    localStorage.setItem(STORAGE_KEY, saved);
    expect(loadCheckIns()).toEqual({});
  });

  it("skips a damaged day but keeps the good ones", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        "2026-11-21": checkIn("2026-11-21", { pain: 9 }),
        "2026-11-22": checkIn("2026-11-22"),
      }),
    );
    expect(Object.keys(loadCheckIns())).toEqual(["2026-11-22"]);
  });

  it("files each check-in under its own date, whatever key it was saved under", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ "2026-11-01": checkIn("2026-11-22") }));
    expect(Object.keys(loadCheckIns())).toEqual(["2026-11-22"]);
  });

  it("has no check-ins when the browser blocks storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage is blocked");
    });
    expect(loadCheckIns()).toEqual({});
  });

  it("reports a failed save when the browser blocks storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage is full");
    });
    expect(() => saveCheckIn(checkIn("2026-11-22"))).toThrow();
  });
});

describe("listening for changes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tells listeners after a save, until they stop listening", () => {
    const onChange = vi.fn();
    const stop = subscribeToCheckIns(onChange);

    saveCheckIn(checkIn("2026-11-22"));
    expect(onChange).toHaveBeenCalledTimes(1);

    stop();
    saveCheckIn(checkIn("2026-11-23"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("hears saves made in another tab, but not other storage", () => {
    const onChange = vi.fn();
    const stop = subscribeToCheckIns(onChange);

    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    window.dispatchEvent(new StorageEvent("storage", { key: null })); // another tab cleared everything
    window.dispatchEvent(new StorageEvent("storage", { key: "something-else" }));
    expect(onChange).toHaveBeenCalledTimes(2);

    stop();
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
