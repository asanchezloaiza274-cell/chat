import { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic } from "lucide-react";
import type { AudioAttachment } from "../../types";
import { formatDuration } from "../../utils/format";
import { cn } from "../../utils/cn";

const BAR_HEIGHTS = [40, 70, 45, 90, 60, 30, 80, 50, 65, 35, 75, 55, 40, 85, 45, 60, 30, 70, 50, 40];

export function AudioMessage({ attachment, outgoing }: { attachment: AudioAttachment; outgoing?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= attachment.duration) {
          setPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, attachment.duration]);

  const progress = elapsed / attachment.duration;

  return (
    <div className="flex w-64 items-center gap-3 bg-black/10 px-3 py-2.5">
      <button
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center",
          outgoing ? "bg-white/20 text-white" : "bg-accent text-accent-ink",
        )}
      >
        {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>

      <div className="flex flex-1 items-center gap-1.5">
        <Mic size={13} className="shrink-0 opacity-50" />
        <div className="flex h-6 flex-1 items-center gap-[2px] overflow-hidden">
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={cn(
                "w-[2px] shrink-0 transition-colors",
                i / BAR_HEIGHTS.length <= progress ? "opacity-100" : "opacity-30",
              )}
              style={{ height: `${h}%`, backgroundColor: "currentColor" }}
            />
          ))}
        </div>
      </div>

      <span className="shrink-0 font-mono text-xs tabular-nums opacity-70">
        {formatDuration(playing || elapsed > 0 ? attachment.duration - elapsed : attachment.duration)}
      </span>
    </div>
  );
}
