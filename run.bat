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
echo 7. Huong dan su dung
echo 0. Thoat
echo.
set /p choice=Chon thao tac: 

if "%choice%"=="1" goto install
if "%choice%"=="2" goto start
if "%choice%"=="3" goto dev
if "%choice%"=="4" goto openweb
if "%choice%"=="5" goto seed
if "%choice%"=="6" goto test
if "%choice%"=="7" goto guide
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

:guide
echo ==============================================================
echo             HUONG DAN CAI DAT VA SU DUNG PROJECT
echo ==============================================================
echo Yeu cau he thong:
echo 1. Da cai dat Node.js tren may tinh.
echo 2. Da cai dat MongoDB va dang chay o localhost:27017.
echo.
echo Cac buoc thuc hien de chay ung dung:
echo Buoc 1. Chon option 1 "Cai thu vien" de npm tai cac thu vien (mongoose, etc).
echo Buoc 2. Chon option 5 "Seed du lieu mau" de reset va khoi tao lai
echo        danh sach san pham Apple va tai khoan quan tri.
echo Buoc 3. Chon option 2 hoac 3 de bat dau chay server tai port 3000.
echo Buoc 4. Chon option 4 de tu dong mo trinh duyet truy cap website:
echo        http://localhost:3000/
echo.
echo Tai khoan dang nhap mac dinh sau khi seed:
echo - Admin: admin / adadad
echo - Khach hang: khachhang / 123456
echo ==============================================================
pause
goto menu

:end
endlocal
