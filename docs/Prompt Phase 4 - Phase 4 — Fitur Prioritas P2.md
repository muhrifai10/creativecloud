# Prompt Phase 4: Fitur Prioritas P2

## Konteks Proyek & Tech Stack
Aplikasi SaaS Cloud Drive Multi-Provider untuk kreator konten. Fase P0 dan P1 telah selesai.
Tech stack: Next.js App Router, OpenAI API (embeddings & GPT-4o-mini vision/text analysis), Supabase pgvector, TanStack Query & Table, Tailwind CSS, shadcn/ui.

## Fitur Fase Ini (Wajib Sesuai Daftar P2)
Implementasikan HANYA 1 fitur prioritas P2 berikut:

1. AI Auto-Tagging & Semantic File Search (product, P2):
   Fitur kecerdasan buatan berbasis OpenAI API untuk menganalisis konten file, menghasilkan tag otomatis, dan mendukung pencarian cerdas berbasis makna bahasa alami.
   - Kriteria Keberimaan:
     - Integrasi background job yang memicu ekstraksi metadata dan analisis AI saat file baru terdeteksi atau diunggah (analisis nama file, ekstensi, dokumen teks, atau deskripsi visual gambar via OpenAI API).
     - Sistem menghasilkan smart tags otomatis (contoh: `#invoice-2024`, `#footage-broll`, `#desain-branding`) yang disimpan pada database Supabase.
     - Embedding vektor dihasilkan untuk setiap entri berkas dan disimpan dalam kolom vektor Supabase (pgvector).
     - Mode 'Semantic Search' pada bar pencarian file manager: pengguna dapat mencari dengan bahasa alami (contoh: 'invoice pembayaran klien bulan lalu' atau 'foto pemandangan pantai sore') dan sistem menampilkan file yang relevan berdasarkan kemiripan cosinus (cosine similarity), lengkap dengan skor relevansi dan badge tag AI.
     - Pengguna dapat mengedit, menambah, atau menghapus tag yang dihasilkan AI secara manual melalui antarmuka file details modal.

## Batasan Pengerjaan
Implementasikan HANYA fitur AI Auto-Tagging & Semantic File Search. Jangan mengubah arsitektur inti transfer berkas P1 atau auth P0 kecuali untuk menyematkan metadata AI. Seluruh kode harus lolos typecheck, lint, dan test.

## Frontend Design Taste Rules
- Anti-Default Discipline: Jangan menambahkan ikon robot/bintang kilau berlebihan (sparkles AI-purple) yang klise. Gunakan badge tag yang bersih, minimalis, dan elegan.
- Typography: Konsisten dengan Sans-Serif yang telah ditentukan. Jangan gunakan serif.
- Color: Badge AI menggunakan warna netral bersahaja (slate/zinc subtle borders) dengan indikator aksen tunggal yang tidak mencolok.
- Content: Dilarang menggunakan em-dash (—), gunakan tanda hubung hyphen (-). Hindari pesan status AI yang berlebihan.
- Layout & Interaksi: Modal detail file menyajikan tag AI dalam bentuk pill chips yang dapat diklik untuk memfilter file serupa. Bar pencarian menyediakan tombol toggle sederhana antara 'Keyword Search' dan 'Semantic AI Search'.
- Accessibility: Input pencarian dan tag chips dapat diakses sepenuhnya melalui keyboard (Tab, Enter, Backspace) dan memenuhi rasio kontras WCAG AA.