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
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { ConfirmDialog } from "../ui/ConfirmDialog";
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
  const { users, currentUser, togglePinConversation, toggleMuteConversation, deleteConversation } = useChat();
  const { showToast } = useToast();
  const [confirmAction, setConfirmAction] = useState<"delete" | "block" | "report" | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const name = getConversationName(conversation, users, currentUser.id);
  const images = messages.flatMap((m) => m.attachments?.filter((a): a is ImageAttachment => a.type === "image") ?? []);
  const files = messages.flatMap((m) => m.attachments?.filter((a): a is FileAttachment => a.type === "file") ?? []);
  const links = messages.flatMap((m) => (m.text ? m.text.match(URL_REGEX) ?? [] : []));

  return createPortal(
    <div className="fixed inset-0 z-[85] flex justify-end">
      <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="animate-slide-in-right relative flex h-full w-full max-w-sm flex-col border-l border-border bg-panel shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-sm font-semibold text-ink">Conversation info</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-hover hover:text-ink">
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
            <h3 className="mt-3 text-base font-semibold text-ink">{name}</h3>
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

          {conversation.type === "group" && (
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Members</p>
              <div className="flex flex-col gap-2">
                {conversation.participantIds.map((id) => {
                  const member = users.find((u) => u.id === id);
                  if (!member) return null;
                  return (
                    <div key={id} className="flex items-center gap-2.5">
                      <Avatar
                        name={member.name}
                        size="sm"
                        status={member.status}
                        showStatus
                        imageUrl={member.avatarUrl}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">
                          {member.name} {member.id === currentUser.id && <span className="text-ink-faint">(you)</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              <ImageIcon size={12} /> Shared media ({images.length})
            </p>
            {images.length === 0 ? (
              <p className="text-xs text-ink-faint">No shared media yet</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {images.slice(0, 8).map((img) =>
                  img.url ? (
                    <img key={img.id} src={img.url} alt={img.name} className="aspect-square rounded-md object-cover" />
                  ) : (
                    <div
                      key={img.id}
                      className="flex aspect-square items-center justify-center rounded-md"
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
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
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
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
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
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-hover"
            >
              {conversation.muted ? <Bell size={16} /> : <BellOff size={16} />}
              {conversation.muted ? "Unmute notifications" : "Mute notifications"}
            </button>
            <button
              onClick={() => togglePinConversation(conversation.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-hover"
            >
              {conversation.pinned ? <PinOff size={16} /> : <Pin size={16} />}
              {conversation.pinned ? "Unpin conversation" : "Pin conversation"}
            </button>
            {conversation.type === "direct" && (
              <button
                onClick={() => setConfirmAction("block")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
              >
                <Ban size={16} />
                Block {otherUser?.name}
              </button>
            )}
            <button
              onClick={() => setConfirmAction("report")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
            >
              <Flag size={16} />
              Report
            </button>
            <button
              onClick={() => setConfirmAction("delete")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
            >
              <Trash2 size={16} />
              Delete conversation
            </button>
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
        open={confirmAction === "block"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => showToast(`${otherUser?.name} has been blocked`, "success")}
        title={`Block ${otherUser?.name}?`}
        description="They won't be able to message you anymore."
        confirmLabel="Block"
        danger
      />
      <ConfirmDialog
        open={confirmAction === "report"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => showToast("Thanks — we'll review this conversation", "success")}
        title="Report this conversation?"
        description="Our team will review the recent messages."
        confirmLabel="Report"
        danger
      />
    </div>,
    document.body,
  );
}
