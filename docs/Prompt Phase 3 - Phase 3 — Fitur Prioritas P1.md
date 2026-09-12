# Prompt Phase 3: Fitur Prioritas P1

## Konteks Proyek & Tech Stack
Aplikasi SaaS Cloud Drive Multi-Provider untuk kreator konten. Fase P0 sudah selesai (autentikasi, koneksi provider, dashboard kapasitas, file manager, dan streaming engine).
Tech stack: Next.js (App Router), Tailwind CSS, BullMQ, Redis, Node.js worker service, Cloudflare R2, Supabase, shadcn/ui.

## Fitur Fase Ini (Wajib Sesuai Daftar P1)
Implementasikan HANYA 2 fitur prioritas P1 berikut:

1. Sinkronisasi & Transfer Antar-Cloud (Worker Engine) (engineering, P1):
   Layanan pemindahan berkas dan sinkronisasi otomatis antar akun cloud storage yang berbeda menggunakan antrean BullMQ dan worker terisolasi.
   - Kriteria Keberimaan:
     - Pengguna dapat memilih satu atau banyak berkas/folder dari satu provider (contoh: Google Drive) dan memindahkannya atau menyalinnya ke provider lain (contoh: Dropbox).
     - Job transfer dijalankan melalui BullMQ worker service terpisah dengan status real-time (Queued, Processing, Completed, Failed, Retrying).
     - Dukungan penjadwalan sinkronisasi otomatis (mirroring satu arah atau terjadwal harian/mingguan antar folder cloud).
     - Worker memanfaatkan Cloudflare R2 sebagai staging buffer sementara berkecepatan tinggi dengan pembersihan berkas sementara (cleanup) otomatis setelah transfer sukses.

2. Onboarding & Landing Page Konversi Kreator (marketing, P1):
   Halaman landing page interaktif dan alur onboarding mandiri yang ditargetkan untuk kebutuhan freelancer dan kreator konten guna mendorong konversi MAU.
   - Kriteria Keberimaan:
     - Landing page publik di route `/` yang menjelaskan value proposition: integrasi 5 cloud utama, monitoring kapasitas satu tempat, dan transfer antar-cloud tanpa kuota lokal habis.
     - Hero section tajam dan ringkas: headline maksimal 2 baris (<=8 kata), subteks maksimal 20 kata, tombol CTA jelas menuju pendaftaran.
     - Alur onboarding step-by-step setelah registrasi pertama kali: panduan menghubungkan akun cloud storage pertama dengan visual interaktif progres (1 dari 5 terhubung).
     - Interactive demo preview atau kalkulator storage terpusat yang menghitung total GB yang bisa diselamatkan kreator.

## Batasan Pengerjaan
Implementasikan HANYA 2 fitur P1 di atas. DILARANG membuat atau menghubungkan fitur AI auto-tagging / semantic search (P2). Jangan merusak fungsionalitas P0 yang sudah berjalan. Seluruh pekerjaan harus lulus build, lint, dan unit test.

## Frontend Design Taste Rules
- Anti-Default Discipline: Landing page TIDAK BOLEH terlihat seperti template AI umum (tanpa gradien ungu, tanpa mesh dark glow, tanpa 3 feature cards yang identik).
- Typography: Headline tajam, sans-serif profesional (Plus Jakarta Sans). Fraunces/Instrument Serif dilarang.
- Color: Pertahankan aturan satu aksen dominan. Dilarang menggunakan palet neon atau gradient liar.
- Layout: Hero section wajib muat dalam satu viewport layar desktop tanpa scroll berlebihan. Eyebrow maksimal 1 per 3 seksi halaman. Dilarang mengulang layout seksi secara berurutan. Maksimal 2 zigzag layout.
- Content: Headline <=8 kata, sub-paragraf <=25 kata. Dilarang menggunakan kata klise seperti 'Elevate your workflow', 'Seamlessly', atau 'Unleash productivity'. Dilarang menggunakan em-dash (—), gunakan tanda hubung hyphen (-).
- Forbidden Patterns: Dilarang menggunakan fake screenshot div dengan titik warna-warni Mac di pojok kiri atas. Dilarang ada scroll indicator panah ke bawah.
- Accessibility: Mendukung reduced motion pada animasi landing page, contrast ratio WCAG AA, dan `min-h-[100dvh]`.