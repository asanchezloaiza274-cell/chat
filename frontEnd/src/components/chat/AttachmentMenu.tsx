import { useRef, useState } from "react";
import { Image, Video, FileText, Mic, Paperclip } from "lucide-react";
import { Dropdown } from "../ui/Dropdown";
import { IconButton } from "../ui/IconButton";

const ACCEPT: Record<string, string> = {
  Image: "image/*",
  Video: "video/*",
  Document: ".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt",
  Audio: "audio/*",
};

export function AttachmentMenu({ onFilesSelected }: { onFilesSelected: (files: FileList) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [accept, setAccept] = useState("*");

  return (
    <>
      <Dropdown
        align="left"
        trigger={
          <IconButton label="Attach" showTooltip={false}>
            <Paperclip size={19} />
          </IconButton>
        }
        items={[
          {
            label: "Image",
            icon: <Image size={15} />,
            onClick: () => {
              setAccept(ACCEPT.Image);
              requestAnimationFrame(() => inputRef.current?.click());
            },
          },
          {
            label: "Video",
            icon: <Video size={15} />,
            onClick: () => {
              setAccept(ACCEPT.Video);
              requestAnimationFrame(() => inputRef.current?.click());
            },
          },
          {
            label: "Document",
            icon: <FileText size={15} />,
            onClick: () => {
              setAccept(ACCEPT.Document);
              requestAnimationFrame(() => inputRef.current?.click());
            },
          },
          {
            label: "Audio",
            icon: <Mic size={15} />,
            onClick: () => {
              setAccept(ACCEPT.Audio);
              requestAnimationFrame(() => inputRef.current?.click());
            },
          },
        ]}
      />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
          }
          e.target.value = "";
        }}
      />
    </>
  );
}
