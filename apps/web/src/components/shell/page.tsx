import { cn } from "@/lib/utils";

/** The standard width and padding for a screen inside the app. */
export function Page({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto max-w-[1240px] px-[18px] pt-[18px] pb-[85px] md:px-[clamp(28px,5vw,72px)] md:pt-[42px] md:pb-[90px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Small all-caps label above a heading, such as "YOUR RHYTHM". */
export function Kicker({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("text-xs font-black tracking-[0.13em] text-kicker uppercase", className)}>
      {children}
    </p>
  );
}
