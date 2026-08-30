param(
  [string]$OutputName = "MANARA_CongressX_2026.pdf"
)

$submissionRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $submissionRoot "MANARA_CongressX_2026.html"
$pdfPath = Join-Path $submissionRoot $OutputName
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$renderProfile = Join-Path $env:TEMP "manara-congressx-pdf-render-$PID"
$htmlUri = "file:///" + ($htmlPath -replace "\\", "/" -replace " ", "%20")

if (-not (Test-Path -LiteralPath $edgePath)) {
  throw "Microsoft Edge was not found at the expected path."
}

if (Test-Path -LiteralPath $pdfPath) {
  Remove-Item -LiteralPath $pdfPath -Force
}

& $edgePath `
  --headless=new `
  --disable-gpu `
  --no-pdf-header-footer `
  --run-all-compositor-stages-before-draw `
  --virtual-time-budget=3000 `
  --user-data-dir="$renderProfile" `
  --print-to-pdf="$pdfPath" `
  $htmlUri

for ($attempt = 0; $attempt -lt 120 -and -not (Test-Path -LiteralPath $pdfPath); $attempt += 1) {
  Start-Sleep -Milliseconds 250
}

if (-not (Test-Path -LiteralPath $pdfPath) -or (Get-Item -LiteralPath $pdfPath).Length -eq 0) {
  throw "PDF export failed."
}

if (Test-Path -LiteralPath $renderProfile) {
  Remove-Item -LiteralPath $renderProfile -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output $pdfPath
