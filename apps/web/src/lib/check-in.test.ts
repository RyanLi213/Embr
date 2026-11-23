import { describe, expect, it } from "vitest";

import { type CheckIn, checkInSchema, dayColour } from "./check-in";

/** A check-in with middle answers; each test changes only what it is about */
const day = (answers: Partial<CheckIn> = {}): CheckIn => ({
  date: "2026-11-22",
  pain: 3,
  stiffness: 3,
  energy: 3,
  mood: 3,
  overall: 3,
  flare: false,
  note: "",
  ...answers,
});

const BEST = { pain: 1, stiffness: 1, energy: 5, mood: 5, overall: 5 };
const WORST = { pain: 5, stiffness: 5, energy: 1, mood: 1, overall: 1 };

describe("dayColour", () => {
  it("calls a mild day with good energy and a great mood good", () => {
    // 1. Set up: a mild day with good energy and a great mood
    const checkIn = {
      date: "2026-11-22",
      pain: 2,
      stiffness: 2,
      energy: 4,
      mood: 5,
      overall: 4,
      flare: false,
      note: "I feel alright, not too motivated but better than nothing. I feel some possible flare ups but I can manage for now.",
    };

    // 2. Run and 3. Check
    expect(dayColour(checkIn)).toBe("good");
  });

  // Extremes: if these fail, something basic is wrong
  it("calls the best answers good", () => {
    expect(dayColour(day(BEST))).toBe("good");
  });

  it("calls middle answers okay", () => {
    expect(dayColour(day())).toBe("okay");
  });

  it("calls the worst answers hard", () => {
    expect(dayColour(day(WORST))).toBe("hard");
  });

  // Special rule: a flare day is always Flare
  it("calls a flare day flare, even with the best answers", () => {
    expect(dayColour(day({ ...BEST, flare: true }))).toBe("flare");
  });

  it("calls a flare day flare with the worst answers too", () => {
    expect(dayColour(day({ ...WORST, flare: true }))).toBe("flare");
  });

  // Which way each answer counts. This day sits just below Good, so one
  // better answer tips it into Good, and a worse one keeps it Okay.
  // If pain were not flipped, or energy were flipped, these would swap.
  const borderline = { pain: 3, stiffness: 3, energy: 3, mood: 3, overall: 4 };

  it.each([
    { answer: "no pain", change: { pain: 1 }, expected: "good" },
    { answer: "overwhelming pain", change: { pain: 5 }, expected: "okay" },
    { answer: "no stiffness", change: { stiffness: 1 }, expected: "good" },
    { answer: "being locked up", change: { stiffness: 5 }, expected: "okay" },
    { answer: "full energy", change: { energy: 5 }, expected: "good" },
    { answer: "barely any energy", change: { energy: 1 }, expected: "okay" },
    { answer: "a glowing mood", change: { mood: 5 }, expected: "good" },
    { answer: "a heavy mood", change: { mood: 1 }, expected: "okay" },
  ])("with $answer, a borderline day is $expected", ({ change, expected }) => {
    expect(dayColour(day({ ...borderline, ...change }))).toBe(expected);
  });

  // The 1.5x weight: the same answers, swapped between mood and overall
  it("counts overall more than the other answers", () => {
    expect(dayColour(day({ mood: 5, overall: 3 }))).toBe("okay");
    expect(dayColour(day({ mood: 3, overall: 5 }))).toBe("good");
  });

  // Boundaries. Whole-number answers can never score exactly 3.5 or 2.5,
  // so these use the closest possible scores on either side.
  it.each([
    { score: "3.55", answers: { overall: 5 }, expected: "good" },
    { score: "3.45", answers: { mood: 4, overall: 4 }, expected: "okay" },
    { score: "2.55", answers: { mood: 2, overall: 2 }, expected: "okay" },
    { score: "2.45", answers: { overall: 1 }, expected: "hard" },
  ])("calls a score of $score $expected", ({ answers, expected }) => {
    expect(dayColour(day(answers))).toBe(expected);
  });
});

describe("checkInSchema", () => {
  const accepts = (data: unknown) => checkInSchema.safeParse(data).success;

  it("accepts a complete check-in", () => {
    expect(accepts(day({ note: "Took a gentle walk" }))).toBe(true);
  });

  it.each(["pain", "stiffness", "energy", "mood", "overall"])(
    "rejects a %s answer outside 1 to 5",
    (question) => {
      expect(accepts(day({ [question]: 0 }))).toBe(false);
      expect(accepts(day({ [question]: 6 }))).toBe(false);
    },
  );

  it("rejects an answer that is not a whole number", () => {
    expect(accepts(day({ pain: 2.5 }))).toBe(false);
  });

  it("rejects a check-in with a missing answer", () => {
    const { mood, ...withoutMood } = day();
    expect(mood).toBe(3);
    expect(accepts(withoutMood)).toBe(false);
  });

  it("rejects a flare answer that is not yes or no", () => {
    expect(accepts({ ...day(), flare: "yes" })).toBe(false);
  });

  it("accepts a 240-character note but not 241", () => {
    expect(accepts(day({ note: "a".repeat(240) }))).toBe(true);
    expect(accepts(day({ note: "a".repeat(241) }))).toBe(false);
  });

  it("trims spaces around the note", () => {
    expect(checkInSchema.parse(day({ note: "  slept well  " })).note).toBe("slept well");
  });

  it.each(["22/11/2026", "2026-13-01", "2026-11-31", "today"])(
    "rejects the date %s",
    (date) => {
      expect(accepts(day({ date }))).toBe(false);
    },
  );
});
