"use client";

import { Kicker } from "@/components/shell/page";
import { formatDateLabel, greetingFor, toDateKey } from "@/lib/today";
import { useCurrentHour } from "@/lib/use-current-hour";
import { cn } from "@/lib/utils";

/**
 * "Good morning, friend." with today's date. The server can't know the
 * visitor's time zone, so the date and greeting fill in once the page reaches
 * the browser, fading in gently instead of showing a wrong time first.
 */
export function Greeting() {
  const hour = useCurrentHour();

  return (
    <div>
      <div
        className={cn(
          "transition-opacity duration-500",
          hour === null ? "opacity-0" : "opacity-100",
        )}
      >
        <Kicker>
          {hour === null ? (
            " "
          ) : (
            <time dateTime={toDateKey(hour)}>{formatDateLabel(hour)}</time>
          )}
        </Kicker>
        <h1 className="mt-1.5 mb-1 text-[34px] leading-[1.08] font-extrabold tracking-[-0.035em] md:text-[clamp(35px,4vw,49px)]">
          {hour === null ? "Hello" : greetingFor(hour)}, <span className="text-ember">friend.</span>
        </h1>
      </div>
      <p className="text-base text-muted-foreground md:text-lg">How are you arriving today?</p>
    </div>
  );
}
