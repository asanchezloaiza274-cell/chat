import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Tooltip } from "./Tooltip";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "ghost" | "solid" | "danger";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<IconButtonProps["variant"]>, string> = {
  ghost: "text-ink-muted hover:bg-surface-hover hover:text-ink",
  solid: "bg-surface text-ink hover:bg-surface-hover border border-border",
  danger: "text-danger hover:bg-danger-soft",
};

const SIZE_CLASSES: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, variant = "ghost", size = "md", showTooltip = true, children, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          "inline-flex shrink-0 items-center justify-center transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-45",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );

    if (!showTooltip) return button;
    return <Tooltip label={label}>{button}</Tooltip>;
  },
);
IconButton.displayName = "IconButton";
