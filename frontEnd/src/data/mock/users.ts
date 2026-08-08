import type { User } from "../../types";

export const CURRENT_USER_ID = "u-alejandro";

export const users: User[] = [
  {
    id: "u-alejandro",
    name: "Alejandro Sánchez",
    username: "alejandro",
    status: "online",
    email: "asanchezloaiza274@gmail.com",
    bio: "Building things, one commit at a time.",
    joinedAt: "2023-02-11T00:00:00.000Z",
  },
  {
    id: "u-laura",
    name: "Laura Torres",
    username: "laura.torres",
    status: "online",
    bio: "Product designer. Coffee enthusiast.",
    joinedAt: "2022-08-04T00:00:00.000Z",
  },
  {
    id: "u-daniel",
    name: "Daniel Restrepo",
    username: "danielrestrepo",
    status: "offline",
    lastSeen: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    bio: "Backend engineer. Currently deep in migrations.",
    joinedAt: "2021-11-19T00:00:00.000Z",
  },
  {
    id: "u-camila",
    name: "Camila Vargas",
    username: "camilav",
    status: "away",
    lastSeen: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    bio: "Marketing lead. Always in a meeting.",
    joinedAt: "2023-05-27T00:00:00.000Z",
  },
  {
    id: "u-mateo",
    name: "Mateo Gómez",
    username: "mateogomez",
    status: "online",
    bio: "iOS developer.",
    joinedAt: "2022-01-30T00:00:00.000Z",
  },
  {
    id: "u-sofia",
    name: "Sofía Ramírez",
    username: "sofia.ramirez",
    status: "offline",
    lastSeen: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    bio: "QA engineer. Finds the bugs before you do.",
    joinedAt: "2023-09-14T00:00:00.000Z",
  },
];

export function getUser(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getCurrentUser(): User {
  return users.find((u) => u.id === CURRENT_USER_ID)!;
}
