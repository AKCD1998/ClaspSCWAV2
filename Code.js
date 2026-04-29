/** Serve pages with ?page=... and inject Supabase config */
function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const SUPABASE_URL = props.getProperty('SUPABASE_URL');
  const SUPABASE_KEY = props.getProperty('SUPABASE_KEY');
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in Script Properties.');
  }

  // รับชื่อหน้า จากพารามิเตอร์ (ค่าเริ่มต้น: index)
  const paramPage = e && e.parameter && e.parameter.page;
  const whitelist = ['index', 'rx1011', 'report1011', 'closeup']; // เพิ่มชื่อไฟล์ html ได้ที่นี่
  const page = whitelist.includes(paramPage) ? paramPage : 'index';

  // inject config เข้า template ของหน้านั้น
  const t = HtmlService.createTemplateFromFile(page);
  t.SUPABASE_URL = SUPABASE_URL;
  t.SUPABASE_KEY = SUPABASE_KEY;
  t.devTest = (e && e.parameter && e.parameter.devTest === '1');

  const output = t.evaluate()
    .setTitle('CiPData Lookup')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  // const faviconUrl = props.getProperty('FAVICON_URL') ||
  //   'https://lh3.googleusercontent.com/d/1pTdMn396kmXyW7atCNb7GAJ_q343Bb4C';
  // if (faviconUrl) output.setFaviconUrl(faviconUrl);
  return output;
}

/** Allow <?!= include('file') ?> within templates */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/*** (คงไว้ได้) คืน HTML ของไฟล์ report1011.html เป็นสตริง ***/
function getReport1011Html(){
  return HtmlService.createHtmlOutputFromFile('report1011').getContent();
}

/** คืน HTML ของไฟล์ rx1011.html (พร้อมแทนค่า SUPABASE_*) */
function getRx1011Html() {
  const props = PropertiesService.getScriptProperties();
  const t = HtmlService.createTemplateFromFile('rx1011');  // compile as template
  t.SUPABASE_URL = props.getProperty('SUPABASE_URL');
  t.SUPABASE_KEY = props.getProperty('SUPABASE_KEY');
  return t.evaluate().getContent(); // return HTML string
}

// ดึงข้อมูลจาก Supabase ทีละหน้า (ใช้ header Range ของ PostgREST)
// จะ loop ต่อหน้าๆ จนกว่าจะหมด แล้วรวมผลทั้งหมดคืนเป็น array เดียว
function supaSelectPaged_({ url, key, view, qs }) {
  const PAGE_SIZE = 1000; // จะเอา 500 ก็ได้ ถ้าอยากชัวร์ว่าไม่ชน timeout
  let allRows = [];
  let start = 0;

  while (true) {
    const end = start + PAGE_SIZE - 1; // Range เป็น inclusive เช่น 0-999

    const endpoint = `${url}/rest/v1/${encodeURIComponent(view)}?${qs}`;

    const res = UrlFetchApp.fetch(endpoint, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        Accept: 'application/json',
        Range: `${start}-${end}`,
        'Range-Unit': 'items' // บางเวอร์ชันของ PostgREST ไม่บังคับ แต่ใส่ไว้โอเค
      }
    });

    const code = res.getResponseCode();
    if (code >= 400) {
      throw new Error('Supabase error ' + code + ': ' + res.getContentText());
    }

    const chunk = JSON.parse(res.getContentText() || '[]');
    allRows = allRows.concat(chunk);

    // ถ้าหน้านี้ได้มาน้อยกว่าขนาดเพจ แปลว่าอันสุดท้ายแล้ว -> หยุด loop
    if (chunk.length < PAGE_SIZE) break;

    // ถ้ายังได้มาครบ PAGE_SIZE แปลว่าอาจจะยังมีต่อ -> ขยับ offset ต่อ
    start += PAGE_SIZE;
  }

  return allRows;
}

/***** CONFIG *****/
const TZ = Session.getScriptTimeZone() || 'Asia/Bangkok';

// Send only to yourself while testing
const TEST_MODE = false;
const TEST_RECIPIENT = 'auukunn.bkk@gmail.com';
const rcpt = list => (TEST_MODE ? TEST_RECIPIENT : list);
const subj = s => (TEST_MODE ? '[TEST] ' : '') + s;

// What we’ll query from Supabase (make sure these columns exist in your view)
const SUPA_VIEW = 'v_encounters_lookup_ui';
const SELECT_FIELDS = [
  'encounter_id',   // 👈 สำคัญ ใช้เป็น data-attr บน <tr>
  'encounter_at',
  'followup_call',
  'branch_no',
  'patient_name',
  'patient_pid',
  'patient_phone',
  'symptom_no',     // 👈 render แสดงคอลัมน์นี้
  'symptom_name',
  'th_answers',     // 👈 ใช้ใน <td> คำอธิบายอาการ
  'meds_json',
  'meds_amed_th',
  'pharm_warning'   // 👈 คอลัมน์ "หมายเหตุ"
].join(',');


// Per-branch recipients (edit me)
const BRANCHES = [

    {
    code: '001',
    label: 'สาขา 001',
    keep: '001',   // ← was 1
    recipients: {
      today:     'auukunn.bkk@gmail.com,9kawkaw99@gmail.com,admin@scgroup1989.com,aom110541@gmail.com',  // โทรติดตามอาการในวันนี้
      yesterday: 'auukunn.bkk@gmail.com,9kawkaw99@gmail.com,admin@scgroup1989.com,aom110541@gmail.com',  // สรุปรายการเคสทั้งหมดของเมื่อวาน
      weekly:    'auukunn.bkk@gmail.com,9kawkaw99@gmail.com,k.nattapat7@gmail.com,s.limpisood@gmail.com,admin@scgroup1989.com,aom110541@gmail.com',  // 
      monthly:   'auukunn.bkk@gmail.com,9kawkaw99@gmail.com,k.nattapat7@gmail.com,s.limpisood@gmail.com,admin@scgroup1989.com,aom110541@gmail.com',  // รายงานจำนวนเคสตลอดทั้งเดือน
    },
  },

  {
    code: '003',
    label: 'สาขา 003',
    keep: '003',   // ← was 1
    recipients: {
      today:     'nnglaksnchukr4@gmail.com,auukunn.bkk@gmail.com,scgroup1989.shop003@gmail.com,blackcrane323@gmail.com,admin@scgroup1989.com,scgroup1989.th@gmail.com,wetprasertsudarat@gmail.com',  // โทรติดตามอาการในวันนี้
      yesterday: 'nnglaksnchukr4@gmail.com,auukunn.bkk@gmail.com,scgroup1989.shop003@gmail.com,blackcrane323@gmail.com,admin@scgroup1989.com,scgroup1989.th@gmail.com,wetprasertsudarat@gmail.com',  // สรุปรายการเคสทั้งหมดของเมื่อวาน
      weekly:    'nnglaksnchukr4@gmail.com,auukunn.bkk@gmail.com,scgroup1989.shop003@gmail.com,blackcrane323@gmail.com,k.nattapat7@gmail.com,s.limpisood@gmail.com,admin@scgroup1989.com,wetprasertsudarat@gmail.com',  // 
      monthly:   'nnglaksnchukr4@gmail.com,auukunn.bkk@gmail.com,scgroup1989.shop003@gmail.com,blackcrane323@gmail.com,k.nattapat7@gmail.com,s.limpisood@gmail.com,admin@scgroup1989.com,wetprasertsudarat@gmail.com',  // รายงานจำนวนเคสตลอดทั้งเดือน
    },
  },


  {
    code: '004',
    label: 'สาขา 004',
    keep: '004',   // ← was 4
    recipients: {
      today:     'auukunn.bkk@gmail.com,benzchns10@gmail.com,prpbaifern@gmail.com', // โทรติดตามอาการในวันนี้
      yesterday: 'auukunn.bkk@gmail.com,benzchns10@gmail.com,prpbaifern@gmail.com', // สรุปรายการเคสทั้งหมดของเมื่อวาน
      weekly:    'auukunn.bkk@gmail.com,benzchns10@gmail.com,k.nattapat7@gmail.com,s.limpisood@gmail.com', // รายงานเคสตลอดทั้งสัปดาห์สำหรับรายงานพี่เตี๋ยว
      monthly:   'auukunn.bkk@gmail.com,benzchns10@gmail.com,k.nattapat7@gmail.com,s.limpisood@gmail.com', // รายงานจำนวนเคสตลอดทั้งเดือน
    },
  },
];


// Column headers in the PDF table
const COLS = [
  'ลำดับที่',
  'ประทับเวลา',
  'ชื่อ-นามสกุล ผู้รับบริการ',
  'เลขประจำตัวประชาชนของผู้รับบริการ',
  'เบอร์โทรศัพท์',
  'อาการเจ็บป่วยเล็กน้อยของผู้รับบริการ',
  'รายการยาที่เภสัชกรจ่าย',
  'วันที่ติดตามอาการ'
];

/***** SUPABASE REST (server-side) *****/
function formatMedsFromJson_(medsJson){
  if (!Array.isArray(medsJson)) return '';
  return medsJson.map(m => {
    const name = m.display_name || m.amed_full_name || m.amed_short_name || m.amed_copy_name || '—';
    const qty = (m.qty != null ? String(m.qty).replace(/\.0+$/,'') : '1');
    const uom = m.uom_th || 'หน่วย';
    return `${name} × ${qty} ${uom}`;
  }).join('\n');     // was .join(' • ')
}

function supaConfig_() {
  const p = PropertiesService.getScriptProperties();
  const url = p.getProperty('SUPABASE_URL');
  const key = p.getProperty('SUPABASE_SERVICE_KEY') || p.getProperty('SUPABASE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in Script properties.');
  return { url, key };
}

function supaSelectByWindow_({ view, dateField, startIso, endIso, branchNo, filters }) {
  const { url, key } = supaConfig_();

  // 1) ประกอบ query หลัก (ช่วงเวลา, branch, sort)
  const baseParams = [
    'select=' + encodeURIComponent(SELECT_FIELDS),
    `${dateField}=gte.${encodeURIComponent(startIso)}`,
    `${dateField}=lt.${encodeURIComponent(endIso)}`,
    branchNo ? `branch_no=eq.${encodeURIComponent(branchNo)}` : null,
    'order=' + encodeURIComponent(dateField + '.asc')
  ].filter(Boolean).join('&');

  // 2) filter เสริม (pid / symptom / drug)
  const extra = buildFilterParams_(filters || {});
  const qs = extra ? `${baseParams}&${extra}` : baseParams;

  // 3) ดึงจริงด้วยตัววิ่งหลายหน้า
  const rows = supaSelectPaged_({
    url,
    key,
    view,
    qs
  });

  // 4) คืนค่าในรูปแบบเดิม เพื่อให้โค้ดส่วนอื่นไม่ต้องแก้เลย
  return {
    rows,
    total: rows.length
  };
}



/***** DATE HELPERS *****/
const z2 = n => String(n).padStart(2,'0');
function isoLocal_(d){
  const tz = Utilities.formatDate(d, TZ, "Z");                  // e.g. +0700
  const off = tz.slice(0,3) + ":" + tz.slice(3);                // +07:00
  return Utilities.formatDate(d, TZ, "yyyy-MM-dd'T'HH:mm:ss") + off;
}
function startOfDay_(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays_(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function endExclusive_(d){ const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()+1); return x; }
function startOfMonth_(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonthExclusive_(d){ return new Date(d.getFullYear(), d.getMonth()+1, 1); }
function ymd_(d){ return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }

/** Find the first table's start index in the Doc (Docs API) */
function getFirstTableStartIndex_(docId) {
  const doc = Docs.Documents.get(docId); // Advanced Docs Service
  const content = doc.body && doc.body.content || [];
  for (const el of content) {
    if (el.table && el.startIndex != null) {
      return el.startIndex;              // tableStartLocation.index
    }
  }
  return null;
}

// Repeat the first row of the first table on each page
function pinHeaderRow_(docId){
  const start = getFirstTableStartIndex_(docId);
  if (start == null) return;
  Docs.Documents.batchUpdate({
    requests: [{ pinTableHeaderRows: { tableStartLocation: { index: start }, pinnedHeaderRowsCount: 1 } }]
  }, docId);
}

// Keep table rows intact across page breaks (no overflow)
function preventRowSplit_(docId){
  const doc = Docs.Documents.get(docId);
  const el  = (doc.body.content || []).find(x => x.table && x.startIndex != null);
  if (!el) return;
  const start = el.startIndex;
  const rows  = el.table.rows || 0;
  const rowIndices = Array.from({length: rows}, (_,i) => i);
  Docs.Documents.batchUpdate({
    requests: [{
      updateTableRowStyle: {
        tableStartLocation: { index: start },
        rowIndices,
        tableRowStyle: { preventOverflow: true },
        fields: 'preventOverflow'
      }
    }]
  }, docId);
}

// Phone -> +66… (clickable)
function toDialable_(raw){
  const s = String(raw || '');
  if (/^\+66\d{9}$/.test(s)) return s;
  const d = s.replace(/\D/g,'');
  if (/^0\d{9}$/.test(d))  return '+66' + d.slice(1);
  if (/^66\d{9}$/.test(d)) return '+' + d;
  return '';
}



// ---- column width helper (Docs API) ----
function setFirstTableColumnWidths_(docId, widthsPts) {
  const startIndex = getFirstTableStartIndex_(docId);
  if (startIndex == null) return;

  const requests = widthsPts.map((w, i) => ({
    updateTableColumnProperties: {
      tableStartLocation: { index: startIndex },
      columnIndices: [i],
      tableColumnProperties: {
        width: { magnitude: w, unit: 'PT' },
        widthType: 'FIXED_WIDTH'
      },
      fields: 'width,widthType'
    }
  }));

  Docs.Documents.batchUpdate({ requests }, docId);
}
// ---------------------------------------




// helper ใหม่ สำหรับเลือก email ปลายทาง
function rcptTest_(recipients) {
  if (!TEST_MODE) {
    // โหมดปกติ → ใช้ rcpt เดิมของเรา
    return rcpt(recipients);
  }
  // โหมดเทส → ส่งหาเราคนเดียว
  return TEST_RECIPIENT;
}

function buildDocAndSend_(title, heading, rows, recipients, subjectPrefix){
  const doc = DocumentApp.create(title);
  const body = doc.getBody();

  body.setAttributes({
    [DocumentApp.Attribute.PAGE_WIDTH]: 842,
    [DocumentApp.Attribute.PAGE_HEIGHT]: 595,
    [DocumentApp.Attribute.MARGIN_LEFT]: 36,
    [DocumentApp.Attribute.MARGIN_RIGHT]: 36,
    [DocumentApp.Attribute.MARGIN_TOP]: 36,
    [DocumentApp.Attribute.MARGIN_BOTTOM]: 36,
  });

  body.appendParagraph(heading)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setBold(true).setFontSize(16);

  // NEW: show how many rows right under the title
  body.appendParagraph(`จำนวนรายการ: ${rows.length}`)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setBold(true).setFontSize(12);

  let hasTable = false;

  if (!rows.length){
    body.appendParagraph('ไม่มีรายการสำหรับช่วงนี้');
  } else {
    hasTable = true;
    const tbl = body.appendTable();
    const hr = tbl.appendTableRow();
    COLS.forEach(h => hr.appendTableCell(h).setBackgroundColor('#eeeeee'));

    rows.forEach((r, i) => {
      const tr = tbl.appendTableRow();

      // NEW: index column
      tr.appendTableCell(String(i + 1));

      // date/time
      tr.appendTableCell(fmtDateTime_(r.encounter_at));
      tr.appendTableCell(safe_(r.patient_name));
      tr.appendTableCell(safe_(r.patient_pid));

      // phone with tel: link
      const phoneText = safe_(r.patient_phone);
      const phoneCell = tr.appendTableCell('');
      if (phoneCell.getNumChildren() > 0) phoneCell.removeChild(phoneCell.getChild(0));
      const p = phoneCell.appendParagraph(phoneText);
      p.setSpacingBefore(0).setSpacingAfter(0);
      const t = p.editAsText();
      const dial = toDialable_(phoneText);
      if (dial) t.setLinkUrl(0, phoneText.length - 1, 'tel:' + dial);

      // symptom
      tr.appendTableCell(safe_(r.symptom_name));

      // meds
      const meds = r.meds_json ? formatMedsFromJson_(r.meds_json) : (r.meds_amed_th || '');
      tr.appendTableCell(safe_(meds));

      // follow-up
      tr.appendTableCell(r.followup_call ? fmtDateTime_(r.followup_call) : '');
    });

    tbl.editAsText().setFontFamily('Sarabun').setFontSize(9);
  }


  // Always close the doc
  doc.saveAndClose();

  // Post-process via Docs API (only if we actually created a table)
  if (hasTable) {
    setFirstTableColumnWidths_(doc.getId(), [30,60, 110, 90, 70, 80, 250, 60]); // tweak widths as you like
    pinHeaderRow_(doc.getId());
    preventRowSplit_(doc.getId());
    Utilities.sleep(300);
  }

  // Export + email (runs even when rows == 0)
    const pdf = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  const subject = `${subjectPrefix} (จำนวน ${rows.length} รายการ)`;

  const finalSubject = TEST_MODE
    ? '[TEST] ' + subj(subject)               // ขึ้นหัวเผื่อแยกออกใน inbox
    : subj(subject);

  const extraNote = TEST_MODE
    ? '<p><b>*** TEST MODE: ส่งให้ auukunn.bkk@gmail.com เท่านั้น ***</b></p>'
    : '';

  MailApp.sendEmail({
    to: rcptTest_(recipients),
    subject: finalSubject,
    htmlBody: `<p>${subjectPrefix}</p>
               <p>จำนวนแถว: <b>${rows.length}</b></p>
               ${extraNote}
               <p><a href="https://docs.google.com/document/d/${doc.getId()}/edit">เปิดเอกสาร</a></p>`,
    attachments: [pdf],
    name: 'CI Reports Bot'
  });
}



function fmtDateTime_(iso){
  try{
    const d = new Date(iso);
    return Utilities.formatDate(d, TZ, 'dd/MM/yyyy HH:mm');
  }catch(e){ return String(iso||''); }
}
const safe_ = v => (v == null ? '' : String(v));

/***** REPORTS (4 wrappers) *****/
// 1) follow-up list for TODAY (filter by followup_call)
// 1) follow-up list for TODAY (filter by followup_call)
function emailDailyFollowup_All(){
  const now = new Date();
  const start = startOfDay_(now);
  const end   = endExclusive_(now);

  BRANCHES.forEach(b => {
    // ดึงข้อมูลจาก Supabase
    const result = supaSelectByWindow_({
      view: SUPA_VIEW,
      dateField: 'followup_call',
      startIso: isoLocal_(start),
      endIso: isoLocal_(end),
      branchNo: b.keep
    });
    const arr = result.rows; // <-- อันนี้คือ array จริงที่เราจะใช้

    const title = `โทรติดตามอาการ - ${b.label} - ${ymd_(now)}`;
    const head  = `รายงานผู้รับบริการดูแลอาการเจ็บป่วยเล็กน้อย\nประจำวันที่ ${ymd_(now)} ${b.label}`;

    buildDocAndSend_(title, head, arr, b.recipients.today,
      `[${b.code}] โทรติดตามอาการ - ${ymd_(now)}`);
  });
}


// 2) yesterday summary (filter by encounter_at)
// 2) yesterday summary (filter by encounter_at)
function emailDailySummaryYesterday_All(){
  const d = addDays_(new Date(), -1);
  const start = startOfDay_(d);
  const end   = endExclusive_(d);
  const y = ymd_(d);

  BRANCHES.forEach(b => {
    const result = supaSelectByWindow_({
      view: SUPA_VIEW,
      dateField: 'encounter_at',
      startIso: isoLocal_(start),
      endIso: isoLocal_(end),
      branchNo: b.keep
    });
    const arr = result.rows;

    const title = `สรุปเคสเมื่อวาน - ${b.label} (${y})`;
    const head  = `สรุปเคสบริการดูแลคนไข้เจ็บป่วยเล็กน้อยของวันที่ (${y}) ${b.label}`;

    buildDocAndSend_(title, head, arr, b.recipients.yesterday,
      `[${b.code}] สรุปเคสรายวัน ${y}`);
  });
}


// 3) weekly (Mon–Sun style: last 7 days ending yesterday)
function emailWeeklyReport_All(){
  const end   = startOfDay_(new Date());   // วันนี้ 00:00 (exclusive)
  const start = addDays_(end, -7);
  const s = ymd_(start);
  const e = ymd_(addDays_(end, -1));

  BRANCHES.forEach(b => {
    const result = supaSelectByWindow_({
      view: SUPA_VIEW,
      dateField: 'encounter_at',
      startIso: isoLocal_(start),
      endIso: isoLocal_(end),
      branchNo: b.keep
    });
    const arr = result.rows;

    const title = `รายงานรายสัปดาห์ - ${b.label} (${s}–${e})`;
    const head  = `รายงานผู้รับบริการดูแลอาการเจ็บป่วยเล็กน้อย (ช่วง ${s} – ${e}) ${b.label}`;

    buildDocAndSend_(title, head, arr, b.recipients.weekly,
      `[${b.code}] รายงานประจำสัปดาห์ ${s}–${e}`);
  });
}

// 4) previous month
function emailMonthlyReport_ForBranch_(branchCode){
  const now = new Date();
  // เดือนที่แล้ว
  const start = startOfMonth_(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const end   = endOfMonthExclusive_(start);
  const label = Utilities.formatDate(start, TZ, 'MMMM yyyy');

  // หา config ของสาขาที่ต้องการจาก BRANCHES
  const b = BRANCHES.find(br => br.code === branchCode);
  if (!b) {
    Logger.log('Branch not found for code: ' + branchCode);
    return;
  }

   // 👇 เพิ่มตรงนี้เพื่อดูว่า "สุดท้ายแล้ว" ส่งไปหาใคร
  const finalRecipients = rcpt(b.recipients.monthly);
  Logger.log(`Monthly report for branch ${branchCode} → to: ${finalRecipients}`);


  // ดึงข้อมูลจาก Supabase เฉพาะสาขานี้
  const result = supaSelectByWindow_({
    view: SUPA_VIEW,
    dateField: 'encounter_at',
    startIso: isoLocal_(start),
    endIso: isoLocal_(end),
    branchNo: b.keep
  });
  const arr = result.rows;

  const title = `รายงานรายเดือน - ${b.label} (${label})`;
  const head  = `สรุปเคสบริการดูแลคนไข้เจ็บป่วยเล็กน้อย ประจำเดือน ${label} — ${b.label}`;

  buildDocAndSend_(title, head, arr, b.recipients.monthly,
    `[${b.code}] รายงานเคสประจำเดือน ${label}`);
}

function emailMonthlyReport_001(){
  emailMonthlyReport_ForBranch_('001');
}
function emailMonthlyReport_003(){
  emailMonthlyReport_ForBranch_('003');
}
function emailMonthlyReport_004(){
  emailMonthlyReport_ForBranch_('004');
}



/***** TRIGGERS + QUICK RUN *****/
function installAllTriggers(){
  // ---- daily followup (today) ----
  resetTrigger_('emailDailyFollowup_All');
  ScriptApp.newTrigger('emailDailyFollowup_All')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone(TZ)
    .create();            // e.g. 08:00 daily

  // ---- yesterday summary ----
  resetTrigger_('emailDailySummaryYesterday_All');
  ScriptApp.newTrigger('emailDailySummaryYesterday_All')
    .timeBased()
    .atHour(8).nearMinute(10)
    .everyDays(1)
    .inTimezone(TZ)
    .create();

  // ---- weekly summary ----
  resetTrigger_('emailWeeklyReport_All');
  ScriptApp.newTrigger('emailWeeklyReport_All')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .inTimezone(TZ)
    .create();

  // ---- monthly per branch (แทน emailMonthlyReport_All เดิม) ----
  resetTrigger_('emailMonthlyReport_001');
  ScriptApp.newTrigger('emailMonthlyReport_001')
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .inTimezone(TZ)
    .create();

  resetTrigger_('emailMonthlyReport_003');
  ScriptApp.newTrigger('emailMonthlyReport_003')
    .timeBased()
    .onMonthDay(1)
    .atHour(9).nearMinute(10)   // เลื่อนนิดนึงกันชนกัน
    .inTimezone(TZ)
    .create();

  resetTrigger_('emailMonthlyReport_004');
  ScriptApp.newTrigger('emailMonthlyReport_004')
    .timeBased()
    .onMonthDay(1)
    .atHour(9).nearMinute(20)
    .inTimezone(TZ)
    .create();
}

function resetTrigger_(name){
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === name)
    .forEach(t => ScriptApp.deleteTrigger(t));
}


function runAllNow(){
  try{ emailDailyFollowup_All(); }catch(e){ Logger.log('Followup err: '+e); }
  try{ emailDailySummaryYesterday_All(); }catch(e){ Logger.log('Yesterday err: '+e); }
  try{ emailWeeklyReport_All(); }catch(e){ Logger.log('Weekly err: '+e); }
  try{ emailMonthlyReport_All(); }catch(e){ Logger.log('Monthly err: '+e); }
  Logger.log('Done runAllNow (TEST_MODE='+TEST_MODE+')');
}


function debugFetchToday004(){
  const start = startOfDay_(new Date());
  const end   = endExclusive_(new Date());

  const result = supaSelectByWindow_({
    view: 'v_encounters_lookup_ui',
    dateField: 'followup_call',
    startIso: isoLocal_(start),
    endIso: isoLocal_(end),
    branchNo: '004',
  });

  const rows = result.rows;

  Logger.log('rows: ' + rows.length);
  if (rows.length) Logger.log(JSON.stringify(rows[0], null, 2));
}


/***** TRIGGERS (แบบเดียวกับสคริปต์ตัวอย่าง) *****/
function createAllTriggers() {
  // Daily follow-up (วันนี้) — ใช้ฟิลด์ followup_call
  resetTrigger_('emailDailyFollowup_All');
  ScriptApp.newTrigger('emailDailyFollowup_All')
    .timeBased().atHour(0).everyDays(1).inTimezone(TZ).create();

  // Daily summary (เมื่อวาน) — ใช้ฟิลด์ encounter_at
  resetTrigger_('emailDailySummaryYesterday_All');
  ScriptApp.newTrigger('emailDailySummaryYesterday_All')
    .timeBased().atHour(0).nearMinute(5).everyDays(1).inTimezone(TZ).create();

  // Weekly (สรุปสัปดาห์ จบเมื่อวาน) — ทุกวันจันทร์ 00:10
  resetTrigger_('emailWeeklyReport_All');
  ScriptApp.newTrigger('emailWeeklyReport_All')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(0).nearMinute(10).inTimezone(TZ).create();

  // Monthly (เดือนที่แล้วทั้งหมด) — ทุกวันที่ 1 เวลา 00:15
  resetTrigger_('emailMonthlyReport_All');
  ScriptApp.newTrigger('emailMonthlyReport_All')
    .timeBased().onMonthDay(1).atHour(0).nearMinute(15).inTimezone(TZ).create();
}

/** ลบทริกเกอร์ทุกตัวแล้วสร้างใหม่เฉพาะที่ต้องใช้ */
function nukeAndRecreateTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  createAllTriggers();
}


function buildFilterParams_(p) {
  const parts = [];

  if (p.branchNo) parts.push(`branch_no=eq.${encodeURIComponent(p.branchNo)}`);
  if (p.pid)      parts.push(`patient_pid=ilike.${encodeURIComponent('%'+p.pid+'%')}`);

  if (p.symptom) {
    if (/^\d+$/.test(p.symptom)) {
      parts.push(`symptom_no=eq.${encodeURIComponent(p.symptom)}`);
    } else {
      parts.push(`symptom_name=ilike.${encodeURIComponent('%'+p.symptom+'%')}`);
    }
  }
  if (p.drug) {
    // search the flattened text column. Make sure SELECT includes meds_amed_th or use a computed column in your view
    parts.push(`meds_amed_th=ilike.${encodeURIComponent('%'+p.drug+'%')}`);
  }
  return parts.join('&');
}


/** Build a report for the UI and return a PDF URL to open */
function generateReport(opts){
  if (!opts) throw new Error('missing options');
  const dateField = opts.dateField || 'encounter_at';
  const startIso  = opts.startIso;
  const endIso    = opts.endIso;

  const result = supaSelectByWindow_({
    view: SUPA_VIEW,
    dateField,
    startIso,
    endIso,
    branchNo: opts.branchNo || null,
    filters: { pid: opts.pid, symptom: opts.symptom, drug: opts.drug }
  });

  const rows = result.rows; // <--- ใช้อันนี้ในเอกสาร
  // const total = result.total; // ถ้าอยากใช้จำนวน estimate

  const sLabel = ('' + startIso).slice(0,10);
  const eLabel = ('' + endIso).slice(0,10);
  const title  = `รายงาน (${dateField}) ${sLabel} – ${eLabel}`;
  const head   = `รายงานผู้รับบริการดูแลอาการเจ็บป่วยเล็กน้อย\nช่วง ${sLabel} – ${eLabel}`;

  const doc = DocumentApp.create(title);
  const body = doc.getBody();
  body.setAttributes({
    [DocumentApp.Attribute.PAGE_WIDTH]: 842,
    [DocumentApp.Attribute.PAGE_HEIGHT]: 595,
    [DocumentApp.Attribute.MARGIN_LEFT]: 36,
    [DocumentApp.Attribute.MARGIN_RIGHT]: 36,
    [DocumentApp.Attribute.MARGIN_TOP]: 36,
    [DocumentApp.Attribute.MARGIN_BOTTOM]: 36,
  });

  body.appendParagraph(head)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setBold(true).setFontSize(16);

  body.appendParagraph(`จำนวนรายการ: ${rows.length}`)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setBold(true).setFontSize(12);

  let hasTable = false;
  if (!rows.length){
    body.appendParagraph('ไม่มีรายการสำหรับช่วงนี้');
  } else {
    hasTable = true;
    const tbl = body.appendTable();
    const hr = tbl.appendTableRow();
    ['#','วันที่','ชื่อ-สกุล','PID','โทรศัพท์','กลุ่มอาการ','รายการยา','ติดตามอาการ']
      .forEach(h => hr.appendTableCell(h).setBackgroundColor('#eeeeee'));

    rows.forEach((r, i) => {
      const tr = tbl.appendTableRow();
      tr.appendTableCell(String(i+1));
      tr.appendTableCell(fmtDateTime_(r.encounter_at));
      tr.appendTableCell(safe_(r.patient_name));
      tr.appendTableCell(safe_(r.patient_pid));

      const phoneText = safe_(r.patient_phone);
      const phoneCell = tr.appendTableCell('');
      const p = phoneCell.appendParagraph(phoneText);
      p.setSpacingBefore(0).setSpacingAfter(0);
      const t = p.editAsText();
      const dial = toDialable_(phoneText);
      if (dial) t.setLinkUrl(0, phoneText.length - 1, 'tel:' + dial);

      tr.appendTableCell(safe_(r.symptom_name));
      const meds = r.meds_json
        ? formatMedsFromJson_(r.meds_json)
        : (r.meds_amed_th || '');
      tr.appendTableCell(safe_(meds));
      tr.appendTableCell(r.followup_call ? fmtDateTime_(r.followup_call) : '');
    });

    tbl.editAsText().setFontFamily('Sarabun').setFontSize(9);
  }

  doc.saveAndClose();

  if (hasTable) {
    setFirstTableColumnWidths_(doc.getId(), [30,60,110,90,70,80,250,60]);
    pinHeaderRow_(doc.getId());
    preventRowSplit_(doc.getId());
    Utilities.sleep(300);
  }

  const url = 'https://docs.google.com/document/d/' + doc.getId() + '/export?format=pdf';
  return { url, count: rows.length };
}
