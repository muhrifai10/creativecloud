# Prompt Phase 2: MVP (Prioritas P0)

## Konteks Proyek & Tech Stack
Aplikasi web SaaS Cloud Drive Multi-Provider untuk freelancer dan kreator konten. Menggabungkan Google Drive, Dropbox, OneDrive, MEGA, dan pCloud ke dalam satu dashboard.
Tech stack: Next.js App Router, Tailwind CSS, shadcn/ui, TanStack Query & Table, Supabase, Auth.js, AES-256-GCM vault, Cloudflare R2, direct provider APIs/SDKs, recharts, Lucide React, Zod.

## Fitur Fase Ini (Wajib Sesuai Daftar P0)
Implementasikan HANYA 5 fitur prioritas P0 berikut:

1. Autentikasi Pengguna & Vault Kredensial Multi-Provider (engineering, P0):
   Sistem autentikasi pengguna aplikasi dan brankas penyimpanan token OAuth serta kredensial akun cloud storage pihak ketiga yang terenkripsi standar perbankan.
   - Kriteria Keberimaan:
     - Pengguna dapat login dan mendaftar menggunakan Auth.js (Email Magic Link / Social Login).
     - Tabel kredensial menyimpan access token, refresh token, expiry time, dan API keys akun pihak ketiga dalam bentuk ciphertext AES-256-GCM menggunakan secure master key.
     - Refresh token otomatis berjalan saat token provider kadaluarsa sebelum eksekusi API provider.

2. Integrasi & Manajemen Koneksi Akun Cloud (product, P0):
   Modul manajemen integrasi untuk menghubungkan, menguji koneksi, dan mengelola 5 layanan cloud storage utama (Google Drive, Dropbox, OneDrive, MEGA, pCloud).
   - Kriteria Keberimaan:
     - Alur OAuth 2.0 terintegrasi penuh untuk Google Drive, Dropbox, dan OneDrive.
     - Integrasi kredensial (API key / username & session token) untuk MEGA dan pCloud.
     - Terdapat menu 'Connected Accounts' yang menampilkan status aktif, tombol 'Test Connection', dan tombol 'Disconnect/Revoke' untuk setiap akun.

3. Dashboard Analitik & Kapasitas Penyimpanan (design, P0):
   Tampilan visual dasbor modern dan clean yang menyajikan agregasi total kapasitas, storage terpakai, dan sisa ruang penyimpanan di seluruh cloud provider.
   - Kriteria Keberimaan:
     - Ringkasan total storage, used storage, dan available storage teragregasi secara akurat dari seluruh akun yang terhubung.
     - Kartu kapasitas individual per provider (meniru referensi visual dengan circular progress gauge menggunakan recharts atau radial SVG clean).
     - Breakdown tipe file (Images, Video, Music, Documents) beserta statistik ruang penyimpanan yang digunakan.

4. File Manager Terpadu Lintas Provider (design, P0):
   Antarmuka penjelajah file modern berbasis TanStack Table yang menggabungkan direktori file dari semua cloud provider dalam satu explorer.
   - Kriteria Keberimaan:
     - Daftar file dan folder terpadu disajikan dalam TanStack Table dengan kolom: Nama File, Cloud Provider (badge), Tipe/Kategori, Ukuran File, dan Tanggal Modifikasi.
     - Navigasi folder hierarkis (breadcrumb dinamis: `Storage / Drive / Folder`) yang berfungsi responsif.
     - Pencarian teks langsung (instant client-side & server-side filter), sortir berdasarkan nama/tanggal/ukuran, dan filter kategori file (All, Images, Videos, Documents).

5. Engine Operasi & Streaming Berkas (engineering, P0):
   Backend streaming pipeline untuk menangani unggah, unduh, dan manipulasi berkas langsung ke API provider menggunakan Cloudflare R2 sebagai buffer transfer cepat.
   - Kriteria Keberimaan:
     - Operasi berkas standar berfungsi penuh: Upload berkas baru ke provider yang dipilih, Download berkas langsung via streaming pipeline, Rename berkas/folder, Delete berkas/folder, dan Create Folder.
     - Buffer upload berkas menggunakan Cloudflare R2 multipart upload untuk mencegah memory leak pada server Next.js sebelum dialirkan ke cloud provider target.
     - Penanganan streaming download menggunakan Node.js stream pipeline tanpa membebani disk server.

## Batasan Pengerjaan
Implementasikan HANYA 5 fitur P0 di atas. DILARANG menyentuh fitur background sync BullMQ otomatis (P1), landing page publik (P1), atau AI smart tagging (P2). Seluruh kode harus lolos typecheck, linter, dan build sebelum selesai.

## Frontend Design Taste Rules
- Desain harus merujuk pada referensi: Clean dashboard, sidebar navigasi vertikal di kiri, kartu kapasitas storage per provider di atas, quick category di sisi kiri tabel, dan tabel file di area utama.
- Anti-Default Discipline: Jangan gunakan gradien ungu AI generik atau background mesh gelap. Gunakan palet dashboard modern dengan latar belakang netral terang (light mode first) atau dark mode kontras tinggi yang terkalibrasi.
- Typography: Gunakan font modern non-Inter (seperti Plus Jakarta Sans). Dilarang keras menggunakan serif atau Fraunces/Instrument Serif.
- Color: Gunakan 1 warna aksen dominan (misalnya deep slate-blue `#2563eb` atau neutral slate `#0f172a`). Jangan gunakan glow biru/ungu berlebihan. Kartu provider memiliki warna identitas minimalis (Dropbox soft blue, Google Drive soft green, OneDrive vibrant blue).
- Layout: Shell layout adaptif dengan `min-h-[100dvh]`. Tabel data responsif dengan virtual scrolling atau pagination yang tidak merusak layout.
- Forbidden Patterns: Dilarang menggunakan em-dash (—), gunakan tanda hubung hyphen (-). Dilarang menampilkan nama dummy generik 'John Doe'. Hindari card kembar 3 simetris yang kaku.
- Accessibility: Kontras warna tombol aksi dan label teks wajib memenuhi standar WCAG AA. Input form memiliki focus ring yang jelas.