import { NavLink, useNavigate } from "react-router-dom";
import { MessagesSquare, Search, Settings, LogOut, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "../ui/Logo";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/IconButton";
import { Dropdown } from "../ui/Dropdown";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

const navItems = [
  { to: "/chat", label: "Chats", icon: MessagesSquare },
  { to: "/search", label: "Search", icon: Search },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { currentUser } = useChat();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <aside className="flex h-full w-full flex-col bg-rail lg:w-60 lg:border-r lg:border-border">
      <div className="flex items-center justify-between px-4 py-4">
        <Logo />
        {onNavigate && (
          <IconButton label="Close menu" size="sm" onClick={onNavigate} className="lg:hidden">
            <X size={18} />
          </IconButton>
        )}
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-surface-hover hover:text-ink",
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-border p-3">
        <Dropdown
          align="left"
          placement="top"
          trigger={
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-hover">
              <Avatar
                name={currentUser.name}
                status={currentUser.status}
                showStatus
                size="sm"
                imageUrl={currentUser.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{currentUser.name}</p>
                <p className="truncate text-xs text-ink-muted">@{currentUser.username}</p>
              </div>
            </button>
          }
          items={[
            {
              label: "View profile",
              icon: <UserIcon size={16} />,
              onClick: () => {
                navigate("/profile");
                onNavigate?.();
              },
            },
            {
              label: "Settings",
              icon: <Settings size={16} />,
              onClick: () => {
                navigate("/settings/account");
                onNavigate?.();
              },
            },
            "separator",
            {
              label: "Log out",
              icon: <LogOut size={16} />,
              danger: true,
              onClick: () => setLogoutOpen(true),
            },
          ]}
        />
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          logout();
          navigate("/login");
        }}
        title="Log out?"
        description="You'll need to sign in again to access your conversations."
        confirmLabel="Log out"
        danger
      />
    </aside>
  );
}
