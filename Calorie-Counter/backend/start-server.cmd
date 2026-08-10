@echo off
cd /d "%~dp0"
start /b "" ".venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "%TEMP%\naijacounts-uvicorn.log" 2>&1