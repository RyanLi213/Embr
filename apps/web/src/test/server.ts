import type { HealthResponse } from "@embr/api-client";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

/** The API address the web app uses when NEXT_PUBLIC_API_URL is not set. */
export const API_URL = "http://localhost:8000";

/** A typed healthy answer. If the API's response shape changes, this stops compiling. */
export const healthyResponse: HealthResponse = {
  status: "ok",
  database: "connected",
  environment: "test",
  version: "0.1.0",
};

/** Default fake API answers. Individual tests override them with server.use(...). */
export const handlers = [
  http.get(`${API_URL}/v1/health`, () => HttpResponse.json<HealthResponse>(healthyResponse)),
];

/** A fake network: intercepts the web app's real fetch calls during tests. */
export const server = setupServer(...handlers);
