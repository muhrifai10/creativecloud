import { Readable } from 'node:stream';
import { PrismaClient } from '@prisma/client';
import { Worker, Queue } from 'bullmq';
import { TRANSFER_QUEUE, redisUrl, type TransferJobData } from '@nexusdrive/core/queues';
import type { IStorageProvider, UniversalFileItem } from '@nexusdrive/core';
import { processTransfer, setProviderResolver } from '../src/processors/crossCloudTransferProcessor.js';
import { processSync, setProviderResolver as setSyncResolver } from '../src/processors/folderMirrorProcessor.js';

const prisma = new PrismaClient();
const SIZE = 100 * 1024 * 1024;
const URL = redisUrl();

function assert(c: boolean, m: string) {
  if (!c) {
    console.error(`GAGAL: ${m}`);
    process.exitCode = 1;
    throw new Error(m);
  }
  console.log(`OK: ${m}`);
}

function item(id: string, name: string): UniversalFileItem {
  return { id, name, sizeBytes: SIZE, mimeType: 'application/octet-stream', isFolder: false, parentId: null, modifiedAt: new Date(), provider: 'dropbox' };
}

const base = {
  getQuota: async () => ({ totalBytes: 0, usedBytes: 0, freeBytes: 0 }),
  getIdentity: async () => ({ email: 'x' }),
  listFiles: async () => [],
  searchFiles: async () => [],
  createFolder: async () => item('f', 'f'),
  renameItem: async () => item('r', 'r'),
  deleteItem: async () => true,
  getDownloadStream: async () => ({ stream: Readable.from([]), size: 0, mimeType: '' }),
  uploadStream: async () => item('u', 'u'),
} as unknown as IStorageProvider;

function makeSource(chunkBytes: number, gapMs: number): IStorageProvider {
  return {
    ...base,
    providerId: 'dropbox',
    getDownloadStream: async () => {
      // push terjadwal agar event loop tetap jalan (cek pembatalan bisa terjadi)
      let sent = 0;
      let scheduled = false;
      let ended = false;
      const schedule = () => {
        if (scheduled) return;
        if (sent >= SIZE) {
          if (!ended) {
            ended = true;
            stream.push(null);
          }
          return;
        }
        scheduled = true;
        if (gapMs) setTimeout(tick, gapMs);
        else setImmediate(tick);
      };
      const tick = () => {
        scheduled = false;
        if (sent >= SIZE) {
          stream.push(null);
          return;
        }
        const take = Math.min(chunkBytes, SIZE - sent);
        sent += take;
        if (stream.push(Buffer.alloc(take))) schedule(); // buffer lega: lanjut
        // jika push() false, read() akan memanggil schedule() lagi (backpressure)
      };
      const stream = new Readable({ read: schedule });
      schedule();
      return { stream, size: SIZE, mimeType: 'application/octet-stream' };
    },
  };
}

const received = { total: 0 };
const makeTarget = (): IStorageProvider => ({
  ...base,
  providerId: 'google_drive',
  uploadStream: async (name, stream) => {
    received.total = 0;
    for await (const c of stream as AsyncIterable<Buffer>) received.total += c.length;
    return item('tgt-1', name);
  },
});

async function main() {
  // residu dari run yang crash sebelumnya
  await prisma.transferJob.deleteMany({ where: { sourceFileName: 'master-4k.mov' } });
  await prisma.connectedAccount.deleteMany({ where: { accountEmail: { endsWith: '@f.test' } } });

  const user = await prisma.user.findUnique({ where: { email: 'demo@nexusdrive.test' } });
  assert(!!user, 'user demo ada (seed dulu)');

  const [srcAcc, dstAcc] = await Promise.all([
    prisma.connectedAccount.create({ data: { userId: user!.id, provider: 'dropbox', accountEmail: `src-${Date.now()}@f.test` } }),
    prisma.connectedAccount.create({ data: { userId: user!.id, provider: 'google_drive', accountEmail: `dst-${Date.now()}@f.test` } }),
  ]);

  const fast = new Map<string, IStorageProvider>();
  fast.set(srcAcc.id, makeSource(1024 * 1024, 0));
  fast.set(dstAcc.id, makeTarget());
  setProviderResolver(async (id) => {
    const p = fast.get(id);
    if (!p) throw new Error('no fake');
    return p;
  });

  const mkJob = (fileId: string) =>
    prisma.transferJob.create({
      data: {
        userId: user!.id, sourceAccountId: srcAcc.id, sourceFileId: fileId, sourceFileName: 'master-4k.mov',
        sourceFileSize: BigInt(SIZE), targetAccountId: dstAcc.id, targetFolderId: 'root', status: 'pending',
      },
    });

  const worker = new Worker<TransferJobData>(TRANSFER_QUEUE, processTransfer, {
    connection: { url: URL },
    concurrency: 1,
    stalledInterval: 5_000,
    maxStalledCount: 0,
  });
  const queue = new Queue<TransferJobData>(TRANSFER_QUEUE, { connection: { url: URL } });
  // bersih dari sisa run sebelumnya yang crash
  try {
    await queue.obliterate({ force: true });
  } catch {
    /* queue belum ada */
  }

  // --- transfer sukses 100MB ---
  const job1 = await mkJob('SRC1');
  const statuses = new Set<string>();
  const poll = setInterval(() => {
    void prisma.transferJob.findUnique({ where: { id: job1.id }, select: { status: true } }).then((r: { status: string } | null) => r && statuses.add(r.status));
  }, 25);
  await queue.add('transfer', { transferJobId: job1.id }, { jobId: job1.id });
  await new Promise<void>((res, rej) => {
    worker.on('completed', (j) => j.data.transferJobId === job1.id && res());
    worker.on('failed', (j, e) => j?.data.transferJobId === job1.id && rej(e));
    setTimeout(() => rej(new Error('timeout')), 60_000);
  });
  clearInterval(poll);
  const f1 = await prisma.transferJob.findUnique({ where: { id: job1.id } });
  assert(f1?.status === 'completed', `status akhir completed (dapat ${f1?.status})`);
  assert(received.total === SIZE, `target menerima 100MB utuh (${received.total})`);
  assert(f1?.bytesTransferred === BigInt(SIZE), 'bytesTransferred = 100MB');
  assert(f1?.progressPercentage === 100, 'progress 100%');
  assert(statuses.has('processing'), `transisi pending->processing->completed (${[...statuses].join('->')})`);

  // --- pembatalan saat berjalan ---
  const slow = new Map<string, IStorageProvider>();
  slow.set(srcAcc.id, makeSource(4 * 1024 * 1024, 8));
  slow.set(dstAcc.id, makeTarget());
  setProviderResolver(async (id) => {
    const p = slow.get(id);
    if (!p) throw new Error('no fake');
    return p;
  });
  const job2 = await mkJob('SRC2');
  await queue.add('transfer', { transferJobId: job2.id }, { jobId: job2.id });
  await new Promise((r) => setTimeout(r, 300));
  await prisma.transferJob.update({ where: { id: job2.id }, data: { status: 'cancelled' } });
  await new Promise<void>((res, rej) => {
    worker.on('completed', (j) => j.data.transferJobId === job2.id && res());
    worker.on('failed', (j, e) => j?.data.transferJobId === job2.id && rej(e));
    setTimeout(() => rej(new Error('cancel timeout')), 60_000);
  });
  const f2 = await prisma.transferJob.findUnique({ where: { id: job2.id } });
  assert(f2?.status === 'cancelled', `job dibatalkan (status ${f2?.status})`);

  // --- uji folder-mirror-sync: diff tree sumber vs tujuan ---
  const srcTreeProvider: IStorageProvider = {
    ...base,
    providerId: 'dropbox',
    listFiles: async (folderId = 'root') => {
      if (folderId === 'root')
        return [
          { id: 'rf1', name: 'report.pdf', sizeBytes: 10, mimeType: 'application/pdf', isFolder: false, parentId: 'root', modifiedAt: new Date(), provider: 'dropbox' },
          { id: 'rfdir', name: 'sub', sizeBytes: 0, mimeType: 'folder', isFolder: true, parentId: 'root', modifiedAt: new Date(), provider: 'dropbox' },
        ];
      return [
        { id: 'sf1', name: 'deep.mp4', sizeBytes: 20, mimeType: 'video/mp4', isFolder: false, parentId: 'rfdir', modifiedAt: new Date(), provider: 'dropbox' },
      ];
    },
  };
  const dstTreeProvider: IStorageProvider = {
    ...base,
    providerId: 'google_drive',
    // target sudah punya /report.pdf tapi belum punya sub/deep.mp4
    listFiles: async () => [
      { id: 't1', name: 'report.pdf', sizeBytes: 10, mimeType: 'application/pdf', isFolder: false, parentId: 'root', modifiedAt: new Date(), provider: 'google_drive' },
    ],
  };
  const treeMap = new Map<string, IStorageProvider>();
  treeMap.set(srcAcc.id, srcTreeProvider);
  treeMap.set(dstAcc.id, dstTreeProvider);
  setSyncResolver(async (id) => {
    const p = treeMap.get(id);
    if (!p) throw new Error('no fake');
    return p;
  });

  const schedule = await prisma.syncSchedule.create({
    data: {
      userId: user!.id, sourceAccountId: srcAcc.id, sourceFolderId: 'root',
      targetAccountId: dstAcc.id, targetFolderId: 'root', syncDirection: 'mirror', cronExpression: '0 2 * * *',
    },
  });
  const syncResult = (await processSync({ data: { scheduleId: schedule.id } } as never)) as { enqueued: number; sourceFiles: number; targetFiles: number };
  assert(syncResult.enqueued === 1, `mirror menyalakan 1 transfer untuk file yang belum ada di target (dapat ${syncResult.enqueued})`);
  assert((await prisma.transferJob.count({ where: { targetFolderId: 'root', status: 'pending' } })) >= 1, 'baris transfer mirror tersimpan pending');

  await queue.drain();
  await queue.close();
  await worker.close();
  await prisma.transferJob.deleteMany({ where: { userId: user!.id } });
  await prisma.syncSchedule.deleteMany({ where: { id: schedule.id } });
  await prisma.connectedAccount.deleteMany({ where: { id: { in: [srcAcc.id, dstAcc.id] } } });
  console.log('VERIFIKASI FASE 5 (BULLMQ WORKER) LOLOS');
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
