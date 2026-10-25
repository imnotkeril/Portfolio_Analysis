@echo off
REM Use classic builder if BuildKit fails with "parent snapshot ... does not exist"
cd /d "%~dp0"
set DOCKER_BUILDKIT=0
set COMPOSE_DOCKER_CLI_BUILD=0
docker compose build --no-cache
if errorlevel 1 exit /b 1
docker compose up
