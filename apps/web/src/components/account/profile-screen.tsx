"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { Kicker } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/use-account";

/** The /profile page: your account when signed in, an invitation to sign in when not. */
export function ProfileScreen() {
  const account = useAccount();
  const { signOut } = useClerk();

  if (account.status === "loading") return <div aria-busy className="min-h-screen" />;

  if (account.status === "guest") {
    return (
      <ComingSoon
        locked
        eyebrow="Keep your check-ins safe"
        title="Take Embr with you."
        body="Create a free account to keep your check-ins backed up and available on every device."
        action={{ href: "/sign-in", label: "Sign in to unlock" }}
        note="Free to join. Your data stays yours."
      />
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-76px)] place-items-center px-[18px] py-10 md:min-h-screen">
      <section className="w-full max-w-[560px] rounded-[28px] border border-border bg-card px-[22px] py-8 shadow-[0_12px_35px_rgb(118_72_30/0.06)] md:px-11 md:py-10">
        <span
          aria-hidden
          className="grid size-16 place-items-center rounded-full bg-[#ffe2c6] text-2xl font-extrabold text-[#9f380f]"
        >
          {account.initial}
        </span>
        <Kicker className="mt-5">Your account</Kicker>
        <h1 className="mt-2 mb-5 text-[clamp(30px,4vw,40px)] leading-[1.1] font-extrabold tracking-[-0.03em] break-words">
          {account.name ?? "Welcome to Embr"}
        </h1>

        <dl className="grid gap-3">
          {account.email && <Detail label="Email" value={account.email} />}
          {account.phone && <Detail label="Phone" value={account.phone} />}
        </dl>

        <p className="mt-5 text-sm leading-[1.5] text-muted-foreground">
          Your check-ins are still saved in this browser for now. Saving them to your account is
          coming next.
        </p>

        <Button
          variant="outline"
          size="xl"
          className="mt-6 w-full"
          onClick={() => void signOut({ redirectUrl: "/" })}
        >
          Sign out <LogOut aria-hidden />
        </Button>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted px-4 py-3">
      <dt className="text-sm font-bold text-muted-foreground">{label}</dt>
      <dd className="text-lg font-extrabold break-words">{value}</dd>
    </div>
  );
}
