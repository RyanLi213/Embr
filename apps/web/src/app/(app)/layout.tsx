import { BottomNav, Sidebar } from "@/components/shell/app-nav";

/**
 * The frame around every screen inside the app: the menu on the left on
 * computers, or along the bottom on phones. The welcome and sign-in pages
 * sit outside this folder, so they get the whole screen.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#content"
        className="sr-only z-[60] rounded-lg bg-card px-4 py-3 font-bold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>
      <Sidebar />
      <main id="content" className="min-h-screen pb-[76px] md:ml-[210px] md:pb-0 lg:ml-[248px]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
