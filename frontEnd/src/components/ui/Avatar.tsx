import { avatarColor, initials } from "../../utils/avatarColor";
import type { UserStatus } from "../../types";
import { cn } from "../../utils/cn";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: UserStatus;
  showStatus?: boolean;
  className?: string;
  colorOverride?: string;
  imageUrl?: string;
  glow?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-[13px]",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

const STATUS_DOT_SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4",
};

const STATUS_COLOR: Record<UserStatus, string> = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-ink-faint",
};

export function Avatar({ name, size = "md", status, showStatus, className, colorOverride, imageUrl, glow }: AvatarProps) {
  return (
    <div
      className={cn("relative inline-flex shrink-0 rounded-full", glow && "shadow-[0_0_0_3px_var(--color-accent-soft),0_0_16px_var(--color-accent-soft)]", className)}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={cn("select-none rounded-full object-cover", SIZE_CLASSES[size])}
        />
      ) : (
        <div
          className={cn(
            "flex select-none items-center justify-center rounded-full font-medium text-white",
            SIZE_CLASSES[size],
          )}
          style={{ backgroundColor: colorOverride ?? avatarColor(name) }}
          aria-hidden="true"
        >
          {initials(name)}
        </div>
      )}
      {showStatus && status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-panel",
            STATUS_DOT_SIZE[size],
            STATUS_COLOR[status],
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}
