"use client";

import Link from "next/link";

import { useAccount } from "@/lib/use-account";

/** The round button at the top of home on phones: "G" for guests, your initial once signed in. */
export function AccountAvatar() {
  const account = useAccount();
  const initial =
    account.status === "signed-in" ? account.initial : account.status === "guest" ? "G" : "";

  return (
    <Link
      href="/profile"
      aria-label="Open profile"
      className="grid size-[43px] place-items-center rounded-full bg-[#ffe2c6] font-extrabold text-[#9f380f]"
    >
      {initial}
    </Link>
  );
}
