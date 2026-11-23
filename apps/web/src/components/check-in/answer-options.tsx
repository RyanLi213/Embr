import { cn } from "@/lib/utils";

type AnswerOptionsProps<T> = {
  /** Groups the buttons, so only one can be picked */
  name: string;
  /** The id of the heading that asks the question */
  labelledBy: string;
  options: readonly { value: T; label: string }[];
  /** The picked answer, or undefined when nothing is picked yet */
  value: T | undefined;
  onChange: (value: T) => void;
  /** Five answers sit in one row on computers; two (yes and no) sit side by side */
  layout?: "row" | "pair";
};

/**
 * Big, easy-to-press answer buttons. Underneath they are real radio buttons,
 * so keyboards (arrow keys) and screen readers work as people expect.
 */
export function AnswerOptions<T>({
  name,
  labelledBy,
  options,
  value,
  onChange,
  layout = "row",
}: AnswerOptionsProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn("grid gap-2.5", layout === "row" ? "md:grid-cols-5" : "sm:grid-cols-2")}
    >
      {options.map((option) => (
        <label
          key={option.label}
          className="flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-border bg-card px-4 py-3 text-center text-base leading-tight font-extrabold transition-colors hover:border-[#e8b98f] has-checked:border-primary has-checked:bg-accent has-checked:text-primary has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ring/40 md:min-h-[88px]"
        >
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
