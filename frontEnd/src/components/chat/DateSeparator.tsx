import { formatDateSeparator } from "../../utils/format";

export function DateSeparator({ iso }: { iso: string }) {
  return (
    <div className="my-5 flex justify-center px-6" role="separator">
      <span className="rounded-full border border-border bg-panel px-3.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-faint shadow-sm">
        {formatDateSeparator(iso)}
      </span>
    </div>
  );
}
