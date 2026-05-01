
(function() {
  function runTests() {
    console.log("Running Baseline Connectivity Tests...");
    const results = { pass: 0, fail: 0, warn: 0, details: [] };

    function check(name, passCondition, failMessage, isWarning = false) {
      if (passCondition) {
        results.pass++;
        results.details.push({ status: 'PASS', name: name });
      } else {
        if (isWarning) {
          results.warn++;
          results.details.push({ status: 'WARN', name: name, msg: failMessage });
        } else {
          results.fail++;
          results.details.push({ status: 'FAIL', name: name, msg: failMessage });
        }
      }
    }

    // 1. Check Libraries
    check("Supabase loaded", typeof window.supabase !== 'undefined', "window.supabase is undefined");
    check("jQuery loaded", typeof window.$ !== 'undefined', "window.$ is undefined");
    check("google.script.run exists", typeof google !== 'undefined' && typeof google.script !== 'undefined' && typeof google.script.run !== 'undefined', "google.script.run missing. Safe to mock if testing locally.", true);

    // 2. Check DOM Elements
    const elements = [
      '#screen-chooser', '#screen-lookup', '#screen-summary',
      '#screen-followup',
      '#tbl', '#sumTbl', '#fuDueTbl', '#fuDoneTbl'
    ];
    elements.forEach(sel => {
      check(`Element exists: ${sel}`, document.querySelector(sel) !== null, `Cannot find ${sel} in DOM`);
    });

    check("Generic buttons exist", document.querySelectorAll('.btn').length > 0, "No elements with class .btn found");

    // 3. Check Global Functions
    const functions = [
      'showScreen', 'goLookup', 'goSummary', 'openPosApp', 
      'goReport1011', 'openRx1011', 'reload', 'reloadSummary', 'goHome', 'goFollowup'
    ];
    functions.forEach(fn => {
      check(`Function exists: ${fn}`, typeof window[fn] === 'function', `window.${fn} is not a function`);
    });

    renderDashboard(results);
  }

  function renderDashboard(res) {
    let html = `
      <div id="devTestPanel" style="position:fixed; top:20px; right:20px; width:350px; background:#111827; color:#f3f4f6; border:1px solid #374151; border-radius:12px; z-index:99999; box-shadow:0 10px 25px rgba(0,0,0,0.5); font-family:sans-serif; max-height:90vh; display:flex; flex-direction:column;">
        <div style="padding:16px; border-bottom:1px solid #374151; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:16px; font-weight:600;">Test Dashboard</h3>
          <button onclick="document.getElementById('devTestPanel').remove()" style="background:transparent; border:none; color:#9ca3af; cursor:pointer; font-size:18px;">&times;</button>
        </div>
        <div style="padding:16px; display:flex; gap:10px; background:#1f2937;">
          <div style="flex:1; text-align:center;"><div style="font-size:24px; font-weight:bold;">${res.pass+res.fail+res.warn}</div><div style="font-size:11px; color:#9ca3af;">TOTAL</div></div>
          <div style="flex:1; text-align:center; color:#34d399;"><div style="font-size:24px; font-weight:bold;">${res.pass}</div><div style="font-size:11px;">PASS</div></div>
          <div style="flex:1; text-align:center; color:#f87171;"><div style="font-size:24px; font-weight:bold;">${res.fail}</div><div style="font-size:11px;">FAIL</div></div>
          <div style="flex:1; text-align:center; color:#fbbf24;"><div style="font-size:24px; font-weight:bold;">${res.warn}</div><div style="font-size:11px;">WARN</div></div>
        </div>
        ${res.fail === 0 ? '<div style="background:#065f46; color:#a7f3d0; padding:8px 16px; text-align:center; font-weight:bold; font-size:14px; border-bottom:1px solid #374151;">✅ ALL SYSTEMS GO</div>' : '<div style="background:#991b1b; color:#fecaca; padding:8px 16px; text-align:center; font-weight:bold; font-size:14px; border-bottom:1px solid #374151;">❌ TESTS FAILED</div>'}
        <div style="flex:1; overflow-y:auto; padding:12px 16px;">
    `;

    res.details.forEach(d => {
      let color = d.status === 'PASS' ? '#34d399' : (d.status === 'FAIL' ? '#f87171' : '#fbbf24');
      let icon = d.status === 'PASS' ? '✓' : (d.status === 'FAIL' ? '✗' : '⚠');
      html += `
        <div style="margin-bottom:8px; font-size:13px; line-height:1.4;">
          <div style="color:${color}; font-weight:bold; display:flex; gap:6px;">
            <span>${icon}</span> <span>${d.name}</span>
          </div>
          ${d.msg ? `<div style="color:#9ca3af; margin-left:18px; font-size:12px;">${d.msg}</div>` : ''}
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    // remove existing if present
    const existing = document.getElementById('devTestPanel');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Expose global function
  window.__runConnectivityTests = runTests;

  // Auto-run logic disabled by user request. Can be run from sidebar.
  /*
  var __devTestEnabled = false;
  try { __devTestEnabled = ('false' === 'true'); } catch(e) {}
  if (__devTestEnabled || window.location.search.includes('devTest=1')) {
    setTimeout(runTests, 1000);
  }
  */
})();
