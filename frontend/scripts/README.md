# SpilledIn Supabase Setup Scripts

This directory contains scripts to set up your Supabase database for the SpilledIn anonymous confession platform.

## Files Overview

- **`supabase-setup.sql`** - Main database schema setup script
- **`sample-data.sql`** - Sample data insertion script (optional)
- **`setup-supabase.ps1`** - PowerShell automation script for Windows
- **`README.md`** - This documentation file

## Quick Start

### Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **Credentials**: Get your project URL and service role key from the Supabase dashboard
3. **Windows PowerShell**: For automated setup (Windows 10+ recommended)

### Option 1: Automated Setup (Recommended)

Run the PowerShell script from the `frontend` directory:

```powershell
# Basic setup (schema only)
.\scripts\setup-supabase.ps1 -ProjectUrl "https://your-project.supabase.co" -ServiceRoleKey "your-service-role-key"

# Setup with sample data
.\scripts\setup-supabase.ps1 -ProjectUrl "https://your-project.supabase.co" -ServiceRoleKey "your-service-role-key" -SampleData

# Show help
.\scripts\setup-supabase.ps1 -Help
```

### Option 2: Manual Setup

1. **Copy the SQL content** from `supabase-setup.sql`
2. **Open Supabase Dashboard** → SQL Editor
3. **Paste and run** the SQL script
4. **Optionally run** `sample-data.sql` after creating some users

## What Gets Created

### Database Schema

- **`companies`** - Company information and invite codes
- **`user_profiles`** - Extended user profiles with anonymous usernames
- **`confessions`** - User confessions with voting data
- **`votes`** - Individual user votes on confessions
- **`awards`** - Monthly recognition awards

### Functions

- **`generate_anonymous_username()`** - Creates unique anonymous usernames
- **`update_user_toxicity_score(user_uuid)`** - Updates user toxicity scores
- **`search_confessions(...)`** - Advanced confession search with filters
- **`get_monthly_stats(month, year)`** - Monthly statistics for Toxic Wrapped
- **`get_company_stats(company_uuid)`** - Company-specific analytics

### Triggers

- **Vote counting** - Automatically updates confession vote counts
- **User profile creation** - Creates profiles when users sign up
- **Toxicity score updates** - Keeps user scores current

### Security

- **Row Level Security (RLS)** enabled on all tables
- **Company-based data isolation** - Users only see their company's data
- **Secure functions** with proper permissions
- **Storage policies** for confession images

### Sample Data

The sample data includes:

- **2 Companies**: TechCorp Inc (`TECH2024`), StartupHub (`STARTUP2024`)
- **5 Sample Confessions** with realistic workplace scenarios
- **Sample Votes** to demonstrate the voting system
- **Sample Awards** for testing Toxic Wrapped features

## Environment Setup

After running the setup, update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing the Setup

1. **Start your Next.js app**: `pnpm dev`
2. **Test registration** with invite codes: `TECH2024` or `STARTUP2024`
3. **Create a few test users** through the registration flow
4. **Post some confessions** to test the system
5. **Run sample data script** if you want additional test data

## Invite Codes

The setup creates these default invite codes:

- **`TECH2024`** - TechCorp Inc
- **`STARTUP2024`** - StartupHub

You can add more companies by inserting into the `companies` table.

## Troubleshooting

### Common Issues

**"Permission denied" errors**
- Make sure you're using the **service role key**, not the anon key
- Service role keys start with `eyJ` and are much longer

**"Function does not exist" errors**
- The SQL script may have failed partway through
- Try running it again or check the Supabase logs

**Sample data fails to insert**
- Sample data requires existing users in the database
- Create users through your app first, then run the sample data script

**PowerShell execution policy errors**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Manual Verification

Check if setup was successful by running these queries in the Supabase SQL editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check sample companies
SELECT * FROM companies;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

## Advanced Configuration

### Adding New Companies

```sql
INSERT INTO companies (name, invite_code) 
VALUES ('Your Company', 'YOURCODE2024');
```

### Customizing Anonymous Usernames

Edit the `generate_anonymous_username()` function to change the adjectives and nouns used for username generation.

### Modifying Toxicity Tiers

The toxicity system is score-based. You can customize the tier thresholds in your frontend application logic.

## Support

If you encounter issues:

1. Check the Supabase dashboard logs
2. Verify your credentials are correct
3. Ensure you have the necessary permissions
4. Try running the SQL scripts manually in the Supabase SQL editor

## Security Notes

- **Never commit** your service role key to version control
- **Use environment variables** for all sensitive credentials
- **The service role key** has admin access - keep it secure
- **RLS policies** ensure data isolation between companies 