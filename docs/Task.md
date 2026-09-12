# Task.md: SaaS Cloud Drive Multi-Provider

Dokumen rencana kerja terstruktur untuk pengembangan aplikasi SaaS Cloud Drive Multi-Provider dari nol. Rencana ini mengacu pada fitur utama (P0, P1, P2) dan tata letak dasbor modern minimalis sesuai referensi visual (sidebar navigation, individual storage gauge cards, quick access categories, dan unified file explorer table).

---

## Fase 1: Setup & Inisialisasi Proyek

- [ ] **TASK-101: Inisialisasi Monorepo & Base Web Project**
  - **Prioritas**: P0
  - **Dependensi**: Tidak ada
  - **Kriteria Penerimaan**:
    - Repository Next.js 15 (App Router) terpasang dengan TypeScript, Tailwind CSS, ESLint, dan Prettier.
    - Struktur monorepo/folder terpisah disiapkan untuk aplikasi web (`apps/web`) dan background worker (`apps/worker`).
    - Environment variables terstandarisasi (`.env.example` terdokumentasi lengkap).
  - **Status**: todo

- [ ] **TASK-102: Setup Skema Database Supabase & Relational Models**
  - **Prioritas**: P0
  - **Dependensi**: TASK-101
  - **Kriteria Penerimaan**:
    - Instance Supabase PostgreSQL terkonfigurasi dengan ekstensi `pgcrypto` dan `vector` (opsional untuk AI).
    - Tabel utama dibuat: `users`, `cloud_accounts`, `vault_tokens`, `file_metadata_cache`, `sync_jobs`, `activity_logs`.
    - Skema migrasi Prisma/Drizzle berhasil dijalankan dan skrip seed awal tervalidasi.
  - **Status**: todo

- [ ] **TASK-103: Konfigurasi Cloudflare R2 Buffer & Bucket Storage**
  - **Prioritas**: P0
  - **Dependensi**: TASK-101
  - **Kriteria Penerimaan**:
    - Bucket Cloudflare R2 terkonfigurasi via S3-compatible SDK (`@aws-sdk/client-s3`).
    - Lifecycle policy diatur untuk membersihkan file buffer sementara setelah 24 jam.
    - Helper utilitas upload, download stream, dan signed URL berfungsi di environment lokal.
  - **Status**: todo

- [ ] **TASK-104: Setup Redis & Dedicated Worker Scaffolding (BullMQ)**
  - **Prioritas**: P0
  - **Dependensi**: TASK-101
  - **Kriteria Penerimaan**:
    - Redis instance terhubung ke modul Node.js worker TypeScript menggunakan BullMQ.
    - Antrean dasar (`file-transfers`, `folder-sync`, `metadata-scan`) terinisialisasi.
    - Script health-check worker berjalan normal di environment Node.js lokal.
  - **Status**: todo

---

## Fase 2: Core Architecture & Design System

- [ ] **TASK-201: Setup Design System & Komponen shadcn/ui**
  - **Prioritas**: P0
  - **Dependensi**: TASK-101
  - **Kriteria Penerimaan**:
    - shadcn/ui terpasang dengan tema modern, clean, dan profesional (warna neutral/slate dengan aksen indigo/violet).
    - Komponen inti siap pakai: Button, Dialog, DropdownMenu, Table, Progress, Tooltip, Input, Badge, Sheet, ContextMenu.
    - Ikonografi standar Lucide React terintegrasi.
  - **Status**: todo

- [ ] **TASK-202: Layout Dasbor SaaS Modern (Sidebar & Header Navigasi)**
  - **Prioritas**: P0
  - **Dependensi**: TASK-201
  - **Kriteria Penerimaan**:
    - Sidebar responsif sesuai referensi (Dashboard, File Manager, Email/Notifikasi, Pengaturan Akun).
    - Header global memiliki search input universal, indikator notifikasi transfer, dan avatar profile dropdown.
    - Dukungan collapsible sidebar untuk tampilan mobile dan tablet.
  - **Status**: todo

- [ ] **TASK-203: Implementasi AES-256-GCM Token Vault Engine**
  - **Prioritas**: P0
  - **Dependensi**: TASK-102
  - **Kriteria Penerimaan**:
    - Modul enkripsi dua arah berbasis `crypto` Node.js menggunakan AES-256-GCM dengan master encryption key yang aman.
    - Token OAuth (access token, refresh token) serta kredensial akun disimpan ke tabel `vault_tokens` dalam format ciphertext terenkripsi bersama IV dan Auth Tag.
    - Fungsi helper dekripsi aman tervalidasi dengan unit test (100% pass).
  - **Status**: todo

- [ ] **TASK-204: Abstraksi Unified Cloud Storage Adapter (Interface Pattern)**
  - **Prioritas**: P0
  - **Dependensi**: TASK-101
  - **Kriteria Penerimaan**:
    - Antarmuka TypeScript `CloudStorageProvider` didefinisikan secara baku mencakup method: `getQuota()`, `listFiles()`, `uploadStream()`, `downloadStream()`, `deleteFile()`, `renameFile()`, `createFolder()`.
    - Normalisasi skema data file/folder universal (id, name, size, mimeType, modifiedTime, providerType, providerAccountId, thumbnailLink, webViewLink).
  - **Status**: todo

---

## Fase 3: MVP Features (P0)

### 3.1 Autentikasi Pengguna & Integrasi Multi-Provider

- [ ] **TASK-301: Autentikasi Pengguna Utama (Auth.js / NextAuth)**
  - **Prioritas**: P0
  - **Dependensi**: TASK-102, TASK-203
  - **Kriteria Penerimaan**:
    - Alur login & registrasi email/password dan Google OAuth untuk akun SaaS utama.
    - Session JWT aman dengan perlindungan HTTP-only cookie dan middleware proteksi route `/dashboard/*`.
  - **Status**: todo

- [ ] **TASK-302: Token Lifecycle & Auto-Refresh Manager**
  - **Prioritas**: P0
  - **Dependensi**: TASK-203, TASK-301
  - **Kriteria Penerimaan**:
    - Service background otomatis memeriksa waktu kedaluwarsa (`expires_at`) token OAuth sebelum request API dijalankan.
    - Mekanisme refresh token otomatis menyimpan token baru kembali ke Token Vault AES-256-GCM tanpa interupsi pengguna.
  - **Status**: todo

- [ ] **TASK-303: Integrasi OAuth2 Cloud: Google Drive, Dropbox, & OneDrive**
  - **Prioritas**: P0
  - **Dependensi**: TASK-204, TASK-302
  - **Kriteria Penerimaan**:
    - Alur integrasi OAuth2 multi-tenant untuk menghubungkan akun Google Drive, Dropbox, dan Microsoft OneDrive.
    - Penyimpanan token ke vault dan penyimpanan data akun (nama display, email, kuota) ke tabel `cloud_accounts`.
    - Implementasi adapter konkret `GoogleDriveAdapter`, `DropboxAdapter`, dan `OneDriveAdapter`.
  - **Status**: todo

- [ ] **TASK-304: Integrasi Kredensial API: MEGA & pCloud**
  - **Prioritas**: P0
  - **Dependensi**: TASK-204, TASK-203
  - **Kriteria Penerimaan**:
    - Formulir modal aman untuk input kredensial (API Key / email-password) MEGA dan pCloud.
    - Implementasi adapter konkret `MegaStorageAdapter` dan `PCloudStorageAdapter`.
    - Validasi koneksi langsung (*connection handshake*) sebelum akun dinyatakan aktif.
  - **Status**: todo

- [ ] **TASK-305: UI Manajemen Koneksi Akun Cloud (Account Manager)**
  - **Prioritas**: P0
  - **Dependensi**: TASK-303, TASK-304
  - **Kriteria Penerimaan**:
    - Halaman daftar akun terhubung dengan status badge (Active, Expired, Re-authenticate).
    - Tombol "Hubungkan Akun Baru" dengan pilihan 5 cloud provider.
    - Aksi Disconnect/Revoke yang menghapus token dari vault dan membersihkan cache metadata terkait.
  - **Status**: todo

### 3.2 Dashboard Analitik & Visualisasi Storage

- [ ] **TASK-306: Komponen Radial Gauge & Card Kapasitas Cloud Per-Provider**
  - **Prioritas**: P0
  - **Dependensi**: TASK-201, TASK-204
  - **Kriteria Penerimaan**:
    - Kartu penyimpanan individual per provider (Dropbox, Google Drive, OneDrive, MEGA, pCloud) sesuai referensi visual.
    - Tiap kartu memuat logo provider, nama provider, teks kapasitas terpakai dan total (contoh: `120Gb / 250Gb`), serta radial progress gauge (Recharts).
    - Warna indikator gauge dinamis (biru/hijau untuk normal, kuning >80%, merah >90%).
  - **Status**: todo

- [ ] **TASK-307: Statistik Total Penyimpanan Agregat & Quick Metrics**
  - **Prioritas**: P0
  - **Dependensi**: TASK-306
  - **Kriteria Penerimaan**:
    - Card statistik agregat di atas explorer yang menampilkan: Total Kapasitas Semua Akun, Total Storage Terpakai, dan Total Ruang Bebas.
    - TanStack Query hook dengan auto-cache invalidation saat berkas bertambah atau berkurang.
  - **Status**: todo

### 3.3 File Manager Terpadu Lintas Provider

- [ ] **TASK-308: Unified File Explorer UI (TanStack Table & Grid View)**
  - **Prioritas**: P0
  - **Dependensi**: TASK-201, TASK-204
  - **Kriteria Penerimaan**:
    - Tampilan berkas berbasis TanStack Table dengan kolom: Ikon Berkas/Folder, Nama File, Jumlah Item (jika folder), Last Modified, File Size, Provider Tag, dan Menu Aksi (`...`).
    - Tombol toggle untuk beralih antara List View dan Grid/Thumbnail View.
    - Breadcrumb interaktif yang mencerminkan navigasi path (contoh: `Storage / Google Drive / Project Assets`).
  - **Status**: todo

- [ ] **TASK-309: Navigasi Quick Access & Kategori Format File**
  - **Prioritas**: P0
  - **Dependensi**: TASK-308
  - **Kriteria Penerimaan**:
    - Sidebar panel filter kategori sesuai referensi visual: "All Files", "Images", "Video", "Music", "Document".
    - Filter kategori langsung menyaring berkas lintas provider berdasarkan MIME type tanpa memedulikan lokasi folder fisik.
    - Section "Go To Folders" untuk pin folder penting / favorit.
  - **Status**: todo

- [ ] **TASK-310: Pencarian & Penyaringan Berkas Lintas Cloud**
  - **Prioritas**: P0
  - **Dependensi**: TASK-308
  - **Kriteria Penerimaan**:
    - Input pencarian cepat di header file manager dengan debounce (300ms).
    - Filter berdasarkan Provider (semua atau spesifik 1 akun), rentang tanggal modifikasi, dan ukuran file.
    - Menampilkan hasil pencarian terpadu dari 5 cloud provider secara serempak.
  - **Status**: todo

- [ ] **TASK-311: Menu Aksi Berkas (Context Menu, Rename, Delete, Folder Management)**
  - **Prioritas**: P0
  - **Dependensi**: TASK-308
  - **Kriteria Penerimaan**:
    - Context menu (klik kanan) dan tombol menu tiga titik (`...`) pada baris tabel file.
    - Dialog Rename dengan validasi nama file sesuai ketentuan cloud provider tujuan.
    - Operasi Delete dengan konfirmasi modal, mengarahkan ke Trash provider atau soft delete.
    - Dialog "New Folder" yang dapat membuat direktori baru pada provider yang dipilih.
  - **Status**: todo

### 3.4 Engine Operasi & Streaming Berkas

- [ ] **TASK-312: Engine Streaming Upload via Cloudflare R2 Buffer Pipeline**
  - **Prioritas**: P0
  - **Dependensi**: TASK-103, TASK-204
  - **Kriteria Penerimaan**:
    - Upload endpoint menangani chunked multipart upload browser ke Cloudflare R2 secara temporer.
    - Stream pipeline Node.js meneruskan file dari R2 langsung ke API provider tujuan tanpa membebani memori RAM server Next.js.
    - Progress bar upload real-time pada UI klien.
  - **Status**: todo

- [ ] **TASK-313: Direct & Proxy Download Streaming Engine**
  - **Prioritas**: P0
  - **Dependensi**: TASK-204
  - **Kriteria Penerimaan**:
    - Endpoint download otomatis mengalihkan (redirect) ke direct temporary download URL dari cloud provider jika didukung (Dropbox, Google Drive).
    - Proxy streaming fallback menggunakan Node.js stream pipeline untuk provider yang membutuhkan autentikasi header khusus.
    - Dukungan resumeable download dengan header `Accept-Ranges: bytes`.
  - **Status**: todo

- [ ] **TASK-314: Thumbnail & Image Preview Caching via Cloudflare R2**
  - **Prioritas**: P0
  - **Dependensi**: TASK-103, TASK-308
  - **Kriteria Penerimaan**:
    - Worker route mengambil thumbnail berkas gambar/dokumen dari API cloud provider dan menyimpannya di Cloudflare R2 cache.
    - Layanan melayani preview gambar berukuran optimal ke UI File Manager tanpa request berulang ke cloud provider.
  - **Status**: todo

---

## Fase 4: Secondary Features (P1)

### 4.1 Sinkronisasi & Transfer Antar-Cloud (Worker Engine)

- [ ] **TASK-401: Pipeline Antrean Pemindahan Berkas BullMQ**
  - **Prioritas**: P1
  - **Dependensi**: TASK-104, TASK-312, TASK-313
  - **Kriteria Penerimaan**:
    - BullMQ job processor mengambil stream dari Source Cloud Provider dan mem-piping langsung ke Destination Cloud Provider.
    - Checkpoint chunk tersimpan di Redis untuk mendukung resume otomatis jika koneksi internet terputus di tengah proses transfer.
    - Logging detail riwayat transfer pada tabel `activity_logs`.
  - **Status**: todo

- [ ] **TASK-402: Fitur Sinkronisasi Folder Terjadwal & Mirroring**
  - **Prioritas**: P1
  - **Dependensi**: TASK-401
  - **Kriteria Penerimaan**:
    - Pengguna dapat memilih Source Folder di Cloud A dan Destination Folder di Cloud B dengan opsi: One-Way Mirror atau Two-Way Sync.
    - Opsi jadwal berkala menggunakan BullMQ Repeatable Jobs (Setiap Jam, Harian, atau Mingguan).
    - Logika deteksi konflik (menimpa file yang lebih baru atau membuat duplikat dengan timestamp).
  - **Status**: todo

- [ ] **TASK-403: UI Transfer Manager & Notification Activity Center**
  - **Prioritas**: P1
  - **Dependensi**: TASK-401, TASK-202
  - **Kriteria Penerimaan**:
    - Panel modal/drawer "Transfer Manager" menampilkan daftar antrean aktif, persentase progress, estimasi sisa waktu, dan tombol Cancel/Pause.
    - Badging angka proses transfer yang sedang berjalan di header navigasi.
    - Toast notification interaktif ketika proses transfer atau sinkronisasi selesai atau gagal.
  - **Status**: todo

### 4.2 Onboarding & Landing Page Konversi Kreator

- [ ] **TASK-404: Landing Page Interaktif Berorientasi Kreator & Freelancer**
  - **Prioritas**: P1
  - **Dependensi**: TASK-201
  - **Kriteria Penerimaan**:
    - Halaman depan modern dengan Hero section menarik, demo interaktif visual dashboard, perbandingan kendala manual vs terpadu, kalkulator penyimpanan multi-cloud, dan CTA pendaftaran.
    - Copywriting terfokus pada persona desainer, videografer, dan kreator konten.
    - Skor performa Lighthouse > 90 (Performance, Accessibility, SEO).
  - **Status**: todo

- [ ] **TASK-405: Alur Onboarding Interaktif 2-Menit (First-Run Tour)**
  - **Prioritas**: P1
  - **Dependensi**: TASK-305, TASK-404
  - **Kriteria Penerimaan**:
    - Panduan langkah-demi-langkah (step tour) saat pengguna baru pertama kali masuk: (1) Hubungkan cloud pertama, (2) Hubungkan cloud kedua, (3) Tinjau dashboard storage terpadu.
    - Checklist onboarding interaktif di dashboard dengan progress completion bar.
  - **Status**: todo

---

## Fase 5: Enhancement Features (P2)

### 5.1 AI Auto-Tagging & Semantic Search

- [ ] **TASK-501: Background Job Ekstraksi Metadata & OpenAI Tagging Engine**
  - **Prioritas**: P2
  - **Dependensi**: TASK-104, TASK-308
  - **Kriteria Penerimaan**:
    - Worker memicu OpenAI API (GPT-4o-mini / Vision) saat file gambar atau dokumen baru terdeteksi.
    - Menghasilkan 5-8 tag deskriptif yang relevan dan menyimpannya ke kolom `ai_tags` di `file_metadata_cache`.
    - Batasan rate limiting token OpenAI untuk menjaga efisiensi biaya.
  - **Status**: todo

- [ ] **TASK-502: Pencarian Semantik Lintas Cloud Berbasis Natural Language**
  - **Prioritas**: P2
  - **Dependensi**: TASK-501, TASK-310
  - **Kriteria Penerimaan**:
    - Input pencarian mendukung pertanyaan bahasa alami (contoh: "invoice bulan lalu", "foto produk sepatu warna merah").
    - Menghasilkan pencarian relevan berdasarkan vector embedding atau AI generated tags yang dicocokkan dengan deskripsi file.
    - UI menampilkan badge "AI Match" pada file hasil temuan semantik.
  - **Status**: todo

---

## Fase 6: Testing, Security Hardening & Polish

- [ ] **TASK-601: Security Audit Token Vault & OAuth Penetration Test**
  - **Prioritas**: P0
  - **Dependensi**: TASK-203, TASK-302, TASK-305
  - **Kriteria Penerimaan**:
    - Memastikan tidak ada plain text token yang tersimpan di log server, Supabase table, maupun browser local storage.
    - Uji penanganan token kedaluwarsa, race condition saat auto-refresh paralel, dan sanitasi input Zod di seluruh Route Handlers.
  - **Status**: todo

- [ ] **TASK-602: Load Testing & Streaming Stress Test**
  - **Prioritas**: P1
  - **Dependensi**: TASK-312, TASK-313, TASK-401
  - **Kriteria Penerimaan**:
    - Uji transfer file berukuran besar (>1 GB) antar cloud provider tanpa kebocoran memori (memory leak) pada Worker.
    - Memverifikasi kestabilan throughput transfer data dan fallback error handling saat provider mengalami throttling/rate limit.
  - **Status**: todo

- [ ] **TASK-603: End-to-End Testing (Playwright) Alur Kritis Pengguna**
  - **Prioritas**: P0
  - **Dependensi**: TASK-301, TASK-305, TASK-308, TASK-311
  - **Kriteria Penerimaan**:
    - Skenario E2E otomatis mencakup: Register -> Hubungkan Google Drive mock -> Buka File Manager -> Buat Folder -> Upload File -> Rename File -> Unduh File.
    - Seluruh skenario E2E berjalan mulus di CI pipeline (GitHub Actions).
  - **Status**: todo

- [ ] **TASK-604: Konfigurasi Deployment Produksi (Vercel & Railway/Fly.io)**
  - **Prioritas**: P0
  - **Dependensi**: TASK-601, TASK-603
  - **Kriteria Penerimaan**:
    - Next.js Web App dideploy di Vercel dengan domain kustom dan konfigurasi edge/headers yang optimal.
    - BullMQ Worker Service ter-containerize dengan Docker dan berjalan di Railway / Fly.io dengan auto-restart policy.
    - Alerting monitoring dan error tracking (Sentry) aktif di seluruh environment produksi.
  - **Status**: todo