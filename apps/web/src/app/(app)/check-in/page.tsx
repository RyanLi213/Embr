import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Check in" };

// A stand-in until the check-in itself is built (branch feature/guest-check-in)
export default function CheckInPage() {
  return (
    <ComingSoon
      eyebrow="Coming soon"
      title="Your daily check-in is almost here."
      body="Soon you’ll answer a few gentle questions about pain, stiffness, fatigue, mood and your day overall. It will take less than 30 seconds."
      action={{ href: "/", label: "Back to home" }}
    />
  );
}
