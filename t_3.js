
let _toastTimer;
function showToast(msg, isError=false){
  const el = document.getElementById('amedToast');
  if(!el) return;
  el.textContent = msg;
  el.classList.toggle('amed-toast--error', !!isError);
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 1400);
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    showToast('คัดลอกไปที่คลิปบอร์ดแล้ว');
  }catch(e){
    try{
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      showToast('คัดลอกไปที่คลิปบอร์ดแล้ว');
    }catch{
      showToast('คัดลอกไม่สำเร็จ', true);
    }
  }
}
