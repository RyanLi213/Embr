import type { Metadata } from "next";

import { ProfileScreen } from "@/components/account/profile-screen";

export const metadata: Metadata = { title: "Profile" };

/** Your account and sign out; guests are invited to sign in. */
export default function ProfilePage() {
  return <ProfileScreen />;
}
