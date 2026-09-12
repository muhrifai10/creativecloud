# Product Requirements Document (PRD)
## Multi-Provider Cloud Drive SaaS Platform ("OmniDrive / CloudHub")

---

### 1. Project Overview
Platform SaaS *Multi-Provider Cloud Drive* adalah aplikasi web terpadu yang memungkinkan pengguna—khususnya *freelancer* dan kreator konten—untuk menghubungkan, mengagregasikan, dan mengelola berbagai penyedia penyimpanan awan (*cloud storage*) terkemuka (Google Drive, Dropbox, Microsoft OneDrive, MEGA, dan pCloud) ke dalam satu dasbor terpusat. 

Dengan arsitektur modern berbasis Next.js App Router, Supabase, Cloudflare R2, dan Dedicated BullMQ Background Worker, platform ini menghilangkan friksi perpindahan antar-tab (*context switching*), memvisualisasikan kapasitas penyimpanan gabungan secara *real-time*, memfasilitasi penjelajahan berkas lintas-penyedia dalam satu *File Explorer*, serta mengeksekusi operasi berkas dan sinkronisasi antar-awan tanpa membebani *bandwidth* lokal pengguna.

---

### 2. Problem Statement
Kreator konten, desainer lepas, dan videografer saat ini menghadapi fragmentasi ekosistem penyimpanan data digital yang parah:
1. **Fragmentasi Kapasitas & Visibilitas:** Pengguna rata-rata memiliki 3 hingga 5 akun penyimpanan awan yang berbeda (misalnya akun Google Drive pribadi, Dropbox proyek klien, OneDrive kampus/korporat, MEGA untuk cadangan data, dan pCloud untuk media file). Mereka tidak memiliki visibilitas terpadu mengenai total kuota, sisa kapasitas, maupun utilisasi ruang penyimpanan secara menyeluruh.
2. **Friksi Akses & Penelusuran Berkas (File Siloing):** Menemukan aset tertentu membutuhkan waktu rata-rata 5–15 menit karena pengguna harus membuka tab peramban terpisah untuk masing-masing layanan, masuk (*login*) berulang kali, dan mencari file di tiap direktori yang tidak seragam.
3. **Beban Transfer & Kuota Lokal:** Memindahkan aset video berukuran besar (misalnya 5 GB – 50 GB) dari Google Drive ke Dropbox saat ini mengharuskan pengguna mengunduh berkas ke drive lokal terlebih dahulu, lalu mengunggahnya kembali (*manual download-and-reupload*). Proses ini menguras *bandwidth* internet lokal, menghabiskan ruang penyimpanan lokal, dan rentan terhadap kegagalan jaringan di tengah proses.

---

### 3. Goals
*   **Pertumbuhan & Akuisisi Pengguna:** Mencapai minimal **5.000 Monthly Active Users (MAU)** dalam kurun waktu 6 bulan setelah rilis publik MVP.
*   **Efisiensi Pencarian & Manajemen:** Mengurangi durasi pencarian file lintas platform dari rata-rata **8 menit menjadi kurang dari 5 detik** melalui *Unified Search*.
*   **Efisiensi Transfer Berkas Antar-Cloud:** Memangkas waktu proses pemindahan data antar-layanan awan hingga **80% lebih cepat** dibandingkan metode manual *download-reupload*, dengan tingkat keberhasilan transfer berkas (*job success rate*) minimal **99,2%**.
*   **Aktivasi & Onboarding Pengguna Baru:** Mencapai rasio penyelesaian *onboarding tour* dan penautan minimal 2 akun cloud pertama sebesar **≥ 65%** dari total pendaftaran baru dalam waktu < 2 menit.
*   **Performa Agregasi Data:** Menampilkan dasbor agregasi kapasitas penyimpanan dan pohon direktori awal dalam waktu **< 1,5 detik (P95)** pada koneksi internet standar.

---

### 4. Non-Goals
*   **Bukan Penyedia *Bare-Metal Storage* Utama:** OmniDrive tidak menjual infrastruktur penyimpanan data fisik independen (*cold/hot storage hosting*); platform ini murni bertindak sebagai orkestrator, agregator, dan *middleware proxy*.
*   **Bukan Editor Dokumen Terintegrasi (Office Suite):** MVP tidak mencakup pembuatan dokumen seperti Google Docs/Sheets atau MS Word di dalam antarmuka. Berkas hanya dapat dipratinjau (*preview*), diunduh, disalin, atau dipindahkan.
*   **Tidak Mendukung Sinkronisasi *Local Agent* Desktop (Tahap Awal):** Platform berfokus 100% pada *web application*. Sinkronisasi agen lokal pada tingkat sistem operasi (*file system virtual mount* seperti Dokany/FUSE) berada di luar cakupan MVP.

---

### 5. Target Users
*   **Freelance Content Creators & Videographers:** Individu yang mengelola file video resolusi tinggi (raw 4K/ProRes) yang tersebar di Dropbox klien dan akun Google Drive pribadi.
*   **Graphic & UI/UX Designers:** Pengembang visual yang membutuhkan akses cepat ke pustaka aset (.psd, .ai, .fig), *font*, dan *mockup* di berbagai akun cloud gratisan demi menghemat biaya langganan tunggal.
*   **Digital Marketers & Agency Executives:** Profesional yang menerima materi promosi dari berbagai klien di Google Drive, OneDrive perusahaan, dan link pCloud.

---

### 6. User Personas

#### Persona 1: Arya Pratama (28) – Freelance Senior Motion & 3D Designer
*   **Perilaku & Setup:** Menggunakan MacBook Pro 512GB (sering kehabisan disk lokal), memiliki Google Drive 100GB, Dropbox 2TB (milik klien agency), dan MEGA 50GB untuk arsip proyek lama.
*   **Pain Points:** "Disk lokal saya sering penuh hanya karena saya harus mengunduh aset 20GB dari Dropbox klien untuk kemudian di-upload ke Google Drive klien lain. Saya juga sering lupa di mana saya meletakkan file render final."
*   **Kebutuhan Utama:** Kemampuan memindahkan folder antar-cloud secara langsung dari server-to-server dan mencari file berdasarkan ekstensi `.c4d` atau `.mov` di semua akun sekaligus.

#### Persona 2: Citra Lestari (25) – Content Creator & Video Editor
*   **Perilaku & Setup:** Mengelola konten harian untuk 3 akun TikTok dan 1 kanal YouTube. Menggunakan OneDrive dari langganan kampus/keluarga dan pCloud untuk menyimpan audio bebas royalti.
*   **Pain Points:** Membuka 4 tab peramban setiap hari; sulit memantau kapasitas akun yang hampir habis hingga ada peringatan gagal unggah.
*   **Kebutuhan Utama:** Dasbor visual dengan *storage gauge* yang menunjukkan sisa kuota tiap akun secara akurat, serta antarmuka drag-and-drop yang intuitif dan estetik.

---

### 7. User Stories
*   **US-01 (Koneksi Akun):** Sebagai kreator, saya ingin menghubungkan akun Google Drive, Dropbox, OneDrive, MEGA, dan pCloud melalui alur otorisasi yang aman, sehingga saya dapat mengakses seluruh aset digital saya tanpa membuka banyak aplikasi.
*   **US-02 (Pemantauan Kapasitas):** Sebagai pengguna multi-cloud, saya ingin melihat grafik cincin (*gauge chart*) dari kapasitas terpakai dan sisa kuota per akun serta total agregatnya, agar saya tahu akun mana yang masih memiliki ruang kosong.
*   **US-03 (Eksplorasi Berkas Tunggal):** Sebagai pengguna, saya ingin menjelajahi seluruh folder dan berkas dari berbagai provider dalam satu tampilan tabel yang responsif, sehingga saya tidak bingung dengan perbedaan navigasi antar-layanan.
*   **US-04 (Pencarian Terpadu):** Sebagai desainer, saya ingin mencari nama berkas di seluruh cloud storage secara simultan dengan *instant filtering*, agar saya dapat menemukan aset lama dalam hitungan detik.
*   **US-05 (Transfer Antar-Cloud):** Sebagai videografer, saya ingin memindahkan file atau folder dari Dropbox ke Google Drive tanpa mengunduhnya ke laptop, sehingga kuota internet dan ruang hard disk lokal saya tidak terpakai.
*   **US-06 (Streaming & Preview):** Sebagai kreator, saya ingin mempratinjau gambar dan memutar cuplikan video langsung dari dasbor web sebelum memutuskan untuk mengunduhnya.

---

### 8. User Journey
```
[Landing Page] 
       │
       ▼
[Registrasi / Login via Auth.js (Email/Google Auth)]
       │
       ▼
[Onboarding Tour (2 Menit)] ──> Hubungkan Cloud Pertama (OAuth Google Drive / Dropbox)
       │
       ▼
[Dashboard Utama (Analitik Kapasitas & Gauge Ring per Akun)]
       │
       ├──────────────────────────────────────────────────────┐
       ▼                                                      ▼
[File Manager Terpadu]                                 [Account Connection Manager]
  - Filter: All, Images, Video, Documents               - Hubungkan MEGA, pCloud, OneDrive
  - Breadcrumb: Storage / Provider / Folder              - Verifikasi Status Token & Sinkronisasi
  - Search Bar: Global Unified Search                  
       │                                                      │
       ▼                                                      │
[Operasi Berkas (Context Menu)]                               │
  - Rename, Delete, Download                                  │
  - Transfer/Copy to Provider Lain                            │
       │                                                      │
       ▼                                                      │
[Background Worker Engine (BullMQ)] <─────────────────────────┘
  - Chunked Streaming via Cloudflare R2 Buffer
  - Server-to-Server Cross-Cloud Transfer
       │
       ▼
[Pusat Aktivitas / Notifikasi: Transfer Selesai 100%]
```

---

### 9. Functional Requirements

#### 9.1 Autentikasi Pengguna & Manajemen Token
*   **FR-01:** Sistem wajib mendukung otentikasi akun pengguna utama menggunakan *Auth.js* (OAuth Google, GitHub, dan Magic Link Email via Supabase).
*   **FR-02:** Sistem wajib mengenkripsi *Access Token*, *Refresh Token*, dan kredensial API pihak ketiga menggunakan standar enkripsi AES-256-GCM sebelum disimpan ke basis data Supabase.
*   **FR-03:** Sistem wajib mengimplementasikan pekerja latar belakang (*token lifecycle manager*) yang memeriksa masa kedaluwarsa token dan melakukan *auto-refresh* secara transparan sebelum eksekusi API provider.

#### 9.2 Integrasi Multi-Provider Cloud Storage
*   **FR-04:** Sistem wajib mendukung protokol otorisasi OAuth 2.0 resmi untuk Google Drive API v3, Dropbox API v2, dan Microsoft Graph API (OneDrive).
*   **FR-05:** Sistem wajib mendukung integrasi akun MEGA (via kredensial terenkripsi berbasis `megajs`) dan pCloud API (OAuth 2.0 / API Token terenkripsi).
*   **FR-06:** Sistem wajib menyediakan antarmuka untuk memutuskan tautan (*disconnect*), menyinkronkan ulang (*manual re-sync*), dan menguji latensi koneksi akun.

#### 9.3 Dasbor Analitik & Kapasitas
*   **FR-07:** Dasbor wajib mengagregasi total ruang penyimpanan (total kuota, kuota terpakai, dan persentase bebas) dari seluruh cloud yang berhasil ditautkan.
*   **FR-08:** Dasbor wajib menyajikan kartu individual untuk setiap provider yang terhubung, lengkap dengan logo resmi, kuota (misal: "120 GB / 250 GB"), dan indikator visual *radial progress/gauge chart* sesuai palet warna identitas provider (seperti referensi desain).
*   **FR-09:** Sistem wajib menampilkan bilah samping (*sidebar navigation*) terstruktur dengan status menu aktif yang jelas, serta area *Quick Access Categories* (All Files, Images, Video, Music, Document).

#### 9.4 File Manager Terpadu Lintas Provider
*   **FR-10:** File manager wajib menyajikan daftar berkas dalam bentuk tabel interaktif (TanStack Table) dan tampilan kisi (*grid view*), yang dapat disortir berdasarkan Nama, Ukuran File, Item/Folder, dan Tanggal Modifikasi Terakhir.
*   **FR-11:** Sistem wajib menyediakan navigasi *Breadcrumb* dinamis (contoh: `Storage / Dropbox / Project A / Assets`) yang memungkinkan navigasi mundur secara instan.
*   **FR-12:** Sistem wajib mengimplementasikan menu aksi konteks (*right-click / triple-dot menu*) yang mencakup: Unduh, Ubah Nama (*Rename*), Hapus (*Delete*), Buat Folder Baru, dan Pindahkan/Salin ke Akun Lain.
*   **FR-13:** Sistem wajib menyediakan filter berkas berdasarkan kategori MIME (*Images, Video, Music, Document*) di panel sisi kiri.

#### 9.5 Engine Operasi & Streaming Berkas
*   **FR-14:** Unggah berkas ke provider tertentu harus melalui pipa *streaming* (Node.js Stream) atau *presigned URL* langsung ke Cloudflare R2 sebagai *temporary staging buffer* untuk mencegah lonjakan memori RAM pada *serverless function*.
*   **FR-15:** Unduhan berkas harus dialirkan langsung (*proxied stream*) ke peramban pengguna dengan tajuk HTTP `Content-Disposition` yang tepat.
*   **FR-16:** Sistem wajib menyimpan *cache* gambar mini (*thumbnail*) dan pratinjau dokumen di Cloudflare R2 untuk mempercepat *rendering* galeri.

#### 9.6 Sinkronisasi & Transfer Antar-Cloud (Worker Engine)
*   **FR-17:** Pengguna dapat memilih satu atau beberapa berkas/folder dari Provider A dan memindahkannya atau menyalinnya ke direktori target di Provider B.
*   **FR-18:** Eksekusi transfer wajib dijalankan secara asinkron oleh BullMQ Worker terisolasi tanpa memerlukan peramban pengguna tetap terbuka.
*   **FR-19:** Sistem wajib menampilkan bilah progres transfer *real-time* (*Progress Bar*, kecepatan transfer MB/s, dan estimasi waktu selesai) pada panel *Transfer Manager UI*.

---

### 10. Feature Requirements

Sesuai dengan kriteria ketat perancangan MVP, berikut adalah matriks prioritas fitur (maksimal 5 fitur P0):

| ID | Fitur | Deskripsi Singkat | Kategori | Prioritas | Masuk MVP? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-01** | Autentikasi Pengguna & Vault Kredensial Multi-Provider | Autentikasi aplikasi inti & brankas token terenkripsi AES-256-GCM beserta auto-refresh. | Engineering | **P0** | **Ya** |
| **FEAT-02** | Integrasi & Manajemen Koneksi Akun Cloud | Integrasi resmi 5 provider: Google Drive, Dropbox, OneDrive, MEGA, pCloud beserta UI koneksi. | Product | **P0** | **Ya** |
| **FEAT-03** | Dashboard Analitik & Kapasitas Penyimpanan | Tampilan dasbor visual modern dengan gauge visualisasi per provider & agregasi total. | Design | **P0** | **Ya** |
| **FEAT-04** | File Manager Terpadu Lintas Provider | File explorer modern (TanStack Table & Grid), breadcrumbs, filter tipe, & menu aksi. | Design | **P0** | **Ya** |
| **FEAT-05** | Engine Operasi & Streaming Berkas | Pipeline backend stream upload, download, staging buffer R2, & caching thumbnail. | Engineering | **P0** | **Ya** |
| **FEAT-06** | Sinkronisasi & Transfer Antar-Cloud (Worker Engine) | Pemindahan berkas server-to-server asinkron berbasis BullMQ & Redis tanpa kuota lokal. | Engineering | **P1** | Tidak (Fase 1.5) |
| **FEAT-07** | Onboarding & Landing Page Konversi Kreator | Landing page interaktif & tur orientasi 2 menit untuk mendorong aktivasi MAU. | Marketing | **P1** | Tidak (Fase 1.5) |
| **FEAT-08** | AI Auto-Tagging & Semantic File Search | Ekstraksi metadata & pencarian bahasa alami berbasis OpenAI API lintas provider. | Product | **P2** | Tidak (Fase 2.0) |

---

### 11. Sub Features

#### FEAT-01: Autentikasi Pengguna & Vault Kredensial Multi-Provider (P0)
*   **Sub 1.1 - Autentikasi Pengguna Utama (Auth.js):** Sistem autentikasi sesi berbasis JWT atau database session, mendukung Google Sign-In, GitHub, dan Magic Link email.
*   **Sub 1.2 - Token Vault Terenkripsi AES-256-GCM:** Modul enkripsi dua arah pada *data layer* sebelum penulisan ke tabel `cloud_accounts`. Setiap record menggunakan *Initialization Vector (IV)* acak dan *Authentication Tag* 128-bit.
*   **Sub 1.3 - Token Lifecycle & Auto-Refresh Manager:** Pemeriksa otomatis saat token kedaluwarsa (< 5 menit tersisa) yang meminta token baru ke penyedia (Google/Dropbox/OneDrive) sebelum eksekusi panggilan API dilakukan.

#### FEAT-02: Integrasi & Manajemen Koneksi Akun Cloud (P0)
*   **Sub 2.1 - Integrasi OAuth2 (Google Drive, Dropbox, OneDrive):** Alur *handshake* OAuth dengan konfigurasi skop granular (`drive.file`/`drive.readonly`, `files.content.read`/`write`, `Files.ReadWrite.All`).
*   **Sub 2.2 - Integrasi Kredensial (MEGA & pCloud):** Manajemen sesi otentikasi client-side/server-side untuk MEGA (`megajs` crypto handshake) dan endpoint OAuth2/API Token pCloud regional (US/EU).
*   **Sub 2.3 - Pengelolaan & Pemutusan Akun (Account Manager):** Antarmuka visual untuk melihat status koneksi (Healthy, Expired, Revoked), melakukan penautan ulang, atau menghapus koneksi akun beserta seluruh tokennya.

#### FEAT-03: Dashboard Analitik & Kapasitas Penyimpanan (P0)
*   **Sub 3.1 - Komponen Gauge Kapasitas Cloud Terhubung:** Komponen UI kartu horizontal dengan diagram cincin (*gauge/arc progress*) individual berbasis Recharts/SVG, menampilkan nama provider, kapasitas terpakai, dan batas kuota (misal: "120Gb / 250Gb").
*   **Sub 3.2 - Statistik Total Penyimpanan Agregat:** Panel ringkasan metrik yang menghitung penjumlahan kumulatif kapasitas dari seluruh akun terhubung.
*   **Sub 3.3 - Sidebar Navigasi & Quick Access:** Bilah navigasi vertikal minimalis modern (ikon Lucide React + label) yang memuat rute Dasbor, File Manager, Sinkronisasi, dan Pengaturan Akun, serta panel sub-kategori jenis berkas.

#### FEAT-04: File Manager Terpadu Lintas Provider (P0)
*   **Sub 4.1 - Tampilan Tabel & Grid File Explorer:** Antarmuka responsif berkemampuan virtualisasi (TanStack Table & Virtual) dengan kolom: Nama File, Jenis/Item, Tanggal Modifikasi, Ukuran File, dan Tombol Aksi.
*   **Sub 4.2 - Pencarian & Penyaringan Lintas Cloud:** Fitur pencarian instan berbasis teks (*debounced search*) yang menyaring berkas berdasarkan nama dan kategori berkas (*Images, Video, Music, Documents*).
*   **Sub 4.3 - Menu Aksi Berkas (Context Menu & Actions):** Menu popover interaktif untuk operasi berkas: Download, Rename, Delete, dan Copy Link.

#### FEAT-05: Engine Operasi & Streaming Berkas (P0)
*   **Sub 5.1 - Streaming Upload Terdistribusi:** Handler transmisi berkas berbasis stream langsung dari klien ke Cloudflare R2 kemudian diarahkan ke API provider menggunakan *chunked multipart upload*.
*   **Sub 5.2 - Direct & Proxy Download Stream:** Sistem pengalihan unduhan berkas langsung dari URL CDN provider jika tersedia, atau melalui *proxied stream* jika memerlukan autentikasi khusus.
*   **Sub 5.3 - Thumbnail & Preview Caching via Cloudflare R2:** Pipa pembuatan dan *caching* *thumbnail* gambar/dokumen beresolusi rendah di bucket R2 untuk menjamin kecepatan *load* galeri tanpa terus-menerus memanggil API provider.

#### FEAT-06: Sinkronisasi & Transfer Antar-Cloud (Worker Engine) (P1)
*   **Sub 6.1 - Dedicated Background Worker (BullMQ & Redis):** Layanan Node.js terpisah yang memproses antrean pekerjaan transfer data bervolume besar secara terisolasi dari proses web.
*   **Sub 6.2 - Sinkronisasi Terjadwal & Mirroring Folder:** Fitur konfigurasi sinkronisasi otomatis satu arah (*one-way mirroring*) antar-folder pada dua provider berbeda berdasarkan jadwal cron.
*   **Sub 6.3 - Pusat Aktivitas & Transfer Manager UI:** Panel *drawer* atau modal mengambang yang menampilkan daftar unduhan/transfer aktif, persentase kemajuan, kecepatan (MB/s), serta tombol *pause/resume/cancel*.

#### FEAT-07: Onboarding & Landing Page Konversi Kreator (P1)
*   **Sub 7.1 - Landing Page Produk Interaktif:** Halaman depan modern dengan peraga interaktif visual dasbor penyimpanan, simulasi kalkulator penghematan biaya cloud, dan tombol CTA jelas.
*   **Sub 7.2 - Onboarding Tour 2-Menit:** Panduan langkah-demi-langkah interaktif (*wizard*) saat pengguna pertama kali masuk untuk langsung menghubungkan minimal 2 layanan cloud pertama mereka.

#### FEAT-08: AI Auto-Tagging & Semantic File Search (P2)
*   **Sub 8.1 - Smart Auto-Tagging Berkas Media & Dokumen:** Pemanfaatan OpenAI API (Vision & Text Models) untuk menganalisis isi file secara otomatis dan menghasilkan tag deskriptif (misal: "Invoice Q3", "Footage Pantai Sunset 4K").
*   **Sub 8.2 - Pencarian Semantik Berbasis Natural Language:** Mesin pencarian cerdas berbasis vektor (*pgvector*) yang memungkinkan pencarian berdasarkan arti kontekstual (contoh: "dokumen kontrak kerja freelance tahun lalu").

---

### 12. User Flow

#### Alur Utama: Koneksi Akun Cloud Pertama Kali (Google Drive via OAuth2)
```
[User Masuk ke Dashboard]
          │
          ▼
[Klik Tombol "+ Hubungkan Akun" pada Widget Storage]
          │
          ▼
[Pilih Provider: Google Drive]
          │
          ▼
[Sistem Mengarahkan ke Google OAuth Consent Screen]
          │
          ▼
[User Memberikan Izin Akses File (Scopes)]
          │
          ▼
[Redirect Callback ke `/api/auth/callback/google-drive`]
          │
          ▼
[Backend Memvalidasi State, Mengambil Access & Refresh Token]
          │
          ▼
[Enkripsi Token menggunakan AES-256-GCM dengan Master Key]
          │
          ▼
[Simpan ke Supabase: Tabel `cloud_accounts`]
          │
          ▼
[Inisialisasi Sinkronisasi Metadata Kuota (Total & Used)]
          │
          ▼
[Redirect Kembali ke Dashboard -> Toast Sukses -> Gauge Storage Muncul]
```

#### Alur Penjelajahan & Pengunduhan Berkas Lintas Provider
```
[User Membuka Halaman File Manager]
          │
          ▼
[Sistem Memuat Metadata File (TanStack Query -> Cached File Explorer)]
          │
          ▼
[User Memilih Kategori "Video" pada Sidebar Quick Access]
          │
          ▼
[Tabel Menampilkan Berkas Video dari Google Drive, Dropbox, dan MEGA]
          │
          ▼
[User Melakukan Klik Kanan / Menu Titik Tiga pada Salah Satu Berkas]
          │
          ▼
[Pilih Aksi: "Unduh"]
          │
          ▼
[Backend Route Handler Membuat Signed Stream dari Provider Asal]
          │
          ▼
[Browser Memulai Pengunduhan Berkas Tanpa Buffering Penuh di Server RAM]
```

---

### 13. UI/UX Requirements
Mengacu secara spesifik pada referensi antarmuka dasbor *Geex Modern Admin Dashboard*:
*   **Tata Letak & Navigasi (Sidebar Modern):**
    *   Sidebar vertikal di sisi kiri dengan latar belakang putih bersih / abu-abu terang minimalis (`bg-slate-50/50`).
    *   Logo aplikasi di bagian atas kiri ("OmniDrive / Geex") dilengkapi *sub-caption* abu-abu halus.
    *   Menu navigasi vertikal menggunakan *pill shape* aktif dengan warna ungu lembut (*soft purple* `#F3E8FF` latar belakang dan `#7E22CE` atau `#6B21A8` warna teks/ikon).
    *   Ikon menu: Dashboard, File Manager, Sinkronisasi, Koneksi Cloud, dan Pengaturan menggunakan paket ikon Lucide React yang konsisten (stroke width 1.75).
*   **Header Atas:**
    *   Judul halaman utama: Teks tebal "File Manager" disertai sub-teks ramah ("Welcome to your unified cloud drive").
    *   Bilah pencarian global di tengah-tengah: Kotak pencarian rounded-full dengan ikon kaca pembesar dan teks panduan "Search here...".
    *   Sisi kanan atas: Indikator notifikasi dengan *badge counter* (warna oranye/kuning), pesan, dan avatar pengguna berbentuk lingkaran rapi.
*   **Kartu Gauge Penyimpanan (Storage Cards Widget):**
    *   Disusun secara horizontal di bagian atas area konten utama dalam format *grid responsive* (4–5 kartu sejajar).
    *   Masing-masing kartu memuat:
        *   Logo provider di kiri atas (Dropbox, Google Drive, OneDrive, MEGA, pCloud).
        *   Label teks kecil: "Storage", diikuti nama provider di bawahnya (misal: "Dropbox", "Google Drive").
        *   Teks statistik kapasitas di kiri bawah dengan format abu-abu terang (contoh: `120Gb / 250Gb`).
        *   Grafik cincin setengah lingkaran (*semi-circular gauge progress*) di kanan kartu, dengan kode warna khas brand provider:
            *   Dropbox: Biru pekat (`#0061FF`)
            *   Google Drive: Hijau segar (`#0F9D58` / `#34A853`)
            *   OneDrive: Biru cerah korporat (`#0078D4`)
            *   MEGA / pCloud: Merah (`#D9272E`) atau Biru Cyan (`#00AEEF`).
*   **Area Quick Access & Kategori:**
    *   Kolom sub-sidebar kiri di bawah storage cards:
        *   *Categories*: Item "All Files" (ikon kotak ungu), "Images" (ikon galeri salem/oranye muda), "Video" (ikon play kuning keemasan), "Music" (ikon nada toska muda), "Document" (ikon dokumen biru muda).
        *   *Go To Folders*: Daftar direktori cepat yang disematkan dengan ikon folder warna ungu pastel.
*   **Komponen Penjelajah Berkas (File Explorer Area):**
    *   Jalur navigasi (*Breadcrumb*) jelas: Format kapsul abu-abu dengan ikon folder, contoh `Storage / Drive A / Library`.
    *   Pilihan tampilan: Tombol toggle beralih antara *List View* (ikon baris) dan *Grid View* (ikon modul kotak) di kanan atas daftar file.
    *   Dropdown penyortiran cepat: Komponen dropdown berlabel "Recent v", "Size v", "Name v".
    *   Tabel berkas bersih tanpa batas garis pekat (*borderless/subtle border*):
        *   Kolom: Checkbox seleksi, *File Name* (ikon tipe berkas berwarna spesifik + nama teks tebal), *File Items* (keterangan folder/file), *Last Modified* (format waktu relatif seperti "20min ago", "2d ago"), *File Size* (angka rapi, rata kanan), dan tombol elipsis aksi (`...`).

---

### 14. Technical Requirements
*   **Frontend Framework:** Next.js 14/15 App Router menggunakan React Server Components (RSC) untuk fetching data awal dan Client Components untuk tabel interaktif.
*   **State & Data Fetching:** TanStack Query (React Query) untuk *client-side caching*, revalidasi *optimistic update*, dan polling kemajuan transfer berkas.
*   **File Table Engine:** TanStack Table v8 untuk penanganan *sorting*, *filtering*, *column pinning*, dan seleksi jamak ribuan baris berkas secara efisien.
*   **Visualisasi Data:** Recharts atau *custom animated SVG gauge* untuk visualisasi radial kapasitas penyimpanan.
*   **Backend & API Layer:** Kombinasi Next.js Route Handlers / Server Actions (untuk operasi I/O ringan) dan Dedicated Node.js Worker Service (untuk I/O berat dan antrean pemindahan file).
*   **Worker Engine:** BullMQ berjalan di Node.js terpisah dengan Redis (Upstash Redis atau Managed Redis di Railway/Fly.io).
*   **Staging Storage & Cache:** Cloudflare R2 dengan S3-compatible SDK untuk penampungan *temporary file chunks*, serta penyimpanan permanen *thumbnail cache*.
*   **Validasi Data:** Skema Zod untuk semua payload input API dan Server Actions.

---

### 15. Technology Stack
*   **Frontend:** Next.js 14/15 (App Router), Tailwind CSS, shadcn/ui, TanStack Table, TanStack Query, Lucide React, Recharts.
*   **Backend Web:** Next.js Route Handlers & Server Actions, Node.js Stream Pipeline, Zod.
*   **Background Worker:** Dedicated Node.js (TypeScript) Service, BullMQ, ioredis.
*   **Database & Auth:** Supabase (PostgreSQL 15+ dengan Row-Level Security), Auth.js (NextAuth v5).
*   **Penyimpanan Buffer & Cache:** Cloudflare R2 (Zero Egress Fees).
*   **Konektor Cloud Provider:**
    *   Google Drive: `googleapis` (Drive API v3)
    *   Dropbox: `dropbox` SDK resmi
    *   OneDrive: `@microsoft/microsoft-graph-client`
    *   MEGA: `megajs` engine
    *   pCloud: REST API via `fetch` streaming
*   **Deployment:**
    *   Frontend & Web API: Vercel
    *   Background Worker & Redis: Railway / Fly.io
*   **AI (Tahap Lanjutan P2):** OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`).

---

### 16. Database Requirements

Penyimpanan data relasional menggunakan Supabase (PostgreSQL) dengan Row Level Security (RLS) diaktifkan secara ketat pada setiap tabel:

```
┌─────────────────────────────────┐       1:N       ┌─────────────────────────────────┐
│              users              │ ───────────────<│         cloud_accounts          │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ id: UUID (PK)                   │                 │ id: UUID (PK)                   │
│ email: VARCHAR                  │                 │ user_id: UUID (FK)              │
│ name: VARCHAR                   │                 │ provider: ENUM                  │
│ created_at: TIMESTAMPTZ         │                 │ account_identifier: VARCHAR     │
└─────────────────────────────────┘                 │ encrypted_tokens: JSONB         │
                 │                                  │ total_quota_bytes: BIGINT       │
                 │ 1:N                              │ used_quota_bytes: BIGINT        │
                 ▼                                  │ last_synced_at: TIMESTAMPTZ     │
┌─────────────────────────────────┐                 └─────────────────────────────────┘
│          transfer_jobs          │                                  │ 1:N
├─────────────────────────────────┤                                  ▼
│ id: UUID (PK)                   │                 ┌─────────────────────────────────┐
│ user_id: UUID (FK)              │                 │          cached_files           │
│ source_account_id: UUID (FK)    │                 ├─────────────────────────────────┤
│ target_account_id: UUID (FK)    │                 │ id: UUID (PK)                   │
│ file_name: VARCHAR              │                 │ cloud_account_id: UUID (FK)     │
│ file_size_bytes: BIGINT         │                 │ provider_file_id: VARCHAR       │
│ status: ENUM                    │                 │ parent_folder_id: VARCHAR       │
│ progress_percent: INT           │                 │ name: VARCHAR                   │
│ error_message: TEXT             │                 │ mime_type: VARCHAR              │
│ created_at: TIMESTAMPTZ         │                 │ size_bytes: BIGINT              │
└─────────────────────────────────┘                 │ thumbnail_url: TEXT             │
                                                    │ last_modified_at: TIMESTAMPTZ   │
                                                    └─────────────────────────────────┘
```

#### Spesifikasi Skema Database (DDL & Indexes):

```sql
-- ENUMS
CREATE TYPE cloud_provider_type AS ENUM ('google_drive', 'dropbox', 'onedrive', 'mega', 'pcloud');
CREATE TYPE job_status_type AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- TABEL: cloud_accounts
CREATE TABLE cloud_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider cloud_provider_type NOT NULL,
    account_identifier VARCHAR(255) NOT NULL, -- Email akun cloud atau user ID provider
    encrypted_tokens JSONB NOT NULL, -- Menyimpan access_token, refresh_token, iv, auth_tag (AES-256-GCM)
    total_quota_bytes BIGINT DEFAULT 0,
    used_quota_bytes BIGINT DEFAULT 0,
    connection_status VARCHAR(50) DEFAULT 'healthy',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_provider_account UNIQUE (user_id, provider, account_identifier)
);
CREATE INDEX idx_cloud_accounts_user_id ON cloud_accounts(user_id);

-- TABEL: cached_files (Index Metadata untuk File Manager Cepat)
CREATE TABLE cached_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloud_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    provider_file_id VARCHAR(512) NOT NULL,
    parent_folder_id VARCHAR(512), -- NULL jika root
    name VARCHAR(512) NOT NULL,
    is_folder BOOLEAN DEFAULT FALSE,
    mime_type VARCHAR(255),
    size_bytes BIGINT DEFAULT 0,
    thumbnail_url TEXT,
    last_modified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_file_per_account UNIQUE (cloud_account_id, provider_file_id)
);
CREATE INDEX idx_cached_files_account_parent ON cached_files(cloud_account_id, parent_folder_id);
CREATE INDEX idx_cached_files_name_search ON cached_files USING gin(to_tsvector('indonesian', name));
CREATE INDEX idx_cached_files_mime ON cached_files(mime_type);

-- TABEL: transfer_jobs
CREATE TABLE transfer_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    target_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    source_file_id VARCHAR(512) NOT NULL,
    target_folder_id VARCHAR(512),
    file_name VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    bytes_transferred BIGINT DEFAULT 0,
    progress_percent INT DEFAULT 0,
    status job_status_type DEFAULT 'pending',
    bullmq_job_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_transfer_jobs_user ON transfer_jobs(user_id, status);
```

---

### 17. API Requirements

Sistem menggunakan gabungan Next.js Route Handlers (RESTful) dan Server Actions dengan autentikasi berbasis sesi pengguna.

#### 17.1 Cloud Connection Endpoints
*   **`GET /api/v1/clouds/oauth/initiate?provider={provider}`**
    *   *Deskripsi:* Menghasilkan URL otorisasi OAuth2 dengan token state anti-CSRF unik.
    *   *Response (200 OK):*
        ```json
        {
          "success": true,
          "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&state=xyz..."
        }
        ```
*   **`POST /api/v1/clouds/credentials/connect` (MEGA & pCloud Kredensial)**
    *   *Request Body (MEGA):*
        ```json
        {
          "provider": "mega",
          "email": "creator@example.com",
          "password": "mySecurePassword123"
        }
        ```
    *   *Response (201 Created):*
        ```json
        {
          "success": true,
          "account_id": "8f14e45f-9bf7-4b72-a16f-df305df6bfa9",
          "provider": "mega",
          "total_quota_bytes": 53687091200,
          "used_quota_bytes": 12491829102
        }
        ```
*   **`DELETE /api/v1/clouds/accounts/{accountId}`**
    *   *Deskripsi:* Menghapus integrasi akun cloud, mencabut token OAuth jika didukung provider, dan membersihkan seluruh metadata terkait.
    *   *Response (200 OK):* `{"success": true, "message": "Account unlinked successfully"}`

#### 17.2 File Manager & Storage Endpoints
*   **`GET /api/v1/storage/overview`**
    *   *Deskripsi:* Menghasilkan total statistik kapasitas agregat dan daftar detail tiap akun cloud untuk merender kartu *gauge*.
    *   *Response (200 OK):*
        ```json
        {
          "aggregate": {
            "total_bytes": 751619276800,
            "used_bytes": 312384910336,
            "free_bytes": 439234366464,
            "connected_accounts": 4
          },
          "providers": [
            {
              "account_id": "acc-1",
              "provider": "dropbox",
              "account_identifier": "arya.design@gmail.com",
              "total_bytes": 268435456000,
              "used_bytes": 128849018880,
              "gauge_color": "#0061FF"
            },
            {
              "account_id": "acc-2",
              "provider": "google_drive",
              "account_identifier": "arya.personal@gmail.com",
              "total_bytes": 268435456000,
              "used_bytes": 241591910400,
              "gauge_color": "#34A853"
            }
          ]
        }
        ```
*   **`GET /api/v1/files/list?accountId={id}&folderId={folderId}&category={category}&search={term}&page=1&limit=50`**
    *   *Deskripsi:* Mengambil daftar file terpadu dari tabel cache atau langsung dari provider.
    *   *Response (200 OK):*
        ```json
        {
          "data": [
            {
              "id": "file-101",
              "account_id": "acc-1",
              "provider": "dropbox",
              "name": "Geex Main Proposal Documents.pdf",
              "is_folder": false,
              "mime_type": "application/pdf",
              "size_bytes": 25665536,
              "formatted_size": "24.47 MB",
              "items_count": null,
              "last_modified": "2024-03-24T09:24:00Z",
              "relative_time": "20min ago"
            }
          ],
          "pagination": { "current_page": 1, "total_pages": 12, "total_items": 580 }
        }
        ```
*   **`POST /api/v1/files/operations/rename`**
    *   *Payload:* `{ "account_id": "acc-1", "file_id": "file-101", "new_name": "Final Proposal 2024.pdf" }`
*   **`DELETE /api/v1/files/operations/delete`**
    *   *Payload:* `{ "account_id": "acc-1", "file_ids": ["file-101", "file-102"] }`

#### 17.3 Streaming File Operation Endpoints
*   **`GET /api/v1/files/stream/download?accountId={id}&fileId={fileId}`**
    *   *Deskripsi:* Mengalirkan file dari provider langsung ke respons HTTP pengguna menggunakan chunking Node.js Stream.
    *   *Headers:* `Content-Type: application/octet-stream`, `Content-Disposition: attachment; filename="..."`
*   **`POST /api/v1/files/stream/upload-init`**
    *   *Payload:* `{ "account_id": "acc-1", "folder_id": "root", "file_name": "asset.zip", "size_bytes": 104857600 }`
    *   *Response (200 OK):* Menghasilkan URL presigned Cloudflare R2 untuk unggah langsung ke buffer sebelum ditransmisikan ke cloud target.

---

### 18. Authentication & Authorization

#### 18.1 Autentikasi Pengguna Utama (Auth.js / NextAuth v5)
*   Menggunakan protokol OAuth (Google, GitHub) serta opsi Magic Link aman via Supabase Auth.
*   Token sesi disimpan dalam bentuk *HTTP-only, Secure, SameSite=Lax* cookie untuk mencegah eksploitasi Cross-Site Scripting (XSS).
*   Setiap sesi pengguna dikaitkan secara ketat dengan *User ID* (`auth.uid()`) di Supabase.

#### 18.2 Vault Kredensial Multi-Provider (AES-256-GCM)
*   Kredensial pihak ketiga (OAuth Access/Refresh Tokens, kredensial MEGA, token pCloud) tidak pernah disimpan dalam bentuk *plain text*.
*   Sebelum penyimpanan:
    1. Sistem menghasilkan *Initialization Vector (IV)* acak 12-byte kriptografis.
    2. Payload kredensial dienkripsi menggunakan algoritma `AES-256-GCM` dengan *Master Encryption Key* 32-byte yang disimpan secara aman di *environment variable* server (tidak pernah terekspos ke *client-side*).
    3. Output enkripsi menghasilkan *Ciphertext* dan *Auth Tag* (16-byte) yang disimpan dalam kolom `encrypted_tokens` bertipe JSONB.
*   Format enkripsi dalam basis data:
    ```json
    {
      "iv": "d131dd02c5e6eec4693d4a1f",
      "auth_tag": "b3e9447387a6c98914da7ecf014e304b",
      "ciphertext": "a49cb741c8fa99602e1c0d..."
    }
    ```

#### 18.3 Kebijakan Otorisasi (Row Level Security - RLS)
*   Seluruh kueri basis data pada tabel `cloud_accounts`, `cached_files`, dan `transfer_jobs` dilindungi oleh RLS Supabase:
    ```sql
    ALTER TABLE cloud_accounts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can only access their own cloud accounts"
    ON cloud_accounts FOR ALL
    USING (auth.uid() = user_id);
    ```

---

### 19. Security
*   **Enkripsi Data At-Rest & In-Transit:** Seluruh lalu lintas data dienkripsi menggunakan TLS 1.3. Seluruh data sensitif di Supabase dienkripsi pada tingkat disk dan tingkat kolom (*column-level encryption* via AES-256-GCM).
*   **Mitigasi Server-Side Request Forgery (SSRF):** Panggilan API ke Google Drive, Dropbox, OneDrive, MEGA, dan pCloud hanya diarahkan ke *allowlisted endpoint domains* resmi yang telah divalidasi secara ketat oleh skema backend.
*   **CSRF Protection:** State parameter acak kriptografis (menggunakan library `crypto`) wajib digunakan dan divalidasi pada setiap alur inisiasi dan callback OAuth2.
*   **Rate Limiting Terdistribusi:** Menerapkan pembatasan laju panggilan (*rate limiting*) menggunakan Redis (Upstash) di tingkat middleware Next.js:
    *   Endpoint API Publik: Maksimal 60 request/menit per alamat IP.
    *   Endpoint Operasi File/Streaming: Maksimal 20 request/menit per User ID.
*   **Zero-Data Retention pada R2 Buffer:** Berkas sementara yang diunggah ke Cloudflare R2 sebagai buffer pemindahan otomatis dihapus menggunakan kebijakan *Lifecycle Rule* Cloudflare (otomatis dimusnahkan dalam waktu 24 jam).

---

### 20. Performance
*   **Waktu Muat Halaman (LCP & FCP):**
    *   *First Contentful Paint (FCP):* < 0,8 detik.
    *   *Largest Contentful Paint (LCP):* < 1,5 detik pada koneksi 4G standar.
*   **Throughput & Skalabilitas Koneksi:**
    *   Arsitektur dirancang untuk menangani minimal **500 koneksi pengguna bersamaan (*concurrent users*)** tanpa degradasi waktu respons API (> 500ms).
*   **Kinerja Kueri Direktori Berkas:**
    *   Pemuatan tabel direktori dari cache lokal Supabase harus selesai dalam waktu **< 200 ms** untuk folder dengan hingga 5.000 item berkat indeks komposit B-Tree dan GIN.
*   **Efisiensi Memori Serverless:**
    *   Seluruh pengunduhan dan pengunggahan berkas > 10 MB wajib menggunakan stream pipeline (`node:stream`) dengan ukuran buffer terkendali (64 KB chunk), menjaga konsumsi RAM Vercel Function selalu berada di bawah ambang batas aman (< 128 MB per request).

---

### 21. Error Handling
*   **Token Kedaluwarsa (*Token Expiration / 401 Unauthorized*):**
    *   Jika panggilan API provider mengembalikan kode 401, *middleware* secara otomatis memicu pembaruan token (*token refresh*) dan mengulang kembali kueri yang gagal sebanyak 1 kali (*retry mechanism*). Jika refresh token telah dicabut pengguna, status akun diubah menjadi `revoked` dan UI menampilkan banner peringatan "Perlu Ditautkan Ulang".
*   **Batas Kuota API Provider (*429 Too Many Requests*):**
    *   Sistem menerapkan algoritma *Exponential Backoff with Full Jitter* (interval: 1s, 2s, 4s, 8s) saat menerima sinyal pembatasan laju dari Google Drive atau Dropbox API.
*   **Kapasitas Cloud Target Penuh (*Insufficient Storage*):**
    *   Sistem memvalidasi ketersediaan ruang penyimpanan akun target sebelum mengizinkan transfer berkas dimulai. Jika kuota tidak mencukupi, sistem langsung menghentikan job dengan kode kesalahan `ERR_QUOTA_EXCEEDED` dan menampilkan pesan ramah kepada pengguna: "Kapasitas akun Google Drive tujuan tidak mencukupi untuk memindahkan file ini (Kurang 4,2 GB)".
*   **Jaringan Terputus saat Streaming:**
    *   Operasi transfer multipart pada BullMQ mengimplementasikan penyimpanan *checkpoint offset*, sehingga proses transfer yang terputus dapat dilanjutkan (*resumed*) dari chunk terakhir tanpa mengulang dari 0%.

---

### 22. Edge Cases
*   **Karakter Khusus pada Nama Berkas Antar-Provider:**
    *   OneDrive dan Windows melarang karakter `\ / : * ? " < > |`, sedangkan Google Drive mengizinkannya. Sistem otomatis melakukan sanitasi dan *URL encoding/replacement* karakter terlarang saat memindahkan berkas dari Google Drive ke OneDrive.
*   **File Duplikat di Direktori Target:**
    *   Jika nama file yang dipindahkan sudah ada di folder tujuan, sistem secara otomatis menambahkan sufiks unik `_copy(1)` atau meminta konfirmasi *Overwrite / Keep Both* dari pengguna jika transfer dipicu manual.
*   **Batasan Ukuran File Tunggal per Provider:**
    *   MEGA memiliki batasan transfer per IP; Dropbox dan Google Drive memiliki limit upload file tunggal yang berbeda. Sistem memeriksa ukuran file asal terhadap batasan spesifik provider tujuan sebelum mendaftarkan job ke antrean BullMQ.
*   **Revokasi Akses Pihak Ketiga secara Eksternal:**
    *   Jika pengguna mencabut izin akses OmniDrive langsung dari konsol keamanan akun Google/Dropbox mereka, sistem mendeteksi error pada siklus sinkronisasi berikutnya dan secara aman mengisolasi akun tersebut tanpa merusak fungsionalitas akun cloud lainnya.

---

### 23. MVP Scope
Peluncuran MVP (Bulan ke-4) berfokus secara eksklusif pada fitur dasar berkinerja tinggi:

#### Fitur yang Masuk Scope MVP (In-Scope):
1.  **Autentikasi & Vault Kredensial Terenkripsi (FEAT-01):** Login pengguna via Google/Email, Brankas Enkripsi AES-256-GCM, auto-refresh token.
2.  **Integrasi 5 Akun Cloud Utama (FEAT-02):** Koneksi OAuth2 untuk Google Drive, Dropbox, OneDrive, serta koneksi terenkripsi untuk MEGA dan pCloud.
3.  **Dashboard Analitik & Kapasitas (FEAT-03):** Widget gauge radial per provider (persis seperti referensi visual UI), agregasi total kapasitas penyimpanan, dan sidebar navigasi responsive.
4.  **File Manager Terpadu (FEAT-04):** Antarmuka TanStack Table & Grid, breadcrumb navigasi, filter kategori (Images, Video, Music, Documents), dan aksi standar (Rename, Delete).
5.  **Engine Streaming Berkas Dasar (FEAT-05):** Pengunggahan berkas langsung ke cloud yang dipilih, pengunduhan berkas via streaming, serta thumbnail preview caching di Cloudflare R2.

#### Fitur yang Dikeluarkan dari Scope MVP (Out-of-Scope untuk Fase Selanjutnya):
*   Sistem sinkronisasi folder otomatis terjadwal antar-cloud (BullMQ Worker Engine - FEAT-06).
*   AI Semantic Search & Auto-Tagging gambar/dokumen (FEAT-08).
*   Landing page pemasaran interaktif lengkap dan alur onboarding wizard (FEAT-07).
*   Dukungan penyedia *object storage* enterprise seperti AWS S3 atau Backblaze B2.

---

### 24. Future Development
*   **Fase 1.5 (Bulan ke-5 – ke-6):**
    *   Peluncuran fitur **Sinkronisasi & Transfer Antar-Cloud Otomatis (FEAT-06)** menggunakan BullMQ Worker untuk transfer data massal server-to-server.
    *   Penerapan **Landing Page Konversi & Onboarding Tour Interaktif (FEAT-07)** guna mempercepat pencapaian target 5.000 MAU.
*   **Fase 2.0 (Bulan ke-7 – ke-9):**
    *   Implementasi **AI Auto-Tagging & Semantic Search (FEAT-08)**: Memungkinkan pencarian cerdas berbasis konteks dan pengenalan objek visual dalam foto/video tanpa metadata nama file.
    *   Integrasi penyedia cloud tambahan: Box, iCloud Drive (via WebKit bridge), dan Amazon S3.
*   **Fase 3.0 (Bulan ke-10+):**
    *   Pengembangan aplikasi desktop ringan (*Virtual File System drive*) berbasis Rust / Tauri untuk macOS dan Windows, memungkinkan pengaksesan seluruh cloud layaknya satu hard disk lokal virtual.

---

### 25. Acceptance Criteria

| ID Kriteria | Fitur Terkait | Skenario Pengujian / Kondisi Penerimaan | Kondisi Berhasil (Pass) |
| :--- | :--- | :--- | :--- |
| **AC-01** | FEAT-01 (Vault Enkripsi) | Pengguna menautkan akun Google Drive dan sistem menyimpan token ke Supabase. | Token dalam tabel `cloud_accounts` berformat *ciphertext* tak terbaca; kolom `auth_tag` dan `iv` terisi lengkap; token dapat didekripsi kembali oleh server tanpa galat. |
| **AC-02** | FEAT-02 (Koneksi Multi-Cloud) | Pengguna menautkan akun Google Drive, Dropbox, OneDrive, MEGA, dan pCloud secara berurutan. | Kelima akun berhasil terhubung, berstatus "Healthy", dan kuota masing-masing akun terbaca akurat sesuai dengan kapasitas aslinya. |
| **AC-03** | FEAT-03 (Gauge Dashboard) | Menghitung dan merender widget kuota penyimpanan pada dasbor utama. | Menampilkan gauge radial dengan persentase dan warna identitas yang sesuai untuk masing-masing 5 provider; ringkasan agregat menampilkan total kuota kumulatif dalam format Gigabyte/Terabyte yang presisi. |
| **AC-04** | FEAT-04 (File Explorer) | Menampilkan berkas dari akun terhubung dan melakukan filter kategori. | Seluruh berkas muncul dalam TanStack Table/Grid; saat tombol kategori "Video" ditekan, hanya berkas berekstensi video (.mp4, .mov, .mkv) yang ditampilkan dalam waktu < 200 ms. |
| **AC-05** | FEAT-04 (Operasi Berkas) | Pengguna melakukan aksi ubah nama (*Rename*) dan hapus (*Delete*) pada berkas Dropbox via menu aksi UI. | Perubahan nama berkas langsung ter-update di antarmuka UI secara optimistik dan terverifikasi berubah pada server Dropbox; penghapusan menghapus item dari tabel cache dan server penyedia. |
| **AC-06** | FEAT-05 (Streaming Unduhan) | Pengguna mengunduh file video berukuran 1,5 GB yang tersimpan di Google Drive. | Pengunduhan berjalan lancar via stream peramban tanpa jeda buffering server yang lama; penggunaan memori RAM pada runtime backend tetap stabil di bawah 128 MB sepanjang durasi unduh. |
| **AC-07** | FEAT-01 & FEAT-02 (Token Rotation) | Token akses OAuth Google Drive sengaja dibuat kedaluwarsa secara simulasi. | Sistem otomatis memicu pembaruan token menggunakan refresh token di latar belakang; operasi berkas pengguna berikutnya berjalan sukses tanpa meminta login ulang (*zero-disruption*). |