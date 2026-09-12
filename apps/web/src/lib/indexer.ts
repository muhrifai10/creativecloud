import { prisma } from "@nexusdrive/database";
import type { IStorageProvider, UniversalFileItem, CloudProviderId } from "@nexusdrive/core";

const MAX_ITEMS = 5000;

function ext(name: string): string | null {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : null;
}

/**
 * Sinkronkan daftar berkas provider ke tabel cache file_items (BFS dangkal).
 * Dipanggil awal oleh explorer (Fase 4) dan saat connect akun.
 */
export async function indexAccountFiles(
  provider: IStorageProvider,
  opts: { accountId: string; userId: string; rootFolderId?: string; maxDepth?: number },
): Promise<{ indexed: number }> {
  const maxDepth = opts.maxDepth ?? 1;
  let queue: { id: string; path: string; depth: number }[] = [
    { id: opts.rootFolderId ?? "root", path: "/Root", depth: 0 },
  ];
  let indexed = 0;

  while (queue.length && indexed < MAX_ITEMS) {
    const next: typeof queue = [];
    for (const folder of queue) {
      if (indexed >= MAX_ITEMS) break;
      let items: UniversalFileItem[];
      try {
        items = await provider.listFiles(folder.id);
      } catch {
        continue;
      }
      for (const item of items) {
        const path = `${folder.path}/${item.name}`;
        await prisma.fileItem.upsert({
          where: { accountId_providerFileId: { accountId: opts.accountId, providerFileId: item.id } },
          update: {
            name: item.name,
            sizeBytes: BigInt(item.sizeBytes),
            mimeType: item.mimeType,
            isFolder: item.isFolder,
            providerParentId: item.parentId,
            pathHierarchy: path,
            extension: ext(item.name),
            providerModifiedAt: item.modifiedAt,
            lastIndexedAt: new Date(),
          },
          create: {
            accountId: opts.accountId,
            userId: opts.userId,
            provider: item.provider as CloudProviderId,
            providerFileId: item.id,
            providerParentId: item.parentId,
            name: item.name,
            sizeBytes: BigInt(item.sizeBytes),
            mimeType: item.mimeType,
            isFolder: item.isFolder,
            pathHierarchy: path,
            extension: ext(item.name),
            providerModifiedAt: item.modifiedAt,
          },
        });
        indexed++;
        if (item.isFolder && folder.depth < maxDepth) {
          next.push({ id: item.id, path, depth: folder.depth + 1 });
        }
      }
    }
    queue = next;
  }
  return { indexed };
}
