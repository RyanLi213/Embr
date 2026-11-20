import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Profile" };

// A profile needs an account, so guests see this instead
export default function ProfilePage() {
  return (
    <ComingSoon
      locked
      eyebrow="Keep your check-ins safe"
      title="Take Embr with you."
      body="Create a free account to keep your check-ins backed up and available on every device."
      action={{ href: "/sign-in", label: "Sign in to unlock" }}
      note="Free to join. Your data stays yours."
    />
  );
}
