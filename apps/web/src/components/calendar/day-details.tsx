import { ArrowRight, NotebookPen } from "lucide-react";
import Link from "next/link";

import { Mascot } from "@/components/brand/mascot";
import { Kicker } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { dayLabel } from "@/lib/calendar";
import { type CheckIn, type DayColour, dayColour } from "@/lib/check-in";
import { answerLabel, QUESTIONS, summaryOf } from "@/lib/check-in-questions";

const HEADINGS: Record<DayColour, string> = {
  good: "A good day",
  okay: "An okay day",
  hard: "A harder day",
  flare: "A flare day",
};

// How full each answer's bar is: answer 1 is a fifth, answer 5 is full
const BAR_WIDTHS = ["w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"];

type DayDetailsProps = {
  /** The day to show, or null before one is picked */
  date: string | null;
  /** Today as YYYY-MM-DD */
  today: string;
  checkIn: CheckIn | undefined;
  ref?: React.Ref<HTMLElement>;
};

/** The panel beside the calendar: how the picked day went. */
export function DayDetails({ date, today, checkIn, ref }: DayDetailsProps) {
  const isToday = date === today;

  let kicker = "";
  let heading = "Pick a day";
  if (date) {
    kicker = isToday ? `Today, ${dayLabel(date)}` : dayLabel(date);
    if (checkIn) heading = HEADINGS[dayColour(checkIn)];
    else heading = isToday ? "No check-in yet" : "No check-in";
  }

  return (
    <section
      ref={ref}
      aria-labelledby="day-heading"
      // Scroll margins keep it clear of the phone's bottom menu when scrolled to
      className="scroll-mt-4 scroll-mb-[92px] rounded-[22px] border border-border bg-card px-[22px] py-7 shadow-[0_6px_20px_rgb(55_36_21/0.035)] md:scroll-mb-4 md:px-[27px] md:py-[30px]"
    >
      {/* Read out again when another day is picked */}
      <div aria-live="polite">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h2 id="day-heading" className="mt-1.5 text-[27px] leading-[1.15] font-extrabold tracking-[-0.02em]">
          {heading}
        </h2>
      </div>

      {!date && (
        <p className="mt-3 leading-[1.5] text-muted-foreground">
          Tap a day on the calendar to see how it felt.
        </p>
      )}
      {date && checkIn && <CheckInDetails checkIn={checkIn} isToday={isToday} />}
      {date && !checkIn && <NoCheckIn isToday={isToday} />}
    </section>
  );
}

function CheckInDetails({ checkIn, isToday }: { checkIn: CheckIn; isToday: boolean }) {
  return (
    <>
      <p className="mt-2 leading-[1.5] text-muted-foreground">{summaryOf(checkIn)}</p>

      <dl className="mt-6 space-y-5">
        {QUESTIONS.map((question) => (
          // The bar sits along the bottom of each row, so leave room for it
          <div key={question.key} className="relative flex justify-between gap-3 pb-4">
            <dt className="text-muted-foreground">{question.title}</dt>
            <dd className="text-right font-extrabold">
              {answerLabel(question.key, checkIn[question.key])}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[7px] overflow-hidden rounded-[5px] bg-[#f0e7dc]"
              >
                <span
                  className={`block h-full rounded-[5px] bg-[#ff7a95] ${BAR_WIDTHS[checkIn[question.key] - 1]}`}
                />
              </span>
            </dd>
          </div>
        ))}
      </dl>

      {checkIn.note && (
        <div className="mt-7 flex gap-2.5 rounded-[14px] bg-[#fff7e8] p-[17px] text-[#78604f]">
          <NotebookPen aria-hidden className="size-[19px] shrink-0" />
          <p className="text-sm leading-[1.5] break-words italic">
            <span className="sr-only">Note: </span>“{checkIn.note}”
          </p>
        </div>
      )}

      {isToday && (
        <Link
          href="/check-in"
          className={buttonVariants({ variant: "outline", size: "xl", className: "mt-7 w-full" })}
        >
          View today’s check-in <ArrowRight aria-hidden />
        </Link>
      )}
    </>
  );
}

function NoCheckIn({ isToday }: { isToday: boolean }) {
  return (
    <div className="mt-8 text-center">
      <Mascot height={90} className="mx-auto h-[90px] w-auto" />
      <p className="mt-3 text-muted-foreground">
        {isToday ? "You haven’t checked in today yet." : "There isn’t a check-in for this day."}
      </p>
      {isToday && (
        <Link href="/check-in" className={buttonVariants({ size: "xl", className: "mt-5" })}>
          Check in now <ArrowRight aria-hidden />
        </Link>
      )}
    </div>
  );
}
