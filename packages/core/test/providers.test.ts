import { describe, it, expect } from 'vitest';
import { GoogleDriveProvider } from '../src/providers/google-drive';
import { DropboxProvider } from '../src/providers/dropbox';
import { OneDriveProvider } from '../src/providers/onedrive';
import { MegaProvider } from '../src/providers/mega';
import { PCloudProvider } from '../src/providers/pcloud';
import { assertSafeFolderId, sanitizeFileName, type IStorageProvider } from '../src/providers/base.interface';
import type { Dropbox } from 'dropbox';

const GB = 1024 ** 3;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('GoogleDriveProvider', () => {
  const fakeDrive = {
    about: {
      get: async () => ({ data: { storageQuota: { limit: String(15 * GB), usage: String(3 * GB) } } }),
    },
    files: {
      list: async () => ({
        data: {
          files: [
            { id: 'abc', name: 'laporan.pdf', size: '2048', mimeType: 'application/pdf', parents: ['root'], modifiedTime: '2026-01-02T03:04:05Z' },
            { id: 'fld', name: 'Proyek', mimeType: 'application/vnd.google-apps.folder', parents: ['root'], modifiedTime: '2026-01-02T03:04:05Z' },
          ],
        },
      }),
      delete: async () => ({}),
    },
  };

  it('getQuota menormalisasi storageQuota', async () => {
    const p = new GoogleDriveProvider(fakeDrive as never);
    expect(await p.getQuota()).toEqual({ totalBytes: 15 * GB, usedBytes: 3 * GB, freeBytes: 12 * GB });
  });

  it('listFiles menormalisasi item dan folder', async () => {
    const files = await new GoogleDriveProvider(fakeDrive as never).listFiles('root');
    expect(files).toHaveLength(2);
    expect(files[0]).toMatchObject({ id: 'abc', name: 'laporan.pdf', sizeBytes: 2048, isFolder: false, parentId: 'root', provider: 'google_drive' });
    expect(files[1]?.isFolder).toBe(true);
  });

  it('folderId berbahaya ditolak', async () => {
    await expect(new GoogleDriveProvider(fakeDrive as never).listFiles("'; drop")).rejects.toThrow();
  });
});

describe('DropboxProvider', () => {
  const fakeDbx = {
    usersGetSpaceUsage: async () => ({ result: { allocated: 120 * GB, used: 100 * GB } }),
    filesListFolder: async () => ({
      result: {
        entries: [
          { '.tag': 'file', name: 'design.fig', path_lower: '/design.fig', path_display: '/design.fig', server_modified: '2026-02-01T10:00:00Z', size: 4096, tag: 'application/octet-stream' },
          { '.tag': 'folder', name: 'ClientWork', path_lower: '/clientwork', path_display: '/ClientWork' },
        ],
      },
    }),
    filesDeleteV2: async () => ({ result: {} }),
  } as unknown as Dropbox;

  it('getQuota dari users/get_space_usage', async () => {
    const q = await new DropboxProvider(fakeDbx).getQuota();
    expect(q).toEqual({ totalBytes: 120 * GB, usedBytes: 100 * GB, freeBytes: 20 * GB });
  });

  it('listFiles menormalisasi entri', async () => {
    const files = await new DropboxProvider(fakeDbx).listFiles('/');
    expect(files[0]).toMatchObject({ id: '/design.fig', sizeBytes: 4096, isFolder: false, provider: 'dropbox' });
    expect(files[1]).toMatchObject({ isFolder: true, sizeBytes: 0 });
  });
});

describe('OneDriveProvider', () => {
  const items = {
    value: [
      { id: 'i1', name: 'kontrak.docx', size: 5120, parentReference: { id: 'p1' }, lastModifiedDateTime: '2026-03-01T00:00:00Z', file: { mimeType: 'application/vnd.openxmlformats' } },
      { id: 'i2', name: 'Klien', parentReference: { id: 'p1' }, folder: { childCount: 3 } },
    ],
  };
  const fetchImpl = async (url: URL | string) => {
    const u = String(url);
    if (u.includes('/me/drive')) return jsonResponse({ id: 'drive-9', quota: { total: 200 * GB, used: 80 * GB } });
    if (u.includes('/children')) return jsonResponse(items);
    return jsonResponse(items.value[0]);
  };
  const make = () => new OneDriveProvider('tok', fetchImpl as unknown as typeof fetch);

  it('getQuota dari GET /me/drive', async () => {
    expect(await make().getQuota()).toEqual({ totalBytes: 200 * GB, usedBytes: 80 * GB, freeBytes: 120 * GB });
  });

  it('listFiles menormalisasi item Graph', async () => {
    const p = make();
    await p.getQuota();
    const files = await p.listFiles('root');
    expect(files[0]).toMatchObject({ id: 'i1', sizeBytes: 5120, isFolder: false, parentId: 'p1', provider: 'onedrive' });
    expect(files[1]?.isFolder).toBe(true);
  });

  it('HTTP error dilempar', async () => {
    const fail = (async () => new Response('nope', { status: 429 })) as unknown as typeof fetch;
    await expect(new OneDriveProvider('tok', fail).getQuota()).rejects.toThrow('429');
  });
});

describe('PCloudProvider', () => {
  const fetchImpl = async (url: URL | string) => {
    const u = new URL(String(url));
    if (u.pathname === '/userinfo') return jsonResponse({ result: 0, email: 'kreator@pcloud.test', quota: 50 * GB, usedquota: 12 * GB });
    if (u.pathname === '/list') {
      return jsonResponse({
        result: 0,
        metadata: {
          folderid: 7,
          contents: [
            { fileid: 101, name: 'mix.wav', isfolder: false, size: 8888, modtime: 1740000000, contentType: 'audio/wav' },
            { folderid: 202, name: 'Arsip', isfolder: true },
          ],
        },
      });
    }
    return jsonResponse({ result: 0 });
  };

  it('getQuota dari userinfo (quota/usedquota)', async () => {
    const q = await new PCloudProvider('tok', 'eu', fetchImpl as unknown as typeof fetch).getQuota();
    expect(q).toEqual({ totalBytes: 50 * GB, usedBytes: 12 * GB, freeBytes: 38 * GB });
  });

  it('listFiles menormalisasi metadata contents', async () => {
    const files = await new PCloudProvider('tok', 'us', fetchImpl as unknown as typeof fetch).listFiles('/');
    expect(files[0]).toMatchObject({ id: '101', sizeBytes: 8888, mimeType: 'audio/wav', isFolder: false, provider: 'pcloud' });
    expect(files[1]).toMatchObject({ id: '202', isFolder: true });
  });

  it('error API pCloud (result != 0) dilempar', async () => {
    const failFetch = (async () => jsonResponse({ result: 2005, error: 'Auth fail' })) as unknown as typeof fetch;
    await expect(new PCloudProvider('bad', 'us', failFetch).getQuota()).rejects.toThrow('Auth fail');
  });
});

describe('MegaProvider', () => {
  function mkNode(over: Partial<{ name: string; size: number; directory: boolean; parent: unknown }>) {
    return {
      name: over.name ?? '',
      size: over.size ?? 0,
      directory: over.directory ?? false,
      timestamp: 1740000000,
      parent: over.parent,
      children: [] as unknown[],
    };
  }
  const root = mkNode({ name: '', directory: true });
  const fileA = mkNode({ name: 'video-4k.mov', size: 999999, parent: root });
  const folderB = mkNode({ name: 'B-roll', directory: true, parent: root });
  (root.children as unknown[]).push(fileA, folderB);
  const drive = {
    email: 'kreator@mega.test',
    root,
    files: { '0': root, fA: fileA, dB: folderB },
    getAccountInfo: async () => ({ spaceUsed: 3 * GB, spaceTotal: 20 * GB }),
    reload: async () => {},
    filter: (fn: (f: { name?: string | null }) => boolean) => [fileA, folderB].filter(fn),
  };
  const make = () => new MegaProvider(drive as never, 'kreator@mega.test');

  it('getQuota dari getAccountInfo', async () => {
    expect(await make().getQuota()).toEqual({ totalBytes: 20 * GB, usedBytes: 3 * GB, freeBytes: 17 * GB });
  });

  it('listFiles root menormalisasi children', async () => {
    const files = await make().listFiles('root');
    expect(files).toHaveLength(2);
    expect(files[0]).toMatchObject({ id: 'fA', name: 'video-4k.mov', sizeBytes: 999999, isFolder: false, parentId: '0', provider: 'mega' });
    expect(files[1]).toMatchObject({ id: 'dB', isFolder: true, sizeBytes: 0 });
  });

  it('searchFiles cocokkan nama (case insensitive)', async () => {
    const found = await make().searchFiles('VIDEO-4K');
    expect(found.map((f) => f.id)).toContain('fA');
  });

  it('getIdentity memakai email login', async () => {
    expect(await make().getIdentity()).toEqual({ email: 'kreator@mega.test' });
  });

  it('renameItem memanggil rename pada node', async () => {
    const renamed: string[] = [];
    (fileA as Record<string, unknown>)['rename'] = async (n: string) => { renamed.push(n); };
    await make().renameItem('fA', 'nama baru.mov');
    expect(renamed).toEqual(['nama baru.mov']);
    delete (fileA as Record<string, unknown>)['rename'];
  });
});

it('semua adapter memenuhi kontrak IStorageProvider', () => {
  const check = (p: IStorageProvider) => {
    expect(typeof p.getQuota).toBe('function');
    expect(typeof p.uploadStream).toBe('function');
  };
  check(new GoogleDriveProvider({} as never));
  check(new DropboxProvider({} as never));
  check(new OneDriveProvider('t'));
  check(new PCloudProvider('t'));
  check(new MegaProvider({} as never));
});

describe('helpers sanitasi', () => {
  it('assertSafeFolderId menolak path traversal dan injection', () => {
    expect(() => assertSafeFolderId('../etc/passwd')).toThrow();
    expect(() => assertSafeFolderId("1' or 1=1")).toThrow();
    expect(assertSafeFolderId('0B1abc-__X9')).toBe('0B1abc-__X9');
  });

  it('sanitizeFileName menolak null byte dan separator', () => {
    expect(sanitizeFileName('laporan final.pdf')).toBe('laporan final.pdf');
    expect(() => sanitizeFileName('a/b')).toThrow();
    expect(sanitizeFileName('a\0.png')).toBe('a.png');
    expect(() => sanitizeFileName('...')).toThrow();
  });
});
