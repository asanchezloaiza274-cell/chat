import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, MessageSquarePlus, Search, SearchX, X } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { ConversationItem } from "./ConversationItem";
import { IconButton } from "../ui/IconButton";
import { Dropdown } from "../ui/Dropdown";
import { EmptyState } from "../ui/EmptyState";
import { ConversationListSkeleton } from "../ui/Skeleton";
import { getConversationName } from "../../utils/conversationHelpers";

export function ConversationList({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { conversations, messages, users, currentUser, typingUsers, isLoading } = useChat();
  const navigate = useNavigate();
  const { id: activeId } = useParams();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => getConversationName(c, users, currentUser.id).toLowerCase().includes(q));
  }, [conversations, users, currentUser.id, query]);

  const pinned = filtered.filter((c) => c.pinned);
  const rest = filtered.filter((c) => !c.pinned);

  return (
    <div className="flex h-full w-full flex-col bg-panel lg:w-80 lg:border-r lg:border-border">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex items-center gap-2">
          <IconButton label="Open menu" size="sm" onClick={onOpenMenu} className="lg:hidden">
            <Menu size={18} />
          </IconButton>
          <h1 className="text-lg font-semibold tracking-[-0.015em] text-ink">Chats</h1>
        </div>
        <Dropdown
          align="right"
          trigger={
            <IconButton label="New conversation" showTooltip={false}>
              <MessageSquarePlus size={19} />
            </IconButton>
          }
          items={[
            { label: "New chat", onClick: () => navigate("/new-chat") },
            { label: "New group", onClick: () => navigate("/new-group") },
          ]}
        />
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-8 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<MessageSquarePlus size={22} />}
            title="No conversations yet"
            description="Start a new conversation to get started."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<SearchX size={22} />} title="Nothing found" description="Try a different search." />
        ) : (
          <div className="flex flex-col gap-4">
            {pinned.length > 0 && (
              <div>
                <p className="px-2 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Pinned</p>
                <div className="flex flex-col gap-1">
                  {pinned.map((c) => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      messages={messages[c.id]}
                      users={users}
                      currentUserId={currentUser.id}
                      isActive={c.id === activeId}
                      isTyping={(typingUsers[c.id]?.length ?? 0) > 0}
                      onClick={() => navigate(`/chat/${c.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              {pinned.length > 0 && (
                <p className="px-2 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">All chats</p>
              )}
              <div className="flex flex-col gap-0.5">
                {rest.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    messages={messages[c.id]}
                    users={users}
                    currentUserId={currentUser.id}
                    isActive={c.id === activeId}
                    isTyping={(typingUsers[c.id]?.length ?? 0) > 0}
                    onClick={() => navigate(`/chat/${c.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
