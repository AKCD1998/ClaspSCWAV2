
  // Map meds_json → quick lookup (by sku_id and barcode)
  function buildDispenseMap(meds){
    const map = new Map();
    (Array.isArray(meds) ? meds : []).forEach(m => {
      const skuId   = Number(m.sku_id);
      const barcode = String(m.barcode || '').trim();
      const val = {
        name: m.display_name || '',
        uom:  m.uom_th || m.uom || ''
      };
      if (Number.isFinite(skuId)) map.set(`sku:${skuId}`, val);
      if (barcode)               map.set(`bc:${barcode}`, val);
    });
    return map;
  }

  // ---------- Split only by *rows* (newlines), ignore "+" entirely ----------
function splitByRows(amedShort, amedFull){
  const lines = s => String(s || '')
    .replace(/\u200b/g,'')
    .split(/\r?\n+/)                   // rows are newline-separated
    .map(t => t.trim())
    // drop noise rows like "(TP)" / "(XYZ)"
    .filter(t => t && !/^\([A-Z]{1,4}\)$/.test(t));

  const sLines = lines(amedShort);
  const fLines = lines(amedFull);
  const n = Math.max(sLines.length, fLines.length);

  // If we don't clearly have multi-rows, signal "no split"
  if (n <= 1) return [];

  // Build per-row components (prefer short, fall back to full)
  const out = [];
  for (let i = 0; i < n; i++){
    out.push(sLines[i] || fLines[i] || '');
  }
  return out.filter(Boolean);
}

// ---------- build rows from VIEW with row-spans (uses splitByRows) ----------
function buildDrugRowsFromView(rows, nameMap){
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length){
    return `<tr><td colspan="4" style="text-align:center;color:#6b7280">ไม่มีข้อมูลยา</td></tr>`;
  }

  let html = '';

  list.forEach(r => {
    // left columns: product display name & UoM from meds_json
    const lookup =
      nameMap.get(`sku:${Number(r.sku_id)}`) ||
      nameMap.get(`bc:${String(r.barcode || '').trim()}`) ||
      { name:'', uom:'' };

    const showName  = lookup.name || r.amed_full_name || r.amed_short_name || '';
    const uom       = lookup.uom || '';
    const qty       = Number(r.qty || 1);
    const usageText = (r.directions_text || r.use_text || '').trim();

    // Split policy: only when text was saved on multiple *rows*
    let parts = splitByRows(r.amed_short_name, r.amed_full_name);

    // If no multi-rows detected, keep it as one line (even if it contains "+")
    if (!parts.length){
      const single = (r.amed_short_name || r.amed_full_name || showName).trim();
      parts = [single];
    }

    const span = Math.max(1, parts.length);

    parts.forEach((comp, idx) => {
      const usageId  = 'use-' + Math.random().toString(36).slice(2,8);
      const copyAmed = `${comp || showName}`;

      html += `
        <tr>
          ${idx === 0 ? `
            <td rowspan="${span}">${esc(showName)}</td>
            <td rowspan="${span}" style="text-align:center">${qty} ${esc(uom)}</td>
          ` : ''}

          <td class="amed-td-right">
            <div class="amed-actions">
              <span style="margin-right:auto;font-size:12px;opacity:.8">${esc(comp || '—')}</span>
              <button class="amed-mini" onclick="copyText('${escJS(copyAmed)}')">📋 คัดลอก</button>
            </div>
          </td>

          <td>
            <div id="${usageId}">${usageText ? esc(usageText) : '<span class="amed-ghost">—</span>'}</div>
            <div class="amed-actions" style="margin-top:6px">
              <button class="amed-mini" onclick="copyText(document.getElementById('${usageId}').innerText)">📋 คัดลอก</button>
            </div>
          </td>
        </tr>`;
    });
  });

  return html;
}



  // Public API used by index.html → openAmedCloseup(id)
  window.AmedCloseup = {
  async open(encounterId, { close }){
    try {
      // 1) Top half (patient + summary) – unchanged
      const { data: head, error: e1 } = await sb
        .from('v_encounters_lookup_ui')
        .select('*')
        .eq('encounter_id', encounterId)
        .single();
      if (e1) throw e1;

      // 2) Bottom table – fetch from your VIEW
      const { data: medRows, error: e2 } = await sb
      .from('v_encounter_meds_min')
      .select('barcode,sku_id,item_id,qty,unit_price,line_total,use_text,directions_text,use_text_agg,amed_full_name,amed_short_name,verified_by')
      .eq('encounter_id', encounterId);
        if (e2) throw e2;

      // 3) Use meds_json only to recover display_name/UoM for left column & copy text
      const nameMap = buildDispenseMap(head.meds_json || []);

      this.render(head, { close, medRows, nameMap });
    } catch (err) {
      console.error(err);
      alert('เปิดหน้าต่างสรุปรายเคสไม่สำเร็จ');
      close?.();
    }
  },

  render(row, { close, medRows = [], nameMap = new Map() } = {}) {
  document.getElementById('amedTitle').textContent =
    `ใบสรุปรายเคส • ${fmtDate(row.encounter_at)}`;

  const dateStr = new Date(row.encounter_at).toISOString().slice(0,10);

  // build the summary text ONLY for the “ข้อมูลใบสั่งยา” box
  const rxSummaryText =
    (medRows?.[0]?.use_text_agg || '').trim() ||
    Array.from(new Set(
      (medRows || [])
        .map(r => (r.directions_text || r.use_text || '').trim())
        .filter(Boolean)
    )).join(' , ');

  document.getElementById('amedBody').innerHTML = `
    <div class="amed-date">
      <label>วันที่</label>
      <input type="date" value="${dateStr}">
    </div>

    <div class="amed-kv">
      <div class="amed-row"><div class="amed-cell amed-label">ชื่อ-สกุล</div>
        <div class="amed-cell">${esc(row.patient_name || '')}</div></div>
      <div class="amed-row"><div class="amed-cell amed-label">เลขประจำตัวประชาชน</div>
        <div class="amed-cell">${esc(row.patient_pid || '')}</div></div>
      <div class="amed-row"><div class="amed-cell amed-label">เบอร์โทร</div>
        <div class="amed-cell">${esc(row.patient_phone || '')}</div></div>
      <div class="amed-row"><div class="amed-cell amed-label">กลุ่มอาการ</div>
        <div class="amed-cell">${esc(row.symptom_no || '')} : ${esc(row.symptom_name || '')}</div></div>
    </div>

    <!-- อาการที่เป็นปัญหา -->
    <div class="amed-section">อาการที่เป็นปัญหาของผู้รับบริการ</div>
    <div class="amed-copywrap">
      <button type="button" class="amed-copyicon"
        onclick="event.stopPropagation(); window.copyText(document.getElementById('amedAns').innerText.trim())">📋</button>
      <div id="amedAns" class="amed-box">
        ${row.th_answers || '<span class="amed-ghost">ไม่มีคำอธิบายอาการ</span>'}
      </div>
    </div>


    <!-- ข้อมูลใบสั่งยา -->
    <div class="amed-prescription">ข้อมูลใบสั่งยา</div>
    <div class="amed-copywrap">
      <button type="button" class="amed-copyicon"
        onclick="event.stopPropagation(); window.copyText(document.getElementById('amedRx').innerText.trim())">📋</button>
      <div id="amedRx" class="amed-box">
        ${rxSummaryText || '<span class="amed-ghost">สอบถามเภสัชกรที่จ่ายยาเพิ่มเติม</span>'}
      </div>
    </div>

    <table class="amed-table" style="margin-top:12px">
      <thead>
        <tr>
          <th style="width:40%">รายการที่จ่าย</th>
          <th style="width:12%">จำนวน</th>
          <th style="width:24%">คัดลอกไป A-med care</th>
          <th style="width:24%">วิธีรับประทาน</th>
        </tr>
      </thead>
      <tbody>${buildDrugRowsFromView(medRows, nameMap)}</tbody>
    </table>
  `;
  // compute sticky offset for table header
  setAmedHeadOffset();
  addEventListener('resize', setAmedHeadOffset);
}

};

