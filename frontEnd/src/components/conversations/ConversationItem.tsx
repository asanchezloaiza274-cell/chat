import { Pin, BellOff } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { cn } from "../../utils/cn";
import { formatListTimestamp } from "../../utils/format";
import {
  getConversationName,
  getDirectOtherUser,
  getLastMessage,
  getMessagePreview,
} from "../../utils/conversationHelpers";
import type { Conversation, Message, User } from "../../types";

interface ConversationItemProps {
  conversation: Conversation;
  messages: Message[] | undefined;
  users: User[];
  currentUserId: string;
  isActive: boolean;
  isTyping?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  messages,
  users,
  currentUserId,
  isActive,
  isTyping,
  onClick,
}: ConversationItemProps) {
  const name = getConversationName(conversation, users, currentUserId);
  const otherUser = getDirectOtherUser(conversation, users, currentUserId);
  const lastMessage = getLastMessage(messages);
  const preview = getMessagePreview(lastMessage, currentUserId);
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      aria-current={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors",
        isActive ? "bg-accent-soft" : "hover:bg-surface-hover",
      )}
    >
      <Avatar
        name={name}
        status={otherUser?.status}
        showStatus={conversation.type === "direct"}
        colorOverride={conversation.avatarColor}
        imageUrl={otherUser?.avatarUrl}
        size="md"
        glow={isActive}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm", hasUnread ? "font-semibold text-ink" : "font-medium text-ink")}>
            {name}
          </span>
          {lastMessage && (
            <span className={cn("shrink-0 font-mono text-[11px]", hasUnread ? "font-medium text-accent" : "text-ink-faint")}>
              {formatListTimestamp(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={cn("truncate text-xs", hasUnread ? "text-ink" : "text-ink-muted")}>
            {isTyping ? <span className="italic text-accent">typing…</span> : preview}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {conversation.muted && <BellOff size={12} className="text-ink-faint" />}
            {conversation.pinned && <Pin size={12} className="text-ink-faint" />}
            {hasUnread && !conversation.muted && <Badge variant="accent">{conversation.unreadCount}</Badge>}
          </div>
        </div>
      </div>
    </button>
  );
}
