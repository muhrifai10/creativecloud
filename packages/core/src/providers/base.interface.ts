export type CloudProviderId = 'google_drive' | 'dropbox' | 'onedrive' | 'mega' | 'pcloud';

export interface StorageQuota {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
}

export interface UniversalFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  isFolder: boolean;
  parentId: string | null;
  modifiedAt: Date;
  downloadUrl?: string;
  thumbnailUrl?: string;
  provider: CloudProviderId;
}

export interface AccountIdentity {
  email: string;
  name?: string;
}

export interface DownloadResult {
  stream: NodeJS.ReadableStream;
  size: number;
  mimeType: string;
}

export interface IStorageProvider {
  readonly providerId: CloudProviderId;
  getQuota(): Promise<StorageQuota>;
  getIdentity(): Promise<AccountIdentity>;
  listFiles(folderId?: string): Promise<UniversalFileItem[]>;
  searchFiles(query: string): Promise<UniversalFileItem[]>;
  createFolder(name: string, parentFolderId?: string): Promise<UniversalFileItem>;
  renameItem(itemId: string, newName: string): Promise<UniversalFileItem>;
  deleteItem(itemId: string): Promise<boolean>;
  getDownloadStream(itemId: string): Promise<DownloadResult>;
  uploadStream(
    fileName: string,
    stream: NodeJS.ReadableStream,
    parentFolderId?: string,
    sizeBytes?: number,
  ): Promise<UniversalFileItem>;
  getShareLink?(itemId: string): Promise<string>;
}

const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function assertSafeFolderId(folderId: string): string {
  if (folderId === 'root' || folderId === 'me' || SAFE_ID.test(folderId)) return folderId;
  throw new Error('ID folder tidak valid.');
}

export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/\0/g, '').replace(/^\.+/, '').trim().slice(0, 240);
  if (!cleaned || cleaned.includes('/') || cleaned.includes('\\')) {
    throw new Error('Nama berkas tidak valid.');
  }
  return cleaned;
}
