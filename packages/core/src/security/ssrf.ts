const ALLOWED_HOST_SUFFIXES = [
  '.googleusercontent.com',
  '.drive.google.com',
  '.googleapis.com',
  '.dropboxusercontent.com',
  '.dropbox.com',
  '.dropboxapi.com',
  '.sharepoint.com',
  '.onedrive.com',
  '.onedrive.live.com',
  '.1drv.com',
  '.files.1drv.com',
  '.blob.core.windows.net',
  '.graph.microsoft.com',
  '.mega.nz',
  '.storage.cloud.com',
  '.pcloud.com',
];

export function isAllowedProviderUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  );
}

export function assertAllowedProviderUrl(rawUrl: string): string {
  if (!isAllowedProviderUrl(rawUrl)) {
    throw new Error('URL tujuan tidak ada dalam whitelist domain provider.');
  }
  return rawUrl;
}
