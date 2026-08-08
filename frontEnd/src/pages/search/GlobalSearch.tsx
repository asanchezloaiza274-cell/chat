import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageSquare, User as UserIcon, MessagesSquare, SearchX } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { useChat } from "../../context/ChatContext";
import { getConversationName } from "../../utils/conversationHelpers";
import { formatListTimestamp } from "../../utils/format";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { conversations, users, messages, currentUser, startDirectConversation } = useChat();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matchedConversations = useMemo(() => {
    if (!q) return [];
    return conversations.filter((c) => getConversationName(c, users, currentUser.id).toLowerCase().includes(q));
  }, [q, conversations, users, currentUser.id]);

  const matchedPeople = useMemo(() => {
    if (!q) return [];
    return users.filter(
      (u) => u.id !== currentUser.id && (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
    );
  }, [q, users, currentUser.id]);

  const matchedMessages = useMemo(() => {
    if (!q) return [];
    return Object.values(messages)
      .flat()
      .filter((m) => m.text?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [q, messages]);

  const hasResults = matchedConversations.length > 0 || matchedPeople.length > 0 || matchedMessages.length > 0;

  return (
    <PageLayout title="Search" backTo="/chat">
      <div className="mx-auto max-w-2xl px-6 py-6">
        <div className="relative mb-6">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations, people, and messages"
            className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {!q && (
          <EmptyState
            icon={<Search size={20} />}
            title="Search Loop"
            description="Find conversations, people, and messages across your account."
          />
        )}

        {q && !hasResults && (
          <EmptyState icon={<SearchX size={20} />} title="Nothing found" description="Try a different search term." />
        )}

        {q && matchedConversations.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Conversations</h2>
            <div className="flex flex-col gap-0.5">
              {matchedConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/chat/${c.id}`)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover"
                >
                  <Avatar
                    name={getConversationName(c, users, currentUser.id)}
                    colorOverride={c.avatarColor}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {getConversationName(c, users, currentUser.id)}
                    </p>
                    <p className="text-xs text-ink-muted">{c.type === "group" ? "Group" : "Direct message"}</p>
                  </div>
                  <MessagesSquare size={15} className="shrink-0 text-ink-faint" />
                </button>
              ))}
            </div>
          </section>
        )}

        {q && matchedPeople.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">People</h2>
            <div className="flex flex-col gap-0.5">
              {matchedPeople.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/chat/${startDirectConversation(u.id)}`)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover"
                >
                  <Avatar name={u.name} status={u.status} showStatus size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{u.name}</p>
                    <p className="text-xs text-ink-muted">@{u.username}</p>
                  </div>
                  <UserIcon size={15} className="shrink-0 text-ink-faint" />
                </button>
              ))}
            </div>
          </section>
        )}

        {q && matchedMessages.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Messages</h2>
            <div className="flex flex-col gap-0.5">
              {matchedMessages.map((m) => {
                const conversation = conversations.find((c) => c.id === m.conversationId);
                const sender = users.find((u) => u.id === m.senderId);
                if (!conversation) return null;
                return (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/chat/${m.conversationId}`)}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink-faint">
                      <MessageSquare size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">
                        <span className="font-medium">{sender?.name}</span> in{" "}
                        {getConversationName(conversation, users, currentUser.id)}
                      </p>
                      <p className="truncate text-xs text-ink-muted">{m.text}</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-faint">{formatListTimestamp(m.createdAt)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
