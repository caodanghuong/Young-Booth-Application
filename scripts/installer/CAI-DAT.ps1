# ==========================================================================================
#  YOUNGBOOTH — CÀI ĐẶT TRÊN MÁY MỚI (chạy từ thư mục bộ cài, quyền Administrator)
#  1) Cài app YoungBooth          2) Chép khung ảnh vào C:\YoungBooth-Frames
#  3) Chép dữ liệu cài đặt (sự kiện, giá, PIN)     4) Cài driver + thiết lập máy in DNP DS-RX1 (nếu có)
#  Chạy lại nhiều lần vẫn an toàn (dữ liệu cũ trên máy được sao lưu trước khi ghi đè).
# ==========================================================================================
#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$Here   = $PSScriptRoot
$Stamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
function Step($n, $t) { Write-Host ''; Write-Host "=== $n. $t ===" -ForegroundColor Cyan }
function Ok($t)   { Write-Host "  [OK] $t" -ForegroundColor Green }
function Warn($t) { Write-Host "  [!]  $t" -ForegroundColor Yellow }
function Ask($q)  { $a = Read-Host "  $q (Y/N)"; return $a -match '^[YyCc]' }

# ---- 1. App
Step 1 'Cài app YoungBooth'
$setup = Get-ChildItem $Here -Filter 'YoungBooth Setup *.exe' | Sort-Object Name -Descending | Select-Object -First 1
if (-not $setup) { throw 'Không thấy file "YoungBooth Setup *.exe" trong thư mục bộ cài.' }
Get-Process YoungBooth -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process $setup.FullName -ArgumentList '/S' -Wait          # cài im lặng vào thư mục mặc định
$exe = Join-Path $env:LOCALAPPDATA 'Programs\YoungBooth\YoungBooth.exe'
if (Test-Path $exe) { Ok "Đã cài: $exe" } else { Warn 'Không thấy YoungBooth.exe sau khi cài — chạy tay file Setup để cài.' }

# ---- 2. Khung ảnh
Step 2 'Chép khung ảnh vào C:\YoungBooth-Frames'
$src = Join-Path $Here 'YoungBooth-Frames'
$dst = 'C:\YoungBooth-Frames'
if (Test-Path $dst) {
  $bak = "C:\YoungBooth-Frames-cu-$Stamp"
  Copy-Item $dst $bak -Recurse
  Ok "Thư mục khung cũ đã sao lưu: $bak"
}
New-Item -ItemType Directory -Force $dst | Out-Null
Copy-Item (Join-Path $src '*') $dst -Recurse -Force
Ok ("Đã chép {0} file khung" -f (Get-ChildItem $dst -Recurse -File).Count)

# ---- 3. Dữ liệu cài đặt (sự kiện, giá, thanh toán, PIN)
Step 3 'Chép dữ liệu cài đặt (sự kiện, giá, PIN)'
$set = Join-Path $Here 'Du-lieu-cai-dat\booth-settings.json'
$ud  = Join-Path $env:APPDATA 'YoungBooth'
if (Test-Path $set) {
  New-Item -ItemType Directory -Force $ud | Out-Null
  $cur = Join-Path $ud 'booth-settings.json'
  $go = $true
  if (Test-Path $cur) {
    $go = Ask 'Máy này đã có cài đặt YoungBooth. Ghi đè bằng cài đặt trong bộ cài?'
    if ($go) { Copy-Item $cur "$cur.bak-$Stamp"; Ok "Cài đặt cũ đã sao lưu: $cur.bak-$Stamp" }
  }
  if ($go) { Copy-Item $set $cur -Force; Ok 'Đã chép sự kiện, giá, PIN.' } else { Warn 'Giữ cài đặt đang có trên máy.' }
} else { Warn 'Bộ cài không có booth-settings.json — app dùng cài đặt mặc định (PIN 1234).' }

# ---- 4. Máy in DNP
Step 4 'Máy in DNP DS-RX1'
if (Ask 'Có dùng máy in DNP DS-RX1 trên máy này không? (đã cắm USB + bật máy in)') {
  $inf = Join-Path $Here 'May-in-DNP\DNP-DS-RX1-Driver\dsrx1.inf'
  if (Test-Path $inf) {
    pnputil /add-driver "$inf" /install | Out-Host
    Ok 'Đã nạp driver DNP. Chờ Windows nhận máy in...'
  }
  $p = $null
  for ($i = 0; $i -lt 30 -and -not $p; $i++) { $p = Get-Printer -Name 'DS-RX1' -ErrorAction SilentlyContinue; if (-not $p) { Start-Sleep 2 } }
  if ($p) {
    & (Join-Path $Here 'May-in-DNP\setup-dnp.ps1')
    Ok 'Đã tạo 2 hàng in: "DS-RX1" (4x6) và "DS-RX1 (2inch cut)" (dải Nhật Ký).'
  } else {
    Warn 'Chưa thấy máy in "DS-RX1". Kiểm tra cáp USB / bật máy in, rồi chạy lại file này (hoặc chạy May-in-DNP\setup-dnp.ps1).'
  }
} else { Warn 'Bỏ qua máy in.' }

# ---- Xong
Step 5 'Hoàn tất'
if (Test-Path $exe) {
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  Start-Process $exe
  Ok 'Đã mở YoungBooth (từ giờ app tự chạy cùng Windows).'
}
Write-Host ''
Write-Host '  Việc còn lại: mở Cài đặt trong app (giữ góc phải-trên 3 giây → PIN) → chọn máy in "DS-RX1"' -ForegroundColor White
Write-Host '  cho ảnh 4x6 và "DS-RX1 (2inch cut)" cho dải → Lưu. Xem HUONG-DAN-CAI-MAY-MOI.txt.' -ForegroundColor White
Read-Host '  Nhấn Enter để đóng'
