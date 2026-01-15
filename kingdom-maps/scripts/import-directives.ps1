Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("ghostfire-ops","activate-the-kingdom")]
  [string]$Name
)

cd "$PSScriptRoot\.."

function Fail([string]$m){ Write-Error $m; exit 1 }

$mapPath = switch ($Name) {
  "ghostfire-ops"          { "maps\10-ghostfire-ops\README.md" }
  "activate-the-kingdom"   { "maps\20-activate-the-kingdom\README.md" }
}

$directivesPath = "directives\$Name.md"

Write-Host ""
Write-Host "COPY the FULL directives text to your clipboard now."
Write-Host "Then press Enter here."
[void](Read-Host)

$text = Get-Clipboard -Raw
if (-not $text) { Fail "Clipboard empty." }

$min = 600
if ($text.Trim().Length -lt $min) { Fail "Clipboard too small (<$min chars). Copy the FULL directives." }

$ban = @("Paste the ","PASTE THE FULL","Include:","...paste directives...")
foreach ($b in $ban) { if ($text -like "*$b*") { Fail "Clipboard contains placeholder text ($b). Copy the real directives." } }

New-Item -ItemType Directory -Force -Path (Split-Path $mapPath), (Split-Path $directivesPath) | Out-Null

# Write UTF-8
$text | Set-Content -Encoding utf8 -Force $mapPath
$text | Set-Content -Encoding utf8 -Force $directivesPath

Write-Host "WROTE:"
Write-Host " - $mapPath"
Write-Host " - $directivesPath"
