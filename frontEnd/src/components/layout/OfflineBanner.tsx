import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="animate-slide-up flex items-center justify-center gap-2 border-b border-warning/30 bg-warning-soft px-4 py-2 text-center text-xs font-medium text-warning">
      <WifiOff size={14} />
      You're offline — some messages may be delayed
    </div>
  );
}
