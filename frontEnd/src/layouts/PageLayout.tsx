import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "../components/layout/AppSidebar";
import { IconButton } from "../components/ui/IconButton";

export function PageLayout({ title, backTo, children }: { title: string; backTo?: string; children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-panel px-4 py-3.5">
          <IconButton label="Back" size="sm" onClick={() => (backTo ? navigate(backTo) : navigate(-1))}>
            <ArrowLeft size={18} />
          </IconButton>
          <h1 className="text-base font-semibold text-ink">{title}</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
