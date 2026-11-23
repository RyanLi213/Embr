import type { Metadata } from "next";

import { CheckInScreen } from "@/components/check-in/check-in-screen";
import { Page } from "@/components/shell/page";

export const metadata: Metadata = { title: "Check in" };

/** The daily check-in. Guests' answers are saved in their browser. */
export default function CheckInPage() {
  return (
    <Page>
      <CheckInScreen />
    </Page>
  );
}
