# Chooser Web

React/Vite shell for the CiPData chooser page. This app is intended to replace the Apps Script-hosted landing menu first, while the deeper workflows still point to existing destinations.

## Run locally

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Environment

Copy `.env.example` to `.env` and update links as needed. Each external destination is now centralized in one config layer instead of being hardcoded inside GAS UI scripts.
