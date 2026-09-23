/* EUS Archive — application */
'use strict';

/* ---------- basics ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = s => esc(s).replace(/\n/g, '<br>');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().slice(0, 10);
const deep = o => JSON.parse(JSON.stringify(o));

const App = { lang: 'ar', rep: null, dirty: false, all: [], suppressHash: false };

const t = key => (T[key] || [key, key])[App.lang === 'ar' ? 1 : 0];
/* Label in a report language: 'en' | 'ar' | 'bi' */
function lab(key, L) {
  const p = T[key] || [key, key];
  if (L === 'bi') return p[0] === p[1] ? esc(p[0]) : `<span class="l-en">${esc(p[0])}</span><span class="l-ar" dir="rtl">${esc(p[1])}</span>`;
  return esc(p[L === 'ar' ? 1 : 0]);
}
function opt(list, code) {
  const o = (OPT[list] || []).find(x => x[0] === code);
  if (!o) return null;
  return list === 'rosemont' ? [o[2], o[3]] : [o[1], o[2]];
}
function optText(list, code, L) {
  const o = opt(list, code);
  if (!o) return String(code ?? '');
  return L === 'ar' ? o[1] : o[0];
}
function fmtDate(d) {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return dd && m ? `${dd}/${m}/${y}` : d;
}
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, val) {
  const ks = path.split('.');
  let o = obj;
  ks.slice(0, -1).forEach((k, i) => {
    if (o[k] == null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    o = o[k];
  });
  o[ks[ks.length - 1]] = val;
}
const empty = v => v == null || v === '' || (Array.isArray(v) && !v.length);

function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3000);
}
function confirmBox(title, body, okLabel, danger = true) {
  return new Promise(resolve => {
    const m = $('#modal');
    m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="mTitle">
      <h3 id="mTitle">${ico(danger ? 'warning' : 'doc', 'lg')}${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}
      <div class="modal-actions"><button class="btn ghost" data-a="no">${esc(title === t('confirmLeave') ? t('keepEditing') : t('cancel'))}</button>
      <button class="btn ${danger ? 'danger' : 'primary'}" data-a="yes">${esc(okLabel)}</button></div></div>`;
    m.hidden = false;
    $('[data-a="yes"]', m).focus();
    const done = v => { m.hidden = true; m.innerHTML = ''; document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = e => { if (e.key === 'Escape') done(false); };
    document.addEventListener('keydown', onKey);
    m.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a) done(a === 'yes'); else if (e.target === m) done(false);
    };
  });
}
function download(name, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function resizeImage(file, max, type = 'image/jpeg', q = 0.86) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const ctx = c.getContext('2d');
        if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(type, q));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ---------- language & shell ---------- */
function applyLang() {
  const html = document.documentElement;
  html.lang = App.lang;
  html.dir = App.lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.title = t('appName');
}
function setLang(l) {
  App.lang = l;
  Settings.save({ uiLang: l });
  applyLang();
  route();
}

/* ---------- routing ---------- */
function go(hash) { if (location.hash !== hash) location.hash = hash; else route(); }
let lastHash = location.hash;
async function onHash() {
  if (App.suppressHash) { App.suppressHash = false; return; }
  if (App.dirty && lastHash.startsWith('#edit') && !location.hash.startsWith('#edit')) {
    const ok = await confirmBox(t('confirmLeave'), '', t('discard'));
    if (!ok) { App.suppressHash = true; location.hash = lastHash; return; }
    App.dirty = false;
  }
  lastHash = location.hash;
  route();
}
async function route() {
  const [view, id, action] = (location.hash.slice(1) || 'archive').split('/');
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.v === (view === 'edit' && !id ? 'new' : view)));
  const main = $('#main');
  main.innerHTML = '';
  document.body.classList.remove('printing-area');
  window.scrollTo(0, 0);
  App.all = await DB.all().catch(() => []);
  if (view === 'new') return go('#edit');
  if (view === 'edit') return viewEditor(main, id);
  if (view === 'view') return viewPreview(main, id, action === 'print');
  if (view === 'stats') return viewStats(main);
  if (view === 'settings') return viewSettings(main);
  return viewArchive(main);
}

/* ---------- archive ---------- */
const archiveFilter = { q: '', from: '', to: '', status: '', pending: false };
function viewArchive(main) {
  main.innerHTML = `
  <div class="page-head">
    <div><h1>${esc(t('navArchive'))}</h1><p class="muted"><span class="num">${App.all.length}</span> ${esc(t('reportsCount'))}</p></div>
    <div class="head-actions">
      <button class="btn ghost" id="bPrintList">${ico('printer')}${esc(t('printList'))}</button>
      <button class="btn ghost" id="bExportCsv">${ico('sheet')}${esc(t('exportCsv'))}</button>
      <button class="btn ghost" id="bBackup">${ico('cloudDown')}${esc(t('exportJson'))}</button>
      <button class="btn primary" id="bNew">${ico('newdoc')}${esc(t('navNew'))}</button>
    </div>
  </div>
  <div class="filters">
    <span class="search-box">${ico('search')}<input id="fQ" type="search" placeholder="${esc(t('search'))}" value="${esc(archiveFilter.q)}" aria-label="${esc(t('search'))}"></span>
    <label class="inline">${esc(t('from'))}<input id="fFrom" type="date" value="${archiveFilter.from}"></label>
    <label class="inline">${esc(t('to'))}<input id="fTo" type="date" value="${archiveFilter.to}"></label>
    <select id="fStatus" aria-label="${esc(t('colStatus'))}">
      <option value="">${esc(t('allStatus'))}</option>
      <option value="draft"${archiveFilter.status === 'draft' ? ' selected' : ''}>${esc(t('draft'))}</option>
      <option value="final"${archiveFilter.status === 'final' ? ' selected' : ''}>${esc(t('final'))}</option>
    </select>
    <label class="chip-toggle"><input id="fPending" type="checkbox"${archiveFilter.pending ? ' checked' : ''}><span>${esc(t('pendingPath'))}</span></label>
  </div>
  <div id="list" class="rep-list"></div>`;
  const draw = () => {
    const q = archiveFilter.q.trim().toLowerCase();
    const rows = App.all.filter(r => {
      const d = r.procedure?.date || '';
      if (archiveFilter.from && d < archiveFilter.from) return false;
      if (archiveFilter.to && d > archiveFilter.to) return false;
      if (archiveFilter.status && r.status !== archiveFilter.status) return false;
      if (archiveFilter.pending && r.pathology?.status !== 'pending') return false;
      if (!q) return true;
      const hay = [r.number, r.patient?.name, r.patient?.mrn, r.patient?.nid, r.impression?.dx, r.impression?.text, r.procedure?.endoscopist,
        ...(r.indication?.items || []).flatMap(c => opt('indications', c) || [])].join(' ').toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => (b.procedure?.date || '').localeCompare(a.procedure?.date || '') || (b.updatedAt || 0) - (a.updatedAt || 0));
    const list = $('#list');
    App.filtered = rows;
    if (!rows.length) { list.innerHTML = `<p class="empty">${ico('fan', 'xxl')}<br>${esc(App.all.length ? t('noMatch') : t('noReports'))}</p>`; return; }
    list.innerHTML = `<div class="rep-row rep-headrow" aria-hidden="true">
        <span>${esc(t('colDate'))}</span><span>${esc(t('colPatient'))}</span><span>${esc(t('colProcedure'))}</span><span>${esc(t('colImpression'))}</span><span>${esc(t('colStatus'))}</span><span></span></div>` +
      rows.map(r => {
        const procs = (r.procedure?.types || []).map(c => optText('procTypes', c, App.lang)).join(App.lang === 'ar' ? '، ' : ', ');
        const pa = r.pathology?.status;
        const paCat = r.pathology?.category;
        return `<article class="rep-row" data-id="${r.id}">
          <span class="c-date"><b class="num">${esc(fmtDate(r.procedure?.date))}</b><small class="num mono">${esc(r.number || '—')}</small></span>
          <span class="c-pt"><b>${esc(r.patient?.name || '—')}</b><small><span class="mono">${esc(r.patient?.mrn || '')}</span>${r.patient?.age ? ` · ${esc(r.patient.age)} ${esc(t('years'))}` : ''}${r.patient?.sex ? ` · ${esc(optText('sex', r.patient.sex, App.lang))}` : ''}</small></span>
          <span class="c-proc">${esc(procs || '—')}</span>
          <span class="c-imp">${esc(r.impression?.dx || (r.impression?.text || '').split('\n')[0] || '—')}</span>
          <span class="c-st">
            <span class="pill ${r.status === 'final' ? 'ok' : 'warn'}">${esc(t(r.status === 'final' ? 'final' : 'draft'))}</span>
            ${pa === 'pending' ? `<span class="pill info">${esc(t('pendingPath'))}</span>` : ''}
            ${pa === 'received' && paCat ? `<span class="pill ${['malignant', 'suspicious'].includes(paCat) ? 'crit' : 'neutral'}">${esc(optText('paCategory', paCat, App.lang))}</span>` : ''}
            ${r.sample ? `<span class="pill neutral">${esc(t('sample'))}</span>` : ''}
          </span>
          <span class="c-act">
            <button class="btn sm" data-act="view">${ico('eye')}${esc(t('open'))}</button>
            <button class="btn sm ghost" data-act="print" title="${esc(t('print'))}" aria-label="${esc(t('print'))}">${ico('printer')}</button>
            <button class="btn sm ghost" data-act="edit" title="${esc(t('edit'))}" aria-label="${esc(t('edit'))}">${ico('pencil')}</button>
            <button class="btn sm ghost" data-act="dup" title="${esc(t('duplicate'))}" aria-label="${esc(t('duplicate'))}">${ico('copy2')}</button>
            <button class="btn sm ghost" data-act="del" title="${esc(t('del'))}" aria-label="${esc(t('del'))}">${ico('trash')}</button>
          </span></article>`;
      }).join('');
  };
  draw();
  $('#fQ').oninput = e => { archiveFilter.q = e.target.value; draw(); };
  $('#fFrom').onchange = e => { archiveFilter.from = e.target.value; draw(); };
  $('#fTo').onchange = e => { archiveFilter.to = e.target.value; draw(); };
  $('#fStatus').onchange = e => { archiveFilter.status = e.target.value; draw(); };
  $('#fPending').onchange = e => { archiveFilter.pending = e.target.checked; draw(); };
  $('#bNew').onclick = () => go('#edit');
  $('#bBackup').onclick = exportBackup;
  $('#bExportCsv').onclick = exportCsv;
  $('#bPrintList').onclick = () => printRegister(App.filtered || []);
  $('#list').onclick = async e => {
    const btn = e.target.closest('[data-act]');
    const row = e.target.closest('.rep-row[data-id]');
    if (!row) return;
    const id = row.dataset.id;
    const act = btn ? btn.dataset.act : 'view';
    if (act === 'view') go('#view/' + id);
    if (act === 'print') go('#view/' + id + '/print');
    if (act === 'edit') go('#edit/' + id);
    if (act === 'dup') {
      const src = await DB.get(id);
      const copy = deep(src);
      Object.assign(copy, { id: uid(), number: '', status: 'draft', createdAt: Date.now(), updatedAt: Date.now(), sample: false });
      copy.procedure = Object.assign({}, copy.procedure, { date: today(), start: '', end: '' });
      copy.pathology = {}; copy.images = []; copy.ae = {}; copy.sign = {};
      await DB.put(copy);
      go('#edit/' + copy.id);
    }
    if (act === 'del') {
      if (await confirmBox(t('confirmDelTitle'), t('confirmDelBody'), t('del'))) {
        await DB.del(id); toast(t('deleted')); route();
      }
    }
  };
}

/* ---------- editor ---------- */
function newReport() {
  const S = Settings.load();
  const docs = (S.doctors || '').split('\n').map(s => s.trim()).filter(Boolean);
  return {
    id: uid(), number: '', status: 'draft', createdAt: Date.now(), updatedAt: Date.now(),
    patient: {}, procedure: { date: today(), endoscopist: docs[0] || '', scopeType: 'linear', route: 'upper', priority: 'elective', types: ['diag'] },
    indication: { items: [] }, findings: {}, stations: {}, lesions: [], rosemont: { items: [] },
    staging: {}, tissue: {}, therapy: {}, ae: { items: [] }, impression: { recs: [] }, images: [], pathology: {}, sign: { name: docs[0] || '', date: today() },
  };
}

function fieldHTML(f, r, prefix = '', ctx = r) {
  const k = prefix + f.k;
  const v = getPath(r, k);
  const id = 'f_' + k.replace(/\./g, '_');
  const span = f.span ? ` span${f.span}` : '';
  const req = f.req ? ' <b class="req" aria-hidden="true">*</b>' : '';
  const hidden = f.show && !f.show(ctx) ? ' hidden' : '';
  const label = `<span class="flabel">${esc(t(f.l))}${req}</span>`;
  const unit = f.unit ? `<span class="unit">${esc(t(f.unit))}</span>` : '';
  if (f.t === 'checks' || f.t === 'radio') {
    const type = f.t === 'checks' ? 'checkbox' : 'radio';
    const sel = f.t === 'checks' ? (v || []) : [v];
    const opts = OPT[f.o].map(o => {
      const lbl = f.o === 'rosemont' ? o[App.lang === 'ar' ? 3 : 2] : o[App.lang === 'ar' ? 2 : 1];
      return `<label class="chip"><input type="${type}" name="${id}" data-k="${k}" data-kind="${f.t}" value="${esc(o[0])}"${sel.includes(o[0]) ? ' checked' : ''}><span>${esc(lbl)}</span></label>`;
    }).join('');
    return `<fieldset class="field${span}" data-wrap="${k}"${hidden}><legend class="flabel">${esc(t(f.l))}${req}</legend><div class="chips">${opts}</div></fieldset>`;
  }
  let input;
  if (f.t === 'select') {
    input = `<select id="${id}" data-k="${k}"><option value=""></option>${OPT[f.o].map(o => `<option value="${esc(o[0])}"${v === o[0] ? ' selected' : ''}>${esc(o[App.lang === 'ar' ? 2 : 1])}</option>`).join('')}</select>`;
  } else if (f.t === 'textarea') {
    input = `<textarea id="${id}" data-k="${k}" rows="${f.rows || 3}">${esc(v || '')}</textarea>`;
  } else {
    const type = f.t === 'number' ? 'number' : f.t;
    input = `<input id="${id}" data-k="${k}" type="${type}"${f.t === 'number' ? ` step="${f.step || 'any'}" inputmode="decimal"` : ''}${f.dl ? ` list="dl_${f.dl}" autocomplete="off"` : ''}${f.mono ? ' class="mono" dir="ltr"' : ''} value="${esc(v ?? '')}">`;
  }
  return `<label class="field${span}" data-wrap="${k}" for="${id}"${hidden}>${label}<span class="inwrap">${input}${unit}</span></label>`;
}

function datalists() {
  const S = Settings.load();
  const lines = s => (s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const mk = (id, arr) => `<datalist id="dl_${id}">${arr.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`;
  return mk('doctors', lines(S.doctors)) + mk('staff', lines(S.staff)) + mk('people', [...lines(S.doctors), ...lines(S.staff)]) + mk('scopes', lines(S.scopes));
}

function sectionVisible(sec, r) { return !sec.show || sec.show(r) || hasData(sec, r); }
function hasData(sec, r) { return (sec.fields || []).some(f => !empty(getPath(r, f.k))); }

async function viewEditor(main, id) {
  let r;
  if (id) {
    r = await DB.get(id);
    if (!r) return go('#archive');
    r = Object.assign(newReport(), deep(r));
  } else {
    r = newReport();
  }
  App.rep = r;
  App.dirty = false;

  main.innerHTML = `
  <div class="page-head editor-head">
    <div><h1>${esc(id ? t('edit') : t('navNew'))}</h1>
      <p class="muted"><span class="mono num">${esc(r.number || '—')}</span> · <span class="pill ${r.status === 'final' ? 'ok' : 'warn'}">${esc(t(r.status === 'final' ? 'final' : 'draft'))}</span> <span id="dirtyMark" class="dirty" hidden>● ${esc(t('unsaved'))}</span></p></div>
  </div>
  <div class="editor">
    <nav class="toc" aria-label="${esc(t('sections'))}"><p class="eyebrow">${esc(t('sections'))}</p><ol id="toc"></ol></nav>
    <form id="form" class="form" novalidate autocomplete="off"></form>
  </div>
  <div class="actionbar">
    <button class="btn ghost" id="bCancel" type="button">${ico('close')}${esc(t('cancel'))}</button>
    <span class="spacer"></span>
    <button class="btn ghost" id="bPreview" type="button">${ico('printer')}${esc(t('preview'))}</button>
    <button class="btn" id="bDraft" type="button">${ico('save')}${esc(t('saveDraft'))}</button>
    <button class="btn primary" id="bFinal" type="button">${ico('shield')}${esc(t('finalize'))}</button>
  </div>${datalists()}`;

  const form = $('#form');
  form.innerHTML = SCHEMA.map(sec => `
    <section class="sec" id="sec-${sec.id}" data-sec="${sec.id}"${sectionVisible(sec, r) ? '' : ' hidden'}>
      <h2>${ico(SECTION_ICONS[sec.id], 'lg')}${esc(t(sec.l))}</h2>
      ${sec.custom === 'stations' ? stationsHTML(r) : ''}
      ${sec.custom === 'lesions' ? '<div id="lesions"></div>' : ''}
      ${sec.custom === 'rosemont' ? rosemontHTML(r) : ''}
      ${sec.custom === 'images' ? imagesShellHTML() : ''}
      ${sec.fields ? `<div class="grid">${sec.fields.map(f => fieldHTML(f, r)).join('')}</div>` : ''}
      ${sec.custom === 'impression' ? `<div class="gen"><button type="button" class="btn ghost" id="bGen">${ico('star')}${esc(t('genImpression'))}</button><small class="muted">${esc(t('genHint'))}</small></div>` : ''}
    </section>`).join('');
  // impression generator sits above the text field
  const impSec = $('#sec-impression');
  impSec.insertBefore($('.gen', impSec), $('.grid', impSec));

  renderLesions();
  renderImages();
  drawToc();
  updateRosemont();

  form.addEventListener('input', onFormInput);
  form.addEventListener('change', onFormInput);
  form.addEventListener('click', onFormClick);

  $('#bCancel').onclick = () => go(id ? '#view/' + id : '#archive');
  $('#bDraft').onclick = () => saveReport('draft');
  $('#bFinal').onclick = () => saveReport('final');
  $('#bPreview').onclick = async () => { if (await saveReport(App.rep.status || 'draft', true)) go('#view/' + App.rep.id); };
  $('#bGen').onclick = () => {
    const ta = $('#f_impression_text');
    const txt = draftImpression(App.rep, App.lang);
    ta.value = ta.value.trim() ? ta.value.trim() + '\n\n' + txt : txt;
    setPath(App.rep, 'impression.text', ta.value);
    markDirty();
  };
}

function markDirty() { App.dirty = true; const d = $('#dirtyMark'); if (d) d.hidden = false; }

function onFormInput(e) {
  const el = e.target;
  const k = el.dataset.k;
  if (!k) return;
  const r = App.rep;
  if (el.dataset.kind === 'checks') {
    let arr = getPath(r, k) || [];
    arr = el.checked ? [...new Set([...arr, el.value])] : arr.filter(x => x !== el.value);
    // "none" is exclusive in adverse events & vessels
    if (el.value === 'none' && el.checked) arr = ['none'];
    else if (el.checked) arr = arr.filter(x => x !== 'none');
    setPath(r, k, arr);
    $$(`input[data-k="${k}"]`).forEach(i => { i.checked = arr.includes(i.value); });
  } else if (el.dataset.kind === 'radio') {
    if (e.type !== 'change') return;
    setPath(r, k, el.value);
  } else if (el.type === 'number') {
    setPath(r, k, el.value === '' ? '' : el.value);
  } else {
    setPath(r, k, el.value);
  }
  if (k === 'patient.dob' && el.value) {
    const b = new Date(el.value), n = new Date();
    let age = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
    if (age >= 0 && age < 130) { r.patient.age = String(age); const a = $('#f_patient_age'); if (a) a.value = age; }
  }
  if (k.startsWith('rosemont')) updateRosemont();
  if (k.startsWith('stations')) paintStation(k.split('.')[1]);
  markDirty();
  refreshVisibility();
}

/* Clicking a checked radio chip clears it (all radio groups are optional) */
function onFormClick(e) {
  const inp = e.target.closest('label.chip')?.querySelector('input[type=radio]');
  if (inp && e.target.tagName !== 'INPUT') {
    if (inp.checked) {
      e.preventDefault();
      inp.checked = false;
      setPath(App.rep, inp.dataset.k, '');
      markDirty(); refreshVisibility();
      if (inp.dataset.k.startsWith('stations')) paintStation(inp.dataset.k.split('.')[1]);
    }
  }
  const act = e.target.closest('[data-lact]');
  if (act) {
    e.preventDefault();
    const i = +act.dataset.i;
    if (act.dataset.lact === 'add') { App.rep.lesions.push({}); renderLesions(); $(`#lesion-${App.rep.lesions.length - 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (act.dataset.lact === 'rm') { App.rep.lesions.splice(i, 1); renderLesions(); }
    if (act.dataset.lact === 'imgRm') { App.rep.images.splice(i, 1); renderImages(); }
    if (act.dataset.lact === 'allNormal') {
      STATIONS.forEach((g, gi) => { if (+act.dataset.g !== gi) return; g.items.forEach(([c]) => { const s = App.rep.stations[c] || {}; if (!s.s) { App.rep.stations[c] = Object.assign(s, { s: 'normal' }); } paintStation(c, true); }); });
    }
    markDirty();
  }
}

function refreshVisibility() {
  const r = App.rep;
  SCHEMA.forEach(sec => {
    const el = $(`#sec-${sec.id}`);
    if (el) el.hidden = !sectionVisible(sec, r);
    (sec.fields || []).forEach(f => { if (f.show) { const w = $(`[data-wrap="${f.k}"]`); if (w) w.hidden = !f.show(r); } });
  });
  (r.lesions || []).forEach((l, i) => LESION_FIELDS.forEach(f => {
    if (f.show) { const w = $(`[data-wrap="lesions.${i}.${f.k}"]`); if (w) w.hidden = !f.show(l); }
  }));
  drawToc();
}

function drawToc() {
  const r = App.rep;
  const toc = $('#toc');
  if (!toc) return;
  toc.innerHTML = SCHEMA.filter(s => sectionVisible(s, r)).map(sec => {
    const reqs = (sec.fields || []).filter(f => f.req && (!f.show || f.show(r)));
    const missing = reqs.some(f => empty(getPath(r, f.k)));
    const filled = sec.fields ? hasData(sec, r) : sec.custom === 'lesions' ? r.lesions.length > 0 : sec.custom === 'images' ? r.images.length > 0 : sec.custom === 'rosemont' ? (r.rosemont?.items || []).length > 0 : false;
    const stFilled = sec.custom === 'stations' && Object.values(r.stations || {}).some(s => s.s);
    const state = missing ? 'miss' : (filled || stFilled) ? 'done' : '';
    return `<li><a href="#sec-${sec.id}" data-jump="${sec.id}" class="${state}">${ico(SECTION_ICONS[sec.id])}<span>${esc(t(sec.l))}</span><i aria-hidden="true"></i></a></li>`;
  }).join('');
  toc.onclick = e => {
    const a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    $(`#sec-${a.dataset.jump}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

/* stations */
function stationsHTML(r) {
  return STATIONS.map((g, gi) => `
    <div class="st-group">
      <div class="st-ghead"><h3>${esc(g.g[App.lang === 'ar' ? 1 : 0])}</h3><button type="button" class="btn sm ghost" data-lact="allNormal" data-g="${gi}">${ico('check')}${esc(t('allNormal'))}</button></div>
      ${g.items.map(([c, en, ar]) => {
        const s = r.stations?.[c] || {};
        return `<div class="st-row" data-st="${c}" data-state="${s.s || ''}">
          <span class="st-name">${esc(App.lang === 'ar' ? ar : en)}</span>
          <span class="seg">${OPT.stationStatus.map(o => `<label class="chip sm st-${o[0]}"><input type="radio" name="st_${c}" data-k="stations.${c}.s" data-kind="radio" value="${o[0]}"${s.s === o[0] ? ' checked' : ''}><span>${esc(o[App.lang === 'ar' ? 2 : 1])}</span></label>`).join('')}</span>
          <input class="st-note" data-k="stations.${c}.n" type="text" value="${esc(s.n || '')}" placeholder="${esc(t('fdNote'))}" aria-label="${esc((App.lang === 'ar' ? ar : en) + ' — ' + t('fdNote'))}">
        </div>`;
      }).join('')}
    </div>`).join('');
}
function paintStation(c, syncInputs) {
  const row = $(`.st-row[data-st="${c}"]`);
  if (!row) return;
  const s = App.rep.stations?.[c]?.s || '';
  row.dataset.state = s;
  if (syncInputs) $$('input[type=radio]', row).forEach(i => { i.checked = i.value === s; });
}

/* lesions */
function renderLesions() {
  const box = $('#lesions');
  if (!box) return;
  const r = App.rep;
  box.innerHTML = r.lesions.map((l, i) => `
    <div class="lesion" id="lesion-${i}">
      <div class="lesion-head"><h3>${ico('target')}${esc(t('lesion'))} <span class="num">${i + 1}</span></h3>
        <button type="button" class="btn sm ghost danger-text" data-lact="rm" data-i="${i}">${ico('close')}${esc(t('remove'))}</button></div>
      <div class="grid">${LESION_FIELDS.map(f => fieldHTML(f, r, `lesions.${i}.`, l)).join('')}</div>
    </div>`).join('') +
    `<button type="button" class="btn ghost add" data-lact="add">${ico('plus')}${esc(t('addLesion'))}</button>`;
  drawToc();
}

/* rosemont */
function rosemontHTML(r) {
  const sel = r.rosemont?.items || [];
  const grp = (cat, key) => `<fieldset class="field span4"><legend class="flabel">${esc(t(key))}</legend><div class="chips">${OPT.rosemont.filter(o => o[1] === cat).map(o =>
    `<label class="chip"><input type="checkbox" data-k="rosemont.items" data-kind="checks" value="${o[0]}"${sel.includes(o[0]) ? ' checked' : ''}><span>${esc(o[App.lang === 'ar' ? 3 : 2])}</span></label>`).join('')}</div></fieldset>`;
  return `<div class="grid">${grp('A', 'rmMajorA')}${grp('B', 'rmMajorB')}${grp('m', 'rmMinor')}</div>
    <p class="rm-result">${esc(t('rosemontResult'))}: <b id="rmOut"></b></p>`;
}
function updateRosemont() {
  const out = $('#rmOut');
  if (!out) return;
  const c = rosemontClass(App.rep.rosemont?.items);
  out.textContent = c ? optText('rosemontCat', c, App.lang) : t('notAssessed');
  out.className = c === 'consistent' ? 'sev-crit' : c === 'suggestive' ? 'sev-warn' : '';
}

/* images */
function imagesShellHTML() {
  return `<div class="img-drop"><label class="btn ghost" for="imgIn">${ico('image')}${esc(t('addImages'))}</label>
    <input id="imgIn" type="file" accept="image/*" multiple hidden><small class="muted">${esc(t('imagesHint'))}</small></div>
    <div id="imgs" class="img-grid"></div>`;
}
function renderImages() {
  const box = $('#imgs');
  if (!box) return;
  box.innerHTML = App.rep.images.map((im, i) => `
    <figure class="img-card"><img src="${im.src}" alt="${esc(im.cap || '')}">
      <figcaption><input type="text" data-k="images.${i}.cap" value="${esc(im.cap || '')}" placeholder="${esc(t('caption'))}" aria-label="${esc(t('caption'))}">
      <button type="button" class="btn sm ghost danger-text" data-lact="imgRm" data-i="${i}" aria-label="${esc(t('remove'))}">${ico('close')}</button></figcaption></figure>`).join('');
  const inp = $('#imgIn');
  inp.onchange = async () => {
    for (const f of inp.files) {
      try { App.rep.images.push({ src: await resizeImage(f, 1200), cap: '' }); } catch (e) { console.warn(e); }
    }
    inp.value = '';
    renderImages(); markDirty();
  };
  drawToc();
}

async function saveReport(status, quiet) {
  const r = App.rep;
  if (status === 'final') {
    const miss = [];
    SCHEMA.forEach(sec => (sec.fields || []).forEach(f => {
      if (f.req && sectionVisible(sec, r) && (!f.show || f.show(r)) && empty(getPath(r, f.k))) miss.push(t(f.l));
    }));
    if (miss.length) { toast(t('required') + miss.join('، '), 'err'); drawToc(); return false; }
  }
  if (!r.patient?.name && !r.patient?.mrn) { toast(t('required') + t('pName'), 'err'); return false; }
  if (!r.number) r.number = Settings.nextNumber(r.procedure?.date);
  r.status = status;
  r.updatedAt = Date.now();
  if (r.pathology?.status == null && (r.tissue?.specimens || []).length) r.pathology.status = 'pending';
  await DB.put(r);
  App.dirty = false;
  if (!quiet) toast(t(status === 'final' ? 'savedFinal' : 'saved'), 'ok');
  if (!location.hash.endsWith(r.id)) { App.suppressHash = true; location.hash = '#edit/' + r.id; lastHash = location.hash; }
  const d = $('#dirtyMark'); if (d) d.hidden = true;
  const head = $('.editor-head .muted');
  if (head) head.innerHTML = `<span class="mono num">${esc(r.number)}</span> · <span class="pill ${r.status === 'final' ? 'ok' : 'warn'}">${esc(t(r.status === 'final' ? 'final' : 'draft'))}</span> <span id="dirtyMark" class="dirty" hidden>● ${esc(t('unsaved'))}</span>`;
  return true;
}

/* ---------- impression drafting ---------- */
function draftImpression(r, L) {
  const ar = L === 'ar';
  const sep = ar ? '؛ ' : '; ';
  const lines = [];
  const stName = c => { for (const g of STATIONS) { const x = g.items.find(i => i[0] === c); if (x) return ar ? x[2] : x[1]; } return c; };
  const ab = Object.entries(r.stations || {}).filter(([, s]) => s.s === 'abnormal');
  const nv = Object.entries(r.stations || {}).filter(([, s]) => s.s === 'nv');

  (r.lesions || []).forEach(l => {
    const parts = [];
    const where = [l.organ && optText('organ', l.organ, L), l.segment].filter(Boolean).join(' — ');
    if (l.nature) parts.push(optText('nature', l.nature, L));
    if (l.echo) parts.push(optText('echo', l.echo, L));
    if (l.sizeA) parts.push(`${l.sizeA}${l.sizeB ? ' × ' + l.sizeB : ''} ${ar ? 'مم' : 'mm'}`);
    if (l.margin) parts.push((ar ? 'الحواف: ' : 'margins: ') + optText('margin', l.margin, L));
    if (l.layer) parts.push((ar ? 'منشؤها: ' : 'arising from ') + optText('layer', l.layer, L));
    if ((l.features || []).length) parts.push(l.features.map(c => optText('features', c, L)).join(ar ? '، ' : ', '));
    const vs = (l.vessels || []).filter(v => v !== 'none');
    if (vs.length) parts.push((l.vesselType ? optText('vesselType', l.vesselType, L) + ' ' : (ar ? 'علاقة بـ ' : 'contact with ')) + vs.map(c => optText('vessels', c, L)).join(ar ? '، ' : ', '));
    else if (has(l.vessels, 'none')) parts.push(optText('vessels', 'none', L));
    if (l.elasto) parts.push((ar ? 'المرونة: ' : 'elastography: ') + optText('elasto', l.elasto, L));
    lines.push(`${where ? where + ': ' : ''}${parts.join(sep)}.`);
  });

  const f = r.findings || {};
  if (f.cbd) lines.push(`${ar ? 'القناة الصفراوية المشتركة' : 'CBD'} ${f.cbd} ${ar ? 'مم' : 'mm'}${f.cbdContent ? ' — ' + optText('cbdContent', f.cbdContent, L) : ''}.`);
  if (f.mpd && +f.mpd >= 3.5) lines.push(`${ar ? 'توسع القناة البنكرياسية الرئيسية' : 'Dilated main pancreatic duct'} (${f.mpd} ${ar ? 'مم' : 'mm'}).`);
  if (f.gbContent && f.gbContent !== 'normal') lines.push(`${ar ? 'المرارة' : 'Gallbladder'}: ${optText('gbContent', f.gbContent, L)}.`);
  ab.forEach(([c, s]) => lines.push(`${stName(c)}: ${s.n || (ar ? 'غير طبيعي' : 'abnormal')}.`));

  const rc = rosemontClass(r.rosemont?.items);
  if (rc && rc !== 'normal') lines.push(`${optText('rosemontCat', rc, L)} (${ar ? 'معايير روزمونت' : 'Rosemont criteria'}).`);

  const s = r.staging || {};
  if (s.t || s.n || s.m) lines.push(`${ar ? 'المرحلة بالسونار' : 'EUS stage'}: ${[s.t && 'u' + s.t, s.n && 'u' + s.n, s.m].filter(Boolean).join(' ')}${s.organ ? ' — ' + optText('stgOrgan', s.organ, L) : ''}${s.resect ? ' — ' + optText('resect', s.resect, L) : ''}.`);

  const ts = r.tissue || {};
  if (ts.technique) {
    const bits = [ts.gauge && optText('gauge', ts.gauge, L), ts.needle && optText('needle', ts.needle, L)].filter(Boolean).join(' ');
    lines.push(`${ar ? 'تم أخذ عينة' : 'EUS-guided'} ${optText('technique', ts.technique, L)}${ts.target ? (ar ? ' من ' : ' of ') + ts.target : ''}${bits ? (ar ? ' بإبرة ' : ' using ') + bits : ''}${ts.passes ? (ar ? `، ${ts.passes} تمريرات` : `, ${ts.passes} passes`) : ''}${ts.route ? ' ' + optText('tsRoute', ts.route, L) : ''}${ts.rose && ts.rose !== 'notDone' ? ` (ROSE: ${optText('rose', ts.rose, L)})` : ''}.`);
  }
  const th = r.therapy || {};
  if ((th.items || []).length) lines.push(`${th.items.map(c => optText('therapy', c, L)).join(ar ? '، ' : ', ')}${th.stent ? ' — ' + optText('stent', th.stent, L) + (th.stentSize ? ` ${th.stentSize} ${ar ? 'مم' : 'mm'}` : '') : ''}${th.success ? ' — ' + (ar ? 'النجاح الفني: ' : 'technical success: ') + optText('success', th.success, L) : ''}.`);

  if (!lines.length) lines.push(ar ? 'فحص سونار ناظوري طبيعي للتراكيب التي تمت مشاهدتها.' : 'Normal endoscopic ultrasound of the visualized structures.');
  if (nv.length) lines.push(`${ar ? 'لم تُشاهد' : 'Not visualized'}: ${nv.map(([c]) => stName(c)).join(ar ? '، ' : ', ')}.`);
  if (aeReal(r)) lines.push(`${ar ? 'مضاعفات' : 'Adverse event'}: ${r.ae.items.filter(x => x !== 'none').map(c => optText('ae', c, L)).join(ar ? '، ' : ', ')}${r.ae.severity ? ' (' + optText('aeSeverity', r.ae.severity, L) + ')' : ''}.`);
  else if (has(r.ae?.items, 'none')) lines.push(ar ? 'لا توجد مضاعفات فورية.' : 'No immediate adverse events.');
  return lines.map((x, i) => `${i + 1}. ${x.replace(/\.{2,}$/, '.')}`).join('\n');
}
