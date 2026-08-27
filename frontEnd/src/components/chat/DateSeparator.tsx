import { formatDateSeparator } from "../../utils/format";

export function DateSeparator({ iso }: { iso: string }) {
  return (
    <div className="my-4 flex items-center gap-3 px-6" role="separator">
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-faint">
        {formatDateSeparator(iso)}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
