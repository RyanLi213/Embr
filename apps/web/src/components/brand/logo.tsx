import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Embr's logo: a little flame holding an "e", then the name. Links to the
 * home screen. Screen readers read the visible word "embr" (the flame is
 * decoration), so the spoken name matches what people see on screen.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex h-12 items-center gap-2.5 rounded-lg text-[28px] font-black tracking-[-0.04em] text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid h-[42px] w-[37px] -rotate-4 place-items-center rounded-[60%_40%_55%_45%/65%_48%_52%_35%] bg-ember text-xl text-white"
      >
        e
      </span>
      <span>embr</span>
    </Link>
  );
}
