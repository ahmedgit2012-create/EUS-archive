# EUS Archive · أرشيف السونار الناظوري

A bilingual (Arabic / English) program for writing, printing and archiving **endoscopic ultrasound (EUS)** reports.
It runs entirely in the browser, works offline, and needs no server or installation.

برنامج ثنائي اللغة (عربي / إنجليزي) لكتابة تقارير **السونار الناظوري (EUS)** وطباعتها وأرشفتها.
يعمل بالكامل داخل المتصفح وبدون إنترنت، ولا يحتاج إلى خادم أو تثبيت.

---

## Running it · التشغيل

1. Download or clone this repository. · حمّل المستودع أو انسخه.
2. Open `index.html` in Chrome, Edge or Firefox. · افتح ملف `index.html` في متصفح Chrome أو Edge أو Firefox.
3. Open **Settings**, enter the hospital name and logo, the list of doctors and scopes, and optionally click **Load sample cases**.
   افتح **الإعدادات** وأدخل اسم المستشفى والشعار وأسماء الأطباء والمناظير، ويمكنك الضغط على **تحميل حالات نموذجية** للتجربة.

## Deploying on Railway · النشر على Railway

The repository is ready for [Railway](https://railway.com): `package.json` starts a small Node server (`server.js`, no dependencies) and `railway.json` sets the health check.

1. On Railway: **New Project → Deploy from GitHub repo** → choose this repository (and the branch you want).
2. Railway detects Node and runs `npm start`. No build step is needed.
3. Open **Settings → Networking → Generate Domain** to get a public `https://…up.railway.app` address.
4. Recommended: under **Variables** add `AUTH_USER` and `AUTH_PASS`. The site then asks for this username and password before opening.

المستودع جاهز للنشر على Railway:
1. من Railway اختر **New Project ← Deploy from GitHub repo** ثم اختر هذا المستودع.
2. يتعرف Railway على Node ويشغّل `npm start` تلقائياً، ولا حاجة لأي خطوة بناء.
3. من **Settings ← Networking ← Generate Domain** تحصل على رابط عام يبدأ بـ `https://`.
4. يُنصح بإضافة المتغيرين `AUTH_USER` و`AUTH_PASS` من **Variables** ليطلب الموقع اسم مستخدم وكلمة مرور قبل الدخول.

> On Railway the program is served from the web, but reports are still stored in each user's own browser.
> Two computers opening the same address do **not** share one archive. Use Backup / Restore to move reports between them.
> حتى بعد النشر تبقى التقارير محفوظة في متصفح كل مستخدم، ولا يتشارك جهازان نفس الأرشيف. استخدم النسخ الاحتياطي والاستعادة لنقل التقارير.

Run the same server locally with `npm start` (http://localhost:3000). · للتشغيل محلياً: `npm start`.

## What a report contains · محتويات التقرير

| Section · القسم | Contents · المحتوى |
|---|---|
| Patient · بيانات المريض | Name, file/MRN, national ID, DOB → age, sex, phone, patient type, ward, weight, referring physician & department, allergies |
| Procedure · الإجراء | Date, start/end time → duration, priority, endoscopist, assistant, nurse, anesthetist, echoendoscope type (linear / radial / miniprobe), scope model & serial, route, 16 procedure types, extent reached, examination quality & limitations |
| Indication · الدواعي | 26 coded indications, clinical history, prior imaging, CA 19-9, CEA, bilirubin, ALP, lipase |
| Systematic examination · الفحص المنهجي | 30 stations in five standard positions (mediastinum, stomach, duodenum, vessels, lower GI), each Normal / Abnormal / Not visualized + description; CBD & MPD diameters, CBD and gallbladder content, pancreatic parenchyma |
| Lesions · الآفات | Unlimited lesions: organ, location, nature, two-axis size, echogenicity, margins, shape, **wall layer of origin** for subepithelial lesions, cyst / solid / lymph-node features, **vascular contact (abutment / encasement)**, Doppler, elastography & strain ratio, contrast enhancement |
| Rosemont · روزمونت | Chronic pancreatitis criteria with automatic classification (normal / indeterminate / suggestive / consistent) |
| Staging · تحديد المرحلة | uT / uN / M, suspicious nodes, NCCN resectability for pancreatic cancer |
| Tissue acquisition · أخذ العينات | FNA / FNB, needle design & gauge, route, passes, suction, fanning, ROSE, MOSE, specimens sent, cyst fluid appearance, string sign, CEA, glucose, amylase |
| Therapy · العلاج | Drainage (LAMS / plastic), necrosectomy, CDS, HGS, gallbladder drainage, EUS-GE, rendezvous, celiac plexus block / neurolysis, coil / glue, fiducials, ablation; stent & size, technical success |
| Adverse events · المضاعفات | Type, timing, ASGE severity, management, disposition |
| Impression · الانطباع | Free text with a **one-click draft generated from the findings** (Arabic or English), primary diagnosis, 16 coded recommendations, follow-up interval |
| Images · الصور | EUS images with captions, printed in the report |
| Pathology follow-up · متابعة الباثولوجي | Pending / received, lab number, result category, report text, correlation with EUS |
| Sign-off · الاعتماد | Signing physician, title / license number, date |

## Features · المزايا

- **Interface in Arabic or English** (one click, full RTL support). · واجهة عربية أو إنجليزية مع دعم كامل للكتابة من اليمين لليسار.
- **Printing · الطباعة** (every print can also be saved as PDF from the print dialog · كل طباعة يمكن حفظها PDF):
  - Full report on A4 in Arabic, English or bilingual; the report number becomes the PDF file name. · التقرير كاملاً بالعربية أو الإنجليزية أو باللغتين.
  - Quick print from each archive row. · طباعة مباشرة من كل سطر في الأرشيف.
  - Procedure register (log book) of the filtered list, A4 landscape. · سجل الإجراءات للقائمة المعروضة بورق أفقي.
  - Statistics page. · صفحة الإحصائيات.
  - Blank bilingual paper form for handwritten reports (Settings). · نموذج ورقي فارغ ثنائي اللغة للكتابة اليدوية (من الإعدادات).
- 3D icon set drawn in SVG (no image files, sharp at any size). · أيقونات ثلاثية الأبعاد مرسومة بـ SVG.
- Automatic report numbers (`EUS-2026-0001`), draft / final status, and a DRAFT watermark on unvalidated reports. · ترقيم تلقائي للتقارير، وحالة مسودة / نهائي، وعلامة «مسودة» على التقارير غير المعتمدة.
- Required-field check before a report is saved as final. · التحقق من الحقول الإلزامية قبل الحفظ النهائي.
- Archive search by name, file number, report number, diagnosis or indication; date and status filters; "pathology pending" list. · بحث وتصفية في الأرشيف، وقائمة بانتظار نتيجة الباثولوجي.
- Duplicate a report for a repeat examination. · نسخ تقرير سابق لفحص متكرر.
- Statistics and quality indicators: adverse-event rate, ROSE adequacy, diagnostic yield, reports per month, top indications, workload per endoscopist. · إحصائيات ومؤشرات جودة.
- Backup / restore (JSON) and export to Excel (CSV, UTF-8 with Arabic). · نسخ احتياطي واستعادة، وتصدير إلى إكسل.

## Data & privacy · البيانات والخصوصية

Reports are saved **only in the browser on this computer** (IndexedDB). Nothing is sent over the internet
(the only network request is the optional Google font; the program falls back to system fonts offline).
The Railway server only delivers the program files; it never receives report data.
Clearing the browser's site data deletes the archive, so **back up regularly** and store the backup file securely — it contains patient data.

تُحفظ التقارير **في متصفح هذا الجهاز فقط**، ولا تُرسل أي بيانات عبر الإنترنت. مسح بيانات المتصفح يحذف الأرشيف،
لذلك **خذ نسخة احتياطية بانتظام** واحفظها في مكان آمن لأنها تحتوي على بيانات المرضى.

## Files · الملفات

```
server.js         web server for Railway / Node (optional password)
package.json      npm start
railway.json      Railway health check & restart policy
index.html        page shell
css/style.css     interface and A4 print layout
js/i18n.js        Arabic / English dictionary and all coded option lists
js/schema.js      report structure (drives the form, the printout and the CSV)
js/db.js          IndexedDB storage and settings
js/app.js         routing, archive, report editor, impression drafting
js/report.js      printable report sheet, preview, backup and CSV export
js/views.js       statistics, settings, sample cases, start-up
js/icons.js       3D icon set
js/print.js       register, blank form and print helpers
```

To add a field, add it to `SCHEMA` in `js/schema.js` and its label to `T` in `js/i18n.js`; it then appears in the form, the printed report and the CSV automatically.
لإضافة حقل جديد أضفه إلى `SCHEMA` واسمه إلى `T`، وسيظهر تلقائياً في النموذج والتقرير والتصدير.

> This program is a documentation tool. Clinical decisions remain the responsibility of the treating physician.
> هذا البرنامج أداة توثيق، والقرار الطبي مسؤولية الطبيب المعالج.
