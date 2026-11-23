import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckIn } from "./check-in";
import { saveCheckIn } from "./store-load-check-in";
import { useCheckIns } from "./use-check-ins";

const checkIn: CheckIn = {
  date: "2026-11-22",
  pain: 2,
  stiffness: 2,
  energy: 4,
  mood: 4,
  overall: 4,
  flare: false,
  note: "",
};

describe("useCheckIns", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has no check-ins when the browser blocks storage", () => {
    saveCheckIn(checkIn);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage is blocked");
    });
    const { result } = renderHook(() => useCheckIns());
    expect(result.current).toEqual({});
  });

  it("starts empty, and updates straight after a save", () => {
    const { result } = renderHook(() => useCheckIns());
    expect(result.current).toEqual({});

    act(() => saveCheckIn(checkIn));
    expect(result.current).toEqual({ "2026-11-22": checkIn });
  });

  it("gives back the very same object while nothing changes", () => {
    saveCheckIn(checkIn);
    const { result, rerender } = renderHook(() => useCheckIns());
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });

  it("is not known yet on the server", () => {
    function Probe() {
      return <p>{useCheckIns() === null ? "not known yet" : "known"}</p>;
    }
    expect(renderToString(<Probe />)).toContain("not known yet");
  });
});
