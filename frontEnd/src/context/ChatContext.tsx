import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { users as mockUsers, CURRENT_USER_ID, getUser } from "../data/mock/users";
import { conversations as mockConversations } from "../data/mock/conversations";
import { messagesByConversation as mockMessages } from "../data/mock/messages";
import type { Attachment, Conversation, Message, User } from "../types";
import { getOtherParticipants } from "../utils/conversationHelpers";

const AUTO_REPLIES = [
  "Sounds good!",
  "Got it, thanks.",
  "Perfect, talk soon.",
  "On it 👍",
  "Makes sense to me.",
  "I'll take a look shortly.",
  "Appreciate it!",
  "Let's do that.",
];

interface ChatContextValue {
  users: User[];
  currentUser: User;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  typingUsers: Record<string, string[]>;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, text: string, attachments?: Attachment[]) => void;
  replyDraft: { messageId: string; senderId: string; preview: string } | null;
  setReplyDraft: (draft: { messageId: string; senderId: string; preview: string } | null) => void;
  toggleReaction: (conversationId: string, messageId: string, emoji: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  editMessage: (conversationId: string, messageId: string, text: string) => void;
  togglePinMessage: (conversationId: string, messageId: string) => void;
  retryMessage: (conversationId: string, messageId: string) => void;
  togglePinConversation: (conversationId: string) => void;
  toggleMuteConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  markConversationRead: (conversationId: string) => void;
  startDirectConversation: (userId: string) => string;
  createGroupConversation: (name: string, participantIds: string[], avatarColor?: string) => string;
  updateCurrentUser: (updates: Partial<User>) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [replyDraft, setReplyDraft] = useState<{ messageId: string; senderId: string; preview: string } | null>(
    null,
  );

  const activeIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)!;

  const updateCurrentUser = useCallback((updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === CURRENT_USER_ID ? { ...u, ...updates } : u)));
  }, []);

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id);
    setReplyDraft(null);
    if (id) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    }
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
  }, []);

  const updateMessage = useCallback(
    (conversationId: string, messageId: string, updater: (m: Message) => Message) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((m) => (m.id === messageId ? updater(m) : m)),
      }));
    },
    [],
  );

  const sendMessage = useCallback(
    (conversationId: string, text: string, attachments?: Attachment[]) => {
      const id = crypto.randomUUID();
      const message: Message = {
        id,
        conversationId,
        senderId: currentUser.id,
        text: text.trim() || undefined,
        attachments,
        createdAt: new Date().toISOString(),
        status: "sending",
        replyTo: replyDraft ?? undefined,
      };

      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), message],
      }));
      setReplyDraft(null);

      setTimeout(() => updateMessage(conversationId, id, (m) => ({ ...m, status: "sent" })), 400);
      setTimeout(() => updateMessage(conversationId, id, (m) => ({ ...m, status: "delivered" })), 1100);

      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation && conversation.type === "direct") {
        const otherId = getOtherParticipants(conversation, currentUser.id)[0];
        const otherUser = getUser(otherId);
        if (otherUser && otherUser.status === "online" && Math.random() < 0.85) {
          setTimeout(() => {
            setTypingUsers((prev) => ({ ...prev, [conversationId]: [otherId] }));
          }, 1400);

          const replyDelay = 1400 + 1200 + Math.random() * 1400;
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[conversationId];
              return next;
            });
            const reply: Message = {
              id: crypto.randomUUID(),
              conversationId,
              senderId: otherId,
              text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
              createdAt: new Date().toISOString(),
              status: "delivered",
            };
            setMessages((prev) => ({
              ...prev,
              [conversationId]: [...(prev[conversationId] ?? []), reply],
            }));
            updateMessage(conversationId, id, (m) => ({ ...m, status: "read" }));
            if (activeIdRef.current !== conversationId) {
              setConversations((prev) =>
                prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c)),
              );
            }
          }, replyDelay);
        }
      }
    },
    [conversations, currentUser.id, replyDraft, updateMessage],
  );

  const toggleReaction = useCallback(
    (conversationId: string, messageId: string, emoji: string) => {
      updateMessage(conversationId, messageId, (m) => {
        const reactions = m.reactions ? [...m.reactions] : [];
        const idx = reactions.findIndex((r) => r.emoji === emoji);
        if (idx === -1) {
          reactions.push({ emoji, userIds: [currentUser.id] });
        } else {
          const already = reactions[idx].userIds.includes(currentUser.id);
          const userIds = already
            ? reactions[idx].userIds.filter((id) => id !== currentUser.id)
            : [...reactions[idx].userIds, currentUser.id];
          if (userIds.length === 0) {
            reactions.splice(idx, 1);
          } else {
            reactions[idx] = { ...reactions[idx], userIds };
          }
        }
        return { ...m, reactions };
      });
    },
    [currentUser.id, updateMessage],
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string) => {
      updateMessage(conversationId, messageId, (m) => ({
        ...m,
        deleted: true,
        text: undefined,
        attachments: undefined,
        reactions: undefined,
        pinned: false,
      }));
    },
    [updateMessage],
  );

  const editMessage = useCallback(
    (conversationId: string, messageId: string, text: string) => {
      updateMessage(conversationId, messageId, (m) => ({ ...m, text, edited: true }));
    },
    [updateMessage],
  );

  const togglePinMessage = useCallback(
    (conversationId: string, messageId: string) => {
      updateMessage(conversationId, messageId, (m) => ({ ...m, pinned: !m.pinned }));
    },
    [updateMessage],
  );

  const retryMessage = useCallback(
    (conversationId: string, messageId: string) => {
      updateMessage(conversationId, messageId, (m) => ({ ...m, status: "sending" }));
      setTimeout(() => updateMessage(conversationId, messageId, (m) => ({ ...m, status: "sent" })), 600);
      setTimeout(() => updateMessage(conversationId, messageId, (m) => ({ ...m, status: "delivered" })), 1300);
    },
    [updateMessage],
  );

  const togglePinConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, pinned: !c.pinned } : c)),
    );
  }, []);

  const toggleMuteConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, muted: !c.muted } : c)),
    );
  }, []);

  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
      if (activeIdRef.current === conversationId) {
        setActiveConversationIdState(null);
      }
    },
    [],
  );

  const startDirectConversation = useCallback(
    (userId: string) => {
      const existing = conversations.find(
        (c) => c.type === "direct" && c.participantIds.includes(userId) && c.participantIds.includes(currentUser.id),
      );
      if (existing) return existing.id;

      const id = crypto.randomUUID();
      const conversation: Conversation = {
        id,
        type: "direct",
        participantIds: [currentUser.id, userId],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      };
      setConversations((prev) => [conversation, ...prev]);
      setMessages((prev) => ({ ...prev, [id]: [] }));
      return id;
    },
    [conversations, currentUser.id],
  );

  const createGroupConversation = useCallback(
    (name: string, participantIds: string[], avatarColor?: string) => {
      const id = crypto.randomUUID();
      const conversation: Conversation = {
        id,
        type: "group",
        name,
        avatarColor,
        participantIds: [currentUser.id, ...participantIds],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      };
      setConversations((prev) => [conversation, ...prev]);
      setMessages((prev) => ({ ...prev, [id]: [] }));
      return id;
    },
    [currentUser.id],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      users,
      currentUser,
      conversations,
      messages,
      activeConversationId,
      typingUsers,
      setActiveConversationId,
      sendMessage,
      replyDraft,
      setReplyDraft,
      toggleReaction,
      deleteMessage,
      editMessage,
      togglePinMessage,
      retryMessage,
      togglePinConversation,
      toggleMuteConversation,
      deleteConversation,
      markConversationRead,
      startDirectConversation,
      createGroupConversation,
      updateCurrentUser,
    }),
    [
      users,
      currentUser,
      conversations,
      messages,
      activeConversationId,
      typingUsers,
      setActiveConversationId,
      sendMessage,
      replyDraft,
      toggleReaction,
      deleteMessage,
      editMessage,
      togglePinMessage,
      retryMessage,
      togglePinConversation,
      toggleMuteConversation,
      deleteConversation,
      markConversationRead,
      startDirectConversation,
      createGroupConversation,
      updateCurrentUser,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
