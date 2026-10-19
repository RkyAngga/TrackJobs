# Track Jobs — Aplikasi Manajemen Lamaran Kerja

> **Status:** ✅ MVP Ready | **Versi:** 2.1 | **Tanggal:** Oktober 2026

Aplikasi web modern untuk mengelola, melacak, dan menganalisis semua lamaran kerja Anda dalam satu dasbor terpusat. Dibangun dengan HTML5, CSS, dan JavaScript vanilla — tanpa server, tanpa database eksternal, tanpa setup rumit.

![Track Jobs Dashboard](https://img.shields.io/badge/dashboard-active-blue) ![AI Agent](https://img.shields.io/badge/ai%20agent-active-brightgreen) ![Supabase](https://img.shields.io/badge/database-supabase-green) ![Mobile Responsive](https://img.shields.io/badge/responsive-mobile%2Ftablet%2Fdesktop-orange)

---

## 📋 Daftar Isi

- [Ringkasan Project](#ringkasan-project)
- [Fitur Utama](#fitur-utama)
- [Fungsi & Kemampuan](#fungsi--kemampuan)
- [Tech Stack](#tech-stack)
- [Setup & Instalasi](#setup--instalasi)
- [Cara Menggunakan](#cara-menggunakan)
- [Struktur File](#struktur-file)
- [Data & Penyimpanan](#data--penyimpanan)
- [AI Agent (Fitur Baru)](#ai-agent-fitur-baru)
- [Rencana Pengembangan](#rencana-pengembangan)
- [Kontribusi](#kontribusi)

---

## 🎯 Ringkasan Project

**Track Jobs** adalah solusi manajemen lamaran kerja yang dirancang untuk pencari kerja modern — mahasiswa, fresh graduate, dan profesional pindah kerja yang melamar ke banyak perusahaan secara bersamaan.

### Masalah yang Diselesaikan

| Masalah | Solusi |
|---------|--------|
| 📌 Lamaran tersebar di berbagai tempat (email, notes, browser tabs) | ✅ Dashboard terpusat dengan semua data dalam satu tempat |
| 📅 Tenggat waktu mudah terlewat | ✅ Indikator deadline dengan warna & sorting berdasarkan tenggat terdekat |
| 📊 Tidak tahu progres keseluruhan lamaran | ✅ Statistik real-time: total, dilamar, wawancara, ditawari, ditolak |
| 🔍 Sulit menemukan lamaran spesifik | ✅ Pencarian real-time, filter multi-kriteria, dan sortir fleksibel |
| 🤖 Input manual setiap data memakan waktu | ✅ **AI Agent** — ekstrak data dari gambar/teks lowongan secara otomatis |

---

## ✨ Fitur Utama

### 1. **Dashboard Interaktif**
- Kartu statistik dinamis: Total, Dilamar, Wawancara, Ditawari, Ditolak
- Daftar 5 lamaran terbaru dengan info ringkas
- Empty state yang informatif untuk pemula
- Responsif di semua ukuran layar (mobile, tablet, desktop)

### 2. **Manajemen Data (CRUD)**
- ➕ **Tambah** lamaran baru dengan 10 field terstruktur
- 📖 **Lihat** detail lengkap setiap lamaran
- ✏️ **Edit** data lamaran kapan saja
- 🗑️ **Hapus** lamaran dengan konfirmasi dialog

### 3. **Pencarian & Filter**
- 🔍 **Pencarian real-time** berdasarkan nama perusahaan atau posisi
- 🏷️ **Filter status**: Disimpan, Dilamar, Penilaian, Wawancara, Ditawari, Ditolak, Ditarik Kembali
- 💼 **Filter jenis pekerjaan**: Full-time, Part-time, Magang, Kontrak, Freelance, Remote
- 📊 **Sortir fleksibel**: Terbaru, Terlama, Tenggat Terdekat, Nama Perusahaan (A-Z)
- Kombinasi ketiga filter bekerja simultan

### 4. **Sistem Status Standar**
7 status lamaran dengan warna badge konsisten:
- 🟦 **Disimpan** — Belum dikirim, simpanan sementara
- 🟦 **Dilamar** — Sudah dikirim, menunggu respons
- 🟧 **Penilaian** — Dalam tahap assessment/tes
- 🔵 **Wawancara** — Sudah lolos seleksi, jadwal wawancara
- 🟩 **Ditawari** — Menerima penawaran kerja
- 🔴 **Ditolak** — Lamaran ditolak
- ⚫ **Ditarik Kembali** — Membatalkan lamaran

### 5. **Indikator Tenggat Waktu**
- 🟢 **Hijau**: Lebih dari 7 hari
- 🟡 **Kuning**: 0–7 hari atau hari ini
- 🔴 **Merah**: Sudah terlewat

### 6. **AI Agent** ⭐ (Fitur Terbaru)
- 📸 **Upload Gambar**: Screenshot lowongan, foto brosur, atau poster
- 📝 **Tempel Teks**: Copy-paste deskripsi lowongan langsung
- 🤖 **Ekstraksi Otomatis**: AI menganalisis dan ekstrak semua data:
  - Nama perusahaan & posisi (wajib)
  - Lokasi, tipe pekerjaan, gaji
  - Deadline, link sumber, catatan penting
- 📦 **Batch Processing**: Proses hingga 14+ lowongan sekaligus
- 💾 **Auto-Save**: Hasil langsung tersimpan ke Supabase
- ✅ **Multi-Lowongan**: Deteksi dan proses semua lowongan dari satu input

### 7. **Notifikasi & Feedback**
- 🔔 Toast notifikasi untuk setiap aksi (berhasil/gagal)
- ⏱️ Auto-dismiss setelah 3,5 detik
- 🎯 Dialog konfirmasi sebelum penghapusan

### 8. **Aksesibilitas**
- ♿ ARIA labels & keyboard navigation
- 🎨 Dukungan `prefers-reduced-motion`
- ⌨️ Focus trap di modal dialog
- 🌐 Semantic HTML5

---

## 🔧 Fungsi & Kemampuan

### Data Fields (10 Input)
| Field | Tipe | Wajib | Validasi |
|-------|------|-------|----------|
| Nama Perusahaan | Text | ✅ | Max 120 karakter |
| Posisi Pekerjaan | Text | ✅ | Max 120 karakter |
| Lokasi | Text | ❌ | Max 100 karakter |
| Jenis Pekerjaan | Select | ❌ | 6 opsi |
| Status | Select | ❌ | 7 opsi (default: Dilamar) |
| Tanggal Lamaran | Date | ❌ | Default: hari ini |
| Tenggat Waktu | Date | ❌ | Format: YYYY-MM-DD |
| Kisaran Gaji | Text | ❌ | Max 80 karakter |
| Sumber / URL | URL | ❌ | Validasi protokol https:// |
| Catatan | Textarea | ❌ | Max 500 karakter |

### Operasi CRUD
- **Create**: Modal form dengan validasi real-time
- **Read**: Grid kartu responsif + modal detail
- **Update**: Edit in-place, data sync langsung
- **Delete**: Konfirmasi & rollback otomatis

### Kalkulasi & Agregasi
- Statistik dihitung ulang setelah setiap aksi
- Sorting berdasarkan deadline real-time
- Perhitungan jumlah hari hasil lamaran otomatis

---

## 🛠️ Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Frontend** | HTML5 + CSS3 + JavaScript ES2020 | Vanilla, tidak perlu build tools |
| **Styling** | Tailwind CSS (CDN) + Custom CSS | Utility-first, desain konsisten |
| **Data Layer** | Supabase (PostgreSQL) | Real-time sync, auth built-in, scalable |
| **Autentikasi** | Supabase Auth | Email/password, session management |
| **AI** | Google Gemini API | Vision + text extraction multi-lowongan |
| **Hosting** | Static (browser-based) | Tidak perlu server, deploy di GitHub Pages |

---

## 📦 Setup & Instalasi

### Persyaratan
- Browser modern: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- Koneksi internet (untuk CDN & API)
- API key dari Google Gemini (untuk fitur AI Agent)
- Akun Supabase (untuk login & data sync)

### Langkah 1: Clone Repository
```bash
git clone https://github.com/yourusername/track-jobs.git
cd track-jobs
```

### Langkah 2: Setup Supabase
1. Buat project di [supabase.com](https://supabase.com)
2. Buat tabel `jobs` dengan skema:
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  type TEXT,
  status TEXT DEFAULT 'Applied',
  apply_date DATE,
  deadline DATE,
  salary TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
3. Copy `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari project settings

### Langkah 3: Konfigurasi API Keys
Edit `script.js` baris 21-22:
```javascript
const SUPABASE_URL      = 'your_supabase_url';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
```

Untuk AI Agent, masukkan Gemini API key saat menggunakan fitur (disimpan lokal di browser).

### Langkah 4: Jalankan Aplikasi
```bash
# Buka file index.html di browser
# Atau gunakan local server:
python3 -m http.server 8000
# Buka http://localhost:8000
```

---

## 🎮 Cara Menggunakan

### Dashboard
1. **Login** dengan email & password (atau daftar akun baru)
2. Lihat **statistik ringkas** di banner selamat datang
3. Lihat **5 lamaran terbaru** di bagian bawah
4. Klik **"+ Tambah Pekerjaan"** untuk lamaran baru

### Tambah Lamaran Manual
1. Klik tombol **"+ Tambah Pekerjaan"**
2. Isi form dengan detail lamaran
3. Klik **"Simpan"**
4. Data langsung tersimpan & statistik ter-update

### Gunakan AI Agent (Otomatis)
1. Klik **"AI Agent"** di topbar
2. Pilih tab **"Gambar"** (upload screenshot) atau **"Teks"** (paste teks)
3. Masukkan **Gemini API Key** (gratis dari aistudio.google.com)
4. Klik **"Analisis dengan AI"**
5. AI membaca & ekstrak semua lowongan otomatis
6. Klik **"Simpan"** untuk menyimpan hasil ke dashboard
7. Lamaran langsung muncul di dashboard

### Cari & Filter
1. Ketik **nama perusahaan atau posisi** di search bar
2. Pilih **filter status** atau **jenis pekerjaan**
3. Pilih **urutan sortir** (terbaru, tenggat terdekat, dll)
4. Hasil ter-update real-time

### Edit / Hapus Lamaran
1. Klik kartu lamaran untuk lihat detail
2. Klik **"Edit"** untuk ubah data
3. Klik **"Hapus"** untuk menghapus (perlu konfirmasi)

---

## 📁 Struktur File

```
track-jobs/
├── index.html          # Halaman utama (HTML semantik)
├── script.js           # Logic aplikasi + AI integration (2000+ baris)
├── style.css           # Custom CSS + responsive design
├── PRD.md              # Product Requirements Document
├── README.md           # File ini
├── package.json        # (opsional) metadata project
└── .git/               # Git repository
```

### File Utama

#### `index.html` (~600 baris)
- Struktur dasar HTML5 semantik
- Navigation sidebar + topbar
- Dashboard view + Applications view
- Modal forms (add, edit, detail, AI agent)
- Auth page (login/register)

#### `script.js` (~2100 baris)
**Bagian Utama:**
- Config Supabase & Gemini API
- Auth (login, register, logout)
- CRUD operations (insertJob, updateJob, deleteJob, fetchJobs)
- Rendering UI (renderDashboard, renderJobCards, renderStats)
- Search, filter, sort logic
- **AI Agent** (analyzeWithGemini, parseGeminiResponse, buildGeminiPrompt)
- Notifikasi & toast
- Event listeners

#### `style.css` (~2200 baris)
- CSS variables (warna, typography, spacing)
- Layout flexbox & grid
- Responsive media queries
- Animation & transitions
- Accessibility (prefers-reduced-motion)
- Component styles (buttons, cards, modals, badges)

---

## 💾 Data & Penyimpanan

### Versi 1.0 (localStorage)
- Data disimpan lokal di browser
- Key: `trackjobs_data`
- Format: JSON array

**Keterbatasan:**
- Hanya tersedia di browser yang sama
- Tidak tersinkronisasi lintas perangkat
- Kapasitas ~5-10MB

### Versi 2.0+ (Supabase)
- ✅ **Login/Register** dengan email & password
- ✅ **Real-time sync** lintas perangkat
- ✅ **Cloud backup** otomatis
- ✅ **Multi-user** support
- ✅ **Session management** dengan token refresh
- ✅ **Secure** dengan RLS (Row Level Security)

---

## 🤖 AI Agent (Fitur Baru)

### Cara Kerja
1. **Input**: Gambar lowongan atau teks deskripsi
2. **Processing**: Gemini API menganalisis & ekstrak data
3. **Parser**: JavaScript memproses response dan validasi
4. **Output**: JSON array dengan semua lowongan terdeteksi
5. **Storage**: Auto-save ke Supabase

### Prompt Engineering
AI di-instruksikan untuk:
- Ekstrak **semua lowongan** dari input (tidak hanya satu)
- Fokus pada field wajib: **company** & **position**
- Output berupa **JSON array** konsisten
- Multi-language support (Indonesia, Inggris)
- Handle format beragam (checklist, bullet list, numbered list)

### Parsing Strategy
1. **Strategi 1**: JSON array langsung
2. **Strategi 2**: Individual JSON objects
3. **Strategi 3**: Checklist format (markdown list)
4. **Strategi 4**: Key-value pairs (fallback)

### Error Handling
- Validasi company & position wajib ada
- Convert empty string ke null untuk date fields
- Deduplicate entries
- Sanitasi input HTML/XSS
- Toast error dengan detail

---

## 📈 Rencana Pengembangan

### Versi 2.1 (Current) ✅
- ✅ Login & multi-user support via Supabase
- ✅ AI Agent ekstraksi multi-lowongan
- ✅ Mobile sidebar compact responsive
- ✅ Color palette biru profesional
- ✅ Auto-save tanpa konfirmasi manual

### Versi 2.2 (Planned)
- [ ] **Export data**: PDF, Excel, CSV
- [ ] **Reminders**: Email notifikasi deadline
- [ ] **Analytics**: Grafik success rate, trends
- [ ] **Integrations**: LinkedIn, JobStreet, Glints API
- [ ] **Calendar view**: Timeline deadline
- [ ] **Notes**: Rich text editor per lamaran
- [ ] **Bulk edit**: Edit multiple applications sekaligus

### Versi 3.0 (Long-term)
- [ ] **Mobile app**: Native iOS/Android (React Native)
- [ ] **Collaboration**: Share dengan recruiter/mentor
- [ ] **AI insights**: Saran optimasi CV per lowongan
- [ ] **Interview prep**: Mock interview questions
- [ ] **Salary insights**: Perbandingan market salary
- [ ] **Dark mode**: Theme customization

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Berikut cara berkontribusi:

1. **Fork** repository ini
2. **Buat branch** fitur baru: `git checkout -b feature/nama-fitur`
3. **Commit** perubahan: `git commit -m "Add: deskripsi singkat"`
4. **Push** ke branch: `git push origin feature/nama-fitur`
5. **Buat Pull Request** dengan deskripsi lengkap

### Guidelines
- Ikuti kode existing (vanilla JS, no frameworks)
- Test di berbagai browser & ukuran layar
- Update README jika ada fitur baru
- Hindari breaking changes jika memungkinkan

---

## 📝 License

MIT License — Bebas digunakan untuk project komersial & personal

---

## 👥 Credits

**Dikembangkan untuk:** IBM Bob Global AI Builders Challenge 2026

**Teknologi:**
- Google Gemini API (AI ekstraksi)
- Supabase (database & auth)
- Tailwind CSS (styling)
- Vanilla JavaScript (logic)

---

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **GitHub**: [https://github.com/yourusername/track-jobs](https://github.com/yourusername/track-jobs)
- **Feedback & Issues**: [GitHub Issues](https://github.com/yourusername/track-jobs/issues)
- **Gemini API**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Supabase**: [https://supabase.com](https://supabase.com)

---

## ❓ FAQ

**Q: Apakah data saya aman?**  
A: Data disimpan di Supabase (PostgreSQL) dengan enkripsi. Session diproteksi dengan JWT token.

**Q: Biaya API Gemini?**  
A: Gemini punya free tier untuk development. Check pricing di aistudio.google.com

**Q: Bisa offline?**  
A: Ya, tapi fitur AI memerlukan internet. Data existing bisa diakses offline dari cache.

**Q: Berapa limit lamaran?**  
A: Unlimited. Database Supabase support jutaan rows.

**Q: Multi-device sync?**  
A: Ya, kalau login dengan akun Supabase yang sama di perangkat lain.

---

**Dibuat dengan ❤️ untuk pencari kerja Indonesia**

Last Updated: October 20, 2026
