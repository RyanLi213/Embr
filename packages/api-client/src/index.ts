import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

/** The shape of the health endpoint's answer, taken from the API's own spec. */
export type HealthResponse = components["schemas"]["HealthResponse"];

/** Creates a client for the Embr API that knows every endpoint and its data. */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({
    baseUrl,
    // Look up fetch on every call rather than once at startup, so anything that
    // wraps fetch later (test fakes, monitoring tools) is respected.
    fetch: (request) => globalThis.fetch(request),
  });
}
