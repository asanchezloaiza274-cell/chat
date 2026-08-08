export type UserStatus = "online" | "offline" | "away";

export interface User {
  id: string;
  name: string;
  username: string;
  status: UserStatus;
  lastSeen?: string;
  bio?: string;
  email?: string;
  joinedAt?: string;
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ReplyRef {
  messageId: string;
  senderId: string;
  preview: string;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export type AttachmentStatus = "uploading" | "uploaded" | "failed";

export interface ImageAttachment {
  type: "image";
  id: string;
  name: string;
  size: number;
  color: string;
  width: number;
  height: number;
  url?: string;
  status?: AttachmentStatus;
}

export interface FileAttachment {
  type: "file";
  id: string;
  name: string;
  size: number;
  ext: string;
  status?: AttachmentStatus;
}

export interface AudioAttachment {
  type: "audio";
  id: string;
  duration: number;
  status?: AttachmentStatus;
}

export type Attachment = ImageAttachment | FileAttachment | AudioAttachment;

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  createdAt: string;
  status: MessageStatus;
  edited?: boolean;
  deleted?: boolean;
  pinned?: boolean;
  replyTo?: ReplyRef;
  reactions?: Reaction[];
  attachments?: Attachment[];
}

export type ConversationType = "direct" | "group";

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatarColor?: string;
  participantIds: string[];
  pinned?: boolean;
  muted?: boolean;
  unreadCount: number;
  createdAt: string;
}
