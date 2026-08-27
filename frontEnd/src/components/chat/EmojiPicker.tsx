import { useMemo, useRef, useState } from "react";
import { Smile, Search } from "lucide-react";
import { EMOJI_CATEGORIES, RECENT_EMOJIS } from "../../data/emojis";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { IconButton } from "../ui/IconButton";
import { cn } from "../../utils/cn";

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  const results = useMemo(() => {
    if (!query.trim()) return null;
    return EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((e) => e.includes(query));
  }, [query]);

  return (
    <div ref={ref} className="relative inline-flex">
      <IconButton label="Emoji" showTooltip={false} onClick={() => setOpen((o) => !o)}>
        <Smile size={19} />
      </IconButton>

      {open && (
        <div className="animate-rise-in absolute bottom-full right-0 z-40 mb-2 w-72 origin-bottom-right border border-border-strong bg-surface">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search emoji"
                className="h-8 w-full border border-border bg-canvas pl-8 pr-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent"
              />
            </div>
          </div>

          {!query && (
            <div className="flex gap-1 border-b border-border px-2 py-1.5">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(i)}
                  className={cn(
                    "px-2 py-1 text-xs font-medium",
                    activeCategory === i ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-surface-hover",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-52 overflow-y-auto p-2">
            {!query && (
              <div className="mb-2">
                <p className="mb-1 px-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Recent</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {RECENT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onSelect(emoji);
                        setOpen(false);
                      }}
                      className="flex h-8 w-8 items-center justify-center text-lg hover:bg-surface-hover"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-8 gap-0.5">
              {(results ?? EMOJI_CATEGORIES[activeCategory].emojis).map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  onClick={() => {
                    onSelect(emoji);
                    setOpen(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center text-lg hover:bg-surface-hover"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {results && results.length === 0 && (
              <p className="py-4 text-center text-xs text-ink-faint">No emoji found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
