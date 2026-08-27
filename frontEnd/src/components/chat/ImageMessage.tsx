import { useEffect } from "react";
import { ImageIcon, Loader2, AlertCircle } from "lucide-react";
import type { ImageAttachment } from "../../types";
import { cn } from "../../utils/cn";

function ImageTile({ image, onOpen }: { image: ImageAttachment; onOpen: () => void }) {
  const uploading = image.status === "uploading";
  const failed = image.status === "failed";

  useEffect(() => {
    const url = image.url;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [image.url]);

  return (
    <button
      onClick={onOpen}
      disabled={uploading || failed}
      className={cn(
        "group relative block h-40 w-full overflow-hidden",
        (uploading || failed) && "cursor-default",
      )}
    >
      {image.url ? (
        <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: image.color }}>
          <ImageIcon size={24} className="text-white/70" />
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 size={20} className="animate-spin text-white" />
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white">
          <AlertCircle size={18} />
          <span className="text-xs">Failed to upload</span>
        </div>
      )}
      {!uploading && !failed && (
        <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {image.name}
        </div>
      )}
    </button>
  );
}

export function ImageMessageGrid({
  images,
  onOpen,
}: {
  images: ImageAttachment[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className={cn("grid w-72 gap-1", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
      {images.map((image, i) => (
        <ImageTile key={image.id} image={image} onOpen={() => onOpen(i)} />
      ))}
    </div>
  );
}
