export type FileKind = 'folder' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

const EXT: Record<Exclude<FileKind, 'folder' | 'other'>, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'svg', 'bmp', 'tiff', 'raw', 'cr2', 'nef', 'arw', 'psd', 'fig', 'sketch'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'prores'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'aiff', 'opus', 'wma'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv', 'rtf', 'pages', 'key', 'numbers'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
};

const MIME_PREFIX: [string, FileKind][] = [
  ['image/', 'image'],
  ['video/', 'video'],
  ['audio/', 'audio'],
  ['text/', 'document'],
  ['application/pdf', 'document'],
  ['application/vnd.', 'document'],
  ['application/zip', 'archive'],
  ['application/x-', 'archive'],
];

export function fileKind(item: { isFolder: boolean; name: string; mimeType?: string | null }): FileKind {
  if (item.isFolder) return 'folder';
  const dot = item.name.lastIndexOf('.');
  const ext = dot > 0 ? item.name.slice(dot + 1).toLowerCase() : '';
  for (const [kind, list] of Object.entries(EXT)) {
    if (list.includes(ext)) return kind as FileKind;
  }
  const mime = (item.mimeType ?? '').toLowerCase();
  for (const [prefix, kind] of MIME_PREFIX) {
    if (mime.startsWith(prefix)) return kind;
  }
  return 'other';
}

export const KIND_BADGE: Record<FileKind, { bg: string; fg: string }> = {
  folder: { bg: '#8B5CF61a', fg: '#8B5CF6' },
  image: { bg: '#F43F5E1a', fg: '#F43F5E' },
  video: { bg: '#F973161a', fg: '#F97316' },
  audio: { bg: '#10B9811a', fg: '#10B981' },
  document: { bg: '#0EA5E91a', fg: '#0EA5E9' },
  archive: { bg: '#6B72801a', fg: '#6B7280' },
  other: { bg: '#94A3B81a', fg: '#94A3B8' },
};
