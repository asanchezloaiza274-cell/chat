import { CornerUpLeft, Copy, Pencil, Trash2, Pin, PinOff, MailQuestion, MoreHorizontal } from "lucide-react";
import { QUICK_REACTIONS } from "../../data/emojis";
import { Dropdown, type DropdownItem } from "../ui/Dropdown";
import { cn } from "../../utils/cn";

interface MessageHoverToolbarProps {
  isOwn: boolean;
  isPinned?: boolean;
  canEdit: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onMarkUnread: () => void;
}

export function MessageHoverToolbar({
  isOwn,
  isPinned,
  canEdit,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onTogglePin,
  onMarkUnread,
}: MessageHoverToolbarProps) {
  const items: (DropdownItem | "separator")[] = [
    { label: "Reply", icon: <CornerUpLeft size={15} />, onClick: onReply },
    { label: "Copy", icon: <Copy size={15} />, onClick: onCopy },
  ];
  if (canEdit) {
    items.push({ label: "Edit", icon: <Pencil size={15} />, onClick: onEdit });
  }
  items.push({
    label: isPinned ? "Unpin" : "Pin",
    icon: isPinned ? <PinOff size={15} /> : <Pin size={15} />,
    onClick: onTogglePin,
  });
  items.push({ label: "Mark as unread", icon: <MailQuestion size={15} />, onClick: onMarkUnread });
  if (isOwn) {
    items.push("separator");
    items.push({ label: "Delete", icon: <Trash2 size={15} />, onClick: onDelete, danger: true });
  }

  return (
    <div
      className={cn(
        "shadow-elevated-sm absolute -top-4 z-10 flex items-center gap-0.5 border border-border-strong bg-surface-active p-0.5 opacity-0 transition-opacity group-hover/message:opacity-100",
        isOwn ? "right-2" : "left-2",
      )}
    >
      {QUICK_REACTIONS.slice(0, 4).map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          aria-label={`React with ${emoji}`}
          className="flex h-7 w-7 items-center justify-center text-sm hover:bg-surface-hover"
        >
          {emoji}
        </button>
      ))}
      <Dropdown
        align={isOwn ? "right" : "left"}
        trigger={
          <button
            aria-label="More actions"
            className="flex h-7 w-7 items-center justify-center text-ink-muted hover:bg-surface-hover hover:text-ink"
          >
            <MoreHorizontal size={15} />
          </button>
        }
        items={items}
      />
    </div>
  );
}
