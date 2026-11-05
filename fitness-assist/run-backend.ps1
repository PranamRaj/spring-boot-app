# Starts the Spring Boot API on http://localhost:8080
#
# Local database credentials come from backend/config/application.yml, which
# Spring Boot loads automatically -- copy config/application.yml.example to
# config/application.yml first if you haven't.
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot 'backend')

if (-not (Test-Path 'config\application.yml')) {
    Write-Warning "backend\config\application.yml is missing; falling back to the defaults in src\main\resources\application.yml (which will fail if your MySQL password isn't 'root'). Copy config\application.yml.example to get started."
}

& .\mvnw.cmd spring-boot:run
