# MASTER SPECIFICATION & PROMPT INSTRUKSI AI CODING AGENT
## Proyek: Multi-Provider Cloud Drive SaaS Platform (NexusDrive)

---

> **PANDUAN EKSEKUSI UNTUK AI CODING AGENT:**
> Anda adalah Senior Principal Full-Stack & Systems Engineer. Dokumen ini adalah instruksi tunggal, absolut, dan komprehensif untuk membangun platform SaaS NexusDrive dari nol hingga siap produksi.
> Ikuti seluruh arsitektur, konvensi kode, batasan keamanan, aturan desain visual, dan urutan fase secara mutlak.
> **ATURAN GERBANG FASE KETAT (STRICT PHASE GATE):** Jangan pernah memulai fase berikutnya jika fase saat ini masih memiliki pengujian gagal, galat typecheck (`tsc`), atau linting error. Selesaikan setiap galat sebelum melangkah maju.

---

## 1. PROJECT CONTEXT & LATAR BELAKANG

Freelancer dan kreator konten (desainer UI/UX, videografer 4K, fotografer RAW, copywriter, audio engineer) mengandalkan berbagai penyedia cloud storage gratis dan berbayar sekaligus untuk menghemat biaya langganan tier tinggi:
- **Google Drive** untuk kolaborasi Google Docs/Sheets dan asset sharing cepat.
- **Dropbox** untuk sinkronisasi folder kerja desainer dan klien enterprise.
- **Microsoft OneDrive** yang terbundel dengan Office 365.
- **MEGA** untuk kapasitas penyimpanan gratis/arsip data berukuran masif terenkripsi.
- **pCloud** untuk backup media streaming audio/video bebas degradasi.

**Masalah Utama:** Pengguna terfragmentasi. Membuka 5 tab terpisah, tidak mengetahui sisa kuota kumulatif, pencarian berkas manual yang membuang waktu 20-30 menit per hari, serta kesulitan memindahkan aset besar antar-cloud tanpa harus mengunduh ke penyimpanan lokal (bandwidth & local storage killer).

**Solusi:** NexusDrive menyatukan Google Drive, Dropbox, OneDrive, MEGA, dan pCloud ke dalam satu dasbor terpadu beralur kerja modern. Menampilkan kapasitas total dan per-provider dalam visual ring gauge interaktif, navigasi sidebar terstruktur (berdasarkan kategori berkas dan direktori akun), File Manager universal berbasis tabel virtual dengan aksi streaming langsung, serta background sync engine berbasis BullMQ.

**Target Metrik & KPI:**
- Waktu peluncuran MVP: 4 Bulan.
- Indikator Kesuksesan: Pertumbuhan Monthly Active Users (MAU) dan efisiensi transfer data lintas-cloud tanpa timeout.

---

## 2. OBJEKTIF & SCOPE OF WORK

1. Mengimplementasikan autentikasi pengguna utama yang aman dengan vault kredensial multi-provider terenkripsi hardware-grade (AES-256-GCM).
2. Membangun konektor terstandarisasi untuk 5 provider: Google Drive, Dropbox, Microsoft OneDrive, MEGA, dan pCloud.
3. Menghadirkan antarmuka file manager modern yang terinspirasi dari referensi visual (dashboard storage cards, ring gauge, sidebar kategori, explorer berbasis TanStack Table virtual).
4. Merancang backend engine streaming file tanpa membebani disk/RAM server lokal, memanfaatkan Cloudflare R2 sebagai buffer cache cepat dan perantara unduhan/unggah multi-part.
5. Membangun dedicated background worker berbasis BullMQ dan Redis untuk migrasi data asinkron dan sinkronisasi mirroring terjadwal.

---

## 3. TECH STACK

| Layer | Teknologi & Versi | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Framework Utama** | Next.js 15 (App Router, React 19, Server Actions) | SSR/SSG terpadu, Route Handlers bertenaga tinggi, kompatibilitas streaming respons |
| **Styling & UI** | Tailwind CSS v4, shadcn/ui, Radix UI Primitives | Aksesibilitas penuh (WAI-ARIA), modularitas tinggi tanpa abstraksi berlebih |
| **State & Table** | TanStack Query v5, TanStack Table v8, Zustand | Cache management terprediksi, performa tabel virtual ribuan item tanpa lag |
| **Ikonografi & Grafik** | Lucide React, Recharts | Vektor ringan, visualisasi radial/arc gauge kapasitas storage yang konsisten |
| **Database & Auth** | Supabase (PostgreSQL 16), Auth.js v5 (NextAuth) | RLS granular, trigger real-time, fleksibilitas session JWT & database sessions |
| **Enkripsi Kredensial**| Node.js Native `node:crypto` (AES-256-GCM) | Standar perbankan, authenticated encryption dengan nonce/IV & auth-tag unik |
| **Object Storage** | Cloudflare R2 (S3-Compatible API) | Biaya egress $0, buffer sementara chunk transfer, thumbnail web-optimized cache |
| **Background Worker** | Standalone Node.js TypeScript Service, BullMQ, Redis (ioredis) | Pemrosesan background transfer tahan banting (isolated execution, auto-retry, backoff) |
| **Validasi & Parsing**| Zod v3 | Schema runtime contract validation untuk API, Server Actions, dan Form |
| **Cloud Provider SDKs**| `googleapis`, `dropbox`, `@microsoft/microsoft-graph-client`, `megajs`, `pcloud-sdk-js` | Integrasi native protokol resmi masing-masing penyedia |
| **AI Integration** | OpenAI API (`text-embedding-3-small`, `gpt-4o-mini`), pgvector | Ekstraksi metadata, tagging otomatis, semantik search vector lintas akun |

---

## 4. SYSTEM ARCHITECTURE & FOLDER STRUCTURE

Aplikasi menggunakan struktur hybrid monorepo ringan (atau modular multi-package) yang memisahkan aplikasi web Next.js dari background worker processor agar beban transfer data streaming berkas tidak mematikan antarmuka UI.

```
nexusdrive/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, Typecheck, Test, Phase Gate enforcement
│       └── deploy.yml             # Deploy Next.js to Vercel, Worker to Railway/Fly
├── apps/
│   ├── web/                       # Next.js 15 App Router Frontend & REST Route Handlers
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx     # Shell layout (Sidebar + Header + Storage Gauges)
│   │   │   │   ├── page.tsx       # Root Dashboard view
│   │   │   │   ├── explorer/      # Unified File Manager (Table & Grid)
│   │   │   │   ├── accounts/      # Connected Accounts Management
│   │   │   │   ├── transfers/     # Activity Center & Sync Status
│   │   │   │   └── settings/      # User settings & security
│   │   │   ├── (marketing)/
│   │   │   │   ├── page.tsx       # Creator-focused High-converting Landing Page
│   │   │   │   └── onboarding/    # Interactive 2-minute tour
│   │   │   └── api/
│   │   │       ├── auth/[...nextauth]/route.ts
│   │   │       ├── oauth/[provider]/
│   │   │       │   ├── callback/route.ts
│   │   │       │   └── connect/route.ts
│   │   │       ├── files/
│   │   │       │   ├── stream/route.ts
│   │   │       │   ├── upload/route.ts
│   │   │       │   └── thumbnail/[fileId]/route.ts
│   │   │       ├── sync/route.ts
│   │   │       └── webhooks/
│   ├── worker/                    # Dedicated Standalone Node.js Worker
│   │   ├── src/
│   │   │   ├── index.ts           # Worker entry point
│   │   │   ├── queues/
│   │   │   │   ├── syncQueue.ts
│   │   │   │   └── transferQueue.ts
│   │   │   ├── processors/
│   │   │   │   ├── crossCloudTransferProcessor.ts
│   │   │   │   ├── folderMirrorProcessor.ts
│   │   │   │   └── aiTaggingProcessor.ts
│   │   │   └── providers/         # Instansiasi provider di layer worker
│   │   ├── Dockerfile
│   │   └── package.json
├── packages/
│   ├── core/                      # Shared business logic & provider abstractions
│   │   ├── src/
│   │   │   ├── crypto/            # AES-256-GCM Vault Module
│   │   │   ├── providers/         # Universal Storage Abstraction Layer
│   │   │   │   ├── base.interface.ts
│   │   │   │   ├── google-drive.ts
│   │   │   │   ├── dropbox.ts
│   │   │   │   ├── onedrive.ts
│   │   │   │   ├── mega.ts
│   │   │   │   └── pcloud.ts
│   │   │   ├── r2/                # Cloudflare R2 Buffer & Client SDK
│   │   │   └── types/
│   ├── database/                  # Supabase clients, schemas, migrations, types
│   │   ├── migrations/
│   │   └── src/
│   └── ui/                        # Shared UI components (shadcn primitives)
├── docker-compose.yml             # Local Redis & PostgreSQL for dev
└── turbo.json
```

### Layer Boundaries & Separation of Concerns Rules:
1. **Presentation Layer (`apps/web/app`, `packages/ui`)**: Komponen UI tidak boleh memanggil SDK provider secara langsung. Komponen hanya berkomunikasi dengan React Server Actions atau Route Handlers melalui hook TanStack Query.
2. **Domain/Application Layer (`packages/core/providers`)**: Mengimplementasikan kontrak interface `IStorageProvider`. Seluruh penamaan payload (file list, metadata, quota) dinormalisasi ke satu format universal.
3. **Infrastructure Layer (`packages/core/crypto`, `packages/core/r2`, `packages/database`)**: Menangani akses database, enkripsi, dan penyimpanan S3 buffer.
4. **Worker Layer (`apps/worker`)**: Berjalan terpisah secara penuh. Berkomunikasi dengan Next.js hanya melalui antrean Redis (BullMQ) dan penulisan status log ke Supabase PostgreSQL.

---

## 5. DATABASE ARCHITECTURE (SUPABASE POSTGRESQL & RLS)

Skema database dirancang untuk isolasi multi-tenant dengan Row Level Security (RLS). Seluruh kredensial sensitif dienkripsi sebelum masuk ke tabel.

```sql
-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enum Types
CREATE TYPE cloud_provider_enum AS ENUM ('google_drive', 'dropbox', 'onedrive', 'mega', 'pcloud');
CREATE TYPE account_status_enum AS ENUM ('active', 'expired', 'revoked', 'error');
CREATE TYPE transfer_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE sync_direction_enum AS ENUM ('one_way', 'two_way', 'mirror');

-- 1. Profiles (Terkait dengan Auth.js Users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Connected Cloud Accounts
CREATE TABLE public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider cloud_provider_enum NOT NULL,
    account_email TEXT NOT NULL,
    account_name TEXT,
    status account_status_enum DEFAULT 'active' NOT NULL,
    total_space_bytes BIGINT DEFAULT 0 NOT NULL,
    used_space_bytes BIGINT DEFAULT 0 NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_user_provider_account UNIQUE(user_id, provider, account_email)
);

-- 3. Encrypted Credentials Vault (Hardware-grade encrypted payloads)
CREATE TABLE public.credential_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    encrypted_access_token TEXT,       -- Format: iv:auth_tag:ciphertext (Hex)
    encrypted_refresh_token TEXT,      -- Format: iv:auth_tag:ciphertext (Hex)
    encrypted_api_key TEXT,            -- Khusus pCloud / MEGA jika menggunakan master credentials
    token_expires_at TIMESTAMPTZ,
    encryption_key_version INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_account_vault UNIQUE(account_id)
);

-- 4. Unified Files Cache (Mempercepat query dan semantic search lintas provider)
CREATE TABLE public.file_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider cloud_provider_enum NOT NULL,
    provider_file_id TEXT NOT NULL,
    provider_parent_id TEXT,
    name TEXT NOT NULL,
    extension TEXT,
    mime_type TEXT,
    size_bytes BIGINT DEFAULT 0 NOT NULL,
    is_folder BOOLEAN DEFAULT FALSE NOT NULL,
    path_hierarchy TEXT NOT NULL,       -- e.g. /Root/Documents/ProjectA
    web_view_link TEXT,
    thumbnail_r2_key TEXT,
    ai_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    embedding VECTOR(1536),            -- Vector embedding untuk semantic search
    provider_modified_at TIMESTAMPTZ,
    last_indexed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_account_file UNIQUE(account_id, provider_file_id)
);

-- 5. Cross-Cloud Transfers & Sync Jobs
CREATE TABLE public.transfer_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    source_file_id TEXT NOT NULL,
    source_file_name TEXT NOT NULL,
    source_file_size BIGINT NOT NULL,
    target_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    target_folder_id TEXT NOT NULL,
    status transfer_status_enum DEFAULT 'pending' NOT NULL,
    progress_percentage INT DEFAULT 0 NOT NULL,
    bytes_transferred BIGINT DEFAULT 0 NOT NULL,
    error_message TEXT,
    bullmq_job_id TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. Scheduled Sync Rules
CREATE TABLE public.sync_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    source_folder_id TEXT NOT NULL,
    target_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    target_folder_id TEXT NOT NULL,
    sync_direction sync_direction_enum DEFAULT 'one_way' NOT NULL,
    cron_expression TEXT NOT NULL,     -- e.g. "0 2 * * *" (tiap jam 2 pagi)
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read and update their own profile"
    ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users access own connected accounts"
    ON public.connected_accounts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own files cache"
    ON public.file_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own transfer jobs"
    ON public.transfer_jobs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own sync schedules"
    ON public.sync_schedules FOR ALL USING (auth.uid() = user_id);

-- Vault strictly isolated: Vault table cannot be queried by general public anon keys.
-- Service role only for credential operations.
CREATE POLICY "Strict isolated vault policy"
    ON public.credential_vault FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.connected_accounts ca 
        WHERE ca.id = credential_vault.account_id AND ca.user_id = auth.uid()
    ));
```

---

## 6. AUTHENTICATION & ENCRYPTED CREDENTIAL VAULT

### Modul Enkripsi Vault (`packages/core/src/crypto/vault.ts`)
Menggunakan standard AES-256-GCM authenticated cipher. Format data yang disimpan adalah serialisasi Hex string: `iv:authTag:cipherText`.

```typescript
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV recommended for GCM
const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_MASTER_KEY_HEX!, 'hex'); // 32-byte (256-bit)

export interface EncryptedPayload {
  serialized: string; // Format: iv:authTag:cipherText
}

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSecret(serialized: string): string {
  const [ivHex, authTagHex, cipherText] = serialized.split(':');
  if (!ivHex || !authTagHex || !cipherText) {
    throw new Error('Malformed encrypted secret format.');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    MASTER_KEY,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Token Lifecycle & Auto-Refresh Interceptor
Setiap request ke cloud provider membungkus eksekusi dalam lifecycle manager. Jika token kedaluwarsa dalam < 5 menit, refresh token dijalankan otomatis:

```typescript
export async function getValidAccessToken(accountId: string): Promise<string> {
  const vault = await db.credentialVault.findByAccountId(accountId);
  if (!vault) throw new Error('Account vault not found');

  const expiresAt = new Date(vault.token_expires_at).getTime();
  const now = Date.now();

  // Refresh jika sisa waktu kurang dari 5 menit
  if (expiresAt - now < 5 * 60 * 1000) {
    const refreshToken = decryptSecret(vault.encrypted_refresh_token);
    const refreshed = await refreshProviderToken(vault.provider, refreshToken);
    
    await db.credentialVault.update({
      accountId,
      encrypted_access_token: encryptSecret(refreshed.accessToken),
      encrypted_refresh_token: refreshed.refreshToken ? encryptSecret(refreshed.refreshToken) : undefined,
      token_expires_at: new Date(Date.now() + refreshed.expiresIn * 1000)
    });

    return refreshed.accessToken;
  }

  return decryptSecret(vault.encrypted_access_token);
}
```

---

## 7. UNIVERSAL STORAGE PROVIDER INTERFACE & SPECIFICATIONS

Seluruh provider wajib mengimplementasikan interface terpadu (`packages/core/src/providers/base.interface.ts`):

```typescript
export interface StorageQuota {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
}

export interface UniversalFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  isFolder: boolean;
  parentId: string | null;
  modifiedAt: Date;
  downloadUrl?: string;
  thumbnailUrl?: string;
  provider: 'google_drive' | 'dropbox' | 'onedrive' | 'mega' | 'pcloud';
}

export interface IStorageProvider {
  getQuota(): Promise<StorageQuota>;
  listFiles(folderId?: string): Promise<UniversalFileItem[]>;
  searchFiles(query: string): Promise<UniversalFileItem[]>;
  createFolder(name: string, parentFolderId?: string): Promise<UniversalFileItem>;
  renameItem(itemId: string, newName: string): Promise<UniversalFileItem>;
  deleteItem(itemId: string): Promise<boolean>;
  getDownloadStream(itemId: string): Promise<{ stream: NodeJS.ReadableStream; size: number; mimeType: string }>;
  uploadStream(fileName: string, stream: NodeJS.ReadableStream, parentFolderId?: string, sizeBytes?: number): Promise<UniversalFileItem>;
}
```

### Catatan Teknis Integrasi 5 Provider Utama:
1. **Google Drive (OAuth2)**:
   - Scopes: `https://www.googleapis.com/auth/drive.file` dan `https://www.googleapis.com/auth/drive.metadata.readonly`.
   - Endpoint Kuota: `drive.about.get({ fields: 'storageQuota' })`.
   - Unggah besar (>5MB): Menggunakan Resumable Upload protocol.
2. **Dropbox (OAuth2)**:
   - Scopes: `files.metadata.read`, `files.content.read`, `files.content.write`, `account_info.read`.
   - Endpoint Kuota: `/2/users/get_space_usage`.
   - Chunk upload: `upload_session/start`, `append_v2`, `finish`.
3. **Microsoft OneDrive (OAuth2 via Microsoft Graph)**:
   - Scopes: `Files.ReadWrite.All`, `User.Read`, `offline_access`.
   - Endpoint Kuota: `GET /me/drive`.
   - Upload session: `createUploadSession` untuk file berukuran >4MB.
4. **MEGA (Kredensial & MegaAPI SDK)**:
   - Menggunakan library `megajs`. Autentikasi dengan email & password terenkripsi atau exported session master key.
   - Perhitungan kuota: `mega.getAccountInfo()` (`space_used`, `space_total`).
5. **pCloud (OAuth2 / Direct API Token)**:
   - Endpoint Auth EU / US: `https://my.pcloud.com/oauth2/` atau `https://eapi.pcloud.com/`.
   - Endpoint Kuota: `userinfo` (field `quota` dan `usedquota`).

---

## 8. STREAMING PIPELINE & BUFFER ARCHITECTURE (CLOUDFLARE R2)

Sistem dilarang menyimpan berkas utuh di disk server lokal container atau Next.js Serverless runtime (menghindari memory explosion dan disk limit).

```
[Klien Browser]
       │
 (Chunk Upload)
       ▼
[Next.js App Router: api/files/upload]
       │
 (Node.js Stream Pipeline)
       ▼
[Cloudflare R2 Temporary Buffer] (S3 Multipart Upload)
       │
 (Worker Event Dispatch via Redis)
       ▼
[BullMQ Isolated Worker Node]
       │
 (Direct Provider Stream: Google/Dropbox/OneDrive/MEGA/pCloud)
       ▼
[Target Cloud Provider]
       │
 (Upload Complete -> Purge R2 Temporary Buffer)
```

1. **Upload Handler**: Berkas berukuran kecil (<10MB) di-stream langsung ke provider. Berkas besar (>10MB) dialirkan ke Cloudflare R2 bucket `nexusdrive-temp-buffer` via S3 Multipart stream.
2. **Download Streaming**: Menggunakan Route Handler `api/files/stream` dengan header `Content-Disposition`, `Content-Type`, dan respons `ReadableStream` langsung dari provider atau Cloudflare R2 proxy cache.
3. **Thumbnail Optimization**: Berkas gambar/PDF yang diakses sering di-cache thumbnail-nya (resolusi 256x256 WebP) di Cloudflare R2 bucket `nexusdrive-thumbnails` dengan cache header `public, max-age=604800, immutable`.

---

## 9. FEATURE IMPLEMENTATION SPECIFICATIONS (P0, P1, P2)

### P0 (MVP Must-Have — Wajib Berfungsi Penuh Sebelum Melangkah ke P1)

#### 1. Autentikasi Pengguna & Vault Kredensial Multi-Provider
- **Sub: Autentikasi Pengguna Utama (Auth.js)**: Register/login berbasis email-password dan OAuth magic link via Supabase Auth + Auth.js v5. Session diamankan dengan secure HTTP-only cookies.
- **Sub: Token Vault Terenkripsi AES-256-GCM**: Kredensial OAuth (access token, refresh token) dan API secret dienkripsi di runtime server sebelum disimpan ke PostgreSQL. Tidak pernah diekspos ke browser klien.
- **Sub: Token Lifecycle & Auto-Refresh Manager**: Validasi token kadaluwarsa otomatis. Refresh token dieksekusi transparan saat API dipanggil.

#### 2. Integrasi & Manajemen Koneksi Akun Cloud
- **Sub: Integrasi OAuth2 (Google Drive, Dropbox, OneDrive)**: Alur redirect OAuth standar dengan parameter state CSRF terenkripsi. Callback menyimpan token dan metadata akun.
- **Sub: Integrasi Kredensial (MEGA & pCloud)**: Form modal aman untuk memasukkan kredensial MEGA atau token API pCloud dengan validasi koneksi real-time.
- **Sub: Pengelolaan & Pemutusan Akun (Account Manager)**: Halaman manajemen untuk memeriksa status koneksi, refresh paksa, dan pemutusan akun (soft-delete + pembersihan file cache).

#### 3. Dashboard Analitik & Kapasitas Penyimpanan
- **Sub: Komponen Gauge Kapasitas Cloud Terhubung**: 5 kartu penyimpanan di bagian atas (seperti referensi visual) yang menampilkan logo provider, nama provider, kuota terpakai vs total (contoh: `120Gb / 250Gb`), serta mini radial progress arc meter.
- **Sub: Statistik Total Penyimpanan Agregat**: Agregasi total ruang penyimpanan dari semua akun terhubung, total terpakai, dan sisa persentase.
- **Sub: Sidebar Navigasi & Quick Access**: Panel kiri navigasi dengan menu utama, sub-kategori tipe berkas (All Files, Images, Video, Music, Document) dengan count badge dan ikon berwarna khusus, serta section "Go To Folders" untuk navigasi folder cepat.

#### 4. File Manager Terpadu Lintas Provider
- **Sub: Tampilan Tabel & Grid File Explorer**: Tampilan tabel berkas (TanStack Table) dengan kolom: Nama File, Jumlah Item/Status, Terakhir Diubah, Ukuran Berkas, dan Tombol Opsi (`...`). Toggle tampilan List dan Grid yang mulus.
- **Sub: Pencarian & Penyaringan Lintas Cloud**: Search bar responsif (debounce 300ms) untuk mencari berkas di semua provider secara bersamaan, filter berdasarkan tipe dokumen, dan filter akun spesifik.
- **Sub: Menu Aksi Berkas (Context Menu & Actions)**: Menu popover interaktif untuk download, rename, move, delete, view web version, dan trigger transfer.

#### 5. Engine Operasi & Streaming Berkas
- **Sub: Streaming Upload Terdistribusi**: Komponen upload drag-and-drop dengan progress bar per berkas, multi-file concurrent upload queue, dan alur streaming langsung tanpa memory leak.
- **Sub: Direct & Proxy Download Stream**: Download streaming melalui endpoint terpadu dengan handling chunk otomatis.
- **Sub: Thumbnail & Preview Caching via Cloudflare R2**: Pipeline pembuatan thumbnail preview untuk foto dan dokumen ringan yang disimpan di R2 untuk performa instan saat browsing.

---

### P1 (Important — Shippable Setelah P0 Stabil)

#### 6. Sinkronisasi & Transfer Antar-Cloud (Worker Engine)
- **Sub: Dedicated Background Worker (BullMQ & Redis)**: Container Node.js independen yang mengonsumsi antrean job transfer antar-cloud. Menangani retry otomatis dengan exponential backoff jika koneksi provider terputus.
- **Sub: Sinkronisasi Terjadwal & Mirroring Folder**: Penjadwalan cron sync untuk mereplikasi direktori dari satu cloud ke cloud lainnya (contoh: Mirroring otomatis folder `/ClientWork` di Dropbox ke Google Drive setiap tengah malam).
- **Sub: Pusat Aktivitas & Transfer Manager UI**: Drawer status transfer real-time di antarmuka web, menampilkan progress transfer file (speed, ETA, bytes transferred, tombol pause/cancel).

#### 7. Onboarding & Landing Page Konversi Kreator
- **Sub: Landing Page Produk Interaktif**: Halaman depan berkonversi tinggi dengan headline terarah untuk kreator/freelancer, visual preview produk interaktif, kalkulator penghematan storage, dan CTA jelas.
- **Sub: Onboarding Tour 2-Menit**: Alur onboarding interaktif langkah-demi-langkah (menggunakan dialog terpandu) untuk memandu pengguna baru menghubungkan 2 akun cloud pertama mereka dalam <120 detik.

---

### P2 (Nice-to-Have — Nilai Tambah Inovasi)

#### 8. AI Auto-Tagging & Semantic File Search
- **Sub: Smart Auto-Tagging Berkas Media & Dokumen**: Integrasi worker yang memanggil OpenAI API untuk menganalisis nama file, ekstensi, dan cuplikan teks/metadata gambar untuk memberikan tag cerdas (e.g. `#invoice`, `#brand-guideline`, `#b-roll-footage`).
- **Sub: Pencarian Semantik Berbasis Natural Language**: Konversi kueri pencarian alami (contoh: "dokumen kontrak klien bulan lalu dengan logo hitam") menjadi vector embeddings (`text-embedding-3-small`) dan pencarian similarity via Supabase `pgvector`.

---

## 10. FRONTEND DESIGN TASTE RULES (ANTI-AI-SLOP DISCIPLINE)

Dokumen ini melarang keras tampilan generik kecerdasan buatan (desain murahan, gradien ungu neon berlebihan, sudut kartu yang canggung, dan tipografi seragam). Tampilan wajib mengacu pada standar tinggi UI/UX SaaS modern seperti yang terlihat pada referensi visual terlampir.

### A. Anti-Default Discipline
- **Dilarang keras**: Menggunakan font Inter secara mentah tanpa custom tracking, dilarang menggunakan warna background Tailwind default murni `bg-gray-50` atau `bg-slate-100`.
- **Wajib**: Gunakan base background ultra-clean yang sejuk seperti `#F8F9FD` atau `#F5F7FB`. Container card menggunakan pure white `#FFFFFF` dengan border tipis terkalibrasi `#EEF1F6` atau `#E5E9F2`.
- **Elevation**: Gunakan soft shadows yang terdispersi luas (contoh: `shadow-[0_4px_24px_-2px_rgba(20,25,40,0.04)]`). Jangan gunakan drop-shadow pekat dan gelap.

### B. Typography Rules
- **Display & Heading**: Plus Jakarta Sans atau Geist Sans dengan tracking `-0.025em` (tight) dan line-height seimbang. Berat font judul maksimal Semi-Bold (`font-semibold` / 600), hindari font Ultra-Bold/Black yang berat sebelah.
- **Body & Data**: Inter atau Geist Sans dengan tracking neutral.
- **Data Angka, Ukuran Berkas, & Kuota**: Gunakan JetBrains Mono atau font tabular numbers (`tabular-nums font-mono`) agar angka ukuran berkas seperti `24,476 Mb` atau `120Gb / 250Gb` tersusun rata secara vertikal.

### C. Color Rules & "LILA RULE"
- **The Lila Rule**: Aksen warna pastel atau lilac lembut hanya diizinkan untuk container ikon latar belakang atau kategori aktif (contoh: background kategori aktif soft purple `bg-purple-50 text-purple-600`), BUKAN untuk seluruh layar atau background utama.
- **Provider Brand Color Integrity**: Warna brand provider harus akurat dan berkarakter:
  - Dropbox: Pure Blue `#0061FE`
  - Google Drive: Characteristic Forest Green `#0F9D58` & Yellow `#F4B400`
  - Microsoft OneDrive: Corporate Blue `#0078D4`
  - MEGA: Deep Red `#D9272E`
  - pCloud: Clean Cyan `#00A3E0`
- **File Type Badging (Mengacu Referensi)**:
  - Folders / Documents: Purple-tinted badge (`bg-[#8B5CF6]/10 text-[#8B5CF6]`)
  - Video files (`.mp4`, `.mov`): Warm Amber/Orange (`bg-[#F97316]/10 text-[#F97316]`)
  - Audio/Music (`.mp3`, `.wav`): Emerald/Teal (`bg-[#10B981]/10 text-[#10B981]`)
  - PDF & Documents (`.pdf`, `.docx`): Cyan/Sky Blue (`bg-[#0EA5E9]/10 text-[#0EA5E9]`)
  - Images (`.jpg`, `.png`, `.fig`): Coral/Rose (`bg-[#F43F5E]/10 text-[#F43F5E]`)

### D. Layout Discipline & Layout Geometri
- **Header & Title Area**: Halaman File Manager wajib memiliki header tegas seperti gambar: Judul "File Manager" (font size 24px/28px, font-bold), sub-teks "Welcome to NexusDrive Admin Dashboard" berwarna slate-400, search input terintegrasi di top-right navbar beserta avatar dan badge notifikasi bulat.
- **Top Storage Cards Grid**: Baris 4-5 kartu horizontal yang simetris di bagian atas:
  - Menampilkan brand icon di kiri atas.
  - Label "Storage" kecil diikuti nama penyedia (misal "Dropbox", "Google Drive").
  - Angka kuota terpakai `120Gb / 250Gb` di kiri bawah.
  - Arc ring progress gauge (radial Recharts / SVG circle) di kanan kartu dengan stroke rounded.
- **Dual-Pane Body Architecture**:
  - Kolom kiri (Quick Access & Categories): Lebar tetap (~240px), berisi kategori berkas (All Files, Images, Video, Music, Document) dengan counter tag, diikuti oleh section "Go To Folders" dengan ikon folder berwarna ungu.
  - Kolom kanan (Main File Table): Breadcrumb di kiri atas (`Storage / Drive A / Library`), search lokal, filter dropdown "Recent", dan toggle List/Grid view di kanan atas.
- **Tabel Desain**: Baris tabel berjarak rapi (padding vertikal `py-3.5`), borderless atau single border horizontal tipis, aksi hover dengan highlight halus (`hover:bg-[#F9FAFD]`), dan checkbox pilihan item di paling kiri.

### E. Interactive States & Accessibility
- **Skeleton Loaders**: Wajib mencerminkan geometri DOM persis. Jangan gunakan spinner global yang menutup layar. Gunakan shimmering skeleton baris per baris.
- **Focus States**: Seluruh elemen interaktif wajib mendukung keyboard navigation dengan ring fokus tegas (`focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1`).

### F. Forbidden AI Patterns & AI Tells
- **DILARANG MENGGUNAKAN EM-DASH (`—`)** di dalam teks antarmuka, copywriting marketing, placeholder, atau tooltip. Gunakan pemisah tanda titik (`•`), kurung, atau kalimat terstruktur.
- **Dilarang Copywriting AI Generik**: Hindari kata-kata seperti "Unlock your true productivity", "Seamless experience", "Revolutionize your workflow". Gunakan copy fungsional dan langsung pada sasaran (contoh: "5 akun cloud terhubung • 1.2 TB kuota tersedia").
- **Dilarang Bentuk Geometris Mengambang**: Tidak ada blob gradient dekoratif acak di latar belakang yang mengganggu keterbacaan data tabel.

---

## 11. SECURITY & INTEGRITY REQUIREMENTS

1. **Token Vault Security**: Master encryption key `ENCRYPTION_MASTER_KEY_HEX` hanya boleh diinjeksi melalui environment variables server-side dan tidak boleh dikomit ke repository atau dikirimkan ke layer client bundle.
2. **SSRF (Server-Side Request Forgery) Prevention**: Endpoint proxy stream (`api/files/stream`) wajib memvalidasi bahwa URL target download berasal dari domain whitelist provider terverifikasi (e.g. `*.googleusercontent.com`, `*.dropboxapi.com`, `*.blob.core.windows.net`, `*.pcloud.com`).
3. **MIME-Type & Extension Sanitization**: Semua metadata file yang diunggah harus dibersihkan dari karakter berbahaya (null bytes, path traversal `../`).
4. **Rate Limiting**: Lindungi Server Actions dan Route Handlers dengan Upstash Redis Rate Limiting (100 request/menit untuk API eksplorasi berkas, 20 request/menit untuk endpoint autentikasi vault).
5. **CSRF Protection**: Semua alur OAuth connect mewajibkan pengecekan random crypto state token yang disimpan di encrypted session cookie.

---

## 12. DEVELOPMENT RULES & PHASE GATES

> **ATURAN MUTLAK KODING AGENT:**
> 1. Pahami bahwa Anda bekerja secara modular dan terukur.
> 2. **Setiap Fase Wajib Diverifikasi:**
>    - Jalankan `pnpm build` atau `npm run build` (wajib lulus 100%).
>    - Jalankan `pnpm tsc --noEmit` (0 type errors).
>    - Jalankan unit/integration test terkait fase tersebut.
> 3. **STRICT PHASE GATE:** Jika sebuah fase menghasilkan galat, dilarang keras melompat ke fase selanjutnya. Perbaiki galat tersebut hingga tuntas.

---

## 13. STEP-BY-STEP IMPLEMENTATION SEQUENCE

```
FASE 1: Setup Proyek, Skema Database, Auth & Vault Kredensial (P0)
   │  [GATE: Database migrasi terpasang, Vault AES-256-GCM lulus unit test, Auth session aktif]
   ▼
FASE 2: Unified Provider Engine & Koneksi 5 Akun Cloud (P0)
   │  [GATE: 5 Provider berhasil terhubung, token tersimpan di vault, kuota berhasil ditarik]
   ▼
FASE 3: Streaming Engine, Cloudflare R2 Buffer & Operasi File API (P0)
   │  [GATE: Streaming upload & download sukses tanpa error memory leak]
   ▼
FASE 4: Dashboard UI, Storage Gauges & File Explorer Berbasis Tabel (P0)
   │  [GATE: UI sesuai referensi visual, TanStack Table responsif, operasi rename/delete berfungsi]
   ▼
FASE 5: Background Worker, Antarmuka Transfer & Sinkronisasi (P1)
   │  [GATE: BullMQ worker memproses pemindahan file lintas-provider di background]
   ▼
FASE 6: Landing Page Kreator & Onboarding Tour 2-Menit (P1)
   │  [GATE: Landing page responsif, tour interaktif memandu koneksi 2 akun pertama]
   ▼
FASE 7: AI Auto-Tagging & Semantic File Search (P2)
   │  [GATE: Ekstraksi tag via OpenAI dan semantic search vector berfungsi pada file cache]
   ▼
FASE 8: Hardening Keamanan, E2E Testing, & Persiapan Produksi
   │  [GATE: Playwright E2E passing, security check lolos, build bundle teroptimasi]
```

### Detil Eksekusi Per Fase:

#### FASE 1: Foundation, Database, Core Auth & Encryption Vault (P0)
1. Inisialisasi workspace monorepo / multi-app dengan Next.js 15, TypeScript strict mode, Tailwind CSS, dan shadcn/ui.
2. Siapkan koneksi Supabase PostgreSQL dan jalankan migrasi SQL skema tabel: `profiles`, `connected_accounts`, `credential_vault`, `file_items`, `transfer_jobs`, `sync_schedules`. Pasang RLS policies lengkap.
3. Buat modul kriptografi `packages/core/src/crypto/vault.ts` dengan cipher `aes-256-gcm`. Buat test suite Jest/Vitest untuk memastikan fungsi `encryptSecret` dan `decryptSecret` bekerja bolak-balik tanpa kegagalan integritas auth tag.
4. Implementasikan Auth.js v5 dengan login credentials dan adapter PostgreSQL.
5. **VERIFIKASI GERBANG FASE 1**:
   - `npm run test` (suite vault encryption lulus 100%).
   - `npm run lint` & `tsc --noEmit` lulus bersih.
   - User dapat login dan session tersimpan di cookie.

#### FASE 2: Universal Storage Provider Engine & Koneksi 5 Cloud Provider (P0)
1. Definisikan interface `IStorageProvider` pada `packages/core/src/providers/base.interface.ts`.
2. Implementasikan masing-masing adapter provider:
   - `GoogleDriveProvider`: integrasi `googleapis` v3.
   - `DropboxProvider`: integrasi `dropbox` v2 SDK.
   - `OneDriveProvider`: integrasi `@microsoft/microsoft-graph-client`.
   - `MegaProvider`: integrasi `megajs`.
   - `PCloudProvider`: integrasi pCloud REST client.
3. Buat OAuth connection Route Handlers:
   - `/api/oauth/[provider]/connect`: Generate redirect URL dengan state terenkripsi.
   - `/api/oauth/[provider]/callback`: Validasi state, pertukaran token, enkripsi token via vault, dan penyimpanan ke tabel `connected_accounts` & `credential_vault`.
4. Buat dialog modal form untuk input kredensial MEGA (email/password/master key) dan API token pCloud dengan fungsi validasi koneksi sebelum disimpan.
5. Buat API endpoint `/api/accounts` (GET untuk list akun terhubung, DELETE untuk revokasi akun).
6. **VERIFIKASI GERBANG FASE 2**:
   - Hubungkan akun uji coba untuk kelima provider (atau mock OAuth endpoints).
   - Pastikan pemanggilan `getQuota()` berhasil mengembalikan angka real total dan used bytes untuk masing-masing provider.
   - Tidak ada token mentah di database.

#### FASE 3: Streaming Engine, Cloudflare R2 Buffer & Operasi File API (P0)
1. Konfigurasikan client Cloudflare R2 menggunakan `@aws-sdk/client-s3` di `packages/core/src/r2`.
2. Buat endpoint Route Handler streaming upload `/api/files/upload`:
   - Tangani multipart stream dengan Node.js stream pipeline.
   - Gunakan Cloudflare R2 bucket buffer untuk buffering berkas berukuran besar sebelum dialirkan ke provider target.
3. Buat endpoint Route Handler streaming download `/api/files/stream`:
   - Menerima `accountId` dan `fileId`.
   - Menghubungi provider terkait, mengambil readable stream, dan langsung mem-piping ke klien dengan header stream yang tepat.
4. Implementasikan operasi file universal di Route Handlers:
   - POST `/api/files/folder`: Membuat folder baru.
   - PATCH `/api/files/rename`: Mengganti nama berkas/folder.
   - DELETE `/api/files/delete`: Menghapus berkas/folder dari provider dan membersihkan cache database.
5. Buat cache synchronization routine untuk mengindeks daftar berkas awal ke tabel `file_items`.
6. **VERIFIKASI GERBANG FASE 3**:
   - Jalankan uji coba streaming: Upload berkas 50MB ke Google Drive via R2 buffer tanpa memory leak (pantau memory footprint heap < 120MB).
   - Download berkas berjalan mulus dengan progress terprediksi.

#### FASE 4: Dashboard UI, Storage Gauges & File Explorer Berbasis Tabel (P0)
1. Terapkan Layout Dashboard sesuai referensi gambar:
   - **Top Storage Cards**: 5 kartu penyimpanan dengan nama provider, logo resmi, indikator kuota `used / total`, dan radial progress gauge (Recharts / SVG ring gauge) dengan warna masing-masing brand.
   - **Left Sidebar**: Logo NexusDrive, menu navigasi utama, kategori berkas (All Files, Images, Video, Music, Document) dengan counter dinamis dan ikon berwarna, serta sub-menu "Go To Folders".
   - **Header Section**: Search bar global, status koneksi akun, avatar profil pengguna, dan tombol aksi "Connect Account" / "Upload File".
2. Bangun komponen utama File Explorer (berbasis TanStack Table):
   - Kolom: File Name (dengan ikon tipe berkas sesuai aturan desain), File Items/Count, Last Modified, File Size (`tabular-nums font-mono`), dan Tombol Aksi menu dropdown (`...`).
   - Breadcrumb interaktif di atas tabel (`Storage / [Provider] / [Folder]`).
   - List & Grid view toggle switcher.
   - Filter dropdown "Recent", "Name", "Size".
3. Hubungkan TanStack Query dengan endpoint backend untuk query folder hierarkis dan operasi berkas.
4. Pasang skeleton shimmer loading states yang presisi dengan dimensi tabel.
5. **VERIFIKASI GERBANG FASE 4**:
   - Tampilan visual identik dengan arsitektur referensi visual terlampir.
   - Navigasi folder berjalan tanpa reload halaman penuh.
   - Rename, delete, dan open folder berjalan mulus dengan optimistic updates atau instant cache invalidation.
   - **MILESTONE P0 TERCAPAI: Aplikasi MVP siap digunakan untuk pengelolaan file harian.**

#### FASE 5: Background Worker, Antarmuka Transfer & Sinkronisasi (P1)
1. Setup package `apps/worker` dengan TypeScript dan BullMQ terhubung ke Redis.
2. Buat antrean `cross-cloud-transfers`:
   - Worker mengunduh berkas dari Source Provider via streaming.
   - Worker mengunggah stream tersebut langsung ke Target Provider.
   - Worker mengupdate persentase progress ke Redis / Supabase `transfer_jobs` secara berkala (tiap 5% chunk).
3. Buat antrean `folder-mirror-sync`:
   - Memindai perbedaan pohon direktori antara folder sumber dan folder target.
   - Mengantrekan job transfer untuk setiap berkas baru atau berkas yang waktu modifikasinya lebih baru.
4. Buat komponen UI "Transfer Center" (Drawer atau Floating Manager di kanan bawah):
   - Menampilkan daftar transfer aktif, kecepatan transfer, sisa waktu estimasi, dan progress bar.
   - Tombol batal / pause transfer.
5. Buat antarmuka pembuatan jadwal sinkronisasi cron pada halaman Settings/Transfers.
6. **VERIFIKASI GERBANG FASE 5**:
   - Lakukan pengujian pemindahan file 100MB dari Dropbox ke Google Drive melalui BullMQ worker.
   - Status di database berpindah dari `pending` -> `processing` -> `completed`.
   - File target muncul di Google Drive dan terbaca pada sistem explorer.

#### FASE 6: Landing Page Kreator & Onboarding Tour 2-Menit (P1)
1. Kembangkan Landing Page interaktif pada `apps/web/app/(marketing)/page.tsx`:
   - Hero section berorientasi kreator: "Semua Cloud Storage Anda dalam Satu Kendali Bersih".
   - Pratinjau interaktif File Manager langsung di halaman depan.
   - Storage Saver Calculator: Slider interaktif untuk menghitung kapasitas gabungan gratis dari 5 provider (hingga 50GB+ gratis tanpa bayar biaya langganan tier tinggi).
   - Clean pricing table & FAQ.
2. Kembangkan Onboarding Wizard (`/onboarding`):
   - Alur 3 langkah interaktif: 1) Sambungkan akun pertama, 2) Sambungkan akun kedua, 3) Jelajahi dashboard gabungan.
   - Dilengkapi panduan visual dan target waktu penyelesaian <2 menit untuk mendorong aktivasi pengguna baru.
3. **VERIFIKASI GERBANG FASE 6**:
   - Skor Lighthouse Performance & SEO pada Landing Page > 90.
   - Alur onboarding dapat diselesaikan dan menandai flag `onboarding_completed: true` pada profil pengguna.

#### FASE 7: AI Auto-Tagging & Semantic File Search (P2)
1. Pasang ekstensi `vector` pada Supabase PostgreSQL dan buat index HNSW pada kolom `embedding` di tabel `file_items`.
2. Buat worker processor `aiTaggingProcessor`:
   - Mengekstrak nama berkas dan metadata.
   - Memanggil OpenAI `gpt-4o-mini` dengan JSON structured outputs untuk menghasilkan 3-5 tag kontekstual (contoh: jenis berkas, tujuan, topik).
   - Memanggil OpenAI `text-embedding-3-small` untuk menghasilkan vektor 1536 dimensi dan menyimpannya di kolom `embedding`.
3. Buat Route Handler semantic search `/api/files/semantic-search`:
   - Mengubah kueri pengguna menjadi vector embedding.
   - Menjalankan fungsi similarity search PostgreSQL:
     ```sql
     SELECT id, name, provider, 1 - (embedding <=> query_embedding) AS similarity
     FROM file_items
     WHERE user_id = current_user_id AND 1 - (embedding <=> query_embedding) > 0.65
     ORDER BY similarity DESC LIMIT 20;
     ```
4. Perbarui input search bar pada UI untuk mendukung toggle: "Standard Filter" vs "AI Semantic Search".
5. **VERIFIKASI GERBANG FASE 7**:
   - Pencarian dengan kalimat deskriptif (misal: "materi presentasi desain") berhasil menampilkan dokumen `.pdf` atau `.pptx` terkait meskipun nama file tidak memuat kata kunci persis.

#### FASE 8: Hardening Keamanan, E2E Testing, & Peluncuran
1. Tulis End-to-End tests menggunakan Playwright:
   - Alur login & proteksi rute.
   - Rendering dashboard storage cards.
   - Navigasi file table dan eksekusi pencarian.
2. Lakukan audit keamanan:
   - Sanitasi SSRF pada semua download proxy.
   - Pengetatan Content Security Policy (CSP) headers di `next.config.mjs`.
   - Verifikasi isolasi multi-tenant RLS Supabase.
3. Optimasi build production:
   - Pastikan code splitting bekerja efektif, dynamic import untuk modul berat (Recharts).
   - Verifikasi image optimization untuk logo dan icon provider.
4. **VERIFIKASI GERBANG FASE 8**:
   - Playwright test suite 100% passing.
   - `npm run build` sukses tanpa warning kritis.
   - Dokumentasi runtime dan env sample tersedia lengkap.

---

## 14. TESTING & VERIFICATION REQUIREMENTS

| Tipe Uji | Scope & Target | Tools | Kriteria Lolos |
| :--- | :--- | :--- | :--- |
| **Unit Test** | Kriptografi AES-256-GCM, Token refresh logic, Parser path direktori | Vitest / Jest | 100% coverage pada `packages/core/src/crypto` |
| **Integration Test** | Universal Provider Abstraction, Supabase RLS Policies | Vitest, Testcontainers Postgres | Operasi DB tertolak jika `user_id` tidak cocok |
| **Streaming Test** | Buffer Cloudflare R2, Upload/Download Stream pipelines | Node.js Test Runner | Memory heap stabil, tidak ada stream termination premature |
| **E2E Test** | Auth flow, File Explorer navigation, Modal transfer, Layout checks | Playwright | Seluruh user flows P0 & P1 sukses di Chromium & WebKit |
| **Lint & Typecheck** | Strict TypeScript check seluruh workspace | `tsc --noEmit`, ESLint | 0 errors, 0 warnings bertipe `any` eksplisit |

---

## 15. ACCEPTANCE CRITERIA (CHECKLIST SELESAI PROYEK)

- [ ] Pengguna dapat mendaftar dan login dengan aman.
- [ ] Berhasil menghubungkan akun Google Drive, Dropbox, OneDrive via OAuth2 resmi.
- [ ] Berhasil menghubungkan akun MEGA dan pCloud via kredensial aman.
- [ ] Seluruh token dan kunci API tersimpan di database dalam format terenkripsi AES-256-GCM.
- [ ] Dashboard menampilkan 5 kartu kapasitas penyimpanan dengan radial gauge akurat sesuai referensi gambar.
- [ ] Kategori Quick Access (All Files, Images, Video, Music, Document) menyaring data dengan benar.
- [ ] File Explorer (TanStack Table) mampu menampilkan berkas gabungan, navigasi folder hierarkis, search, rename, delete, dan download stream langsung.
- [ ] Fitur upload mendukung multi-file streaming dengan indikator progress visual.
- [ ] Background worker BullMQ berhasil memproses pemindahan file antar-cloud di server terisolasi.
- [ ] UI sepenuhnya responsif, bersih, berkelas profesional, menerapkan aturan tipografi, bebas dari pola desain "AI Slop", dan tanpa karakter em-dash pada antarmuka.
- [ ] Seluruh Phase Gates (Fase 1 hingga 8) telah dijalankan dan lulus verifikasi secara berurutan.

---

## 16. FINAL DELIVERABLES

1. **Source Code Repository Penuh**: Monorepo terstruktur rapi (`apps/web`, `apps/worker`, `packages/core`, `packages/database`, `packages/ui`).
2. **Database Migrations & Seed**: File migrasi SQL Supabase lengkap dengan skema, extensions, indeks vector, dan RLS security policies.
3. **Konfigurasi Lingkungan (`.env.example`)**: Template lengkap seluruh variabel environment (kunci Supabase, Auth secret, Master Encryption Key 256-bit, Cloudflare R2 credentials, Redis URI, dan API keys masing-masing provider).
4. **Dockerfile & Container Specs**: Dockerfile siap pakai untuk menjalankan BullMQ background worker di Railway atau Fly.io.
5. **Comprehensive Test Suites**: Unit tests, integration tests, dan skrip automated Playwright E2E tests.

---
*Mulai eksekusi dari FASE 1 sekarang. Jangan melompat ke fase selanjutnya sebelum seluruh gerbang verifikasi Fase 1 terbukti hijau.*