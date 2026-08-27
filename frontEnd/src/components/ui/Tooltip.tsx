import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const SIDE_CLASSES: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
};

export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "shadow-elevated-sm pointer-events-none absolute z-50 whitespace-nowrap border border-border-strong bg-surface-active px-2 py-1 text-[11px] font-medium text-ink opacity-0 transition-opacity delay-300 duration-100 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          SIDE_CLASSES[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
