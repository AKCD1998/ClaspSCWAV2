

  // Build drug rows: name | qty | A-med copy | usage
function buildDrugRows(row, amedMap = new Map()){
  const list = Array.isArray(row.meds_json) ? row.meds_json : [];
  if (!list.length) {
    return `<tr><td colspan="4" style="text-align:center;color:#6b7280">ไม่มีข้อมูลยา</td></tr>`;
  }
  return list.map(d => {
    const qty  = Number(d.qty || 1);
    const uom  = d.uom_th || d.uom || '';
    const amed = amedMap.get(Number(d.sku_id)) || '';     // ← amed_short_name (ถ้ามี)
    const copy = `${(amed || d.display_name || '').replace(/'/g,"\\'")}`;
    const usageId = 'use-' + Math.random().toString(36).slice(2,8);

    return `
      <tr>
        <td>${esc(d.display_name || '')}</td>
        <td style="text-align:center">${qty} ${esc(uom)}</td>
        <td class="amed-td-right">
        <div class="amed-actions">
          <span title="A-med short name" style="margin-right:auto;font-size:12px;opacity:.8">
            ${esc(amedShort || '—')}
          </span>
          <button class="amed-mini" onclick="copyText('${copyAmed}')">📋 คัดลอก</button>
        </div>
      </td>

      <td>
        <div id="${usageId}">${usageText ? esc(usageText) : '<span class="amed-ghost">—</span>'}</div>
        <div class="amed-actions" style="margin-top:6px">
          <button class="amed-mini"
            onclick="copyText(document.getElementById('${usageId}').innerText)">📋 คัดลอก</button>
        </div>
      </td>

      </tr>`;
  }).join('');
}

  