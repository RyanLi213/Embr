import { ShieldCheck } from "lucide-react";
import Link from "next/link";

/** Reminds guests where their check-ins live, and invites them to keep them safe. */
export function GuestBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[#d6e1f5] bg-[#f0f5ff] p-4 sm:flex-row sm:items-center md:px-5">
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-link"
      >
        <ShieldCheck className="size-6" />
      </span>
      <div className="flex-1">
        <p className="font-extrabold">Your check-ins are saved on this browser</p>
        <p className="text-sm leading-[1.45] text-muted-foreground">
          You could lose them if you clear browsing data, use a private window, or switch devices.
        </p>
      </div>
      <Link href="/sign-in" className="inline-flex min-h-12 items-center font-extrabold text-link">
        Create a free account
      </Link>
    </div>
  );
}
