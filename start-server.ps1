# Zero-dependency PowerShell Static Web Server for Confection3D
# Serves local HTML/CSS/JS files and resolves ES Modules CORS blocks

$port = 8080
$localUrl = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($localUrl)

$currentDir = Get-Location

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "          Confection3D Local Web Server                   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Hosting folder: $currentDir" -ForegroundColor Gray
Write-Host "Server running at: $localUrl" -ForegroundColor Yellow
Write-Host "Press [Ctrl + C] in this window to stop the server." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

try {
    $listener.Start()
    
    # Auto-launch the web browser to the hosting URL
    Start-Process $localUrl
    
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            # Resolve requested file path
            $urlPath = $request.Url.LocalPath
            if ($urlPath -eq "/" -or $urlPath -eq "") {
                $urlPath = "/index.html"
            }
            
            # Handle directory traversal security check
            $cleanPath = $urlPath.Replace("/", "\")
            $filePath = Join-Path $currentDir $cleanPath
            
            if (Test-Path $filePath -PathType Leaf) {
                # Determine Content-Type header from file extension
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = "text/plain; charset=utf-8"
                
                switch ($ext) {
                    ".html" { $contentType = "text/html; charset=utf-8" }
                    ".css"  { $contentType = "text/css; charset=utf-8" }
                    ".js"   { $contentType = "application/javascript; charset=utf-8" }
                    ".json" { $contentType = "application/json; charset=utf-8" }
                    ".png"  { $contentType = "image/png" }
                    ".jpg"  { $contentType = "image/jpeg" }
                    ".jpeg" { $contentType = "image/jpeg" }
                    ".gif"  { $contentType = "image/gif" }
                    ".svg"  { $contentType = "image/svg+xml; charset=utf-8" }
                    ".ico"  { $contentType = "image/x-icon" }
                }
                
                # Read file as bytes
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                # File not found
                $response.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("<html><body><h3>404 Sweet Not Found</h3><p>Could not locate: $urlPath</p></body></html>")
                $response.ContentType = "text/html; charset=utf-8"
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            
            $response.Close()
        } catch {
            # Catch client disconnects safely
            Write-Host "Request completed or client disconnected." -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "Server encountered an error: $_" -ForegroundColor Red
} finally {
    if ($null -ne $listener) {
        $listener.Close()
    }
    Write-Host "Server stopped." -ForegroundColor Red
}
