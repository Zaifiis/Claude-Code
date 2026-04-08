@echo off
echo ================================================
echo   LinkedIn Series Agent - Running Now
echo ================================================
echo.

python "%~dp0agent.py"

echo.
if %errorlevel% equ 0 (
    echo [DONE] Check your inbox and the outputs\ folder.
) else (
    echo [ERROR] Something went wrong. Check the output above.
)

pause
