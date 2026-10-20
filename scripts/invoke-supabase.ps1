param([Parameter(ValueFromRemainingArguments=$true)][string[]]$CliArguments)
$ErrorActionPreference = 'Stop'
$phase3Root = Split-Path $PSScriptRoot -Parent
$phase3File = Join-Path $phase3Root '.tools/supabase/database-password.xml'
$phase3Original = $env:SUPABASE_DB_PASSWORD
$phase3OriginalToken = $env:SUPABASE_ACCESS_TOKEN
try {
    $phase3TokenFile = Join-Path $phase3Root '.tools/supabase/access-token.xml'
    if (Test-Path -LiteralPath $phase3TokenFile) {
        $phase3Token = Import-Clixml -LiteralPath $phase3TokenFile
        $phase3TokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($phase3Token)
        try { $env:SUPABASE_ACCESS_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($phase3TokenPtr) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($phase3TokenPtr) }
    }
    if (Test-Path -LiteralPath $phase3File) {
        $phase3Secure = Import-Clixml -LiteralPath $phase3File
        $phase3Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($phase3Secure)
        try { $env:SUPABASE_DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($phase3Ptr) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($phase3Ptr) }
    }
    & (Join-Path $phase3Root '.tools/supabase/supabase.exe') @CliArguments
    $phase3Exit = $LASTEXITCODE
} finally { $env:SUPABASE_DB_PASSWORD = $phase3Original; $env:SUPABASE_ACCESS_TOKEN = $phase3OriginalToken }
exit $phase3Exit
