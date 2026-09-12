import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import { GoogleDriveProvider } from '../src/providers/google-drive';
import { DropboxProvider } from '../src/providers/dropbox';
import { OneDriveProvider } from '../src/providers/onedrive';
import { MegaProvider } from '../src/providers/mega';
import { PCloudProvider } from '../src/providers/pcloud';
import { isAllowedProviderUrl, assertAllowedProviderUrl } from '../src/security/ssrf';

function makeStream(bytes: number, chunkSize = 1 << 16): Readable {
  let sent = 0;
  return new Readable({
    read() {
      if (sent >= bytes) {
        this.push(null);
        return;
      }
      const take = Math.min(chunkSize, bytes - sent);
      this.push(Buffer.alloc(take, (sent / chunkSize) % 251));
      sent += take;
    },
  });
}

async function drain(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of stream as AsyncIterable<Buffer>) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

describe('Google Drive stream', () => {
  it('uploadStream meneruskan body ke media.files.create', async () => {
    let received = 0;
    const fakeDrive = {
      files: {
        create: async ({ media }: { media: { body: NodeJS.ReadableStream } }) => {
          for await (const c of media.body as AsyncIterable<Buffer>) received += c.length;
          return { data: { id: 'new1', name: 'x.bin', size: String(received), mimeType: 'application/octet-stream', parents: ['root'], modifiedTime: '2026-01-01T00:00:00Z' } };
        },
      },
    };
    const item = await new GoogleDriveProvider(fakeDrive as never).uploadStream('x.bin', makeStream(100_000));
    expect(item).toMatchObject({ id: 'new1', sizeBytes: 100_000, provider: 'google_drive' });
  });

  it('getDownloadStream mengembalikan stream berkas', async () => {
    const fakeDrive = {
      files: {
        get: async (args: { alt?: string }) =>
          args.alt === 'media'
            ? { data: Readable.from([Buffer.from('halo dunia')]) }
            : { data: { size: '11', mimeType: 'text/plain' } },
      },
    };
    const r = await new GoogleDriveProvider(fakeDrive as never).getDownloadStream('f1');
    expect(r.size).toBe(11);
    expect((await drain(r.stream)).toString()).toBe('halo dunia');
  });
});

describe('Dropbox chunked session upload', () => {
  it('merakit seluruh byte via start/append/finish', async () => {
    let total = 0;
    let finished = false;
    const fakeDbx = {
      filesUploadSessionStart: async () => ({ result: { session_id: 's1' } }),
      filesUploadSessionAppendV2: async ({ body }: { body: Buffer }) => { total += body.length; },
      filesUploadSessionFinish: async ({ body }: { body?: Buffer }) => {
        total += body?.length ?? 0;
        finished = true;
        return { result: { '.tag': 'file', name: 'big.bin', path_lower: '/big.bin', path_display: '/big.bin', size: total } };
      },
    };
    const item = await new DropboxProvider(fakeDbx as never).uploadStream('big.bin', makeStream(3_000_000, 1 << 20), '/', undefined, 1_000_000);
    expect(finished).toBe(true);
    expect(total).toBe(3_000_000);
    expect(item.sizeBytes).toBe(3_000_000);
  });

  it('berkas kecil (satu part) langsung finish', async () => {
    let appended = 0;
    const fakeDbx = {
      filesUploadSessionStart: async () => ({ result: { session_id: 's' } }),
      filesUploadSessionAppendV2: async () => { appended++; },
      filesUploadSessionFinish: async ({ body }: { body?: Buffer }) => ({
        result: { '.tag': 'file', name: 'k', path_lower: '/k', size: body?.length ?? 0 },
      }),
    };
    const item = await new DropboxProvider(fakeDbx as never).uploadStream('k', makeStream(50), '/', undefined, 1_000_000);
    expect(appended).toBe(0);
    expect(item.sizeBytes).toBe(50);
  });
});

describe('OneDrive upload session', () => {
  it('PUT per-range menyusun ulang byte utuh', async () => {
    const ranges: string[] = [];
    let received = Buffer.alloc(0);
    const fetchImpl = async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('createUploadSession')) {
        return new Response(JSON.stringify({ uploadUrl: 'https://upload.test/sess' }), { status: 200 });
      }
      if (u === 'https://upload.test/sess' && init?.method === 'PUT') {
        ranges.push(String((init.headers as Record<string, string>)?.['Content-Range']));
        received = Buffer.concat([received, Buffer.from(init.body as Uint8Array)]);
        const isLast = ranges.length >= Math.ceil(received.length / 1_000_000) && (ranges[ranges.length - 1] as string).includes('-');
        void isLast;
        if (received.length === 2_500_000) {
          return new Response(JSON.stringify({ id: 'item1', name: 'clip.mov', size: received.length }), { status: 201 });
        }
        return new Response(JSON.stringify({}), { status: 202 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    };
    const item = await new OneDriveProvider('tok', fetchImpl as unknown as typeof fetch).uploadStream('clip.mov', makeStream(2_500_000, 1_024_000), 'root', undefined, 1_000_000);
    expect(item.id).toBe('item1');
    expect(item.sizeBytes).toBe(2_500_000);
    expect(ranges.length).toBeGreaterThanOrEqual(3);
    expect(received.length).toBe(2_500_000);
  });

  it('getDownloadStream menstream konten', async () => {
    const fetchImpl = async (url: string | URL) => {
      if (String(url).includes('/content')) {
        return new Response(Readable.toWeb(makeStream(7)) as ReadableStream<Uint8Array>, { status: 200 });
      }
      return new Response(JSON.stringify({ size: 7, file: { mimeType: 'audio/mp3' } }), { status: 200 });
    };
    const r = await new OneDriveProvider('tok', fetchImpl as unknown as typeof fetch).getDownloadStream('i1');
    expect(r.mimeType).toBe('audio/mp3');
    expect((await drain(r.stream)).length).toBe(7);
  });
});

describe('pCloud multipart streaming upload', () => {
  it('menyertakan seluruh byte berkas dalam body multipart', async () => {
    let captured: Buffer | null = null;
    const fetchImpl = async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('uploadFile')) {
        captured = Buffer.from(await new Response(init?.body as never).arrayBuffer());
        return new Response(JSON.stringify({ result: 0, metadata: { fileid: 555 } }), { status: 200 });
      }
      return new Response(JSON.stringify({ result: 0, metadata: { fileid: 555, name: 'a.bin', size: 128, isfolder: false, modtime: 1 } }), { status: 200 });
    };
    const item = await new PCloudProvider('tok', 'us', fetchImpl as unknown as typeof fetch).uploadStream('a.bin', makeStream(128), '/');
    expect(item.id).toBe('555');
    expect(captured).not.toBeNull();
    expect(captured!.length).toBeGreaterThan(128);
    expect(captured!.filter((b) => b !== 0).length).toBeGreaterThan(0);
  });
});

describe('MEGA upload', () => {
  it('mem-pipe stream ke writable upload parent', async () => {
    const { Writable } = await import('node:stream');
    let received = 0;
    const child = { name: 'vid.mkv', directory: false, size: 64, timestamp: 1 };
    const upload = new Writable({
      write(chunk: Buffer, _enc, cb) { received += chunk.length; cb(); },
    });
    (upload as unknown as { complete: Promise<unknown> }).complete = new Promise((resolve) =>
      upload.on('finish', () => resolve(child)),
    );
    const parent = { directory: true, children: [child], upload: () => upload };
    const drive = { root: parent, files: { '0': parent }, reload: async () => {} };
    const item = await new MegaProvider(drive as never).uploadStream('vid.mkv', makeStream(64), 'root', 64);
    expect(received).toBe(64);
    expect(item).toMatchObject({ name: 'vid.mkv', isFolder: false, provider: 'mega' });
  });
});

describe('SSRF guard', () => {
  it('menerima domain provider whitelist', () => {
    for (const u of [
      'https://drive.google.com/uc?id=x',
      'https://r.dropbox.com/dl/x',
      'https://xxxx.pcloud.com/file',
      'https://onedrive.live.com/download?cid=x',
    ]) {
      expect(isAllowedProviderUrl(u)).toBe(true);
    }
  });

  it('menolak domain asing, http, dan IP internal', () => {
    expect(isAllowedProviderUrl('http://drive.google.com/x')).toBe(false);
    expect(isAllowedProviderUrl('https://evil.com/pcloud.com')).toBe(false);
    expect(isAllowedProviderUrl('https://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isAllowedProviderUrl('https://dropbox.com.attacker.net/x')).toBe(false);
    expect(() => assertAllowedProviderUrl('https://evil.internal/')).toThrow('whitelist');
    expect(() => assertAllowedProviderUrl('https://drive.google.com/uc')).not.toThrow();
  });
});
