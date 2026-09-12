import { describe, it, expect } from 'vitest';
import { fileKind } from '../src/providers/file-kind';

describe('fileKind', () => {
  it('mendeteksi dari ekstensi', () => {
    expect(fileKind({ isFolder: false, name: 'hero.FIG' })).toBe('image');
    expect(fileKind({ isFolder: false, name: 'reel.mov' })).toBe('video');
    expect(fileKind({ isFolder: false, name: 'track.WAV' })).toBe('audio');
    expect(fileKind({ isFolder: false, name: 'kontrak.pdf' })).toBe('document');
    expect(fileKind({ isFolder: false, name: 'aset.zip' })).toBe('archive');
    expect(fileKind({ isFolder: true, name: 'Klien' })).toBe('folder');
    expect(fileKind({ isFolder: false, name: 'tanpaekstensi' })).toBe('other');
  });

  it('fallback ke MIME saat ekstensi tak dikenal', () => {
    expect(fileKind({ isFolder: false, name: 'x', mimeType: 'image/png' })).toBe('image');
    expect(fileKind({ isFolder: false, name: 'x', mimeType: 'video/mp4' })).toBe('video');
    expect(fileKind({ isFolder: false, name: 'bin', mimeType: 'application/octet-stream' })).toBe('other');
  });

  it('titik tersembunyi bukan ekstensi', () => {
    expect(fileKind({ isFolder: false, name: '.gitignore' })).toBe('other');
  });
});
