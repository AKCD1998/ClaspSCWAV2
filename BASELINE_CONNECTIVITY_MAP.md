# Baseline Connectivity Map

This document maps the critical elements, scripts, and styles currently present in the single `index.html` file before refactoring. It serves as a baseline for connectivity tests.

## 1. Global Libraries
- **Supabase**: `window.supabase` (from CDN)
- **jQuery**: `window.$` (from CDN)
- **LoadingOverlay**: `$.LoadingOverlaySetup`, `$.fn.LoadingOverlay`

## 2. Core JavaScript Functions
- **Navigation/Screen Management**: `openPosApp`, `goLookup`, `openRx1011`, `goReport1011`, `goHome`, `goSummary`, `goFollowup`, `showScreen`
- **Data Loaders**: `reload`, `reloadSummary`, `loadKpis`
- **Utility**: `showOverlay`, `hideOverlay`, `withOverlay`

## 3. Key DOM Elements
### Main Screens (Containers)
- `#screen-chooser`: Menu screen
- `#screen-lookup`: Database search and table
- `#screen-report1011`: iFrame for Report 10/11
- `#screen-rx1011`: iFrame for Rx1011
- `#screen-summary`: KPI and summary dashboard
- `#screen-followup`: Follow-up calls

### Key Tables
- `#tbl`: Lookup datatable
- `#sumTbl`: Summary datatable
- `#fuDueTbl`: Follow-up due table
- `#fuDoneTbl`: Follow-up completed table

### Important Inputs & Controls
- `#branchFilter`, `#sumBranch`: Branch selectors
- `#q`, `#sumSearch`: Search inputs
- `#minDate`, `#maxDate`: Range filters

## 4. Google Apps Script specific
- Expectation of `google.script.run` usage for server-side HTML template rendering. Currently visible in `goReport1011` and `openRx1011` via `.getReport1011Html()` and `.getRx1011Html()`.
- The baseline test checks if `google.script.run` is present, or safely mocks it for local environment tests.
