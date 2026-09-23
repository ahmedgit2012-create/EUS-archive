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

To share it on a hospital network, put the folder on any static web server (IIS, nginx, GitHub Pages).
للاستخدام على شبكة المستشفى ضع المجلد على أي خادم ويب ثابت.

## What a report contains · محتويات التقرير

| Section · القسم | Contents · المحتوى |
|---|---|
| Patient · بيانات المريض | Name, file/MRN, national ID, DOB → age, sex, phone, patient type, ward, weight, referring physician & department, allergies |
| Procedure · الإجراء | Date, start/end time → duration, priority, endoscopist, assistant, nurse, anesthetist, echoendoscope type (linear / radial / miniprobe), scope model & serial, route, 16 procedure types, extent reached, examination quality & limitations |
| Indication · الدواعي | 26 coded indications, clinical history, prior imaging, CA 19-9, CEA, bilirubin, ALP, lipase |
| Pre-procedure & sedation · التحضير والتخدير | ASA class, consent, fasting, time-out, CO₂, antithrombotics & plan, INR, platelets, antibiotic prophylaxis, sedation type & agents, position |
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
- **Print the report in Arabic, English, or bilingual** side by side on A4, or save as PDF from the print dialog. · طباعة التقرير بالعربية أو الإنجليزية أو باللغتين معاً على ورق A4، أو حفظه PDF.
- Automatic report numbers (`EUS-2026-0001`), draft / final status, and a DRAFT watermark on unvalidated reports. · ترقيم تلقائي للتقارير، وحالة مسودة / نهائي، وعلامة «مسودة» على التقارير غير المعتمدة.
- Required-field check before a report is saved as final. · التحقق من الحقول الإلزامية قبل الحفظ النهائي.
- Archive search by name, file number, report number, diagnosis or indication; date and status filters; "pathology pending" list. · بحث وتصفية في الأرشيف، وقائمة بانتظار نتيجة الباثولوجي.
- Duplicate a report for a repeat examination. · نسخ تقرير سابق لفحص متكرر.
- Statistics and quality indicators: adverse-event rate, ROSE adequacy, diagnostic yield, reports per month, top indications, workload per endoscopist. · إحصائيات ومؤشرات جودة.
- Backup / restore (JSON) and export to Excel (CSV, UTF-8 with Arabic). · نسخ احتياطي واستعادة، وتصدير إلى إكسل.

## Data & privacy · البيانات والخصوصية

Reports are saved **only in the browser on this computer** (IndexedDB). Nothing is sent over the internet
(the only network request is the optional Google font; the program falls back to system fonts offline).
Clearing the browser's site data deletes the archive, so **back up regularly** and store the backup file securely — it contains patient data.

تُحفظ التقارير **في متصفح هذا الجهاز فقط**، ولا تُرسل أي بيانات عبر الإنترنت. مسح بيانات المتصفح يحذف الأرشيف،
لذلك **خذ نسخة احتياطية بانتظام** واحفظها في مكان آمن لأنها تحتوي على بيانات المرضى.

## Files · الملفات

```
index.html        page shell
css/style.css     interface and A4 print layout
js/i18n.js        Arabic / English dictionary and all coded option lists
js/schema.js      report structure (drives the form, the printout and the CSV)
js/db.js          IndexedDB storage and settings
js/app.js         routing, archive, report editor, impression drafting
js/report.js      printable report sheet, preview, backup and CSV export
js/views.js       statistics, settings, sample cases, start-up
```

To add a field, add it to `SCHEMA` in `js/schema.js` and its label to `T` in `js/i18n.js`; it then appears in the form, the printed report and the CSV automatically.
لإضافة حقل جديد أضفه إلى `SCHEMA` واسمه إلى `T`، وسيظهر تلقائياً في النموذج والتقرير والتصدير.

> This program is a documentation tool. Clinical decisions remain the responsibility of the treating physician.
> هذا البرنامج أداة توثيق، والقرار الطبي مسؤولية الطبيب المعالج.
