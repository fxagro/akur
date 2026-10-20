# db-tunnel.ps1
# Buka SSH tunnel ke PostgreSQL yang ada di VPS.
# Jalankan di terminal terpisah dan biarkan terbuka selama development.
#
#   powershell -ExecutionPolicy Bypass -File .\scripts\db-tunnel.ps1

$VpsHost    = "62.171.183.236"
$VpsPort    = 48622
$VpsUser    = "root"
$LocalPort  = 15432
$RemotePort = 15432

Write-Host "Tunnel 127.0.0.1:$LocalPort -> ${VpsHost}:$RemotePort (Ctrl+C untuk stop)" -ForegroundColor Cyan

ssh -p $VpsPort `
    -o ExitOnForwardFailure=yes `
    -o ServerAliveInterval=30 `
    -o ServerAliveCountMax=3 `
    -o TCPKeepAlive=yes `
    -L "${LocalPort}:127.0.0.1:${RemotePort}" `
    -N "$VpsUser@$VpsHost"
