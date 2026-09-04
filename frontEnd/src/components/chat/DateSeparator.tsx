import { formatDateSeparator } from "../../utils/format";

export function DateSeparator({ iso }: { iso: string }) {
  return (
    <div className="my-4 flex justify-center px-6" role="separator">
      <span className="rounded-xs bg-surface px-3.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-faint">
        {formatDateSeparator(iso)}
      </span>
    </div>
  );
}
