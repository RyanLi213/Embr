// @vitest-environment node
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

const HOME = "http://localhost:3000/";

describe("proxy", () => {
  it("sends a first-time visitor to the welcome page", () => {
    const response = proxy(new NextRequest(HOME));

    expect(getRedirectUrl(response)).toBe("http://localhost:3000/welcome");
  });

  it("lets a visitor who has been welcomed see the home screen", () => {
    const request = new NextRequest(HOME, { headers: { cookie: "embr-welcomed=yes" } });

    expect(getRedirectUrl(proxy(request))).toBeNull();
  });

  it("only runs for the home page", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "/" })).toBe(true);
    expect(unstable_doesMiddlewareMatch({ config, url: "/calendar" })).toBe(false);
    expect(unstable_doesMiddlewareMatch({ config, url: "/welcome" })).toBe(false);
  });
});
