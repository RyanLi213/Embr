import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins class names and drops falsy ones", () => {
    expect(cn("px-2", false, undefined, "text-sm")).toBe("px-2 text-sm");
  });

  it("lets a later Tailwind class override a conflicting earlier one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
