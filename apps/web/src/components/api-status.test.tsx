import type { HealthResponse } from "@embr/api-client";
import { render, screen } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API_URL, healthyResponse, server } from "@/test/server";

import { ApiStatus } from "./api-status";

// These tests use the real API client and real fetch. Only the network is fake (MSW),
// so a bug anywhere between this component and the network would show up here.
const HEALTH_URL = `${API_URL}/v1/health`;

describe("ApiStatus", () => {
  it("shows a checking message while waiting for the API", () => {
    server.use(http.get(HEALTH_URL, () => delay("infinite")));

    render(<ApiStatus />);

    expect(screen.getByText("Checking API…")).toBeInTheDocument();
  });

  it("shows the database state when the API answers", async () => {
    render(<ApiStatus />);

    expect(await screen.findByText("API: connected · Database: connected")).toBeInTheDocument();
  });

  it("shows when the database is down but the API is up", async () => {
    const degraded: HealthResponse = {
      ...healthyResponse,
      status: "degraded",
      database: "unavailable",
    };
    server.use(http.get(HEALTH_URL, () => HttpResponse.json(degraded)));

    render(<ApiStatus />);

    expect(await screen.findByText("API: connected · Database: unavailable")).toBeInTheDocument();
  });

  it("shows an error when the API cannot be reached", async () => {
    server.use(http.get(HEALTH_URL, () => HttpResponse.error()));

    render(<ApiStatus />);

    expect(await screen.findByText("API: not reachable")).toBeInTheDocument();
  });

  it("shows an error when the API answers with a server error", async () => {
    server.use(
      http.get(HEALTH_URL, () => HttpResponse.json({ detail: "boom" }, { status: 500 })),
    );

    render(<ApiStatus />);

    expect(await screen.findByText("API: not reachable")).toBeInTheDocument();
  });
});
