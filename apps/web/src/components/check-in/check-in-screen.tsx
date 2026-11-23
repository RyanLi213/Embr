"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Mascot } from "@/components/brand/mascot";
import { Kicker } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { toDateKey } from "@/lib/today";
import { useCheckIns } from "@/lib/use-check-ins";
import { useCurrentHour } from "@/lib/use-current-hour";

import { BackLink } from "./back-link";
import { CheckInFlow } from "./check-in-flow";
import { TodaySummary } from "./today-summary";

/**
 * The /check-in page: today's answers if there are some, otherwise the
 * check-in itself, and a thank-you once it is saved.
 */
export function CheckInScreen() {
  const checkIns = useCheckIns();
  const hour = useCurrentHour();
  const [view, setView] = useState<"start" | "changing" | "done">("start");

  // Next.js keeps a page's state while you visit other pages, and shows it
  // again when you come back. Start over on each visit instead, so a finished
  // check-in shows today's answers next time, not the thank-you again.
  // (An unfinished check-in still picks up where it was left.)
  useEffect(() => () => setView("start"), []);

  // Saved check-ins and today's date are only known in the browser
  if (checkIns === null || hour === null) return <div aria-busy className="min-h-[60vh]" />;

  const today = toDateKey(hour);
  const saved = checkIns[today];

  if (view === "done") return <CheckInDone />;
  if (saved && view === "start") {
    return <TodaySummary checkIn={saved} onChangeAnswers={() => setView("changing")} />;
  }
  return (
    <CheckInFlow
      date={today}
      initial={view === "changing" ? saved : undefined}
      onSaved={() => setView("done")}
      onExit={view === "changing" ? () => setView("start") : undefined}
    />
  );
}

/** The thank-you after finishing a check-in. */
function CheckInDone() {
  // Move focus here, so screen readers announce that the check-in is saved
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className="mx-auto max-w-[860px]">
      <BackLink />
      <div className="mx-auto max-w-[620px] py-6 text-center md:py-10">
        <Mascot height={150} preload className="mx-auto h-[130px] w-auto md:h-[150px]" />
        <Kicker className="mt-4">Check-in complete</Kicker>
        <h1
          ref={heading}
          tabIndex={-1}
          className="my-2.5 text-[clamp(32px,5vw,46px)] leading-[1.08] font-extrabold tracking-[-0.04em] outline-none"
        >
          You did something kind for yourself.
        </h1>
        <p className="mx-auto mb-6 text-lg leading-[1.55] text-muted-foreground">
          Thanks for checking in. I’ll keep this here so you can notice what helps over time.
        </p>
        <Link href="/" className={buttonVariants({ size: "2xl" })}>
          Back to home <ArrowRight aria-hidden />
        </Link>
      </div>
    </div>
  );
}
