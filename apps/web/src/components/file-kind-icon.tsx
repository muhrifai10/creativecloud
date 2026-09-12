import { Folder, Image as ImageIcon, Video, Music, FileText, Archive, File } from "lucide-react";
import { KIND_BADGE, type FileKind } from "@nexusdrive/core/file-kind";

const ICONS: Record<FileKind, typeof File> = {
  folder: Folder,
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
  archive: Archive,
  other: File,
};

export function FileKindIcon({ kind, size = 18 }: { kind: FileKind; size?: number }) {
  const Icon = ICONS[kind] ?? File;
  const badge = KIND_BADGE[kind];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg"
      style={{ width: size + 14, height: size + 14, background: badge.bg, color: badge.fg }}
    >
      <Icon size={size} strokeWidth={2} aria-hidden />
    </span>
  );
}
