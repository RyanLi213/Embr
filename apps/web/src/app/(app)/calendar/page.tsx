import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Calendar" };

// A stand-in until the calendar itself is built (branch feature/calendar)
export default function CalendarPage() {
  return (
    <ComingSoon
      eyebrow="Your days"
      title="Your calendar is on its way."
      body="Once you start checking in, each day will show as good, okay, hard or a flare day, so you can look back on how you’ve been."
      action={{ href: "/", label: "Back to home" }}
    />
  );
}
