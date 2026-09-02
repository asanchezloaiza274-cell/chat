import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Search, Phone, Video, MoreVertical, BellOff, Bell, Pin, PinOff, Trash2, Info, LogOut } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/IconButton";
import { Dropdown } from "../ui/Dropdown";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { useChat } from "../../context/ChatContext";
import { getConversationName } from "../../utils/conversationHelpers";
import { formatLastSeen } from "../../utils/format";
import type { Conversation, User } from "../../types";

interface ChatHeaderProps {
  conversation: Conversation;
  otherUser?: User;
  onOpenInfo: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
}

export function ChatHeader({ conversation, otherUser, onOpenInfo, onToggleSearch, isSearchOpen }: ChatHeaderProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { users, currentUser, togglePinConversation, toggleMuteConversation, deleteConversation, removeParticipant } =
    useChat();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const isGroup = conversation.type === "group";
  const isOwner = isGroup && conversation.createdBy === currentUser.id;

  const name = getConversationName(conversation, users, currentUser.id);
  const subtitle =
    conversation.type === "group"
      ? `${conversation.participantIds.length} members`
      : otherUser?.status === "online"
        ? "Online"
        : formatLastSeen(otherUser?.lastSeen);

  const notAvailable = () => showToast("This feature isn't available in the demo", "info");

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-panel px-6 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton label="Back to conversations" size="sm" onClick={() => navigate("/chat")} className="lg:hidden">
          <ArrowLeft size={18} />
        </IconButton>
        <button onClick={onOpenInfo} className="flex min-w-0 items-center gap-2.5 text-left">
          <Avatar
            name={name}
            status={otherUser?.status}
            showStatus={conversation.type === "direct"}
            colorOverride={conversation.avatarColor}
            imageUrl={otherUser?.avatarUrl}
            glow
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-ink-muted">{subtitle}</p>
          </div>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton label="Search in conversation" onClick={onToggleSearch} className={isSearchOpen ? "bg-surface-active text-ink" : ""}>
          <Search size={18} />
        </IconButton>
        <IconButton label="Voice call" onClick={notAvailable} className="hidden sm:inline-flex">
          <Phone size={18} />
        </IconButton>
        <IconButton label="Video call" onClick={notAvailable} className="hidden sm:inline-flex">
          <Video size={18} />
        </IconButton>
        <Dropdown
          align="right"
          trigger={
            <IconButton label="More options" showTooltip={false}>
              <MoreVertical size={18} />
            </IconButton>
          }
          items={[
            { label: "Conversation info", icon: <Info size={15} />, onClick: onOpenInfo },
            {
              label: conversation.muted ? "Unmute" : "Mute",
              icon: conversation.muted ? <Bell size={15} /> : <BellOff size={15} />,
              onClick: () => toggleMuteConversation(conversation.id),
            },
            {
              label: conversation.pinned ? "Unpin conversation" : "Pin conversation",
              icon: conversation.pinned ? <PinOff size={15} /> : <Pin size={15} />,
              onClick: () => togglePinConversation(conversation.id),
            },
            "separator",
            ...(isGroup
              ? [
                  {
                    label: "Leave group",
                    icon: <LogOut size={15} />,
                    danger: true,
                    onClick: () => setLeaveOpen(true),
                  },
                ]
              : []),
            ...(!isGroup || isOwner
              ? [
                  {
                    label: "Delete conversation",
                    icon: <Trash2 size={15} />,
                    danger: true,
                    onClick: () => setDeleteOpen(true),
                  },
                ]
              : []),
          ]}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteConversation(conversation.id);
          navigate("/chat");
        }}
        title="Delete conversation?"
        description="This action cannot be undone. All messages in this conversation will be permanently removed."
        confirmLabel="Delete"
        danger
      />
      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          removeParticipant(conversation.id, currentUser.id);
          navigate("/chat");
        }}
        title="Leave group?"
        description="You won't be able to see new messages in this group unless someone adds you back."
        confirmLabel="Leave"
        danger
      />
    </div>
  );
}
