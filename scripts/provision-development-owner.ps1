$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)
Write-Host 'Creates your permanent owner on verified development project ctewndpjtkcpybclniuf. No invitations are sent.'
$ownerEmail = Read-Host 'Your own email (enter here, not in chat)'
$ownerPassword = Read-Host 'New password, at least 12 characters (masked)' -AsSecureString
$ownerConfirm = Read-Host 'Repeat password (masked)' -AsSecureString
function Read-PrivateValue([Security.SecureString]$value) {
 $ownerPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
 try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ownerPointer) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ownerPointer) }
}
$ownerPlain = Read-PrivateValue $ownerPassword
$ownerRepeat = Read-PrivateValue $ownerConfirm
try {
 if ($ownerPlain -cne $ownerRepeat) { throw 'Passwords do not match; no account created.' }
 @{email=$ownerEmail;password=$ownerPlain} | ConvertTo-Json -Compress | node scripts/hosted/provision-owner.mjs
 if ($LASTEXITCODE -ne 0) { throw 'Provisioning did not complete.' }
} finally { $ownerPlain=$null; $ownerRepeat=$null; $ownerEmail=$null; $ownerPassword=$null; $ownerConfirm=$null }
