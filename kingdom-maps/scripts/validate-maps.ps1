Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

cd "$PSScriptRoot\.."

$top = (git rev-parse --show-toplevel).Trim().Replace('/','\')
$expected = (Join-Path $HOME 'src\Kingdom-OS')
if ($top -ne $expected) { throw "Unexpected repo root: $top (expected: $expected)" }

$targets = @(
  "maps\10-ghostfire-ops\README.md",
  "maps\20-activate-the-kingdom\README.md"
)

function Fail([string]$m){ Write-Error $m; exit 1 }

$min = 600
$ban = @(
  "Paste the ",
  "PASTE THE FULL",
  "Include:",
  "...paste directives..."
)

foreach ($f in $targets) {
  if (-not (Test-Path $f)) { Fail "Missing: $f" }
  $raw = Get-Content $f -Raw
  if ($raw.Trim().Length -lt $min) { Fail "Too small (<$min chars): $f" }
  foreach ($b in $ban) { if ($raw -like "*$b*") { Fail "Placeholder text present ($b): $f" } }
}

Write-Host "OK: directives look real"
