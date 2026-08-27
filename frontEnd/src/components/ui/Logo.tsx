import { MessagesSquare } from "lucide-react";
import { cn } from "../../utils/cn";

export function Logo({ size = "md", showWordmark = true }: { size?: "sm" | "md" | "lg"; showWordmark?: boolean }) {
  const boxSize = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 22 : 18;
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("flex shrink-0 items-center justify-center bg-accent text-accent-ink", boxSize)}>
        <MessagesSquare size={iconSize} strokeWidth={2.25} />
      </div>
      {showWordmark && (
        <span className={cn("font-semibold tracking-[-0.02em] text-ink", textSize)}>Loop</span>
      )}
    </div>
  );
}
