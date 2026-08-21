# Uro All Around — Local Database Backup Script
# Run: powershell -ExecutionPolicy Bypass -File backup.ps1

$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$src     = Join-Path $root "uro.db"
$backDir = Join-Path $root "_backups"
$stamp   = Get-Date -Format "yyyyMMdd_HHmmss"
$dst     = Join-Path $backDir "uro_$stamp.db"

if (-not (Test-Path $backDir)) { New-Item -ItemType Directory $backDir | Out-Null }

Copy-Item $src $dst
Write-Host "Backup saved: $dst"

# Keep only the latest 30 backups
$files = Get-ChildItem $backDir -Filter "uro_*.db" | Sort-Object LastWriteTime -Descending
if ($files.Count -gt 30) {
    $files | Select-Object -Skip 30 | ForEach-Object {
        Remove-Item $_.FullName
        Write-Host "Removed old backup: $($_.Name)"
    }
}

Write-Host "Done. Total backups: $(($files | Select-Object -First 30).Count)"
