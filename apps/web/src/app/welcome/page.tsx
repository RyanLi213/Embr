import { ArrowRight, Check, Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Landscape } from "@/components/brand/landscape";
import { Logo } from "@/components/brand/logo";
import { Mascot } from "@/components/brand/mascot";
import { Button } from "@/components/ui/button";

import { startCheckIn } from "./actions";

export const metadata: Metadata = { title: "Welcome" };

/** The first screen a new visitor sees. No account needed. */
export default function WelcomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fff9f0]">
      <header className="relative z-10 mx-auto flex h-[75px] max-w-[1250px] items-center justify-between px-[22px] md:h-[100px] md:px-10">
        <Logo />
        <Link
          href="/sign-in"
          className="inline-flex min-h-12 items-center rounded-lg px-2.5 font-extrabold text-link"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-75px)] max-w-[1250px] flex-col-reverse gap-1 px-[22px] pt-4 pb-10 text-center md:grid md:min-h-[calc(100vh-100px)] md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-12 md:px-10 md:pt-9 md:pb-[70px] md:text-left">
        <div className="relative z-10 max-w-[660px] pb-5 md:pb-12">
          <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.11em] text-kicker uppercase">
            <Heart aria-hidden className="size-[18px]" /> Your everyday arthritis companion
          </p>
          <h1 className="my-3 text-[45px] leading-[1.01] font-extrabold tracking-[-0.055em] md:my-5 md:text-[clamp(50px,6vw,76px)]">
            Meet each day with a little more <span className="text-ember">ease.</span>
          </h1>
          <p className="mb-7 max-w-[600px] text-[17px] leading-[1.55] text-muted-foreground md:text-xl">
            Embr helps you check in with your body, notice your patterns, and plan gently around
            the days ahead.
          </p>
          {/* A form, so the button works even before the page's scripts have loaded */}
          <form action={startCheckIn}>
            <Button type="submit" size="2xl" className="w-full md:w-auto">
              Check in now <ArrowRight aria-hidden />
            </Button>
          </form>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground md:justify-start">
            <Check aria-hidden className="size-4" /> No account needed. It takes less than 30
            seconds.
          </p>
        </div>

        <div className="relative flex min-h-[290px] w-full items-center justify-center self-stretch md:min-h-[600px]">
          <Landscape className="inset-[0_-8%_0] md:inset-[3%_-20%_0_-10%]" />
          <p className="absolute top-[9%] right-[7%] z-10 rounded-[19px_19px_19px_4px] border border-border bg-card px-[13px] py-[11px] text-left text-[13px] leading-[1.35] font-extrabold shadow-[0_10px_35px_rgb(65_44_26/0.11)] md:top-[15%] md:right-[2%] md:px-[21px] md:py-[17px] md:text-[17px]">
            Hi, I’m Embr.
            <br />
            I’m here with you.
          </p>
          <Mascot
            height={260}
            alt="Embr, a little flame with a body of warm stones, smiling"
            preload
            className="relative z-10 mt-10 h-[170px] w-auto md:mt-15 md:h-[260px]"
          />
        </div>
      </main>
    </div>
  );
}
