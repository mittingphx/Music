param(
    [int]$Port = 8000,
    [string]$Path = $PSScriptRoot
)

Write-Host "Starting web server on port $Port..."
Write-Host "Access the site at: http://localhost:$Port"

# Create a basic web server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
        $filePath = Join-Path $Path $request.Url.LocalPath.TrimStart('/')
        
        if (-not (Test-Path $filePath)) {
            $filePath = Join-Path $Path "index.html"
        }

        $contentType = switch -regex ([System.IO.Path]::GetExtension($filePath)) {
            '\.html$' { 'text/html' }
            '\.css$' { 'text/css' }
            '\.js$' { 'application/javascript' }
            '\.mp3$' { 'audio/mpeg' }
            '\.jpg$' { 'image/jpeg' }
            '\.png$' { 'image/png' }
            default { 'application/octet-stream' }
        }

        $buffer = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = $contentType
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    catch {
        Write-Error "Error handling request: $_"
        $response.StatusCode = 500
    }
    finally {
        $response.Close()
    }
}

$listener.Stop()
