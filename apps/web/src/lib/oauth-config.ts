export const OAUTH_SET = ["google_drive", "dropbox", "onedrive"] as const;
export const CREDENTIAL_SET = ["mega", "pcloud"] as const;

export function isOAuthProvider(x: string): x is (typeof OAUTH_SET)[number] {
  return (OAUTH_SET as readonly string[]).includes(x);
}

export function isCredentialProvider(x: string): x is (typeof CREDENTIAL_SET)[number] {
  return (CREDENTIAL_SET as readonly string[]).includes(x);
}

interface ProviderEnv {
  id: string;
  secret: string;
}

const ENV_KEYS: Record<(typeof OAUTH_SET)[number], [string, string]> = {
  google_drive: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  dropbox: ["DROPBOX_CLIENT_ID", "DROPBOX_CLIENT_SECRET"],
  onedrive: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"],
};

export function oauthClient(provider: (typeof OAUTH_SET)[number]): ProviderEnv {
  const [idKey, secretKey] = ENV_KEYS[provider];
  const id = process.env[idKey];
  const secret = process.env[secretKey];
  if (!id || !secret) {
    throw new Error(`${idKey} / ${secretKey} belum dikonfigurasi di environment server.`);
  }
  return { id, secret };
}

export function authorizeUrl(
  provider: (typeof OAUTH_SET)[number],
  redirectUri: string,
  state: string,
): string {
  const { id } = oauthClient(provider);
  const url = new URL(AUTHORIZE_BASE[provider]);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  if (provider === "google_drive") {
    url.searchParams.set(
      "scope",
      "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly",
    );
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
  }
  if (provider === "dropbox") {
    url.searchParams.set("token_access_type", "offline");
  }
  if (provider === "onedrive") {
    url.searchParams.set("scope", "Files.ReadWrite.All offline_access User.Read");
  }
  return url.toString();
}

const AUTHORIZE_BASE: Record<(typeof OAUTH_SET)[number], string> = {
  google_drive: "https://accounts.google.com/o/oauth2/v2/auth",
  dropbox: "https://www.dropbox.com/oauth2/authorize",
  onedrive: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
};

export const STATE_COOKIE = "nexusdrive_oauth_state";
