import { google } from 'googleapis';
import {
  assertSafeFolderId,
  sanitizeFileName,
  type AccountIdentity,
  type DownloadResult,
  type IStorageProvider,
  type StorageQuota,
  type UniversalFileItem,
} from './base.interface';

type Drive = ReturnType<typeof google.drive>;

function toFile(item: {
  id?: string | null;
  name?: string | null;
  size?: string | null;
  mimeType?: string | null;
  parents?: string[] | null;
  modifiedTime?: string | null;
  webContentLink?: string | null;
  thumbnailLink?: string | null;
}): UniversalFileItem {
  return {
    id: item.id ?? '',
    name: item.name ?? '',
    sizeBytes: Number(item.size ?? 0) || 0,
    mimeType: item.mimeType ?? 'application/octet-stream',
    isFolder: item.mimeType === 'application/vnd.google-apps.folder',
    parentId: item.parents?.[0] ?? null,
    modifiedAt: new Date(item.modifiedTime ?? Date.now()),
    downloadUrl: item.webContentLink ?? undefined,
    thumbnailUrl: item.thumbnailLink ?? undefined,
    provider: 'google_drive',
  };
}

export class GoogleDriveProvider implements IStorageProvider {
  readonly providerId = 'google_drive' as const;

  constructor(
    private readonly drive: Drive,
    private readonly accessToken: string = '',
  ) {}

  static fromAccessToken(accessToken: string): GoogleDriveProvider {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return new GoogleDriveProvider(google.drive({ version: 'v3', auth }), accessToken);
  }

  async getQuota(): Promise<StorageQuota> {
    const { data } = await this.drive.about.get({ fields: 'storageQuota' });
    const quota = data.storageQuota as { limit?: string; userLimit?: string; usage?: string } | undefined;
    const limit = Number(quota?.limit ?? quota?.userLimit ?? 0) || 0;
    const used = Number(quota?.usage ?? 0) || 0;
    return { totalBytes: limit, usedBytes: used, freeBytes: Math.max(limit - used, 0) };
  }

  async getIdentity(): Promise<AccountIdentity> {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo?alt=json', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!res.ok) throw new Error('Gagal mengambil identitas akun Google.');
    const data = (await res.json()) as { email?: string; name?: string };
    return { email: data.email ?? '', name: data.name };
  }

  async listFiles(folderId = 'root'): Promise<UniversalFileItem[]> {
    const parent = assertSafeFolderId(folderId);
    const { data } = await this.drive.files.list({
      q: `'${parent}' in parents and trashed = false`,
      fields: 'files(id,name,size,mimeType,parents,modifiedTime,webContentLink,thumbnailLink)',
      pageSize: 1000,
    });
    return (data.files ?? []).map(toFile);
  }

  async searchFiles(query: string): Promise<UniversalFileItem[]> {
    const q = query.replace(/['\\]/g, '');
    const { data } = await this.drive.files.list({
      q: `name contains '${q}' and trashed = false`,
      fields: 'files(id,name,size,mimeType,parents,modifiedTime)',
      pageSize: 200,
    });
    return (data.files ?? []).map(toFile);
  }

  async createFolder(name: string, parentFolderId = 'root'): Promise<UniversalFileItem> {
    const { data } = await this.drive.files.create({
      requestBody: {
        name: sanitizeFileName(name),
        mimeType: 'application/vnd.google-apps.folder',
        parents: [assertSafeFolderId(parentFolderId)],
      },
      fields: 'id,name,size,mimeType,parents,modifiedTime',
    });
    return toFile(data);
  }

  async renameItem(itemId: string, newName: string): Promise<UniversalFileItem> {
    const { data } = await this.drive.files.update({
      fileId: assertSafeFolderId(itemId),
      requestBody: { name: sanitizeFileName(newName) },
      fields: 'id,name,size,mimeType,parents,modifiedTime',
    });
    return toFile(data);
  }

  async deleteItem(itemId: string): Promise<boolean> {
    await this.drive.files.delete({ fileId: assertSafeFolderId(itemId) });
    return true;
  }

  async getDownloadStream(itemId: string): Promise<DownloadResult> {
    const id = assertSafeFolderId(itemId);
    const meta = await this.drive.files.get({ fileId: id, fields: 'name,size,mimeType' });
    const res = await this.drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'stream' },
    );
    return {
      stream: res.data as NodeJS.ReadableStream,
      size: Number(meta.data.size ?? 0) || 0,
      mimeType: meta.data.mimeType ?? 'application/octet-stream',
    };
  }

  async getShareLink(itemId: string): Promise<string> {
    const id = assertSafeFolderId(itemId);
    return `https://drive.google.com/file/d/${id}/view?usp=sharing`;
  }

  async uploadStream(
    fileName: string,
    stream: NodeJS.ReadableStream,
    parentFolderId = 'root',
    _sizeBytes?: number,
  ): Promise<UniversalFileItem> {
    const { data } = await this.drive.files.create({
      requestBody: {
        name: sanitizeFileName(fileName),
        parents: [assertSafeFolderId(parentFolderId)],
      },
      media: { mimeType: 'application/octet-stream', body: stream },
      fields: 'id,name,size,mimeType,parents,modifiedTime',
    });
    return toFile(data);
  }
}
