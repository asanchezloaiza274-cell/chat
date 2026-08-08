import { ChevronUp, ChevronDown, X, Search } from "lucide-react";
import { IconButton } from "../ui/IconButton";

interface ChatSearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  matchCount: number;
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function ChatSearchBar({
  query,
  onQueryChange,
  matchCount,
  activeIndex,
  onPrev,
  onNext,
  onClose,
}: ChatSearchBarProps) {
  return (
    <div className="animate-slide-up flex items-center gap-2 border-b border-border bg-panel px-4 py-2.5">
      <Search size={15} className="shrink-0 text-ink-faint" />
      <input
        autoFocus
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search in conversation"
        className="h-8 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter") onNext();
          if (e.key === "Escape") onClose();
        }}
      />
      {query && (
        <span className="shrink-0 text-xs text-ink-faint">
          {matchCount > 0 ? `${activeIndex + 1} of ${matchCount}` : "No results"}
        </span>
      )}
      <IconButton label="Previous match" size="sm" onClick={onPrev} disabled={matchCount === 0}>
        <ChevronUp size={16} />
      </IconButton>
      <IconButton label="Next match" size="sm" onClick={onNext} disabled={matchCount === 0}>
        <ChevronDown size={16} />
      </IconButton>
      <IconButton label="Close search" size="sm" onClick={onClose} showTooltip={false}>
        <X size={16} />
      </IconButton>
    </div>
  );
}
