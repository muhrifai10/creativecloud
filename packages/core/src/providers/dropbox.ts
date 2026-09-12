import { Dropbox } from 'dropbox';
import { Readable } from 'node:stream';
import { asAsyncIterator, readUpTo } from './stream-util';
import {
  sanitizeFileName,
  type AccountIdentity,
  type DownloadResult,
  type IStorageProvider,
  type StorageQuota,
  type UniversalFileItem,
} from './base.interface';

interface DbxEntry {
  '.tag': string;
  name: string;
  path_lower: string;
  path_display: string;
  parent_folder_id?: string | null;
  server_modified?: string;
  size?: number;
  preview_url?: string;
  tag?: string;
}

function toFile(entry: DbxEntry): UniversalFileItem {
  return {
    id: entry.path_lower,
    name: entry.name,
    sizeBytes: entry['.tag'] === 'folder' ? 0 : (entry.size ?? 0),
    mimeType: entry['.tag'] === 'folder' ? 'folder' : (entry.tag ?? 'application/octet-stream'),
    isFolder: entry['.tag'] === 'folder',
    parentId: entry.path_lower.split('/').slice(0, -1).join('/') || '/',
    modifiedAt: new Date(entry.server_modified ?? Date.now()),
    downloadUrl: entry.preview_url,
    provider: 'dropbox',
  };
}

export class DropboxProvider implements IStorageProvider {
  readonly providerId = 'dropbox' as const;

  constructor(private readonly dbx: Dropbox) {}

  static fromAccessToken(accessToken: string): DropboxProvider {
    return new DropboxProvider(new Dropbox({ accessToken }));
  }

  async getQuota(): Promise<StorageQuota> {
    const { result } = await this.dbx.usersGetSpaceUsage();
    const usage = result as unknown as { allocated?: number | bigint; individual_allocation_bytes?: number | bigint; used?: number | bigint };
    const total = Number(usage.allocated ?? usage.individual_allocation_bytes ?? 0) || 0;
    const used = Number(usage.used ?? 0) || 0;
    return { totalBytes: total, usedBytes: used, freeBytes: Math.max(total - used, 0) };
  }

  async getIdentity(): Promise<AccountIdentity> {
    const acc = (await this.dbx.usersGetCurrentAccount()) as unknown as {
      email?: string;
      name?: { given_name: string; surname: string };
    };
    return {
      email: acc.email ?? '',
      name: acc.name ? `${acc.name.given_name} ${acc.name.surname}`.trim() : undefined,
    };
  }

  async listFiles(folderId = '/'): Promise<UniversalFileItem[]> {
    const path = folderId === '/' || folderId === 'root' ? '' : folderId;
    const res = await this.dbx.filesListFolder({ path, limit: 1000 });
    return (res.result.entries as unknown as DbxEntry[]).map(toFile);
  }

  async searchFiles(query: string): Promise<UniversalFileItem[]> {
    const res = await this.dbx.filesSearchV2({
      query: query.replace(/['"[\]{}():]/g, ''),
      options: { max_results: 200 },
    });
    return res.result.matches.map((m) => toFile(m.metadata as unknown as DbxEntry));
  }

  async createFolder(name: string, parentFolderId = '/'): Promise<UniversalFileItem> {
    const base = parentFolderId === '/' || parentFolderId === 'root' ? '' : parentFolderId.replace(/\/+$/, '');
    // filesFolder ada di runtime SDK namun tidak dideklarasikan di index.d.ts dropbox v10
    const folderCreate = (this.dbx as unknown as {
      filesFolder(arg: { path: string; autorename?: boolean }): Promise<{ result: unknown }>;
    }).filesFolder;
    const res = await folderCreate.call(this.dbx, {
      path: `${base}/${sanitizeFileName(name)}`,
      autorename: true,
    });
    return toFile(res.result as DbxEntry);
  }

  async renameItem(itemId: string, newName: string): Promise<UniversalFileItem> {
    const parent = itemId.slice(0, itemId.lastIndexOf('/')) || '';
    const res = await this.dbx.filesMove({
      from_path: itemId,
      to_path: `${parent}/${sanitizeFileName(newName)}`,
      allow_shared_folder: true,
      autorename: true,
    });
    const meta = (res.result as unknown as { metadata?: DbxEntry }).metadata ?? res.result;
    return toFile(meta as DbxEntry);
  }

  async deleteItem(itemId: string): Promise<boolean> {
    await this.dbx.filesDeleteV2({ path: itemId });
    return true;
  }

  async getDownloadStream(itemId: string): Promise<DownloadResult> {
    const meta = (await this.dbx.filesGetMetadata({ path: itemId })).result as unknown as {
      '.tag'?: string;
      size?: number;
    };
    const res = await this.dbx.filesDownload({ path: itemId });
    const body = (res.result as unknown as { fileBinaryStream: NodeJS.ReadableStream }).fileBinaryStream;
    return {
      stream: body,
      size: meta['.tag'] === 'file' ? Number(meta.size ?? 0) || 0 : 0,
      mimeType: 'application/octet-stream',
    };
  }

  async uploadStream(
    fileName: string,
    stream: NodeJS.ReadableStream,
    parentFolderId = '/',
    _sizeBytes?: number,
    partBytes = 32 * 1024 * 1024,
  ): Promise<UniversalFileItem> {
    const base = parentFolderId === '/' || parentFolderId === 'root' ? '' : parentFolderId.replace(/\/+$/, '');
    const commitPath = `${base}/${sanitizeFileName(fileName)}`;
    const dbx = this.dbx as unknown as {
      filesUploadSessionStart(a: { close: boolean; auto_rename: boolean }): Promise<{ result: { session_id: string } }>;
      filesUploadSessionAppendV2(a: { cursor: { session_id: string; offset: number }; body: Buffer }): Promise<unknown>;
      filesUploadSessionFinish(a: {
        cursor: { session_id: string; offset: number };
        commit: { path: string; mode: string; autorename: boolean };
        body?: Buffer;
      }): Promise<{ result: unknown }>;
    };
    const start = await dbx.filesUploadSessionStart({ close: false, auto_rename: true });
    const sessionId = start.result.session_id;

    const it = asAsyncIterator(stream as Readable);
    let offset = 0;
    const commit = { path: commitPath, mode: 'add', autorename: true };
    let pending = await readUpTo(it, partBytes);
    while (pending) {
      const { chunk, done } = pending;
      if (done) {
        const finish = await dbx.filesUploadSessionFinish({
          cursor: { session_id: sessionId, offset },
          commit,
          body: chunk,
        });
        return toFile(finish.result as DbxEntry);
      }
      await dbx.filesUploadSessionAppendV2({ cursor: { session_id: sessionId, offset }, body: chunk });
      offset += chunk.length;
      pending = await readUpTo(it, partBytes);
    }
    const empty = await dbx.filesUploadSessionFinish({ cursor: { session_id: sessionId, offset }, commit });
    return toFile(empty.result as DbxEntry);
  }
}
