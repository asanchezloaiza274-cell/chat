import { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic, Loader2 } from "lucide-react";
import type { AudioAttachment } from "../../types";
import { formatDuration } from "../../utils/format";
import { cn } from "../../utils/cn";

const BAR_HEIGHTS = [40, 70, 45, 90, 60, 30, 80, 50, 65, 35, 75, 55, 40, 85, 45, 60, 30, 70, 50, 40];

export function AudioMessage({ attachment, isOwn }: { attachment: AudioAttachment; isOwn?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(attachment.duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setElapsed(0);
    setPlaying(false);
  }, [attachment.url]);

  useEffect(() => {
    const url = attachment.url;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [attachment.url]);

  const progress = duration > 0 ? elapsed / duration : 0;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing || loading) {
      audio.pause();
      setLoading(false);
    } else {
      setLoading(true);
      audio.play().catch(() => setLoading(false));
    }
  }

  return (
    <div
      className={cn(
        "flex w-64 items-center gap-3 rounded-full px-3 py-2.5",
        isOwn ? "border border-accent/15 bg-accent-soft text-accent" : "border border-border bg-surface text-ink",
      )}
    >
      {attachment.url && (
        <audio
          ref={audioRef}
          src={attachment.url}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setDuration(d);
          }}
          onPlaying={() => {
            setLoading(false);
            setPlaying(true);
          }}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
          onEnded={() => {
            setPlaying(false);
            setElapsed(0);
          }}
        />
      )}
      <button
        onClick={toggle}
        disabled={!attachment.url}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform disabled:opacity-50",
          "bg-accent text-accent-ink hover:scale-105 active:scale-95",
        )}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : playing ? (
          <Pause size={15} fill="currentColor" />
        ) : (
          <Play size={15} className="ml-0.5" fill="currentColor" />
        )}
      </button>

      <div className="flex flex-1 items-center gap-1.5">
        <Mic size={13} className="shrink-0 opacity-50" />
        <div className="flex h-6 flex-1 items-center gap-[3px] overflow-hidden">
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={cn(
                "w-[2.5px] shrink-0 rounded-full transition-opacity",
                i / BAR_HEIGHTS.length <= progress ? "opacity-100" : "opacity-25",
              )}
              style={{ height: `${h}%`, backgroundColor: "currentColor" }}
            />
          ))}
        </div>
      </div>

      <span className="shrink-0 font-mono text-xs tabular-nums opacity-70">
        {formatDuration(playing || elapsed > 0 ? Math.max(0, duration - elapsed) : duration)}
      </span>
    </div>
  );
}
