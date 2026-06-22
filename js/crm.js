'use strict';

/* =========================================================
   CRM — Fine Design Studio
   Storage: Supabase (tables: leads, invoices)
   Auth: reuses the admin panel's password gate (admin.js)
   ========================================================= */

const SUPABASE_URL = 'https://wnuwujogewzyrjfpzrvq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0Gef7DeLpbVIBWLYhThTiw_7tozXjyw';

const sb = (SUPABASE_URL.startsWith('http'))
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const STATUSES = {
  'new':         { label: 'ליד חדש - צריך להתקשר', color: '#c0392b', bg: '#fde8e8' },
  'in-progress': { label: 'בטיפול - שיחה התקיימה',  color: '#e67e22', bg: '#fef0e0' },
  'working':     { label: 'הזמנה בביצוע',           color: '#2980b9', bg: '#e0eefc' },
  'sent':        { label: 'הזמנה נשלחה ללקוח',       color: '#27ae60', bg: '#e0f7eb' },
};

const STATUS_CYCLE = ['new', 'in-progress', 'working', 'sent'];

/* =========================================================
   STORAGE — Supabase
   ========================================================= */
function crmReady() {
  if (sb) return true;
  showToast('CRM לא מחובר ל-Supabase עדיין');
  return false;
}

async function loadLeads() {
  if (!crmReady()) return [];
  const { data, error } = await sb.from('leads').select('*').order('added_date', { ascending: false });
  if (error) { console.error(error); showToast('שגיאה בטעינת לידים'); return []; }
  return data.map(rowToLead);
}
function rowToLead(r) {
  return { id: r.id, name: r.name, phone: r.phone, email: r.email, eventType: r.event_type, status: r.status, notes: r.notes, addedDate: r.added_date, updatedAt: r.updated_at };
}
async function addLead(data) {
  if (!crmReady()) return;
  const today_ = today();
  const { error } = await sb.from('leads').insert({
    name: data.name, phone: data.phone, email: data.email, event_type: data.eventType,
    status: data.status, notes: data.notes, added_date: today_, updated_at: today_,
  });
  if (error) { console.error(error); showToast('שגיאה בשמירת ליד'); }
}
async function updateLead(id, data) {
  if (!crmReady()) return;
  const { error } = await sb.from('leads').update({
    name: data.name, phone: data.phone, email: data.email, event_type: data.eventType,
    status: data.status, notes: data.notes, updated_at: today(),
  }).eq('id', id);
  if (error) { console.error(error); showToast('שגיאה בעדכון ליד'); }
}
async function deleteLead(id) {
  if (!crmReady()) return;
  const { error } = await sb.from('leads').delete().eq('id', id);
  if (error) { console.error(error); showToast('שגיאה במחיקת ליד'); }
}
async function cycleLeadStatus(id, leads) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(lead.status) + 1) % STATUS_CYCLE.length];
  await updateLead(id, { ...lead, status: next });
}

async function loadInvoices() {
  if (!crmReady()) return [];
  const { data, error } = await sb.from('invoices').select('*').order('date', { ascending: false });
  if (error) { console.error(error); showToast('שגיאה בטעינת חשבוניות'); return []; }
  return data.map(rowToInvoice);
}
function rowToInvoice(r) {
  return { id: r.id, number: r.number, clientName: r.client_name, eventType: r.event_type, amount: r.amount, date: r.date, paid: r.paid, notes: r.notes };
}
async function nextInvoiceNumber() {
  const { count, error } = await sb.from('invoices').select('*', { count: 'exact', head: true });
  if (error) { console.error(error); return '001'; }
  return String((count || 0) + 1).padStart(3, '0');
}
async function addInvoice(data) {
  if (!crmReady()) return;
  const number = await nextInvoiceNumber();
  const { error } = await sb.from('invoices').insert({
    number, client_name: data.clientName, event_type: data.eventType,
    amount: data.amount, date: data.date, paid: data.paid, notes: data.notes,
  });
  if (error) { console.error(error); showToast('שגיאה בשמירת חשבונית'); }
}
async function updateInvoice(id, data) {
  if (!crmReady()) return;
  const { error } = await sb.from('invoices').update({
    client_name: data.clientName, event_type: data.eventType,
    amount: data.amount, date: data.date, paid: data.paid, notes: data.notes,
  }).eq('id', id);
  if (error) { console.error(error); showToast('שגיאה בעדכון חשבונית'); }
}
async function deleteInvoice(id) {
  if (!crmReady()) return;
  const { error } = await sb.from('invoices').delete().eq('id', id);
  if (error) { console.error(error); showToast('שגיאה במחיקת חשבונית'); }
}

async function loadReviews() {
  if (!crmReady()) return [];
  const { data, error } = await sb.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); showToast('שגיאה בטעינת ביקורות'); return []; }
  return data.map(rowToReview);
}
function rowToReview(r) {
  return { id: r.id, name: r.name, email: r.email, eventType: r.event_type, rating: r.rating, reviewText: r.review_text, createdAt: r.created_at };
}
async function deleteReview(id) {
  if (!crmReady()) return;
  const { error } = await sb.from('reviews').delete().eq('id', id);
  if (error) { console.error(error); showToast('שגיאה במחיקת ביקורת'); }
}

/* =========================================================
   UTILITIES
   ========================================================= */
function today() { return new Date().toISOString().slice(0, 10); }
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
function statusBadge(status) {
  const s = STATUSES[status] || STATUSES['new'];
  return `<span class="status-badge" style="color:${s.color};background:${s.bg};">${escHtml(s.label)}</span>`;
}

/* =========================================================
   RENDER — DASHBOARD STATS (shown above the leads table)
   ========================================================= */
async function renderDashboardStats() {
  const leads = await loadLeads();

  const stats = [
    { label: 'סה"כ לידים',       value: leads.length,                                     color: 'var(--clay)', bg: 'var(--blush)' },
    { label: 'ממתינים להתקשרות', value: leads.filter(l => l.status === 'new').length,         color: '#c0392b',     bg: '#fde8e8' },
    { label: 'הזמנות בביצוע',     value: leads.filter(l => l.status === 'working').length,     color: '#2980b9',     bg: '#e0eefc' },
    { label: 'הזמנות שנשלחו',     value: leads.filter(l => l.status === 'sent').length,        color: '#27ae60',     bg: '#e0f7eb' },
  ];

  document.getElementById('stat-cards').innerHTML = stats.map(s => `
    <div class="stat-card" style="--sc:${s.color}; --sb:${s.bg};">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');
}

/* =========================================================
   RENDER — LEADS
   ========================================================= */
let currentLeadFilter = 'all';
let leadsCache = [];

async function renderLeads(filter) {
  if (filter !== undefined) currentLeadFilter = filter;
  leadsCache = await loadLeads();
  const leads = currentLeadFilter === 'all' ? leadsCache : leadsCache.filter(l => l.status === currentLeadFilter);

  document.getElementById('leads-count').textContent = `(${leadsCache.length})`;

  const tbody = document.getElementById('leads-tbody');
  const empty = document.getElementById('leads-empty');

  if (leads.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  tbody.innerHTML = leads.map(l => {
    const s = STATUSES[l.status] || STATUSES['new'];
    return `
      <tr>
        <td>
          <strong>${escHtml(l.name)}</strong>
          ${l.notes ? `<div class="lead-notes">${escHtml(l.notes)}</div>` : ''}
        </td>
        <td dir="ltr"><a href="tel:${escHtml(l.phone)}" class="phone-link">${escHtml(l.phone)}</a></td>
        <td>${escHtml(l.eventType || '—')}</td>
        <td style="white-space:nowrap;">${formatDate(l.addedDate)}</td>
        <td>
          <button class="status-badge status-btn"
                  data-lead-id="${l.id}"
                  style="color:${s.color};background:${s.bg};"
                  title="לחצי להחלפת סטטוס">
            ${escHtml(s.label)}
          </button>
        </td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit-lead-btn" data-lead-id="${l.id}">עריכה</button>
            <button class="action-btn del-btn" data-del-lead="${l.id}">מחיקה</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* =========================================================
   RENDER — INVOICES
   ========================================================= */
let invoicesCache = [];

async function renderInvoices() {
  invoicesCache = await loadInvoices();
  const invoices = invoicesCache;
  document.getElementById('invoices-count').textContent = `(${invoices.length})`;

  const tbody = document.getElementById('invoices-tbody');
  const empty = document.getElementById('invoices-empty');

  if (invoices.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
  } else {
    empty.hidden = true;
    tbody.innerHTML = invoices.map(inv => `
      <tr>
        <td><strong style="color:var(--ink);">#${escHtml(inv.number)}</strong></td>
        <td>${escHtml(inv.clientName)}</td>
        <td>${escHtml(inv.eventType || '—')}</td>
        <td dir="ltr" style="font-weight:600; color:var(--ink);">&#8362;${Number(inv.amount || 0).toLocaleString('he-IL')}</td>
        <td style="white-space:nowrap;">${formatDate(inv.date)}</td>
        <td><span class="paid-badge ${inv.paid ? 'paid-yes' : 'paid-no'}">${inv.paid ? 'שולם' : 'לא שולם'}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit-inv-btn" data-inv-id="${inv.id}">עריכה</button>
            <button class="action-btn del-btn" data-del-inv="${inv.id}">מחיקה</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  const total  = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const paid   = invoices.filter(i => i.paid).reduce((s, i) => s + Number(i.amount || 0), 0);
  const unpaid = total - paid;
  const fmt    = n => `&#8362;${n.toLocaleString('he-IL')}`;

  document.getElementById('invoice-summary').innerHTML = invoices.length ? `
    <div class="summary-row">
      <span>סה"כ:</span><strong>${fmt(total)}</strong>
      <span class="sep">|</span>
      <span>שולם:</span><strong class="paid-yes-text">${fmt(paid)}</strong>
      <span class="sep">|</span>
      <span>חוב פתוח:</span><strong class="paid-no-text">${fmt(unpaid)}</strong>
    </div>
  ` : '';
}

/* =========================================================
   RENDER — REVIEWS
   ========================================================= */
let reviewsCache = [];

async function renderReviews() {
  reviewsCache = await loadReviews();
  const reviews = reviewsCache;
  document.getElementById('reviews-count').textContent = `(${reviews.length})`;

  const tbody = document.getElementById('reviews-tbody');
  const empty = document.getElementById('reviews-empty');

  if (reviews.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  tbody.innerHTML = reviews.map(r => `
    <tr>
      <td style="white-space:nowrap;">${formatDate((r.createdAt || '').slice(0, 10))}</td>
      <td>${escHtml(r.name)}</td>
      <td>${escHtml(r.email || '—')}</td>
      <td>${escHtml(r.eventType || '—')}</td>
      <td dir="ltr" style="color:#f5a623;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
      <td style="max-width:280px;">${escHtml(r.reviewText)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn del-btn" data-del-review="${r.id}">מחיקה</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* =========================================================
   MODALS — LEAD
   ========================================================= */
function openLeadModal(lead) {
  document.getElementById('lead-modal-title').textContent = lead ? 'עריכת ליד' : 'הוספת ליד חדש';
  document.getElementById('lead-id').value          = lead ? lead.id          : '';
  document.getElementById('lead-name').value        = lead ? lead.name        : '';
  document.getElementById('lead-phone').value       = lead ? lead.phone       : '';
  document.getElementById('lead-email').value       = lead ? (lead.email  || '') : '';
  document.getElementById('lead-event-type').value  = lead ? (lead.eventType || '') : '';
  document.getElementById('lead-status').value      = lead ? lead.status      : 'new';
  document.getElementById('lead-notes').value       = lead ? (lead.notes  || '') : '';
  document.getElementById('lead-modal').hidden = false;
  document.getElementById('lead-name').focus();
}
function closeLeadModal() {
  document.getElementById('lead-modal').hidden = true;
}

/* =========================================================
   MODALS — INVOICE
   ========================================================= */
function openInvoiceModal(inv) {
  document.getElementById('invoice-modal-title').textContent = inv ? 'עריכת חשבונית' : 'הוספת חשבונית';
  document.getElementById('invoice-id').value          = inv ? inv.id         : '';
  document.getElementById('invoice-client').value      = inv ? inv.clientName : '';
  document.getElementById('invoice-event-type').value  = inv ? (inv.eventType || '') : '';
  document.getElementById('invoice-amount').value      = inv ? inv.amount     : '';
  document.getElementById('invoice-date').value        = inv ? (inv.date      || today()) : today();
  document.getElementById('invoice-paid').value        = inv ? String(inv.paid) : 'false';
  document.getElementById('invoice-notes').value       = inv ? (inv.notes || '') : '';
  document.getElementById('invoice-modal').hidden = false;
  document.getElementById('invoice-client').focus();
}
function closeInvoiceModal() {
  document.getElementById('invoice-modal').hidden = true;
}

/* =========================================================
   FORM SUBMISSIONS
   ========================================================= */
document.getElementById('lead-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('lead-id').value;
  const data = {
    name:      document.getElementById('lead-name').value.trim(),
    phone:     document.getElementById('lead-phone').value.trim(),
    email:     document.getElementById('lead-email').value.trim(),
    eventType: document.getElementById('lead-event-type').value,
    status:    document.getElementById('lead-status').value,
    notes:     document.getElementById('lead-notes').value.trim(),
  };
  if (!data.name || !data.phone) { showToast('יש למלא שם וטלפון'); return; }

  if (id) { await updateLead(id, data); showToast('הליד עודכן'); }
  else     { await addLead(data);        showToast('הליד נוסף בהצלחה!'); }

  closeLeadModal();
  await renderLeads();
  await renderDashboardStats();
});

document.getElementById('invoice-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('invoice-id').value;
  const data = {
    clientName: document.getElementById('invoice-client').value.trim(),
    eventType:  document.getElementById('invoice-event-type').value,
    amount:     parseFloat(document.getElementById('invoice-amount').value) || 0,
    date:       document.getElementById('invoice-date').value,
    paid:       document.getElementById('invoice-paid').value === 'true',
    notes:      document.getElementById('invoice-notes').value.trim(),
  };
  if (!data.clientName) { showToast('יש למלא שם לקוח'); return; }

  if (id) { await updateInvoice(id, data); showToast('החשבונית עודכנה'); }
  else     { await addInvoice(data);        showToast('החשבונית נוספה!'); }

  closeInvoiceModal();
  await renderInvoices();
});

/* =========================================================
   EVENT DELEGATION — LEADS TABLE
   ========================================================= */
document.getElementById('leads-tbody').addEventListener('click', async e => {
  const statusBtn = e.target.closest('.status-btn');
  if (statusBtn) {
    await cycleLeadStatus(statusBtn.dataset.leadId, leadsCache);
    await renderLeads();
    await renderDashboardStats();
    showToast('סטטוס עודכן');
    return;
  }
  const editBtn = e.target.closest('.edit-lead-btn');
  if (editBtn) {
    const lead = leadsCache.find(l => l.id === editBtn.dataset.leadId);
    if (lead) openLeadModal(lead);
    return;
  }
  const delBtn = e.target.closest('[data-del-lead]');
  if (delBtn && confirm('למחוק ליד זה?')) {
    await deleteLead(delBtn.dataset.delLead);
    await renderLeads();
    await renderDashboardStats();
    showToast('הליד נמחק');
  }
});

/* =========================================================
   EVENT DELEGATION — INVOICES TABLE
   ========================================================= */
document.getElementById('invoices-tbody').addEventListener('click', async e => {
  const editBtn = e.target.closest('.edit-inv-btn');
  if (editBtn) {
    const inv = invoicesCache.find(i => i.id === editBtn.dataset.invId);
    if (inv) openInvoiceModal(inv);
    return;
  }
  const delBtn = e.target.closest('[data-del-inv]');
  if (delBtn && confirm('למחוק חשבונית זו?')) {
    await deleteInvoice(delBtn.dataset.delInv);
    await renderInvoices();
    showToast('החשבונית נמחקה');
  }
});

/* =========================================================
   EVENT DELEGATION — REVIEWS TABLE
   ========================================================= */
document.getElementById('reviews-tbody').addEventListener('click', async e => {
  const delBtn = e.target.closest('[data-del-review]');
  if (delBtn && confirm('למחוק ביקורת זו? היא תוסר גם מהאתר.')) {
    await deleteReview(delBtn.dataset.delReview);
    await renderReviews();
    showToast('הביקורת נמחקה');
  }
});

/* =========================================================
   MODAL BUTTONS
   ========================================================= */
document.getElementById('add-lead-btn').addEventListener('click', () => openLeadModal(null));
document.getElementById('add-invoice-btn').addEventListener('click', () => openInvoiceModal(null));
document.getElementById('print-invoices-btn').addEventListener('click', () => window.print());

document.getElementById('lead-modal-close').addEventListener('click', closeLeadModal);
document.getElementById('lead-modal-cancel').addEventListener('click', closeLeadModal);
document.getElementById('invoice-modal-close').addEventListener('click', closeInvoiceModal);
document.getElementById('invoice-modal-cancel').addEventListener('click', closeInvoiceModal);

document.getElementById('lead-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('lead-modal')) closeLeadModal();
});
document.getElementById('invoice-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('invoice-modal')) closeInvoiceModal();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeLeadModal();
  closeInvoiceModal();
});

/* =========================================================
   LEAD FILTER BUTTONS
   ========================================================= */
document.querySelectorAll('[data-lead-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-lead-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderLeads(btn.dataset.leadFilter);
  });
});
