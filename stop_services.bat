@echo off
chcp 65001 >nul
echo ========================================================
echo   TOEIC DICTATION - DỪNG CÁC DỊCH VỤ & GIẢI PHÓNG RAM
echo ========================================================
echo.

echo [1/3] Đang tắt Backend Spring Boot (Port 8080)...
powershell -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" 2>nul
echo     -> Đã giải phóng cổng 8080.

echo.
echo [2/3] Đang tắt Frontend Vite Server (Port 5173)...
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" 2>nul
echo     -> Đã giải phóng cổng 5173.

echo.
echo [3/3] Tùy chọn dừng MySQL Daemon (Port 3306):
set /p stop_mysql="Ban co muon dong luon MySQL khong? (Y/N, mac dinh N): "
if /i "%stop_mysql%"=="Y" (
    taskkill /F /IM mysqld.exe >nul 2>&1
    echo     -> Đã tắt MySQL mysqld.exe.
) else (
    echo     -> Giữ nguyên MySQL service.
)

echo.
echo ========================================================
echo   HOÀN TẤT! Đã đóng các cổng và giải phóng RAM thành công.
echo ========================================================
pause
