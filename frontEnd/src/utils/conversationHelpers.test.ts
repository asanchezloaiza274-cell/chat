import { describe, expect, it } from "vitest";
import { getConversationName, getDirectOtherUser, getMessagePreview } from "./conversationHelpers";
import type { Conversation, Message, User } from "../types";

const currentUser: User = { id: "u1", name: "Alice", username: "alice", status: "online" };
const otherUser: User = { id: "u2", name: "Bob", username: "bob", status: "offline" };
const users = [currentUser, otherUser];

const directConversation: Conversation = {
  id: "c1",
  type: "direct",
  participantIds: ["u1", "u2"],
  unreadCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
};

const groupConversation: Conversation = {
  id: "c2",
  type: "group",
  name: "Team chat",
  participantIds: ["u1", "u2"],
  unreadCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("getConversationName", () => {
  it("returns the other participant's name for a direct conversation", () => {
    expect(getConversationName(directConversation, users, currentUser.id)).toBe("Bob");
  });

  it("returns the group's name for a group conversation", () => {
    expect(getConversationName(groupConversation, users, currentUser.id)).toBe("Team chat");
  });

  it("falls back to a placeholder for an unnamed group", () => {
    const unnamed: Conversation = { ...groupConversation, name: undefined };
    expect(getConversationName(unnamed, users, currentUser.id)).toBe("Unnamed group");
  });
});

describe("getDirectOtherUser", () => {
  it("finds the other participant in a direct conversation", () => {
    expect(getDirectOtherUser(directConversation, users, currentUser.id)?.id).toBe("u2");
  });

  it("returns undefined for a group conversation", () => {
    expect(getDirectOtherUser(groupConversation, users, currentUser.id)).toBeUndefined();
  });
});

describe("getMessagePreview", () => {
  const baseMessage: Message = {
    id: "m1",
    conversationId: "c1",
    senderId: "u2",
    text: "Hey there",
    createdAt: "2026-01-01T00:00:00Z",
    status: "delivered",
  };

  it("returns a placeholder when there is no message", () => {
    expect(getMessagePreview(undefined, currentUser.id)).toBe("No messages yet");
  });

  it("marks deleted messages", () => {
    expect(getMessagePreview({ ...baseMessage, deleted: true }, currentUser.id)).toBe("This message was deleted");
  });

  it("prefixes the sender's own messages with You:", () => {
    expect(getMessagePreview({ ...baseMessage, senderId: currentUser.id }, currentUser.id)).toBe("You: Hey there");
  });

  it("does not prefix messages from other people", () => {
    expect(getMessagePreview(baseMessage, currentUser.id)).toBe("Hey there");
  });
});
