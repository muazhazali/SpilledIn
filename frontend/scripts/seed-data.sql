-- =====================================================
-- SpilledIn Minimal Seed Data (Supabase Compatible)
-- =====================================================
-- This file contains minimal sample data for testing
-- all features of the SpilledIn platform
-- 
-- IMPORTANT: This script is designed for Supabase and properly
-- handles foreign key constraints by creating auth users first

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM votes;
-- DELETE FROM awards;
-- DELETE FROM confessions;
-- DELETE FROM user_profiles;
-- DELETE FROM companies;

DO $$
BEGIN
    RAISE NOTICE '🚀 Starting SpilledIn minimal seed data loading for Supabase...';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 1: INSERT COMPANIES (No dependencies)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '📋 Step 1: Creating sample company...';
END $$;

BEGIN;

INSERT INTO companies (id, name, invite_code, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'TechCorp Inc', 'TECH2024', NOW() - INTERVAL '6 months')
ON CONFLICT (invite_code) DO NOTHING;

COMMIT;

DO $$
DECLARE
    company_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO company_count FROM companies;
    RAISE NOTICE '✅ Companies created: %', company_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 2: CREATE AUTH USERS (Required for foreign keys)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '👤 Step 2: Creating sample auth user...';
    RAISE NOTICE '⚠️  For Supabase: Creating user in auth.users table';
END $$;

BEGIN;

-- Insert user into auth.users table (Supabase auth table)
-- Note: In production, these would be created through Supabase Auth signup
INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
    ('550e8400-e29b-41d4-a716-446655440101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user1@techcorp.com', crypt('password123', gen_salt('bf')), NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 months', '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

COMMIT;

DO $$
DECLARE
    auth_user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO auth_user_count FROM auth.users WHERE id::text LIKE '550e8400-e29b-41d4-a716-44665544%';
    RAISE NOTICE '✅ Auth users created: %', auth_user_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 3: CREATE USER PROFILES (Depends on auth.users and companies)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '👥 Step 3: Creating sample user profile...';
END $$;

BEGIN;

INSERT INTO user_profiles (id, company_id, anonymous_username, toxicity_score, total_upvotes, total_downvotes, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'DramaDeity99', 1250, 89, 23, NOW() - INTERVAL '5 months')
ON CONFLICT (id) DO NOTHING;

COMMIT;

DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    RAISE NOTICE '✅ User profiles created: %', user_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 4: INSERT CONFESSIONS (Depends on auth.users and companies)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '💬 Step 4: Creating sample confession...';
END $$;

BEGIN;

INSERT INTO confessions (id, user_id, company_id, content, image_url, upvotes, downvotes, created_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 
     'I accidentally sent a meme to the CEO instead of my friend. Now everyone thinks I''m the office comedian and I''m getting invited to present at the company retreat 😅', 
     NULL, 89, 3, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

DO $$
DECLARE
    confession_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO confession_count FROM confessions;
    RAISE NOTICE '✅ Confessions created: %', confession_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 5: INSERT VOTES (Depends on auth.users and confessions)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🗳️ Step 5: Creating sample vote...';
    RAISE NOTICE '⚠️  Note: Creating a second auth user for voting demo';
END $$;

BEGIN;

-- Create a second user for voting (voter can't vote on their own confession)
INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
    ('550e8400-e29b-41d4-a716-446655440102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user2@techcorp.com', crypt('password123', gen_salt('bf')), NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months', '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Create user profile for the voter
INSERT INTO user_profiles (id, company_id, anonymous_username, toxicity_score, total_upvotes, total_downvotes, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'ChaosChamp88', 890, 67, 18, NOW() - INTERVAL '4 months')
ON CONFLICT (id) DO NOTHING;

-- Insert the vote
INSERT INTO votes (id, user_id, confession_id, vote_type, created_at) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', '650e8400-e29b-41d4-a716-446655440001', 'upvote', NOW() - INTERVAL '2 days')
ON CONFLICT (user_id, confession_id) DO NOTHING;

COMMIT;

DO $$
DECLARE
    vote_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vote_count FROM votes;
    RAISE NOTICE '✅ Votes created: %', vote_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 6: INSERT AWARDS (Depends on auth.users)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🏆 Step 6: Creating sample award...';
END $$;

BEGIN;

INSERT INTO awards (id, user_id, award_type, award_title, month, year, created_at) VALUES
    ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'Most Viral', 'Most Viral Post - November 2024', 11, 2024, NOW() - INTERVAL '1 week')
ON CONFLICT (id) DO NOTHING;

COMMIT;

DO $$
DECLARE
    award_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO award_count FROM awards;
    RAISE NOTICE '✅ Awards created: %', award_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 7: UPDATE USER TOXICITY SCORES
-- =====================================================
-- Recalculate all user toxicity scores based on their confessions
-- This ensures the scores match the confession data we just inserted

DO $$
BEGIN
    RAISE NOTICE '🔄 Step 7: Updating user toxicity scores...';
END $$;

DO $$
DECLARE
    user_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id FROM user_profiles LOOP
        PERFORM update_user_toxicity_score(user_record.id);
        updated_count := updated_count + 1;
    END LOOP;
    RAISE NOTICE '✅ Toxicity scores updated for % users', updated_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 8: FINAL VERIFICATION AND SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '📊 Step 8: Final verification and summary...';
END $$;

DO $$
DECLARE
    company_count INTEGER;
    auth_user_count INTEGER;
    user_count INTEGER;
    confession_count INTEGER;
    vote_count INTEGER;
    award_count INTEGER;
    user_record RECORD;
BEGIN
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO auth_user_count FROM auth.users WHERE id::text LIKE '550e8400-e29b-41d4-a716-44665544%';
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    SELECT COUNT(*) INTO confession_count FROM confessions;
    SELECT COUNT(*) INTO vote_count FROM votes;
    SELECT COUNT(*) INTO award_count FROM awards;
    
    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                SpilledIn Minimal Seed Data Summary           ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Data Created:';
    RAISE NOTICE '   Companies: %', company_count;
    RAISE NOTICE '   Auth Users: %', auth_user_count;
    RAISE NOTICE '   User Profiles: %', user_count;
    RAISE NOTICE '   Confessions: %', confession_count;
    RAISE NOTICE '   Votes: %', vote_count;
    RAISE NOTICE '   Awards: %', award_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Sample invite code:';
    RAISE NOTICE '   • TECH2024 (TechCorp Inc)';
    RAISE NOTICE '';
    RAISE NOTICE '👥 Sample users:';
    
    -- Show all users
    FOR user_record IN 
        SELECT anonymous_username, toxicity_score 
        FROM user_profiles 
        ORDER BY toxicity_score DESC 
    LOOP
        RAISE NOTICE '   • %: % points', user_record.anonymous_username, user_record.toxicity_score;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Minimal seed data loaded successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready to test:';
    RAISE NOTICE '   • User registration with invite code TECH2024';
    RAISE NOTICE '   • Confession posting and voting';
    RAISE NOTICE '   • Search functionality';
    RAISE NOTICE '   • Toxicity system and tiers';
    RAISE NOTICE '   • Monthly Toxic Wrapped stats';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Update your .env.local with Supabase credentials';
    RAISE NOTICE '   2. Start your Next.js app: pnpm dev';
    RAISE NOTICE '   3. Test with invite code: TECH2024';
    RAISE NOTICE '';
    RAISE NOTICE 'Happy confessing! 🤫';
    RAISE NOTICE '';
END $$;