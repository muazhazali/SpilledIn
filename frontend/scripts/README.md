# SpilledIn Database Setup Guide

This directory contains the database setup script for the SpilledIn anonymous confession platform.

## 📋 Prerequisites

Before running the setup script, ensure you have:

1. **Supabase Project**: A Supabase project created at [supabase.com](https://supabase.com)
2. **Database Access**: Access to your Supabase project's SQL Editor or `psql` connection
3. **Environment Variables**: Your Supabase project URL and anon key configured

## 🚀 Setup Instructions

### Method 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the "SQL Editor" tab

2. **Run the Setup Script**
   - Copy the entire contents of `supabase-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify Installation**
   - Check the "Table Editor" to see all created tables
   - Verify the "Storage" section shows the `confession-images` bucket
   - Check "Database" > "Functions" to see custom functions

### Method 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (replace with your project reference)
supabase link --project-ref your-project-ref

# Run the setup script
supabase db reset --linked
# Then run the SQL script through the dashboard
```

### Method 3: Using psql (Advanced)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the script
\i supabase-setup.sql
```

## 📊 What Gets Created

### Tables
- **`companies`** - Stores company information and invite codes
- **`user_profiles`** - Extended user profiles with anonymous usernames and toxicity scores
- **`confessions`** - User confessions with voting data
- **`votes`** - Individual user votes on confessions
- **`awards`** - Monthly recognition awards for users

### Functions
- **`generate_anonymous_username()`** - Creates unique anonymous usernames
- **`update_user_toxicity_score(user_uuid)`** - Updates user toxicity scores
- **`search_confessions(...)`** - Advanced confession search with filters
- **`get_monthly_stats(...)`** - Monthly statistics for Toxic Wrapped
- **`get_company_stats(company_uuid)`** - Company analytics
- **`cleanup_old_data(days_old)`** - Data maintenance function

### Triggers
- **Vote Change Trigger** - Automatically updates confession vote counts and user toxicity scores
- **Confession Delete Trigger** - Updates user scores when confessions are deleted

### Security
- **Row Level Security (RLS)** enabled on all tables
- **Policies** for secure data access based on user authentication
- **Storage policies** for confession image uploads

### Storage
- **`confession-images`** bucket for user-uploaded images

## 🔧 Configuration

### Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Sample Companies

The script creates sample companies with these invite codes:
- `TECH2024` - TechCorp Inc
- `STARTUP123` - StartupXYZ  
- `MEGA456` - MegaCorp Ltd
- `INNOVATE789` - InnovateLab
- `DIGITAL2024` - DigitalFirst

## 🌱 Loading Sample Data

After setting up the database, you can load realistic sample data for testing:

### Using the Comprehensive Seed File

1. **Run the seed script** in your Supabase SQL Editor:
   - Copy the contents of `seed-data.sql`
   - Paste and run in the SQL Editor

2. **What gets loaded:**
   - **15 sample users** across 5 companies with realistic anonymous usernames
   - **15 sample confessions** with various vote scores and engagement levels
   - **17 sample votes** showing user interactions
   - **9 sample awards** from recent months for Toxic Wrapped testing

### Sample Data Includes:

**Viral Confessions:**
- "I accidentally sent a meme to the CEO..." (89 upvotes)
- "I've been pretending to understand blockchain..." (67 upvotes)
- "Our startup's 'revolutionary AI' is just me..." (78 upvotes)

**Controversial Confessions:**
- "I think pineapple on pizza is actually good..." (-26 net score)
- "I actually enjoy our 9 AM Monday meetings..." (-23 net score)

**Recent Activity:**
- Fresh confessions from the last 24 hours for testing real-time features
- Recent votes and awards for current month statistics

## 🧪 Testing the Setup

### 1. Test User Registration
```sql
-- Test the anonymous username generator
SELECT generate_anonymous_username();
```

### 2. Test Search Function
```sql
-- Search for confessions containing "blockchain"
SELECT * FROM search_confessions('blockchain', NULL, 'popular', 10, 0);

-- Search by username
SELECT * FROM search_confessions('DramaDeity99', NULL, 'popular', 10, 0);
```

### 3. Test Monthly Stats
```sql
-- Get current month stats
SELECT get_monthly_stats(
    EXTRACT(MONTH FROM NOW())::INTEGER,
    EXTRACT(YEAR FROM NOW())::INTEGER
);

-- Get November 2024 stats (has sample data)
SELECT get_monthly_stats(11, 2024);
```

### 4. Test Toxicity System
```sql
-- View users by toxicity score
SELECT anonymous_username, toxicity_score, total_upvotes, total_downvotes
FROM user_profiles 
ORDER BY toxicity_score DESC;

-- Test toxicity tier function
SELECT anonymous_username, toxicity_score,
       (SELECT json_build_object(
           'name', (getToxicityTier(toxicity_score)).name,
           'emoji', (getToxicityTier(toxicity_score)).emoji
       )) as tier
FROM user_profiles 
ORDER BY toxicity_score DESC;
```

## 🔍 Troubleshooting

### Common Issues

1. **Extension Errors**
   ```
   ERROR: extension "uuid-ossp" does not exist
   ```
   **Solution**: Extensions should be automatically available in Supabase. If not, contact Supabase support.

2. **Permission Errors**
   ```
   ERROR: permission denied for schema auth
   ```
   **Solution**: Make sure you're running the script as the postgres user in Supabase SQL Editor.

3. **Storage Bucket Errors**
   ```
   ERROR: relation "storage.buckets" does not exist
   ```
   **Solution**: Ensure you're running this on a Supabase project, not a local PostgreSQL instance.

### Verification Queries

```sql
-- Check if all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check if triggers were created
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'confession-images';
```

## 🔄 Updates and Migrations

When updating the database schema:

1. **Backup your data** before running any updates
2. Test changes on a development project first
3. Use `IF NOT EXISTS` clauses to avoid conflicts
4. Consider data migration scripts for existing data

## 📈 Performance Considerations

The script includes several performance optimizations:

- **Indexes** on frequently queried columns
- **Full-text search** index for confession content
- **Computed columns** for net_score calculation
- **Efficient triggers** for real-time updates

## 🛡️ Security Features

- **Row Level Security** prevents unauthorized data access
- **User isolation** ensures users can only modify their own data
- **Storage policies** restrict file uploads to authenticated users
- **Input validation** with CHECK constraints

## 📞 Support

If you encounter issues:

1. Check the Supabase dashboard logs
2. Verify your project permissions
3. Review the troubleshooting section above
4. Check Supabase documentation at [supabase.com/docs](https://supabase.com/docs)

---

**Note**: This script is designed specifically for Supabase and uses Supabase-specific features like `auth.uid()` and storage policies. It will not work on standard PostgreSQL installations without modifications. 