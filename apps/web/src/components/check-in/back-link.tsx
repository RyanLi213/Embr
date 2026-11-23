import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

/** "← Back" at the top left of a check-in screen, going home. */
export function BackLink() {
  return (
    <Link href="/" className={buttonVariants({ variant: "ghost", size: "xl", className: "-ml-3" })}>
      <ArrowLeft aria-hidden /> Back
    </Link>
  );
}
