const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";

export type WsMessage = { type: string; [key: string]: unknown };
type WsHandler = (message: WsMessage) => void;

class ChatSocket {
  private socket: WebSocket | null = null;
  private handlers = new Set<WsHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private getToken: (() => string | null) | null = null;

  connect(getToken: () => string | null) {
    this.getToken = getToken;
    this.shouldReconnect = true;
    this.open();
  }

  private open() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const token = this.getToken?.();
    if (!token) return;

    // Close out any previous socket before replacing it so it can't leak or
    // trigger a stale reconnect once this new one is in place.
    if (this.socket) {
      const stale = this.socket;
      stale.onclose = null;
      stale.close();
    }

    const socket = new WebSocket(`${WS_URL}/ws/chat/?token=${encodeURIComponent(token)}`);
    this.socket = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        this.handlers.forEach((handler) => handler(data));
      } catch {
        // ignore malformed frames
      }
    };

    socket.onclose = () => {
      // Ignore close events from a socket that's already been superseded.
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.open(), 2000);
      }
    };
  }

  send(payload: Record<string, unknown>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  onMessage(handler: WsHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.getToken = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }
}

export const chatSocket = new ChatSocket();
