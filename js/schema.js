/* EUS Archive — report schema.
 * One schema drives the entry form, the printed report and the CSV export.
 * Field: { k: path, l: label key, t: type, o: option list, span, req, show(r), unit }
 */
'use strict';

const has = (arr, v) => Array.isArray(arr) && arr.includes(v);
const any = (arr, vs) => Array.isArray(arr) && vs.some(v => arr.includes(v));
const TISSUE_TYPES = ['fna', 'fnb', 'cystAsp', 'liverBx'];
const THERAPY_TYPES = ['pfcDrain', 'necro', 'bd', 'gbd', 'pdd', 'ge', 'rv', 'cpn', 'vasc', 'fid', 'ablation'];

const SCHEMA = [
  { id: 'patient', l: 'secPatient', fields: [
    { k: 'patient.name', l: 'pName', t: 'text', span: 2, req: true },
    { k: 'patient.mrn', l: 'pMrn', t: 'text', req: true, mono: true },
    { k: 'patient.nid', l: 'pNid', t: 'text', mono: true },
    { k: 'patient.dob', l: 'pDob', t: 'date' },
    { k: 'patient.age', l: 'pAge', t: 'number', unit: 'years' },
    { k: 'patient.sex', l: 'pSex', t: 'radio', o: 'sex', req: true },
    { k: 'patient.phone', l: 'pPhone', t: 'tel', mono: true },
    { k: 'patient.visit', l: 'pVisit', t: 'radio', o: 'visit', span: 2 },
    { k: 'patient.ward', l: 'pWard', t: 'text', show: r => ['in', 'icu', 'er'].includes(r.patient?.visit) },
    { k: 'patient.weight', l: 'pWeight', t: 'number' },
    { k: 'patient.refDr', l: 'pRefDr', t: 'text' },
    { k: 'patient.refDept', l: 'pRefDept', t: 'text' },
    { k: 'patient.allergy', l: 'pAllergy', t: 'text', span: 2 },
  ]},
  { id: 'procedure', l: 'secProcedure', fields: [
    { k: 'procedure.date', l: 'prDate', t: 'date', req: true },
    { k: 'procedure.start', l: 'prStart', t: 'time' },
    { k: 'procedure.end', l: 'prEnd', t: 'time' },
    { k: 'procedure.priority', l: 'prPriority', t: 'radio', o: 'priority' },
    { k: 'procedure.endoscopist', l: 'prEndoscopist', t: 'text', dl: 'doctors', req: true },
    { k: 'procedure.assistant', l: 'prAssistant', t: 'text', dl: 'people' },
    { k: 'procedure.nurse', l: 'prNurse', t: 'text', dl: 'staff' },
    { k: 'procedure.anesthetist', l: 'prAnesthetist', t: 'text', dl: 'staff' },
    { k: 'procedure.scopeType', l: 'prScopeType', t: 'radio', o: 'scopeType', span: 2 },
    { k: 'procedure.scope', l: 'prScope', t: 'text', dl: 'scopes', span: 2 },
    { k: 'procedure.route', l: 'prRoute', t: 'radio', o: 'route', span: 4 },
    { k: 'procedure.types', l: 'prTypes', t: 'checks', o: 'procTypes', span: 4, req: true },
    { k: 'procedure.extent', l: 'prExtent', t: 'select', o: 'extent' },
    { k: 'procedure.quality', l: 'prQuality', t: 'radio', o: 'quality', span: 3 },
    { k: 'procedure.limits', l: 'prLimit', t: 'checks', o: 'limits', span: 4, show: r => ['partial', 'incomplete'].includes(r.procedure?.quality) },
  ]},
  { id: 'indication', l: 'secIndication', fields: [
    { k: 'indication.items', l: 'inItems', t: 'checks', o: 'indications', span: 4, req: true },
    { k: 'indication.other', l: 'inOther', t: 'text', span: 4 },
    { k: 'indication.history', l: 'inHistory', t: 'textarea', span: 4 },
    { k: 'indication.imaging', l: 'inImaging', t: 'textarea', span: 4 },
    { k: 'indication.ca199', l: 'labCa199', t: 'number' },
    { k: 'indication.cea', l: 'labCea', t: 'number' },
    { k: 'indication.bili', l: 'labBili', t: 'number' },
    { k: 'indication.alp', l: 'labAlp', t: 'number' },
    { k: 'indication.lipase', l: 'labLipase', t: 'number' },
    { k: 'indication.labOther', l: 'labOther', t: 'text', span: 3 },
  ]},
  { id: 'findings', l: 'secFindings', custom: 'stations', fields: [
    { k: 'findings.cbd', l: 'fdCbd', t: 'number', step: '0.1' },
    { k: 'findings.cbdContent', l: 'fdCbdContent', t: 'select', o: 'cbdContent' },
    { k: 'findings.mpd', l: 'fdMpd', t: 'number', step: '0.1' },
    { k: 'findings.pancTexture', l: 'fdPancTexture', t: 'select', o: 'pancTexture' },
    { k: 'findings.gbContent', l: 'fdGbContent', t: 'select', o: 'gbContent' },
    { k: 'findings.other', l: 'fdOther', t: 'textarea', span: 4 },
  ]},
  { id: 'lesions', l: 'secLesions', custom: 'lesions' },
  { id: 'rosemont', l: 'secRosemont', custom: 'rosemont' },
  { id: 'staging', l: 'secStaging', fields: [
    { k: 'staging.organ', l: 'stgOrgan', t: 'select', o: 'stgOrgan' },
    { k: 'staging.t', l: 'stgT', t: 'select', o: 'uT' },
    { k: 'staging.n', l: 'stgN', t: 'select', o: 'uN' },
    { k: 'staging.m', l: 'stgM', t: 'select', o: 'uM' },
    { k: 'staging.nodes', l: 'stgNodes', t: 'text', span: 2 },
    { k: 'staging.resect', l: 'stgResect', t: 'select', o: 'resect', span: 2, show: r => r.staging?.organ === 'pancreas' },
    { k: 'staging.note', l: 'stgNote', t: 'textarea', span: 4 },
  ]},
  { id: 'tissue', l: 'secTissue', show: r => any(r.procedure?.types, TISSUE_TYPES), fields: [
    { k: 'tissue.target', l: 'tsTarget', t: 'text', span: 2 },
    { k: 'tissue.technique', l: 'tsTechnique', t: 'select', o: 'technique' },
    { k: 'tissue.route', l: 'tsRoute', t: 'select', o: 'tsRoute' },
    { k: 'tissue.needle', l: 'tsNeedle', t: 'select', o: 'needle' },
    { k: 'tissue.gauge', l: 'tsGauge', t: 'radio', o: 'gauge' },
    { k: 'tissue.brand', l: 'tsBrand', t: 'text' },
    { k: 'tissue.passes', l: 'tsPasses', t: 'number' },
    { k: 'tissue.suction', l: 'tsSuction', t: 'select', o: 'suction' },
    { k: 'tissue.fanning', l: 'tsFanning', t: 'radio', o: 'yesno' },
    { k: 'tissue.rose', l: 'tsRose', t: 'select', o: 'rose', span: 2 },
    { k: 'tissue.mose', l: 'tsMose', t: 'select', o: 'mose', span: 2 },
    { k: 'tissue.specimens', l: 'tsSpecimens', t: 'checks', o: 'specimens', span: 4 },
    { k: 'tissue.fluidLook', l: 'tsFluidLook', t: 'select', o: 'fluidLook', show: r => r.tissue?.technique === 'aspiration' || any(r.tissue?.specimens, ['fluidCyto', 'fluidChem']) || has(r.procedure?.types, 'cystAsp') },
    { k: 'tissue.string', l: 'tsString', t: 'radio', o: 'yesno', show: r => r.tissue?.technique === 'aspiration' || any(r.tissue?.specimens, ['fluidCyto', 'fluidChem']) || has(r.procedure?.types, 'cystAsp') },
    { k: 'tissue.fluidCea', l: 'tsFluidCea', t: 'number', show: r => any(r.tissue?.specimens, ['fluidChem']) },
    { k: 'tissue.fluidGlu', l: 'tsFluidGlu', t: 'number', show: r => any(r.tissue?.specimens, ['fluidChem']) },
    { k: 'tissue.fluidAmy', l: 'tsFluidAmy', t: 'number', show: r => any(r.tissue?.specimens, ['fluidChem']) },
  ]},
  { id: 'therapy', l: 'secTherapy', show: r => any(r.procedure?.types, THERAPY_TYPES), fields: [
    { k: 'therapy.items', l: 'thType', t: 'checks', o: 'therapy', span: 4 },
    { k: 'therapy.stent', l: 'thStent', t: 'select', o: 'stent', span: 2 },
    { k: 'therapy.stentSize', l: 'thStentSize', t: 'text', span: 1 },
    { k: 'therapy.access', l: 'thAccess', t: 'select', o: 'tsRoute' },
    { k: 'therapy.drugs', l: 'thDrugs', t: 'text', span: 2, show: r => any(r.therapy?.items, ['cpb', 'cpn', 'glue', 'ethanol']) },
    { k: 'therapy.success', l: 'thSuccess', t: 'radio', o: 'success', span: 2 },
    { k: 'therapy.details', l: 'thDetails', t: 'textarea', span: 4 },
  ]},
  { id: 'ae', l: 'secComplications', fields: [
    { k: 'ae.items', l: 'aeItems', t: 'checks', o: 'ae', span: 4, req: true },
    { k: 'ae.timing', l: 'aeTiming', t: 'radio', o: 'aeTiming', span: 2, show: r => aeReal(r) },
    { k: 'ae.severity', l: 'aeSeverity', t: 'radio', o: 'aeSeverity', span: 2, show: r => aeReal(r) },
    { k: 'ae.mgmt', l: 'aeMgmt', t: 'textarea', span: 4, show: r => aeReal(r) },
    { k: 'ae.disposition', l: 'aeDisposition', t: 'radio', o: 'disposition', span: 4 },
  ]},
  { id: 'impression', l: 'secImpression', custom: 'impression', fields: [
    { k: 'impression.text', l: 'imText', t: 'textarea', span: 4, rows: 6, req: true },
    { k: 'impression.dx', l: 'imDx', t: 'text', span: 4 },
    { k: 'impression.recs', l: 'imRecs', t: 'checks', o: 'recs', span: 4 },
    { k: 'impression.follow', l: 'imFollow', t: 'select', o: 'followUp' },
    { k: 'impression.recsOther', l: 'imRecsOther', t: 'textarea', span: 4 },
  ]},
  { id: 'images', l: 'secImages', custom: 'images' },
  { id: 'pathology', l: 'secPathology', fields: [
    { k: 'pathology.status', l: 'paStatus', t: 'radio', o: 'paStatus', span: 4 },
    { k: 'pathology.date', l: 'paDate', t: 'date', show: r => r.pathology?.status === 'received' },
    { k: 'pathology.no', l: 'paNo', t: 'text', mono: true, show: r => r.pathology?.status && r.pathology.status !== 'na' },
    { k: 'pathology.category', l: 'paCategory', t: 'select', o: 'paCategory', span: 2, show: r => r.pathology?.status === 'received' },
    { k: 'pathology.result', l: 'paResult', t: 'textarea', span: 4, show: r => r.pathology?.status === 'received' },
    { k: 'pathology.correlation', l: 'paCorrelation', t: 'radio', o: 'correlation', span: 4, show: r => r.pathology?.status === 'received' },
  ]},
  { id: 'sign', l: 'secSign', fields: [
    { k: 'sign.name', l: 'sgName', t: 'text', dl: 'doctors', span: 2 },
    { k: 'sign.title', l: 'sgTitle', t: 'text' },
    { k: 'sign.date', l: 'sgDate', t: 'date' },
  ]},
];

const LESION_FIELDS = [
  { k: 'organ', l: 'lsOrgan', t: 'select', o: 'organ' },
  { k: 'segment', l: 'lsSegment', t: 'text' },
  { k: 'nature', l: 'lsNature', t: 'select', o: 'nature' },
  { k: 'sizeA', l: 'lsSizeA', t: 'number', step: '0.1' },
  { k: 'sizeB', l: 'lsSizeB', t: 'number', step: '0.1' },
  { k: 'echo', l: 'lsEcho', t: 'select', o: 'echo' },
  { k: 'margin', l: 'lsMargin', t: 'select', o: 'margin' },
  { k: 'shape', l: 'lsShape', t: 'select', o: 'shape' },
  { k: 'layer', l: 'lsLayer', t: 'select', o: 'layer', span: 2, show: l => ['sel', 'mucosal'].includes(l.nature) || ['esophagus', 'stomach', 'duodenum', 'rectum'].includes(l.organ) },
  { k: 'features', l: 'lsFeatures', t: 'checks', o: 'features', span: 4 },
  { k: 'vessels', l: 'lsVessels', t: 'checks', o: 'vessels', span: 4 },
  { k: 'vesselType', l: 'lsVesselType', t: 'radio', o: 'vesselType', span: 4, show: l => Array.isArray(l.vessels) && l.vessels.some(v => v !== 'none') },
  { k: 'doppler', l: 'lsDoppler', t: 'select', o: 'doppler' },
  { k: 'elasto', l: 'lsElasto', t: 'select', o: 'elasto' },
  { k: 'strain', l: 'lsStrain', t: 'number', step: '0.1' },
  { k: 'contrast', l: 'lsContrast', t: 'select', o: 'contrast' },
  { k: 'note', l: 'lsNote', t: 'textarea', span: 4 },
];

function aeReal(r) { return Array.isArray(r.ae?.items) && r.ae.items.some(x => x !== 'none'); }

/* Rosemont consensus (Catalano 2009) */
function rosemontClass(items) {
  if (!Array.isArray(items) || !items.length) return '';
  const cat = c => (OPT.rosemont.find(o => o[0] === c) || [])[1];
  const A = items.filter(c => cat(c) === 'A').length;
  const B = items.filter(c => cat(c) === 'B').length;
  const m = items.filter(c => cat(c) === 'm').length;
  if ((A >= 1 && m >= 3) || (A >= 1 && B >= 1) || A >= 2) return 'consistent';
  if (A === 1 || (B >= 1 && m >= 3) || m >= 5) return 'suggestive';
  if ((m >= 3 && m <= 4) || B >= 1) return 'indeterminate';
  return 'normal';
}
