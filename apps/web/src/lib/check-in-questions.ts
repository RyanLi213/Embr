import type { CheckIn, DayColour } from "./check-in";

export type QuestionKey = "pain" | "stiffness" | "energy" | "mood" | "overall";

export type Question = {
  key: QuestionKey;
  /** Short name, for example "Pain" */
  title: string;
  /** What the screen asks */
  question: string;
  /** The five buttons, lowest first: saved as 1 to 5 */
  answers: readonly [string, string, string, string, string];
};

/** The five check-in questions, in the order they are asked ("Embr's glow" wording) */
export const QUESTIONS: readonly Question[] = [
  {
    key: "pain",
    title: "Pain",
    question: "How is your pain today?",
    answers: ["Not there", "A whisper", "Noticeable", "Loud", "Overwhelming"],
  },
  {
    key: "stiffness",
    title: "Stiffness",
    question: "How stiff do you feel?",
    answers: ["Moving freely", "A little tight", "Stiff", "Very stiff", "Locked up"],
  },
  {
    key: "energy",
    title: "Energy",
    question: "How is your energy?",
    answers: ["Barely a flicker", "Low glow", "Steady flame", "Burning bright", "Fully lit"],
  },
  {
    key: "mood",
    title: "Mood",
    question: "How are your spirits?",
    answers: ["Heavy", "A bit grey", "Steady", "Light", "Glowing"],
  },
  {
    key: "overall",
    title: "Overall",
    question: "How was today overall?",
    answers: ["A tough one", "Rough edges", "Getting by", "A good day", "A great day"],
  },
];

export const FLARE_QUESTION = {
  title: "Flare",
  question: "Is today a flare day?",
  help: "A flare is when your symptoms are much worse than usual.",
};

/** The words for a saved answer, for example pain 2 is "A whisper" */
export function answerLabel(key: QuestionKey, value: number): string {
  const question = QUESTIONS.find((q) => q.key === key);
  return question?.answers[value - 1] ?? "";
}

/** How each day colour is said out loud and in the colour key */
export const COLOUR_NAMES: Record<DayColour, string> = {
  good: "Good",
  okay: "Okay",
  hard: "Hard",
  flare: "Flare",
};

const PAIN_PHRASES = [
  "No pain",
  "Pain was a whisper",
  "Pain was noticeable",
  "Pain was loud",
  "Pain was overwhelming",
];
const MOOD_PHRASES = [
  "your mood felt heavy",
  "your mood felt a bit grey",
  "your mood felt steady",
  "your mood felt light",
  "your mood was glowing",
];

/** One gentle line about the day, for example "Pain was a whisper and your mood felt light." */
export function summaryOf(checkIn: CheckIn): string {
  const line = `${PAIN_PHRASES[checkIn.pain - 1]} and ${MOOD_PHRASES[checkIn.mood - 1]}.`;
  return checkIn.flare ? `${line} You marked it as a flare day.` : line;
}
