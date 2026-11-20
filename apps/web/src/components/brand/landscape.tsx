import { cn } from "@/lib/utils";

// A triangle, for the mountains
const MOUNTAIN = "absolute h-[250px] w-[340px] [clip-path:polygon(50%_0,100%_100%,0_100%)]";
const HILL = "absolute -bottom-[18%] h-[47%] w-[90%] rounded-t-[50%]";

/**
 * A soft sky, sun, mountains and hills, drawn with CSS so it costs no image
 * downloads. Purely decorative. Position it with `className` (for example
 * `inset-0`); its parent needs `position: relative`.
 */
export function Landscape({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-testid="landscape"
      className={cn(
        "absolute overflow-hidden rounded-t-[50%] bg-linear-to-b from-[#cceafa] to-[#fef0cc] to-66%",
        className,
      )}
    >
      <div className="absolute top-[19%] right-[23%] size-[78px] rounded-full bg-[#ffd66f] shadow-[0_0_0_15px_rgb(255_214_111/0.18)]" />
      <div className={cn(MOUNTAIN, "bottom-[13%] -left-[4%] bg-[#8eabc4]")} />
      <div className={cn(MOUNTAIN, "-right-[8%] bottom-[10%] bg-[#7296a5]")} />
      <div className={cn(HILL, "-left-[35%] rotate-6 bg-[#90b982]")} />
      <div className={cn(HILL, "-right-[30%] -rotate-7 bg-[#6b966b]")} />
    </div>
  );
}
