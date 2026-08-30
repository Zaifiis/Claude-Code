@echo off
echo ================================================
echo   Shopify Pakistan Leads Agent - Running Now
echo ================================================
echo.

python "%~dp0agent.py" %*

echo.
if %errorlevel% equ 0 (
    echo [DONE] Check the outputs\ folder for the CSV.
) else (
    echo [ERROR] Something went wrong. Check the output above.
)

pause
