import type { ReactNode } from "react";
import { Logo } from "../components/ui/Logo";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10 sm:px-6">
      <div className="animate-rise-in relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" showWordmark={false} />
          <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <div className="rounded-sm border border-border bg-panel px-6 py-7 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
