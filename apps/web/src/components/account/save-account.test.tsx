import { render, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { fakeClerk, signInAs } from "@/test/clerk";
import { API_URL, server } from "@/test/server";

import { SaveAccount } from "./save-account";

// Every call the fake API receives on GET /v1/me, with the sign-in header it got
let calls: (string | null)[] = [];

describe("SaveAccount", () => {
  beforeEach(() => {
    calls = [];
    server.use(
      http.get(`${API_URL}/v1/me`, ({ request }) => {
        calls.push(request.headers.get("Authorization"));
        return HttpResponse.json({});
      }),
    );
  });

  it("tells the API who signed in, proving it with Clerk's token", async () => {
    signInAs();
    render(<SaveAccount />);

    await waitFor(() => expect(calls).toEqual(["Bearer test-token"]));
  });

  it("only does it once per sign-in, not on every page", async () => {
    signInAs();
    const { rerender } = render(<SaveAccount />);
    await waitFor(() => expect(calls).toHaveLength(1));

    rerender(<SaveAccount />);
    rerender(<SaveAccount />);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls).toHaveLength(1);
  });

  it("does nothing for guests", async () => {
    render(<SaveAccount />);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls).toEqual([]);
  });

  it("does nothing when Clerk gives no token", async () => {
    signInAs();
    fakeClerk.getToken.mockResolvedValue(null);
    render(<SaveAccount />);

    await waitFor(() => expect(fakeClerk.getToken).toHaveBeenCalled());
    expect(calls).toEqual([]);
  });

  it("keeps the app working when the API can't be reached", async () => {
    server.use(http.get(`${API_URL}/v1/me`, () => HttpResponse.error()));
    signInAs();

    // Nothing is thrown, and nothing is shown
    const { container } = render(<SaveAccount />);
    await waitFor(() => expect(fakeClerk.getToken).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
