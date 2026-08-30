@echo off
echo ================================================
echo   Setting up 9 AM Daily Task (Windows Scheduler)
echo ================================================
echo.

set AGENT_PATH=%~dp0agent.py

for /f "tokens=*" %%i in ('where python') do set PYTHON_PATH=%%i

echo Agent: %AGENT_PATH%
echo Python: %PYTHON_PATH%
echo Schedule: Every day at 9:00 AM
echo.

schtasks /create ^
  /tn "Shopify Pakistan Leads Agent" ^
  /tr "\"%PYTHON_PATH%\" \"%AGENT_PATH%\"" ^
  /sc DAILY ^
  /st 09:00 ^
  /f

if %errorlevel% equ 0 (
    echo.
    echo [OK] Task scheduled successfully!
    echo.
    echo Every day at 9:00 AM, the agent will:
    echo   1. Search for candidate Shopify stores in Pakistan
    echo   2. Verify each one live and scrape published contact info
    echo   3. Save a CSV in outputs\ (and email it, if configured)
    echo.
    echo To view the task: Task Scheduler - Task Scheduler Library
    echo To remove:  schtasks /delete /tn "Shopify Pakistan Leads Agent" /f
) else (
    echo.
    echo [ERROR] Failed to create task. Try running as Administrator.
    echo Right-click setup_task.bat and select "Run as administrator"
)

pause
