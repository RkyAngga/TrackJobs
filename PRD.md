# Track Jobs — Product Requirements Document (PRD)

> **Versi:** 1.0.0
> **Tanggal:** 2025
> **Kategori:** IBM Bob Global AI Builders Challenge
> **Status:** Prototype / MVP

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Problem Statement](#2-latar-belakang--problem-statement)
3. [Target Pengguna](#3-target-pengguna)
4. [Tujuan & Sasaran Produk](#4-tujuan--sasaran-produk)
5. [Lingkup Fitur (Scope)](#5-lingkup-fitur-scope)
6. [Spesifikasi Fungsional](#6-spesifikasi-fungsional)
7. [Spesifikasi Non-Fungsional](#7-spesifikasi-non-fungsional)
8. [Desain & UX](#8-desain--ux)
9. [Arsitektur Teknis](#9-arsitektur-teknis)
10. [Struktur Data](#10-struktur-data)
11. [Struktur File](#11-struktur-file)
12. [Cara Menjalankan](#12-cara-menjalankan)
13. [Batasan & Keterbatasan](#13-batasan--keterbatasan)
14. [Rencana Pengembangan Lanjutan](#14-rencana-pengembangan-lanjutan)

---

## 1. Ringkasan Eksekutif

**Track Jobs** adalah aplikasi web manajemen lamaran kerja yang membantu pencari kerja mengelola dan memantau seluruh lamaran mereka dalam satu dasbor terpusat. Aplikasi ini dibangun sebagai prototipe mandiri (*self-contained prototype*) tanpa memerlukan server, database eksternal, atau akun pengguna — cukup dibuka di browser dan langsung dapat digunakan.

Proyek ini dikembangkan dalam konteks **IBM Bob Global AI Builders Challenge** sebagai demonstrasi bagaimana antarmuka produktivitas modern dapat dibangun menggunakan teknologi web standar (HTML5, CSS, JavaScript) dengan bantuan AI sebagai mitra pengembangan.

---

## 2. Latar Belakang & Problem Statement

### 2.1 Kondisi yang Terjadi

Pencari kerja modern — terutama mahasiswa, fresh graduate, dan profesional yang sedang transisi karier — lazim mengirimkan lamaran ke puluhan perusahaan secara bersamaan melalui berbagai kanal:

- Portal lowongan (LinkedIn, JobStreet, Glints, Kalibrr)
- Situs karier perusahaan secara langsung
- Referral dari jaringan profesional
- Media sosial dan komunitas

Setiap lamaran memiliki konteks uniknya: tanggal kirim, tenggat waktu, nama rekruter, tahap seleksi, kisaran gaji, dan catatan penting lainnya.

### 2.2 Permasalahan Utama

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | **Tidak ada sistem pelacakan terstruktur** — pencari kerja mengandalkan spreadsheet manual, catatan tersebar, atau memori | Informasi mudah hilang, tidak konsisten |
| 2 | **Status lamaran tidak terstandardisasi** — setiap orang menggunakan label berbeda tanpa sistem yang jelas | Sulit mengevaluasi progres secara keseluruhan |
| 3 | **Tenggat waktu mudah terlewat** — deadline lamaran atau konfirmasi tawaran tidak terpantau | Peluang kerja hilang karena kelalaian administratif |
| 4 | **Tidak ada visibilitas agregat** — sulit menjawab: "Dari 30 lamaran, berapa yang sudah merespons?" | Tidak bisa membuat keputusan strategis berbasis data |
| 5 | **Informasi tersebar di banyak tempat** — URL ada di bookmark, catatan di WhatsApp, jadwal di kalender berbeda | Tidak efisien, memperlambat tindak lanjut |

### 2.3 Dampak Jika Tidak Ditangani

- Melewatkan deadline lamaran atau konfirmasi penawaran kerja
- Tidak dapat mengidentifikasi pola kegagalan untuk perbaikan strategi
- Proses pencarian kerja menjadi sumber stres tambahan yang tidak perlu
- Peluang kerja yang sebenarnya tersedia menjadi terlewat bukan karena kualifikasi, melainkan karena manajemen informasi yang buruk

---

## 3. Target Pengguna

### Pengguna Primer

| Segmen | Deskripsi | Kebutuhan Utama |
|--------|-----------|----------------|
| **Mahasiswa tingkat akhir** | Mulai melamar sebelum wisuda, melamar ke banyak tempat sekaligus | Pelacakan sederhana, mudah diakses dari browser |
| **Fresh Graduate (0–2 tahun)** | Aktif melamar ke berbagai industri dan posisi | Manajemen status yang jelas, pengingat deadline |
| **Profesional pindah kerja** | Melamar sambil masih bekerja, waktu terbatas | Dasbor ringkas, input cepat, pencarian mudah |

### Pengguna Sekunder

- **Career counselor / konselor karier** — membantu klien memantau progres lamaran
- **Mentor / pembimbing magang** — memantau perkembangan peserta bimbingan

---

## 4. Tujuan & Sasaran Produk

### Tujuan Utama

> Menyediakan dasbor terpusat yang memungkinkan pencari kerja mencatat, melacak, dan mengevaluasi semua lamaran kerja mereka secara efisien dari satu antarmuka.

### Sasaran Spesifik (OKR)

| Objective | Key Result |
|-----------|------------|
| Kemudahan pencatatan lamaran | Pengguna dapat menambah lamaran baru dalam < 60 detik |
| Visibilitas status yang jelas | Semua lamaran memiliki status yang terdefinisi dari 7 opsi standar |
| Tidak ada lamaran yang terlewat | Indikator tenggat waktu berwarna dengan perhitungan hari real-time |
| Evaluasi progres yang mudah | Kartu statistik agregat terupdate otomatis di setiap perubahan data |
| Akses data yang cepat | Pencarian, filter, dan sortir bekerja simultan tanpa reload halaman |

---

## 5. Lingkup Fitur (Scope)

### ✅ In Scope (Versi 1.0)

- Dashboard dengan kartu statistik dinamis
- CRUD lengkap untuk data lamaran kerja
- 7 status lamaran terstandarisasi
- Pencarian teks real-time (perusahaan & posisi)
- Filter multi-kriteria (status, jenis pekerjaan)
- Sortir (terbaru, terlama, tenggat terdekat, nama perusahaan)
- Persistensi data via `localStorage`
- Notifikasi toast untuk operasi CRUD
- Dialog konfirmasi sebelum penghapusan
- Tampilan detail lamaran
- Indikator tenggat waktu dengan kode warna
- Desain responsif (mobile, tablet, desktop)
- Aksesibilitas dasar (ARIA, keyboard navigation, focus trap)

### ❌ Out of Scope (Versi 1.0)

- Autentikasi pengguna / login
- Sinkronisasi data lintas perangkat
- Notifikasi push / pengingat email
- Integrasi dengan portal lowongan (LinkedIn, JobStreet, dsb.)
- Ekspor data (PDF, Excel, CSV)
- Fitur kolaborasi / berbagi dengan orang lain
- Analitik lanjutan / visualisasi grafik
- Mode gelap (dark mode)
- Fitur AI (saran status otomatis, analisis peluang, dsb.)

---

## 6. Spesifikasi Fungsional

### 6.1 Dashboard

**FR-01** — Dasbor menampilkan 5 kartu statistik yang dihitung secara dinamis:
- Total Lamaran (semua status)
- Dilamar (`Applied`)
- Wawancara (`Interview`)
- Ditawari (`Offered`)
- Ditolak (`Rejected`)

**FR-02** — Statistik diperbarui otomatis setelah setiap operasi Create, Update, dan Delete.

**FR-03** — Daftar 5 lamaran terbaru ditampilkan berdasarkan `createdAt` descending.

**FR-04** — Tombol "Tambah Pekerjaan" tersedia di banner selamat datang dan di topbar.

**FR-05** — Empty state informatif ditampilkan ketika belum ada data lamaran.

---

### 6.2 Manajemen Lamaran (CRUD)

#### CREATE — Tambah Lamaran

**FR-06** — Modal "Tambah Pekerjaan" memuat 10 field input:

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|----------|
| Nama Perusahaan | Text | ✅ | Tidak boleh kosong, maks. 120 karakter |
| Posisi Pekerjaan | Text | ✅ | Tidak boleh kosong, maks. 120 karakter |
| Lokasi | Text | ❌ | Maks. 100 karakter |
| Jenis Pekerjaan | Select | ❌ | Full-time / Part-time / Magang / Kontrak / Freelance / Remote |
| Status | Select | ❌ | 7 pilihan (default: Dilamar) |
| Tanggal Lamaran | Date | ❌ | Default: tanggal hari ini |
| Tenggat Waktu | Date | ❌ | — |
| Kisaran Gaji | Text | ❌ | Maks. 80 karakter |
| Sumber / URL | URL | ❌ | Harus diawali `https://` atau `http://` jika diisi |
| Catatan | Textarea | ❌ | Maks. 500 karakter |

**FR-07** — Validasi dijalankan saat submit. Error ditampilkan per-field dengan pesan yang spesifik.

**FR-08** — Setelah berhasil disimpan, modal ditutup dan toast sukses muncul.

#### READ — Lihat Lamaran

**FR-09** — Halaman Lamaran menampilkan semua lamaran dalam bentuk grid kartu responsif.

**FR-10** — Setiap kartu menampilkan: inisial perusahaan, posisi, nama perusahaan, badge status, lokasi, jenis pekerjaan, tanggal lamaran, dan indikator tenggat waktu.

**FR-11** — Klik kartu membuka modal detail yang memuat semua field data lamaran tersebut.

**FR-12** — Jumlah hasil yang ditampilkan tercantum di atas daftar lamaran.

#### UPDATE — Edit Lamaran

**FR-13** — Tombol edit tersedia di setiap kartu lamaran dan di modal detail.

**FR-14** — Modal edit menampilkan form yang sudah terisi (*pre-populated*) dengan data lamaran yang dipilih.

**FR-15** — Setelah berhasil diperbarui, statistik dan tampilan kartu diperbarui otomatis.

#### DELETE — Hapus Lamaran

**FR-16** — Tombol hapus tersedia di setiap kartu lamaran dan di modal detail.

**FR-17** — Dialog konfirmasi muncul sebelum penghapusan dieksekusi.

**FR-18** — Setelah dihapus, data dihilangkan dari UI, statistik diperbarui, dan toast konfirmasi muncul.

---

### 6.3 Pencarian, Filter & Sortir

**FR-19** — Pencarian real-time berdasarkan nama perusahaan ATAU posisi pekerjaan (case-insensitive).

**FR-20** — Filter status: Semua / Disimpan / Dilamar / Penilaian / Wawancara / Ditawari / Ditolak / Ditarik Kembali.

**FR-21** — Filter jenis pekerjaan: Semua / Full-time / Part-time / Magang / Kontrak / Freelance / Remote.

**FR-22** — Sortir: Terbaru (default) / Terlama / Tenggat Terdekat / Nama Perusahaan (A–Z, lokal Indonesia).

**FR-23** — Ketiga filter (pencarian + status + jenis) bekerja secara simultan dan kumulatif.

**FR-24** — Lamaran tanpa tenggat waktu ditempatkan paling akhir saat sortir "Tenggat Terdekat".

---

### 6.4 Manajemen Status

**FR-25** — Sistem mendukung 7 status lamaran dengan label dan warna badge yang konsisten:

| Nilai Internal | Label Tampilan | Warna Badge |
|---------------|----------------|-------------|
| `Saved` | Disimpan | Abu-abu netral |
| `Applied` | Dilamar | Biru sekunder |
| `Assessment` | Penilaian | Oranye/amber |
| `Interview` | Wawancara | Biru primer |
| `Offered` | Ditawari | Hijau |
| `Rejected` | Ditolak | Merah |
| `Withdrawn` | Ditarik Kembali | Abu-abu gelap |

---

### 6.5 Persistensi Data

**FR-26** — Semua data lamaran disimpan ke `localStorage` dengan key `trackjobs_data` dalam format JSON.

**FR-27** — Data dipulihkan otomatis saat halaman dimuat ulang (*refresh*).

**FR-28** — Jika data tersimpan rusak atau bukan berupa array valid, aplikasi memulai dengan data kosong tanpa crash.

**FR-29** — Semua operasi CRUD (Create, Update, Delete) langsung memperbarui `localStorage`.

> ⚠️ **Catatan:** `localStorage` hanya tersedia di browser yang sama pada perangkat yang sama. Data tidak tersinkronisasi lintas perangkat dan bukan pengganti database server.

---

### 6.6 Notifikasi & Umpan Balik

**FR-30** — Toast notifikasi muncul setelah:
- Lamaran berhasil ditambahkan → tipe `success`
- Lamaran berhasil diperbarui → tipe `success`
- Lamaran berhasil dihapus → tipe `info`
- Gagal menyimpan ke `localStorage` → tipe `error`

**FR-31** — Toast otomatis menghilang setelah 3,5 detik dan dapat ditutup dengan klik.

**FR-32** — Indikator tenggat waktu menggunakan kode warna:
- 🟢 Hijau: lebih dari 7 hari
- 🟡 Kuning: 0–7 hari atau hari ini
- 🔴 Merah: sudah terlewat

---

## 7. Spesifikasi Non-Fungsional

### 7.1 Performa

- **NFR-01** — Aplikasi berjalan sepenuhnya di sisi klien (browser), tanpa request ke server
- **NFR-02** — Pencarian dan filter berjalan secara sinkron tanpa debounce (dapat ditambahkan jika data > 500 entri)
- **NFR-03** — Render UI tidak menggunakan Virtual DOM; DOM dimanipulasi langsung dan efisien

### 7.2 Keamanan

- **NFR-04** — Semua teks dari input pengguna di-render menggunakan `textContent` (bukan `innerHTML`) untuk mencegah serangan XSS
- **NFR-05** — URL eksternal yang dimasukkan pengguna dibuka dengan `rel="noopener noreferrer"` untuk mencegah tabnabbing
- **NFR-06** — Input validasi dijalankan di sisi klien sebelum data disimpan

### 7.3 Aksesibilitas

- **NFR-07** — Semua elemen interaktif memiliki atribut `aria-label` atau `aria-labelledby`
- **NFR-08** — Navigasi keyboard didukung penuh; semua tombol dan kontrol dapat diakses dengan `Tab`
- **NFR-09** — Focus trap aktif di dalam modal dialog untuk mencegah fokus keluar secara tidak sengaja
- **NFR-10** — Status aktif navigasi ditandai dengan `aria-current="page"`
- **NFR-11** — Dukungan `prefers-reduced-motion` — semua transisi dinonaktifkan jika pengguna mengaktifkan preferensi ini

### 7.4 Kompatibilitas

- **NFR-12** — Mendukung browser modern: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **NFR-13** — Tidak memerlukan instalasi, build process, atau koneksi internet (kecuali untuk memuat Tailwind CSS dari CDN saat pertama kali)
- **NFR-14** — Responsif di semua ukuran layar: mobile (≥ 320px), tablet (≥ 768px), desktop (≥ 1024px)

---

## 8. Desain & UX

### 8.1 Palet Warna

| Nama | Hex | Penggunaan |
|------|-----|-----------|
| Primary Blue | `#3368A0` | Sidebar, tombol utama, aksen heading |
| Secondary Blue | `#66A3BF` | Elemen sekunder, hover state, highlight |
| Soft Teal | `#C8DFDB` | Background kartu inisial, hover row, tag |
| Warm Ivory | `#F2EFE7` | Background halaman, input field, surface |

> Referensi: [colorhunt.co/palette/3368a066a3bfc8dfdbf2efe7](https://colorhunt.co/palette/3368a066a3bfc8dfdbf2efe7)

### 8.2 Tipografi

- **Font:** `-apple-system, "Segoe UI", system-ui, sans-serif` (system font stack)
- **Base size:** 14–15px
- **Line height:** 1.6

### 8.3 Layout

- **Desktop (≥ 1024px):** Sidebar tetap di kiri (lebar 240px) + konten utama di kanan
- **Mobile/Tablet (< 1024px):** Sidebar tersembunyi, dapat dibuka via tombol hamburger dengan overlay
- **Konten:** Max-width 1200px, terpusat
- **Kartu statistik:** 2 kolom (mobile) → 3 kolom (tablet) → 5 kolom (desktop)
- **Daftar lamaran:** 1 kolom (mobile) → 2 kolom (tablet) → 3 kolom (desktop)

### 8.4 Prinsip Desain

1. **Kejelasan di atas dekorasi** — setiap elemen visual melayani fungsi informasi
2. **Hierarki informasi** — posisi dan perusahaan ditonjolkan, metadata sekunder disamarkan
3. **Umpan balik langsung** — setiap aksi pengguna mendapat konfirmasi visual segera
4. **Konsistensi** — spacing, radius, shadow, dan warna menggunakan CSS variables terpusat

---

## 9. Arsitektur Teknis

### 9.1 Stack Teknologi

| Layer | Teknologi | Catatan |
|-------|-----------|---------|
| Struktur | HTML5 semantik | Elemen `<main>`, `<aside>`, `<header>`, `<nav>`, `<article>`, `<section>` |
| Gaya | Tailwind CSS (CDN) + `style.css` | Tailwind untuk utilitas, CSS custom untuk komponen |
| Logika | Vanilla JavaScript (ES2020) | `'use strict'`, tanpa framework |
| Penyimpanan | Browser `localStorage` | Key: `trackjobs_data`, nilai: JSON array |
| Build | Tidak ada | Tidak memerlukan npm, webpack, atau build tools |

> ⚠️ **Tailwind CDN** digunakan untuk kemudahan prototipe. Untuk produksi, disarankan menggunakan Tailwind CLI dengan purging CSS.

### 9.2 Pola Arsitektur

Aplikasi menggunakan pola **State → Render** sederhana:

```
User Action
    │
    ▼
Event Listener (script.js)
    │
    ▼
Update State (state.jobs / state.filters)
    │
    ├── saveToStorage() ──► localStorage
    │
    └── refreshUI()
            │
            ├── renderStats()    ──► #stat-*
            ├── renderDashboard() ──► #recent-list
            └── renderApplications() ──► #applications-list
```

### 9.3 Manajemen State

State aplikasi disimpan dalam satu objek JavaScript global:

```javascript
let state = {
  jobs: [],           // Array semua data lamaran
  currentView: 'dashboard',
  editingId: null,    // ID job yang sedang diedit
  deletingId: null,   // ID job yang akan dihapus
  detailId: null,     // ID job yang sedang dilihat
  filters: {
    search: '',
    status: '',
    type: '',
    sort: 'newest',
  },
};
```

---

## 10. Struktur Data

### 10.1 Skema Objek Lamaran

```javascript
{
  id:        String,   // "job_abc123_xyz" — ID unik yang dihasilkan saat create
  company:   String,   // Nama perusahaan (wajib)
  position:  String,   // Posisi pekerjaan (wajib)
  location:  String,   // Lokasi (opsional)
  type:      String,   // "Full-time" | "Part-time" | "Internship" | "Contract" | "Freelance" | "Remote"
  status:    String,   // "Saved" | "Applied" | "Assessment" | "Interview" | "Offered" | "Rejected" | "Withdrawn"
  applyDate: String,   // Format ISO: "YYYY-MM-DD"
  deadline:  String,   // Format ISO: "YYYY-MM-DD" (opsional, bisa string kosong)
  salary:    String,   // Teks bebas, mis. "Rp 10–15 juta / bulan"
  source:    String,   // URL lamaran (opsional, harus valid jika diisi)
  notes:     String,   // Catatan bebas, maks. 500 karakter
  createdAt: Number,   // Timestamp Unix (Date.now()) saat pertama kali disimpan
}
```

### 10.2 Format Penyimpanan localStorage

```
Key   : "trackjobs_data"
Value : JSON.stringify(Array<JobObject>)
```

Contoh:
```json
[
  {
    "id": "job_lx8k2_9r3mf",
    "company": "Tokopedia",
    "position": "Frontend Developer",
    "status": "Interview",
    "applyDate": "2025-06-01",
    "createdAt": 1748736000000
  }
]
```

---

## 11. Struktur File

```
Track Jobs/
├── index.html    — Struktur HTML semantik, semua view & modal
├── style.css     — CSS variables, komponen kustom, layout responsif
├── script.js     — Seluruh logika aplikasi (43 fungsi)
└── README.md     — Dokumen PRD ini
```

### Tanggung Jawab Per File

| File | Baris | Tanggung Jawab |
|------|-------|----------------|
| `index.html` | ~365 | Struktur DOM: sidebar, 2 view, 4 modal, toast container |
| `style.css` | ~1055 | CSS variables, komponen, animasi, media queries |
| `script.js` | ~1000 | State, CRUD, filter/sort, render, event listeners, storage |

---

## 12. Cara Menjalankan

### Prasyarat

- Browser modern (Chrome, Firefox, Edge, atau Safari versi terbaru)
- Koneksi internet (hanya untuk memuat Tailwind CSS dari CDN saat pertama kali)

### Langkah

```bash
# 1. Clone atau download repository
git clone <url-repository>

# 2. Masuk ke folder project
cd "Track Jobs"

# 3. Buka index.html di browser
#    Cara A: Klik dua kali file index.html
#    Cara B: Gunakan ekstensi Live Server di VS Code
#    Cara C: Jalankan server lokal sederhana
npx serve .
```

### Pengujian Manual

| Skenario | Langkah Verifikasi |
|----------|--------------------|
| Tambah lamaran | Klik "Tambah Pekerjaan" → isi form → submit → kartu muncul di grid |
| Validasi form | Submit dengan field kosong → pesan error muncul per field |
| Edit lamaran | Klik ikon edit di kartu → form terisi otomatis → ubah → simpan |
| Hapus lamaran | Klik ikon hapus → dialog konfirmasi → konfirmasi → kartu hilang |
| Statistik | Setiap CRUD → angka di kartu statistik diperbarui otomatis |
| Persistensi | Tambah lamaran → refresh halaman → data masih ada |
| Pencarian | Ketik nama perusahaan → hasil terfilter real-time |
| Tenggat waktu | Set deadline hari ini → indikator kuning "Hari ini!" muncul |
| Responsif | Resize browser ke < 768px → sidebar tersembunyi, layout menumpuk |

---

## 13. Batasan & Keterbatasan

| Batasan | Penjelasan |
|---------|------------|
| **Penyimpanan lokal saja** | Data hanya tersimpan di browser pengguna. Tidak ada sinkronisasi lintas perangkat atau backup otomatis |
| **Kapasitas localStorage** | Browser membatasi localStorage ~5MB. Untuk penggunaan normal (~ratusan lamaran), ini lebih dari cukup |
| **Tanpa autentikasi** | Tidak ada sistem login; siapapun yang mengakses browser yang sama dapat melihat data |
| **Tanpa notifikasi push** | Tidak ada pengingat otomatis untuk deadline yang mendekat |
| **Tailwind via CDN** | Semua kelas Tailwind dimuat (~ 350KB); tidak dioptimalkan untuk produksi |
| **Tanpa fitur AI** | Versi ini tidak mengintegrasikan LLM atau fitur kecerdasan buatan apapun |

---

## 14. Rencana Pengembangan Lanjutan

### Phase 2 — Enhanced Features

- [ ] **Ekspor data** — Unduh daftar lamaran sebagai CSV atau PDF
- [ ] **Import data** — Upload file CSV untuk migrasi dari spreadsheet
- [ ] **Filter tanggal lamaran** — Filter berdasarkan rentang tanggal
- [ ] **Mode gelap (Dark Mode)** — Dukungan `prefers-color-scheme`
- [ ] **Pintasan keyboard** — `Ctrl+N` untuk tambah baru, `Escape` untuk tutup modal

### Phase 3 — Cloud & Collaboration

- [ ] **Autentikasi pengguna** — Login dengan Google/GitHub via OAuth
- [ ] **Sinkronisasi cloud** — Simpan data ke Supabase atau Firebase
- [ ] **Berbagi lamaran** — Bagikan progress ke mentor atau career counselor
- [ ] **Notifikasi email** — Pengingat otomatis untuk deadline yang mendekat

### Phase 4 — AI Integration

- [ ] **Saran status otomatis** — AI menganalisis catatan dan menyarankan pembaruan status
- [ ] **Ringkasan progres** — Chatbot yang merangkum statistik lamaran dalam bahasa natural
- [ ] **Analisis peluang** — Prediksi kemungkinan lolos berdasarkan pola historis
- [ ] **Drafting pesan** — Bantuan AI untuk menulis email follow-up ke rekruter

---

## Kontributor

Proyek ini dikembangkan dengan bantuan **IBM Bob** (AI Assistant) sebagai bagian dari **IBM Bob Global AI Builders Challenge**.

---

*Track Jobs v1.0.0 — Dibuat dengan ❤️ menggunakan HTML5, Tailwind CSS, dan Vanilla JavaScript*
