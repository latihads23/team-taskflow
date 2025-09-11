# PowerShell script to execute SQL schema on Supabase
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcXJ1cGhoeW5xaW5pb2tsc2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDIyODMsImV4cCI6MjA3MzE3ODI4M30.p8O7k2CtCR6_QgoVbReYoWI36ymucb1lb35DT0XT-ao"
}

try {
    Write-Host "🔄 Reading SQL schema file..."
    $sqlContent = Get-Content "supabase-complete-schema.sql" -Raw -Encoding UTF8
    
    Write-Host "🔄 Executing SQL on Supabase..."
    $response = Invoke-WebRequest -Uri "https://cqqruphhynqinioklsax.supabase.co/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $sqlContent
    
    Write-Host "✅ SQL executed successfully!"
    Write-Host "Response Status: $($response.StatusCode)"
    Write-Host "Response Content: $($response.Content)"
}
catch {
    Write-Host "❌ Error executing SQL:"
    Write-Host $_.Exception.Message
}
