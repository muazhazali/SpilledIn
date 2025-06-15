# SpilledIn Database Setup Script for Windows PowerShell
# This script helps set up the Supabase database for the SpilledIn project

param(
    [string]$ProjectRef = "",
    [string]$DatabasePassword = "",
    [switch]$Help
)

# Display help information
if ($Help) {
    Write-Host @"
SpilledIn Database Setup Script

USAGE:
    .\setup-database.ps1 [-ProjectRef <project-ref>] [-DatabasePassword <password>] [-Help]

PARAMETERS:
    -ProjectRef        Your Supabase project reference ID
    -DatabasePassword  Your Supabase database password
    -Help             Show this help message

EXAMPLES:
    .\setup-database.ps1 -ProjectRef "abcdefghijklmnop" -DatabasePassword "your-password"
    .\setup-database.ps1 -Help

NOTES:
    - You can find your project reference in your Supabase dashboard URL
    - The database password is set when you create your Supabase project
    - If parameters are not provided, you'll be prompted to enter them
    - This script requires the Supabase CLI to be installed

"@
    exit 0
}

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to display colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to display step headers
function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-ColorOutput "🔄 $Message" "Cyan"
    Write-Host "=" * 50 -ForegroundColor Gray
}

# Function to display success messages
function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

# Function to display error messages
function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

# Function to display warning messages
function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

# Main script execution
try {
    Write-ColorOutput @"
╔══════════════════════════════════════════════════════════════╗
║                    SpilledIn Database Setup                  ║
║                                                              ║
║  This script will help you set up the Supabase database     ║
║  for your SpilledIn anonymous confession platform.          ║
╚══════════════════════════════════════════════════════════════╝
"@ "Magenta"

    # Step 1: Check prerequisites
    Write-Step "Checking Prerequisites"
    
    # Check if Node.js is installed
    if (-not (Test-Command "node")) {
        Write-Error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
        exit 1
    }
    Write-Success "Node.js is installed"

    # Check if npm/pnpm is available
    if (Test-Command "pnpm") {
        $PackageManager = "pnpm"
        Write-Success "pnpm is available"
    } elseif (Test-Command "npm") {
        $PackageManager = "npm"
        Write-Success "npm is available"
    } else {
        Write-Error "Neither npm nor pnpm is available"
        exit 1
    }

    # Check if Supabase CLI is installed
    if (-not (Test-Command "supabase")) {
        Write-Warning "Supabase CLI is not installed. Installing now..."
        try {
            if ($PackageManager -eq "pnpm") {
                pnpm add -g supabase
            } else {
                npm install -g supabase
            }
            Write-Success "Supabase CLI installed successfully"
        }
        catch {
            Write-Error "Failed to install Supabase CLI. Please install manually: npm install -g supabase"
            exit 1
        }
    } else {
        Write-Success "Supabase CLI is installed"
    }

    # Step 2: Get project information
    Write-Step "Project Configuration"
    
    if (-not $ProjectRef) {
        Write-Host "Please enter your Supabase project reference ID:"
        Write-Host "(You can find this in your Supabase dashboard URL: https://supabase.com/dashboard/project/YOUR-PROJECT-REF)"
        $ProjectRef = Read-Host "Project Reference"
    }

    if (-not $DatabasePassword) {
        Write-Host "Please enter your Supabase database password:"
        $SecurePassword = Read-Host "Database Password" -AsSecureString
        $DatabasePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword))
    }

    if (-not $ProjectRef -or -not $DatabasePassword) {
        Write-Error "Project reference and database password are required"
        exit 1
    }

    Write-Success "Project configuration collected"

    # Step 3: Check if SQL file exists
    Write-Step "Checking SQL Script"
    
    $SqlFile = Join-Path $PSScriptRoot "supabase-setup.sql"
    if (-not (Test-Path $SqlFile)) {
        Write-Error "SQL setup file not found at: $SqlFile"
        Write-Host "Please ensure the supabase-setup.sql file is in the same directory as this script."
        exit 1
    }
    Write-Success "SQL setup file found"

    # Step 4: Login to Supabase
    Write-Step "Supabase Authentication"
    
    Write-Host "Please login to Supabase when prompted..."
    try {
        supabase login
        Write-Success "Successfully logged in to Supabase"
    }
    catch {
        Write-Error "Failed to login to Supabase"
        exit 1
    }

    # Step 5: Connect to database and run script
    Write-Step "Database Setup"
    
    Write-Host "Connecting to your Supabase database..."
    $ConnectionString = "postgresql://postgres:$DatabasePassword@db.$ProjectRef.supabase.co:5432/postgres"
    
    Write-Host "Running database setup script..."
    Write-Warning "This may take a few minutes..."
    
    try {
        # Use psql if available, otherwise provide manual instructions
        if (Test-Command "psql") {
            psql $ConnectionString -f $SqlFile
            Write-Success "Database setup completed successfully!"
        } else {
            Write-Warning "psql is not available. Please run the setup manually:"
            Write-Host ""
            Write-Host "1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/$ProjectRef"
            Write-Host "2. Navigate to the 'SQL Editor' tab"
            Write-Host "3. Copy the contents of: $SqlFile"
            Write-Host "4. Paste and run the script in the SQL Editor"
            Write-Host ""
            Write-Host "Press any key to open the SQL file in your default editor..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            Start-Process $SqlFile
        }
    }
    catch {
        Write-Error "Failed to run database setup script"
        Write-Host "Error details: $($_.Exception.Message)"
        Write-Host ""
        Write-Host "Manual setup instructions:"
        Write-Host "1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/$ProjectRef"
        Write-Host "2. Navigate to the 'SQL Editor' tab"
        Write-Host "3. Copy the contents of: $SqlFile"
        Write-Host "4. Paste and run the script in the SQL Editor"
        exit 1
    }

    # Step 6: Verification
    Write-Step "Verification"
    
    Write-Host "To verify your setup:"
    Write-Host "1. Check your Supabase dashboard tables:"
    Write-Host "   - companies, user_profiles, confessions, votes, awards"
    Write-Host "2. Check Storage for 'confession-images' bucket"
    Write-Host "3. Check Database > Functions for custom functions"
    Write-Host ""
    Write-Host "Sample invite codes created:"
    Write-ColorOutput "   TECH2024, STARTUP123, MEGA456, INNOVATE789, DIGITAL2024" "Yellow"

    # Step 7: Next steps
    Write-Step "Next Steps"
    
    Write-Host "1. Update your .env.local file with Supabase credentials"
    Write-Host "2. Test user registration with one of the sample invite codes"
    Write-Host "3. Start your Next.js development server: pnpm dev"
    Write-Host ""
    Write-Success "Database setup process completed!"
    
    Write-ColorOutput @"

🎉 Congratulations! Your SpilledIn database is ready!

For support or issues, check:
- README.md in the scripts folder
- Supabase documentation: https://supabase.com/docs
- Project repository issues

"@ "Green"

}
catch {
    Write-Error "An unexpected error occurred: $($_.Exception.Message)"
    Write-Host "Please check the error details above and try again."
    exit 1
}

# Pause to let user read the output
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 