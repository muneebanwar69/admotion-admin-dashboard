$projectId = 'admotion-f7970'
$apiKey = 'AIzaSyBY531KR4npLICaE09ixt8_OnRckmJJQAM'
$uri = "https://firestore.googleapis.com/v1/projects/$projectId/databases/%28default%29/documents/admins?key=$apiKey"

$bodyObject = @{
  fields = @{
    name = @{ stringValue = 'muneeb' }
    username = @{ stringValue = 'muneeb' }
    email = @{ stringValue = 'muneeb@admin.com' }
    password = @{ stringValue = 'muneeb' }
    role = @{ stringValue = 'Super Admin' }
    createdAt = @{ stringValue = (Get-Date).ToString('o') }
  }
}

$body = $bodyObject | ConvertTo-Json -Depth 8

try {
  $resp = Invoke-RestMethod -Method Post -Uri $uri -ContentType 'application/json' -Body $body
  Write-Host '✅ Super Admin created'
  Write-Host $resp.name
}
catch {
  Write-Host '❌ Failed to create admin'
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host $_.ErrorDetails.Message
  }
  else {
    Write-Host $_.Exception.Message
  }
  exit 1
}
