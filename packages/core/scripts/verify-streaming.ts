import { Readable, Writable } from 'node:stream';
import { HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { getR2Client, uploadStreamToR2, getR2Stream, deleteR2Object } from '../src/r2/client';

const SIZE = 50 * 1024 * 1024;
const BUCKET = process.env.R2_TEMP_BUCKET || 'nexusdrive-temp-buffer';

async function ensureBucket() {
  const client = getR2Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    try {
      await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    } catch (e) {
      console.log('bucket sudah ada / dibuat:', (e as Error).message);
    }
  }
}

function generator(total: number, chunk = 64 * 1024): Readable {
  let sent = 0;
  return new Readable({
    read() {
      if (sent >= total) return void this.push(null);
      const take = Math.min(chunk, total - sent);
      this.push(Buffer.alloc(take, (sent >>> 16) & 0xff));
      sent += take;
    },
  });
}

async function measure<T>(fn: () => Promise<T>): Promise<{ result: T; peakHeapMB: number; peakRssMB: number }> {
  let peakHeap = 0;
  let peakRss = 0;
  const timer = setInterval(() => {
    const m = process.memoryUsage();
    peakHeap = Math.max(peakHeap, m.heapUsed);
    peakRss = Math.max(peakRss, m.rss);
  }, 5);
  const result = await fn();
  clearInterval(timer);
  return { result, peakHeapMB: peakHeap / 1024 / 1024, peakRssMB: peakRss / 1024 / 1024 };
}

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`GAGAL: ${msg}`);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log(`OK: ${msg}`);
}

async function main() {
  await ensureBucket();
  const key = `streamtest/${Date.now()}.bin`;

  const up = await measure(() => uploadStreamToR2(key, generator(SIZE), { bucket: BUCKET, partSizeMB: 5 }));
  console.log(`   upload 50MB peak heap=${up.peakHeapMB.toFixed(1)}MB rss=${up.peakRssMB.toFixed(1)}MB`);
  assert(up.peakHeapMB < 120, `heap upload < 120MB (tercapai ${up.peakHeapMB.toFixed(1)}MB)`);

  const down = await measure(async () => {
    const { stream, size } = await getR2Stream(key, { bucket: BUCKET });
    let received = 0;
    await new Promise<void>((resolve, reject) => {
      const sink = new Writable({
        write(chunk: Buffer, _e, cb) { received += chunk.length; cb(); },
      });
      sink.on('finish', resolve).on('error', reject);
      stream.pipe(sink);
    });
    return { received, size };
  });
  console.log(`   download 50MB peak heap=${down.peakHeapMB.toFixed(1)}MB rss=${down.peakRssMB.toFixed(1)}MB`);
  assert(down.result.received === SIZE, `seluruh ${SIZE} byte diterima utuh (terima ${down.result.received})`);
  assert(down.result.size === SIZE, `Content-Length R2 = 50MB`);
  assert(down.peakHeapMB < 120, `heap download < 120MB (tercapai ${down.peakHeapMB.toFixed(1)}MB)`);

  await deleteR2Object(key, { bucket: BUCKET });
  console.log('VERIFIKASI FASE 3 STREAMING LOLOS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
