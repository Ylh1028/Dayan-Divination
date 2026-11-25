$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$model = Join-Path $root 'models\qwen3.5-2b-Q4_K_M.gguf'
$server = Join-Path $root 'tools\llama.cpp\llama-server.exe'
$cache = Join-Path $root 'cache'
$logs = Join-Path $root 'logs'
foreach ($p in @($model,$server)) { if (-not (Test-Path -LiteralPath $p)) { throw "Required file missing: $p" } }
$env:TEMP = Join-Path $root 'temp'; $env:TMP = $env:TEMP
$env:LLAMA_CACHE = $cache; $env:HF_HOME = Join-Path $cache 'huggingface'
$env:HF_HUB_CACHE = Join-Path $env:HF_HOME 'hub'; $env:HF_XET_CACHE = Join-Path $env:HF_HOME 'xet'
$port = 19331
$existing = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'llama-server.exe' -and $_.CommandLine -like "*$model*" }
if ($existing) { "Already running on port detected: $($existing.ProcessId)"; return }
$log = Join-Path $logs 'qwen-server.stdout.log'
$err = Join-Path $logs 'qwen-server.stderr.log'
$portOwner = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
if ($portOwner) { throw "Port $port is already in use. Stop the occupying process safely before starting Qwen." }
$args = @('--model',$model,'--host','127.0.0.1','--port',"$port",'--ctx-size','4096','--threads','4','--device','none','--reasoning-format','none','--reasoning-budget','0','--no-webui')
$p = Start-Process -FilePath $server -ArgumentList $args -WorkingDirectory (Split-Path $server) -WindowStyle Hidden -PassThru -RedirectStandardOutput $log -RedirectStandardError $err
$deadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $deadline) { if ($p.HasExited) { throw "llama-server exited with code $($p.ExitCode); see $log" }; try { $h = Invoke-RestMethod "http://127.0.0.1:$port/health" -TimeoutSec 2; "PID=$($p.Id) PORT=$port HEALTHY=$($h | ConvertTo-Json -Compress)"; exit 0 } catch { Start-Sleep -Seconds 2 } }
throw "Server health timeout; see $log and $err"
