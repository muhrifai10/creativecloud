import { Queue } from 'bullmq';

export const TRANSFER_QUEUE = 'cross-cloud-transfers';
export const SYNC_QUEUE = 'folder-mirror-sync';
export const TRANSFER_JOB_NAME = 'transfer';
export const SYNC_JOB_NAME = 'mirror';

export interface TransferJobData {
  transferJobId: string;
}

export interface SyncJobData {
  scheduleId: string;
}

export interface SyncRepeatOpts {
  pattern: string;
  every?: never;
}

export function redisUrl(): string {
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

function connection(): { url: string } {
  return { url: redisUrl() };
}

export function transferQueue(): Queue<TransferJobData> {
  return new Queue(TRANSFER_QUEUE, { connection: connection() });
}

export function syncQueue(): Queue<SyncJobData> {
  return new Queue(SYNC_QUEUE, { connection: connection() });
}

export async function closeQueues(...queues: Queue[]): Promise<void> {
  await Promise.all(queues.map((q) => q.close()));
}
