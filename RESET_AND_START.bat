@echo off
echo.
echo ========================================
echo   COMPLETE RESET AND START
echo ========================================
echo.
echo This will:
echo  1. Stop all servers
echo  2. Delete database
echo  3. Clear build cache
echo  4. Restart fresh server
echo.
pause

cd /d "%~dp0"

echo.
echo [1/4] Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ All servers stopped
) else (
    echo    ℹ No servers were running
)
timeout /t 2 >nul

echo.
echo [2/4] Deleting database...
powershell -Command "if (Test-Path database\teenpatti.db) { Remove-Item database\teenpatti.db -Force; Write-Host '   ✓ Database deleted' } else { Write-Host '   ℹ No database found' }"

echo.
echo [3/4] Clearing build cache...
powershell -Command "if (Test-Path .next) { Remove-Item .next -Recurse -Force; Write-Host '   ✓ Cache cleared' } else { Write-Host '   ℹ No cache found' }"

echo.
echo [4/4] Starting fresh server...
echo    Please wait 10 seconds for initialization...
start cmd /k "npm run dev:unified"
timeout /t 3 >nul

echo.
echo ========================================
echo   ✓ RESET COMPLETE!
echo ========================================
echo.
echo Server is starting in new window...
echo.
echo Wait 10 seconds, then:
echo  1. Hard refresh browser (Ctrl+Shift+R)
echo  2. Open: http://localhost:3000
echo  3. Test Call button!
echo.
echo Server window will remain open.
echo Close that window to stop the server.
echo.
pause

