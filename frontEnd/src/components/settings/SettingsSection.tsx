import type { ReactNode } from "react";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-border px-6 py-6 last:border-b-0">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}
