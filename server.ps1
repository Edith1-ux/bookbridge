# ==========================================================================
# BOOK BRIDGE - NATIVE POWERSHELL LOCAL WEB SERVER
# ==========================================================================

param (
    [int]$Port = 8080
)

$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$prefix1 = "http://127.0.0.1:$Port/"
$prefix2 = "http://localhost:$Port/"

try {
    $listener.Prefixes.Add($prefix1)
    try { $listener.Prefixes.Add($prefix2) } catch {}
    $listener.Start()
    Write-Host ""
    Write-Host "===========================================================" -ForegroundColor Green
    Write-Host "  🌉 Book Bridge Local Server Running at:" -ForegroundColor Cyan
    Write-Host "  $prefix1" -ForegroundColor Yellow
    Write-Host "===========================================================" -ForegroundColor Green
    Write-Host "Press Ctrl+C in this PowerShell window to stop the server." -ForegroundColor Gray
    Write-Host ""

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        if ($urlPath -eq "/demo") { $urlPath = "/demo.html" }
        
        $localFilePath = Join-Path $root ($urlPath.TrimStart('/').Replace('/', '\'))

        # Clean URL support: /browse -> browse.html
        if (-not (Test-Path $localFilePath -PathType Leaf) -and (Test-Path ($localFilePath + ".html") -PathType Leaf)) {
            $localFilePath = $localFilePath + ".html"
        }

        if (Test-Path $localFilePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            
            # Mime Types
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".jpeg" { $response.ContentType = "image/jpeg" }
                ".webp" { $response.ContentType = "image/webp" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                ".ico"  { $response.ContentType = "image/x-icon" }
                default { $response.ContentType = "application/octet-stream" }
            }

            try {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                # Ignore stream write aborts
            }
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            try {
                $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
            } catch {}
        }

        try {
            $response.OutputStream.Close()
        } catch {}
    }
} catch {
    Write-Host "Server Info: $_" -ForegroundColor Gray
} finally {
    try { $listener.Stop() } catch {}
}
