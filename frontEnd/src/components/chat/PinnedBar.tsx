import { useRef, useState } from "react";
import { Pin, X } from "lucide-react";
import type { Message } from "../../types";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { getUser } from "../../data/mock/users";
import { cn } from "../../utils/cn";

export function PinnedBar({
  pinnedMessages,
  onUnpin,
}: {
  pinnedMessages: Message[];
  onUnpin: (messageId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  if (pinnedMessages.length === 0) return null;

  const latest = pinnedMessages[pinnedMessages.length - 1];
  const latestSender = getUser(latest.senderId)?.name ?? "Someone";

  return (
    <div ref={ref} className="relative border-b border-border bg-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-surface-hover"
      >
        <Pin size={14} className="shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-accent">
            {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? "s" : ""}
          </p>
          <p className="truncate text-xs text-ink-muted">
            {latestSender}: {latest.text ?? "Attachment"}
          </p>
        </div>
      </button>

      {open && (
        <div
          className={cn(
            "animate-scale-in absolute left-4 right-4 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-xl shadow-black/40 sm:left-auto sm:w-96",
          )}
        >
          {pinnedMessages
            .slice()
            .reverse()
            .map((m) => {
              const sender = getUser(m.senderId)?.name ?? "Someone";
              return (
                <div key={m.id} className="flex items-start gap-2 rounded-md px-2.5 py-2 hover:bg-surface-hover">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">{sender}</p>
                    <p className="truncate text-xs text-ink-muted">{m.text ?? "Attachment"}</p>
                  </div>
                  <button
                    onClick={() => onUnpin(m.id)}
                    aria-label="Unpin message"
                    className="shrink-0 rounded p-1 text-ink-faint hover:bg-surface-active hover:text-ink"
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
