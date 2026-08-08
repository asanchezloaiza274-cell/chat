import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import type { ImageAttachment } from "../../types";
import { formatFileSize } from "../../utils/format";
import { IconButton } from "../ui/IconButton";

interface ImageViewerProps {
  images: ImageAttachment[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageViewer({ images, index, onClose, onNavigate }: ImageViewerProps) {
  const image = images[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      if (e.key === "ArrowRight" && index < images.length - 1) onNavigate(index + 1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, onNavigate]);

  if (!image) return null;

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-[95] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-white/80">
          <p className="font-medium text-white">{image.name}</p>
          <p className="text-xs text-white/50">{formatFileSize(image.size)}</p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Download" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <Download size={18} />
          </IconButton>
          <IconButton
            label="Close"
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </IconButton>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
        {index > 0 && (
          <button
            onClick={() => onNavigate(index - 1)}
            aria-label="Previous image"
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {image.url ? (
          <img src={image.url} alt={image.name} className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <div
            className="flex h-80 w-full max-w-xl items-center justify-center rounded-lg"
            style={{ backgroundColor: image.color }}
          >
            <ImageIcon size={48} className="text-white/70" />
          </div>
        )}

        {index < images.length - 1 && (
          <button
            onClick={() => onNavigate(index + 1)}
            aria-label="Next image"
            className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
