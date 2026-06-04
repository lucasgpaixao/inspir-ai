# Sincroniza variáveis Supabase do .env para a Vercel (Production + Development).
# Uso: após rotacionar chaves no painel Supabase, atualize o .env e execute:
#   .\scripts\sync-supabase-env.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Get-EnvValue([string]$Name) {
  $line = Get-Content .env | Where-Object { $_ -match "^${Name}=" } | Select-Object -First 1
  if (-not $line) { throw "Variável $Name não encontrada no .env" }
  return ($line -replace "^${Name}=", "").Trim()
}

$vars = @(
  @{ Name = "NEXT_PUBLIC_SUPABASE_URL"; Sensitive = $false },
  @{ Name = "NEXT_PUBLIC_SUPABASE_ANON_KEY"; Sensitive = $false },
  @{ Name = "SUPABASE_SERVICE_ROLE_KEY"; Sensitive = $true }
)

foreach ($v in $vars) {
  $value = Get-EnvValue $v.Name
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$($v.Name) está vazio no .env. Cole a chave nova do Supabase antes de sincronizar."
  }

  foreach ($target in @("production", "development")) {
    vercel env remove $v.Name $target --yes 2>$null | Out-Null
    $args = @("env", "add", $v.Name, $target, "--yes")
    if ($v.Sensitive -and $target -eq "production") {
      $args += "--sensitive"
    }
    $value | vercel @args 2>&1 | Out-Null
    Write-Host "OK $($v.Name) -> $target"
  }
}

Write-Host ""
Write-Host "Concluído. Rode: vercel deploy --prod --yes"
