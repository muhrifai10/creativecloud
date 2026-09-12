import { Storage } from 'megajs';
import { Readable } from 'node:stream';
import {
  sanitizeFileName,
  type AccountIdentity,
  type DownloadResult,
  type IStorageProvider,
  type StorageQuota,
  type UniversalFileItem,
} from './base.interface';

type MegaNode = Storage['root'];

function idOf(drive: Storage, node: MegaNode): string {
  for (const [id, file] of Object.entries(drive.files)) {
    if (file === node) return id;
  }
  return '0';
}

function toFile(drive: Storage, node: MegaNode): UniversalFileItem {
  return {
    id: idOf(drive, node),
    name: node.name ?? '',
    sizeBytes: node.directory ? 0 : (node.size ?? 0),
    mimeType: node.directory ? 'folder' : 'application/octet-stream',
    isFolder: node.directory,
    parentId: node.parent ? idOf(drive, node.parent as MegaNode) : '0',
    modifiedAt: new Date((node.timestamp ?? 0) * 1000),
    provider: 'mega',
  };
}

export class MegaProvider implements IStorageProvider {
  readonly providerId = 'mega' as const;
  private nodesLoaded = false;

  constructor(
    private readonly drive: Storage,
    private readonly accountEmail: string = '',
  ) {}

  /**
   * Login MEGA tanpa autoload.
   * autoload: true mengunduh SEMUA pohon file sebelum login selesai -> sangat lambat untuk akun besar.
   */
  static async login(email: string, password: string): Promise<MegaProvider> {
    const storage = new Storage({ email, password });
    await storage.login();
    return new MegaProvider(storage, email);
  }

  private async ensureNodes(): Promise<void> {
    if (!this.nodesLoaded) {
      await this.drive.reload();
      this.nodesLoaded = true;
    }
  }

  async getQuota(): Promise<StorageQuota> {
    const info = await this.drive.getAccountInfo();
    const total = Number(info.spaceTotal) || 0;
    const used = Number(info.spaceUsed) || 0;
    return { totalBytes: total, usedBytes: used, freeBytes: Math.max(total - used, 0) };
  }

  async getIdentity(): Promise<AccountIdentity> {
    return { email: this.accountEmail || this.drive.email };
  }

  private async resolveFolder(folderId?: string): Promise<MegaNode> {
    await this.ensureNodes();
    if (!folderId || folderId === 'root' || folderId === '0') return this.drive.root;
    const node = this.drive.files[folderId];
    if (!node) throw new Error('Folder MEGA tidak ditemukan.');
    return node;
  }

  async listFiles(folderId?: string): Promise<UniversalFileItem[]> {
    const parent = await this.resolveFolder(folderId);
    return (parent.children ?? []).map((n) => toFile(this.drive, n));
  }

  async searchFiles(query: string): Promise<UniversalFileItem[]> {
    await this.ensureNodes();
    const needle = query.toLowerCase();
    return this.drive
      .filter((f) => (f.name ?? '').toLowerCase().includes(needle))
      .slice(0, 200)
      .map((n) => toFile(this.drive, n));
  }

  async createFolder(name: string, parentFolderId?: string): Promise<UniversalFileItem> {
    const parent = await this.resolveFolder(parentFolderId);
    const folder = await parent.mkdir(sanitizeFileName(name));
    return toFile(this.drive, folder);
  }

  async renameItem(itemId: string, newName: string): Promise<UniversalFileItem> {
    await this.ensureNodes();
    const node = this.drive.files[itemId];
    if (!node) throw new Error('Item MEGA tidak ditemukan.');
    await node.rename(sanitizeFileName(newName));
    return toFile(this.drive, node);
  }

  async deleteItem(itemId: string): Promise<boolean> {
    await this.ensureNodes();
    const node = this.drive.files[itemId];
    if (!node) return false;
    await node.delete(false);
    return true;
  }

  async getDownloadStream(itemId: string): Promise<DownloadResult> {
    await this.ensureNodes();
    const node = this.drive.files[itemId];
    if (!node) throw new Error('Berkas MEGA tidak ditemukan.');
    return { stream: node.download({}), size: node.size ?? 0, mimeType: 'application/octet-stream' };
  }

  /** Menghasilkan tautan publik resmi dari MEGA (https://mega.nz/file/...) */
  async getShareLink(itemId: string): Promise<string> {
    await this.ensureNodes();
    const node = this.drive.files[itemId];
    if (!node) throw new Error('Berkas MEGA tidak ditemukan.');
    const link = await node.link({});
    return link;
  }

  /**
   * Upload stream ke MEGA.
   * megajs parent.upload(...) mengembalikan Writable stream yang memiliki properti `.complete` (Promise).
   */
  async uploadStream(
    fileName: string,
    stream: NodeJS.ReadableStream,
    parentFolderId?: string,
    sizeBytes?: number,
  ): Promise<UniversalFileItem> {
    const parent = await this.resolveFolder(parentFolderId);
    const name = sanitizeFileName(fileName);

    const uploadStream = (parent.upload as (opts: unknown) => unknown)({
      name,
      size: typeof sizeBytes === 'number' && sizeBytes > 0 ? sizeBytes : undefined,
      allowUploadBuffering: true,
    });

    const nodeStream = stream instanceof Readable
      ? stream
      : Readable.fromWeb(stream as unknown as import('node:stream/web').ReadableStream);

    nodeStream.pipe(uploadStream as unknown as NodeJS.WritableStream);

    // Tunggu upload selesai: uploadStream.complete adalah Promise dari megajs
    const uploaded = await (
      (uploadStream as { complete?: Promise<unknown> }).complete ??
      new Promise((resolve, reject) => {
        (uploadStream as unknown as NodeJS.EventEmitter).on('finish', resolve);
        (uploadStream as unknown as NodeJS.EventEmitter).on('error', reject);
      })
    );

    const targetNode =
      (uploaded as MegaNode) ??
      parent.children?.find((c) => !c.directory && c.name === name);

    if (!targetNode) throw new Error('MEGA tidak mengonfirmasi berkas terunggah.');
    return toFile(this.drive, targetNode);
  }
}
