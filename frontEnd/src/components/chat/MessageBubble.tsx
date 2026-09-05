import { useState } from "react";
import { Pin, Ban } from "lucide-react";
import type { ImageAttachment, Message } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { ReplyPreview } from "./ReplyPreview";
import { ReactionBar } from "./ReactionBar";
import { MessageHoverToolbar } from "./MessageHoverToolbar";
import { ImageMessageGrid } from "./ImageMessage";
import { FileMessage } from "./FileMessage";
import { AudioMessage } from "./AudioMessage";
import { formatMessageTime } from "../../utils/format";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../utils/cn";
import { highlightText } from "../../utils/highlightText";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  senderName: string;
  senderAvatarUrl?: string;
  onOpenImages: (images: ImageAttachment[], index: number) => void;
  searchQuery?: string;
  isActiveMatch?: boolean;
  registerRef?: (el: HTMLDivElement | null) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  senderName,
  senderAvatarUrl,
  onOpenImages,
  searchQuery,
  isActiveMatch,
  registerRef,
}: MessageBubbleProps) {
  const {
    currentUser,
    users,
    toggleReaction,
    deleteMessage,
    editMessage,
    togglePinMessage,
    setReplyDraft,
    retryMessage,
  } = useChat();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.text ?? "");

  const replyToSenderName = message.replyTo
    ? message.replyTo.senderId === currentUser.id
      ? "You"
      : (users.find((u) => u.id === message.replyTo!.senderId)?.name ?? "Unknown")
    : "";

  if (message.deleted) {
    return (
      <div className={cn("flex items-end gap-2 px-6 py-0.5", isOwn && "flex-row-reverse")}>
        <div className="w-7 shrink-0" />
        <div className="flex items-center gap-1.5 rounded-2xl border border-dashed border-border px-3.5 py-2 text-sm italic text-ink-faint">
          <Ban size={13} />
          This message was deleted
        </div>
      </div>
    );
  }

  const images = message.attachments?.filter((a): a is ImageAttachment => a.type === "image") ?? [];
  const otherAttachments = message.attachments?.filter((a) => a.type !== "image") ?? [];

  return (
    <div
      ref={registerRef}
      className={cn("group/message flex items-end gap-2 px-6 py-0.5", isOwn && "flex-row-reverse")}
    >
      <div className="w-7 shrink-0">
        {showAvatar && !isOwn && <Avatar name={senderName} size="sm" imageUrl={senderAvatarUrl} />}
      </div>

      <div className={cn("relative flex max-w-[min(560px,75%)] flex-col", isOwn ? "items-end" : "items-start")}>
        <MessageHoverToolbar
          isOwn={isOwn}
          isPinned={message.pinned}
          canEdit={isOwn && !!message.text && otherAttachments.length === 0 && images.length === 0}
          onReact={(emoji) => toggleReaction(message.conversationId, message.id, emoji)}
          onReply={() =>
            setReplyDraft({ messageId: message.id, senderId: message.senderId, preview: message.text ?? "Attachment" })
          }
          onCopy={() => {
            if (message.text) navigator.clipboard.writeText(message.text);
            showToast("Copied to clipboard", "success");
          }}
          onEdit={() => setIsEditing(true)}
          onDelete={() => deleteMessage(message.conversationId, message.id)}
          onTogglePin={() => togglePinMessage(message.conversationId, message.id)}
          onMarkUnread={() => showToast("Marked as unread", "info")}
        />

        {message.pinned && (
          <div className="mb-0.5 flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-wide text-ink-faint">
            <Pin size={10} />
            Pinned
          </div>
        )}

        <div
          className={cn(
            "min-w-0 rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-colors",
            isOwn ? "bg-accent text-accent-ink" : "border border-border bg-surface text-ink",
            isOwn ? (showAvatar ? "rounded-br-md" : "") : showAvatar ? "rounded-bl-md" : "",
            (images.length > 0 || otherAttachments.length > 0) && !message.text && "bg-transparent p-0 shadow-none",
            isActiveMatch && "outline outline-2 outline-offset-1 outline-warning",
          )}
        >
          {message.replyTo && (
            <ReplyPreview
              senderName={replyToSenderName}
              preview={message.replyTo.preview}
              variant="inline"
              onAccent={isOwn}
            />
          )}

          {images.length > 0 && (
            <div className="mb-1">
              <ImageMessageGrid images={images} onOpen={(i) => onOpenImages(images, i)} />
            </div>
          )}

          {otherAttachments.map((att) => (
            <div key={att.id} className="mb-1">
              {att.type === "file" && <FileMessage attachment={att} isOwn={isOwn} />}
              {att.type === "audio" && <AudioMessage attachment={att} isOwn={isOwn} />}
            </div>
          ))}

          {isEditing ? (
            <div className="min-w-[240px]">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="bg-canvas text-ink"
                autoFocus
              />
              <div className="mt-1.5 flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    editMessage(message.conversationId, message.id, draft);
                    setIsEditing(false);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            message.text && (
              <p className="whitespace-pre-wrap break-words">
                {searchQuery ? highlightText(message.text, searchQuery) : message.text}
                {message.edited && <span className="ml-1.5 font-mono text-[10px] opacity-60">(edited)</span>}
              </p>
            )
          )}

          <div
            className={cn(
              "mt-0.5 flex items-center gap-1 font-mono text-[10px] tabular-nums",
              isOwn ? "justify-end text-accent-ink/70" : "justify-end text-ink-faint",
            )}
          >
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn && <MessageStatusIcon status={message.status} />}
          </div>
        </div>

        {message.status === "failed" && (
          <button
            onClick={() => retryMessage(message.conversationId, message.id)}
            className="mt-1 text-xs font-medium text-danger hover:underline"
          >
            Failed to send · Retry
          </button>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <ReactionBar
            reactions={message.reactions}
            currentUserId={currentUser.id}
            onToggle={(emoji) => toggleReaction(message.conversationId, message.id, emoji)}
          />
        )}
      </div>
    </div>
  );
}
