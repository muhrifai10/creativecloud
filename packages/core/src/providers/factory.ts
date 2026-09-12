import { GoogleDriveProvider } from './google-drive';
import { DropboxProvider } from './dropbox';
import { OneDriveProvider } from './onedrive';
import { PCloudProvider } from './pcloud';
import type { CloudProviderId, IStorageProvider } from './base.interface';

export const OAUTH_PROVIDERS: readonly CloudProviderId[] = ['google_drive', 'dropbox', 'onedrive'];
export const CREDENTIAL_PROVIDERS: readonly CloudProviderId[] = ['mega', 'pcloud'];
export const ALL_PROVIDERS: readonly CloudProviderId[] = [...OAUTH_PROVIDERS, ...CREDENTIAL_PROVIDERS];

export interface ProviderCredentials {
  accessToken?: string;
  pcloudRegion?: 'us' | 'eu';
}

export function createProvider(provider: CloudProviderId, creds: ProviderCredentials): IStorageProvider {
  switch (provider) {
    case 'google_drive':
      return GoogleDriveProvider.fromAccessToken(creds.accessToken ?? '');
    case 'dropbox':
      return DropboxProvider.fromAccessToken(creds.accessToken ?? '');
    case 'onedrive':
      return new OneDriveProvider(creds.accessToken ?? '');
    case 'pcloud':
      return new PCloudProvider(creds.accessToken ?? '', creds.pcloudRegion ?? 'us');
    case 'mega':
      throw new Error('MegaProvider butuh login; gunakan MegaProvider.login(email, password)');
  }
}
