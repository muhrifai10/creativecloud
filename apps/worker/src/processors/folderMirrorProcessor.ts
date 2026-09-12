import { Worker, type Job } from 'bullmq';
import { prisma } from '@nexusdrive/database';
import { getProviderForAccount as defaultResolve } from '@nexusdrive/database/vault';
import {
  SYNC_QUEUE,
  redisUrl,
  transferQueue,
  TRANSFER_JOB_NAME,
  type SyncJobData,
  type TransferJobData,
} from '@nexusdrive/core/queues';
import type { IStorageProvider, UniversalFileItem } from '@nexusdrive/core';

type Resolver = (accountId: string, userId: string) => Promise<IStorageProvider>;
let resolveProvider: Resolver = defaultResolve;
export function setProviderResolver(r: Resolver): void {
  resolveProvider = r;
}

interface Snapshot {
  item: UniversalFileItem;
  relPath: string;
}

/** Kumpulkan semua berkas di bawah folder (BFS, batas kedalaman). */
async function snapshotTree(provider: IStorageProvider, rootId: string, maxDepth = 3): Promise<Map<string, Snapshot>> {
  const out = new Map<string, Snapshot>();
  let frontier: { id: string; prefix: string; depth: number }[] = [{ id: rootId, prefix: '', depth: 0 }];
  while (frontier.length) {
    const next: typeof frontier = [];
    for (const f of frontier) {
      let items: UniversalFileItem[];
      try {
        items = await provider.listFiles(f.id);
      } catch {
        continue;
      }
      for (const it of items) {
        const rel = `${f.prefix}/${it.name}`;
        if (it.isFolder) {
          if (f.depth < maxDepth) next.push({ id: it.id, prefix: rel, depth: f.depth + 1 });
        } else {
          out.set(rel, { item: it, relPath: rel });
        }
      }
    }
    frontier = next;
  }
  return out;
}

export async function processSync(job: Job<SyncJobData>) {
  const { scheduleId } = job.data;
  const schedule = await prisma.syncSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || !schedule.isActive) return;

  const source = await resolveProvider(schedule.sourceAccountId, schedule.userId);
  const target = await resolveProvider(schedule.targetAccountId, schedule.userId);

  const [srcTree, dstTree] = await Promise.all([
    snapshotTree(source, schedule.sourceFolderId),
    snapshotTree(target, schedule.targetFolderId),
  ]);

  const tqueue = transferQueue();
  let enqueued = 0;
  for (const [rel, snap] of srcTree) {
    const existing = dstTree.get(rel);
    const stale =
      !existing ||
      (schedule.syncDirection !== 'one_way' &&
        snap.item.modifiedAt.getTime() > (existing.item.modifiedAt?.getTime() ?? 0));
    if (existing && !stale) continue;

    // cegah duplikat job pending untuk file yang sama
    const dup = await prisma.transferJob.findFirst({
      where: {
        sourceAccountId: schedule.sourceAccountId,
        sourceFileId: snap.item.id,
        targetAccountId: schedule.targetAccountId,
        status: { in: ['pending', 'processing'] },
      },
    });
    if (dup) continue;

    const created = await prisma.transferJob.create({
      data: {
        userId: schedule.userId,
        sourceAccountId: schedule.sourceAccountId,
        sourceFileId: snap.item.id,
        sourceFileName: snap.item.name,
        sourceFileSize: BigInt(snap.item.sizeBytes),
        targetAccountId: schedule.targetAccountId,
        // tuju folder induk relatif yang sama di sisi target (root schedule bila belum ada)
        targetFolderId: schedule.targetFolderId,
        status: 'pending',
      },
    });

    await tqueue.add(
      TRANSFER_JOB_NAME,
      { transferJobId: created.id } satisfies TransferJobData,
      { jobId: created.id, attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
    );
    enqueued++;
  }

  await prisma.syncSchedule.update({
    where: { id: scheduleId },
    data: { lastRunAt: new Date() },
  });

  return { enqueued, sourceFiles: srcTree.size, targetFiles: dstTree.size };
}

export function createSyncWorker(concurrency = 1): Worker<SyncJobData> {
  return new Worker<SyncJobData>(SYNC_QUEUE, processSync, {
    connection: { url: redisUrl() },
    concurrency,
  });
}
