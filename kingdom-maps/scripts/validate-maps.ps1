Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

cd "$PSScriptRoot\.."

$top = (git rev-parse --show-toplevel).Trim().Replace('/','\')
$expected = (Join-Path $HOME 'src\Kingdom-OS')
if ($top -ne $expected) { throw "Unexpected repo root: $top (expected: $expected)" }

$gfo = "maps\10-ghostfire-ops\README.md"
$atk = "maps\20-activate-the-kingdom\README.md"

function Fail([string]$m){ Write-Error $m; exit 1 }

foreach ($f in @($gfo,$atk)) {
  if (-not (Test-Path $f)) { Fail "Missing: $f" }
  $raw = Get-Content $f -Raw
  if ($raw.Trim().Length -lt 400) { Fail "Too small (<400 chars): $f (paste real directives)" }
  if ($raw -match 'Paste the ') { Fail "Template marker still present: $f" }
}

Write-Host "OK: repo + directives present"
