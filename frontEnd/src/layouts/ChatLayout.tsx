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
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <div className="hidden lg:block">
        <AppSidebar compact />
      </div>
      <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className={cn("h-full w-full lg:w-auto lg:shrink-0", hasActiveConversation && "hidden lg:block")}>
        <ConversationList onOpenMenu={() => setDrawerOpen(true)} />
      </div>

      <div className={cn("h-full min-w-0 flex-1", !hasActiveConversation && "hidden lg:flex")}>
        <Outlet />
      </div>
    </div>
  );
}
