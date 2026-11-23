"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Kicker } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { type CheckIn, NOTE_LIMIT } from "@/lib/check-in";
import { FLARE_QUESTION, QUESTIONS, type QuestionKey } from "@/lib/check-in-questions";
import { saveCheckIn } from "@/lib/store-load-check-in";

import { AnswerOptions } from "./answer-options";
import { BackLink } from "./back-link";
import { GuestBanner } from "./guest-banner";

type Answers = Partial<Record<QuestionKey, number>>;

const FLARE_STEP = QUESTIONS.length; // after the five 1-to-5 questions
const NOTE_STEP = FLARE_STEP + 1;
const QUESTION_COUNT = QUESTIONS.length + 1; // the five, plus flare
const STEP_COUNT = NOTE_STEP + 1;

const FLARE_OPTIONS = [
  { value: true, label: "Yes, it’s a flare day" },
  { value: false, label: "No" },
];

const HEADING = "mt-2 mb-2 text-[clamp(28px,4vw,40px)] leading-[1.1] font-extrabold tracking-[-0.03em] outline-none";
const HELP = "mb-6 text-base leading-[1.55] text-muted-foreground md:text-[17px]";

type CheckInFlowProps = {
  /** The day this check-in is for, as YYYY-MM-DD */
  date: string;
  /** The day's saved check-in, when changing answers: the flow starts with them picked */
  initial?: CheckIn;
  onSaved: () => void;
  /** What "Back" does on the first question. Without it, Back goes home. */
  onExit?: () => void;
};

/** The daily check-in: one question per screen, then an optional note. */
export function CheckInFlow({ date, initial, onSaved, onExit }: CheckInFlowProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() =>
    initial
      ? {
          pain: initial.pain,
          stiffness: initial.stiffness,
          energy: initial.energy,
          mood: initial.mood,
          overall: initial.overall,
        }
      : {},
  );
  const [flare, setFlare] = useState<boolean | undefined>(initial?.flare);
  const [note, setNote] = useState(initial?.note ?? "");
  const [saveFailed, setSaveFailed] = useState(false);

  const headingId = useId();
  const noteId = useId();
  const counterId = useId();

  // After moving to another step, put the keyboard and screen reader focus on
  // its question, so it is read out. (Not on the first screen, which the
  // visitor just opened themselves.)
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  function goTo(next: number) {
    moved.current = true;
    setStep(next);
  }

  function finish() {
    try {
      // saveCheckIn checks the rules again, including that every answer is there
      saveCheckIn({ date, ...answers, flare, note } as CheckIn);
      onSaved();
    } catch {
      setSaveFailed(true);
    }
  }

  const question = QUESTIONS[step];
  const canContinue =
    step === FLARE_STEP ? flare !== undefined : question && answers[question.key] !== undefined;

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="mb-5 flex items-center gap-3 md:gap-5">
        {step === 0 && !onExit ? (
          <BackLink />
        ) : (
          <Button
            variant="ghost"
            size="xl"
            className="-ml-3"
            onClick={() => (step === 0 ? onExit?.() : goTo(step - 1))}
          >
            <ArrowLeft aria-hidden /> Back
          </Button>
        )}
        <div className="flex-1">
          <p className="text-sm font-bold text-muted-foreground">
            {step < QUESTION_COUNT ? `Question ${step + 1} of ${QUESTION_COUNT}` : "One last thing"}
          </p>
          <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-ember transition-[width]"
              style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-border bg-card px-[22px] py-7 shadow-[0_12px_35px_rgb(118_72_30/0.06)] md:px-12 md:py-11">
        {question && (
          <>
            <Kicker>{question.title}</Kicker>
            <h1 id={headingId} ref={heading} tabIndex={-1} className={HEADING}>
              {question.question}
            </h1>
            <p className={HELP}>Choose the answer that feels closest. There’s no wrong answer.</p>
            <AnswerOptions
              name={question.key}
              labelledBy={headingId}
              options={question.answers.map((label, i) => ({ value: i + 1, label }))}
              value={answers[question.key]}
              onChange={(value) => setAnswers({ ...answers, [question.key]: value })}
            />
          </>
        )}

        {step === FLARE_STEP && (
          <>
            <Kicker>{FLARE_QUESTION.title}</Kicker>
            <h1 id={headingId} ref={heading} tabIndex={-1} className={HEADING}>
              {FLARE_QUESTION.question}
            </h1>
            <p className={HELP}>{FLARE_QUESTION.help}</p>
            <AnswerOptions
              name="flare"
              labelledBy={headingId}
              options={FLARE_OPTIONS}
              value={flare}
              onChange={setFlare}
              layout="pair"
            />
          </>
        )}

        {step === NOTE_STEP && (
          <>
            <Kicker>Optional note</Kicker>
            <h1 ref={heading} tabIndex={-1} className={HEADING}>
              <label htmlFor={noteId}>Anything else you want to remember?</label>
            </h1>
            <p className={HELP}>A few words can help you spot what made today different.</p>
            <textarea
              id={noteId}
              value={note}
              maxLength={NOTE_LIMIT}
              rows={4}
              aria-describedby={counterId}
              placeholder="Maybe you slept well, took a gentle walk, or had a busy morning…"
              onChange={(event) => setNote(event.target.value.slice(0, NOTE_LIMIT))}
              className="w-full resize-y rounded-2xl border-2 border-border bg-background px-4 py-3 text-base leading-[1.5] placeholder:text-[#6b7590] focus-visible:border-primary"
            />
            <p id={counterId} className="mt-1.5 text-right text-sm font-bold text-muted-foreground">
              {note.length}/{NOTE_LIMIT}
            </p>
          </>
        )}

        {saveFailed && (
          <p role="alert" className="mt-5 rounded-2xl bg-[#fdeaed] px-4 py-3 font-bold text-destructive">
            We couldn’t save your check-in in this browser. Your answers are still here, so try
            again, or check that this browser lets websites save data.
          </p>
        )}

        <div className="mt-7">
          {step === NOTE_STEP ? (
            <Button size="2xl" className="w-full md:w-auto" onClick={finish}>
              Finish check-in <Check aria-hidden />
            </Button>
          ) : (
            <Button
              size="2xl"
              className="w-full md:w-auto"
              disabled={!canContinue}
              onClick={() => goTo(step + 1)}
            >
              Continue <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      </section>

      <div className="mt-5">
        <GuestBanner />
      </div>
    </div>
  );
}
