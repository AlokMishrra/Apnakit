$apiKey = "rnd_Zer6J99KXoZCtqtDLiub4E1IqKQw"
$serviceId = "srv-d915s38k1i2s7387ismg"
$headers = @{"Authorization" = "Bearer $apiKey"; "Content-Type" = "application/json"; "Accept" = "application/json"}

function Set-EnvVar($key, $value) {
    $body = @{key=$key; value=$value} | ConvertTo-Json -Compress
    try {
        $r = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$serviceId/env-vars/$([System.Uri]::EscapeDataString($key))" -Headers $headers -Method Put -Body $body -UseBasicParsing -TimeoutSec 10
        Write-Host "OK: $key"
        return $true
    } catch {
        Write-Host "FAIL: $key - $($_.Exception.Message)"
        return $false
    }
}

$envVars = @{
    "JWT_EXPIRES_IN" = "7d"
    "FIREBASE_PROJECT_ID" = "nishumart-fc6ff"
    "FIREBASE_CLIENT_EMAIL" = "firebase-adminsdk-fbsvc@nishumart-fc6ff.iam.gserviceaccount.com"
    "MSG91_AUTH_KEY" = "544179A7ncS9HD896a3aaf1fP1"
    "MSG91_SENDER_ID" = "NISHMRT"
    "MSG91_ENABLED" = "true"
    "MSG91_TEMPLATE_ID" = ""
    "RAZORPAY_KEY_ID" = "rzp_test_xxxxxxxxxxxxxxxx"
    "RAZORPAY_KEY_SECRET" = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    "TWILIO_SID" = "your-twilio-account-sid"
    "TWILIO_AUTH_TOKEN" = "your-twilio-auth-token"
    "AWS_S3_BUCKET" = "nishumart-uploads"
    "AWS_ACCESS_KEY" = "your-aws-access-key"
    "AWS_SECRET_KEY" = "your-aws-secret-key"
}

foreach ($kv in $envVars.GetEnumerator()) {
    Set-EnvVar $kv.Key $kv.Value
}

Write-Host "`nAll env vars set. Now triggering deploy..."

# Trigger deploy
try {
    $deployBody = @{"clearCache" = "do_not_clear"} | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Headers $headers -Method Post -Body $deployBody -UseBasicParsing -TimeoutSec 15
    $deploy = $r.Content | ConvertFrom-Json
    Write-Host "Deploy triggered: $($deploy.id)"
    Write-Host "Status: $($deploy.status)"
} catch {
    Write-Host "Deploy trigger failed: $($_.Exception.Message)"
}
