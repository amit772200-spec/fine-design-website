'use strict';

/* =========================================================
   IndexedDB storage layer — replaces localStorage
   No size limit (browsers allow hundreds of MB)
   Automatically migrates existing data from localStorage
   ========================================================= */

const DB_NAME    = 'amit_design_db';
const DB_VERSION = 1;
const STORE      = 'invitations';

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };

    req.onsuccess = e => {
      const db = e.target.result;
      migrateFromLocalStorage(db).then(() => resolve(db));
    };

    req.onerror = () => { _dbPromise = null; reject(req.error); };
  });
  return _dbPromise;
}

/* One-time migration from old localStorage data */
async function migrateFromLocalStorage(db) {
  const OLD_KEY = 'amit_invitations';
  const raw = localStorage.getItem(OLD_KEY);
  if (!raw) return;
  try {
    const items = JSON.parse(raw) || [];
    if (!items.length) { localStorage.removeItem(OLD_KEY); return; }
    const existing = await _getAll(db);
    if (existing.length > 0) { localStorage.removeItem(OLD_KEY); return; }
    await _putAll(db, items);
    localStorage.removeItem(OLD_KEY);
    console.info('[db] Migrated', items.length, 'invitations from localStorage to IndexedDB');
  } catch (err) {
    console.warn('[db] Migration error:', err);
  }
}

function _getAll(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
}

function _putAll(db, items) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    items.forEach(item => st.put(item));
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

/* ---- Public API ---- */

async function dbLoadAll() {
  const db  = await openDB();
  const all = await _getAll(db);
  return all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

async function dbGet(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

async function dbSave(inv) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(inv);
    req.onsuccess = resolve;
    req.onerror   = () => reject(req.error);
  });
}

async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
    req.onsuccess = resolve;
    req.onerror   = () => reject(req.error);
  });
}

async function dbUpdatePrice(id, price) {
  const inv = await dbGet(id);
  if (inv) { inv.price = price; await dbSave(inv); }
}
