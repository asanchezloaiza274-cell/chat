import { X, CornerUpLeft } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { cn } from "../../utils/cn";

interface ReplyPreviewProps {
  senderName: string;
  preview: string;
  onCancel?: () => void;
  variant?: "composer" | "inline";
  onAccent?: boolean;
}

export function ReplyPreview({ senderName, preview, onCancel, variant = "composer", onAccent }: ReplyPreviewProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "mb-1.5 flex items-start gap-1.5 rounded-md border-l-2 px-2 py-1 text-xs",
          onAccent ? "border-white/50 bg-black/15" : "border-accent bg-black/10",
        )}
      >
        <CornerUpLeft size={12} className={cn("mt-0.5 shrink-0", onAccent ? "text-white/60" : "text-ink-faint")} />
        <div className="min-w-0">
          <p className={cn("font-medium", onAccent ? "text-white" : "text-accent")}>{senderName}</p>
          <p className={cn("truncate", onAccent ? "text-white/70" : "text-ink-muted")}>{preview}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-2.5">
      <div className="flex min-w-0 items-start gap-2">
        <CornerUpLeft size={15} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-accent">Replying to {senderName}</p>
          <p className="truncate text-xs text-ink-muted">{preview}</p>
        </div>
      </div>
      {onCancel && (
        <IconButton label="Cancel reply" size="sm" onClick={onCancel} showTooltip={false}>
          <X size={15} />
        </IconButton>
      )}
    </div>
  );
}
