/* EUS Archive — local storage layer.
 * Reports live in IndexedDB (they carry images); settings live in localStorage.
 */
'use strict';

const DB = (() => {
  const NAME = 'eus-archive';
  const STORE = 'reports';
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const s = db.createObjectStore(STORE, { keyPath: 'id' });
          s.createIndex('date', 'procedure.date');
          s.createIndex('mrn', 'patient.mrn');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function tx(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      let result;
      Promise.resolve(fn(store)).then(r => { result = r; });
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  const req2p = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  return {
    all: () => tx('readonly', s => req2p(s.getAll())),
    get: id => tx('readonly', s => req2p(s.get(id))),
    put: rep => tx('readwrite', s => req2p(s.put(rep))),
    del: id => tx('readwrite', s => req2p(s.delete(id))),
    putMany: reps => tx('readwrite', s => Promise.all(reps.map(r => req2p(s.put(r))))),
  };
})();

const Settings = (() => {
  const KEY = 'eus-archive-settings';
  const defaults = {
    hospEn: 'General Hospital',
    hospAr: 'المستشفى العام',
    deptEn: 'Gastroenterology & Endoscopy Unit',
    deptAr: 'وحدة الجهاز الهضمي والمناظير',
    contact: '',
    logo: '',
    prefix: 'EUS',
    doctors: '',
    staff: '',
    scopes: '',
    reportLang: 'bi',
    footer: '',
    uiLang: 'ar',
    counter: {},
  };
  let cache = null;
  function load() {
    if (cache) return cache;
    try { cache = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch { cache = Object.assign({}, defaults); }
    return cache;
  }
  function save(patch) {
    cache = Object.assign(load(), patch);
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { console.warn('Settings not saved', e); }
    return cache;
  }
  /* Next sequential report number for the year: EUS-2026-0001 */
  function nextNumber(dateStr) {
    const s = load();
    const year = (dateStr || new Date().toISOString()).slice(0, 4);
    const counter = Object.assign({}, s.counter);
    counter[year] = (counter[year] || 0) + 1;
    save({ counter });
    return `${s.prefix || 'EUS'}-${year}-${String(counter[year]).padStart(4, '0')}`;
  }
  return { load, save, nextNumber, defaults };
})();
