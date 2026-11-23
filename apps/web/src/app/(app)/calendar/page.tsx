import type { Metadata } from "next";

import { Mascot } from "@/components/brand/mascot";
import { CalendarView } from "@/components/calendar/calendar-view";
import { GuestBanner } from "@/components/check-in/guest-banner";
import { Kicker, Page } from "@/components/shell/page";

export const metadata: Metadata = { title: "Calendar" };

/** Every day in a month, coloured by its check-in. Guests' check-ins come from this browser. */
export default function CalendarPage() {
  return (
    <Page>
      <header className="mt-2.5 mb-[22px] flex items-center justify-between gap-4 md:mt-0">
        <div>
          <Kicker>Your days</Kicker>
          <h1 className="mt-1.5 mb-1 text-[clamp(35px,4vw,49px)] leading-[1.08] font-extrabold tracking-[-0.035em]">
            Calendar
          </h1>
          <p className="text-lg text-muted-foreground">A gentle look back at how you’ve been feeling.</p>
        </div>
        <Mascot height={92} preload className="h-[72px] w-auto shrink-0 md:h-[92px]" />
      </header>

      <GuestBanner />

      <div className="mt-[22px]">
        <CalendarView />
      </div>
    </Page>
  );
}
