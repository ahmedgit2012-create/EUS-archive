/* EUS Archive — printable report sheet, preview view, exports */
'use strict';

function valHTML(f, v, L) {
  if (empty(v)) return '';
  const pair = (en, ar) => L === 'bi' ? (en === ar ? esc(en) : `<span class="v-en">${esc(en)}</span><span class="v-ar" dir="rtl">${esc(ar)}</span>`) : esc(L === 'ar' ? ar : en);
  if (f.t === 'select' || f.t === 'radio') { const o = opt(f.o, v) || [v, v]; return pair(o[0], o[1]); }
  if (f.t === 'checks') {
    const os = v.map(c => opt(f.o, c) || [c, c]);
    if (L === 'bi') return `<span class="v-en">${esc(os.map(o => o[0]).join(', '))}</span><span class="v-ar" dir="rtl">${esc(os.map(o => o[1]).join('، '))}</span>`;
    return esc(os.map(o => o[L === 'ar' ? 1 : 0]).join(L === 'ar' ? '، ' : ', '));
  }
  if (f.t === 'date') return `<span class="num">${esc(fmtDate(v))}</span>`;
  if (f.t === 'textarea') return nl2br(v);
  if (f.t === 'number' && f.unit) return `<span class="num">${esc(v)}</span> ${lab(f.unit, L === 'bi' ? 'en' : L)}`;
  return f.mono || f.t === 'number' || f.t === 'tel' ? `<span class="num" dir="ltr">${esc(v)}</span>` : esc(v);
}
const kv = (label, value, wide) => value ? `<div class="kv${wide ? ' wide' : ''}"><dt>${label}</dt><dd>${value}</dd></div>` : '';
const fieldsKV = (fields, obj, L, prefix = '', ctx = obj) => fields.filter(f => !f.show || f.show(ctx) || !empty(getPath(obj, prefix + f.k)))
  .map(f => kv(lab(f.l, L), valHTML(f, getPath(obj, prefix + f.k), L), f.t === 'textarea' || f.t === 'checks' || (f.span || 1) >= 3)).join('');
const secBlock = (key, L, inner) => inner.trim() ? `<section class="s-sec"><h3>${lab(key, L)}</h3>${inner}</section>` : '';

function durationMin(p) {
  if (!p?.start || !p?.end) return '';
  const [h1, m1] = p.start.split(':').map(Number), [h2, m2] = p.end.split(':').map(Number);
  let d = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (d < 0) d += 1440;
  return String(d);
}

function sheetHTML(r, L) {
  const S = Settings.load();
  const secById = id => SCHEMA.find(s => s.id === id);
  const both = (en, ar) => L === 'bi' ? `<span class="l-en">${esc(en)}</span><span class="l-ar" dir="rtl">${esc(ar)}</span>` : esc(L === 'ar' ? ar : en);
  const hosp = L === 'bi'
    ? `<div class="h-name">${esc(S.hospEn)}</div><div class="h-name ar" dir="rtl">${esc(S.hospAr)}</div><div class="h-dept">${esc(S.deptEn)}${S.deptAr ? ' · <span dir="rtl">' + esc(S.deptAr) + '</span>' : ''}</div>`
    : `<div class="h-name">${esc(L === 'ar' ? S.hospAr : S.hospEn)}</div><div class="h-dept">${esc(L === 'ar' ? S.deptAr : S.deptEn)}</div>`;

  /* patient + procedure summary */
  const P = secById('patient').fields, PR = secById('procedure').fields;
  const dur = durationMin(r.procedure);
  const procKV = fieldsKV(PR, r, L) + (dur ? kv(lab('prDuration', L), `<span class="num">${dur}</span>`) : '');

  /* stations */
  const stName = c => { for (const g of STATIONS) { const x = g.items.find(i => i[0] === c); if (x) return L === 'bi' ? x[1] : L === 'ar' ? x[2] : x[1]; } return c; };
  const stNameAr = c => { for (const g of STATIONS) { const x = g.items.find(i => i[0] === c); if (x) return x[2]; } return c; };
  const st = Object.entries(r.stations || {}).filter(([, s]) => s.s);
  const byState = k => st.filter(([, s]) => s.s === k);
  const namesList = arr => L === 'bi'
    ? `<span class="v-en">${esc(arr.map(([c]) => stName(c)).join(', '))}</span><span class="v-ar" dir="rtl">${esc(arr.map(([c]) => stNameAr(c)).join('، '))}</span>`
    : esc(arr.map(([c]) => stName(c)).join(L === 'ar' ? '، ' : ', '));
  let stationsHTML = '';
  if (st.length) {
    const rows = [];
    byState('abnormal').forEach(([c, s]) => rows.push(`<tr class="ab"><th>${L === 'bi' ? both(stName(c), stNameAr(c)) : esc(stName(c))}</th><td>${nl2br(s.n || optText('stationStatus', 'abnormal', L === 'bi' ? 'en' : L))}</td></tr>`));
    const normalWithNote = byState('normal').filter(([, s]) => s.n);
    normalWithNote.forEach(([c, s]) => rows.push(`<tr><th>${L === 'bi' ? both(stName(c), stNameAr(c)) : esc(stName(c))}</th><td>${nl2br(s.n)}</td></tr>`));
    const normal = byState('normal').filter(([, s]) => !s.n);
    if (normal.length) rows.push(`<tr><th>${both('Normal', 'طبيعي')}</th><td>${namesList(normal)}</td></tr>`);
    const nv = byState('nv');
    if (nv.length) rows.push(`<tr class="nv"><th>${both('Not visualized', 'لم يُشاهد')}</th><td>${namesList(nv)}</td></tr>`);
    stationsHTML = `<table class="st-table"><tbody>${rows.join('')}</tbody></table>`;
  }

  /* lesions */
  const lesionsHTML = (r.lesions || []).filter(l => Object.values(l).some(v => !empty(v))).map((l, i) =>
    `<div class="s-lesion"><h4>${both('Lesion', 'آفة')} <span class="num">${i + 1}</span></h4><dl class="kvs">${fieldsKV(LESION_FIELDS, l, L)}</dl></div>`).join('');

  /* rosemont */
  const rc = rosemontClass(r.rosemont?.items);
  const rmHTML = rc ? `<dl class="kvs">${kv(lab('rosemontResult', L), valHTML({ t: 'select', o: 'rosemontCat' }, rc, L))}${kv(both('Criteria present', 'المعايير الموجودة'), valHTML({ t: 'checks', o: 'rosemont' }, r.rosemont.items, L), true)}</dl>` : '';

  /* impression */
  const IM = secById('impression').fields;
  const imp = r.impression || {};
  const impHTML = (imp.text ? `<div class="s-impression">${nl2br(imp.text)}</div>` : '') +
    `<dl class="kvs">${fieldsKV(IM.filter(f => f.k !== 'impression.text'), r, L)}</dl>`;

  const imgs = (r.images || []).length ? `<div class="s-imgs">${r.images.map((im, i) => `<figure><img src="${im.src}" alt=""><figcaption><span class="num">${i + 1}</span>${im.cap ? ' — ' + esc(im.cap) : ''}</figcaption></figure>`).join('')}</div>` : '';

  const dl = inner => inner ? `<dl class="kvs">${inner}</dl>` : '';
  const showPath = r.pathology?.status === 'received';
  const sign = r.sign || {};

  return `<article class="sheet ${L === 'bi' ? 'bi' : ''} ${r.status !== 'final' ? 'is-draft' : ''}" dir="${L === 'ar' ? 'rtl' : 'ltr'}" lang="${L === 'ar' ? 'ar' : 'en'}">
    <header class="s-head">
      ${S.logo ? `<img class="s-logo" src="${S.logo}" alt="">` : ''}
      <div class="s-hosp">${hosp}${S.contact ? `<div class="h-contact">${esc(S.contact)}</div>` : ''}</div>
      <div class="s-meta"><div class="s-no"><small>${lab('rptNo', L)}</small><b class="num" dir="ltr">${esc(r.number || '—')}</b></div>
        ${r.status !== 'final' ? `<div class="s-draft">${lab('rptDraft', L)}</div>` : ''}</div>
    </header>
    <h2 class="s-title">${L === 'bi' ? `<span>${esc(T.rptTitle[0])}</span><span dir="rtl">${esc(T.rptTitle[1])}</span>` : lab('rptTitle', L)}</h2>
    <section class="s-sec s-patient"><dl class="kvs cols3">${fieldsKV(P, r, L)}</dl></section>
    ${secBlock('secProcedure', L, dl(procKV))}
    ${secBlock('secIndication', L, dl(fieldsKV(secById('indication').fields, r, L)))}
    ${secBlock('secFindings', L, stationsHTML + dl(fieldsKV(secById('findings').fields, r, L)))}
    ${secBlock('secLesions', L, lesionsHTML)}
    ${secBlock('secRosemont', L, rmHTML)}
    ${secBlock('secStaging', L, dl(fieldsKV(secById('staging').fields, r, L)))}
    ${secBlock('secTissue', L, dl(fieldsKV(secById('tissue').fields, r, L)))}
    ${secBlock('secTherapy', L, dl(fieldsKV(secById('therapy').fields, r, L)))}
    ${secBlock('secComplications', L, dl(fieldsKV(secById('ae').fields, r, L)))}
    ${secBlock('secImpression', L, impHTML)}
    ${secBlock('rptImages', L, imgs)}
    ${showPath ? secBlock('secPathology', L, dl(fieldsKV(secById('pathology').fields, r, L))) : ''}
    <footer class="s-foot">
      <div class="s-sign"><div class="line"></div><div><b>${esc(sign.name || r.procedure?.endoscopist || '')}</b>${sign.title ? ` · ${esc(sign.title)}` : ''}</div>
        <small>${lab('rptSigned', L)}${sign.date ? ` · <span class="num">${esc(fmtDate(sign.date))}</span>` : ''}</small></div>
      <div class="s-foot-note">${S.footer ? esc(S.footer) + '<br>' : ''}<small>${lab('rptPrinted', L)}: <span class="num">${esc(fmtDate(today()))}</span> · ${esc(r.number || '')}</small></div>
    </footer>
  </article>`;
}

/* ---------- preview view ---------- */
let previewLang = null;
async function viewPreview(main, id, autoPrint) {
  const r = await DB.get(id);
  if (!r) return go('#archive');
  const L = previewLang || Settings.load().reportLang || 'bi';
  main.innerHTML = `
  <div class="preview-bar">
    <button class="btn ghost" id="bBack">${ico('arrow', 'flip')}${esc(t('back'))}</button>
    <div class="seg-ctl" role="group" aria-label="${esc(t('printLang'))}">
      ${[['ar', 'langAr'], ['en', 'langEn'], ['bi', 'langBi']].map(([k, key]) => `<button class="${k === L ? 'on' : ''}" data-l="${k}" aria-pressed="${k === L}">${esc(t(key))}</button>`).join('')}
    </div>
    <span class="spacer"></span>
    <button class="btn ghost" id="bCopy">${ico('clipboard')}${esc(t('copyText'))}</button>
    <button class="btn ghost" id="bEdit">${ico('pencil')}${esc(t('edit'))}</button>
    <button class="btn primary" id="bPrint">${ico('printer')}${esc(t('print'))}</button>
  </div>
  <div class="sheet-wrap" id="sheetWrap">${sheetHTML(r, L)}</div>`;
  $('#bBack').onclick = () => go('#archive');
  $('#bEdit').onclick = () => go('#edit/' + id);
  $('#bPrint').onclick = () => printNow();
  if (autoPrint) { App.suppressHash = true; history.replaceState(null, '', '#view/' + id); lastHash = location.hash; App.suppressHash = false; waitImages($('.sheet')).then(printNow); }
  $('.seg-ctl').onclick = e => { const b = e.target.closest('[data-l]'); if (b) { previewLang = b.dataset.l; viewPreview(main, id); } };
  $('#bCopy').onclick = async () => {
    const txt = $('.sheet').innerText.replace(/\n{3,}/g, '\n\n');
    try { await navigator.clipboard.writeText(txt); toast(t('copied'), 'ok'); }
    catch { const sel = getSelection(); const rg = document.createRange(); rg.selectNodeContents($('.sheet')); sel.removeAllRanges(); sel.addRange(rg); }
  };
}

/* ---------- exports ---------- */
async function exportBackup() {
  const reps = await DB.all();
  const data = { app: 'eus-archive', version: 1, exportedAt: new Date().toISOString(), settings: Settings.load(), reports: reps };
  download(`eus-archive-backup-${today()}.json`, JSON.stringify(data), 'application/json');
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'eus-archive' || !Array.isArray(data.reports)) throw new Error('bad file');
    await DB.putMany(data.reports);
    if (data.settings) {
      const cur = Settings.load();
      const counter = Object.assign({}, data.settings.counter);
      Object.entries(cur.counter || {}).forEach(([y, n]) => { counter[y] = Math.max(n, counter[y] || 0); });
      Settings.save(Object.assign({}, data.settings, { counter, uiLang: cur.uiLang }));
    }
    toast(t('imported') + data.reports.length, 'ok');
    route();
  } catch { toast(t('importFail'), 'err'); }
}
async function exportCsv() {
  const reps = (await DB.all()).sort((a, b) => (a.procedure?.date || '').localeCompare(b.procedure?.date || ''));
  const fields = SCHEMA.flatMap(s => s.fields || []);
  const plain = (f, v) => {
    if (empty(v)) return '';
    if (f.t === 'select' || f.t === 'radio') return optText(f.o, v, 'en');
    if (f.t === 'checks') return v.map(c => optText(f.o, c, 'en')).join('; ');
    return String(v);
  };
  const head = ['Report no.', 'Status', ...fields.map(f => T[f.l][0]), 'Abnormal stations', 'Lesions', 'Rosemont', 'Images'];
  const rows = reps.map(r => [
    r.number, r.status, ...fields.map(f => plain(f, getPath(r, f.k))),
    Object.entries(r.stations || {}).filter(([, s]) => s.s === 'abnormal').map(([c, s]) => `${c}: ${s.n || ''}`).join(' | '),
    (r.lesions || []).map(l => [optText('organ', l.organ, 'en'), l.segment, optText('nature', l.nature, 'en'), l.sizeA && `${l.sizeA}x${l.sizeB || ''} mm`].filter(Boolean).join(' ')).join(' | '),
    optText('rosemontCat', rosemontClass(r.rosemont?.items), 'en'),
    (r.images || []).length,
  ]);
  const cell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = '﻿' + [head, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
  download(`eus-archive-${today()}.csv`, csv, 'text/csv;charset=utf-8');
}
