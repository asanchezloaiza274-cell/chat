import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface BadgeProps {
  children: ReactNode;
  variant?: "accent" | "neutral" | "danger" | "success";
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  accent: "bg-gradient-to-br from-accent to-accent-hover text-accent-ink",
  neutral: "bg-surface-active text-ink-muted",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

export function Badge({ children, variant = "accent", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
