export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

interface DesktopNotificationOptions {
  body: string;
  tag?: string;
  icon?: string;
  silent?: boolean;
  onClick?: () => void;
}

export function showDesktopNotification(
  title: string,
  { body, tag, icon, silent, onClick }: DesktopNotificationOptions,
) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    tag,
    icon: icon || "/favicon.svg",
    badge: "/favicon.svg",
    silent,
    renotify: !!tag,
  });
  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
}
