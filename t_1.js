
  (() => {
    const BASE_DPR = window.devicePixelRatio || 1;

    function updateAmedZoom(){
      const dpr   = window.devicePixelRatio || 1;
      const base  = BASE_DPR / dpr;          // =1 at 100% zoom
      const k     = 5;                     // ↑ makes shrink faster (try 1.8–2.4)
      const scale = Math.max(0.30, Math.min(2, Math.pow(base, k)));
      document.documentElement.style.setProperty('--amed-zoom', scale.toFixed(3));
    }

    updateAmedZoom();
    addEventListener('resize', updateAmedZoom);
  })();
  