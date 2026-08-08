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
}

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
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevCountRef = useRef(0);

  useEffect(() => {
    const grew = messages.length > prevCountRef.current;
    prevCountRef.current = messages.length;
    if (grew && !activeMatchId) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, activeMatchId]);

  useEffect(() => {
    prevCountRef.current = 0;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeMatchId) return;
    messageRefs.current[activeMatchId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchId]);

  if (messages.length === 0) {
    return <div className="flex flex-1 flex-col overflow-y-auto">{emptyState}</div>;
  }

  const blocks = buildBlocks(messages);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto py-3">
      <div className="mx-auto flex max-w-3xl flex-col">
        {blocks.map((block) => {
          if (block.kind === "date") return <DateSeparator key={block.id} iso={block.iso} />;

          const sender = users.find((u) => u.id === block.senderId);
          const isOwn = block.senderId === currentUserId;

          return (
            <div key={block.id} className="py-0.5">
              {isGroupConversation && !isOwn && (
                <p className="px-4 pb-0.5 pl-12 text-xs font-semibold text-ink-muted">{sender?.name}</p>
              )}
              {block.items.map((message, i) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={i === block.items.length - 1}
                  senderName={sender?.name ?? "Unknown"}
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
