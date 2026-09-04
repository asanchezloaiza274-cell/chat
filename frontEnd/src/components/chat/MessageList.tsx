import { useEffect, useRef, type ReactNode } from "react";
import type { ImageAttachment, Message, User } from "../../types";
import { DateSeparator } from "./DateSeparator";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

type Block =
  | { kind: "date"; id: string; iso: string }
  | { kind: "group"; id: string; senderId: string; items: Message[] };

function buildBlocks(messages: Message[]): Block[] {
  const blocks: Block[] = [];
  let lastDateKey: string | null = null;
  let currentGroup: Extract<Block, { kind: "group" }> | null = null;

  for (const message of messages) {
    const dateKey = new Date(message.createdAt).toDateString();
    if (dateKey !== lastDateKey) {
      blocks.push({ kind: "date", id: `date-${message.id}`, iso: message.createdAt });
      lastDateKey = dateKey;
      currentGroup = null;
    }
    if (!currentGroup || currentGroup.senderId !== message.senderId) {
      currentGroup = { kind: "group", id: `group-${message.id}`, senderId: message.senderId, items: [message] };
      blocks.push(currentGroup);
    } else {
      currentGroup.items.push(message);
    }
  }
  return blocks;
}

interface MessageListProps {
  messages: Message[];
  users: User[];
  currentUserId: string;
  isGroupConversation: boolean;
  typingUserName?: string;
  searchQuery?: string;
  activeMatchId?: string;
  onOpenImages: (images: ImageAttachment[], index: number) => void;
  emptyState?: ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const LOAD_MORE_THRESHOLD_PX = 150;

export function MessageList({
  messages,
  users,
  currentUserId,
  isGroupConversation,
  typingUserName,
  searchQuery,
  activeMatchId,
  onOpenImages,
  emptyState,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevFirstIdRef = useRef<string | null>(null);
  const prevLastIdRef = useRef<string | null>(null);
  const pendingScrollHeightRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const firstId = messages[0]?.id ?? null;
    const lastId = messages[messages.length - 1]?.id ?? null;

    if (pendingScrollHeightRef.current !== null) {
      // Older messages were prepended: keep the same messages in view instead of
      // jumping to the bottom or staying pinned to the (now different) top.
      el.scrollTop = el.scrollHeight - pendingScrollHeightRef.current;
      pendingScrollHeightRef.current = null;
    } else if (prevLastIdRef.current !== null && lastId !== prevLastIdRef.current && !activeMatchId) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }

    prevFirstIdRef.current = firstId;
    prevLastIdRef.current = lastId;
  }, [messages, activeMatchId]);

  useEffect(() => {
    prevFirstIdRef.current = null;
    prevLastIdRef.current = null;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeMatchId) return;
    messageRefs.current[activeMatchId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchId]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || !onLoadMore || !hasMore || isLoadingMore) return;
    if (el.scrollTop < LOAD_MORE_THRESHOLD_PX) {
      pendingScrollHeightRef.current = el.scrollHeight;
      onLoadMore();
    }
  }

  if (messages.length === 0) {
    return <div className="flex flex-1 flex-col overflow-y-auto">{emptyState}</div>;
  }

  const blocks = buildBlocks(messages);

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-5">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        {blocks.map((block) => {
          if (block.kind === "date") return <DateSeparator key={block.id} iso={block.iso} />;

          const sender = users.find((u) => u.id === block.senderId);
          const isOwn = block.senderId === currentUserId;

          return (
            <div key={block.id} className="py-1.5">
              {isGroupConversation && !isOwn && (
                <p className="px-6 pb-1 pl-12 text-xs font-semibold text-ink-muted">{sender?.name}</p>
              )}
              {block.items.map((message, i) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={i === block.items.length - 1}
                  senderName={sender?.name ?? "Unknown"}
                  senderAvatarUrl={sender?.avatarUrl}
                  onOpenImages={onOpenImages}
                  searchQuery={searchQuery}
                  isActiveMatch={activeMatchId === message.id}
                  registerRef={(el) => {
                    messageRefs.current[message.id] = el;
                  }}
                />
              ))}
            </div>
          );
        })}

        {typingUserName && <TypingIndicator name={typingUserName} />}
      </div>
    </div>
  );
}
