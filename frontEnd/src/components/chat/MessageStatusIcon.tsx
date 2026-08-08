import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import type { MessageStatus } from "../../types";
import { cn } from "../../utils/cn";

export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "sending":
      return <Clock size={13} className="text-white/60" aria-label="Sending" />;
    case "sent":
      return <Check size={14} className="text-white/60" aria-label="Sent" />;
    case "delivered":
      return <CheckCheck size={14} className="text-white/60" aria-label="Delivered" />;
    case "read":
      return <CheckCheck size={14} className={cn("text-white")} aria-label="Read" />;
    case "failed":
      return <AlertCircle size={13} className="text-danger" aria-label="Failed to send" />;
    default:
      return null;
  }
}
