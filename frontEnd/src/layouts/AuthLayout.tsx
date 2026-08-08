import type { ReactNode } from "react";
import { Logo } from "../components/ui/Logo";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" showWordmark={false} />
          <h1 className="mt-4 text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <div className="rounded-xl border border-border bg-panel px-6 py-7 shadow-lg shadow-black/20 sm:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
