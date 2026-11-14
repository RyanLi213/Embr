"use client";

import { useEffect, useState } from "react";

import type { HealthResponse } from "@embr/api-client";

import { api } from "@/lib/api";

type Status =
  | { kind: "loading" }
  | { kind: "ok"; health: HealthResponse }
  | { kind: "error" };

/** Asks the API if it's running and shows the answer. */
export function ApiStatus() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    api
      .GET("/v1/health")
      .then(({ data }) => setStatus(data ? { kind: "ok", health: data } : { kind: "error" }))
      .catch(() => setStatus({ kind: "error" }));
  }, []);

  if (status.kind === "loading") return <p className="text-sm text-muted-foreground">Checking API…</p>;
  if (status.kind === "error") return <p className="text-sm text-destructive">API: not reachable</p>;

  return (
    <p className="text-sm text-muted-foreground">
      API: connected · Database: {status.health.database}
    </p>
  );
}
