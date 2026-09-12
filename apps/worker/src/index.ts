import { createTransferWorker } from './processors/crossCloudTransferProcessor.js';
import { createSyncWorker } from './processors/folderMirrorProcessor.js';

const transferWorker = createTransferWorker(Number(process.env.TRANSFER_CONCURRENCY ?? 2));
const syncWorker = createSyncWorker(Number(process.env.SYNC_CONCURRENCY ?? 1));

console.log('[worker] NexusDrive worker aktif: cross-cloud-transfers + folder-mirror-sync');

let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  console.log(`[worker] menerima ${signal}, menutup dengan rapi...`);
  await Promise.all([transferWorker.close(), syncWorker.close()]);
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

transferWorker.on('failed', (job, err) => {
  console.error(`[worker] transfer job ${job?.data.transferJobId} gagal:`, err.message);
});
syncWorker.on('failed', (job, err) => {
  console.error(`[worker] sync job ${job?.data.scheduleId} gagal:`, err.message);
});
