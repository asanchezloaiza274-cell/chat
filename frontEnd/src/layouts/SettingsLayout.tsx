import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Palette, Bell, Lock, ShieldCheck } from "lucide-react";
import { AppSidebar } from "../components/layout/AppSidebar";
import { IconButton } from "../components/ui/IconButton";
import { cn } from "../utils/cn";

const SECTIONS = [
  { to: "/settings/account", label: "Account", icon: User },
  { to: "/settings/appearance", label: "Appearance", icon: Palette },
  { to: "/settings/notifications", label: "Notifications", icon: Bell },
  { to: "/settings/privacy", label: "Privacy", icon: Lock },
  { to: "/settings/security", label: "Security", icon: ShieldCheck },
];

export function SettingsLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <div className="hidden lg:block">
        <AppSidebar compact />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-panel px-4 py-3.5">
          <IconButton label="Back" size="sm" onClick={() => navigate("/chat")}>
            <ArrowLeft size={18} />
          </IconButton>
          <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Settings</h1>
        </div>

        <div className="min-h-0 flex-1 md:flex">
          <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-4">
            {SECTIONS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors md:border-b-0 md:border-l-2",
                    isActive
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-transparent text-ink-muted hover:bg-surface-hover hover:text-ink",
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
