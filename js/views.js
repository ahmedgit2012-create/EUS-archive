/* EUS Archive — statistics, settings, sample data, start-up */
'use strict';

/* ---------- statistics ---------- */
function viewStats(main) {
  const reps = App.all;
  const n = reps.length;
  const month = today().slice(0, 7);
  const pct = (a, b) => b ? Math.round((a / b) * 1000) / 10 : null;
  const tissue = reps.filter(r => any(r.procedure?.types, TISSUE_TYPES));
  const therapeutic = reps.filter(r => any(r.procedure?.types, THERAPY_TYPES));
  const aeKnown = reps.filter(r => (r.ae?.items || []).length);
  const aeCount = aeKnown.filter(aeReal).length;
  const roseDone = reps.filter(r => r.tissue?.rose && r.tissue.rose !== 'notDone');
  const roseAdequate = roseDone.filter(r => r.tissue.rose !== 'inadequate').length;
  const pathRx = reps.filter(r => r.pathology?.status === 'received' && r.pathology.category);
  const diag = pathRx.filter(r => !['nondiag', 'atypical'].includes(r.pathology.category)).length;
  const pending = reps.filter(r => r.pathology?.status === 'pending').length;

  const tile = (label, value, sub, state) => `<div class="tile">
    <span class="t-label">${esc(label)}</span>
    <span class="t-value num">${value == null ? '—' : esc(value)}</span>
    ${sub ? `<span class="t-sub">${state ? `<i class="dot ${state}" aria-hidden="true"></i>` : ''}${esc(sub)}</span>` : ''}</div>`;
  const aeP = pct(aeCount, aeKnown.length), yP = pct(diag, pathRx.length), rP = pct(roseAdequate, roseDone.length);
  const ok = App.lang === 'ar' ? 'ضمن الهدف' : 'Within target';
  const off = App.lang === 'ar' ? 'خارج الهدف' : 'Outside target';

  /* monthly series — last 12 months */
  const months = [];
  const d0 = new Date(); d0.setDate(1);
  for (let i = 11; i >= 0; i--) { const d = new Date(d0.getFullYear(), d0.getMonth() - i, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }
  const counts = months.map(m => reps.filter(r => (r.procedure?.date || '').startsWith(m)).length);
  const max = Math.max(1, ...counts);
  const mName = m => new Date(m + '-01T00:00').toLocaleDateString(App.lang === 'ar' ? 'ar' : 'en', { month: 'short' });

  const rank = (list, getter) => {
    const c = {};
    reps.forEach(r => [].concat(getter(r) || []).forEach(k => { if (k) c[k] = (c[k] || 0) + 1; }));
    const rows = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const top = rows[0]?.[1] || 1;
    return rows.length ? `<ol class="rank">${rows.map(([k, v]) => `<li><span class="r-name">${esc(list ? optText(list, k, App.lang) : k)}</span><span class="r-bar"><i style="width:${(v / top) * 100}%"></i></span><span class="r-val num">${v}</span></li>`).join('')}</ol>` : `<p class="muted">—</p>`;
  };

  main.innerHTML = `
  <div class="page-head"><div><h1>${esc(t('navStats'))}</h1><p class="muted">${esc(t('stNote'))}</p></div></div>
  <div class="tiles">
    ${tile(t('stTotal'), n)}
    ${tile(t('stMonth'), reps.filter(r => (r.procedure?.date || '').startsWith(month)).length)}
    ${tile(t('stTissue'), tissue.length, n ? `${pct(tissue.length, n)} %` : '')}
    ${tile(t('stTherapeutic'), therapeutic.length, n ? `${pct(therapeutic.length, n)} %` : '')}
    ${tile(t('stAE'), aeP == null ? null : aeP + ' %', aeP == null ? '' : `${aeCount} / ${aeKnown.length} · ${aeP < 2 ? ok : off}`, aeP == null ? '' : aeP < 2 ? 'good' : 'bad')}
    ${tile(t('stRose'), rP == null ? null : rP + ' %', rP == null ? '' : `${roseAdequate} / ${roseDone.length}`)}
    ${tile(t('stYield'), yP == null ? null : yP + ' %', yP == null ? '' : `${diag} / ${pathRx.length} · ${yP >= 70 ? ok : off}`, yP == null ? '' : yP >= 70 ? 'good' : 'bad')}
    ${tile(t('stPending'), pending, '', '')}
  </div>
  <div class="panels">
    <section class="panel wide"><h2>${esc(t('stByMonth'))}</h2>
      <div class="bars" role="img" aria-label="${esc(t('stByMonth'))}: ${months.map((m, i) => `${m} ${counts[i]}`).join(', ')}">
        <span class="bars-max num">${max}</span>
        ${months.map((m, i) => `<div class="bar-col" tabindex="0"><span class="bar-tip num">${counts[i]} · ${esc(m)}</span><i style="height:${(counts[i] / max) * 100}%"></i><small>${esc(mName(m))}</small></div>`).join('')}
      </div></section>
    <section class="panel"><h2>${esc(t('stByIndication'))}</h2>${rank('indications', r => r.indication?.items)}</section>
    <section class="panel"><h2>${esc(t('stByOperator'))}</h2>${rank(null, r => r.procedure?.endoscopist)}</section>
  </div>`;
}

/* ---------- settings ---------- */
function viewSettings(main) {
  const S = Settings.load();
  const fld = (k, key, type = 'text', span = 2) => `<label class="field span${span}" for="s_${k}"><span class="flabel">${esc(t(key))}</span>
    ${type === 'textarea' ? `<textarea id="s_${k}" data-s="${k}" rows="4">${esc(S[k] || '')}</textarea>` : `<input id="s_${k}" data-s="${k}" type="text" value="${esc(S[k] || '')}"${k.endsWith('Ar') ? ' dir="rtl"' : k.endsWith('En') ? ' dir="ltr"' : ''}>`}</label>`;
  main.innerHTML = `
  <div class="page-head"><div><h1>${esc(t('navSettings'))}</h1></div></div>
  <form id="sForm" class="form settings" novalidate>
    <section class="sec"><h2>${esc(t('setFacility'))}</h2><div class="grid">
      ${fld('hospEn', 'setHospEn')}${fld('hospAr', 'setHospAr')}${fld('deptEn', 'setDeptEn')}${fld('deptAr', 'setDeptAr')}
      ${fld('contact', 'setContact', 'text', 4)}
      <div class="field span2"><span class="flabel">${esc(t('setLogo'))}</span>
        <div class="logo-row">${S.logo ? `<img src="${S.logo}" alt="" class="logo-prev">` : ''}
          <label class="btn ghost sm" for="logoIn">${esc(t('chooseLogo'))}</label><input id="logoIn" type="file" accept="image/*" hidden>
          ${S.logo ? `<button type="button" class="btn sm ghost danger-text" id="logoRm">${esc(t('setLogoRemove'))}</button>` : ''}</div></div>
      <label class="field" for="s_prefix"><span class="flabel">${esc(t('setPrefix'))}</span><input id="s_prefix" data-s="prefix" class="mono" dir="ltr" value="${esc(S.prefix)}"></label>
      <label class="field" for="s_reportLang"><span class="flabel">${esc(t('setDefaultLang'))}</span><select id="s_reportLang" data-s="reportLang">
        ${[['bi', 'langBi'], ['ar', 'langAr'], ['en', 'langEn']].map(([k, key]) => `<option value="${k}"${S.reportLang === k ? ' selected' : ''}>${esc(t(key))}</option>`).join('')}</select></label>
      ${fld('footer', 'setFooter', 'text', 4)}
    </div></section>
    <section class="sec"><h2>${esc(t('setDefaults'))}</h2><div class="grid">
      ${fld('doctors', 'setDoctors', 'textarea', 2)}${fld('staff', 'setStaff', 'textarea', 2)}${fld('scopes', 'setScopes', 'textarea', 4)}
    </div></section>
    <div class="form-actions"><button class="btn primary" type="submit">${esc(t('setSave'))}</button></div>
    <section class="sec"><h2>${esc(t('setData'))}</h2>
      <p class="note">${esc(t('setDataNote'))}</p>
      <div class="btn-row">
        <button type="button" class="btn ghost" id="bBk">${esc(t('exportJson'))}</button>
        <label class="btn ghost" for="restoreIn">${esc(t('importJson'))}</label><input id="restoreIn" type="file" accept=".json,application/json" hidden>
        <button type="button" class="btn ghost" id="bCsv">${esc(t('exportCsv'))}</button>
        <button type="button" class="btn ghost" id="bSamples">${esc(t('loadSamples'))}</button>
      </div></section>
  </form>`;
  $('#sForm').onsubmit = e => {
    e.preventDefault();
    const patch = {};
    $$('[data-s]').forEach(el => { patch[el.dataset.s] = el.value.trim(); });
    Settings.save(patch);
    toast(t('saved'), 'ok');
  };
  $('#logoIn').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    Settings.save({ logo: await resizeImage(f, 400, 'image/png') });
    viewSettings(main);
  };
  const rm = $('#logoRm'); if (rm) rm.onclick = () => { Settings.save({ logo: '' }); viewSettings(main); };
  $('#bBk').onclick = exportBackup;
  $('#bCsv').onclick = exportCsv;
  $('#restoreIn').onchange = e => { if (e.target.files[0]) importBackup(e.target.files[0]); };
  $('#bSamples').onclick = async () => { await DB.putMany(sampleReports()); toast(t('samplesLoaded'), 'ok'); go('#archive'); };
}

/* ---------- sample cases (clearly flagged) ---------- */
function sampleReports() {
  const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
  const base = (o) => Object.assign(newReport(), { sample: true, status: 'final' }, o);
  const y = today().slice(0, 4);
  return [
    base({
      number: `SAMPLE-${y}-01`,
      patient: { name: 'Sample Patient A — مريض نموذجي أ', mrn: '100245', age: '64', sex: 'M', visit: 'out', refDr: 'Dr. Surgeon', refDept: 'Hepatobiliary Surgery', weight: '72' },
      procedure: { date: d(2), start: '09:10', end: '09:48', priority: 'elective', endoscopist: 'Dr. Endoscopist', nurse: 'Nurse Sara', scopeType: 'linear', scope: 'GF-UCT180 / 2310456', route: 'upper', types: ['diag', 'fnb'], extent: 'd2', quality: 'complete' },
      indication: { items: ['panMass', 'dilCbd', 'stPan'], history: 'Painless obstructive jaundice for 3 weeks, weight loss 6 kg. CT: 3 cm hypodense mass in pancreatic head with double-duct sign.', imaging: 'CT abdomen (pancreas protocol): head mass, CBD 13 mm, MPD 5 mm, no liver metastases.', ca199: '842', bili: '9.4' },
      prep: { asa: '2', consent: 'yes', fasting: 'yes', timeout: 'yes', co2: 'yes', anticoag: ['none'], inr: '1.1', plt: '245', abx: 'no', sedation: 'deep', agents: 'Propofol 220 mg total (anesthesia-administered)', position: 'left' },
      findings: { cbd: '13', cbdContent: 'clear', mpd: '5.2', pancTexture: 'normal', gbContent: 'normal' },
      stations: { stomach: { s: 'normal' }, panNeck: { s: 'normal' }, panBody: { s: 'normal' }, panTail: { s: 'normal' }, mpd: { s: 'abnormal', n: 'Dilated 5.2 mm upstream of head mass, abrupt cut-off.' }, leftAdrenal: { s: 'normal' }, liverLeft: { s: 'normal' }, celiac: { s: 'normal' }, duodenum: { s: 'normal' }, panHead: { s: 'abnormal', n: 'Hypoechoic irregular mass (see lesion 1).' }, panUncinate: { s: 'normal' }, ampulla: { s: 'normal' }, cbd: { s: 'abnormal', n: 'Dilated 13 mm down to the mass, distal stricture.' }, gallbladder: { s: 'normal' }, liverRight: { s: 'normal' }, portal: { s: 'normal' }, smaSmv: { s: 'abnormal', n: 'SMV abutment < 180°, SMA fat plane preserved.' }, splenicVessels: { s: 'normal' }, abdLN: { s: 'normal' }, ascites: { s: 'normal' } },
      lesions: [{ organ: 'pancreas', segment: 'Head', nature: 'solid', sizeA: '31', sizeB: '27', echo: 'hypo', margin: 'irregular', shape: 'irregular', features: ['upstreamMpd', 'doubleDuct', 'cutoffMpd'], vessels: ['smv'], vesselType: 'abut', doppler: 'peripheral', elasto: 'hard', strain: '24.5', contrast: 'hypo' }],
      staging: { organ: 'pancreas', t: 'T2', n: 'N0', m: 'Mx', resect: 'borderline', note: 'SMV abutment < 180° without contour deformity.' },
      tissue: { target: 'Pancreatic head mass', technique: 'fnb', route: 'td', needle: 'franseen', gauge: '22', brand: 'Acquire', passes: '3', suction: 'slowPull', fanning: 'yes', rose: 'malignant', mose: 'ge4', specimens: ['core', 'cellBlock', 'smears'] },
      ae: { items: ['none'], disposition: 'discharged' },
      impression: { text: '1. Pancreas — Head: solid hypoechoic mass 31 × 27 mm with irregular margins, double-duct sign and upstream MPD dilation (5.2 mm).\n2. Abutment of the SMV (< 180°); SMA and celiac axis free. No suspicious nodes, no ascites.\n3. EUS stage uT2 N0 Mx — borderline resectable.\n4. EUS-FNB 22G Franseen, 3 passes transduodenal; ROSE positive for malignant cells.\n5. No immediate adverse events.', dx: 'Pancreatic head adenocarcinoma (suspected)', recs: ['awaitPath', 'mdt', 'ercp', 'oncology'], recsOther: 'ERCP with metal stent for biliary drainage before neoadjuvant therapy.' },
      pathology: { status: 'received', date: d(0), no: 'P-26-4471', category: 'malignant', result: 'Adenocarcinoma, moderately differentiated. CK7+, CK20-.', correlation: 'concordant' },
      sign: { name: 'Dr. Endoscopist', title: 'Consultant Gastroenterologist', date: d(2) },
    }),
    base({
      number: `SAMPLE-${y}-02`,
      patient: { name: 'Sample Patient B — مريضة نموذجية ب', mrn: '100311', age: '58', sex: 'F', visit: 'out', refDr: 'Dr. Internist', refDept: 'Internal Medicine' },
      procedure: { date: d(9), start: '11:00', end: '11:25', priority: 'elective', endoscopist: 'Dr. Endoscopist', scopeType: 'linear', route: 'upper', types: ['diag', 'fna', 'cystAsp'], extent: 'd2', quality: 'complete' },
      indication: { items: ['panCyst'], history: 'Incidental 25 mm cyst in pancreatic body on MRI done for back pain.', imaging: 'MRCP: 25 mm multilocular cyst, body; possible communication with MPD.' },
      prep: { asa: '2', consent: 'yes', fasting: 'yes', timeout: 'yes', anticoag: ['aspirin'], anticoagPlan: 'continued', abx: 'yes', abxName: 'Ciprofloxacin 400 mg IV', sedation: 'deep', agents: 'Propofol 180 mg' },
      findings: { cbd: '5', cbdContent: 'clear', mpd: '3.8', pancTexture: 'normal' },
      stations: { panBody: { s: 'abnormal', n: 'Multilocular cyst (see lesion 1).' }, panTail: { s: 'normal' }, panHead: { s: 'normal' }, mpd: { s: 'abnormal', n: '3.8 mm, communicates with cyst.' }, cbd: { s: 'normal' }, gallbladder: { s: 'normal' }, liverLeft: { s: 'normal' }, abdLN: { s: 'normal' } },
      lesions: [{ organ: 'pancreas', segment: 'Body', nature: 'cystic', sizeA: '26', sizeB: '19', echo: 'anechoic', margin: 'regular', shape: 'lobulated', features: ['septations', 'mpdComm', 'muralNodule'], vessels: ['none'], contrast: 'hyper', note: 'Mural nodule 4 mm, enhancing on contrast.' }],
      tissue: { target: 'Pancreatic body cyst', technique: 'aspiration', route: 'tg', needle: 'standard', gauge: '22', passes: '1', rose: 'notDone', specimens: ['fluidCyto', 'fluidChem', 'molecular'], fluidLook: 'mucoid', string: 'yes', fluidCea: '412', fluidGlu: '18', fluidAmy: '9800' },
      ae: { items: ['none'], disposition: 'discharged' },
      impression: { text: '1. Pancreas — Body: multilocular cystic lesion 26 × 19 mm with septations, communication with the MPD and a 4 mm enhancing mural nodule.\n2. MPD 3.8 mm.\n3. Cyst aspiration: viscous mucoid fluid, positive string sign; CEA 412 ng/mL, glucose 18 mg/dL.\nFindings favour a branch-duct IPMN with worrisome features.', dx: 'Branch-duct IPMN with worrisome features', recs: ['awaitPath', 'mdt', 'surgery'], follow: '3m' },
      pathology: { status: 'pending', no: 'C-26-0932' },
      sign: { name: 'Dr. Endoscopist', date: d(9) },
    }),
    base({
      number: `SAMPLE-${y}-03`,
      status: 'draft',
      patient: { name: 'Sample Patient C — مريض نموذجي ج', mrn: '100407', age: '41', sex: 'F', visit: 'in', ward: 'Ward 4 / Bed 12', refDr: 'Dr. Surgeon', refDept: 'General Surgery' },
      procedure: { date: d(20), start: '13:30', end: '13:45', priority: 'urgent', endoscopist: 'Dr. Endoscopist', scopeType: 'radial', route: 'upper', types: ['diag'], extent: 'd2', quality: 'complete' },
      indication: { items: ['cbdStone', 'idioAP'], history: 'Recurrent biliary-type pain, ALP and bilirubin rising. US: gallstones, CBD 7 mm.', bili: '2.6', alp: '310', lipase: '95' },
      prep: { asa: '1', consent: 'yes', fasting: 'yes', timeout: 'yes', anticoag: ['none'], abx: 'no', sedation: 'moderate', agents: 'Midazolam 3 mg, fentanyl 50 mcg' },
      findings: { cbd: '8', cbdContent: 'stones', mpd: '2', pancTexture: 'normal', gbContent: 'stones' },
      stations: { cbd: { s: 'abnormal', n: 'Two echogenic stones 5 mm with acoustic shadowing in distal CBD.' }, gallbladder: { s: 'abnormal', n: 'Multiple small gallstones and sludge.' }, panHead: { s: 'normal' }, panUncinate: { s: 'normal' }, panBody: { s: 'normal' }, panTail: { s: 'normal' }, mpd: { s: 'normal' }, ampulla: { s: 'normal' }, liverRight: { s: 'normal' } },
      lesions: [{ organ: 'bileDuct', segment: 'Distal CBD', nature: 'stone', sizeA: '5', sizeB: '5', echo: 'hyper', note: 'Two stones with posterior acoustic shadowing.' }],
      ae: { items: ['none'], disposition: 'ward' },
      impression: { text: '1. Choledocholithiasis: two 5 mm stones in the distal CBD (CBD 8 mm).\n2. Cholelithiasis with sludge.\n3. Normal pancreas.', dx: 'Choledocholithiasis', recs: ['ercp', 'surgery'], recsOther: 'ERCP with stone extraction in the same session; laparoscopic cholecystectomy during this admission.' },
      pathology: { status: 'na' },
      sign: { name: 'Dr. Endoscopist', date: d(20) },
    }),
  ].map((r, i) => Object.assign(r, { id: 'sample-' + (i + 1), updatedAt: Date.now() - i }));
}

/* ---------- start-up ---------- */
function boot() {
  App.lang = Settings.load().uiLang || 'ar';
  applyLang();
  $('#langBtn').onclick = () => setLang(App.lang === 'ar' ? 'en' : 'ar');
  window.addEventListener('hashchange', onHash);
  window.addEventListener('beforeunload', e => { if (App.dirty) { e.preventDefault(); e.returnValue = ''; } });
  if (!('indexedDB' in window)) { $('#main').innerHTML = '<p class="empty">IndexedDB is not available in this browser.</p>'; return; }
  route();
}
document.addEventListener('DOMContentLoaded', boot);
