import { ChevronRight, Lock, Sun } from "lucide-react";
import Link from "next/link";

import { AccountAvatar } from "@/components/account/account-avatar";
import { Logo } from "@/components/brand/logo";
import { Mascot } from "@/components/brand/mascot";
import { ColourKey } from "@/components/check-in/colour-key";
import { CommunityLink } from "@/components/home/community-link";
import { Greeting } from "@/components/home/greeting";
import { TodayCard } from "@/components/home/today-card";
import { WeekStrip } from "@/components/home/week-strip";
import { Kicker, Page } from "@/components/shell/page";

const CARD = "rounded-[22px] border shadow-[0_6px_20px_rgb(55_36_21/0.035)]";

/** The home screen: what a returning visitor sees every day. */
export default function HomePage() {
  return (
    <Page>
      {/* Phones only: the sidebar is hidden there, so show the logo here */}
      <header className="mb-5 flex items-center justify-between md:hidden">
        <Logo className="origin-left scale-[0.86]" />
        <AccountAvatar />
      </header>

      <section className="mb-3 flex min-h-[120px] max-w-[850px] items-center justify-between gap-4 md:mb-5 md:min-h-[155px]">
        <Greeting />
        <Mascot height={130} preload className="h-[100px] w-auto shrink-0 md:h-[130px]" />
      </section>

      <TodayCard />

      <div className="mt-4 grid gap-5 md:mt-[22px] lg:grid-cols-[1.5fr_1fr]">
        <WeekPanel />
        <InsightPanel />
      </div>

      <MoreFromEmbr />
    </Page>
  );
}

/** This week's seven days. They fill with colour as check-ins are saved. */
function WeekPanel() {
  return (
    <section
      aria-labelledby="week-heading"
      className={`${CARD} border-border bg-card px-[17px] pt-[23px] pb-[18px] md:px-[30px] md:pt-[27px] md:pb-[22px]`}
    >
      <div className="flex items-center justify-between">
        <div>
          <Kicker>Your rhythm</Kicker>
          <h2 id="week-heading" className="mt-1 text-[22px] font-extrabold tracking-[-0.02em]">
            This week at a glance
          </h2>
        </div>
        <Link
          href="/calendar"
          aria-label="Open calendar"
          className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ChevronRight aria-hidden className="size-[22px]" />
        </Link>
      </div>

      <WeekStrip />

      <p className="mt-5 text-sm text-muted-foreground">Check in each day to colour your week.</p>
      <ColourKey className="mt-2" />
    </section>
  );
}

/** Where gentle patterns will appear once there are a few check-ins. */
function InsightPanel() {
  return (
    <section
      aria-labelledby="insight-heading"
      className={`${CARD} flex items-start gap-[18px] border-[#d6e1f5] bg-[#f0f5ff] px-[27px] py-[31px]`}
    >
      <div
        aria-hidden
        className="grid size-[47px] shrink-0 place-items-center rounded-[15px] bg-[#ffdfa1] text-[#8a5a00]"
      >
        <Sun className="size-[22px]" />
      </div>
      <div>
        <Kicker as="h2">
          <span id="insight-heading">A gentle insight</span>
        </Kicker>
        <p className="mt-2 mb-3 text-[17px] leading-[1.38] font-bold">
          After a few check-ins, I’ll point out patterns I notice here.
        </p>
        <p className="text-sm text-muted-foreground">Based only on your own check-ins</p>
      </div>
    </section>
  );
}

/** Features on the way: personalized news, and the community (needs an account). */
function MoreFromEmbr() {
  return (
    <section aria-labelledby="more-heading" className="mt-[30px] md:mt-[42px]">
      <Kicker>More from Embr</Kicker>
      <h2 id="more-heading" className="mt-1 text-[22px] font-extrabold tracking-[-0.02em]">
        Here when you’re ready
      </h2>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <article className="flex min-h-[210px] items-start gap-6 overflow-hidden rounded-[22px] border border-border bg-[#fff6df] p-[22px] md:items-center md:p-[27px]">
          {/* A tiny sun-and-hills picture */}
          <div
            aria-hidden
            className="relative size-[84px] shrink-0 overflow-hidden rounded-full bg-[#b8dbef] md:h-[130px] md:w-32"
          >
            <div className="absolute top-5 right-[22px] size-[27px] rounded-full bg-[#ffd16a]" />
            <div className="absolute -bottom-[45px] -left-[15px] h-[100px] w-[180px] rounded-full bg-[#91b87b] shadow-[70px_-14px_0_#668d65]" />
          </div>
          <div>
            <Kicker className="text-[11px]">Coming soon</Kicker>
            <h3 className="mt-2 mb-1 text-[21px] font-extrabold">News for you</h3>
            <p className="leading-[1.45] text-muted-foreground">
              Thoughtful stories and practical ideas, chosen around what matters to you.
            </p>
          </div>
        </article>

        <article className="flex min-h-[210px] items-start gap-6 overflow-hidden rounded-[22px] border border-[#e2d7e8] bg-[#f6eff9] p-[22px] md:items-center md:p-[27px] md:pl-[38px]">
          <div
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-full bg-white text-[#74527e]"
          >
            <Lock className="size-[19px]" />
          </div>
          <div>
            <Kicker className="text-[11px]">Coming soon</Kicker>
            <h3 className="mt-2 mb-1 text-[21px] font-extrabold">Community</h3>
            <p className="leading-[1.45] text-muted-foreground">
              A kind place to learn from people who understand the ups and downs.
            </p>
            <CommunityLink />
          </div>
        </article>
      </div>
    </section>
  );
}
