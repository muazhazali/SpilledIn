# =====================================================
# SpilledIn - Supabase Setup PowerShell Script
# =====================================================
# This script helps you set up your Supabase database for SpilledIn
# Run this from the frontend directory: .\scripts\setup-supabase.ps1
# =====================================================

param(
    [string]$ProjectUrl = "",
    [string]$ServiceRoleKey = "",
    [switch]$SampleData = $false,
    [switch]$Help = $false
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "SpilledIn Supabase Setup Script" $Blue
    Write-ColorOutput "=================================" $Blue
    Write-Host ""
    Write-ColorOutput "Usage:" $Yellow
    Write-Host "  .\scripts\setup-supabase.ps1 -ProjectUrl <url> -ServiceRoleKey <key> [-SampleData]"
    Write-Host ""
    Write-ColorOutput "Parameters:" $Yellow
    Write-Host "  -ProjectUrl      Your Supabase project URL (e.g., https://your-project.supabase.co)"
    Write-Host "  -ServiceRoleKey  Your Supabase service role key (secret key, not anon key)"
    Write-Host "  -SampleData      Include sample data insertion (optional)"
    Write-Host "  -Help            Show this help message"
    Write-Host ""
    Write-ColorOutput "Examples:" $Yellow
    Write-Host "  # Setup database schema only"
    Write-Host "  .\scripts\setup-supabase.ps1 -ProjectUrl 'https://abc123.supabase.co' -ServiceRoleKey 'your-service-key'"
    Write-Host ""
    Write-Host "  # Setup database schema with sample data"
    Write-Host "  .\scripts\setup-supabase.ps1 -ProjectUrl 'https://abc123.supabase.co' -ServiceRoleKey 'your-service-key' -SampleData"
    Write-Host ""
    Write-ColorOutput "Note:" $Yellow
    Write-Host "  - Make sure you have curl installed (comes with Windows 10+)"
    Write-Host "  - The service role key should start with 'eyJ' and is found in your Supabase dashboard"
    Write-Host "  - Sample data requires at least one user to be created through your app first"
    exit 0
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." $Blue
    
    # Check if curl is available
    try {
        $curlVersion = curl --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ curl is available" $Green
        } else {
            throw "curl not found"
        }
    } catch {
        Write-ColorOutput "✗ curl is not available. Please install curl or use Windows 10+ which includes it." $Red
        exit 1
    }
    
    # Check if SQL files exist
    $setupFile = "scripts/supabase-setup.sql"
    $sampleFile = "scripts/sample-data.sql"
    
    if (-not (Test-Path $setupFile)) {
        Write-ColorOutput "✗ Setup SQL file not found: $setupFile" $Red
        exit 1
    }
    Write-ColorOutput "✓ Setup SQL file found" $Green
    
    if ($SampleData -and -not (Test-Path $sampleFile)) {
        Write-ColorOutput "✗ Sample data SQL file not found: $sampleFile" $Red
        exit 1
    }
    if ($SampleData) {
        Write-ColorOutput "✓ Sample data SQL file found" $Green
    }
}

function Invoke-SqlScript {
    param(
        [string]$FilePath,
        [string]$Description,
        [string]$Url,
        [string]$Key
    )
    
    Write-ColorOutput "Executing $Description..." $Blue
    
    $headers = @{
        "Authorization" = "Bearer $Key"
        "Content-Type" = "application/json"
        "Prefer" = "return=minimal"
    }
    
    # Read SQL file content
    $sqlContent = Get-Content -Path $FilePath -Raw
    
    # Prepare the request body
    $body = @{
        query = $sqlContent
    } | ConvertTo-Json -Depth 10
    
    # Make the request
    try {
        $response = Invoke-RestMethod -Uri "$Url/rest/v1/rpc/exec" -Method POST -Headers $headers -Body $body -ContentType "application/json"
        Write-ColorOutput "✓ $Description completed successfully" $Green
        return $true
    } catch {
        # Try alternative endpoint for raw SQL execution
        try {
            $alternativeUrl = "$Url/rest/v1/rpc"
            $alternativeBody = @{
                sql = $sqlContent
            } | ConvertTo-Json -Depth 10
            
            $response = Invoke-RestMethod -Uri $alternativeUrl -Method POST -Headers $headers -Body $alternativeBody -ContentType "application/json"
            Write-ColorOutput "✓ $Description completed successfully" $Green
            return $true
        } catch {
            Write-ColorOutput "✗ Failed to execute $Description" $Red
            Write-ColorOutput "Error: $($_.Exception.Message)" $Red
            
            # Try using curl as fallback
            Write-ColorOutput "Trying with curl..." $Yellow
            
            $tempFile = [System.IO.Path]::GetTempFileName()
            $sqlContent | Out-File -FilePath $tempFile -Encoding UTF8
            
            $curlCommand = "curl -X POST '$Url/rest/v1/rpc' -H 'Authorization: Bearer $Key' -H 'Content-Type: application/json' -d '{`"sql`": `"$($sqlContent -replace '"', '\"' -replace "`n", "\n" -replace "`r", "")`"}'"
            
            try {
                Invoke-Expression $curlCommand
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "✓ $Description completed successfully with curl" $Green
                    Remove-Item $tempFile -Force
                    return $true
                }
            } catch {
                Write-ColorOutput "✗ Curl execution also failed" $Red
            }
            
            Remove-Item $tempFile -Force
            return $false
        }
    }
}

# Main execution
if ($Help) {
    Show-Help
}

if (-not $ProjectUrl -or -not $ServiceRoleKey) {
    Write-ColorOutput "Error: ProjectUrl and ServiceRoleKey are required parameters." $Red
    Write-ColorOutput "Use -Help for usage information." $Yellow
    exit 1
}

# Validate URL format
if ($ProjectUrl -notmatch "^https://.*\.supabase\.co$") {
    Write-ColorOutput "Warning: ProjectUrl should be in format: https://your-project.supabase.co" $Yellow
}

# Validate service role key format
if ($ServiceRoleKey -notmatch "^eyJ") {
    Write-ColorOutput "Warning: ServiceRoleKey should start with 'eyJ' (JWT format)" $Yellow
}

Write-ColorOutput "SpilledIn Supabase Database Setup" $Blue
Write-ColorOutput "=================================" $Blue
Write-Host ""
Write-ColorOutput "Project URL: $ProjectUrl" $Blue
Write-ColorOutput "Using Service Role Key: $($ServiceRoleKey.Substring(0, 20))..." $Blue
Write-Host ""

Test-Prerequisites

# Execute main setup script
$setupSuccess = Invoke-SqlScript -FilePath "scripts/supabase-setup.sql" -Description "database schema setup" -Url $ProjectUrl -Key $ServiceRoleKey

if (-not $setupSuccess) {
    Write-ColorOutput "Setup failed. Please check your credentials and try again." $Red
    exit 1
}

# Execute sample data script if requested
if ($SampleData) {
    Write-Host ""
    Write-ColorOutput "Setting up sample data..." $Blue
    Write-ColorOutput "Note: Sample data requires at least one user to exist in your database." $Yellow
    Write-Host ""
    
    $sampleSuccess = Invoke-SqlScript -FilePath "scripts/sample-data.sql" -Description "sample data insertion" -Url $ProjectUrl -Key $ServiceRoleKey
    
    if (-not $sampleSuccess) {
        Write-ColorOutput "Sample data insertion failed. This is normal if no users exist yet." $Yellow
        Write-ColorOutput "Create some users through your app first, then run:" $Yellow
        Write-ColorOutput ".\scripts\setup-supabase.ps1 -ProjectUrl '$ProjectUrl' -ServiceRoleKey 'your-key' -SampleData" $Yellow
    }
}

Write-Host ""
Write-ColorOutput "Setup Summary:" $Blue
Write-ColorOutput "==============" $Blue
Write-ColorOutput "✓ Database schema created" $Green
Write-ColorOutput "✓ Functions and triggers installed" $Green
Write-ColorOutput "✓ Row Level Security policies enabled" $Green
Write-ColorOutput "✓ Storage bucket configured" $Green
Write-ColorOutput "✓ Sample companies created (TechCorp Inc, StartupHub)" $Green

if ($SampleData) {
    Write-ColorOutput "✓ Sample data attempted (check logs above)" $Green
}

Write-Host ""
Write-ColorOutput "Next Steps:" $Yellow
Write-Host "1. Update your .env.local file with your Supabase credentials"
Write-Host "2. Test user registration with invite codes: TECH2024, STARTUP2024"
Write-Host "3. Create some test users through your application"
Write-Host "4. Run sample data script if you haven't already"
Write-Host ""
Write-ColorOutput "Your SpilledIn database is ready! 🎉" $Green 