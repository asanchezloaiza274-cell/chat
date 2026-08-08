import type { Attachment } from "../types";
import { avatarColor } from "./avatarColor";

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
}

function readAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    const fallback = setTimeout(() => resolve(Math.floor(10 + Math.random() * 50)), 1500);
    audio.addEventListener("loadedmetadata", () => {
      clearTimeout(fallback);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : Math.floor(10 + Math.random() * 50));
    });
    audio.addEventListener("error", () => {
      clearTimeout(fallback);
      resolve(Math.floor(10 + Math.random() * 50));
    });
  });
}

export async function createAttachmentFromFile(file: File): Promise<Attachment> {
  const id = crypto.randomUUID();

  if (file.type.startsWith("image/")) {
    const url = URL.createObjectURL(file);
    return {
      type: "image",
      id,
      name: file.name,
      size: file.size,
      color: avatarColor(file.name),
      width: 0,
      height: 0,
      url,
    };
  }

  if (file.type.startsWith("audio/")) {
    const url = URL.createObjectURL(file);
    const duration = await readAudioDuration(url);
    return { type: "audio", id, duration };
  }

  return {
    type: "file",
    id,
    name: file.name,
    size: file.size,
    ext: getExtension(file.name),
  };
}
