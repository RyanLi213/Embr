"use client";

import {
  CalendarDays,
  ChevronRight,
  House,
  Lock,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { useAccount } from "@/lib/use-account";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only works with an account */
  needsAccount?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/check-in", label: "Check in", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/community", label: "Community", icon: Users, needsAccount: true },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/** True when `href` is the page being shown (or a page inside it). */
export function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The menu down the left side, on tablets and computers. */
export function Sidebar() {
  const pathname = usePathname();
  // Community needs an account, so it shows a lock until someone signs in
  const signedIn = useAccount().status === "signed-in";

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[210px] flex-col border-r border-sidebar-border bg-sidebar px-[18px] pt-9 pb-6 md:flex lg:w-[248px] lg:px-6">
      <Logo />
      <nav aria-label="Main" className="mt-13 flex flex-col gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, needsAccount }) => {
          const current = isCurrent(pathname, href);
          const locked = needsAccount && !signedIn;
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              aria-label={locked ? `${label} (needs an account)` : undefined}
              className={cn(
                "relative flex min-h-[54px] items-center gap-3.5 rounded-[15px] px-[15px] font-bold text-sidebar-foreground transition-colors hover:bg-accent hover:text-foreground",
                current &&
                  "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              {current && (
                <span
                  aria-hidden
                  className="absolute -left-[18px] h-[29px] w-1 rounded-r-md bg-ember lg:-left-6"
                />
              )}
              <Icon aria-hidden className="size-[22px]" />
              <span>{label}</span>
              {locked && <Lock aria-hidden className="ml-auto size-4" />}
            </Link>
          );
        })}
      </nav>
      <AccountCard />
    </aside>
  );
}

/** Who is using Embr, at the bottom of the sidebar: a guest, or the signed-in person. */
function AccountCard() {
  const account = useAccount();

  let initial = "";
  let title = "";
  let subtitle = "";
  if (account.status === "guest") {
    [initial, title, subtitle] = ["G", "Guest", "Saved in this browser"];
  } else if (account.status === "signed-in") {
    initial = account.initial;
    title = account.name ?? account.email ?? "Your account";
    subtitle = "Signed in";
  }

  return (
    <div className="mt-auto grid grid-cols-[43px_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-sidebar-border pt-5">
      <span
        aria-hidden
        className="grid size-[43px] place-items-center rounded-full bg-[#ffe2c6] font-extrabold text-[#9f380f]"
      >
        {initial}
      </span>
      {/* Empty while Clerk starts, instead of flashing "Guest" at someone signed in */}
      <div className="min-h-[38px]">
        <p className="truncate text-[15px] font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Link
        href="/profile"
        aria-label="Open profile"
        className="grid h-11 w-9 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
      >
        <ChevronRight aria-hidden className="size-[18px]" />
      </Link>
    </div>
  );
}

/** The menu along the bottom of the screen, on phones. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 grid h-[72px] grid-cols-5 border-t border-border bg-sidebar/95 px-1.5 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const current = isCurrent(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg text-xs font-extrabold text-muted-foreground",
              current && "text-primary",
            )}
          >
            <Icon aria-hidden className="size-[21px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
