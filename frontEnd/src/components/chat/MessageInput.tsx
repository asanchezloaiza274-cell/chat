import { useEffect, useRef, useState } from "react";
import { Send, Mic, Trash2, FileText, ImageIcon, X } from "lucide-react";
import { AttachmentMenu } from "./AttachmentMenu";
import { EmojiPicker } from "./EmojiPicker";
import { ReplyPreview } from "./ReplyPreview";
import { IconButton } from "../ui/IconButton";
import { useChat } from "../../context/ChatContext";
import { createAttachmentFromFile } from "../../utils/attachments";
import type { Attachment } from "../../types";
import { formatDuration } from "../../utils/format";

interface PendingItem {
  attachment: Attachment;
  file: File;
}

const TYPING_STOP_DELAY = 2500;

export function MessageInput({ conversationId }: { conversationId: string }) {
  const { users, sendMessage, sendTyping, replyDraft, setReplyDraft } = useChat();
  const [text, setText] = useState("");
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  useEffect(() => {
    if (!isRecording) {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      return;
    }
    setRecordingSeconds(0);
    recordingInterval.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      if (isTypingRef.current) sendTyping(conversationId, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const replySender = replyDraft ? users.find((u) => u.id === replyDraft.senderId) : undefined;

  function handleTextChange(value: string) {
    setText(value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(conversationId, true);
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(conversationId, false);
    }, TYPING_STOP_DELAY);
  }

  function stopTyping() {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(conversationId, false);
    }
  }

  function handleSend() {
    if (!text.trim() && pendingItems.length === 0) return;
    stopTyping();
    sendMessage(
      conversationId,
      text,
      pendingItems.length > 0 ? pendingItems.map((p) => p.attachment) : undefined,
      pendingItems.length > 0 ? pendingItems.map((p) => p.file) : undefined,
    );
    setText("");
    setPendingItems([]);
  }

  async function handleFilesSelected(files: FileList) {
    const items = await Promise.all(
      Array.from(files).map(async (file) => ({ attachment: await createAttachmentFromFile(file), file })),
    );
    setPendingItems((prev) => [...prev, ...items]);
  }

  function handleSendRecording() {
    stopTyping();
    const duration = Math.max(1, recordingSeconds);
    const attachment: Attachment = { type: "audio", id: crypto.randomUUID(), duration };
    const file = new File([new Blob([], { type: "audio/webm" })], "voice-message.webm", { type: "audio/webm" });
    sendMessage(conversationId, "", [attachment], [file]);
    setIsRecording(false);
  }

  return (
    <div className="border-t border-border bg-panel">
      {replyDraft && replySender && (
        <ReplyPreview
          senderName={replySender.name}
          preview={replyDraft.preview}
          onCancel={() => setReplyDraft(null)}
        />
      )}

      {pendingItems.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2.5">
          {pendingItems.map(({ attachment: att }) => (
            <div key={att.id} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface py-1 pl-1 pr-2 text-xs">
              {att.type === "image" ? (
                att.url ? (
                  <img src={att.url} alt={att.name} className="h-7 w-7 rounded object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded" style={{ backgroundColor: att.color }}>
                    <ImageIcon size={12} className="text-white" />
                  </div>
                )
              ) : att.type === "file" ? (
                <div className="flex h-7 w-7 items-center justify-center rounded bg-accent-soft text-accent">
                  <FileText size={13} />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded bg-accent-soft text-accent">
                  <Mic size={13} />
                </div>
              )}
              <span className="max-w-[120px] truncate text-ink">
                {att.type === "audio" ? `Voice · ${formatDuration(att.duration)}` : att.name}
              </span>
              <button
                onClick={() => setPendingItems((prev) => prev.filter((p) => p.attachment.id !== att.id))}
                aria-label="Remove attachment"
                className="text-ink-faint hover:text-ink"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5 px-3 py-2.5">
        {isRecording ? (
          <div className="flex flex-1 items-center gap-2.5 px-2">
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-danger" />
            <span className="text-sm text-ink-muted">Recording… {formatDuration(recordingSeconds)}</span>
          </div>
        ) : (
          <>
            <AttachmentMenu onFilesSelected={handleFilesSelected} />
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onBlur={stopTyping}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a message"
              rows={1}
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-ink placeholder:text-ink-faint outline-none"
            />
            <EmojiPicker onSelect={(emoji) => handleTextChange(text + emoji)} />
          </>
        )}

        {isRecording ? (
          <>
            <IconButton label="Cancel recording" variant="ghost" onClick={() => setIsRecording(false)}>
              <Trash2 size={19} />
            </IconButton>
            <IconButton label="Send voice message" variant="solid" className="bg-accent text-accent-ink hover:bg-accent-hover" onClick={handleSendRecording}>
              <Send size={17} />
            </IconButton>
          </>
        ) : text.trim() || pendingItems.length > 0 ? (
          <IconButton
            label="Send message"
            onClick={handleSend}
            className="bg-accent text-accent-ink hover:bg-accent-hover"
          >
            <Send size={17} />
          </IconButton>
        ) : (
          <IconButton label="Record voice message" onClick={() => setIsRecording(true)}>
            <Mic size={19} />
          </IconButton>
        )}
      </div>
    </div>
  );
}
