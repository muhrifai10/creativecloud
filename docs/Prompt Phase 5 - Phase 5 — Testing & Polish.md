# Prompt Phase 5: Testing & Polish

## Konteks Proyek & Tech Stack
Aplikasi SaaS Cloud Drive Multi-Provider telah selesai dibangun dari P0 hingga P2. Fase ini difokuskan pada pengujian komprehensif, penanganan kasus batas (edge cases), audit performa, dan penyempurnaan kualitas (polish).
Tech stack: Next.js App Router, Supabase, Cloudflare R2, BullMQ, Redis, Playwright / Vitest, TanStack Table.

## Fitur & Ruang Lingkup Fase Ini
Lakukan pembersihan sistem, audit, pengujian, dan penanganan kasus ekstrem secara menyeluruh tanpa menambahkan fitur bisnis baru:
1. Pengujian End-to-End (E2E) & Integrasi:
   - Skenario E2E alur autentikasi dan penautan akun cloud storage mock.
   - Skenario transfer file antar-provider dengan validasi integritas ukuran file.
   - Skenario fallback pencarian semantik AI ketika kuota API habis atau server offline.
2. Penanganan Kasus Ekstrem (Edge Cases) & Ketahanan Sistem:
   - Refresh token otomatis ketika token OAuth kadaluarsa di tengah operasi download/upload besar.
   - Pembersihan otomatis (lifecycle cleanup) berkas buffer di Cloudflare R2 untuk file yang gagal ditransfer.
   - Rate limiting dan exponential backoff pada request API provider (Google Drive, Dropbox, OneDrive, MEGA, pCloud) guna menghindari HTTP 429.
   - Penanganan file duplikat (opsi otomatis: rename atau replace).
3. Optimasi Kinerja & Audit Keamanan:
   - Virtualisasi daftar file pada TanStack Table jika direktori memiliki lebih dari 1.000 file.
   - Audit keamanan enkripsi AES-256-GCM pada tabel token untuk memastikan tidak ada kunci atau raw token yang bocor ke log atau client bundle.
   - Verifikasi isolasi data multi-tenant (Row Level Security / RLS di Supabase) sehingga pengguna hanya dapat mengakses berkas dan akun miliknya sendiri.
4. Dokumentasi & Developer Experience:
   - Dokumentasi lengkap konfigurasi environment variabel, panduan deployment worker BullMQ di Railway/Fly.io, dan frontend di Vercel.

## Kriteria Keberimaan (Acceptance Criteria)
1. Semua suite pengujian (unit, integrasi, dan E2E) lulus 100% tanpa flakiness.
2. Tidak ada kebocoran memory pada Node.js stream pipeline saat mentransfer file berukuran besar (>500MB).
3. Lighthouse performance score dashboard >= 90 pada mode desktop, dan skor accessibility = 100.
4. RLS diuji dan terbukti memblokir akses data antar user yang berbeda ID.
5. Build production lolos tanpa error TypeScript, warning linter, atau bundle analyzer warning.

## Batasan Pengerjaan
Dilarang menambahkan fitur produk baru di luar daftar pengujian, stabilitas, keamanan, dan performa di atas.

## Frontend Design Taste Rules
- Audit Aksesibilitas: Pastikan seluruh tombol icon-only memiliki `aria-label`, seluruh dialog memiliki `aria-describedby`, dan kontras warna teks di seluruh tema lolos WCAG AA.
- Responsivitas & Viewport: Pastikan tidak ada horizontal scroll overflow pada viewport mobile/tablet, dan seluruh container utama menggunakan `min-h-[100dvh]`.
- Content Discipline: Pastikan tidak ada em-dash (—) yang tertinggal di seluruh antarmuka aplikasi, gunakan tanda hubung hyphen (-). Pastikan tidak ada data placeholder seperti John Doe atau teks lorem ipsum yang tersisa.