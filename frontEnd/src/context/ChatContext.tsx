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
import { useNavigate } from "react-router-dom";
import { api, getAccessToken } from "../lib/api";
import { chatSocket, type WsMessage } from "../lib/ws";
import { mapConversation, mapMessage, mapUser } from "../lib/mappers";
import { showDesktopNotification } from "../utils/notifications";
import { avatarDataUrl } from "../utils/avatarColor";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import type { Attachment, Conversation, Message, ReplyRef, User } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PendingSend {
  conversationId: string;
  text: string;
  attachments?: Attachment[];
  files?: File[];
  replyTo?: ReplyRef;
}

interface ChatContextValue {
  users: User[];
  currentUser: User;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  typingUsers: Record<string, string[]>;
  isLoading: boolean;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, text: string, attachments?: Attachment[], files?: File[]) => void;
  replyDraft: ReplyRef | null;
  setReplyDraft: (draft: ReplyRef | null) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  toggleReaction: (conversationId: string, messageId: string, emoji: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  editMessage: (conversationId: string, messageId: string, text: string) => void;
  togglePinMessage: (conversationId: string, messageId: string) => void;
  retryMessage: (conversationId: string, messageId: string) => void;
  togglePinConversation: (conversationId: string) => void;
  toggleMuteConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  markConversationRead: (conversationId: string) => void;
  startDirectConversation: (userId: string) => Promise<string>;
  createGroupConversation: (name: string, participantIds: string[], avatarColor?: string) => Promise<string>;
  renameConversation: (conversationId: string, name: string) => Promise<void>;
  addParticipant: (conversationId: string, userId: string) => Promise<void>;
  removeParticipant: (conversationId: string, userId: string) => Promise<void>;
  updateCurrentUser: (updates: Partial<User> & { avatarFile?: File }) => Promise<void>;
  updateSettings: (updates: Partial<User>) => Promise<void>;
  blockedUserIds: string[];
  toggleBlockUser: (userId: string) => Promise<boolean>;
  reportConversation: (conversationId: string, reason?: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function upsert(list: Message[], message: Message): Message[] {
  const exists = list.some((m) => m.id === message.id);
  return exists ? list.map((m) => (m.id === message.id ? message : m)) : [...list, message];
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser, setCurrentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [otherUsers, setOtherUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [replyDraft, setReplyDraft] = useState<ReplyRef | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  const activeConversationIdRef = useRef(activeConversationId);
  const currentUserIdRef = useRef(currentUser!.id);
  const currentUserRef = useRef(currentUser!);
  const otherUsersRef = useRef(otherUsers);
  const conversationsRef = useRef(conversations);
  const messagesRef = useRef(messages);
  const navigateRef = useRef(navigate);
  const loadedConversationsRef = useRef<Set<string>>(new Set());
  const pendingSendsRef = useRef<Record<string, PendingSend>>({});

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);
  useEffect(() => {
    currentUserIdRef.current = currentUser!.id;
    currentUserRef.current = currentUser!;
  }, [currentUser]);
  useEffect(() => {
    otherUsersRef.current = otherUsers;
  }, [otherUsers]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const users = useMemo(() => [currentUser!, ...otherUsers], [currentUser, otherUsers]);

  const seedLastMessage = useCallback((conversationId: string, rawLastMessage: any) => {
    if (!rawLastMessage) return;
    setMessages((prev) => (prev[conversationId] ? prev : { ...prev, [conversationId]: [mapMessage(rawLastMessage)] }));
  }, []);

  // -- initial load ----------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [rawConversations, rawUsers, blockedIds] = await Promise.all([
          api.get<any[]>("/api/conversations/"),
          api.get<any[]>("/api/users/"),
          api.get<string[]>("/api/users/me/blocked/").catch(() => []),
        ]);
        if (cancelled) return;
        setConversations(rawConversations.map(mapConversation));
        setOtherUsers(rawUsers.map(mapUser));
        setBlockedUserIds(blockedIds);
        rawConversations.forEach((raw) => seedLastMessage(raw.id, raw.last_message));
      } catch {
        if (!cancelled) showToast("Couldn't load your conversations", "error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- websocket ---------------------------------------------------------
  useEffect(() => {
    function handle(msg: WsMessage) {
      switch (msg.type) {
        case "message.created":
        case "message.updated": {
          const conversationId = msg.conversation_id as string;
          const message = mapMessage(msg.message);
          setMessages((prev) => ({ ...prev, [conversationId]: upsert(prev[conversationId] ?? [], message) }));

          if (msg.type === "message.created" && message.senderId !== currentUserIdRef.current) {
            const isActiveConversation = conversationId === activeConversationIdRef.current;
            if (!isActiveConversation) {
              setConversations((prev) =>
                prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c)),
              );
            }

            const isBeingViewed = isActiveConversation && document.visibilityState === "visible";
            const conversation = conversationsRef.current.find((c) => c.id === conversationId);
            if (currentUserRef.current.notifyDesktop && !isBeingViewed && !conversation?.muted) {
              const sender = otherUsersRef.current.find((u) => u.id === message.senderId);
              const body = message.deleted
                ? "This message was deleted"
                : message.text ?? (message.attachments?.length ? "Sent an attachment" : "Sent a message");
              const senderName = sender?.name ?? "New message";
              showDesktopNotification(senderName, {
                body,
                tag: conversationId,
                icon: sender?.avatarUrl || avatarDataUrl(senderName),
                silent: currentUserRef.current.notifySounds === false,
                onClick: () => navigateRef.current(`/chat/${conversationId}`),
              });
            }
          }
          break;
        }
        case "conversation.created": {
          const conversation = mapConversation(msg.conversation);
          setConversations((prev) => (prev.some((c) => c.id === conversation.id) ? prev : [conversation, ...prev]));
          seedLastMessage(conversation.id, (msg.conversation as any).last_message);
          break;
        }
        case "conversation.updated": {
          const conversation = mapConversation(msg.conversation);
          setConversations((prev) => prev.map((c) => (c.id === conversation.id ? conversation : c)));
          break;
        }
        case "conversation.deleted": {
          const conversationId = msg.conversation_id as string;
          setConversations((prev) => prev.filter((c) => c.id !== conversationId));
          setMessages((prev) => {
            const next = { ...prev };
            delete next[conversationId];
            return next;
          });
          break;
        }
        case "conversation.read": {
          const conversationId = msg.conversation_id as string;
          const userId = msg.user_id as string;
          const readAt = new Date(msg.read_at as string).getTime();
          if (userId === currentUserIdRef.current) {
            setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
          } else {
            setMessages((prev) => ({
              ...prev,
              [conversationId]: (prev[conversationId] ?? []).map((m) =>
                m.senderId === currentUserIdRef.current && m.status !== "read" && new Date(m.createdAt).getTime() <= readAt
                  ? { ...m, status: "read" as const }
                  : m,
              ),
            }));
          }
          break;
        }
        case "typing": {
          const conversationId = msg.conversation_id as string;
          const userId = msg.user_id as string;
          const isTyping = msg.is_typing as boolean;
          setTypingUsers((prev) => {
            const current = prev[conversationId] ?? [];
            const next = isTyping ? Array.from(new Set([...current, userId])) : current.filter((id) => id !== userId);
            return { ...prev, [conversationId]: next };
          });
          break;
        }
        case "presence": {
          const userId = msg.user_id as string;
          const status = msg.status as User["status"];
          const lastSeenAt = msg.last_seen_at as string | undefined;
          setOtherUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status, lastSeen: lastSeenAt ?? u.lastSeen } : u)));
          break;
        }
      }
    }

    chatSocket.connect(getAccessToken);
    const unsubscribe = chatSocket.onMessage(handle);
    return () => {
      unsubscribe();
      chatSocket.disconnect();
    };
  }, [seedLastMessage]);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    if (loadedConversationsRef.current.has(conversationId)) return;
    loadedConversationsRef.current.add(conversationId);
    try {
      const raw = await api.get<any[]>(`/api/conversations/${conversationId}/messages/`);
      setMessages((prev) => ({ ...prev, [conversationId]: raw.map(mapMessage) }));
    } catch {
      loadedConversationsRef.current.delete(conversationId);
    }
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
    api.post(`/api/conversations/${conversationId}/read/`).catch(() => undefined);
  }, []);

  const setActiveConversationId = useCallback(
    (id: string | null) => {
      setActiveConversationIdState(id);
      setReplyDraft(null);
      if (id) {
        markConversationRead(id);
        loadConversationMessages(id);
      }
    },
    [markConversationRead, loadConversationMessages],
  );

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    chatSocket.send({ action: "typing", conversation_id: conversationId, is_typing: isTyping });
  }, []);

  const performSend = useCallback(async (tempId: string, payload: PendingSend) => {
    const { conversationId, text, attachments, files, replyTo } = payload;
    try {
      const form = new FormData();
      if (text.trim()) form.append("text", text.trim());
      if (replyTo) form.append("reply_to_id", replyTo.messageId);
      if (files && files.length > 0) {
        const meta = files.map((_, i) => {
          const att = attachments?.[i];
          return att?.type === "audio" ? { duration: att.duration } : {};
        });
        files.forEach((file) => form.append("files", file));
        form.append("meta", JSON.stringify(meta));
      }
      const raw = await api.post<any>(`/api/conversations/${conversationId}/messages/`, form);
      const real = mapMessage(raw);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: upsert((prev[conversationId] ?? []).filter((m) => m.id !== tempId), real),
      }));
      delete pendingSendsRef.current[tempId];
    } catch {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((m) =>
          m.id === tempId ? { ...m, status: "failed" as const } : m,
        ),
      }));
    }
  }, []);

  const sendMessage = useCallback(
    (conversationId: string, text: string, attachments?: Attachment[], files?: File[]) => {
      const tempId = `temp-${crypto.randomUUID()}`;
      const replyTo = replyDraft ?? undefined;
      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        senderId: currentUserIdRef.current,
        text: text.trim() || undefined,
        attachments,
        createdAt: new Date().toISOString(),
        status: "sending",
        replyTo,
      };
      setMessages((prev) => ({ ...prev, [conversationId]: [...(prev[conversationId] ?? []), optimisticMessage] }));
      setReplyDraft(null);

      const payload: PendingSend = { conversationId, text, attachments, files, replyTo };
      pendingSendsRef.current[tempId] = payload;
      performSend(tempId, payload);
    },
    [replyDraft, performSend],
  );

  const retryMessage = useCallback(
    (conversationId: string, messageId: string) => {
      const pending = pendingSendsRef.current[messageId];
      const fallback = messagesRef.current[conversationId]?.find((m) => m.id === messageId);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, status: "sending" as const } : m,
        ),
      }));
      const payload: PendingSend = pending ?? {
        conversationId,
        text: fallback?.text ?? "",
        attachments: fallback?.attachments,
        replyTo: fallback?.replyTo,
      };
      performSend(messageId, payload);
    },
    [performSend],
  );

  const upsertMessageFromApi = useCallback((conversationId: string, raw: any) => {
    const message = mapMessage(raw);
    setMessages((prev) => ({ ...prev, [conversationId]: upsert(prev[conversationId] ?? [], message) }));
  }, []);

  const toggleReaction = useCallback(
    async (conversationId: string, messageId: string, emoji: string) => {
      try {
        const raw = await api.post<any>(`/api/messages/${messageId}/react/`, { emoji });
        upsertMessageFromApi(conversationId, raw);
      } catch {
        showToast("Something went wrong", "error");
      }
    },
    [upsertMessageFromApi, showToast],
  );

  const deleteMessage = useCallback(
    async (conversationId: string, messageId: string) => {
      try {
        const raw = await api.delete<any>(`/api/messages/${messageId}/`);
        upsertMessageFromApi(conversationId, raw);
      } catch {
        showToast("Couldn't delete this message", "error");
      }
    },
    [upsertMessageFromApi, showToast],
  );

  const editMessage = useCallback(
    async (conversationId: string, messageId: string, text: string) => {
      try {
        const raw = await api.patch<any>(`/api/messages/${messageId}/`, { text });
        upsertMessageFromApi(conversationId, raw);
      } catch {
        showToast("Couldn't save your changes", "error");
      }
    },
    [upsertMessageFromApi, showToast],
  );

  const togglePinMessage = useCallback(
    async (conversationId: string, messageId: string) => {
      try {
        const raw = await api.post<any>(`/api/messages/${messageId}/pin/`);
        upsertMessageFromApi(conversationId, raw);
      } catch {
        showToast("Something went wrong", "error");
      }
    },
    [upsertMessageFromApi, showToast],
  );

  const togglePinConversation = useCallback(
    async (conversationId: string) => {
      try {
        const raw = await api.post<any>(`/api/conversations/${conversationId}/pin/`);
        const conversation = mapConversation(raw);
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? conversation : c)));
      } catch {
        showToast("Something went wrong", "error");
      }
    },
    [showToast],
  );

  const toggleMuteConversation = useCallback(
    async (conversationId: string) => {
      try {
        const raw = await api.post<any>(`/api/conversations/${conversationId}/mute/`);
        const conversation = mapConversation(raw);
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? conversation : c)));
      } catch {
        showToast("Something went wrong", "error");
      }
    },
    [showToast],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await api.delete(`/api/conversations/${conversationId}/`);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        setMessages((prev) => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
      } catch {
        showToast("Couldn't delete this conversation", "error");
      }
    },
    [showToast],
  );

  const startDirectConversation = useCallback(async (userId: string) => {
    const raw = await api.post<any>("/api/conversations/", { type: "direct", user_id: userId });
    const conversation = mapConversation(raw);
    setConversations((prev) => (prev.some((c) => c.id === conversation.id) ? prev : [conversation, ...prev]));
    seedLastMessage(conversation.id, raw.last_message);
    return conversation.id;
  }, [seedLastMessage]);

  const createGroupConversation = useCallback(
    async (name: string, participantIds: string[], avatarColor?: string) => {
      const raw = await api.post<any>("/api/conversations/", {
        type: "group",
        name,
        participant_ids: participantIds,
        avatar_color: avatarColor,
      });
      const conversation = mapConversation(raw);
      setConversations((prev) => [conversation, ...prev]);
      loadedConversationsRef.current.add(conversation.id);
      setMessages((prev) => ({ ...prev, [conversation.id]: [] }));
      return conversation.id;
    },
    [],
  );

  const renameConversation = useCallback(
    async (conversationId: string, name: string) => {
      try {
        const raw = await api.patch<any>(`/api/conversations/${conversationId}/`, { name });
        const conversation = mapConversation(raw);
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? conversation : c)));
      } catch {
        showToast("Couldn't rename this group", "error");
      }
    },
    [showToast],
  );

  const addParticipant = useCallback(
    async (conversationId: string, userId: string) => {
      try {
        const raw = await api.post<any>(`/api/conversations/${conversationId}/participants/`, { user_id: userId });
        const conversation = mapConversation(raw);
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? conversation : c)));
      } catch {
        showToast("Couldn't add that person", "error");
      }
    },
    [showToast],
  );

  const removeParticipant = useCallback(
    async (conversationId: string, userId: string) => {
      try {
        await api.delete(`/api/conversations/${conversationId}/participants/${userId}/`);
        if (userId === currentUserIdRef.current) {
          setConversations((prev) => prev.filter((c) => c.id !== conversationId));
          setMessages((prev) => {
            const next = { ...prev };
            delete next[conversationId];
            return next;
          });
        } else {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId ? { ...c, participantIds: c.participantIds.filter((id) => id !== userId) } : c,
            ),
          );
        }
      } catch {
        showToast("Something went wrong", "error");
      }
    },
    [showToast],
  );

  const toggleBlockUser = useCallback(async (userId: string) => {
    const raw = await api.post<{ blocked: boolean }>(`/api/users/${userId}/block/`);
    setBlockedUserIds((prev) => (raw.blocked ? [...prev, userId] : prev.filter((id) => id !== userId)));
    return raw.blocked;
  }, []);

  const reportConversation = useCallback(async (conversationId: string, reason?: string) => {
    await api.post(`/api/conversations/${conversationId}/report/`, { reason: reason ?? "" });
  }, []);

  const updateCurrentUser = useCallback(
    async (updates: Partial<User> & { avatarFile?: File }) => {
      const { avatarFile, name, username, bio } = updates;
      let raw: any;
      if (avatarFile) {
        const form = new FormData();
        if (name !== undefined) form.append("full_name", name);
        if (username !== undefined) form.append("username", username);
        if (bio !== undefined) form.append("bio", bio);
        form.append("avatar", avatarFile);
        raw = await api.patch<any>("/api/users/me/", form);
      } else {
        const body: Record<string, unknown> = {};
        if (name !== undefined) body.full_name = name;
        if (username !== undefined) body.username = username;
        if (bio !== undefined) body.bio = bio;
        raw = await api.patch<any>("/api/users/me/", body);
      }
      setCurrentUser(mapUser(raw));
    },
    [setCurrentUser],
  );

  const updateSettings = useCallback(
    async (updates: Partial<User>) => {
      const body: Record<string, unknown> = {};
      if (updates.notifyMessages !== undefined) body.notify_messages = updates.notifyMessages;
      if (updates.notifySounds !== undefined) body.notify_sounds = updates.notifySounds;
      if (updates.notifyMentions !== undefined) body.notify_mentions = updates.notifyMentions;
      if (updates.notifyDesktop !== undefined) body.notify_desktop = updates.notifyDesktop;
      if (updates.showOnlineStatus !== undefined) body.show_online_status = updates.showOnlineStatus;
      if (updates.lastSeenVisibility !== undefined) body.last_seen_visibility = updates.lastSeenVisibility;
      if (updates.profilePhotoVisibility !== undefined) body.profile_photo_visibility = updates.profilePhotoVisibility;
      const raw = await api.patch<any>("/api/users/me/settings/", body);
      setCurrentUser(mapUser(raw));
    },
    [setCurrentUser],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      users,
      currentUser: currentUser!,
      conversations,
      messages,
      activeConversationId,
      typingUsers,
      isLoading,
      setActiveConversationId,
      sendMessage,
      replyDraft,
      setReplyDraft,
      sendTyping,
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
      renameConversation,
      addParticipant,
      removeParticipant,
      updateCurrentUser,
      updateSettings,
      blockedUserIds,
      toggleBlockUser,
      reportConversation,
    }),
    [
      users,
      currentUser,
      conversations,
      messages,
      activeConversationId,
      typingUsers,
      isLoading,
      setActiveConversationId,
      sendMessage,
      replyDraft,
      sendTyping,
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
      renameConversation,
      addParticipant,
      removeParticipant,
      updateCurrentUser,
      updateSettings,
      blockedUserIds,
      toggleBlockUser,
      reportConversation,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
