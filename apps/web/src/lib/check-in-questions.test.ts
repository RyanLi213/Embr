import { describe, expect, it } from "vitest";

import type { CheckIn } from "./check-in";
import { answerLabel, QUESTIONS, summaryOf } from "./check-in-questions";

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

describe("QUESTIONS", () => {
  it("asks the five questions in order, each with five answers", () => {
    expect(QUESTIONS.map((q) => q.key)).toEqual(["pain", "stiffness", "energy", "mood", "overall"]);
    for (const question of QUESTIONS) expect(question.answers).toHaveLength(5);
  });
});

describe("answerLabel", () => {
  it.each([
    ["pain", 1, "Not there"],
    ["pain", 2, "A whisper"],
    ["stiffness", 5, "Locked up"],
    ["energy", 5, "Fully lit"],
    ["mood", 1, "Heavy"],
    ["overall", 4, "A good day"],
  ] as const)("calls %s %i “%s”", (key, value, label) => {
    expect(answerLabel(key, value)).toBe(label);
  });

  it("gives nothing for an answer outside 1 to 5", () => {
    expect(answerLabel("pain", 6)).toBe("");
  });
});

describe("summaryOf", () => {
  it("describes pain and mood in one line", () => {
    expect(summaryOf(day({ pain: 2, mood: 4 }))).toBe(
      "Pain was a whisper and your mood felt light.",
    );
  });

  it("handles the ends of each scale", () => {
    expect(summaryOf(day({ pain: 1, mood: 5 }))).toBe("No pain and your mood was glowing.");
    expect(summaryOf(day({ pain: 5, mood: 1 }))).toBe(
      "Pain was overwhelming and your mood felt heavy.",
    );
  });

  it("mentions a flare day", () => {
    expect(summaryOf(day({ pain: 4, mood: 2, flare: true }))).toBe(
      "Pain was loud and your mood felt a bit grey. You marked it as a flare day.",
    );
  });
});
