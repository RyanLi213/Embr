import type { Metadata } from "next";

import { ApiStatus } from "@/components/api-status";

export const metadata: Metadata = { title: "Status" };

/**
 * A plain page for developers: shows whether the web app can reach the API
 * and the database. The end-to-end test uses it to check the whole chain.
 */
export default function StatusPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-3xl font-extrabold">System status</h1>
      <p className="mt-2 text-muted-foreground">
        Whether the web app can reach the API and the database.
      </p>
      <div className="mt-6">
        <ApiStatus />
      </div>
    </main>
  );
}
