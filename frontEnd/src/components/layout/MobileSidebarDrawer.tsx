import { createPortal } from "react-dom";
import { useEffect } from "react";
import { AppSidebar } from "./AppSidebar";

export function MobileSidebarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] lg:hidden">
      <div className="animate-fade-in absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="animate-slide-in-left absolute inset-y-0 left-0 w-72 max-w-[80vw] shadow-2xl shadow-black/50">
        <AppSidebar onNavigate={onClose} />
      </div>
    </div>,
    document.body,
  );
}
