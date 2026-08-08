import { format, isToday, isYesterday, isThisWeek, isThisYear } from "date-fns";

export function formatMessageTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

export function formatDateSeparator(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "EEEE");
  if (isThisYear(date)) return format(date, "MMMM d");
  return format(date, "MMMM d, yyyy");
}

export function formatListTimestamp(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "EEEE");
  return format(date, "MM/dd/yyyy");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatLastSeen(iso?: string): string {
  if (!iso) return "Offline";
  const date = new Date(iso);
  if (isToday(date)) return `Last seen today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Last seen yesterday at ${format(date, "h:mm a")}`;
  return `Last seen ${format(date, "MMM d")}`;
}
