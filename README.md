# NexusDrive

Multi-Provider Cloud Drive SaaS. Google Drive, Dropbox, OneDrive, MEGA, dan pCloud dalam satu dasbor.

## Struktur

```
apps/web              # Next.js 15 App Router (UI + Route Handlers)
packages/core         # Vault AES-256-GCM, (fase 2+) adapter provider, (fase 3+) R2
packages/database     # Prisma schema, seed, SQL migrasi Supabase + RLS
docker-compose.yml    # Postgres 16 + Redis 7 untuk dev lokal
```

## Menjalankan (dev lokal)

1. `docker compose up -d` (Postgres di port 5433 karena 5432 terpakai di mesin ini)
2. Salin kredensial ke `apps/web/.env` dan `packages/database/.env` (lihat `.env.example`; `ENCRYPTION_MASTER_KEY_HEX` = 64 hex, `AUTH_SECRET` = random base64 32 byte)
3. `pnpm install`
4. `pnpm db:push && pnpm db:seed` (akun demo: `demo@nexusdrive.test` / `Password123!`)
5. `pnpm dev`

## Perintah gerbang fase

```
pnpm test        # unit test (vault AES-256-GCM)
pnpm typecheck   # tsc --noEmit semua package
pnpm lint        # ESLint flat config
pnpm build       # next build
```

## Status Fase

- [x] FASE 1: Fondasi, database, Auth.js login/register, vault AES-256-GCM (gerbang hijau 2026-09-11)
- [x] FASE 2: Provider engine 5 adapter, OAuth connect/callback (state terenkripsi), credentials MEGA/pCloud, `/api/accounts`, auto-refresh token (gerbang hijau 2026-09-11; uji integrasi: `pnpm --filter @nexusdrive/database verify:vault`)
- [x] FASE 3: Streaming engine + buffer Cloudflare R2 (S3) + operasi file API. Upload <10MB stream langsung, >10MB buffer R2 multipart lalu forward & purge. Unduh proxy streaming via provider. `/api/files/{upload,stream,folder,rename,delete,index}`. Guard SSRF whitelist. Uji nyata: 50MB via R2 buffer peak heap 17MB (< 120MB) (`pnpm --filter @nexusdrive/core verify:streaming`, butuh `docker compose up -d minio`)
- [x] FASE 4: Dashboard UI (kartu penyimpanan + ring gauge SVG per brand, statistik agregat), sidebar kategori (All/Images/Video/Music/Document dengan badge), header pencarian global debounce 300ms, File Manager berbasis TanStack Table (List/Grid, breadcrumb, urutkan, aksi Buka/Unduh/Ubah nama/Hapus), dialog rename/new-folder/delete, panel unggah drag-drop dengan progress per berkas. Endpoint `/api/dashboard/summary`, `/api/files/{browse,search}`. Gerbang hijau 2026-09-11 (50 unit test, tsc 0, eslint 0, build ok, smoke HTTP semua halaman 200)
- [x] FASE 5: `apps/worker` (BullMQ + Redis) dengan processor stream-to-stream lintas cloud (progress tiap >=5% ke `transfer_jobs`, batal via flag DB, retry backoff, `Dockerfile` siap Railway/Fly), processor `folder-mirror-sync` (diff pohon BFS -> antre transfer). API `/api/transfers` (buat/daftar/batal) + `/api/sync` (CRUD + repeatable cron). UI: Transfer Center drawer melayang (speed, ETA, progress, batal), halaman Pusat Aktivitas (riwayat + pengelola jadwal), dialog "Kirim ke cloud" di menu aksi. Uji nyata via Redis+Postgres: 100MB sukses `pending->processing->completed`, pembatalan tengah jalan, mirror menyalakan 1 transfer untuk file hilang (`pnpm --filter worker verify:transfer`)
- [x] FASE 6: Landing page kreator (`apps/web/src/app/(marketing)`) dengan design taste (anti-slop, tanpa em-dash, copy fungsional): hero split + preview produk animatif (Motion, hormati `prefers-reduced-motion`), marquee 5 provider, bento fitur (variasi latar), demo explorer interaktif (tab akun), kalkulator penghematan storage (interaktif), pricing 3 tingkat jujur, FAQ (`<details>`), CTA band. Onboarding 3 langkah (`/onboarding`) menandai `onboarding_completed`. Rute: `/` = landing publik, dashboard pindah ke `/dashboard` (pengguna baru tanpa akun diarahkan ke onboarding). Lighthouse: First Load JS ~107-135kB, `next/font`, tanpa bloating
- [ ] FASE 4: Dashboard UI & file explorer
- [ ] FASE 5: BullMQ worker & transfer/sync (paket `apps/worker` dibuat di fase ini)
- [ ] FASE 6: Landing page & onboarding
- [ ] FASE 7: AI tagging & semantic search (kolom `embedding` + index HNSW via SQL)
- [ ] FASE 8: Hardening & E2E

Catatan dev: `packages/database/supabase/migrations/0001_init.sql` adalah deliverable migrasi Supabase (RLS `auth.uid()`); dev lokal memakai `prisma db push`.

---

*Aplikasi ini dibuat 100% menggunakan AI, dengan bantuan PRD generator dari [godigi.my.id](https://godigi.my.id).*
