import {
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Landscape } from "@/components/brand/landscape";
import { Logo } from "@/components/brand/logo";
import { Mascot } from "@/components/brand/mascot";
import { Kicker } from "@/components/shell/page";

const BENEFITS: { icon: LucideIcon; text: string }[] = [
  { icon: RefreshCw, text: "Sync between phone and computer" },
  { icon: ShieldCheck, text: "Keep every check-in safe" },
  { icon: Sparkles, text: "Get more helpful personalization" },
  { icon: Users, text: "Join the community when it opens" },
];

/**
 * Fits Clerk's form into our page: our heading replaces Clerk's, the form sits
 * on the page instead of in a separate card, and buttons and fields are big
 * and easy to press, like the rest of Embr. Colours come from the theme set in
 * the root layout.
 */
export const FORM_APPEARANCE = {
  elements: {
    header: "hidden",
    rootBox: "w-full",
    cardBox: "w-full rounded-none border-0 shadow-none",
    card: "bg-transparent p-0 shadow-none",
    footer: "bg-transparent bg-none",
    socialButtonsBlockButton: "h-12 text-base",
    // Clerk's grey text is too faint to read easily (4.2:1); navy passes WCAG AA
    socialButtonsBlockButtonText: "text-base font-bold text-foreground",
    formFieldInput: "h-12 text-base",
    formButtonPrimary: "h-12 text-base font-extrabold",
  },
  options: {
    // Hide the orange "Development mode" stamp Clerk shows while we use its
    // free test keys: visitors shouldn't see it, and its text is too faint to
    // read. Developers still get Clerk's warning in the browser console.
    unsafe_disableDevelopmentModeWarnings: true,
  },
};

type AuthLayoutProps = {
  title: string;
  intro: string;
  /** Clerk's sign-in or sign-up form */
  children: React.ReactNode;
};

/** The sign-in and sign-up screens: why an account helps, then the form (from the Figma). */
export function AuthLayout({ title, intro, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fffdf9] md:grid md:grid-cols-[38%_62%] lg:grid-cols-[minmax(390px,43%)_1fr]">
      {/* Left (top on phones): why an account is worth having */}
      <section className="relative min-h-[240px] overflow-hidden bg-[#ffedda] p-6 md:min-h-screen md:p-8 lg:px-12 lg:py-9">
        <Logo className="relative z-10" />
        <div className="relative z-10 mt-4 flex items-center gap-4 md:mx-auto md:mt-14 md:block md:max-w-[490px] lg:mt-20">
          <Mascot height={150} className="h-[100px] w-auto shrink-0 md:h-[150px]" />
          <p className="text-[27px] leading-[1.08] font-extrabold tracking-[-0.04em] md:mt-2.5 md:mb-7 md:text-[clamp(35px,4vw,49px)]">
            A little more support, wherever you are.
          </p>
          <ul className="hidden flex-col gap-4 md:flex">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 font-bold">
                <Icon aria-hidden className="size-[22px] shrink-0 text-ember" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <Landscape className="inset-[0_-10%] opacity-30 md:inset-[51%_-20%_-20%_-20%] md:opacity-70" />
      </section>

      {/* Right (below on phones): the form */}
      <main className="px-[22px] pt-5 pb-12 md:px-[clamp(30px,7vw,100px)] md:py-9">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center gap-2 rounded-lg font-extrabold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-5" /> Back to Embr
        </Link>
        <div className="mx-auto mt-6 max-w-[440px] md:mt-12">
          <Kicker>Welcome</Kicker>
          <h1 className="my-2 text-[34px] leading-[1.12] font-extrabold tracking-[-0.035em] md:text-[39px]">
            {title}
          </h1>
          <p className="mb-6 leading-[1.5] text-muted-foreground">{intro}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
