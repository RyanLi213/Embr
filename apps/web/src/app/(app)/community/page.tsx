import type { Metadata } from "next";

import { CommunityScreen } from "@/components/account/community-screen";

export const metadata: Metadata = { title: "Community" };

/** The community isn't built yet: "coming soon" when signed in, locked for guests. */
export default function CommunityPage() {
  return <CommunityScreen />;
}
