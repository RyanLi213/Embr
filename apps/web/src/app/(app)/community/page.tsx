import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Community" };

// The community will need an account, so guests see this instead
export default function CommunityPage() {
  return (
    <ComingSoon
      locked
      eyebrow="A kinder space, coming soon"
      title="You shouldn’t have to do this alone."
      body="Community will be a thoughtful place to share, listen, and learn with people who understand."
      action={{ href: "/sign-in", label: "Sign in to unlock" }}
      note="Free to join. Your data stays yours."
    />
  );
}
