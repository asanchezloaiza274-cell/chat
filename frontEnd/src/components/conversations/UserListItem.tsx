import type { ReactNode } from "react";
import { Avatar } from "../ui/Avatar";
import type { User } from "../../types";
import { cn } from "../../utils/cn";

interface UserListItemProps {
  user: User;
  onClick?: () => void;
  rightElement?: ReactNode;
  selected?: boolean;
}

export function UserListItem({ user, onClick, rightElement, selected }: UserListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-sm px-3.5 py-3 text-left transition-colors",
        selected ? "bg-accent-soft" : "hover:bg-surface-hover",
      )}
    >
      <Avatar name={user.name} status={user.status} showStatus size="md" imageUrl={user.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{user.name}</p>
        <p className="truncate text-xs text-ink-muted">
          @{user.username} · {user.status === "online" ? "Online" : user.status === "away" ? "Away" : "Offline"}
        </p>
      </div>
      {rightElement}
    </button>
  );
}
