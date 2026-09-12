import { Readable } from 'node:stream';
import {
  sanitizeFileName,
  type AccountIdentity,
  type DownloadResult,
  type IStorageProvider,
  type StorageQuota,
  type UniversalFileItem,
} from './base.interface';

type FetchLike = typeof fetch;

interface PCloudEntry {
  id?: number;
  fileid?: number;
  folderid?: number;
  parentfolderid?: number;
  isfolder: boolean;
  name: string;
  size?: number;
  modtime?: number;
  contentType?: string;
  mimeype?: string; // yes, typo "mimeype" nyata di API v1 pCloud
  hash?: string;
}

export class PCloudProvider implements IStorageProvider {
  readonly providerId = 'pcloud' as const;
  private readonly host: string;

  constructor(
    private readonly accessToken: string,
    region: 'us' | 'eu' = 'us',
    private readonly fetchImpl: FetchLike = globalThis.fetch,
  ) {
    this.host = region === 'eu' ? 'https://eapi.pcloud.com' : 'https://api.pcloud.com';
  }

  private async call<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.host}/${endpoint}`);
    url.searchParams.set('access_token', this.accessToken);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await this.fetchImpl(url);
    if (!res.ok) throw new Error(`pCloud HTTP ${res.status}`);
    const data = (await res.json()) as { result: number; error?: string } & T;
    if (data.result !== 0) throw new Error(`pCloud API error: ${data.error ?? data.result}`);
    return data;
  }

  private toFile(entry: PCloudEntry, parentId: string | null): UniversalFileItem {
    const id = String(entry.fileid ?? entry.folderid ?? entry.id ?? entry.hash ?? '');
    return {
      id,
      name: entry.name,
      sizeBytes: entry.isfolder ? 0 : (entry.size ?? 0),
      mimeType: entry.isfolder ? 'folder' : (entry.contentType ?? entry.mimeype ?? 'application/octet-stream'),
      isFolder: entry.isfolder,
      parentId,
      modifiedAt: new Date((entry.modtime ?? 0) * 1000),
      provider: 'pcloud',
    };
  }

  async getQuota(): Promise<StorageQuota> {
    const d = await this.call<{ quota: number; usedquota: number }>('userinfo');
    const total = Number(d.quota) || 0;
    const used = Number(d.usedquota) || 0;
    return { totalBytes: total, usedBytes: used, freeBytes: Math.max(total - used, 0) };
  }

  async getIdentity(): Promise<AccountIdentity> {
    const d = await this.call<{ email: string; fullname?: string }>('userinfo');
    return { email: d.email, name: d.fullname };
  }

  async listFiles(folderPath = '/'): Promise<UniversalFileItem[]> {
    const path = /^\d+$/.test(folderPath) ? `/${folderPath}` : folderPath || '/';
    const d = await this.call<{ metadata: { contents?: PCloudEntry[]; folderid?: number } }>('list', {
      path,
      noDeleted: 'true',
    });
    const parentId = String(d.metadata.folderid ?? path);
    return (d.metadata.contents ?? []).map((e) => this.toFile(e, parentId));
  }

  async searchFiles(query: string): Promise<UniversalFileItem[]> {
    const d = await this.call<{ metadata: { items?: (PCloudEntry & { parentfolderid?: number })[] } }>('search', {
      pattern: sanitizeFileName(query),
      containpattern: 'filename',
      showdeleted: 'true',
    });
    return (d.metadata.items ?? []).map((e) => this.toFile(e, e.parentfolderid ? String(e.parentfolderid) : null));
  }

  async createFolder(name: string, parentFolderId = '/'): Promise<UniversalFileItem> {
    const d = await this.call<{ metadata: PCloudEntry }>('createfolder', {
      path: `${parentFolderId === '/root' ? '/' : parentFolderId}/${sanitizeFileName(name)}`,
      ifnotexists: 'false',
    });
    return this.toFile(d.metadata, parentFolderId);
  }

  async renameItem(itemId: string, newName: string): Promise<UniversalFileItem> {
    const params: Record<string, string> = { toname: sanitizeFileName(newName) };
    if (/^\d+$/.test(itemId)) params.folderid = itemId;
    else params.path = `/${itemId}`;
    const d = await this.call<{ metadata: PCloudEntry }>('renamefile', params);
    return this.toFile(d.metadata, null);
  }

  async deleteItem(itemId: string): Promise<boolean> {
    const params: Record<string, string> = /^\d+$/.test(itemId) ? { fileid: itemId } : { path: `/${itemId}` };
    await this.call('deletefile', params);
    return true;
  }

  async getDownloadStream(itemId: string): Promise<DownloadResult> {
    const params: Record<string, string> = /^\d+$/.test(itemId) ? { fileid: itemId } : { path: `/${itemId}` };
    const url = new URL(`${this.host}/getFile`);
    url.searchParams.set('access_token', this.accessToken);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await this.fetchImpl(url);
    if (!res.ok || !res.body) throw new Error(`pCloud download HTTP ${res.status}`);
    return {
      stream: res.body as unknown as NodeJS.ReadableStream,
      size: Number(res.headers.get('content-length') ?? 0) || 0,
      mimeType: res.headers.get('content-type') ?? 'application/octet-stream',
    };
  }

  /**
   * Multipart upload streaming: boundary + header + field dibuat sebagai string pendek,
   * byte berkas di-forward dari iterator sumber, trailer di akhir. Tak ada buffer utuh.
   */
  async uploadStream(
    fileName: string,
    stream: NodeJS.ReadableStream,
    parentFolderId = '/',
    _sizeBytes?: number,
  ): Promise<UniversalFileItem> {
    const boundary = `----nexusdrive${Date.now().toString(16)}`;
    const head =
      `--${boundary}\r\nContent-Disposition: form-data; name="filedata"; ` +
      `filename="${sanitizeFileName(fileName)}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const tail = `\r\n--${boundary}--\r\n`;

    const it = (stream as Readable)[Symbol.asyncIterator]();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(Buffer.from(head));
        for (;;) {
          const { value, done } = await it.next();
          if (done) break;
          controller.enqueue(value);
        }
        controller.enqueue(Buffer.from(tail));
        controller.close();
      },
    });

    const url = new URL(`${this.host}/uploadFile`);
    url.searchParams.set('access_token', this.accessToken);
    url.searchParams.set(
      /^\d+$/.test(parentFolderId) ? 'folderid' : 'path',
      /^\d+$/.test(parentFolderId) ? parentFolderId : (parentFolderId === '/root' ? '/' : parentFolderId),
    );
    url.searchParams.set('filename', sanitizeFileName(fileName));
    const res = await this.fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: body as never,
    });
    const data = (await res.json()) as { result: number; metadata?: { fileid?: number; name?: string } };
    if (data.result !== 0) throw new Error(`pCloud upload gagal: ${data.result}`);
    const meta = await this.call<{ metadata: PCloudEntry }>('getmeta', { fileid: String(data.metadata?.fileid ?? '') });
    return this.toFile(meta.metadata, parentFolderId);
  }
}
