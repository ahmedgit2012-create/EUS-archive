/* EUS Archive — 3D icon set.
 * Each icon is built from "body" shapes rendered three times: a dark extrusion offset down-right,
 * a gradient face, and a glossy highlight. "detail" shapes sit on top. One SVG sprite is injected
 * at start-up and icons are placed with ico(name).
 */
'use strict';

const ICON_COLORS = {
  teal: ['#4cc7cf', '#0c6b75', '#06434a'],
  blue: ['#74b0f4', '#1f5fae', '#133f75'],
  amber: ['#ffcd6b', '#d9820f', '#8f5307'],
  red: ['#ff8f80', '#c9352a', '#82201a'],
  green: ['#78e09c', '#238a4a', '#145a2f'],
  violet: ['#bea5f7', '#6746c4', '#422b86'],
  slate: ['#a9bdc3', '#4b636b', '#2d3e44'],
};

function gearPath(cx, cy, R, r, hole, teeth) {
  const pts = [];
  const step = Math.PI * 2 / (teeth * 4);
  for (let i = 0; i < teeth * 4; i++) {
    const rad = (i % 4 === 0 || i % 4 === 1) ? R : r;
    const a = i * step - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `<path d="M${pts.join('L')}Z M${cx + hole} ${cy}a${hole} ${hole} 0 1 0 ${-2 * hole} 0a${hole} ${hole} 0 1 0 ${2 * hole} 0Z"/>`;
}
function hexPath(cx, cy, r) {
  const p = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; p.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`); }
  return `<path d="M${p.join('L')}Z"/>`;
}
const W = 'fill="#fff"';
const docBody = '<path d="M5 2.5h9l5.5 5.5v12.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-16.5A1.5 1.5 0 0 1 5 2.5Z"/>';
const docFold = '<path d="M14 2.5V8h5.5Z" fill="#fff" fill-opacity=".5"/>';
const clipBody = '<rect x="4" y="4" width="15" height="17.5" rx="2"/>';
const clipTop = '<rect x="8" y="2.2" width="7" height="4" rx="1.3" fill="#e9eff1"/>';
const cloudBody = '<path d="M6.5 19.5A4.5 4.5 0 0 1 5.8 10.6 6 6 0 0 1 17.3 9a4.5 4.5 0 0 1 .2 10.5Z"/>';

/* name: [color, body, details, evenodd?] */
const ICONS = {
  fan: ['teal', '<path d="M11.5 2.5 2 18.8a18 18 0 0 0 19 0Z"/>',
    '<path d="M5.6 15.9a12 12 0 0 0 11.8 0M8 11.8a7.5 7.5 0 0 0 7 0" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.2"/><circle cx="13.2" cy="14.3" r="1.7" fill="#ffcf73"/>'],
  archive: ['teal', '<rect x="2.5" y="3.5" width="18" height="5.5" rx="1.6"/><rect x="3.8" y="9.8" width="15.4" height="10.7" rx="1.6"/>',
    `<rect x="9" y="12.4" width="5" height="1.9" rx=".95" ${W} fill-opacity=".95"/>`],
  newdoc: ['teal', docBody, docFold + `<path d="M10.7 10.5h1.8v2.7h2.7V15h-2.7v2.7h-1.8V15H8v-1.8h2.7Z" ${W}/>`],
  doc: ['teal', docBody, docFold + `<rect x="6.5" y="11" width="9" height="1.5" rx=".75" ${W}/><rect x="6.5" y="14.3" width="9" height="1.5" rx=".75" ${W}/><rect x="6.5" y="17.6" width="5.5" height="1.5" rx=".75" ${W}/>`],
  stats: ['blue', '<rect x="2.5" y="12" width="5" height="8.5" rx="1.3"/><rect x="9.2" y="7" width="5" height="13.5" rx="1.3"/><rect x="15.9" y="3" width="5" height="17.5" rx="1.3"/>', ''],
  gear: ['slate', gearPath(11.5, 11.5, 10, 7.6, 3.2, 8), '', true],
  globe: ['blue', '<circle cx="11.5" cy="11.5" r="9"/>',
    '<ellipse cx="11.5" cy="11.5" rx="3.8" ry="9" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.1"/><path d="M2.5 11.5h18M4 7h15M4 16h15" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.1"/>'],
  printer: ['slate', '<rect x="6" y="2.5" width="11" height="5" rx="1"/><rect x="2" y="7" width="19" height="9.5" rx="2.2"/><rect x="6" y="13" width="11" height="8" rx="1"/>',
    `<rect x="6" y="13" width="11" height="8" rx="1" fill="#f4f7f8"/><rect x="8" y="15.3" width="7" height="1.2" rx=".6" fill="#8aa0a6"/><rect x="8" y="17.8" width="4.8" height="1.2" rx=".6" fill="#8aa0a6"/><circle cx="17.8" cy="10.2" r="1.05" fill="#7dffb0"/>`],
  pencil: ['amber', '<path d="M15.8 3.2a1.6 1.6 0 0 1 2.3 0l1.7 1.7a1.6 1.6 0 0 1 0 2.3L8.6 18.4 3 20l1.6-5.6Z"/>',
    '<path d="M3 20l1.6-5.6 4 4Z" fill="#f6dfb2"/><path d="M3 20l.8-2.8 2 2Z" fill="#3b3b3b"/><path d="M14.3 4.7l4 4" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>'],
  copy2: ['violet', '<rect x="7.5" y="2.5" width="13" height="14.5" rx="2.2"/><rect x="2.5" y="7" width="13" height="14.5" rx="2.2"/>',
    '<rect x="2.5" y="7" width="13" height="14.5" rx="2.2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1"/>'],
  trash: ['red', '<rect x="3.5" y="4.3" width="16" height="3.2" rx="1.3"/><rect x="9" y="2.2" width="5" height="3" rx="1.1"/><path d="M5.3 8.5h12.4l-1.1 11.6a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4Z"/>',
    `<rect x="8.8" y="11" width="1.4" height="7.5" rx=".7" ${W} fill-opacity=".65"/><rect x="12.8" y="11" width="1.4" height="7.5" rx=".7" ${W} fill-opacity=".65"/>`],
  eye: ['teal', '<path d="M1.5 11.5C4 6.5 7.5 4.5 11.5 4.5s7.5 2 10 7c-2.5 5-6 7-10 7s-7.5-2-10-7Z"/>',
    '<circle cx="11.5" cy="11.5" r="4.2" fill="#fff"/><circle cx="11.5" cy="11.5" r="2.3" fill="#0b3b44"/><circle cx="10.6" cy="10.6" r=".85" fill="#fff"/>'],
  arrow: ['slate', '<path d="M10.5 3.5 2.5 11.5l8 8v-4.8h10.5v-6.4H10.5Z"/>', ''],
  save: ['blue', '<path d="M4.5 2.5h12L20.5 6.5v13.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V4a1.5 1.5 0 0 1 1.5-1.5Z"/>',
    `<rect x="7" y="2.5" width="8.5" height="5.5" rx=".8" ${W} fill-opacity=".85"/><rect x="12.3" y="3.6" width="1.8" height="3.2" rx=".4" fill="#1f5fae"/><rect x="6" y="12.3" width="11.5" height="7.5" rx="1" ${W} fill-opacity=".92"/>`],
  shield: ['green', '<path d="M11.5 1.8 20 5v6.5c0 5-3.6 8.7-8.5 10.6C6.6 20.2 3 16.5 3 11.5V5Z"/>',
    '<path d="M7.4 11.8l2.9 2.9 5.4-5.6" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>'],
  check: ['green', '<circle cx="11.5" cy="11.5" r="9"/>',
    '<path d="M7.2 11.8l3 3 5.8-6" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>'],
  close: ['red', '<circle cx="11.5" cy="11.5" r="9"/>',
    '<path d="M8.3 8.3l6.4 6.4M14.7 8.3l-6.4 6.4" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/>'],
  plus: ['green', '<circle cx="11.5" cy="11.5" r="9"/>',
    `<path d="M10.5 6.5h2v4h4v2h-4v4h-2v-4h-4v-2h4Z" ${W}/>`],
  clipboard: ['violet', clipBody, clipTop + `<rect x="7" y="10" width="9" height="1.5" rx=".75" ${W}/><rect x="7" y="13.4" width="9" height="1.5" rx=".75" ${W}/><rect x="7" y="16.8" width="6" height="1.5" rx=".75" ${W}/>`],
  list: ['amber', clipBody, clipTop + `<circle cx="7.6" cy="10.8" r="1" ${W}/><rect x="9.5" y="10" width="7" height="1.5" rx=".75" ${W}/><circle cx="7.6" cy="14.2" r="1" ${W}/><rect x="9.5" y="13.4" width="7" height="1.5" rx=".75" ${W}/><circle cx="7.6" cy="17.6" r="1" ${W}/><rect x="9.5" y="16.8" width="5" height="1.5" rx=".75" ${W}/>`],
  image: ['blue', '<rect x="2" y="4" width="19" height="15.5" rx="2.2"/>',
    '<path d="M4.3 17.3l4.7-5.8 3.6 4.2 2.6-2.6 3.8 4.2Z" fill="#fff" fill-opacity=".92"/><circle cx="15.8" cy="8.6" r="1.9" fill="#ffe08a"/>'],
  person: ['teal', '<circle cx="11.5" cy="7.2" r="4.7"/><path d="M2.8 20.3c0-4.8 3.9-7.6 8.7-7.6s8.7 2.8 8.7 7.6a1.2 1.2 0 0 1-1.2 1.2H4a1.2 1.2 0 0 1-1.2-1.2Z"/>', ''],
  calendar: ['blue', '<rect x="2.5" y="4.5" width="18" height="16.5" rx="2.4"/>',
    '<path d="M2.5 9.3V6.9a2.4 2.4 0 0 1 2.4-2.4h13.2a2.4 2.4 0 0 1 2.4 2.4v2.4Z" fill="#0e3f78" fill-opacity=".35"/><rect x="6.3" y="2.3" width="2" height="4.6" rx="1" fill="#e9eff1"/><rect x="14.7" y="2.3" width="2" height="4.6" rx="1" fill="#e9eff1"/>' +
    `<rect x="6" y="12" width="2.6" height="2.4" rx=".5" ${W}/><rect x="10.2" y="12" width="2.6" height="2.4" rx=".5" ${W}/><rect x="14.4" y="12" width="2.6" height="2.4" rx=".5" ${W}/><rect x="6" y="16" width="2.6" height="2.4" rx=".5" ${W}/><rect x="10.2" y="16" width="2.6" height="2.4" rx=".5" fill="#ffcf73"/>`],
  capsule: ['green', '<rect x="1.8" y="8" width="19.4" height="8" rx="4" transform="rotate(-40 11.5 12)"/>',
    '<path d="M11.5 8h5.7a4 4 0 0 1 0 8h-5.7Z" fill="#fff" fill-opacity=".88" transform="rotate(-40 11.5 12)"/>'],
  target: ['amber', '<circle cx="11.5" cy="11.5" r="9"/>',
    '<circle cx="11.5" cy="11.5" r="6" fill="#fff" fill-opacity=".9"/><circle cx="11.5" cy="11.5" r="3.3" fill="#c46f0b"/><circle cx="10.6" cy="10.6" r=".9" fill="#fff" fill-opacity=".7"/>'],
  hexes: ['violet', hexPath(7.5, 7.5, 4.6) + hexPath(15.5, 7.5, 4.6) + hexPath(11.5, 14.5, 4.6), ''],
  layers: ['blue', '<path d="M11.5 2.5 21 7.5l-9.5 5-9.5-5Z"/><path d="M4.2 10.6l7.3 3.9 7.3-3.9L21 11.8l-9.5 5-9.5-5Z"/><path d="M4.2 14.9l7.3 3.9 7.3-3.9L21 16.1l-9.5 5-9.5-5Z"/>', ''],
  needle: ['teal', '<path d="M14.9 2.8l5.3 5.3-1.8 1.8-.9-.9-7.3 7.3-3.5-3.5 7.3-7.3-.9-.9Z"/>',
    '<path d="M6.9 13.9l2.2 2.2-5.8 5.8-.9-.1-.1-.9Z" fill="#b8c6ca"/><path d="M11 9.6l2.4 2.4" stroke="#fff" stroke-opacity=".7" stroke-width="1.1"/>'],
  stent: ['violet', '<rect x="1.5" y="6.5" width="3.5" height="10" rx="1.7"/><rect x="18" y="6.5" width="3.5" height="10" rx="1.7"/><rect x="3.5" y="8.5" width="16" height="6" rx="2"/>',
    '<path d="M6.5 8.5l3 6M9.5 8.5l-3 6M11.5 8.5l3 6M14.5 8.5l-3 6M16.5 8.5l2 4M18.5 8.5l-2 4" stroke="#fff" stroke-opacity=".75" stroke-width="1" fill="none"/>'],
  warning: ['amber', '<path d="M10.2 3.2a1.5 1.5 0 0 1 2.6 0l8.6 15.3a1.5 1.5 0 0 1-1.3 2.2H2.9a1.5 1.5 0 0 1-1.3-2.2Z"/>',
    `<rect x="10.6" y="8.3" width="1.8" height="6.4" rx=".9" ${W}/><circle cx="11.5" cy="17.2" r="1.15" ${W}/>`],
  flask: ['violet', '<path d="M8.8 2h5.4v2h-.9v5.1l6.1 9.4a1.9 1.9 0 0 1-1.6 2.9H5.2a1.9 1.9 0 0 1-1.6-2.9l6.1-9.4V4h-.9Z"/>',
    '<path d="M6.4 15.8h10.2l1.6 2.6a.8.8 0 0 1-.7 1.2H5.5a.8.8 0 0 1-.7-1.2Z" fill="#fff" fill-opacity=".62"/><circle cx="10" cy="17.4" r=".8" fill="#6746c4"/><circle cx="13.2" cy="16.9" r=".6" fill="#6746c4"/>'],
  pen: ['slate', '<path d="M11.5 1.8 17.2 9l-3.1 9.7H8.9L5.8 9Z"/><rect x="7.5" y="19.2" width="8" height="2.8" rx="1"/>',
    `<circle cx="11.5" cy="10.5" r="1.6" ${W}/><rect x="11" y="3.5" width="1" height="5.5" ${W} fill-opacity=".8"/>`],
  hourglass: ['blue', '<path d="M5 2h13v2.2h-1c0 3.6-2.6 5.6-4.1 7.3 1.5 1.7 4.1 3.7 4.1 7.3h1V21H5v-2.2h1c0-3.6 2.6-5.6 4.1-7.3C8.6 9.8 6 7.8 6 4.2H5Z"/>',
    '<path d="M8.5 18.6c.6-2 2-3 3-3.6 1 .6 2.4 1.6 3 3.6Z" fill="#ffd27a"/><path d="M9.3 6.5h4.4c-.5 1.3-1.4 2.2-2.2 2.9-.8-.7-1.7-1.6-2.2-2.9Z" fill="#ffd27a"/>'],
  stack: ['teal', '<rect x="2.5" y="14.2" width="18" height="6.3" rx="1.8"/><rect x="2.5" y="8.6" width="18" height="6.3" rx="1.8"/><rect x="2.5" y="3" width="18" height="6.3" rx="1.8"/>',
    `<rect x="8.5" y="5.4" width="6" height="1.5" rx=".75" ${W}/><rect x="8.5" y="11" width="6" height="1.5" rx=".75" ${W}/><rect x="8.5" y="16.6" width="6" height="1.5" rx=".75" ${W}/>`],
  cloudDown: ['blue', cloudBody, '<path d="M11.5 9.5v7M8.7 13.8l2.8 2.8 2.8-2.8" stroke="#fff" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'],
  cloudUp: ['teal', cloudBody, '<path d="M11.5 17v-7M8.7 12.7l2.8-2.8 2.8 2.8" stroke="#fff" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'],
  sheet: ['green', '<rect x="2.5" y="2.5" width="18" height="18.5" rx="2.2"/>',
    `<rect x="2.5" y="7.8" width="18" height="1.3" ${W} fill-opacity=".8"/><rect x="2.5" y="12.6" width="18" height="1.3" ${W} fill-opacity=".8"/><rect x="2.5" y="17.2" width="18" height="1.3" ${W} fill-opacity=".8"/><rect x="8.6" y="2.5" width="1.3" height="18.5" ${W} fill-opacity=".8"/>`],
  star: ['amber', '<path d="M11.5 1.8l2.8 6.1 6.6.7-5 4.5 1.4 6.5-5.8-3.4-5.8 3.4 1.4-6.5-5-4.5 6.6-.7Z"/>', ''],
  hospital: ['red', '<path d="M2.8 21.5V7.2L11.5 2.8l8.7 4.4v14.3Z"/>',
    `<path d="M10.4 7h2.2v2.3h2.3v2.2h-2.3v2.3h-2.2v-2.3H8.1V9.3h2.3Z" ${W}/><rect x="9.4" y="16.2" width="4.2" height="5.3" rx=".5" ${W} fill-opacity=".88"/>`],
  search: ['slate', '<circle cx="10" cy="10" r="7.5"/><rect x="15" y="14.4" width="3.6" height="8.2" rx="1.6" transform="rotate(-45 16.8 18.5)"/>',
    '<circle cx="10" cy="10" r="4.9" fill="#e3f6f8"/><path d="M7.4 8.6a3 3 0 0 1 2.4-1.7" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>'],
};

function iconSprite() {
  const grads = Object.entries(ICON_COLORS).map(([k, [hi, lo]]) =>
    `<linearGradient id="ig-${k}" x1="0" y1="0" x2=".55" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient>`).join('');
  const syms = Object.entries(ICONS).map(([name, [c, body, detail, eo]]) => {
    const fr = eo ? ' fill-rule="evenodd"' : '';
    return `<symbol id="i-${name}" viewBox="0 0 24 24">
      <g fill="${ICON_COLORS[c][2]}" transform="translate(.8 1.2)"${fr}>${body}</g>
      <g fill="url(#ig-${c})"${fr}>${body}</g>
      <g fill="url(#ig-hl)"${fr}>${body}</g>${detail}</symbol>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>${grads}
    <linearGradient id="ig-hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".48" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>${syms}</svg>`;
}
function ico(name, cls = '') {
  return `<svg class="i3d ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
}
function installIcons() {
  document.body.insertAdjacentHTML('afterbegin', iconSprite());
  $$('[data-ico]').forEach(el => el.insertAdjacentHTML('afterbegin', ico(el.dataset.ico, el.dataset.icoCls || '')));
}

/* Icon for each report section */
const SECTION_ICONS = {
  patient: 'person', procedure: 'calendar', indication: 'clipboard', prep: 'capsule', findings: 'fan', lesions: 'target', rosemont: 'hexes',
  staging: 'layers', tissue: 'needle', therapy: 'stent', ae: 'warning', impression: 'doc', images: 'image', pathology: 'flask', sign: 'pen',
};
