import { NavLink, useNavigate } from "react-router-dom";
import { MessagesSquare, Search, Settings, LogOut, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "../ui/Logo";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/IconButton";
import { Dropdown } from "../ui/Dropdown";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Tooltip } from "../ui/Tooltip";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

const navItems = [
  { to: "/chat", label: "Chats", icon: MessagesSquare },
  { to: "/search", label: "Search", icon: Search },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  compact?: boolean;
}

export function AppSidebar({ onNavigate, compact }: AppSidebarProps) {
  const { currentUser } = useChat();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-rail",
        compact ? "w-[72px] items-center border-r border-border" : "w-full",
      )}
    >
      <div className={cn("flex items-center py-4", compact ? "justify-center px-2" : "justify-between px-4")}>
        <Logo size={compact ? "sm" : "md"} showWordmark={!compact} />
        {onNavigate && (
          <IconButton label="Close menu" size="sm" onClick={onNavigate} className="lg:hidden">
            <X size={18} />
          </IconButton>
        )}
      </div>

      <nav className={cn("flex flex-col gap-1", compact ? "w-full items-center px-2 py-3" : "px-3 py-2")}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const link = (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center font-medium transition-colors",
                  compact ? "h-11 w-11 justify-center rounded-full" : "gap-3 rounded-xl px-3 py-2 text-sm",
                  isActive
                    ? "bg-accent-soft text-accent"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                )
              }
            >
              <Icon size={18} />
              {!compact && label}
            </NavLink>
          );
          return compact ? (
            <Tooltip key={to} label={label} side="right" className="w-full">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className={cn("border-t border-border", compact ? "flex w-full justify-center px-2 py-3" : "p-3")}>
        <Dropdown
          align="left"
          placement="top"
          trigger={
            compact ? (
              <Tooltip label={currentUser.name} side="right">
                <button className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-surface-hover">
                  <Avatar
                    name={currentUser.name}
                    status={currentUser.status}
                    showStatus
                    size="sm"
                    imageUrl={currentUser.avatarUrl}
                  />
                </button>
              </Tooltip>
            ) : (
              <button className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-hover">
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
            )
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
