import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clerkStillLoading, signInAs } from "@/test/clerk";

import { canReachApi } from "./api";
import { useAccount } from "./use-account";

describe("useAccount", () => {
  it("is loading until Clerk has started", () => {
    clerkStillLoading();
    expect(renderHook(() => useAccount()).result.current).toEqual({ status: "loading" });
  });

  it("is a guest when nobody is signed in", () => {
    expect(renderHook(() => useAccount()).result.current).toEqual({ status: "guest" });
  });

  it("gives the signed-in person's details and initial", () => {
    signInAs({ fullName: "Alex Example", email: "alex@example.com", phone: "+15550100" });

    expect(renderHook(() => useAccount()).result.current).toEqual({
      status: "signed-in",
      name: "Alex Example",
      email: "alex@example.com",
      phone: "+15550100",
      initial: "A",
    });
  });

  it("takes the initial from the email when there's no name", () => {
    signInAs({ fullName: null, email: "sam@example.com" });
    const account = renderHook(() => useAccount()).result.current;

    expect(account).toMatchObject({ name: null, initial: "S" });
  });

  it("still gives an initial with no name or email (for example, phone sign-in)", () => {
    signInAs({ fullName: "  ", email: null, phone: "+15550100" });

    expect(renderHook(() => useAccount()).result.current).toMatchObject({
      name: null,
      initial: "?",
    });
  });
});

describe("canReachApi", () => {
  it("reaches the API on your laptop", () => {
    expect(canReachApi("localhost")).toBe(true);
  });

  it("doesn't call the visitor's own computer from the live site while the API isn't online", () => {
    expect(canReachApi("embr-lovat.vercel.app")).toBe(false);
  });

  it("reaches the API from the live site once its address is set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.embr.example");
    expect(canReachApi("embr-lovat.vercel.app")).toBe(true);
    vi.unstubAllEnvs();
  });
});
