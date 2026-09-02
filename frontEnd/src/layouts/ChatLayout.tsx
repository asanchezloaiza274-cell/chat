import { useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AppSidebar } from "../components/layout/AppSidebar";
import { MobileSidebarDrawer } from "../components/layout/MobileSidebarDrawer";
import { ConversationList } from "../components/conversations/ConversationList";
import { cn } from "../utils/cn";

export function ChatLayout() {
  const { id } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasActiveConversation = !!id;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-canvas">
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
        className="pointer-events-none absolute -bottom-52 left-24 h-[420px] w-[420px] rounded-full opacity-70 blur-[10px]"
        style={{ background: "radial-gradient(circle, rgba(95,168,232,0.1), transparent 70%)" }}
      />

      <div className="relative hidden lg:block">
        <AppSidebar compact />
      </div>
      <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className={cn("relative h-full w-full lg:w-auto lg:shrink-0", hasActiveConversation && "hidden lg:block")}>
        <ConversationList onOpenMenu={() => setDrawerOpen(true)} />
      </div>

      <div className={cn("relative h-full min-w-0 flex-1", !hasActiveConversation && "hidden lg:flex")}>
        <Outlet />
      </div>
    </div>
  );
}
