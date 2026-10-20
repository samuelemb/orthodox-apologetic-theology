param([switch]$SkipLogin, [switch]$TokenLogin)
$ErrorActionPreference = 'Stop'
$phase3Root = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $phase3Root
$phase3Cli = Join-Path $phase3Root '.tools/supabase/supabase.exe'
if (!(Test-Path -LiteralPath $phase3Cli)) { throw 'Portable Supabase CLI is missing.' }
Write-Host 'Intended development project: ctewndpjtkcpybclniuf'
if ($TokenLogin) {
    $phase3Token = Read-Host 'Supabase account access token (masked; do not paste it into chat)' -AsSecureString
    $phase3Token | Export-Clixml -LiteralPath '.tools/supabase/access-token.xml'
    # The CLI reads this only from its process environment, never command arguments.
} elseif (!$SkipLogin) {
    # Official browser login. No token is passed as a command-line argument.
    & $phase3Cli login
    if ($LASTEXITCODE -ne 0) { throw 'CLI login did not complete.' }
}
$phase3Password = Read-Host 'Development database password (masked; stored with Windows user encryption for CLI operations)' -AsSecureString
$phase3Password | Export-Clixml -LiteralPath '.tools/supabase/database-password.xml'
& (Join-Path $PSScriptRoot 'invoke-supabase.ps1') link --project-ref ctewndpjtkcpybclniuf
if ($LASTEXITCODE -ne 0) { throw 'Link failed; no migrations were applied.' }
$phase3Ref = (Get-Content -Raw -LiteralPath 'supabase/.temp/project-ref').Trim()
if ($phase3Ref -ne 'ctewndpjtkcpybclniuf') { throw 'Linked reference mismatch. Stop.' }
$phase3Publishable = Read-Host 'Publishable API key (sb_publishable_; masked)' -AsSecureString
$phase3Secret = Read-Host 'Temporary test Auth-admin key (sb_secret_ or legacy service_role; masked)' -AsSecureString
function Unprotect-Phase3Value([Security.SecureString]$Value) {
    $phase3Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($phase3Ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($phase3Ptr) }
}
$phase3PublicText = Unprotect-Phase3Value $phase3Publishable
$phase3SecretText = Unprotect-Phase3Value $phase3Secret
if (!$phase3PublicText.StartsWith('sb_publishable_')) { throw 'Use the modern publishable key.' }
if (!($phase3SecretText.StartsWith('sb_secret_') -or $phase3SecretText.StartsWith('eyJ'))) { throw 'Use a secret or legacy service-role key for fixture accounts only.' }
if (Test-Path -LiteralPath '.env.local') { throw '.env.local already exists. Preserve it; update the existing named values in your local editor instead.' }
$phase3EnvText = "NEXT_PUBLIC_SUPABASE_URL=https://ctewndpjtkcpybclniuf.supabase.co`nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$phase3PublicText`nSUPABASE_SECRET_KEY=$phase3SecretText`n"
[IO.File]::WriteAllText((Join-Path $phase3Root '.env.local'), $phase3EnvText, (New-Object Text.UTF8Encoding $false))
$phase3EnvText = $null; $phase3SecretText = $null; $phase3PublicText = $null
Write-Host 'Connection prepared. No migrations or fixtures applied. No credential values printed.'
Write-Host 'In Supabase Dashboard > Authentication > configuration, disable new-user sign-ups and anonymous sign-ins. Do not invite anyone.'
Write-Host 'Return to chat with: ready. Keep all credentials out of chat.'
