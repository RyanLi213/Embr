// @vitest-environment node
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, welcomeRedirect } from "./proxy";

const SITE = "http://localhost:3000";
const WELCOMED = { headers: { cookie: "embr-welcomed=yes" } };

describe("welcomeRedirect", () => {
  it("sends a first-time visitor to the welcome page", () => {
    const response = welcomeRedirect(new NextRequest(`${SITE}/`));

    expect(response && getRedirectUrl(response)).toBe(`${SITE}/welcome`);
  });

  it("lets a visitor who has been welcomed see the home screen", () => {
    expect(welcomeRedirect(new NextRequest(`${SITE}/`, WELCOMED))).toBeUndefined();
  });

  it("only sends people from the home page, so other links still work", () => {
    expect(welcomeRedirect(new NextRequest(`${SITE}/calendar`))).toBeUndefined();
    expect(welcomeRedirect(new NextRequest(`${SITE}/sign-in`))).toBeUndefined();
  });
});

describe("proxy", () => {
  it("runs on every page, so Clerk knows who is signed in everywhere", () => {
    for (const url of ["/", "/calendar", "/sign-in", "/sign-in/factor-one", "/welcome"]) {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    }
  });

  it("skips images and Next.js's own files, which don't need it", () => {
    for (const url of ["/embr/front.webp", "/icon.svg", "/_next/static/chunk.js"]) {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
    }
  });
});
