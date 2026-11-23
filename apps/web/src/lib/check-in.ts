import { z } from "zod";

/** The longest note a check-in can have */
export const NOTE_LIMIT = 240;

/** Every answer is saved as a whole number from 1 (lowest) to 5 (highest) */
const answer = z.int().min(1).max(5);

/** The rules every check-in must follow, checked before it is saved or used */
export const checkInSchema = z.object({
  /** The day, as YYYY-MM-DD */
  date: z.iso.date(),
  pain: answer,
  stiffness: answer,
  energy: answer,
  mood: answer,
  overall: answer,
  flare: z.boolean(),
  note: z.string().trim().max(NOTE_LIMIT),
});

/** One day's check-in (the type comes from the rules above, so they always match) */
export type CheckIn = z.infer<typeof checkInSchema>;

export type DayColour = "good" | "okay" | "hard" | "flare";

/** How much more "How was today overall?" counts than each other answer */
const OVERALL_WEIGHT = 1.5;

/** The day's colour on the calendar, using the rule in TODO.md */
export function dayColour(checkIn: CheckIn): DayColour {
  // A flare day shows as Flare, whatever the answers
  if (checkIn.flare) return "flare";

  // 1. A 1 to 5 "how good" score for each answer. High pain and stiffness
  //    are bad, so they are flipped; high energy and mood are good.
  const scores = [6 - checkIn.pain, 6 - checkIn.stiffness, checkIn.energy, checkIn.mood];

  // 2. Weighted average, with overall counting 1.5 times
  const total = scores.reduce((sum, score) => sum + score, 0) + checkIn.overall * OVERALL_WEIGHT;
  const average = total / (scores.length + OVERALL_WEIGHT);

  // 3. The colour
  if (average >= 3.5) return "good";
  if (average >= 2.5) return "okay";
  return "hard";
}
