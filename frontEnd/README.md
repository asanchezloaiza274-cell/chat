# Loop — Chat App (Frontend)

React + TypeScript frontend for Loop, a WhatsApp-style real-time chat app: direct and group conversations, attachments (images/audio/files), reactions, replies, typing indicators, presence, message pinning, blocking, and search.

The backend lives in [`../backEnd`](../backEnd) (Django + Django REST Framework + Channels).

## Stack

- React 19 + React Router 7
- Vite 8 (rolldown-vite) + Tailwind CSS 4
- WebSocket client (`src/lib/ws.ts`) talking to the Django Channels backend for real-time events
- Vitest + Testing Library for tests

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values, see below
npm run dev
```

The app expects the backend to be running (see `../backEnd/README` / its `.env.example`) at the URL configured below.

## Environment variables

Copy `.env` and set:

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the Django backend, e.g. `http://localhost:8000` |
| `VITE_WS_URL` | WebSocket URL of the Django Channels backend, e.g. `ws://localhost:8000` |

For local development against a backend running on the same machine, use `http://localhost:8000` / `ws://localhost:8000`. If you're tunneling the backend (ngrok, VS Code dev tunnels, etc.), point these at the tunnel's HTTPS/WSS URL instead — and remember tunnel URLs are ephemeral, so update `.env` whenever you restart the tunnel.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run oxlint
- `npm run test` — run the Vitest test suite

## Project structure

```
src/
  components/   # presentational + feature components (chat, conversations, ui, settings, forms, layout, routing)
  context/      # AuthContext, ChatContext, ToastContext — app-wide state
  hooks/        # small reusable hooks
  layouts/      # route-level layouts (chat, auth, settings)
  lib/          # api client, websocket client, JWT helpers, API<->UI mappers
  pages/        # route components
  utils/        # pure helper functions (formatting, conversation helpers, etc.)
```

## Notes

- Messages load paginated (most recent first, older messages fetched on scroll-up); see `ChatContext.loadMoreMessages`.
- Realtime events (new messages, typing, presence, read receipts) come over the WebSocket connection opened in `ChatContext`.
