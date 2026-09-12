import { Readable } from 'node:stream';

/**
 * Ambil byte mentah dari stream secara berurutan tanpa menahan seluruh berkas.
 * Mengembalikan Buffer berukuran max `size` (bisa lebih kecil saat stream habis),
 * atau null saat stream selesai. Buffer sebelumnya dapat dibuang pemanggil.
 */
export async function readUpTo(
  iterator: AsyncIterator<Uint8Array>,
  size: number,
): Promise<{ chunk: Buffer; done: boolean } | null> {
  const parts: Uint8Array[] = [];
  let total = 0;
  while (total < size) {
    const { value, done } = await iterator.next();
    if (done) break;
    parts.push(value);
    total += value.length;
  }
  if (total === 0 && parts.length === 0) return null;
  return { chunk: Buffer.concat(parts.map((p) => Buffer.from(p)), total), done: total < size };
}

export function asAsyncIterator(source: NodeJS.ReadableStream | ReadableStream<Uint8Array>): AsyncIterator<Uint8Array> {
  if (source instanceof ReadableStream) {
    return source.getReader() as unknown as AsyncIterator<Uint8Array>;
  }
  return (source as Readable)[Symbol.asyncIterator]();
}

export function webToNode(stream: ReadableStream<Uint8Array>): Readable {
  return Readable.fromWeb(stream as import('node:stream/web').ReadableStream);
}
