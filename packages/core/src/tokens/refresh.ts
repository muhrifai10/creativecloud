import type { CloudProviderId } from '../providers/base.interface';

export interface RefreshedToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

interface ClientEnv {
  id: string;
  secret: string;
}

function client(provider: CloudProviderId): ClientEnv {
  const map: Partial<Record<CloudProviderId, [string, string]>> = {
    google_drive: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    dropbox: ['DROPBOX_CLIENT_ID', 'DROPBOX_CLIENT_SECRET'],
    onedrive: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
  };
  const entry = map[provider];
  if (!entry) throw new Error(`Provider ${provider} tidak mendukung token refresh.`);
  const [idKey, secretKey] = entry;
  const id = process.env[idKey] ?? '';
  const secret = process.env[secretKey] ?? '';
  if (!id || !secret) throw new Error(`${idKey}/${secretKey} belum dikonfigurasi.`);
  return { id, secret };
}

const ENDPOINTS: Record<string, string> = {
  google_drive: 'https://oauth2.googleapis.com/token',
  dropbox: 'https://api.dropboxapi.com/1/oauth2/token',
  onedrive: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

export async function refreshProviderToken(
  provider: CloudProviderId,
  refreshToken: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<RefreshedToken> {
  const endpoint = ENDPOINTS[provider];
  if (!endpoint) throw new Error(`Provider ${provider} tidak memiliki mekanisme refresh.`);
  const { id, secret } = client(provider);

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: id,
    client_secret: secret,
  });

  const res = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(`Refresh token ${provider} gagal: ${data.error ?? `HTTP ${res.status}`}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: Number(data.expires_in ?? 3600),
  };
}

export interface OAuthTokenExchange {
  provider: CloudProviderId;
  code: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}

export async function exchangeCodeForToken({
  provider,
  code,
  redirectUri,
  fetchImpl = globalThis.fetch,
}: OAuthTokenExchange): Promise<RefreshedToken> {
  const endpoint = ENDPOINTS[provider];
  if (!endpoint) throw new Error(`Provider ${provider} tidak mendukung OAuth code exchange.`);
  const { id, secret } = client(provider);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: redirectUri,
  });

  const res = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(`Exchange token ${provider} gagal: ${data.error_description ?? data.error ?? res.status}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: Number(data.expires_in ?? 3600),
  };
}
