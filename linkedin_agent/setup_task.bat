@echo off
echo ================================================
echo   Setting up 4 PM Daily Task (Windows Scheduler)
echo ================================================
echo.

:: Get full path to agent.py
set AGENT_PATH=%~dp0agent.py

:: Get python path
for /f "tokens=*" %%i in ('where python') do set PYTHON_PATH=%%i

echo Agent: %AGENT_PATH%
echo Python: %PYTHON_PATH%
echo Schedule: Every day at 4:00 PM
echo.

:: Create the scheduled task
schtasks /create ^
  /tn "LinkedIn Series Agent" ^
  /tr "\"%PYTHON_PATH%\" \"%AGENT_PATH%\"" ^
  /sc DAILY ^
  /st 16:00 ^
  /f

if %errorlevel% equ 0 (
    echo.
    echo [OK] Task scheduled successfully!
    echo.
    echo Every day at 4:00 PM, the agent will:
    echo   1. Read your Claude conversations from today
    echo   2. Generate a LinkedIn post outline
    echo   3. Email it to you
    echo   4. Save it in the outputs\ folder
    echo.
    echo To view the task: Task Scheduler - Task Scheduler Library
    echo To remove:  schtasks /delete /tn "LinkedIn Series Agent" /f
) else (
    echo.
    echo [ERROR] Failed to create task. Try running as Administrator.
    echo Right-click setup_task.bat and select "Run as administrator"
)

pause
