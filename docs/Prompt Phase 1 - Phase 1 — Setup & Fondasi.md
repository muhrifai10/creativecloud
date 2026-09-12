# Prompt Phase 1: Setup & Fondasi

## Konteks Proyek & Tech Stack
Anda adalah lead engineer yang membangun aplikasi web SaaS Cloud Drive Multi-Provider. Aplikasi ini memungkinkan freelancer dan kreator konten mengelola berbagai penyedia cloud storage (Google Drive, Dropbox, OneDrive, MEGA, pCloud) dari satu dashboard terpadu.

Tech Stack:
- Frontend: Next.js (App Router), Tailwind CSS, shadcn/ui, TanStack Query & Table, Lucide React, recharts
- Backend: Next.js Server Actions & Route Handlers + Dedicated Node.js (TypeScript) BullMQ Worker Service
- Database: Supabase (PostgreSQL) dengan pgvector
- Auth & Vault: Auth.js (NextAuth) dengan AES-256-GCM encrypted token vault
- Storage & Cache: Cloudflare R2 (buffer transfer & thumbnail cache)
- Other: BullMQ, Redis, Zod

## Fitur Fase Ini
Fase ini mencakup inisialisasi fondasi arsitektur proyek:
1. Scaffolding repositori Next.js App Router dengan TypeScript, Tailwind CSS, dan struktur monorepo/folder modular untuk web app dan dedicated background worker.
2. Konfigurasi linting, formatting (ESLint, Prettier), dan strict TypeScript checking.
3. Setup skema basis data dasar di Supabase (tabel `users`, `accounts`, `cloud_connections`, `files_cache`, `sync_jobs`, `activity_logs`).
4. Konfigurasi autentikasi dasar Auth.js dan modul enkripsi kriptografi AES-256-GCM untuk penyimpanan kredensial.
5. Inisialisasi koneksi Cloudflare R2 client (S3 SDK v3 compatible) dan Redis client untuk antrean BullMQ.
6. Setup fondasi UI berbasis shadcn/ui dan layout dashboard dasar (sidebar navigation shell, header, content area) responsif.

## Kriteria Keberimaan (Acceptance Criteria)
1. Repositori berhasil dikompilasi tanpa error menggunakan perintah `npm run build` / `pnpm build`.
2. Konfigurasi file `.env.example` mencakup seluruh variabel: Supabase URL/keys, Auth secret, Encryption secret (32 bytes hex), Cloudflare R2 credentials, dan Redis URL.
3. Modul kriptografi AES-256-GCM terbukti lolos unit test mandiri untuk proses enkripsi dan dekripsi string kredensial.
4. Klien Supabase, Cloudflare R2, dan Redis dapat melakukan ping/koneksi tanpa crash saat runtime.
5. Layout dasar shell dashboard (sidebar, header, content viewport min-h-[100dvh]) dapat dirender di browser dengan navigasi rute `/dashboard`.

## Batasan Pengerjaan
Implementasikan HANYA fondasi proyek, konfigurasi sistem, dan shell dasar di atas. Jangan mengimplementasikan logika integrasi OAuth cloud provider, file manager, background sync, atau fitur AI pada fase ini.

Fase ini harus lolos `typecheck`, `lint`, dan `build` sebelum melanjutkan ke fase berikutnya.

## Frontend Design Taste Rules
- Anti-Default Discipline: Jangan gunakan gradien AI-purple, hindari background hero terpusat di atas dark mesh, jangan buat kartu fitur kembar tiga yang membosankan, dan tolak generic glassmorphism.
- Typography: Gunakan font bernuansa modern dan clean seperti Plus Jakarta Sans atau Geist Sans. Jangan gunakan Inter sebagai default. Font serif dan Fraunces/Instrument Serif dilarang keras.
- Color: Maksimal 1 warna aksen utama (misal: deep cobalt `#1d4ed8` atau slate blue). Patuhi aturan LILA: dilarang menggunakan AI-purple atau blue glow default. Hindari palet warna jenuh berlebihan.
- Layout: Shell layout wajib menggunakan `min-h-[100dvh]` (bukan `h-screen`). Navigasi sidebar terstruktur rapi dengan status aktif yang jelas.
- Content: Gunakan tanda hubung hyphen (-) dan dilarang keras menggunakan em-dash (—). Jangan gunakan nama generik seperti John Doe. Hindari kata-kata klise seperti Elevate atau Unleash.
- Accessibility: Pastikan kontras teks dan tombol memenuhi standar WCAG AA serta mendukung preferensi reduced motion.