import { S3Client, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface R2Config {
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

export function r2ConfigFromEnv(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? '';
  if (!accessKeyId || !secretAccessKey) throw new Error('R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY belum diatur.');
  return {
    endpoint: endpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
    region: process.env.R2_REGION || 'auto',
    accessKeyId,
    secretAccessKey,
    forcePathStyle: Boolean(endpoint),
  };
}

let clientSingleton: S3Client | null = null;

export function getR2Client(cfg: R2Config = r2ConfigFromEnv()): S3Client {
  if (clientSingleton) return clientSingleton;
  clientSingleton = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: cfg.forcePathStyle,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  return clientSingleton;
}

export function resetR2Client(): void {
  clientSingleton = null;
}

export const TEMP_BUCKET = (): string => process.env.R2_TEMP_BUCKET ?? 'nexusdrive-temp-buffer';

export type Body = Readable | NodeJS.ReadableStream | ReadableStream<Uint8Array> | Buffer;

function toNode(body: Body): Readable {
  if (body instanceof Readable) return body;
  if (body instanceof ReadableStream) return Readable.fromWeb(body as import('node:stream/web').ReadableStream);
  return Readable.from(body as Buffer);
}

/**
 * Streaming multipart upload ke R2 buffer. Hanya part (default 8MB) yang ada di RAM
 * pada satu waktu, bukan berkas utuh.
 */
export async function uploadStreamToR2(
  key: string,
  source: Body,
  opts: { client?: S3Client; bucket?: string; partSizeMB?: number } = {},
): Promise<{ bucket: string; key: string }> {
  const bucket = opts.bucket ?? TEMP_BUCKET();
  const client = opts.client ?? getR2Client();
  const upload = new Upload({
    client,
    params: { Bucket: bucket, Key: key, Body: toNode(source) },
    partSize: (opts.partSizeMB ?? 8) * 1024 * 1024,
    queueSize: 4,
    leavePartsOnError: false,
  });
  await upload.done();
  return { bucket, key };
}

/** Body objek R2 sebagai Node Readable (streaming, tidak menumpuk di RAM). */
export async function getR2Stream(
  key: string,
  opts: { client?: S3Client; bucket?: string } = {},
): Promise<{ stream: Readable; size: number }> {
  const bucket = opts.bucket ?? TEMP_BUCKET();
  const client = opts.client ?? getR2Client();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = toNode(res.Body as Body);
  return { stream: body, size: Number(res.ContentLength ?? 0) };
}

export async function r2ObjectSize(key: string, client = getR2Client(), bucket = TEMP_BUCKET()): Promise<number> {
  const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return Number(res.ContentLength ?? 0);
}

export async function deleteR2Object(
  key: string,
  opts: { client?: S3Client; bucket?: string } = {},
): Promise<void> {
  const bucket = opts.bucket ?? TEMP_BUCKET();
  const client = opts.client ?? getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Buffer-then-forward: stream in -> R2 -> stream out ke sink -> purge buffer.
 * Di Fase 3 jalur ini sinkron; Fase 5 memindahkan tahap forward ke BullMQ worker.
 */
export async function bufferAndForward(
  key: string,
  incoming: Body,
  forward: (fromR2: Readable) => Promise<unknown>,
  opts: { client?: S3Client; bucket?: string; partSizeMB?: number } = {},
): Promise<{ bufferPurged: true }> {
  const bucket = opts.bucket ?? TEMP_BUCKET();
  await uploadStreamToR2(key, incoming, { ...opts, bucket });
  const { stream } = await getR2Stream(key, { client: opts.client, bucket });
  try {
    await forward(stream);
  } finally {
    await deleteR2Object(key, { client: opts.client, bucket });
  }
  return { bufferPurged: true };
}

export async function pipeThroughFile(
  source: Body,
  dest: NodeJS.WritableStream,
): Promise<void> {
  await pipeline(toNode(source), dest);
}
