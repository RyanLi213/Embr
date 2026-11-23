"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { Kicker } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { summaryOf } from "@/lib/check-in-questions";
import { toDateKey } from "@/lib/today";
import { useCheckIns } from "@/lib/use-check-ins";
import { useCurrentHour } from "@/lib/use-current-hour";
import { cn } from "@/lib/utils";

/** The big card on home: an invitation to check in, or a "done" note once saved. */
export function TodayCard() {
  const checkIns = useCheckIns();
  const hour = useCurrentHour();
  const ready = checkIns !== null && hour !== null;
  const saved = ready ? checkIns[toDateKey(hour)] : undefined;

  return (
    <section
      aria-labelledby="today-heading"
      className="relative flex min-h-[285px] items-start overflow-hidden rounded-[28px] border border-[#edc99e] bg-linear-120 from-[#ffe2bb] via-[#fff0d6] via-60% to-[#ffd8ae] px-[25px] py-[29px] shadow-[0_12px_35px_rgb(118_72_30/0.08)] md:items-center md:px-12 md:py-11"
    >
      {/* Soft decorative rings in the corner */}
      <div
        aria-hidden
        className="absolute -top-[150px] -right-[60px] size-[350px] rounded-full border border-white/60"
      />
      <div
        aria-hidden
        className="absolute -top-[100px] right-2.5 size-[250px] rounded-full border border-white/60"
      />

      {/* Fades in once this browser's check-ins are known, instead of flashing the wrong card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-[600px] transition-opacity duration-300",
          ready ? "opacity-100" : "opacity-0",
        )}
      >
        {saved ? (
          <>
            <Kicker className="flex items-center gap-1.5">
              <Check aria-hidden className="size-4" /> Check-in complete
            </Kicker>
            <h2
              id="today-heading"
              className="mt-2 mb-2 max-w-[560px] text-[29px] leading-[1.1] font-extrabold tracking-[-0.025em] md:text-[clamp(28px,3vw,38px)]"
            >
              You showed up for yourself today.
            </h2>
            <p className="mb-6 max-w-[550px] text-base leading-[1.55] text-muted-foreground md:text-[17px]">
              {summaryOf(saved)}
            </p>
            <Link
              href="/check-in"
              className={buttonVariants({ variant: "outline", size: "xl", className: "bg-white" })}
            >
              View today’s check-in <ArrowRight aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <Kicker>Today’s check-in</Kicker>
            <h2
              id="today-heading"
              className="mt-2 mb-2 max-w-[560px] text-[29px] leading-[1.1] font-extrabold tracking-[-0.025em] md:text-[clamp(28px,3vw,38px)]"
            >
              Take a moment for you
            </h2>
            <p className="mb-6 max-w-[550px] text-base leading-[1.55] text-muted-foreground md:text-[17px]">
              A few gentle questions to help you notice how your body is feeling.
            </p>
            <div className="flex flex-col items-stretch gap-2.5 md:flex-row md:items-center md:gap-4">
              <Link href="/check-in" className={buttonVariants({ size: "xl" })}>
                Start today’s check-in <ArrowRight aria-hidden />
              </Link>
              <span className="text-center text-[13px] font-semibold text-[#725d50]">
                Usually takes less than 30 seconds
              </span>
            </div>
          </>
        )}
      </div>

      <div
        aria-hidden
        className="absolute top-1/2 right-[10%] hidden size-[104px] -translate-y-1/2 place-items-center rounded-full bg-white/65 text-ember shadow-[0_0_0_20px_rgb(255_255_255/0.18),0_0_0_41px_rgb(255_255_255/0.11)] md:grid"
      >
        {saved ? <Check className="size-[34px]" /> : <Sparkles className="size-[34px]" />}
      </div>
    </section>
  );
}
