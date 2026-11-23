"use client";

import { ComingSoon } from "@/components/coming-soon";
import { useAccount } from "@/lib/use-account";

const TITLE = "You shouldn’t have to do this alone.";
const BODY =
  "Community will be a thoughtful place to share, listen, and learn with people who understand.";

/** The /community page: "coming soon" once signed in, locked for guests. */
export function CommunityScreen() {
  const account = useAccount();

  if (account.status === "loading") return <div aria-busy className="min-h-screen" />;

  if (account.status === "guest") {
    return (
      <ComingSoon
        locked
        eyebrow="A kinder space, coming soon"
        title={TITLE}
        body={BODY}
        action={{ href: "/sign-in", label: "Sign in to unlock" }}
        note="Free to join. Your data stays yours."
      />
    );
  }

  return (
    <ComingSoon
      eyebrow="Coming soon"
      title={TITLE}
      body={`${BODY} You’re signed in, so you’ll be ready when it opens.`}
      action={{ href: "/", label: "Back to home" }}
    />
  );
}
