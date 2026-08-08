import type { Conversation } from "../../types";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

export const conversations: Conversation[] = [
  {
    id: "c-laura",
    type: "direct",
    participantIds: ["u-alejandro", "u-laura"],
    pinned: true,
    unreadCount: 0,
    createdAt: daysAgo(120),
  },
  {
    id: "c-design-team",
    type: "group",
    name: "Design Team",
    participantIds: ["u-alejandro", "u-laura", "u-daniel", "u-camila"],
    pinned: true,
    unreadCount: 5,
    createdAt: daysAgo(90),
  },
  {
    id: "c-daniel",
    type: "direct",
    participantIds: ["u-alejandro", "u-daniel"],
    unreadCount: 2,
    createdAt: daysAgo(60),
  },
  {
    id: "c-mateo",
    type: "direct",
    participantIds: ["u-alejandro", "u-mateo"],
    unreadCount: 0,
    createdAt: daysAgo(200),
  },
  {
    id: "c-weekend",
    type: "group",
    name: "Fin de semana 🏖️",
    participantIds: ["u-alejandro", "u-sofia", "u-mateo", "u-daniel"],
    unreadCount: 0,
    createdAt: daysAgo(30),
  },
  {
    id: "c-camila",
    type: "direct",
    participantIds: ["u-alejandro", "u-camila"],
    muted: true,
    unreadCount: 0,
    createdAt: daysAgo(45),
  },
  {
    id: "c-sofia",
    type: "direct",
    participantIds: ["u-alejandro", "u-sofia"],
    unreadCount: 0,
    createdAt: daysAgo(3),
  },
];
