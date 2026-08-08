import type { Reaction } from "../../types";
import { cn } from "../../utils/cn";

interface ReactionBarProps {
  reactions: Reaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}

export function ReactionBar({ reactions, currentUserId, onToggle }: ReactionBarProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {reactions.map((reaction) => {
        const reacted = reaction.userIds.includes(currentUserId);
        return (
          <button
            key={reaction.emoji}
            onClick={() => onToggle(reaction.emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
              reacted
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-border bg-surface text-ink-muted hover:bg-surface-hover",
            )}
          >
            <span>{reaction.emoji}</span>
            <span className="font-medium">{reaction.userIds.length}</span>
          </button>
        );
      })}
    </div>
  );
}
