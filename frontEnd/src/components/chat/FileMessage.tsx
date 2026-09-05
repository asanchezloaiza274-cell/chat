import { useState } from "react";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import type { FileAttachment } from "../../types";
import { formatFileSize } from "../../utils/format";
import { cn } from "../../utils/cn";

export function FileMessage({ attachment, isOwn }: { attachment: FileAttachment; isOwn?: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const failed = attachment.status === "failed";
  const uploading = attachment.status === "uploading";

  return (
    <div
      className={cn(
        "flex w-64 items-center gap-3 rounded-2xl px-3 py-2.5",
        isOwn ? "border border-accent/15 bg-accent-soft" : "border border-border bg-surface",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{attachment.name}</p>
        <p className="text-xs text-ink-muted">
          {uploading ? "Uploading…" : failed ? "Upload failed" : formatFileSize(attachment.size)}
        </p>
      </div>
      {uploading ? (
        <Loader2 size={16} className="shrink-0 animate-spin text-ink-faint" />
      ) : failed ? (
        <AlertCircle size={16} className="shrink-0 text-danger" />
      ) : (
        <button
          onClick={() => {
            setDownloading(true);
            setTimeout(() => setDownloading(false), 1200);
          }}
          aria-label={`Download ${attachment.name}`}
          className="shrink-0 p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        </button>
      )}
    </div>
  );
}
