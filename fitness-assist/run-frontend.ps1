# Starts the Vite dev server on http://localhost:5173 (proxies /api to the backend)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot 'frontend')
if (-not (Test-Path 'node_modules')) { npm install }
npm run dev
