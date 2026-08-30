@echo off
echo ================================================
echo   Shopify Pakistan Leads Agent - Windows Installer
echo ================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Download from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)

echo [OK] Python found.

echo.
echo Installing dependencies...
pip install -r "%~dp0requirements.txt" -q
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo [OK] Dependencies installed.

if not exist "%~dp0.env" (
    copy "%~dp0.env.example" "%~dp0.env" >nul
    echo.
    echo [ACTION REQUIRED] Open .env and (optionally) fill in:
    echo   - SERPAPI_KEY   (for live search; without it, only seed_domains.csv is used)
    echo   - GMAIL_USER / GMAIL_APP_PASSWORD / NOTIFY_EMAIL   (to email yourself the CSV)
    echo.
    echo Opening .env in Notepad...
    notepad "%~dp0.env"
) else (
    echo [OK] .env already exists.
)

echo.
echo ================================================
echo   Installation complete!
echo   Next: Run run.bat to test right now
echo   Or:   Run setup_task.bat to schedule a daily run
echo ================================================
pause
