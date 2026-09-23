/* EUS Archive — printing: single report, procedure register, statistics, blank paper form */
'use strict';

function waitImages(root) {
  const imgs = root ? [...root.querySelectorAll('img')] : [];
  return Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))).then(() => new Promise(r => setTimeout(r, 60)));
}

/* Print the current page; the report number becomes the suggested PDF file name */
function printNow(name) {
  const old = document.title;
  const sheetNo = $('.sheet .s-no b')?.textContent;
  document.title = name || sheetNo || old;
  const restore = () => { document.title = old; window.removeEventListener('afterprint', restore); };
  window.addEventListener('afterprint', restore);
  window.print();
  setTimeout(restore, 1500);
}

/* Print arbitrary markup through the dedicated print area */
function printArea(html, name, landscape) {
  const area = $('#printArea');
  area.innerHTML = html;
  area.classList.toggle('landscape', !!landscape);
  document.body.classList.add('printing-area');
  const done = () => { document.body.classList.remove('printing-area'); area.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  // afterprint clears the area; route() also clears it if the browser never fires the event
  waitImages(area).then(() => printNow(name));
}

function printHeader(title) {
  const S = Settings.load();
  return `<header class="p-head">
    ${S.logo ? `<img src="${S.logo}" alt="">` : ''}
    <div class="p-hosp"><b>${esc(S.hospEn)}</b><b dir="rtl">${esc(S.hospAr)}</b><small>${esc(S.deptEn)} · <span dir="rtl">${esc(S.deptAr)}</span></small></div>
    <div class="p-title"><h2>${esc(title)}</h2><small>${esc(t('printedOn'))}: <span class="num">${esc(fmtDate(today()))}</span></small></div>
  </header>`;
}

/* Procedure register (log book) of the reports currently listed in the archive */
function printRegister(rows) {
  const L = App.lang;
  const head = ['#', t('colDate'), t('colReportNo'), t('colPatient'), t('colMrn'), t('colAge'), t('colProcedure'), t('colIndication'), t('colEndoscopist'), t('colImpression'), t('colStatus'), t('colPath')];
  const sep = L === 'ar' ? '، ' : ', ';
  const body = rows.map((r, i) => `<tr>
    <td class="num">${i + 1}</td>
    <td class="num nowrap">${esc(fmtDate(r.procedure?.date))}</td>
    <td class="num mono nowrap">${esc(r.number || '')}</td>
    <td>${esc(r.patient?.name || '')}</td>
    <td class="num mono">${esc(r.patient?.mrn || '')}</td>
    <td class="nowrap">${esc([r.patient?.age, r.patient?.sex && optText('sex', r.patient.sex, L)].filter(Boolean).join(' / '))}</td>
    <td>${esc((r.procedure?.types || []).map(c => optText('procTypes', c, L)).join(sep))}</td>
    <td>${esc((r.indication?.items || []).map(c => optText('indications', c, L)).join(sep))}</td>
    <td>${esc(r.procedure?.endoscopist || '')}</td>
    <td>${esc(r.impression?.dx || (r.impression?.text || '').split('\n')[0])}</td>
    <td>${esc(t(r.status === 'final' ? 'final' : 'draft'))}</td>
    <td>${esc(r.pathology?.status === 'received' ? optText('paCategory', r.pathology.category, L) : r.pathology?.status ? optText('paStatus', r.pathology.status, L) : '')}</td>
  </tr>`).join('');
  printArea(`<div class="p-doc" dir="${L === 'ar' ? 'rtl' : 'ltr'}">${printHeader(t('registerTitle'))}
    <table class="p-table"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>
    <p class="p-foot"><span class="num">${rows.length}</span> ${esc(t('reportsCount'))}</p></div>`, t('registerTitle') + ' ' + today(), true);
}

/* Blank bilingual paper form — for handwritten reports when no computer is available */
function printBlankForm() {
  const bl = key => { const p = T[key] || [key, key]; return `<span class="l-en">${esc(p[0])}</span><span class="l-ar" dir="rtl">${esc(p[1])}</span>`; };
  const boxes = list => `<div class="p-boxes">${OPT[list].map(o => {
    const en = list === 'rosemont' ? o[2] : o[1], ar = list === 'rosemont' ? o[3] : o[2];
    return `<span class="p-box">☐ ${esc(en)}${en !== ar ? ` <span dir="rtl">/ ${esc(ar)}</span>` : ''}</span>`;
  }).join('')}</div>`;
  const field = f => {
    if (f.t === 'checks' || f.t === 'radio' || f.t === 'select') return `<div class="p-f wide"><div class="p-l">${bl(f.l)}</div>${boxes(f.o)}</div>`;
    if (f.t === 'textarea') return `<div class="p-f wide"><div class="p-l">${bl(f.l)}</div><div class="p-lines" style="--n:${f.rows || 3}"></div></div>`;
    return `<div class="p-f"><div class="p-l">${bl(f.l)}</div><div class="p-line"></div></div>`;
  };
  const sec = (key, inner) => `<section class="p-sec"><h3>${bl(key)}</h3><div class="p-grid">${inner}</div></section>`;
  const secs = SCHEMA.map(s => {
    if (s.custom === 'stations') {
      const rows = STATIONS.flatMap(g => g.items).map(([, en, ar]) =>
        `<tr><td>${esc(en)} <span dir="rtl" class="p-ar">/ ${esc(ar)}</span></td><td class="c">☐</td><td class="c">☐</td><td class="c">☐</td><td></td></tr>`).join('');
      return `<section class="p-sec"><h3>${bl(s.l)}</h3><table class="p-table st"><thead><tr><th></th>${OPT.stationStatus.map(o => `<th class="c">${esc(o[1])}<br><span dir="rtl">${esc(o[2])}</span></th>`).join('')}<th>${bl('fdNote')}</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="p-grid">${s.fields.map(field).join('')}</div></section>`;
    }
    if (s.custom === 'lesions') return sec(s.l, LESION_FIELDS.map(field).join(''));
    if (s.custom === 'rosemont') return sec(s.l, `<div class="p-f wide">${boxes('rosemont')}</div>`);
    if (s.custom === 'images' || s.id === 'pathology' || s.id === 'sign') return '';
    return sec(s.l, (s.fields || []).map(field).join(''));
  }).join('');
  printArea(`<div class="p-doc p-blank" dir="ltr">${printHeader(`${T.blankTitle[0]} · ${T.blankTitle[1]}`)}
    <div class="p-no">${bl('rptNo')} <span class="p-line short"></span></div>${secs}
    <div class="p-sign"><div>${bl('rptSigned')}<div class="p-line"></div></div><div>${bl('sgDate')}<div class="p-line"></div></div></div></div>`, T.blankTitle[0]);
}
