import { ArrowRight, Pencil } from "lucide-react";
import Link from "next/link";

import { Kicker } from "@/components/shell/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { type CheckIn, dayColour } from "@/lib/check-in";
import { answerLabel, COLOUR_NAMES, QUESTIONS, summaryOf } from "@/lib/check-in-questions";

import { BackLink } from "./back-link";
import { DAY_DOT } from "./day-colours";
import { GuestBanner } from "./guest-banner";

type TodaySummaryProps = {
  checkIn: CheckIn;
  onChangeAnswers: () => void;
};

/** Today's saved answers, shown when someone opens the check-in again. */
export function TodaySummary({ checkIn, onChangeAnswers }: TodaySummaryProps) {
  const colour = dayColour(checkIn);

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="mb-5">
        <BackLink />
      </div>
      <section className="rounded-[28px] border border-border bg-card px-[22px] py-7 shadow-[0_12px_35px_rgb(118_72_30/0.06)] md:px-12 md:py-11">
        <Kicker>Today’s check-in</Kicker>
        <h1 className="mt-2 mb-2 text-[clamp(28px,4vw,40px)] leading-[1.1] font-extrabold tracking-[-0.03em]">
          Here’s how today felt.
        </h1>
        <p className="mb-6 text-base leading-[1.55] text-muted-foreground md:text-[17px]">
          {summaryOf(checkIn)}
        </p>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((question) => (
            <div key={question.key} className="rounded-2xl bg-muted px-4 py-3">
              <dt className="text-sm font-bold text-muted-foreground">{question.title}</dt>
              <dd className="text-lg font-extrabold">{answerLabel(question.key, checkIn[question.key])}</dd>
            </div>
          ))}
          <div className="rounded-2xl bg-muted px-4 py-3">
            <dt className="text-sm font-bold text-muted-foreground">Flare day</dt>
            <dd className="text-lg font-extrabold">{checkIn.flare ? "Yes" : "No"}</dd>
          </div>
          {checkIn.note && (
            <div className="rounded-2xl bg-muted px-4 py-3 sm:col-span-2 lg:col-span-3">
              <dt className="text-sm font-bold text-muted-foreground">Note</dt>
              <dd className="text-base leading-[1.5] break-words">{checkIn.note}</dd>
            </div>
          )}
        </dl>

        <p className="mt-5 flex items-center gap-2 font-bold">
          <span aria-hidden className={`size-3.5 rounded-full ${DAY_DOT[colour]}`} />
          Today’s colour: {COLOUR_NAMES[colour]}
        </p>

        <div className="mt-7 flex flex-col gap-3 md:flex-row">
          <Button size="2xl" onClick={onChangeAnswers}>
            Change answers <Pencil aria-hidden />
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "2xl" })}>
            Back to home <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>

      <div className="mt-5">
        <GuestBanner />
      </div>
    </div>
  );
}
