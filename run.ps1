# Run PO extractor using venv
# Usage: .\run.ps1 [--input "sample data"] [--output path.xlsx]
& "$PSScriptRoot\venv\Scripts\Activate.ps1"
python "$PSScriptRoot\po_extractor.py" @args
