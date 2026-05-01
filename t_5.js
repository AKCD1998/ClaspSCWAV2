
  window.copyText = async function (text) {
    try {
      await navigator.clipboard.writeText(String(text ?? ''));
      showToast('คัดลอกไปที่คลิปบอร์ดแล้ว');
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = String(text ?? '');
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('คัดลอกไปที่คลิปบอร์ดแล้ว');
      } catch {
        showToast('คัดลอกไม่สำเร็จ', true);
      }
    }
  };
