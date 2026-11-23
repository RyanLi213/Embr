"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { useAccount } from "@/lib/use-account";

/**
 * Reminds people where their check-ins live. Guests are invited to make an
 * account; signed-in people are told saving to their account is on its way.
 */
export function GuestBanner() {
  const signedIn = useAccount().status === "signed-in";

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[#d6e1f5] bg-[#f0f5ff] p-4 sm:flex-row sm:items-center md:px-5">
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-link"
      >
        <ShieldCheck className="size-6" />
      </span>
      <div className="flex-1">
        <p className="font-extrabold">
          {signedIn
            ? "Your check-ins are still saved on this browser"
            : "Your check-ins are saved on this browser"}
        </p>
        <p className="text-sm leading-[1.45] text-muted-foreground">
          {signedIn
            ? "Saving them to your account is coming soon. Until then, keep using this browser."
            : "You could lose them if you clear browsing data, use a private window, or switch devices."}
        </p>
      </div>
      {!signedIn && (
        <Link href="/sign-in" className="inline-flex min-h-12 items-center font-extrabold text-link">
          Create a free account
        </Link>
      )}
    </div>
  );
}
