import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { PinnedBar } from "../../components/chat/PinnedBar";
import { ChatSearchBar } from "../../components/chat/ChatSearchBar";
import { MessageList } from "../../components/chat/MessageList";
import { MessageInput } from "../../components/chat/MessageInput";
import { ImageViewer } from "../../components/chat/ImageViewer";
import { ConversationInfoPanel } from "../../components/chat/ConversationInfoPanel";
import { Avatar } from "../../components/ui/Avatar";
import { getDirectOtherUser, getConversationName } from "../../utils/conversationHelpers";
import type { ImageAttachment } from "../../types";

export default function ChatWindow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { conversations, messages, users, currentUser, typingUsers, togglePinMessage, setActiveConversationId } =
    useChat();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [viewer, setViewer] = useState<{ images: ImageAttachment[]; index: number } | null>(null);

  const conversation = conversations.find((c) => c.id === id);
  const conversationMessages = useMemo(() => messages[id ?? ""] ?? [], [messages, id]);

  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return conversationMessages.filter((m) => m.text?.toLowerCase().includes(q));
  }, [conversationMessages, searchQuery]);

  useEffect(() => {
    if (!conversation) navigate("/chat", { replace: true });
  }, [conversation, navigate]);

  useEffect(() => {
    if (id) setActiveConversationId(id);
    return () => setActiveConversationId(null);
  }, [id, setActiveConversationId]);

  if (!conversation) {
    return null;
  }

  const otherUser = getDirectOtherUser(conversation, users, currentUser.id);
  const typingId = typingUsers[conversation.id]?.[0];
  const typingUserName = typingId ? users.find((u) => u.id === typingId)?.name : undefined;
  const pinnedMessages = conversationMessages.filter((m) => m.pinned);
  const name = getConversationName(conversation, users, currentUser.id);

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      <ChatHeader
        conversation={conversation}
        otherUser={otherUser}
        onOpenInfo={() => setIsInfoOpen(true)}
        onToggleSearch={() => {
          setIsSearchOpen((o) => !o);
          setSearchQuery("");
        }}
        isSearchOpen={isSearchOpen}
      />

      {isSearchOpen && (
        <ChatSearchBar
          query={searchQuery}
          onQueryChange={(q) => {
            setSearchQuery(q);
            setActiveMatchIndex(0);
          }}
          matchCount={matches.length}
          activeIndex={activeMatchIndex}
          onPrev={() => setActiveMatchIndex((i) => (i - 1 + matches.length) % matches.length)}
          onNext={() => setActiveMatchIndex((i) => (i + 1) % matches.length)}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery("");
          }}
        />
      )}

      <PinnedBar pinnedMessages={pinnedMessages} onUnpin={(messageId) => togglePinMessage(conversation.id, messageId)} />

      <MessageList
        messages={conversationMessages}
        users={users}
        currentUserId={currentUser.id}
        isGroupConversation={conversation.type === "group"}
        typingUserName={typingUserName}
        searchQuery={searchQuery.trim() ? searchQuery : undefined}
        activeMatchId={matches[activeMatchIndex]?.id}
        onOpenImages={(images, index) => setViewer({ images, index })}
        emptyState={
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <Avatar
              name={name}
              size="xl"
              status={otherUser?.status}
              showStatus={conversation.type === "direct"}
              colorOverride={conversation.avatarColor}
            />
            <h3 className="mt-3 text-base font-semibold text-ink">{name}</h3>
            <p className="mt-1 max-w-xs text-sm text-ink-muted">
              This is the beginning of your conversation. Send a message to get started.
            </p>
          </div>
        }
      />

      <MessageInput conversationId={conversation.id} />

      {viewer && (
        <ImageViewer
          images={viewer.images}
          index={viewer.index}
          onClose={() => setViewer(null)}
          onNavigate={(index) => setViewer({ images: viewer.images, index })}
        />
      )}

      <ConversationInfoPanel
        open={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        conversation={conversation}
        messages={conversationMessages}
        otherUser={otherUser}
      />
    </div>
  );
}
