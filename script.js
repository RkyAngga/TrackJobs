/**
 * Track Jobs — Main Application Script (v2.0 dengan Supabase)
 * =============================================================
 * Vanilla JavaScript — tanpa framework atau pustaka eksternal.
 * Data disimpan di Supabase (PostgreSQL) per akun pengguna.
 *
 * SETUP: Ganti SUPABASE_URL dan SUPABASE_ANON_KEY di bawah ini
 * dengan nilai dari project Supabase Anda.
 * Lihat instruksi lengkap di bagian bawah file ini.
 */

'use strict';

/* =========================================================================
   KONFIGURASI SUPABASE
   =========================================================================
   Ganti dua nilai ini dengan kredensial project Supabase Anda.
   Dapatkan dari: https://app.supabase.com → Project Settings → API
   ========================================================================= */

const SUPABASE_URL      = 'https://czqrfziapwiitoxfvobs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cXJmemlhcHdpaXRveGZ2b2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzODc0OTUsImV4cCI6MjEwNzk2MzQ5NX0.fFat_YjU7KXJ8-GMtZy0JrcoK6a781uFMd3GH3cs7Yc';

/* =========================================================================
   CONSTANTS & CONFIGURATION
   ========================================================================= */

const RECENT_LIMIT = 5;

/** Status label dan kelas badge */
const STATUS_CONFIG = {
  Saved:     { label: 'Disimpan',        badge: 'badge-saved' },
  Applied:   { label: 'Dilamar',         badge: 'badge-applied' },
  Assessment:{ label: 'Penilaian',       badge: 'badge-assessment' },
  Interview: { label: 'Wawancara',       badge: 'badge-interview' },
  Offered:   { label: 'Ditawari',        badge: 'badge-offered' },
  Rejected:  { label: 'Ditolak',         badge: 'badge-rejected' },
  Withdrawn: { label: 'Ditarik Kembali', badge: 'badge-withdrawn' },
};

/* =========================================================================
   APPLICATION STATE
   ========================================================================= */

let state = {
  jobs: [],
  currentView: 'dashboard',
  editingId: null,
  deletingId: null,
  detailId: null,
  currentUser: null,     // objek user Supabase yang sedang login
  filters: {
    search: '',
    status: '',
    type: '',
    sort: 'newest',
  },
};

/* =========================================================================
   SUPABASE CLIENT
   ========================================================================= */

let db = null; // instance Supabase client

/** Inisialisasi Supabase client. Mengembalikan false jika belum dikonfigurasi. */
function initSupabase() {
  const unconfigured =
    !SUPABASE_URL ||
    SUPABASE_URL.includes('GANTI_') ||
    !SUPABASE_URL.startsWith('https://') ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY.includes('GANTI_') ||
    SUPABASE_ANON_KEY.length < 100;

  if (unconfigured) return false;

  try {
    const { createClient } = supabase;
    db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  } catch (e) {
    console.error('Gagal inisialisasi Supabase:', e);
    return false;
  }
}

/* =========================================================================
   SUPABASE: JOBS DATABASE
   ========================================================================= */

/** Ambil semua jobs milik user yang sedang login */
async function fetchJobs() {
  const { data, error } = await db
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Gagal memuat data lamaran.', 'error');
    console.error(error);
    return [];
  }
  // Normalisasi nama kolom snake_case → camelCase untuk kompatibilitas UI
  return (data || []).map(normalizeJob);
}

/** Simpan job baru ke Supabase */
async function insertJob(jobData) {
  if (!jobData.company || !jobData.position) {
    console.error('❌ Data tidak valid: company dan position wajib diisi');
    return null;
  }

  try {
    const { data, error } = await db
      .from('jobs')
      .insert([toDbRow(jobData)])
      .select();

    if (error) {
      console.error('❌ Supabase error:', error.message, error.code);
      
      // Parsing error detail
      if (error.message.includes('foreign key')) {
        showToast('Error: user_id tidak valid. Cek autentikasi.', 'error');
      } else if (error.message.includes('not-null')) {
        showToast('Error: Ada field wajib yang kosong.', 'error');
      } else if (error.message.includes('duplicate')) {
        showToast('Error: Data duplikat.', 'error');
      } else {
        showToast(`Error: ${error.message}`, 'error');
      }
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Insert berhasil tapi data tidak dikembalikan');
      return null;
    }

    return normalizeJob(data[0]);
  } catch (e) {
    console.error('❌ Exception di insertJob:', e);
    showToast(`Error: ${e.message}`, 'error');
    return null;
  }
}

/** Perbarui job yang ada di Supabase */
async function updateJob(jobId, jobData) {
  const { data, error } = await db
    .from('jobs')
    .update(toDbRow(jobData))
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    showToast('Gagal memperbarui lamaran.', 'error');
    console.error(error);
    return null;
  }
  return normalizeJob(data);
}

/** Hapus job dari Supabase */
async function deleteJob(jobId) {
  const { error } = await db
    .from('jobs')
    .delete()
    .eq('id', jobId);

  if (error) {
    showToast('Gagal menghapus lamaran.', 'error');
    console.error(error);
    return false;
  }
  return true;
}

/**
 * Konversi objek JS (camelCase) ke baris database (snake_case).
 * Field user_id diambil otomatis dari session aktif.
 */
function toDbRow(job) {
  // Helper: konversi empty string ke null untuk field date
  const toDateOrNull = (val) => {
    if (!val || val.trim() === '' || val === 'null' || val === 'undefined') return null;
    // Validasi format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return null;
    return val;
  };

  return {
    user_id:    state.currentUser.id,
    company:    job.company || '',
    position:   job.position || '',
    location:   job.location || null,
    type:       job.type || null,
    status:     job.status || 'Applied',
    apply_date: toDateOrNull(job.applyDate),
    deadline:   toDateOrNull(job.deadline),
    salary:     job.salary || null,
    source:     job.source || null,
    notes:      job.notes || null,
  };
}

/**
 * Konversi baris database (snake_case) ke objek JS (camelCase).
 */
function normalizeJob(row) {
  return {
    id:        row.id,
    company:   row.company,
    position:  row.position,
    location:  row.location   || '',
    type:      row.type       || '',
    status:    row.status     || 'Applied',
    applyDate: row.apply_date || '',
    deadline:  row.deadline   || '',
    salary:    row.salary     || '',
    source:    row.source     || '',
    notes:     row.notes      || '',
    createdAt: new Date(row.created_at).getTime(),
  };
}

/* =========================================================================
   SUPABASE: AUTENTIKASI
   ========================================================================= */

/** Daftar akun baru dengan email + password */
async function signUp(name, email, password) {
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) return { error: error.message };
  if (data.user && !data.session) {
    // Supabase mengirim email konfirmasi
    return { needsConfirmation: true };
  }
  return { user: data.user };
}

/** Login dengan email + password */
async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { user: data.user };
}

/** Logout */
async function signOut() {
  await db.auth.signOut();
  state.currentUser = null;
  state.jobs = [];
  showAuthPage();
}

/* =========================================================================
   UI: HALAMAN AUTH vs APP
   ========================================================================= */

function showLoadingScreen() {
  document.getElementById('loading-screen').classList.remove('hidden');
}

function hideLoadingScreen() {
  document.getElementById('loading-screen').classList.add('hidden');
}

function showAuthPage() {
  document.getElementById('auth-page').classList.remove('hidden');
  document.getElementById('app-wrapper').classList.add('hidden');
  hideLoadingScreen();
  // Reset form
  document.getElementById('login-form').reset();
  document.getElementById('register-form').reset();
  clearAuthErrors();
}

function showAppPage() {
  document.getElementById('auth-page').classList.add('hidden');
  document.getElementById('app-wrapper').classList.remove('hidden');
  hideLoadingScreen();
}

function clearAuthErrors() {
  ['err-login-email','err-login-password','err-login-global',
   'err-register-name','err-register-email','err-register-password','err-register-global']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  ['login-email','login-password','register-name','register-email','register-password']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('input-error');
    });
}

/** Tampilkan info user yang login di sidebar */
function renderUserInfo(user) {
  const name  = user.user_metadata?.full_name || user.email.split('@')[0];
  const email = user.email;
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  document.getElementById('user-name').textContent    = sanitize(name);
  document.getElementById('user-email').textContent   = sanitize(email);
  document.getElementById('user-avatar').textContent  = initials;
  document.getElementById('welcome-heading').textContent = `Halo, ${sanitize(name.split(' ')[0])}! 👋`;
}

/* =========================================================================
   AUTH: FORM HANDLERS
   ========================================================================= */

function setAuthLoading(formType, loading) {
  const btn     = document.getElementById(`btn-${formType}`);
  const text    = document.getElementById(`btn-${formType}-text`);
  const spinner = document.getElementById(`btn-${formType}-spinner`);
  btn.disabled  = loading;
  text.textContent = loading
    ? (formType === 'login' ? 'Memuat…' : 'Membuat akun…')
    : (formType === 'login' ? 'Masuk' : 'Buat Akun');
  spinner.classList.toggle('hidden', !loading);
}

async function handleLogin(e) {
  e.preventDefault();
  clearAuthErrors();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('login-email').classList.add('input-error');
    document.getElementById('err-login-email').textContent = 'Masukkan email yang valid.';
    valid = false;
  }
  if (!password) {
    document.getElementById('login-password').classList.add('input-error');
    document.getElementById('err-login-password').textContent = 'Kata sandi tidak boleh kosong.';
    valid = false;
  }
  if (!valid) return;

  setAuthLoading('login', true);
  const result = await signIn(email, password);
  setAuthLoading('login', false);

  if (result.error) {
    document.getElementById('err-login-global').textContent =
      result.error.includes('Invalid login') || result.error.includes('invalid_credentials')
        ? 'Email atau kata sandi salah.'
        : result.error;
    return;
  }

  // Login berhasil — onAuthStateChange akan menangani transisi
}

async function handleRegister(e) {
  e.preventDefault();
  clearAuthErrors();

  const name     = document.getElementById('register-name').value.trim();
  const email    = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  let valid = true;

  if (!name) {
    document.getElementById('register-name').classList.add('input-error');
    document.getElementById('err-register-name').textContent = 'Nama lengkap wajib diisi.';
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('register-email').classList.add('input-error');
    document.getElementById('err-register-email').textContent = 'Masukkan email yang valid.';
    valid = false;
  }
  if (!password || password.length < 6) {
    document.getElementById('register-password').classList.add('input-error');
    document.getElementById('err-register-password').textContent = 'Kata sandi minimal 6 karakter.';
    valid = false;
  }
  if (!valid) return;

  setAuthLoading('register', true);
  const result = await signUp(name, email, password);
  setAuthLoading('register', false);

  if (result.error) {
    document.getElementById('err-register-global').textContent =
      result.error.includes('already registered') || result.error.includes('already been registered')
        ? 'Email ini sudah terdaftar. Silakan masuk.'
        : result.error;
    return;
  }

  if (result.needsConfirmation) {
    document.getElementById('err-register-global').style.color = 'var(--color-success)';
    document.getElementById('err-register-global').textContent =
      '✓ Cek email Anda untuk konfirmasi akun, lalu masuk.';
    return;
  }

  // Registrasi + auto-login berhasil — onAuthStateChange akan menangani transisi
}

/* =========================================================================
   DATA HELPERS
   ========================================================================= */

/** Sanitasi teks pengguna (mencegah XSS) */
function sanitize(str) {
  return (str || '').toString().trim();
}

/** Format tanggal ke format lokal Indonesia */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/** Menghitung selisih hari dari hari ini ke tanggal tertentu */
function daysFromNow(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

/** Menghasilkan teks dan kelas CSS untuk tenggat waktu */
function deadlineInfo(dateStr) {
  if (!dateStr) return { text: 'Tidak ada', cls: 'deadline-none' };
  const days = daysFromNow(dateStr);
  if (days < 0)   return { text: `Lewat ${Math.abs(days)} hari`, cls: 'deadline-passed' };
  if (days === 0) return { text: 'Hari ini!',                    cls: 'deadline-near' };
  if (days <= 7)  return { text: `${days} hari lagi`,            cls: 'deadline-near' };
  return { text: formatDate(dateStr), cls: 'deadline-ok' };
}

/** Mengambil 1–2 huruf inisial perusahaan */
function getInitials(name) {
  const words = sanitize(name).split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Badge HTML untuk status */
function statusBadgeHTML(status) {
  const cfg = STATUS_CONFIG[status] || { label: status, badge: 'badge-saved' };
  const span = document.createElement('span');
  span.className = `badge ${cfg.badge}`;
  span.textContent = cfg.label;
  return span;
}

/* =========================================================================
   STATISTICS
   ========================================================================= */

function computeStats() {
  return {
    total:     state.jobs.length,
    applied:   state.jobs.filter(j => j.status === 'Applied').length,
    interview: state.jobs.filter(j => j.status === 'Interview').length,
    offered:   state.jobs.filter(j => j.status === 'Offered').length,
    rejected:  state.jobs.filter(j => j.status === 'Rejected').length,
  };
}

function renderStats() {
  const s = computeStats();
  const updates = {
    'stat-total':     s.total,
    'stat-applied':   s.applied,
    'stat-interview': s.interview,
    'stat-offered':   s.offered,
    'stat-rejected':  s.rejected,
  };
  Object.entries(updates).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = parseInt(el.textContent, 10);
    el.textContent = val;
    // Animasi bounce hanya jika nilai berubah
    if (prev !== val) {
      el.classList.remove('updated');
      // Force reflow agar animasi bisa diulang
      void el.offsetWidth;
      el.classList.add('updated');
      el.addEventListener('animationend', () => el.classList.remove('updated'), { once: true });
    }
  });
}

/* =========================================================================
   FILTERING & SORTING
   ========================================================================= */

function getFilteredJobs() {
  const { search, status, type, sort } = state.filters;
  const q = search.toLowerCase().trim();

  let jobs = state.jobs.filter(job => {
    if (q) {
      const inCompany  = job.company.toLowerCase().includes(q);
      const inPosition = job.position.toLowerCase().includes(q);
      if (!inCompany && !inPosition) return false;
    }
    if (status && job.status !== status) return false;
    if (type && job.type !== type) return false;
    return true;
  });

  jobs = [...jobs].sort((a, b) => {
    switch (sort) {
      case 'newest':   return (b.createdAt || 0) - (a.createdAt || 0);
      case 'oldest':   return (a.createdAt || 0) - (b.createdAt || 0);
      case 'deadline': {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      case 'company':  return a.company.localeCompare(b.company, 'id');
      default:         return 0;
    }
  });

  return jobs;
}

/* =========================================================================
   RENDER: APPLICATIONS VIEW
   ========================================================================= */

function renderApplications() {
  const container = document.getElementById('applications-list');
  const jobs = getFilteredJobs();
  container.innerHTML = '';

  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = `${jobs.length} lamaran ditemukan`;

  if (jobs.length === 0) {
    const hasFilters = state.filters.search || state.filters.status || state.filters.type;
    container.appendChild(buildEmptyState(hasFilters ? 'Tidak ada hasil' : ''));
    return;
  }

  jobs.forEach(job => container.appendChild(buildJobCard(job)));
}

/** Membangun elemen kartu pekerjaan */
function buildJobCard(job) {
  const card = document.createElement('article');
  card.className = 'job-card';
  card.setAttribute('data-id', job.id);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `${job.position} di ${job.company}`);

  // Header
  const header = document.createElement('div');
  header.className = 'job-card-header';

  const logo = document.createElement('div');
  logo.className = 'job-company-logo';
  logo.textContent = getInitials(job.company);

  const titleWrap = document.createElement('div');
  titleWrap.className = 'job-card-title-wrap';
  const position = document.createElement('div');
  position.className = 'job-position';
  position.textContent = sanitize(job.position);
  const company = document.createElement('div');
  company.className = 'job-company';
  company.textContent = sanitize(job.company);
  titleWrap.append(position, company);
  header.append(logo, titleWrap, statusBadgeHTML(job.status));

  // Meta
  const meta = document.createElement('div');
  meta.className = 'job-card-meta';

  if (job.location) {
    const loc = document.createElement('span');
    loc.className = 'meta-item';
    loc.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    loc.appendChild(document.createTextNode(sanitize(job.location)));
    meta.appendChild(loc);
  }
  if (job.type) {
    const type = document.createElement('span');
    type.className = 'badge badge-type';
    type.textContent = sanitize(job.type);
    meta.appendChild(type);
  }
  if (job.applyDate) {
    const date = document.createElement('span');
    date.className = 'meta-item';
    date.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    date.appendChild(document.createTextNode(formatDate(job.applyDate)));
    meta.appendChild(date);
  }

  // Footer
  const footer = document.createElement('div');
  footer.className = 'job-card-footer';

  const dl = deadlineInfo(job.deadline);
  const deadlineEl = document.createElement('span');
  deadlineEl.className = `text-muted deadline-text ${dl.cls}`;
  deadlineEl.style.fontSize = '0.78rem';
  deadlineEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  deadlineEl.appendChild(document.createTextNode(dl.text));

  const actions = document.createElement('div');
  actions.className = 'job-card-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-icon';
  editBtn.setAttribute('aria-label', `Edit ${sanitize(job.position)}`);
  editBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(job.id); });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon btn-icon-danger';
  deleteBtn.setAttribute('aria-label', `Hapus ${sanitize(job.position)}`);
  deleteBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
  deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); confirmDelete(job.id); });

  actions.append(editBtn, deleteBtn);
  footer.append(deadlineEl, actions);
  card.append(header, meta, footer);

  card.addEventListener('click', () => openDetailModal(job.id));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetailModal(job.id); }
  });

  return card;
}

/** Empty state element */
function buildEmptyState(message) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:#C8DFDB">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
    <h3>${message || 'Belum ada lamaran'}</h3>
    <p>${message ? 'Coba ubah kata kunci atau filter Anda.' : 'Mulai tambahkan lamaran kerja pertama Anda!'}</p>
  `;
  if (!message) {
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = '+ Tambah Pekerjaan';
    btn.addEventListener('click', openAddModal);
    div.appendChild(btn);
  }
  return div;
}

/* =========================================================================
   RENDER: DASHBOARD
   ========================================================================= */

function renderDashboard() {
  renderStats();
  renderRecentList();
}

function renderRecentList() {
  const container = document.getElementById('recent-list');
  container.innerHTML = '';

  const recent = [...state.jobs]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, RECENT_LIMIT);

  if (recent.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.padding = '28px 16px';
    empty.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:#C8DFDB">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Belum ada lamaran</h3>
      <p>Tambahkan lamaran pertama Anda untuk mulai melacak progres.</p>
    `;
    btnWrap.className = 'empty-state-actions';
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = '+ Tambah Pekerjaan';
    btn.addEventListener('click', openAddModal);
    btnWrap.append(btn);
    empty.appendChild(btnWrap);
    container.appendChild(empty);
    return;
  }

  recent.forEach(job => {
    const row = document.createElement('div');
    row.className = 'recent-job-row';
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-label', `${job.position} di ${job.company}`);

    const logo = document.createElement('div');
    logo.className = 'recent-job-logo';
    logo.textContent = getInitials(job.company);

    const info = document.createElement('div');
    info.className = 'recent-job-info';
    const pos = document.createElement('div');
    pos.className = 'recent-job-position';
    pos.textContent = sanitize(job.position);
    const comp = document.createElement('div');
    comp.className = 'recent-job-company';
    comp.textContent = sanitize(job.company);
    info.append(pos, comp);

    const right = document.createElement('div');
    right.className = 'recent-job-right';
    right.appendChild(statusBadgeHTML(job.status));
    const dateEl = document.createElement('span');
    dateEl.className = 'text-muted';
    dateEl.textContent = formatDate(job.applyDate || new Date(job.createdAt).toISOString().split('T')[0]);
    right.appendChild(dateEl);

    row.append(logo, info, right);
    row.addEventListener('click', () => openDetailModal(job.id));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetailModal(job.id); }
    });
    container.appendChild(row);
  });
}

/* =========================================================================
   RENDER: DETAIL MODAL
   ========================================================================= */

function openDetailModal(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;
  state.detailId = jobId;

  const content = document.getElementById('detail-content');
  content.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'detail-header';
  const logo = document.createElement('div');
  logo.className = 'detail-logo';
  logo.textContent = getInitials(job.company);
  const titleWrap = document.createElement('div');
  const posEl = document.createElement('div');
  posEl.className = 'detail-position';
  posEl.textContent = sanitize(job.position);
  const compEl = document.createElement('div');
  compEl.className = 'detail-company';
  compEl.textContent = sanitize(job.company);
  const badgeWrap = document.createElement('div');
  badgeWrap.style.marginTop = '6px';
  badgeWrap.appendChild(statusBadgeHTML(job.status));
  titleWrap.append(posEl, compEl, badgeWrap);
  header.append(logo, titleWrap);
  content.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'detail-grid';

  function addField(label, value, full, isLink) {
    const field = document.createElement('div');
    field.className = 'detail-field' + (full ? ' detail-notes' : '');
    const lbl = document.createElement('label');
    lbl.textContent = label;
    const p = document.createElement('p');
    if (isLink && value && (value.startsWith('http://') || value.startsWith('https://'))) {
      const a = document.createElement('a');
      a.href = value;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = sanitize(value);
      p.appendChild(a);
    } else {
      p.textContent = sanitize(value) || '—';
    }
    field.append(lbl, p);
    grid.appendChild(field);
  }

  const dl = deadlineInfo(job.deadline);
  addField('Lokasi',         job.location);
  addField('Jenis Pekerjaan',job.type);
  addField('Tanggal Lamaran',formatDate(job.applyDate));
  addField('Tenggat Waktu',  job.deadline ? `${formatDate(job.deadline)} (${dl.text})` : '—');
  addField('Kisaran Gaji',   job.salary);
  addField('Sumber / URL',   job.source, false, true);
  if (job.notes) addField('Catatan', job.notes, true);

  content.appendChild(grid);

  const createdEl = document.createElement('p');
  createdEl.className = 'text-muted';
  createdEl.style.cssText = 'margin-top:16px;font-size:0.75rem';
  createdEl.textContent = `Ditambahkan: ${job.createdAt ? new Date(job.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}`;
  content.appendChild(createdEl);

  document.getElementById('detail-edit-btn').onclick = () => { closeDetailModal(); openEditModal(jobId); };
  document.getElementById('detail-delete-btn').onclick = () => { closeDetailModal(); confirmDelete(jobId); };

  document.getElementById('detail-modal').classList.remove('hidden');
  trapFocus(document.getElementById('detail-modal'));
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.add('hidden');
  state.detailId = null;
}

/* =========================================================================
   MODAL: ADD / EDIT
   ========================================================================= */

function openAddModal() {
  state.editingId = null;
  document.getElementById('modal-title').textContent     = 'Tambah Pekerjaan';
  document.getElementById('btn-submit-text').textContent = 'Simpan';
  resetForm();
  document.getElementById('form-apply-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('form-status').value = 'Applied';
  openModal();
}

function openEditModal(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;
  state.editingId = jobId;
  document.getElementById('modal-title').textContent     = 'Edit Lamaran';
  document.getElementById('btn-submit-text').textContent = 'Perbarui';
  resetForm();
  document.getElementById('form-id').value         = job.id;
  document.getElementById('form-company').value    = sanitize(job.company);
  document.getElementById('form-position').value   = sanitize(job.position);
  document.getElementById('form-location').value   = sanitize(job.location);
  document.getElementById('form-type').value       = job.type || '';
  document.getElementById('form-status').value     = job.status || 'Applied';
  document.getElementById('form-apply-date').value = job.applyDate || '';
  document.getElementById('form-deadline').value   = job.deadline || '';
  document.getElementById('form-salary').value     = sanitize(job.salary);
  document.getElementById('form-source').value     = sanitize(job.source);
  document.getElementById('form-notes').value      = sanitize(job.notes);
  updateNotesCount();
  openModal();
}

function openModal() {
  document.getElementById('job-modal').classList.remove('hidden');
  trapFocus(document.getElementById('job-modal'));
  setTimeout(() => document.getElementById('form-company').focus(), 50);
}

function closeModal() {
  document.getElementById('job-modal').classList.add('hidden');
  state.editingId = null;
  resetForm();
}

function resetForm() {
  document.getElementById('job-form').reset();
  document.getElementById('form-id').value = '';
  clearFormErrors();
  updateNotesCount();
}

function clearFormErrors() {
  ['form-company','form-position','form-source'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('input-error');
  });
  ['err-company','err-position','err-source'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

/* =========================================================================
   FORM VALIDATION & SUBMIT
   ========================================================================= */

function validateForm() {
  let valid = true;
  clearFormErrors();

  const company  = document.getElementById('form-company').value.trim();
  const position = document.getElementById('form-position').value.trim();
  const source   = document.getElementById('form-source').value.trim();

  if (!company) {
    showFieldError('form-company', 'err-company', 'Nama perusahaan wajib diisi.');
    valid = false;
  }
  if (!position) {
    showFieldError('form-position', 'err-position', 'Posisi pekerjaan wajib diisi.');
    valid = false;
  }
  if (source && !/^https?:\/\/.+/.test(source)) {
    showFieldError('form-source', 'err-source', 'URL harus diawali dengan https:// atau http://');
    valid = false;
  }
  return valid;
}

function showFieldError(inputId, errId, message) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (input) input.classList.add('input-error');
  if (err)   err.textContent = message;
  if (input) input.focus();
}

function setSubmitLoading(loading) {
  const btn     = document.getElementById('btn-submit');
  const text    = document.getElementById('btn-submit-text');
  const spinner = document.getElementById('btn-submit-spinner');
  btn.disabled  = loading;
  spinner.classList.toggle('hidden', !loading);
  if (!loading) {
    text.textContent = state.editingId ? 'Perbarui' : 'Simpan';
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const jobData = {
    company:   document.getElementById('form-company').value.trim(),
    position:  document.getElementById('form-position').value.trim(),
    location:  document.getElementById('form-location').value.trim(),
    type:      document.getElementById('form-type').value,
    status:    document.getElementById('form-status').value,
    applyDate: document.getElementById('form-apply-date').value,
    deadline:  document.getElementById('form-deadline').value,
    salary:    document.getElementById('form-salary').value.trim(),
    source:    document.getElementById('form-source').value.trim(),
    notes:     document.getElementById('form-notes').value.trim(),
  };

  setSubmitLoading(true);

  if (state.editingId) {
    // UPDATE
    const updated = await updateJob(state.editingId, jobData);
    setSubmitLoading(false);
    if (!updated) return;
    const idx = state.jobs.findIndex(j => j.id === state.editingId);
    if (idx !== -1) state.jobs[idx] = updated;
    showToast('Lamaran berhasil diperbarui!', 'success');
  } else {
    // CREATE
    const created = await insertJob(jobData);
    setSubmitLoading(false);
    if (!created) return;
    state.jobs.unshift(created);
    showToast('Lamaran berhasil ditambahkan!', 'success');
  }

  closeModal();
  refreshUI();
}

/* =========================================================================
   DELETE
   ========================================================================= */

function confirmDelete(jobId) {
  state.deletingId = jobId;
  document.getElementById('confirm-modal').classList.remove('hidden');
  trapFocus(document.getElementById('confirm-modal'));
  setTimeout(() => document.getElementById('confirm-cancel').focus(), 50);
}

async function executeDelete() {
  if (!state.deletingId) return;
  const job = state.jobs.find(j => j.id === state.deletingId);

  // Disable tombol sementara
  document.getElementById('confirm-ok').disabled = true;
  const ok = await deleteJob(state.deletingId);
  document.getElementById('confirm-ok').disabled = false;

  if (!ok) return;

  state.jobs = state.jobs.filter(j => j.id !== state.deletingId);
  state.deletingId = null;
  document.getElementById('confirm-modal').classList.add('hidden');
  refreshUI();
  showToast(`Lamaran "${job ? sanitize(job.position) : ''}" dihapus.`, 'info');
}

function cancelDelete() {
  state.deletingId = null;
  document.getElementById('confirm-modal').classList.add('hidden');
}

/* =========================================================================
   VIEW NAVIGATION
   ========================================================================= */

function switchView(view) {
  state.currentView = view;

  document.querySelectorAll('.nav-item').forEach(btn => {
    const active = btn.dataset.view === view;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });

  document.getElementById('view-dashboard').classList.toggle('hidden',    view !== 'dashboard');
  document.getElementById('view-applications').classList.toggle('hidden', view !== 'applications');

  const titles = { dashboard: 'Dasbor', applications: 'Lamaran Saya' };
  document.getElementById('topbar-title').textContent = titles[view] || 'Track Jobs';

  closeMobileSidebar();

  if (view === 'dashboard')    renderDashboard();
  if (view === 'applications') renderApplications();
}

/* =========================================================================
   SIDEBAR (MOBILE)
   ========================================================================= */

function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('active');
  document.getElementById('sidebar-overlay').setAttribute('aria-hidden', 'false');
  document.getElementById('menu-toggle').setAttribute('aria-expanded', 'true');
  setTimeout(() => document.getElementById('sidebar-close').focus(), 50);
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  document.getElementById('sidebar-overlay').setAttribute('aria-hidden', 'true');
  document.getElementById('menu-toggle').setAttribute('aria-expanded', 'false');
}

/* =========================================================================
   TOAST NOTIFICATIONS
   ========================================================================= */

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  const icons = {
    success: `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  toast.innerHTML = (icons[type] || icons.info);
  const msgSpan = document.createElement('span');
  msgSpan.textContent = message;
  toast.appendChild(msgSpan);
  container.appendChild(toast);

  const timer = setTimeout(() => dismissToast(toast), 3500);
  toast.addEventListener('click', () => { clearTimeout(timer); dismissToast(toast); });
}

function dismissToast(toast) {
  toast.classList.add('hiding');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/* =========================================================================
   ACCESSIBILITY: FOCUS TRAP
   ========================================================================= */

function trapFocus(element) {
  const focusable = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  function handleTab(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  element.removeEventListener('keydown', element._trapFocusHandler);
  element._trapFocusHandler = handleTab;
  element.addEventListener('keydown', handleTab);
}

/* =========================================================================
   REFRESH UI
   ========================================================================= */

function refreshUI() {
  if (state.currentView === 'dashboard') renderDashboard();
  else renderApplications();
  renderStats();
}

/* =========================================================================
   AI AGENT — GEMINI VISION
   =========================================================================
   Menggunakan Google Gemini 1.5 Flash (gratis) untuk mengekstrak data
   lamaran dari gambar screenshot atau teks yang ditempel pengguna.
   API key disimpan di localStorage browser pengguna (tidak ke server).
   ========================================================================= */

const GEMINI_STORAGE_KEY = 'trackjobs_gemini_key';
// Daftar model Gemini yang dicoba berurutan jika ada yang 404/tidak ditemukan
const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/** State lokal AI modal */
const aiState = {
  mode: 'image',        // 'image' | 'text'
  imageBase64: null,    // base64 string tanpa prefix
  imageMimeType: null,  // 'image/png' | 'image/jpeg' dll
  extracted: null,      // objek hasil ekstraksi AI
};

/* ─── Buka / tutup modal AI ──────────────────────────────────────────────── */

function openAiModal() {
  // Reset state
  aiState.mode = 'image';
  aiState.imageBase64 = null;
  aiState.imageMimeType = null;
  aiState.extracted = null;

  // Reset UI
  document.getElementById('ai-step-input').classList.remove('hidden');
  document.getElementById('ai-step-result').classList.add('hidden');
  document.getElementById('ai-text-input').value = '';
  document.getElementById('err-ai-apikey').textContent = '';
  resetAiDropzone();
  switchAiTab('image');

  // Isi API key yang tersimpan sebelumnya
  const savedKey = localStorage.getItem(GEMINI_STORAGE_KEY) || '';
  document.getElementById('ai-apikey').value = savedKey;

  document.getElementById('ai-modal').classList.remove('hidden');
  trapFocus(document.getElementById('ai-modal'));
  setTimeout(() => document.getElementById('ai-apikey').focus(), 80);
}

function closeAiModal() {
  document.getElementById('ai-modal').classList.add('hidden');
}

/* ─── Switch tab Gambar / Teks ───────────────────────────────────────────── */

function switchAiTab(tab) {
  aiState.mode = tab;
  const isImage = tab === 'image';

  document.getElementById('ai-tab-image').classList.toggle('active', isImage);
  document.getElementById('ai-tab-image').setAttribute('aria-selected', isImage);
  document.getElementById('ai-tab-text').classList.toggle('active', !isImage);
  document.getElementById('ai-tab-text').setAttribute('aria-selected', !isImage);
  document.getElementById('ai-panel-image').classList.toggle('hidden', !isImage);
  document.getElementById('ai-panel-text').classList.toggle('hidden', isImage);
}

/* ─── Dropzone: upload & drag-drop gambar ────────────────────────────────── */

function resetAiDropzone() {
  aiState.imageBase64 = null;
  aiState.imageMimeType = null;
  document.getElementById('ai-dropzone-content').classList.remove('hidden');
  document.getElementById('ai-image-preview').classList.add('hidden');
  document.getElementById('ai-preview-img').src = '';
  document.getElementById('ai-file-input').value = '';
}

function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('File harus berupa gambar (PNG, JPG, WEBP).', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Ukuran gambar maksimal 10MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    // Pisahkan prefix "data:image/png;base64," dari base64 murni
    const [meta, base64] = dataUrl.split(',');
    aiState.imageBase64 = base64;
    aiState.imageMimeType = file.type;

    // Tampilkan preview
    document.getElementById('ai-dropzone-content').classList.add('hidden');
    const preview = document.getElementById('ai-image-preview');
    preview.classList.remove('hidden');
    document.getElementById('ai-preview-img').src = dataUrl;
  };
  reader.readAsDataURL(file);
}

/* ─── Kirim ke Gemini API ────────────────────────────────────────────────── */

/**
 * Prompt yang dikirim ke Gemini.
 * Menginstruksikan AI untuk hanya mengembalikan JSON tanpa markdown.
 */
function buildGeminiPrompt() {
  const today = new Date().toISOString().split('T')[0];
  return `Kamu adalah AI ekstraksi data lowongan kerja yang AKURAT dan LENGKAP.
Tugas: Ekstrak SEMUA lowongan kerja yang ada dalam input teks atau gambar pengguna.

ATURAN UTAMA:
1. JIKA ADA BANYAK LOWONGAN, EKSTRAK SEMUANYA tanpa ada yang terlewat! Contoh jika ada 14 lowongan, hasilkan 14 item dalam array. JANGAN HANYA SATU!
2. Kembalikan HANYA ARRAY JSON: [ { ... }, { ... }, ... ]
3. TANPA pembungkus markdown (JANGAN gunakan \`\`\`json atau \`\`\`), TANPA teks basa-basi sebelum atau sesudah JSON.
4. Setiap item lowongan WAJIB punya:
   - "company": nama perusahaan/instansi (WAJIB ADA)
   - "position": nama posisi/pekerjaan (WAJIB ADA)

JIKA INPUT BERBENTUK LIST / CHECKLIST SEPERTI:
"- [ ] Posisi - Nama PT" atau "- Posisi di Perusahaan":
Pisahkan dengan tepat mana "position" dan mana "company" untuk SETIAP baris!
Contoh:
"Staf IT dan Timbangan (PG Rajawali I) - PT MAGNET SOLUSI INTEGRA"
-> position: "Staf IT dan Timbangan (PG Rajawali I)"
-> company: "PT MAGNET SOLUSI INTEGRA"

Format skema untuk setiap item dalam ARRAY:
{
  "company": "nama PT atau perusahaan",
  "position": "nama posisi atau jabatan",
  "location": "kota/lokasi kerja atau 'Remote'",
  "type": "Full-time / Part-time / Internship / Contract / Freelance / Remote",
  "status": "Applied",
  "applyDate": "${today}",
  "deadline": "YYYY-MM-DD jika ada, jika tidak kosongkan",
  "salary": "kisaran gaji asli jika ada, jika tidak kosongkan",
  "source": "URL lowongan jika ada, jika tidak kosongkan",
  "notes": "informasi penting lainnya",
  "confidence": "high / medium / low"
}

OUTPUT: HANYA ARRAY JSON VALID [ ... ].`;
}

async function analyzeWithGemini() {
  const apiKey = document.getElementById('ai-apikey').value.trim();
  document.getElementById('err-ai-apikey').textContent = '';

  // Validasi API key
  if (!apiKey || apiKey.length < 20) {
    document.getElementById('err-ai-apikey').textContent = 'API key tidak boleh kosong (minimal 20 karakter).';
    document.getElementById('ai-apikey').focus();
    return;
  }

  // Validasi input konten
  const isImage = aiState.mode === 'image';
  if (isImage && !aiState.imageBase64) {
    showToast('Upload gambar terlebih dahulu.', 'error');
    return;
  }
  const textInput = document.getElementById('ai-text-input').value.trim();
  if (!isImage && !textInput) {
    showToast('Tempel teks lowongan terlebih dahulu.', 'error');
    return;
  }

  // Simpan API key ke localStorage untuk digunakan berikutnya
  localStorage.setItem(GEMINI_STORAGE_KEY, apiKey);

  // Set loading state
  setAiAnalyzeLoading(true);

  try {
    // Bangun parts dengan urutan yang benar: prompt text DULU, baru image/text
    const parts = [];
    
    // Part 1: System prompt
    parts.push({ text: buildGeminiPrompt() });

    // Part 2: Konten (image atau text)
    if (isImage) {
      parts.push({
        inline_data: {
          mime_type: aiState.imageMimeType,
          data: aiState.imageBase64,
        }
      });
    } else {
      parts.push({ text: `Konten lowongan kerja:\n${textInput}` });
    }

    const requestBody = {
      contents: [{ 
        parts: parts
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    };

    console.log('🔍 Mengirim ke Gemini…');
    console.log('Mode:', isImage ? 'GAMBAR' : 'TEKS');
    console.log('Image Base64 length:', aiState.imageBase64?.length || 0);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Ambil daftar model aktif dari API key. Hindari model statis yang sudah deprecated.
    let availableModels = [];
    try {
      const modelsResponse = await fetch(`${GEMINI_API_ROOT}/models?key=${encodeURIComponent(apiKey)}`);
      const modelsData = await modelsResponse.json();
      if (modelsResponse.ok) {
        availableModels = (modelsData.models || [])
          .filter(model => (model.supportedGenerationMethods || []).includes('generateContent'))
          .map(model => model.name.replace(/^models\//, ''));
      }
    } catch (listError) {
      console.warn('Gagal mengambil daftar model:', listError);
    }

    // Prioritaskan model yang dikenal; fallback ke model apa pun yang support generateContent.
    const modelsToTry = [
      ...GEMINI_MODELS.filter(model => availableModels.includes(model)),
      ...availableModels.filter(model => !GEMINI_MODELS.includes(model)),
    ];

    if (modelsToTry.length === 0) {
      throw new Error('API key tidak memiliki model Gemini yang mendukung generateContent. Periksa API key, project, dan Gemini API di Google AI Studio.');
    }

    let data = null;
    let lastError = null;
    for (const model of modelsToTry) {
      const url = `${GEMINI_API_ROOT}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      console.log('→ mencoba model:', model);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const json = await response.json();
        console.log('Response status:', response.status, '| model:', model);

        if (response.ok && json?.candidates?.length) {
          data = json;
          console.log('✅ model aktif:', model);
          break;
        }

        const errMsg = json?.error?.message || `HTTP ${response.status}`;
        lastError = { message: errMsg, code: json?.error?.code };
        console.warn('⚠️ gagal:', model, '→', errMsg);
      } catch (netErr) {
        lastError = { message: netErr.message, code: 0 };
        console.warn('⚠️ network error pada model', model, netErr.message);
      }
    }

    if (!data) {
      const msg = lastError ? `${lastError.message} (${lastError.code})` : 'Tidak ada model yang merespons.';
      console.error('❌ Semua model gagal:', msg);
      throw new Error(msg);
    }

    // Extract response
    const candidate = data?.candidates?.[0];
    if (!candidate) {
      throw new Error('Tidak ada kandidat dalam respons Gemini.');
    }

    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      console.warn('⚠️ finishReason:', finishReason);
      if (finishReason === 'SAFETY') {
        throw new Error('Konten ditolak oleh filter keamanan Gemini. Coba gambar atau teks lain.');
      }
    }

    const rawText = candidate?.content?.parts?.[0]?.text || '';
    
    if (!rawText || rawText.trim() === '') {
      throw new Error('AI tidak menghasilkan respons. Coba lagi atau gunakan gambar/teks yang lebih jelas.');
    }

    console.log('✅ Raw text dari AI:', rawText);

    // Parse semua lowongan, lalu simpan langsung ke Supabase.
    const extractedJobs = parseGeminiResponse(rawText);
    if (!extractedJobs.length) {
      console.warn('⚠️ Tidak ada lowongan valid dari:', rawText);
      throw new Error('AI tidak menemukan data lowongan valid. Coba input yang lebih jelas.');
    }

    const savedJobs = [];
    for (const job of extractedJobs) {
      const created = await insertJob(job);
      if (created) savedJobs.push(created);
    }

    if (!savedJobs.length) {
      throw new Error('Data terbaca, tetapi gagal disimpan. Periksa koneksi dan izin tabel Supabase.');
    }

    state.jobs = [...savedJobs, ...state.jobs];
    refreshUI();
    closeAiModal();
    showToast(`${savedJobs.length} lowongan berhasil dibaca dan langsung disimpan.`, 'success');

  } catch (e) {
    console.error('❌ Error di analyzeWithGemini:', e);
    const msg = e.message || 'Terjadi kesalahan saat menghubungi AI.';
    
    // Error handling detail
    if (msg.includes('API_KEY_INVALID') || msg.includes('INVALID_ARGUMENT')) {
      document.getElementById('err-ai-apikey').textContent = 'API key tidak valid. Periksa di https://aistudio.google.com/app/apikey';
      showToast('API key tidak valid.', 'error');
    } else if (msg.includes('401') || msg.includes('UNAUTHENTICATED')) {
      document.getElementById('err-ai-apikey').textContent = 'API key tidak dikenali. Buat key baru di Google AI Studio.';
      showToast('Autentikasi gagal.', 'error');
    } else if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      showToast('Tidak ada izin. Periksa API key dan aktivasi Gemini API.', 'error');
    } else if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
      showToast('Kuota Gemini habis. Tunggu beberapa jam atau upgrade account.', 'error');
    } else if (msg.includes('SAFETY')) {
      showToast('Konten ditolak filter keamanan. Coba gambar/teks lain.', 'error');
    } else if (msg.includes('MODEL_NOT_FOUND') || msg.includes('404')) {
      showToast('Model Gemini tidak ditemukan. Coba refresh halaman.', 'error');
    } else if (msg.includes('network') || msg.includes('fetch')) {
      showToast('Gagal terhubung ke AI. Periksa koneksi internet.', 'error');
    } else {
      showToast(`Error: ${msg}`, 'error');
    }
  } finally {
    setAiAnalyzeLoading(false);
  }
}

/** Parsing respons teks Gemini menjadi objek JavaScript */
function parseGeminiResponse(rawText) {
  if (!rawText || rawText.trim() === '') return [];

  console.log('📝 Parsing rawText:', rawText.substring(0, 200) + '...');

  // Strategi 1: bersihkan markdown code block, coba parse langsung
  try {
    const cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    const jobs = Array.isArray(parsed) ? parsed : [parsed];
    const validJobs = jobs.map(sanitizeParsedJob).filter(Boolean);
    if (validJobs.length) {
      console.log(`✅ Parsing berhasil: ${validJobs.length} lowongan`);
      return validJobs;
    }
  } catch (e) {
    console.log('⚠️ Strategi 1 gagal:', e.message);
  }

  // Strategi 2: cari array JSON atau parse setiap blok object {...} secara terpisah
  try {
    const arrayMatch = rawText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        const jobs = Array.isArray(parsed) ? parsed : [parsed];
        const validJobs = jobs.map(sanitizeParsedJob).filter(Boolean);
        if (validJobs.length) {
          console.log(`✅ Parsing berhasil (strategi 2: array regex): ${validJobs.length} lowongan`);
          return validJobs;
        }
      } catch { /* jika array terpotong, lanjut ke ekstraksi objek individual */ }
    }

    // Ekstrak semua objek {...} yang ada di dalam teks
    const objectRegex = /\{[^{}]*"company"[^{}]*\}/g;
    const objectMatches = rawText.match(objectRegex);
    if (objectMatches && objectMatches.length) {
      const extractedList = [];
      for (const str of objectMatches) {
        try {
          const parsedObj = JSON.parse(str);
          const clean = sanitizeParsedJob(parsedObj);
          if (clean) extractedList.push(clean);
        } catch { /* skip object cacat */ }
      }
      if (extractedList.length) {
        console.log(`✅ Parsing berhasil (strategi 2b: objek individual): ${extractedList.length} lowongan`);
        return extractedList;
      }
    }
  } catch (e) {
    console.log('⚠️ Strategi 2 gagal:', e.message);
  }

  // Strategi 3: Parse langsung dari format daftar/checklist baris per baris
  // Contoh: "- [ ] **Posisi - PT Perusahaan**" atau "1. Posisi - PT Perusahaan"
  try {
    const lines = rawText.split('\n');
    const checklistJobs = [];
    const today = new Date().toISOString().split('T')[0];

    for (const line of lines) {
      const cleanLine = line.trim()
        .replace(/^[-*•\d.]+\s*/, '')          // hapus bullet / numbering
        .replace(/\[\s*[xX ]?\s*\]\s*/, '')     // hapus [ ] atau [x]
        .replace(/\*\*/g, '')                  // hapus bold markdown
        .trim();

      if (!cleanLine || cleanLine.length < 5) continue;

      // Cari pemisah umum antara Posisi dan Perusahaan: " - ", " di ", " @ ", " | "
      let pos = '';
      let comp = '';
      if (cleanLine.includes(' - ')) {
        const parts = cleanLine.split(' - ');
        pos = parts[0].trim();
        comp = parts.slice(1).join(' - ').trim();
      } else if (cleanLine.includes(' — ')) {
        const parts = cleanLine.split(' — ');
        pos = parts[0].trim();
        comp = parts.slice(1).join(' — ').trim();
      } else if (cleanLine.toLowerCase().includes(' di ')) {
        const parts = cleanLine.split(/\s+di\s+/i);
        pos = parts[0].trim();
        comp = parts.slice(1).join(' di ').trim();
      } else if (cleanLine.includes(' | ')) {
        const parts = cleanLine.split(' | ');
        pos = parts[0].trim();
        comp = parts.slice(1).join(' | ').trim();
      }

      // Jika terbalik (misal: "PT ABC - Frontend Developer"), tukar pos & comp
      if (pos && comp) {
        if (/^(pt|cv|pt\.|cv\.|ud\.|yayasan|kantor)/i.test(pos) && !/^(pt|cv|pt\.|cv\.|ud\.)/i.test(comp)) {
          const temp = pos;
          pos = comp;
          comp = temp;
        }

        const candidateJob = sanitizeParsedJob({
          company: comp,
          position: pos,
          status: 'Applied',
          applyDate: today,
        });

        if (candidateJob) {
          checklistJobs.push(candidateJob);
        }
      }
    }

    if (checklistJobs.length) {
      console.log(`✅ Parsing berhasil (strategi 3: checklist/list lines): ${checklistJobs.length} lowongan`);
      return checklistJobs;
    }
  } catch (e) {
    console.log('⚠️ Strategi 3 gagal:', e.message);
  }

  // Strategi 4: format key-value tunggal (fallback)
  try {
    const lines = rawText.split('\n');
    const extracted = {};
    const fieldMap = {
      'company': 'company', 'perusahaan': 'company', 'nama perusahaan': 'company',
      'position': 'position', 'posisi': 'position', 'jabatan': 'position', 'job title': 'position',
      'location': 'location', 'lokasi': 'location', 'kota': 'location',
      'type': 'type', 'jenis': 'type', 'tipe pekerjaan': 'type', 'job type': 'type',
      'status': 'status', 'status lamaran': 'status',
      'apply_date': 'applyDate', 'applydate': 'applyDate', 'tanggal': 'applyDate', 'tanggal apply': 'applyDate',
      'deadline': 'deadline', 'tenggat': 'deadline', 'tenggat waktu': 'deadline',
      'salary': 'salary', 'gaji': 'salary', 'upah': 'salary', 'kisaran gaji': 'salary',
      'source': 'source', 'url': 'source', 'sumber': 'source', 'job url': 'source',
      'notes': 'notes', 'catatan': 'notes', 'keterangan': 'notes',
      'confidence': 'confidence',
    };

    lines.forEach(line => {
      const sep = line.indexOf(':');
      if (sep === -1) return;
      
      const key = line.slice(0, sep).trim().toLowerCase().replace(/[^a-z_\s]/g, '').trim();
      const val = line.slice(sep + 1).trim().replace(/^["']|["']$/g, '').trim();
      
      const mapped = fieldMap[key];
      if (mapped && val && val !== '""' && val !== "''" && val.toLowerCase() !== 'null') {
        extracted[mapped] = val;
      }
    });

    if (Object.keys(extracted).length > 0 && (extracted.company || extracted.position)) {
      console.log('✅ Parsing berhasil (strategi 4: key-value lines)');
      return [sanitizeParsedJob(extracted)];
    }
  } catch (e) {
    console.log('⚠️ Strategi 4 gagal:', e.message);
  }

  console.error('❌ Semua strategi parsing gagal');
  return [];
}

/**
 * Normalisasi objek yang di-parse dari Gemini
 */
function sanitizeParsedJob(obj) {
  const empty = ['', '""', "''", 'null', 'undefined', '-', '—', 'n/a', 'tidak ada', 'none', 'kosong'];
  const clean = {};
  
  Object.entries(obj).forEach(([k, v]) => {
    if (!k || !v) return;
    const str = String(v ?? '').trim();
    if (!empty.includes(str.toLowerCase())) {
      clean[k] = str;
    }
  });

  // Validasi minimal
  if (!clean.company && !clean.position) {
    console.warn('❌ Minimal validation failed: company dan position kosong');
    return null;
  }

  // Set default jika ada data
  if (!clean.status) clean.status = 'Applied';
  
  // Validasi & set default applyDate
  if (!clean.applyDate || !/^\d{4}-\d{2}-\d{2}$/.test(clean.applyDate)) {
    clean.applyDate = new Date().toISOString().split('T')[0];
  }

  // Validasi format deadline (jika ada)
  if (clean.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(clean.deadline)) {
    console.warn(`⚠️ deadline format invalid: "${clean.deadline}", dihapus`);
    delete clean.deadline;
  }

  return clean;
}

/* ─── Render hasil ekstraksi ─────────────────────────────────────────────── */

function renderAiResult(data) {
  const grid = document.getElementById('ai-result-grid');
  grid.innerHTML = '';

  const fields = [
    { key: 'company',   label: 'Perusahaan',      required: true },
    { key: 'position',  label: 'Posisi',           required: true },
    { key: 'location',  label: 'Lokasi' },
    { key: 'type',      label: 'Jenis Pekerjaan' },
    { key: 'deadline',  label: 'Tenggat Waktu' },
    { key: 'salary',    label: 'Kisaran Gaji' },
    { key: 'source',    label: 'URL Lowongan' },
    { key: 'notes',     label: 'Catatan',          full: true },
  ];

  fields.forEach(f => {
    const val = data[f.key] || '';
    const item = document.createElement('div');
    item.className = 'ai-result-item' + (f.full ? ' ai-result-item-full' : '');

    const lbl = document.createElement('label');
    lbl.className = 'ai-result-label';
    lbl.textContent = f.label + (f.required ? ' *' : '');

    const isTextarea = f.full;
    const input = document.createElement(isTextarea ? 'textarea' : 'input');
    input.className = 'form-input ai-result-input' + (isTextarea ? ' form-textarea' : '');
    input.dataset.field = f.key;
    if (isTextarea) {
      input.rows = 3;
      input.value = val;
    } else {
      input.type = 'text';
      input.value = val;
    }

    // Indikator field terisi atau kosong
    const indicator = document.createElement('span');
    indicator.className = val ? 'ai-field-filled' : 'ai-field-empty';
    indicator.textContent = val ? '✓ Terdeteksi' : '— Tidak ditemukan';

    item.append(lbl, input, indicator);
    grid.appendChild(item);
  });

  // Confidence indicator
  const conf = data.confidence || 'medium';
  const confEl = document.getElementById('ai-confidence');
  confEl.className = `ai-confidence ai-confidence-${conf}`;
  confEl.innerHTML = '';
  const confLabels = { high: '🟢 Kepercayaan Tinggi', medium: '🟡 Kepercayaan Sedang', low: '🔴 Kepercayaan Rendah' };
  confEl.textContent = confLabels[conf] || confLabels.medium;
  confEl.classList.remove('hidden');
}

/* ─── Terapkan hasil ke form utama ───────────────────────────────────────── */

function applyAiResultToForm() {
  // Baca nilai dari input hasil AI (yang mungkin sudah diedit user)
  const grid = document.getElementById('ai-result-grid');
  const inputs = grid.querySelectorAll('[data-field]');
  const result = { ...aiState.extracted };
  inputs.forEach(inp => {
    result[inp.dataset.field] = inp.value.trim();
  });

  closeAiModal();
  openAddModal();  // buka form tambah, lalu isi

  // Isi form dengan hasil AI
  setTimeout(() => {
    if (result.company)   document.getElementById('form-company').value   = result.company;
    if (result.position)  document.getElementById('form-position').value  = result.position;
    if (result.location)  document.getElementById('form-location').value  = result.location;
    if (result.salary)    document.getElementById('form-salary').value    = result.salary;
    if (result.source)    document.getElementById('form-source').value    = result.source;
    if (result.notes)     document.getElementById('form-notes').value     = result.notes;
    if (result.deadline)  document.getElementById('form-deadline').value  = result.deadline;
    if (result.applyDate) document.getElementById('form-apply-date').value = result.applyDate;

    // Jenis pekerjaan — cocokkan dengan opsi yang tersedia
    const typeMap = {
      'full-time': 'Full-time', 'fulltime': 'Full-time',
      'part-time': 'Part-time', 'parttime': 'Part-time',
      'internship': 'Internship', 'magang': 'Internship',
      'contract': 'Contract', 'kontrak': 'Contract',
      'freelance': 'Freelance',
      'remote': 'Remote',
    };
    const typeNorm = (result.type || '').toLowerCase().replace(/\s+/g, '');
    const mappedType = typeMap[typeNorm] || result.type || '';
    if (mappedType) document.getElementById('form-type').value = mappedType;

    updateNotesCount();
    showToast('✨ Formulir berhasil diisi oleh AI!', 'success');
  }, 80);
}

/* ─── Helper UI AI ───────────────────────────────────────────────────────── */

function showAiStep(step) {
  document.getElementById('ai-step-input').classList.toggle('hidden', step !== 'input');
  document.getElementById('ai-step-result').classList.toggle('hidden', step !== 'result');
}

function setAiAnalyzeLoading(loading) {
  const btn     = document.getElementById('btn-ai-analyze');
  const text    = document.getElementById('btn-ai-analyze-text');
  const spinner = document.getElementById('btn-ai-analyze-spinner');
  btn.disabled  = loading;
  text.textContent = loading ? 'Menganalisis…' : 'Analisis dengan AI';
  spinner.classList.toggle('hidden', !loading);
}

/* =========================================================================
   RESULTS COUNT ELEMENT
   ========================================================================= */

function injectResultsCount() {
  const toolbar = document.querySelector('.toolbar');
  if (!toolbar || document.getElementById('results-count')) return;
  const el = document.createElement('div');
  el.id = 'results-count';
  el.className = 'results-count';
  toolbar.after(el);
}

/* =========================================================================
   EVENT LISTENERS
   ========================================================================= */

function registerEventListeners() {
  // ── Auth tabs ──────────────────────────────────────────────────────────
  document.getElementById('tab-login').addEventListener('click', () => {
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-login').setAttribute('aria-selected', 'true');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('tab-register').setAttribute('aria-selected', 'false');
    document.getElementById('panel-login').classList.remove('hidden');
    document.getElementById('panel-register').classList.add('hidden');
    clearAuthErrors();
  });

  document.getElementById('tab-register').addEventListener('click', () => {
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('tab-register').setAttribute('aria-selected', 'true');
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-login').setAttribute('aria-selected', 'false');
    document.getElementById('panel-register').classList.remove('hidden');
    document.getElementById('panel-login').classList.add('hidden');
    clearAuthErrors();
  });

  // ── Auth forms ─────────────────────────────────────────────────────────
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);

  // ── Password toggle visibility ─────────────────────────────────────────
  document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.setAttribute('aria-label',
        input.type === 'password' ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'
      );
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────
  document.getElementById('btn-logout').addEventListener('click', signOut);

  // ── Sidebar & navigation ───────────────────────────────────────────────
  document.getElementById('menu-toggle').addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeMobileSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.querySelectorAll('[data-view]').forEach(btn => {
    if (!btn.classList.contains('nav-item')) {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    }
  });

  // ── AI Agent buttons ────────────────────────────────────────────────────
  document.getElementById('btn-ai-scan').addEventListener('click', openAiModal);
  document.getElementById('ai-modal-close').addEventListener('click', closeAiModal);
  document.getElementById('ai-modal-cancel').addEventListener('click', closeAiModal);
  document.getElementById('ai-modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeAiModal(); });

  // Tab gambar / teks
  document.getElementById('ai-tab-image').addEventListener('click', () => switchAiTab('image'));
  document.getElementById('ai-tab-text').addEventListener('click', () => switchAiTab('text'));

  // Dropzone — klik
  document.getElementById('ai-dropzone').addEventListener('click', (e) => {
    if (!e.target.closest('#ai-remove-image')) {
      document.getElementById('ai-file-input').click();
    }
  });
  document.getElementById('ai-dropzone').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('ai-file-input').click();
    }
  });

  // File input change
  document.getElementById('ai-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file);
  });

  // Hapus gambar
  document.getElementById('ai-remove-image').addEventListener('click', (e) => {
    e.stopPropagation();
    resetAiDropzone();
  });

  // Drag & drop
  const dropzone = document.getElementById('ai-dropzone');
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });

  // Tombol analisis
  document.getElementById('btn-ai-analyze').addEventListener('click', analyzeWithGemini);

  // Tombol kembali dari hasil
  document.getElementById('ai-result-back').addEventListener('click', () => showAiStep('input'));

  // Tombol terapkan hasil ke form
  document.getElementById('btn-ai-apply').addEventListener('click', applyAiResultToForm);

  // ── Add / Edit buttons ──────────────────────────────────────────────────
  document.getElementById('btn-add-top').addEventListener('click', openAddModal);
  document.getElementById('btn-add-dashboard').addEventListener('click', openAddModal);

  // ── Job form ────────────────────────────────────────────────────────────
  document.getElementById('job-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);

  // ── Escape key ─────────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('job-modal').classList.contains('hidden'))     closeModal();
      if (!document.getElementById('detail-modal').classList.contains('hidden'))  closeDetailModal();
      if (!document.getElementById('confirm-modal').classList.contains('hidden')) cancelDelete();
      if (!document.getElementById('ai-modal').classList.contains('hidden'))      closeAiModal();
      if (document.getElementById('sidebar').classList.contains('open'))          closeMobileSidebar();
    }
  });

  // ── Klik di luar modal-box ─────────────────────────────────────────────
  document.getElementById('job-modal').addEventListener('click',     (e) => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('detail-modal').addEventListener('click',  (e) => { if (e.target === e.currentTarget) closeDetailModal(); });
  document.getElementById('confirm-modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) cancelDelete(); });

  // ── Detail modal ────────────────────────────────────────────────────────
  document.getElementById('detail-modal-close').addEventListener('click', closeDetailModal);

  // ── Confirm delete ──────────────────────────────────────────────────────
  document.getElementById('confirm-ok').addEventListener('click', executeDelete);
  document.getElementById('confirm-cancel').addEventListener('click', cancelDelete);

  // ── Search & filters ────────────────────────────────────────────────────
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderApplications();
  });
  document.getElementById('filter-status').addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    renderApplications();
  });
  document.getElementById('filter-type').addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    renderApplications();
  });
  document.getElementById('sort-by').addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    renderApplications();
  });

  // ── Notes character counter ──────────────────────────────────────────────
  document.getElementById('form-notes').addEventListener('input', updateNotesCount);
}

/** Perbarui hitungan karakter textarea catatan */
function updateNotesCount() {
  const ta    = document.getElementById('form-notes');
  const count = document.getElementById('notes-count');
  if (!ta || !count) return;
  const len = ta.value.length;
  count.textContent = `${len} / 500`;
  count.classList.toggle('char-count-warn', len >= 400);
  count.classList.toggle('char-count-limit', len >= 490);
}

/* =========================================================================
   INIT
   ========================================================================= */

async function init() {
  // Daftarkan event listener dan results count terlebih dahulu
  // agar UI bisa berinteraksi meski Supabase belum siap
  registerEventListeners();
  injectResultsCount();

  // Tampilkan loading hanya setelah DOM pasti siap
  showLoadingScreen();

  // Pastikan Supabase SDK sudah termuat dari CDN
  if (typeof supabase === 'undefined') {
    console.error('Supabase SDK belum termuat. Periksa koneksi internet.');
    showAuthPage();
    return;
  }

  // Cek apakah kredensial sudah dikonfigurasi
  const configured = initSupabase();
  if (!configured) {
    document.getElementById('supabase-warning').classList.remove('hidden');
    showAuthPage();
    return;
  }

  // Pantau perubahan sesi autentikasi
  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      state.currentUser = session.user;
      renderUserInfo(session.user);
      showLoadingScreen();
      state.jobs = await fetchJobs();
      showAppPage();
      renderDashboard();
    } else if (event === 'SIGNED_OUT' || (!session && event === 'INITIAL_SESSION')) {
      showAuthPage();
    }
  });

  // Cek sesi yang sudah ada (user refresh halaman)
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      state.currentUser = session.user;
      renderUserInfo(session.user);
      state.jobs = await fetchJobs();
      showAppPage();
      renderDashboard();
    } else {
      showAuthPage();
    }
  } catch (e) {
    console.error('Gagal menghubungi Supabase:', e);
    showAuthPage();
  }
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', init);

/* =========================================================================
   INSTRUKSI SETUP SUPABASE
   ==========================================================================

   1. Buat akun gratis di https://supabase.com

   2. Buat project baru → pilih region terdekat (mis. Singapore)

   3. Buka SQL Editor di dashboard Supabase, jalankan query berikut:

      -- Buat tabel jobs
      create table jobs (
        id          uuid default gen_random_uuid() primary key,
        user_id     uuid references auth.users not null,
        company     text not null,
        position    text not null,
        location    text,
        type        text,
        status      text default 'Applied',
        apply_date  date,
        deadline    date,
        salary      text,
        source      text,
        notes       text,
        created_at  timestamptz default now()
      );

      -- Aktifkan Row Level Security
      alter table jobs enable row level security;

      -- Policy: setiap user hanya bisa akses data miliknya sendiri
      create policy "Users manage own jobs" on jobs
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);

   4. Buka Project Settings → API:
      - Salin "Project URL"   → tempel ke SUPABASE_URL di atas
      - Salin "anon public"   → tempel ke SUPABASE_ANON_KEY di atas

   5. (Opsional) Di Authentication → Settings:
      - Matikan "Email Confirmations" jika ingin login langsung tanpa konfirmasi email

   6. Simpan file dan buka index.html di browser — selesai!

   ========================================================================= */
