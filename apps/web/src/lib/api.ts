import { createApiClient } from "@embr/api-client";

/** Where the API lives, set NEXT_PUBLIC_API_URL in production; defaults to your laptop*/
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** The one shared client the whole web app uses to talk to the API */
export const api = createApiClient(API_URL);
