import Image from "next/image";

import { cn } from "@/lib/utils";

// Size of the artwork file, used to keep its shape when it is scaled
const ART_WIDTH = 198;
const ART_HEIGHT = 335;

type MascotProps = {
  /** Height in pixels. The width follows the artwork's shape. */
  height?: number;
  /**
   * What a screen reader says. Leave it empty when the mascot only decorates
   * the page, so screen reader users don't hear about it on every screen.
   */
  alt?: string;
  /** Load the image straight away. Use for the mascot at the top of a page. */
  preload?: boolean;
  className?: string;
};

/**
 * Embr, the mascot. This is the artwork from the marketing site, used until
 * the team finishes the new design; swapping it only means changing this file.
 */
export function Mascot({ height = 120, alt = "", preload = false, className }: MascotProps) {
  return (
    <Image
      src="/embr/front.webp"
      alt={alt}
      width={Math.round((height * ART_WIDTH) / ART_HEIGHT)}
      height={height}
      preload={preload}
      className={cn("drop-shadow-[0_9px_8px_rgb(75_45_29/0.12)]", className)}
    />
  );
}
