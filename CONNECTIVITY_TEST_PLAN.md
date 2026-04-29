# Connectivity Test Plan

This plan outlines how the baseline connectivity test system will verify the structural and functional integrity of the `index.html` application before and after refactoring.

## 1. Objectives
- Capture a snapshot of current functioning connections (IDs, classes, event bindings).
- Ensure the structural integrity of HTML elements remains intact when files are separated.
- Verify that JavaScript global functions do not break.
- Safely test Google Apps Script specific functions locally.

## 2. Approach: Isolated Test Dashboard
- **Trigger Mechanism:** Developers can append `?devTest=1` to the URL, or call `window.__runConnectivityTests()` from the console.
- **UI Element:** A floating, isolated developer panel will appear, displaying live test results.

## 3. Test Cases
### A. Global Libraries & Environments
- [ ] Supabase is loaded (`window.supabase`).
- [ ] jQuery is loaded (`window.$`).
- [ ] Check if `google.script.run` exists (mocks safely with warning if testing locally).

### B. JavaScript Global Functions
- [ ] Verify `showScreen` exists.
- [ ] Verify `goLookup` exists.
- [ ] Verify `goSummary` exists.
- [ ] Verify `openPosApp` exists.
- [ ] Verify `goReport1011` exists.
- [ ] Verify `openRx1011` exists.
- [ ] Verify `reload` exists.
- [ ] Verify `reloadSummary` exists.

### C. Structural DOM Checks
- [ ] Verify `#screen-chooser` exists.
- [ ] Verify `#screen-lookup` exists.
- [ ] Verify `#screen-summary` exists.
- [ ] Verify `#screen-report1011` exists.
- [ ] Verify `#screen-rx1011` exists.
- [ ] Verify `#screen-followup` exists.
- [ ] Verify table `#tbl` exists.
- [ ] Verify table `#sumTbl` exists.
- [ ] Verify table `#fuDueTbl` exists.
- [ ] Verify table `#fuDoneTbl` exists.
- [ ] Verify button `.btn` (general style class) exists.

## 4. Expected Outcomes
- **Green Flag**: All checks pass, proving the monolith structure is fully intact.
- **Warnings**: Optional components or local mocks will appear yellow/orange.
- **Errors**: Missing elements or functions will trigger a red error with the exact name missing, serving as a checklist for things to fix post-refactor.
