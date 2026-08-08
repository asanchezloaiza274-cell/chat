import { Avatar } from "../ui/Avatar";

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <Avatar name={name} size="xs" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface px-3.5 py-2.5">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-faint [animation-delay:0ms]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-faint [animation-delay:150ms]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-faint [animation-delay:300ms]" />
      </div>
    </div>
  );
}
