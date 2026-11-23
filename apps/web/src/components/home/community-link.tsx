"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { useAccount } from "@/lib/use-account";

/** The link on home's Community card: sign in to unlock it, or a look at what's coming. */
export function CommunityLink() {
  const signedIn = useAccount().status === "signed-in";

  return (
    <Link
      href={signedIn ? "/community" : "/sign-in"}
      className="mt-1 inline-flex min-h-12 items-center gap-2 font-extrabold text-link"
    >
      {signedIn ? "See what’s coming" : "Sign in to unlock"}{" "}
      <ArrowRight aria-hidden className="size-[17px]" />
    </Link>
  );
}
