import { formatDateSeparator } from "../../utils/format";

export function DateSeparator({ iso }: { iso: string }) {
  return (
    <div className="my-4 flex items-center gap-3 px-4" role="separator">
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {formatDateSeparator(iso)}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
