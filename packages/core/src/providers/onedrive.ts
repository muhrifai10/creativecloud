import { Readable } from 'node:stream';
import {
  assertSafeFolderId,
  sanitizeFileName,
  type AccountIdentity,
  type DownloadResult,
  type IStorageProvider,
  type StorageQuota,
  type UniversalFileItem,
} from './base.interface';

type FetchLike = typeof fetch;

interface GraphItem {
  id: string;
  name: string;
  size?: number;
  parentReference?: { driveId?: string; id?: string };
  lastModifiedDateTime?: string;
  webUrl?: string;
  folder?: { childCount?: number };
  file?: { mimeType?: string };
  thumbnails?: unknown[];
}

export class OneDriveProvider implements IStorageProvider {
  readonly providerId = 'onedrive' as const;
  private driveBase = '/me/drive';

  constructor(
    private readonly accessToken: string,
    private readonly fetchImpl: FetchLike = globalThis.fetch,
  ) {}

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetchImpl(`https://graph.microsoft.com/v1.0${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!res.ok) throw new Error(`OneDrive API ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }

  private toFile(item: GraphItem): UniversalFileItem {
    return {
      id: item.id,
      name: item.name,
      sizeBytes: item.size ?? 0,
      mimeType: item.folder ? 'folder' : (item.file?.mimeType ?? 'application/octet-stream'),
      isFolder: Boolean(item.folder),
      parentId: item.parentReference?.id ?? null,
      modifiedAt: new Date(item.lastModifiedDateTime ?? Date.now()),
      downloadUrl: item.webUrl,
      provider: 'onedrive',
    };
  }

  async getQuota(): Promise<StorageQuota> {
    const d = await this.req<{ quota?: { total?: number; used?: number }; id?: string }>('/me/drive');
    if (d.id) this.driveBase = `/drives/${d.id}`;
    const total = d.quota?.total ?? 0;
    const used = d.quota?.used ?? 0;
    return { totalBytes: total, usedBytes: used, freeBytes: Math.max(total - used, 0) };
  }

  async getIdentity(): Promise<AccountIdentity> {
    const u = await this.req<{ mail?: string | null; userPrincipalName?: string; displayName?: string }>('/me');
    return { email: u.mail || u.userPrincipalName || '', name: u.displayName };
  }

  async listFiles(folderId = 'root'): Promise<UniversalFileItem[]> {
    const segment =
      folderId === 'root' || folderId === 'me' ? '/root/children' : `/items/${assertSafeFolderId(folderId)}/children`;
    const res = await this.req<{ value: GraphItem[] }>(`${this.driveBase}${segment}?$top=1000`);
    return res.value.map((i) => this.toFile(i));
  }

  async searchFiles(query: string): Promise<UniversalFileItem[]> {
    const q = encodeURIComponent(query.replace(/['"{}()]/g, ''));
    const res = await this.req<{ value: GraphItem[] }>(`${this.driveBase}/root/search(q=${q})?$top=200`);
    return res.value.map((i) => this.toFile(i));
  }

  async createFolder(name: string, parentFolderId = 'root'): Promise<UniversalFileItem> {
    const segment = parentFolderId === 'root' ? '/root/children' : `/items/${assertSafeFolderId(parentFolderId)}/children`;
    const item = await this.req<GraphItem>(`${this.driveBase}${segment}`, {
      method: 'POST',
      body: JSON.stringify({ name: sanitizeFileName(name), folder: {} }),
    });
    return this.toFile(item);
  }

  async renameItem(itemId: string, newName: string): Promise<UniversalFileItem> {
    const item = await this.req<GraphItem>(`${this.driveBase}/items/${assertSafeFolderId(itemId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: sanitizeFileName(newName) }),
    });
    return this.toFile(item);
  }

  async deleteItem(itemId: string): Promise<boolean> {
    const res = await this.fetchImpl(
      `https://graph.microsoft.com/v1.0${this.driveBase}/items/${assertSafeFolderId(itemId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${this.accessToken}` } },
    );
    return res.ok || res.status === 204;
  }

  async getDownloadStream(itemId: string): Promise<DownloadResult> {
    const id = assertSafeFolderId(itemId);
    const meta = await this.req<{ size?: number; file?: { mimeType?: string } }>(
      `${this.driveBase}/items/${id}?select=size,file`,
    );
    const res = await this.fetchImpl(
      `https://graph.microsoft.com/v1.0${this.driveBase}/items/${id}/content`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } },
    );
    if (!res.ok || !res.body) throw new Error(`OneDrive download ${res.status}`);
    return {
      stream: res.body as unknown as NodeJS.ReadableStream,
      size: meta.size ?? 0,
      mimeType: meta.file?.mimeType ?? 'application/octet-stream',
    };
  }

  /**
   * createUploadSession lalu PUT per-range. Hanya satu fragmen (default 5MB) di RAM
   * per iterasi. Microsoft mewajibkan ukuran fragmen kelipatan 320KiB.
   */
  async uploadStream(
    fileName: string,
    stream: NodeJS.ReadableStream,
    parentFolderId = 'root',
    _sizeBytes?: number,
    fragBytes = 5 * 1024 * 1024,
  ): Promise<UniversalFileItem> {
    const segment = parentFolderId === 'root' || parentFolderId === 'me' ? '/root/children' : `/items/${assertSafeFolderId(parentFolderId)}/children`;
    const session = await this.req<{ uploadUrl: string }>(`${this.driveBase}${segment}:/${encodeURIComponent(sanitizeFileName(fileName))}/createUploadSession`, {
      method: 'POST',
      body: JSON.stringify({ item: { folder: {} } }),
    });

    const size = Math.max(fragBytes - (fragBytes % (320 * 1024)), 320 * 1024);
    const it = (stream as Readable)[Symbol.asyncIterator]();
    let pos = 0;
    let buffer = Buffer.alloc(0);
    const name = sanitizeFileName(fileName);
    for (;;) {
      let last = false;
      while (buffer.length < size) {
        const { value, done } = await it.next();
        if (done) { last = true; break; }
        buffer = Buffer.concat([buffer, Buffer.from(value)]);
      }
      const take = last ? buffer.length : size;
      const frag = buffer.subarray(0, take);
      buffer = buffer.subarray(take);
      const start = pos;
      pos += frag.length;
      const res = await this.fetchImpl(session.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Length': String(frag.length), 'Content-Range': `bytes ${start}-${pos - 1}/*` },
        body: frag as never,
      });
      if (!res.ok) throw new Error(`OneDrive upload ${res.status}`);
      const body = (await res.json().catch(() => ({}))) as GraphItem;
      if (last || body.id) {
        return this.toFile({ ...body, name, id: body.id ?? '', size: pos });
      }
    }
  }
}
