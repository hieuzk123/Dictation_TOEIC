@echo off
echo Starting MySQL Server for TOEIC Dictation...
if exist "D:\xampp\mysql\bin\mysqld.exe" (
    echo Starting MySQL from XAMPP...
    "D:\xampp\mysql\bin\mysqld.exe" --defaults-file="D:\xampp\mysql\bin\my.ini" --standalone
) else if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" (
    if exist "C:\Users\Doan Hieu\mysql_data\my.ini" (
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="C:\Users\Doan Hieu\mysql_data\my.ini"
    ) else if exist "C:\Users\Hieu\mysql_data\my.ini" (
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="C:\Users\Hieu\mysql_data\my.ini"
    ) else (
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
    )
) else (
    echo MySQL executable not found. Please start MySQL manually or via XAMPP Control Panel.
)
