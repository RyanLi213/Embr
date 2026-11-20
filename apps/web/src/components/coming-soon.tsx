import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

import { Mascot } from "@/components/brand/mascot";
import { Kicker } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";

type ComingSoonProps = {
  eyebrow: string;
  title: string;
  body: string;
  action: { href: string; label: string };
  note?: string;
  /** Show a lock next to the mascot: this feature will need an account */
  locked?: boolean;
};

/** A friendly full-page message for a feature that isn't ready yet, or needs an account. */
export function ComingSoon({ eyebrow, title, body, action, note, locked = false }: ComingSoonProps) {
  return (
    <div className="grid min-h-[calc(100vh-76px)] place-items-center px-[18px] py-10 md:min-h-screen">
      <div className="max-w-[620px] text-center">
        <div className="relative inline-block">
          <Mascot height={150} preload className="h-[130px] w-auto md:h-[150px]" />
          {locked && (
            <span
              aria-hidden
              data-testid="lock"
              className="absolute -right-2 bottom-4 grid size-12 place-items-center rounded-full bg-[#f1e2f4] text-[#6d4a78] shadow-[0_5px_12px_rgb(43_25_48/0.15)]"
            >
              <Lock className="size-6" />
            </span>
          )}
        </div>
        <Kicker className="mt-4">{eyebrow}</Kicker>
        <h1 className="my-2.5 text-[clamp(36px,5vw,50px)] leading-[1.08] font-extrabold tracking-[-0.04em]">
          {title}
        </h1>
        <p className="mx-auto mb-6 text-lg leading-[1.55] text-muted-foreground">{body}</p>
        <Link href={action.href} className={buttonVariants({ size: "2xl" })}>
          {action.label} <ArrowRight aria-hidden />
        </Link>
        {note && <p className="mt-3 text-[13px] text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}
