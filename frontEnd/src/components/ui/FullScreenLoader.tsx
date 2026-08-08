import { Loader2 } from "lucide-react";

export function FullScreenLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-canvas">
      <Loader2 size={24} className="animate-spin text-ink-faint" />
    </div>
  );
}
