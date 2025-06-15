# User Creation Script

This script helps you create new users in your Supabase database with proper authentication and user profiles.

## Prerequisites

1. **Environment Variables**: You need to set up the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Project Settings > API)

2. **Database Setup**: Make sure your Supabase database has:
   - `companies` table with `invite_code` field
   - `user_profiles` table
   - `generate_anonymous_username()` function

## Setup

### Option 1: Environment Variables (Recommended)

Create a `.env.local` file in your frontend directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Option 2: Direct Configuration

Edit the `scripts/create-user.js` file and replace the placeholder values:

```javascript
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseServiceKey = 'your-service-role-key-here'
```

## Usage

### Using the npm script:

```bash
pnpm run create-user
```

### Or run directly:

```bash
node scripts/create-user.js
```

## Features

The script provides three options:

1. **Create a new user**: 
   - Prompts for email, password, and company invite code
   - Validates the invite code against your companies table
   - Creates the auth user with auto-confirmed email
   - Generates an anonymous username
   - Creates the user profile with initial values

2. **List available companies**:
   - Shows all companies and their invite codes
   - Option to create a user after viewing companies

3. **Exit**: Closes the script

## What the script does:

1. ✅ Validates the company invite code
2. ✅ Creates the authentication user using Supabase Admin API
3. ✅ Auto-confirms the user's email (no verification needed)
4. ✅ Generates a unique anonymous username
5. ✅ Creates the user profile with:
   - User ID linking to auth user
   - Company ID from the invite code
   - Anonymous username
   - Initial toxicity score of 0
   - Initial upvotes/downvotes of 0

## Error Handling

The script includes comprehensive error handling for:
- Invalid invite codes
- Duplicate email addresses
- Database connection issues
- Missing environment variables
- Profile creation failures

## Security Notes

- The service role key has admin privileges - keep it secure
- Never commit the service role key to version control
- Use environment variables for production deployments
- The script auto-confirms emails, so users can login immediately

## Troubleshooting

**"Invalid invite code" error:**
- Check that the company exists in your `companies` table
- Verify the invite code matches exactly (case-sensitive)

**"Auth creation failed" error:**
- Email might already be registered
- Check your Supabase project settings
- Verify the service role key is correct

**"Username generation failed" error:**
- Make sure the `generate_anonymous_username()` function exists in your database
- Check the function permissions

**"Profile creation failed" error:**
- Verify the `user_profiles` table structure
- Check that the company_id exists in the companies table 