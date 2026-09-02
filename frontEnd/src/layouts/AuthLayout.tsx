import type { ReactNode } from "react";
import { Logo } from "../components/ui/Logo";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-70 blur-[10px]"
        style={{
          background:
            "radial-gradient(circle, rgba(124,111,239,0.16), rgba(95,168,232,0.08) 55%, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 -left-24 h-[420px] w-[420px] rounded-full opacity-70 blur-[10px]"
        style={{ background: "radial-gradient(circle, rgba(95,168,232,0.1), transparent 70%)" }}
      />
      <div className="animate-rise-in relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" showWordmark={false} />
          <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <div className="shadow-elevated-sm rounded-[28px] border border-border bg-panel px-6 py-7 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
