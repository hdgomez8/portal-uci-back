param(
  [Parameter(Mandatory=$true)][string]$InputXlsx,
  [Parameter(Mandatory=$true)][string]$OutputPdf
)

$excel = $null
$wb = $null
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $wb = $excel.Workbooks.Open($InputXlsx)
  # 0 = xlTypePDF
  $wb.ExportAsFixedFormat(0, $OutputPdf)
  Write-Output "OK"
} catch {
  Write-Error $_
  exit 1
} finally {
  if ($wb) { $wb.Close($false) }
  if ($excel) { $excel.Quit() }
} 