/**
 * Track Jobs — Main Application Script
 * ======================================
 * Vanilla JavaScript — tanpa framework atau pustaka eksternal.
 * Data disimpan menggunakan localStorage di browser lokal pengguna.
 *
 * Catatan: localStorage hanya tersedia di browser yang sama pada perangkat
 * yang sama dan TIDAK menyinkronkan data antar perangkat.
 */

'use strict';

/* =========================================================================
   CONSTANTS & CONFIGURATION
   ========================================================================= */

const STORAGE_KEY = 'trackjobs_data';
const RECENT_LIMIT = 5;

/** Status label dan kelas badge */
const STATUS_CONFIG = {
  Saved:     { label: 'Disimpan',       badge: 'badge-saved' },
  Applied:   { label: 'Dilamar',        badge: 'badge-applied' },
  Assessment:{ label: 'Penilaian',      badge: 'badge-assessment' },
  Interview: { label: 'Wawancara',      badge: 'badge-interview' },
  Offered:   { label: 'Ditawari',       badge: 'badge-offered' },
  Rejected:  { label: 'Ditolak',        badge: 'badge-rejected' },
  Withdrawn: { label: 'Ditarik Kembali',badge: 'badge-withdrawn' },
};

/* =========================================================================
   APPLICATION STATE
   ========================================================================= */

let state = {
  jobs: [],          // semua data lamaran
  currentView: 'dashboard',
  editingId: null,   // ID job yang sedang diedit
  deletingId: null,  // ID job yang akan dihapus
  detailId: null,    // ID job yang sedang dilihat detail-nya
  filters: {
    search: '',
    status: '',
    type: '',
    sort: 'newest',
  },
};

/* =========================================================================
   LOCAL STORAGE
   ========================================================================= */

/** Menyimpan data ke localStorage */
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.jobs));
  } catch (e) {
    showToast('Gagal menyimpan data ke penyimpanan lokal.', 'error');
  }
}

/** Memuat data dari localStorage */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Validasi: harus berupa array
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    // Data rusak — abaikan dan mulai kosong
    return [];
  }
}

/* =========================================================================
   DATA HELPERS
   ========================================================================= */

/** Membuat ID unik sederhana */
function generateId() {
  return 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/** Sanitasi teks pengguna untuk textContent (aman dari XSS) */
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
  if (days < 0)  return { text: `Lewat ${Math.abs(days)} hari`, cls: 'deadline-passed' };
  if (days === 0) return { text: 'Hari ini!', cls: 'deadline-near' };
  if (days <= 7)  return { text: `${days} hari lagi`, cls: 'deadline-near' };
  return { text: formatDate(dateStr), cls: 'deadline-ok' };
}

/** Mengambil 1–2 huruf inisial perusahaan untuk logo */
function getInitials(name) {
  const words = sanitize(name).split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Mendapatkan badge HTML untuk status */
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
  const jobs = state.jobs;
  return {
    total:     jobs.length,
    applied:   jobs.filter(j => j.status === 'Applied').length,
    interview: jobs.filter(j => j.status === 'Interview').length,
    offered:   jobs.filter(j => j.status === 'Offered').length,
    rejected:  jobs.filter(j => j.status === 'Rejected').length,
  };
}

function renderStats() {
  const s = computeStats();
  document.getElementById('stat-total').textContent    = s.total;
  document.getElementById('stat-applied').textContent  = s.applied;
  document.getElementById('stat-interview').textContent = s.interview;
  document.getElementById('stat-offered').textContent  = s.offered;
  document.getElementById('stat-rejected').textContent = s.rejected;
}

/* =========================================================================
   FILTERING & SORTING
   ========================================================================= */

function getFilteredJobs() {
  const { search, status, type, sort } = state.filters;
  const q = search.toLowerCase().trim();

  let jobs = state.jobs.filter(job => {
    // Pencarian teks (nama perusahaan atau posisi)
    if (q) {
      const inCompany  = job.company.toLowerCase().includes(q);
      const inPosition = job.position.toLowerCase().includes(q);
      if (!inCompany && !inPosition) return false;
    }
    // Filter status
    if (status && job.status !== status) return false;
    // Filter jenis pekerjaan
    if (type && job.type !== type) return false;
    return true;
  });

  // Pengurutan
  jobs = [...jobs].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return (b.createdAt || 0) - (a.createdAt || 0);
      case 'oldest':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'deadline': {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      case 'company':
        return a.company.localeCompare(b.company, 'id');
      default:
        return 0;
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

  // Hitung hasil
  const countEl = document.getElementById('results-count');
  if (countEl) {
    countEl.textContent = `${jobs.length} lamaran ditemukan`;
  }

  if (jobs.length === 0) {
    const hasFilters = state.filters.search || state.filters.status || state.filters.type;
    container.appendChild(buildEmptyState(hasFilters ? 'Tidak ada hasil' : ''));
    return;
  }

  jobs.forEach(job => {
    container.appendChild(buildJobCard(job));
  });
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
    const locText = document.createTextNode(sanitize(job.location));
    loc.appendChild(locText);
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
    const dateText = document.createTextNode(formatDate(job.applyDate));
    date.appendChild(dateText);
    meta.appendChild(date);
  }

  // Footer
  const footer = document.createElement('div');
  footer.className = 'job-card-footer';

  const dl = deadlineInfo(job.deadline);
  const deadlineEl = document.createElement('span');
  deadlineEl.className = `text-muted deadline-text ${dl.cls}`;
  deadlineEl.style.fontSize = '0.78rem';

  const dlIcon = document.createElement('span');
  dlIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  deadlineEl.append(dlIcon);
  const dlText = document.createTextNode(dl.text);
  deadlineEl.appendChild(dlText);

  // Action buttons
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

  // Klik kartu untuk detail
  card.addEventListener('click', () => openDetailModal(job.id));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetailModal(job.id);
    }
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
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
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
   RENDER: DASHBOARD (RECENT)
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
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Belum ada lamaran</h3>
      <p>Tambahkan lamaran pertama Anda untuk mulai melacak progres.</p>
    `;
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

  // Header
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

  // Grid fields
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
  const deadlineText = job.deadline ? `${formatDate(job.deadline)} (${dl.text})` : '—';

  addField('Lokasi',          job.location);
  addField('Jenis Pekerjaan', job.type);
  addField('Tanggal Lamaran', formatDate(job.applyDate));
  addField('Tenggat Waktu',   deadlineText);
  addField('Kisaran Gaji',    job.salary);
  addField('Sumber / URL',    job.source, false, true);
  if (job.notes) addField('Catatan', job.notes, true);

  content.appendChild(grid);

  // Footer meta
  const createdEl = document.createElement('p');
  createdEl.className = 'text-muted';
  createdEl.style.marginTop = '16px';
  createdEl.style.fontSize = '0.75rem';
  const createdDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  createdEl.textContent = `Ditambahkan: ${createdDate}`;
  content.appendChild(createdEl);

  // Wire detail modal buttons
  document.getElementById('detail-edit-btn').onclick = () => {
    closeDetailModal();
    openEditModal(jobId);
  };
  document.getElementById('detail-delete-btn').onclick = () => {
    closeDetailModal();
    confirmDelete(jobId);
  };

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
  document.getElementById('modal-title').textContent = 'Tambah Pekerjaan';
  document.getElementById('btn-submit').textContent = 'Simpan';
  resetForm();
  // Isi tanggal hari ini sebagai default
  document.getElementById('form-apply-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('form-status').value = 'Applied';
  openModal();
}

function openEditModal(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;
  state.editingId = jobId;

  document.getElementById('modal-title').textContent = 'Edit Lamaran';
  document.getElementById('btn-submit').textContent = 'Perbarui';
  resetForm();

  // Isi form dengan data yang ada
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

  openModal();
}

function openModal() {
  document.getElementById('job-modal').classList.remove('hidden');
  trapFocus(document.getElementById('job-modal'));
  // Fokus ke input pertama
  setTimeout(() => document.getElementById('form-company').focus(), 50);
}

function closeModal() {
  document.getElementById('job-modal').classList.add('hidden');
  state.editingId = null;
  resetForm();
}

function resetForm() {
  const form = document.getElementById('job-form');
  form.reset();
  document.getElementById('form-id').value = '';
  clearFormErrors();
}

function clearFormErrors() {
  ['form-company', 'form-position', 'form-source'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.classList.remove('input-error');
  });
  ['err-company', 'err-position', 'err-source'].forEach(id => {
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

function handleFormSubmit(e) {
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

  if (state.editingId) {
    // UPDATE
    const idx = state.jobs.findIndex(j => j.id === state.editingId);
    if (idx !== -1) {
      state.jobs[idx] = { ...state.jobs[idx], ...jobData };
    }
    showToast('Lamaran berhasil diperbarui!', 'success');
  } else {
    // CREATE
    const newJob = {
      id: generateId(),
      createdAt: Date.now(),
      isSample: false,
      ...jobData,
    };
    state.jobs.unshift(newJob);
    showToast('Lamaran berhasil ditambahkan!', 'success');
  }

  saveToStorage();
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

function executeDelete() {
  if (!state.deletingId) return;
  const job = state.jobs.find(j => j.id === state.deletingId);
  state.jobs = state.jobs.filter(j => j.id !== state.deletingId);
  state.deletingId = null;
  document.getElementById('confirm-modal').classList.add('hidden');
  saveToStorage();
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

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    const active = btn.dataset.view === view;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });

  // Show/hide views
  document.getElementById('view-dashboard').classList.toggle('hidden', view !== 'dashboard');
  document.getElementById('view-applications').classList.toggle('hidden', view !== 'applications');

  // Update topbar title
  const titles = { dashboard: 'Dasbor', applications: 'Lamaran Saya' };
  document.getElementById('topbar-title').textContent = titles[view] || 'Track Jobs';

  // Close mobile sidebar
  closeMobileSidebar();

  if (view === 'dashboard') renderDashboard();
  if (view === 'applications') renderApplications();
}

/* =========================================================================
   SIDEBAR (MOBILE)
   ========================================================================= */

function openMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const toggle   = document.getElementById('menu-toggle');
  sidebar.classList.add('open');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  toggle.setAttribute('aria-expanded', 'true');
  // Fokus ke tombol tutup
  setTimeout(() => document.getElementById('sidebar-close').focus(), 50);
}

function closeMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const toggle   = document.getElementById('menu-toggle');
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  toggle.setAttribute('aria-expanded', 'false');
}

/* =========================================================================
   TOAST NOTIFICATIONS
   ========================================================================= */

/**
 * Menampilkan notifikasi toast
 * @param {string} message - Pesan yang ditampilkan
 * @param {'success'|'error'|'info'} type - Tipe notifikasi
 */
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

  // Auto-dismiss setelah 3.5 detik
  const timer = setTimeout(() => dismissToast(toast), 3500);

  // Klik untuk menutup lebih awal
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    dismissToast(toast);
  });
}

function dismissToast(toast) {
  toast.classList.add('hiding');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/* =========================================================================
   ACCESSIBILITY: FOCUS TRAP
   ========================================================================= */

/**
 * Menjebak fokus keyboard di dalam elemen dialog
 * @param {HTMLElement} element
 */
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
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Hapus listener lama jika ada
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
  // Selalu perbarui statistik
  renderStats();
}

/* =========================================================================
   EVENT LISTENERS
   ========================================================================= */

function registerEventListeners() {
  // ── Sidebar & navigation ───────────────────────────────────────────────
  document.getElementById('menu-toggle').addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeMobileSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  // Nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // "Lihat Semua" link di dashboard
  document.querySelectorAll('[data-view]').forEach(btn => {
    if (!btn.classList.contains('nav-item')) {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    }
  });

  // ── Add / Edit buttons ──────────────────────────────────────────────────
  document.getElementById('btn-add-top').addEventListener('click', openAddModal);
  document.getElementById('btn-add-dashboard').addEventListener('click', openAddModal);

  // ── Job form ────────────────────────────────────────────────────────────
  document.getElementById('job-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);

  // Tutup modal dengan Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('job-modal').classList.contains('hidden'))     closeModal();
      if (!document.getElementById('detail-modal').classList.contains('hidden'))  closeDetailModal();
      if (!document.getElementById('confirm-modal').classList.contains('hidden')) cancelDelete();
      if (document.getElementById('sidebar').classList.contains('open')) closeMobileSidebar();
    }
  });

  // Klik di luar modal-box untuk menutup (overlay)
  document.getElementById('job-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
  });
  document.getElementById('confirm-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cancelDelete();
  });

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
}

/* =========================================================================
   RESULTS COUNT ELEMENT (injected dynamically)
   ========================================================================= */

function injectResultsCount() {
  const toolbar = document.querySelector('.toolbar');
  if (!toolbar) return;
  if (!document.getElementById('results-count')) {
    const el = document.createElement('div');
    el.id = 'results-count';
    el.className = 'results-count';
    toolbar.after(el);
  }
}

/* =========================================================================
   INIT
   ========================================================================= */

function init() {
  // Muat data dari localStorage
  state.jobs = loadFromStorage();

  // Inject results count
  injectResultsCount();

  // Daftarkan semua event listener
  registerEventListeners();

  // Render tampilan awal
  renderDashboard();
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', init);
