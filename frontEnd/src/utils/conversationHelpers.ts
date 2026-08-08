import type { Conversation, Message, User } from "../types";

export function getOtherParticipants(conversation: Conversation, currentUserId: string): string[] {
  return conversation.participantIds.filter((id) => id !== currentUserId);
}

export function getConversationName(
  conversation: Conversation,
  users: User[],
  currentUserId: string,
): string {
  if (conversation.type === "group") return conversation.name ?? "Unnamed group";
  const otherId = getOtherParticipants(conversation, currentUserId)[0];
  return users.find((u) => u.id === otherId)?.name ?? "Unknown user";
}

export function getDirectOtherUser(
  conversation: Conversation,
  users: User[],
  currentUserId: string,
): User | undefined {
  if (conversation.type !== "direct") return undefined;
  const otherId = getOtherParticipants(conversation, currentUserId)[0];
  return users.find((u) => u.id === otherId);
}

export function getLastMessage(messages: Message[] | undefined): Message | undefined {
  if (!messages || messages.length === 0) return undefined;
  return messages[messages.length - 1];
}

export function getMessagePreview(message: Message | undefined, currentUserId: string): string {
  if (!message) return "No messages yet";
  if (message.deleted) return "This message was deleted";
  const prefix = message.senderId === currentUserId ? "You: " : "";
  if (message.attachments && message.attachments.length > 0) {
    const [att] = message.attachments;
    if (att.type === "image") return `${prefix}📷 Photo`;
    if (att.type === "audio") return `${prefix}🎤 Voice message`;
    return `${prefix}📎 ${att.name}`;
  }
  return `${prefix}${message.text ?? ""}`;
}
