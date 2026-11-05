# Starts the Spring Boot API on http://localhost:8080
# Reads configuration from .env (copy .env.example if you don't have one yet).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$envFile = Join-Path $PSScriptRoot '.env'
if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
        if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
        $name, $value = $line -split '=', 2
        Set-Item -Path "Env:\$($name.Trim())" -Value $value.Trim()
    }
} else {
    Write-Warning "No .env found; falling back to the defaults in application.yml."
}

Set-Location (Join-Path $PSScriptRoot 'backend')
& .\mvnw.cmd spring-boot:run
