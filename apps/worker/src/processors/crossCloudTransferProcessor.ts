import { Worker, type Job } from 'bullmq';
import { Transform } from 'node:stream';
import { prisma } from '@nexusdrive/database';
import { getProviderForAccount as defaultResolve } from '@nexusdrive/database/vault';
import { TRANSFER_QUEUE, redisUrl, type TransferJobData } from '@nexusdrive/core/queues';
import type { IStorageProvider, UniversalFileItem } from '@nexusdrive/core';

class CancelledError extends Error {}

type Resolver = (accountId: string, userId: string) => Promise<IStorageProvider>;
let resolveProvider: Resolver = defaultResolve;

/** Test seam: worker memakai resolver nyata di produksi; tes boleh injeksi fake. */
export function setProviderResolver(r: Resolver): void {
  resolveProvider = r;
}

async function setJob(id: string, data: Record<string, unknown>) {
  await prisma.transferJob.update({ where: { id }, data });
}

export async function processTransfer(job: Job<TransferJobData>) {
  const { transferJobId } = job.data;
  const row = await prisma.transferJob.findUnique({ where: { id: transferJobId } });
  if (!row) return;
  if (row.status === 'cancelled') return;
  if (row.status === 'completed') return;

  await setJob(transferJobId, { status: 'processing', startedAt: new Date(), bullmqJobId: job.id ?? null });

  const source = await resolveProvider(row.sourceAccountId, row.userId);
  const target = await resolveProvider(row.targetAccountId, row.userId);

  const { stream, size } = await source.getDownloadStream(row.sourceFileId);
  const total = Number(row.sourceFileSize) || size;

  let transferred = 0;
  let lastPct = 0;
  let lastCheck = Date.now();

  const progress = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      transferred += chunk.length;
      const pct = total > 0 ? Math.min(Math.floor((transferred / total) * 100), 100) : 0;

      const now = Date.now();
      if (pct >= lastPct + 5 || now - lastCheck > 2000) {
        lastPct = pct;
        lastCheck = now;
        // deteksi pembatalan dari DB (single source of truth) + simpan progres
        void (async () => {
          const cur = await prisma.transferJob.findUnique({
            where: { id: transferJobId },
            select: { status: true },
          });
          if (cur?.status === 'cancelled') {
            cb(new CancelledError('cancelled'));
            return;
          }
          await setJob(transferJobId, { progressPercentage: pct, bytesTransferred: BigInt(transferred) });
          cb(null, chunk);
        })().catch(cb);
        return;
      }
      cb(null, chunk);
    },
  });

  let item: UniversalFileItem;
  try {
    stream.pipe(progress);
    const wrapped = progress;
    item = await target.uploadStream(row.sourceFileName, wrapped, row.targetFolderId, total || undefined);
  } catch (e) {
    if (e instanceof CancelledError) {
      await setJob(transferJobId, { status: 'cancelled', errorMessage: 'Dibatalkan pengguna' });
      return;
    }
    throw e;
  }

  await prisma.fileItem.upsert({
    where: { accountId_providerFileId: { accountId: row.targetAccountId, providerFileId: item.id } },
    update: { name: item.name, sizeBytes: BigInt(item.sizeBytes) },
    create: {
      accountId: row.targetAccountId,
      userId: row.userId,
      provider: item.provider,
      providerFileId: item.id,
      providerParentId: row.targetFolderId,
      name: item.name,
      sizeBytes: BigInt(item.sizeBytes),
      mimeType: item.mimeType,
      isFolder: false,
      pathHierarchy: `${row.targetFolderId}/${item.name}`,
    },
  });

  await setJob(transferJobId, {
    status: 'completed',
    progressPercentage: 100,
    bytesTransferred: BigInt(transferred || total),
    completedAt: new Date(),
  });
}

export function createTransferWorker(concurrency = 2): Worker<TransferJobData> {
  return new Worker<TransferJobData>(TRANSFER_QUEUE, processTransfer, {
    connection: { url: redisUrl() },
    concurrency,
  });
}
