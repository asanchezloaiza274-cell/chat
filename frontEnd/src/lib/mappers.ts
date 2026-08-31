import type { Attachment, Conversation, Message, Reaction, User } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.name,
    username: raw.username,
    status: raw.status,
    lastSeen: raw.last_seen_at ?? undefined,
    bio: raw.bio ?? undefined,
    email: raw.email ?? undefined,
    joinedAt: raw.date_joined ?? undefined,
    avatarUrl: raw.avatar_url ?? undefined,
    notifyMessages: raw.notify_messages,
    notifySounds: raw.notify_sounds,
    notifyMentions: raw.notify_mentions,
    notifyDesktop: raw.notify_desktop,
    showOnlineStatus: raw.show_online_status,
    lastSeenVisibility: raw.last_seen_visibility,
    profilePhotoVisibility: raw.profile_photo_visibility,
  };
}

function extensionFromName(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
}

export function mapAttachment(raw: any): Attachment {
  if (raw.type === "image") {
    return {
      type: "image",
      id: raw.id,
      name: raw.name,
      size: raw.size,
      url: raw.url ?? undefined,
      color: "#4C7DFF",
      width: raw.width ?? 0,
      height: raw.height ?? 0,
    };
  }
  if (raw.type === "audio") {
    return { type: "audio", id: raw.id, duration: raw.duration ?? 0, url: raw.url ?? undefined };
  }
  return {
    type: "file",
    id: raw.id,
    name: raw.name,
    size: raw.size,
    ext: extensionFromName(raw.name ?? "file"),
  };
}

export function mapMessage(raw: any): Message {
  return {
    id: raw.id,
    conversationId: raw.conversation_id,
    senderId: raw.sender_id,
    text: raw.text ?? undefined,
    createdAt: raw.created_at,
    status: raw.status,
    edited: raw.edited || undefined,
    deleted: raw.deleted || undefined,
    pinned: raw.pinned || undefined,
    replyTo: raw.reply_to
      ? { messageId: raw.reply_to.message_id, senderId: raw.reply_to.sender_id, preview: raw.reply_to.preview }
      : undefined,
    reactions: raw.reactions?.length
      ? raw.reactions.map((r: any): Reaction => ({ emoji: r.emoji, userIds: r.user_ids }))
      : undefined,
    attachments: raw.attachments?.length ? raw.attachments.map(mapAttachment) : undefined,
  };
}

export function mapConversation(raw: any): Conversation {
  return {
    id: raw.id,
    type: raw.type,
    name: raw.name || undefined,
    avatarColor: raw.avatar_color || undefined,
    participantIds: raw.participant_ids,
    createdBy: raw.created_by ?? undefined,
    pinned: raw.pinned || undefined,
    muted: raw.muted || undefined,
    unreadCount: raw.unread_count,
    createdAt: raw.created_at,
  };
}
