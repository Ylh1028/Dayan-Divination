$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$expected = Join-Path $root 'models\qwen3.5-2b-Q4_K_M.gguf'
$matches = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'llama-server.exe' -and $_.CommandLine -like "*$expected*" }
foreach ($p in $matches) { Stop-Process -Id $p.ProcessId -ErrorAction Stop; "Stopped project Qwen PID $($p.ProcessId)" }
if (-not $matches) { 'No project-owned Qwen process found.' }
