/**
 * Helpers for "today": the greeting, the date label and this week's days.
 * Everything uses the visitor's own clock and time zone.
 */

export type WeekDay = {
  /** The date as YYYY-MM-DD, the format check-ins will be saved with */
  date: string;
  /** For example "Monday" */
  name: string;
  when: "past" | "today" | "future";
};

/** "Good morning" from 5 am, "Good afternoon" from noon, "Good evening" from 5 pm. */
export function greetingFor(time: number): string {
  const hour = new Date(time).getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

/** For example "Wednesday, November 18" */
export function formatDateLabel(time: number): string {
  return new Date(time).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * A date as YYYY-MM-DD in local time. (Not UTC: in Canada, UTC is already
 * tomorrow during the evening, which would put a check-in on the wrong day.)
 */
export function toDateKey(dateOrTime: Date | number): string {
  const date = new Date(dateOrTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function whenFor(daysFromToday: number): WeekDay["when"] {
  if (daysFromToday < 0) return "past";
  if (daysFromToday === 0) return "today";
  return "future";
}

/** The seven days of the current week, Monday first, as in the design. */
export function weekOf(time: number): WeekDay[] {
  const today = new Date(time);
  const daysSinceMonday = (today.getDay() + 6) % 7; // getDay() counts from Sunday = 0

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - daysSinceMonday + i,
    );
    return {
      date: toDateKey(day),
      name: day.toLocaleDateString("en-CA", { weekday: "long" }),
      when: whenFor(i - daysSinceMonday),
    };
  });
}
