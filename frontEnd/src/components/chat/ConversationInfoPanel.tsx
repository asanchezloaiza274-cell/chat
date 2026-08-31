import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Bell,
  BellOff,
  Pin,
  PinOff,
  Ban,
  Flag,
  Trash2,
  ImageIcon,
  FileText,
  Link2,
  Pencil,
  Check,
  UserPlus,
  UserMinus,
  LogOut,
  Search,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { IconButton } from "../ui/IconButton";
import { UserListItem } from "../conversations/UserListItem";
import { EmptyState } from "../ui/EmptyState";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import { formatFileSize, formatLastSeen } from "../../utils/format";
import { getConversationName } from "../../utils/conversationHelpers";
import type { Conversation, FileAttachment, ImageAttachment, Message, User } from "../../types";

interface ConversationInfoPanelProps {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
  messages: Message[];
  otherUser?: User;
}

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export function ConversationInfoPanel({ open, onClose, conversation, messages, otherUser }: ConversationInfoPanelProps) {
  const {
    users,
    currentUser,
    togglePinConversation,
    toggleMuteConversation,
    deleteConversation,
    renameConversation,
    addParticipant,
    removeParticipant,
    blockedUserIds,
    toggleBlockUser,
    reportConversation,
  } = useChat();
  const { showToast } = useToast();
  const [confirmAction, setConfirmAction] = useState<"delete" | "block" | "report" | "leave" | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIsEditingName(false);
      setIsAddMemberOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const name = getConversationName(conversation, users, currentUser.id);
  const images = messages.flatMap((m) => m.attachments?.filter((a): a is ImageAttachment => a.type === "image") ?? []);
  const files = messages.flatMap((m) => m.attachments?.filter((a): a is FileAttachment => a.type === "file") ?? []);
  const links = messages.flatMap((m) => (m.text ? m.text.match(URL_REGEX) ?? [] : []));

  const isGroup = conversation.type === "group";
  const isOwner = isGroup && conversation.createdBy === currentUser.id;
  const isBlocked = otherUser ? blockedUserIds.includes(otherUser.id) : false;
  const availableToAdd = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      !conversation.participantIds.includes(u.id) &&
      (addMemberQuery.trim()
        ? u.name.toLowerCase().includes(addMemberQuery.trim().toLowerCase()) ||
          u.username.toLowerCase().includes(addMemberQuery.trim().toLowerCase())
        : true),
  );

  function startEditingName() {
    setNameDraft(conversation.name ?? "");
    setIsEditingName(true);
  }

  function saveNameEdit() {
    const trimmed = nameDraft.trim();
    setIsEditingName(false);
    if (trimmed && trimmed !== conversation.name) {
      renameConversation(conversation.id, trimmed);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[85] flex justify-end">
      <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="shadow-elevated animate-slide-in-right relative flex h-full w-full max-w-sm flex-col border-l border-border-strong bg-panel">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-sm font-semibold tracking-[-0.01em] text-ink">Conversation info</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-ink-faint hover:bg-surface-hover hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center px-4 py-6 text-center">
            <Avatar
              name={name}
              size="xl"
              status={otherUser?.status}
              showStatus={conversation.type === "direct"}
              colorOverride={conversation.avatarColor}
              imageUrl={otherUser?.avatarUrl}
            />
            {isEditingName ? (
              <div className="mt-3 flex w-full items-center gap-1.5 px-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveNameEdit();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="min-w-0 flex-1 border border-border-strong bg-surface px-2 py-1 text-center text-base font-semibold text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                />
                <IconButton label="Save name" size="sm" onClick={saveNameEdit} showTooltip={false}>
                  <Check size={16} />
                </IconButton>
              </div>
            ) : (
              <h3 className="mt-3 flex items-center gap-1.5 text-base font-semibold text-ink">
                {name}
                {isGroup && (
                  <IconButton label="Rename group" size="sm" onClick={startEditingName} showTooltip={false}>
                    <Pencil size={13} />
                  </IconButton>
                )}
              </h3>
            )}
            <p className="mt-0.5 text-sm text-ink-muted">
              {conversation.type === "group"
                ? `${conversation.participantIds.length} members`
                : otherUser?.status === "online"
                  ? "Online"
                  : formatLastSeen(otherUser?.lastSeen)}
            </p>
            {conversation.type === "direct" && otherUser?.bio && (
              <p className="mt-2 text-sm text-ink-muted">{otherUser.bio}</p>
            )}
          </div>

          {isGroup && (
            <div className="border-t border-border px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Members</p>
                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  <UserPlus size={12} /> Add
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {conversation.participantIds.map((id) => {
                  const member = users.find((u) => u.id === id);
                  if (!member) return null;
                  const canRemove = isOwner && member.id !== currentUser.id;
                  return (
                    <div key={id} className="group flex items-center gap-2.5 py-0.5">
                      <Avatar
                        name={member.name}
                        size="sm"
                        status={member.status}
                        showStatus
                        imageUrl={member.avatarUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">
                          {member.name} {member.id === currentUser.id && <span className="text-ink-faint">(you)</span>}
                          {member.id === conversation.createdBy && <span className="text-ink-faint"> · owner</span>}
                        </p>
                      </div>
                      {canRemove && (
                        <IconButton
                          label={`Remove ${member.name}`}
                          size="sm"
                          variant="danger"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => removeParticipant(conversation.id, member.id)}
                        >
                          <UserMinus size={14} />
                        </IconButton>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              <ImageIcon size={12} /> Shared media ({images.length})
            </p>
            {images.length === 0 ? (
              <p className="text-xs text-ink-faint">No shared media yet</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {images.slice(0, 8).map((img) =>
                  img.url ? (
                    <img key={img.id} src={img.url} alt={img.name} className="aspect-square object-cover" />
                  ) : (
                    <div
                      key={img.id}
                      className="flex aspect-square items-center justify-center"
                      style={{ backgroundColor: img.color }}
                    >
                      <ImageIcon size={14} className="text-white/70" />
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              <FileText size={12} /> Shared files ({files.length})
            </p>
            {files.length === 0 ? (
              <p className="text-xs text-ink-faint">No shared files yet</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {files.slice(0, 5).map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-ink-muted">
                    <FileText size={13} className="shrink-0 text-ink-faint" />
                    <span className="truncate text-ink">{f.name}</span>
                    <span className="ml-auto shrink-0">{formatFileSize(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              <Link2 size={12} /> Shared links ({links.length})
            </p>
            {links.length === 0 ? (
              <p className="text-xs text-ink-faint">No shared links yet</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {links.slice(0, 5).map((l, i) => (
                  <p key={i} className="truncate text-xs text-accent">
                    {l}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border px-2 py-2">
            <button
              onClick={() => toggleMuteConversation(conversation.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-hover"
            >
              {conversation.muted ? <Bell size={16} /> : <BellOff size={16} />}
              {conversation.muted ? "Unmute notifications" : "Mute notifications"}
            </button>
            <button
              onClick={() => togglePinConversation(conversation.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-hover"
            >
              {conversation.pinned ? <PinOff size={16} /> : <Pin size={16} />}
              {conversation.pinned ? "Unpin conversation" : "Pin conversation"}
            </button>
            {isGroup && (
              <button
                onClick={() => setConfirmAction("leave")}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
              >
                <LogOut size={16} />
                Leave group
              </button>
            )}
            {conversation.type === "direct" && otherUser && (
              <button
                onClick={() => (isBlocked ? toggleBlockUser(otherUser.id) : setConfirmAction("block"))}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
              >
                <Ban size={16} />
                {isBlocked ? `Unblock ${otherUser.name}` : `Block ${otherUser.name}`}
              </button>
            )}
            <button
              onClick={() => setConfirmAction("report")}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
            >
              <Flag size={16} />
              Report
            </button>
            {(!isGroup || isOwner) && (
              <button
                onClick={() => setConfirmAction("delete")}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
              >
                <Trash2 size={16} />
                Delete conversation
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          deleteConversation(conversation.id);
          onClose();
        }}
        title="Delete conversation?"
        description="This action cannot be undone. All messages in this conversation will be permanently removed."
        confirmLabel="Delete"
        danger
      />
      <ConfirmDialog
        open={confirmAction === "leave"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          removeParticipant(conversation.id, currentUser.id);
          onClose();
        }}
        title="Leave group?"
        description="You won't be able to see new messages in this group unless someone adds you back."
        confirmLabel="Leave"
        danger
      />
      <ConfirmDialog
        open={confirmAction === "block"}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (!otherUser) return;
          try {
            await toggleBlockUser(otherUser.id);
            showToast(`${otherUser.name} has been blocked`, "success");
          } catch {
            showToast("Couldn't block this user", "error");
          }
        }}
        title={`Block ${otherUser?.name}?`}
        description="They won't be able to message you anymore."
        confirmLabel="Block"
        danger
      />
      <ConfirmDialog
        open={confirmAction === "report"}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          try {
            await reportConversation(conversation.id);
            showToast("Thanks — we'll review this conversation", "success");
          } catch {
            showToast("Couldn't submit your report", "error");
          }
        }}
        title="Report this conversation?"
        description="Our team will review the recent messages."
        confirmLabel="Report"
        danger
      />

      <Modal
        open={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Add members"
        size="sm"
      >
        <div className="mb-3">
          <Input
            autoFocus
            placeholder="Search people"
            leftIcon={<Search size={16} />}
            value={addMemberQuery}
            onChange={(e) => setAddMemberQuery(e.target.value)}
          />
        </div>
        <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
          {availableToAdd.length === 0 ? (
            <EmptyState icon={<UserPlus size={20} />} title="No one to add" description="Everyone is already in this group." />
          ) : (
            availableToAdd.map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                onClick={() => {
                  addParticipant(conversation.id, user.id);
                  setIsAddMemberOpen(false);
                  setAddMemberQuery("");
                }}
              />
            ))
          )}
        </div>
      </Modal>
    </div>,
    document.body,
  );
}
