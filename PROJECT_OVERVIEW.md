# Project Overview

## What This Project Appears To Be

This is a Google Apps Script HTML Service web app for CiPData workflows. The main `index.html` page is a multi-screen client UI backed by Supabase and Apps Script server functions.

The app currently includes:

- A chooser screen for entering major workflows.
- A CiPData lookup screen with branch filtering, date filtering, paging, KPI counts, and encounter close-up details.
- A drug quantity summary screen with presets and CSV export.
- A follow-up call workflow for patients due on a selected date.
- Report generation controls for ขย. 10/11 style reports.
- Embedded iframe workflows for `report1011.html` and `rx1011.html` loaded through `google.script.run`.

## Main Screens And Workflows

- `screen-chooser`: Landing chooser with buttons for POS, lookup, Rx1011, and report workflow.
- `screen-lookup`: Main lookup table for `v_encounters_lookup_ui`, including search, branch/date filters, pagination, KPI panel, and report modal.
- `screen-summary`: SKU quantity summary from the `sku_qty_summary` Supabase RPC, with date presets, branch filter, hide-zero toggle, text search, and CSV export.
- `screen-followup`: Follow-up call queue by date and branch, with local in-page status tracking and JSON export.
- `screen-report1011`: iframe populated by Apps Script `getReport1011Html()`.
- `screen-rx1011`: iframe populated by Apps Script `getRx1011Html()`.
- `amed-closeup`: included close-up UI from `closeup.html`, opened from lookup table row menu buttons.

## Important Client Functions

- `reload(page)`: Loads lookup rows from Supabase, applies filters, renders the table, and refreshes KPIs.
- `render(res)`: Renders lookup table rows and paging info.
- `loadKpis()`: Loads today/accumulated KPI counts and monthly target calculations.
- `openReportModal()`, `createReport()`: Prepare report inputs and call Apps Script `generateReport(opts)`.
- `goReport1011()`, `openRx1011()`: Load server-rendered HTML into iframes through `google.script.run`.
- `ensureSummaryInit()`, `reloadSummary()`, `renderSummary()`, `exportSummaryCsv()`: Summary workflow.
- `goFollowup()`: Initializes the follow-up workflow and loads due calls.
- `openAmedCloseup()`, `LookupNav`: Open close-up details and navigate between lookup rows/pages.
- `withOverlay()`: Shared LoadingOverlay wrapper for async workflows.

## File Structure After This Refactor

- `index.html`: Main DOM structure, external CDN dependencies, Supabase template config, Apps Script includes for extracted CSS/JS.
- `index_styles.html`: Apps Script include copy of CSS extracted from `index.html`.
- `index_app_scripts.html`: Apps Script include copy of client JavaScript extracted from `index.html`.
- `assets/css/index.css`: Local-preview CSS asset matching `index_styles.html`.
- `assets/js/app.js`: Local-preview JavaScript asset matching `index_app_scripts.html`.
- `local/server.js`: Lightweight local preview server that renders Apps Script includes for browser preview.
- `local/mock-google-script.js`: Minimal local mock for `google.script.run` calls.
- `package.json`: Adds `npm run dev` for local preview.
- `.claspignore`: Keeps local preview assets and tooling out of Apps Script deployment while allowing extracted Apps Script include files to be pushed.

## What Changed

- Moved the index-specific CSS that was embedded in `index.html` into extracted files.
- Moved all client-side JavaScript blocks from `index.html` into extracted files.
- Kept the Supabase initialization inline in `index.html` because it depends on Apps Script template variables:
  - `<?= SUPABASE_URL ?>`
  - `<?= SUPABASE_KEY ?>`
- Preserved existing HTML structure, IDs, classes, inline event handlers, Apps Script template syntax, Supabase calls, and `google.script.run` calls.
- Added a no-dependency local preview server.

## What Was Intentionally Not Changed

- Business logic was not rewritten.
- Existing inline event handlers were preserved to reduce behavior risk.
- Existing IDs/classes were not renamed.
- Existing Supabase table/view/RPC names were not changed.
- Existing Apps Script server function names were not changed.
- Existing project files other than `index.html` were not refactored.

## Local Preview

Run:

```powershell
npm run dev
```

Then open:

```text
http://localhost:5173
```

Optional environment variables:

```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_KEY="your-anon-key"
npm run dev
```

Without real Supabase credentials, the UI can still be opened locally, but data-loading workflows will not return real data. Apps Script functions are mocked by `local/mock-google-script.js` only for local preview and are not included in production Apps Script output.

## Deploy / Clasp Notes

The Apps Script-compatible entry point remains `index.html`.

Use the normal clasp workflow:

```powershell
clasp status
clasp push
```

The extracted Apps Script include files are `index_styles.html` and `index_app_scripts.html`. They should be pushed with the project because `index.html` includes them through Apps Script template syntax.

## Manual Test Checklist

- Open local preview and confirm the chooser screen renders.
- Open lookup screen and confirm table controls, branch/date filters, paging, KPI modal, and close-up menu still respond.
- Test report modal open/close, report type switching, filters, and create report flow after deployment.
- Test summary screen presets, branch filter, search, hide-zero toggle, and CSV export.
- Test follow-up screen date/branch filtering, status modal, undo, and JSON export.
- Test `report1011` iframe and `rx1011` iframe after deploying to Apps Script because those depend on real `google.script.run`.
- After `clasp push`, open the deployed Apps Script web app and verify `include('index_styles')` and `include('index_app_scripts')` resolve correctly.

## Known Risks

- `assets/css/index.css` and `assets/js/app.js` are local-preview mirrors of the Apps Script include files. Keep them in sync when editing.
- Local preview mocks `google.script.run`; it cannot fully validate Apps Script server behavior.
- Real Supabase queries require valid `SUPABASE_URL` and `SUPABASE_KEY`.
- Browser-level visual testing was limited to server/render checks unless a full browser test runner is added later.
