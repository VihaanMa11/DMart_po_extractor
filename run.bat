@echo off
REM Run PO extractor using venv
REM Usage: run.bat [--input "sample data"] [--output path.xlsx]
call "%~dp0venv\Scripts\activate.bat"
python "%~dp0po_extractor.py" %*
