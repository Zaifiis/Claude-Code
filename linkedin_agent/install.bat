@echo off
echo ================================================
echo   LinkedIn Series Agent - Windows Installer
echo ================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Download from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)

echo [OK] Python found.

:: Check Claude CLI
claude --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Claude Code CLI is not installed.
    echo Run this in PowerShell: npm install -g @anthropic-ai/claude-code
    echo Then run: claude   (to log in)
    pause
    exit /b 1
)

echo [OK] Claude CLI found.

:: Install python-dotenv
echo.
echo Installing python-dotenv...
pip install python-dotenv -q
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install python-dotenv.
    pause
    exit /b 1
)

echo [OK] python-dotenv installed.

:: Copy .env if not exists
if not exist "%~dp0.env" (
    copy "%~dp0.env.example" "%~dp0.env" >nul
    echo.
    echo [ACTION REQUIRED] Open .env and fill in your Gmail credentials:
    echo   - GMAIL_USER
    echo   - GMAIL_APP_PASSWORD
    echo   - NOTIFY_EMAIL
    echo.
    echo Opening .env in Notepad...
    notepad "%~dp0.env"
) else (
    echo [OK] .env already exists.
)

echo.
echo ================================================
echo   Installation complete!
echo   Next: Run setup_task.bat to schedule 4 PM job
echo   Or:   Run run.bat to test right now
echo ================================================
pause
