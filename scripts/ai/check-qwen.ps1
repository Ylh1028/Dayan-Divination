$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$model = Join-Path $root 'models\qwen3.5-2b-Q4_K_M.gguf'
$server = Join-Path $root 'tools\llama.cpp\llama-server.exe'
$hash = if (Test-Path $model) { (Get-FileHash $model -Algorithm SHA256).Hash.ToLower() } else { 'MISSING' }
$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'llama-server.exe' -and $_.CommandLine -like "*$model*" }
[pscustomobject]@{ ModelPath=$model; ModelExists=(Test-Path $model); SHA256=$hash; ServerPath=$server; ServerExists=(Test-Path $server); Version=if(Test-Path $server){ (& $server --version 2>&1 | Select-Object -First 1) }else{'MISSING'}; PIDs=($procs.ProcessId -join ',') } | Format-List
foreach ($p in $procs) { if ($p.CommandLine -match '--port\s+(\d+)') { $port=$Matches[1]; try { Invoke-RestMethod "http://127.0.0.1:$port/health" -TimeoutSec 3 | ConvertTo-Json -Compress } catch { "Unhealthy port $port" } } }
