@echo off
echo.
echo ========================================
echo   QUICK FIX FOR CALL BUTTON ERROR
echo ========================================
echo.
echo This will:
echo  1. Stop server
echo  2. Delete database
echo  3. Clear build cache
echo  4. Restart fresh
echo.
pause

cd /d "%~dp0"

echo.
echo [1/5] Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Stopped
) else (
    echo    ℹ No processes running
)
timeout /t 2 >nul

echo.
echo [2/5] Deleting database...
if exist database\teenpatti.db (
    del /F database\teenpatti.db
    echo    ✓ Database deleted
) else (
    echo    ℹ No database found
)

echo.
echo [3/5] Clearing build cache...
if exist .next (
    rmdir /s /q .next
    echo    ✓ Build cache cleared
) else (
    echo    ℹ No cache found
)

echo.
echo [4/5] Starting server...
start cmd /k "npm run dev:unified"
timeout /t 3 >nul

echo.
echo [5/5] Done!
echo.
echo ========================================
echo   ✓ QUICK FIX COMPLETE!
echo ========================================
echo.
echo Wait 10 seconds for server to start,
echo then open: http://localhost:3000
echo.
echo Server is running in new window.
echo.
pause

