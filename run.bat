@echo off
setlocal

:menu
cls
echo ProjectWeb - Menu
echo.
echo 1. Cai thu vien
echo 2. Chay web
echo 3. Chay web dev
echo 4. Mo web tren trinh duyet
echo 5. Seed du lieu mau
echo 6. Chay test
echo 0. Thoat
echo.
set /p choice=Chon thao tac: 

if "%choice%"=="1" goto install
if "%choice%"=="2" goto start
if "%choice%"=="3" goto dev
if "%choice%"=="4" goto openweb
if "%choice%"=="5" goto seed
if "%choice%"=="6" goto test
if "%choice%"=="0" goto end

echo Lua chon khong hop le.
pause
goto menu

:install
npm install
pause
goto menu

:start
echo.
echo Server se phuc vu ca frontend va API tai:
echo http://localhost:3000/
echo.
echo Khong mo truc tiep file .html de tranh loi dang nhap/session.
echo.
start "" "http://localhost:3000/"
npm start
pause
goto menu

:dev
echo.
echo Server dev se phuc vu ca frontend va API tai:
echo http://localhost:3000/
echo.
echo Khong mo truc tiep file .html de tranh loi dang nhap/session.
echo.
start "" "http://localhost:3000/"
npm run dev
pause
goto menu

:openweb
start "" "http://localhost:3000/"
goto menu

:seed
echo.
echo Seed se reset danh sach san pham Apple va dam bao co tai khoan admin.
echo Tai khoan admin mac dinh: admin / adadad
echo.
call npm run seed
pause
goto menu

:test
npm test
pause
goto menu

:end
endlocal
