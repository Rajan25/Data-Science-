# Local validation: Postgres + Redis required (e.g. docker compose up -d with Docker Desktop running).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/linkedin_automation"
$env:REDIS_URL = "redis://127.0.0.1:6379"
$env:JWT_SECRET = "validate-local-secret-change-me"
$env:PORT = "3001"

$logDir = Join-Path $root "scripts"
$logOut = Join-Path $logDir "validate-api.out.log"
$logErr = Join-Path $logDir "validate-api.err.log"
$workerLogOut = Join-Path $logDir "validate-worker.out.log"
$workerLogErr = Join-Path $logDir "validate-worker.err.log"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

Write-Host "== 0) Ensure database exists =="
npm --workspace @lia/api run db:ensure
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "== 1) Migrations =="
npm --workspace @lia/api run db:migrate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "== 2) Start API (background job) =="
# Windows: use cmd.exe. Pass env inside cmd — child processes do not always inherit $env: from this session reliably.
Remove-Item $logOut, $logErr -ErrorAction SilentlyContinue

$db = $env:DATABASE_URL
$redis = $env:REDIS_URL
$jwt = $env:JWT_SECRET
$port = $env:PORT
# cmd: use set "VAR=value" so URL special characters are not mangled; one line for /c.
function Escape-CmdDoubleQuote([string]$s) {
  return $s.Replace('"', '""')
}
$cmdInner =
  'set "DATABASE_URL=' + (Escape-CmdDoubleQuote $db) + '" && ' +
  'set "REDIS_URL=' + (Escape-CmdDoubleQuote $redis) + '" && ' +
  'set "JWT_SECRET=' + (Escape-CmdDoubleQuote $jwt) + '" && ' +
  'set "PORT=' + (Escape-CmdDoubleQuote $port) + '" && ' +
  'cd /d "' + (Escape-CmdDoubleQuote $root) + '" && ' +
  'npm --workspace @lia/api run dev'

$api = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", $cmdInner `
  -WorkingDirectory $root `
  -PassThru `
  -WindowStyle Hidden `
  -RedirectStandardOutput $logOut `
  -RedirectStandardError $logErr

$worker = $null
Remove-Item $workerLogOut, $workerLogErr -ErrorAction SilentlyContinue
$workerCmd =
  'set "DATABASE_URL=' + (Escape-CmdDoubleQuote $db) + '" && ' +
  'set "REDIS_URL=' + (Escape-CmdDoubleQuote $redis) + '" && ' +
  'cd /d "' + (Escape-CmdDoubleQuote $root) + '" && ' +
  'npm --workspace @lia/worker run dev'

Write-Host "== 2b) Start worker (background job) =="
$worker = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", $workerCmd `
  -WorkingDirectory $root `
  -PassThru `
  -WindowStyle Hidden `
  -RedirectStandardOutput $workerLogOut `
  -RedirectStandardError $workerLogErr

Start-Sleep -Seconds 3

function Wait-ApiHealth {
  param([string]$BaseUrl, [int]$MaxSeconds = 90)
  $deadline = (Get-Date).AddSeconds($MaxSeconds)
  while ((Get-Date) -lt $deadline) {
    if ($api.HasExited) {
      throw "API process exited early (exit code $($api.ExitCode)). See $logOut and $logErr"
    }
    try {
      $null = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 2
      return
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  throw "API did not become healthy within ${MaxSeconds}s. See $logOut and $logErr"
}

function Show-ValidateLogs {
  param([string]$OutPath, [string]$ErrPath, [int]$TailLines = 40)
  foreach ($p in @($OutPath, $ErrPath)) {
    if (Test-Path $p) {
      Write-Host "--- tail $p ---"
      Get-Content $p -Tail $TailLines -ErrorAction SilentlyContinue
    }
  }
}

try {
  $base = "http://127.0.0.1:$port"
  Write-Host "== 3) Health (waiting for API, up to 90s) =="
  Wait-ApiHealth -BaseUrl $base -MaxSeconds 90
  Invoke-RestMethod -Uri "$base/health" -Method Get | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/health/db" -Method Get | ConvertTo-Json

  $email = "validate+$([guid]::NewGuid().ToString('N').Substring(0,8))@example.com"
  $body = @{ email = $email; password = "Validate123!"; displayName = "Validate User" } | ConvertTo-Json

  Write-Host "== 4) Register =="
  $reg = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body $body -ContentType "application/json"
  $token = $reg.token
  if (-not $token) { throw "No token from register" }

  $headers = @{ Authorization = "Bearer $token" }

  Write-Host "== 5) Workspace =="
  Invoke-RestMethod -Uri "$base/workspace/me" -Headers $headers -Method Get | ConvertTo-Json -Depth 5

  Write-Host "== 6) Confidentiality event =="
  $ev = @{ eventType = "validation.check"; eventPayload = @{ note = "local validate" } } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/confidentiality/events" -Headers $headers -Method Post -Body $ev -ContentType "application/json" | ConvertTo-Json -Depth 5

  Write-Host "== 7) Job enqueue =="
  $job = @{ jobType = "validation.echo"; payload = @{ hello = "world" } } | ConvertTo-Json
  $jobRes = Invoke-RestMethod -Uri "$base/jobs" -Headers $headers -Method Post -Body $job -ContentType "application/json"
  $jobRes | ConvertTo-Json -Depth 5
  $jobId = $jobRes.jobId
  if (-not $jobId) { throw "No jobId returned from POST /jobs" }

  Write-Host "== 8) Admin audit logs (owner) =="
  Invoke-RestMethod -Uri "$base/admin/audit-logs?limit=10" -Headers $headers -Method Get | ConvertTo-Json -Depth 6

  Write-Host "== 9) Admin migrations status =="
  Invoke-RestMethod -Uri "$base/admin/migrations/status" -Headers $headers -Method Get | ConvertTo-Json -Depth 6

  Write-Host "== 10) Wait for worker job (completed) =="
  $deadline = (Get-Date).AddSeconds(45)
  $done = $false
  while ((Get-Date) -lt $deadline) {
    if ($worker -and $worker.HasExited) {
      throw "Worker process exited early (exit code $($worker.ExitCode)). See $workerLogOut and $workerLogErr"
    }
    $jobsRes = Invoke-RestMethod -Uri "$base/jobs?limit=20" -Headers $headers -Method Get
    $hit = $jobsRes.jobs | Where-Object { $_.id -eq $jobId }
    if ($hit) {
      if ($hit.status -eq "completed") { $done = $true; break }
      if ($hit.status -eq "failed") { throw "Job failed: $($hit.error_message)" }
    }
    Start-Sleep -Seconds 1
  }
  if (-not $done) {
    throw "Job $jobId did not reach status completed within 45s. Check worker logs: $workerLogErr"
  }
  Write-Host "Job $jobId completed OK."

  Write-Host "OK: validation sequence completed."
}
catch {
  Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
  Show-ValidateLogs -OutPath $logOut -ErrPath $logErr
  if ((Test-Path $workerLogOut) -or (Test-Path $workerLogErr)) {
    Write-Host "--- worker ---"
    Show-ValidateLogs -OutPath $workerLogOut -ErrPath $workerLogErr
  }
  throw
}
finally {
  if ($worker -and $worker.Id) {
    & taskkill.exe /PID $worker.Id /T /F 2>$null | Out-Null
  }
  if ($api -and $api.Id) {
    # Kill process tree (cmd + node/tsx) on Windows
    & taskkill.exe /PID $api.Id /T /F 2>$null | Out-Null
  }
}
