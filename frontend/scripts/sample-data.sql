-- =====================================================
-- SpilledIn - Sample Data Script
-- =====================================================
-- This script inserts sample data for testing the SpilledIn platform
-- Run this AFTER users have been created through the application
-- =====================================================

-- Note: This script assumes you have created test users through the Supabase Auth system
-- and that their user profiles have been automatically created via the trigger

-- =====================================================
-- SAMPLE CONFESSIONS
-- =====================================================

-- Sample confession 1 - Popular confession
INSERT INTO confessions (id, user_id, company_id, content, upvotes, downvotes) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440201',
    up.id,
    up.company_id,
    'I accidentally sent a meme to the CEO instead of my friend during a serious meeting. He actually laughed and said it made his day! Now I''m wondering if I should send more memes...',
    15,
    2
FROM user_profiles up 
WHERE up.company_id = '550e8400-e29b-41d4-a716-446655440001'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Sample confession 2 - Controversial confession
INSERT INTO confessions (id, user_id, company_id, content, upvotes, downvotes)
SELECT 
    '550e8400-e29b-41d4-a716-446655440202',
    up.id,
    up.company_id,
    'I have been working from a coffee shop for 3 months and telling everyone I am working from home. The wifi is better here and the atmosphere helps me focus. Should I feel guilty?',
    8,
    12
FROM user_profiles up 
WHERE up.company_id = '550e8400-e29b-41d4-a716-446655440001'
AND up.id != (
    SELECT user_id FROM confessions WHERE id = '550e8400-e29b-41d4-a716-446655440201'
)
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Sample confession 3 - Recent confession
INSERT INTO confessions (id, user_id, company_id, content, upvotes, downvotes, created_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440203',
    up.id,
    up.company_id,
    'I pretend to be in meetings when I''m actually taking my dog for walks. My productivity has never been higher and my dog has never been happier. Win-win?',
    5,
    1,
    NOW() - INTERVAL '2 hours'
FROM user_profiles up 
WHERE up.company_id = '550e8400-e29b-41d4-a716-446655440001'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Sample confession 4 - StartupHub company
INSERT INTO confessions (id, user_id, company_id, content, upvotes, downvotes, created_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440204',
    up.id,
    up.company_id,
    'Our startup''s "unlimited PTO" policy is a joke. I''ve taken 3 days off in 8 months because everyone else works 24/7. The peer pressure is real.',
    22,
    3,
    NOW() - INTERVAL '1 day'
FROM user_profiles up 
WHERE up.company_id = '550e8400-e29b-41d4-a716-446655440002'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Sample confession 5 - Long confession
INSERT INTO confessions (id, user_id, company_id, content, upvotes, downvotes, created_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440205',
    up.id,
    up.company_id,
    'I''ve been using ChatGPT to write most of my emails and reports for the past 6 months. My manager keeps praising my "improved communication skills" and "professional writing style." I feel like a fraud but also... it''s working? The AI writes better than I do and I can focus on actual problem-solving instead of wordsmithing.',
    18,
    7,
    NOW() - INTERVAL '3 days'
FROM user_profiles up 
WHERE up.company_id = '550e8400-e29b-41d4-a716-446655440001'
AND up.id NOT IN (
    SELECT user_id FROM confessions WHERE id IN ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440203')
)
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE VOTES
-- =====================================================

-- Create some sample votes (this would normally be done through the application)
-- Note: These INSERT statements will trigger the vote counting functions

-- Votes for confession 1 (popular one)
INSERT INTO votes (user_id, confession_id, vote_type)
SELECT 
    up.id,
    '550e8400-e29b-41d4-a716-446655440201',
    'upvote'
FROM user_profiles up 
WHERE up.company_id = '550e8400-e29b-41d4-a716-446655440001'
AND up.id != (SELECT user_id FROM confessions WHERE id = '550e8400-e29b-41d4-a716-446655440201')
LIMIT 3
ON CONFLICT (user_id, confession_id) DO NOTHING;

-- Some downvotes for confession 2 (controversial one)
INSERT INTO votes (user_id, confession_id, vote_type)
SELECT 
    up.id,
    '550e8400-e29b-41d4-a716-446655440202',
    'downvote'
FROM user_profiles up 
WHERE up.company_id = '550e8400-e29b-41d4-a716-446655440001'
AND up.id != (SELECT user_id FROM confessions WHERE id = '550e8400-e29b-41d4-a716-446655440202')
LIMIT 2
ON CONFLICT (user_id, confession_id) DO NOTHING;

-- =====================================================
-- SAMPLE AWARDS (for testing Toxic Wrapped)
-- =====================================================

-- Award for most toxic user of the month
INSERT INTO awards (user_id, award_type, award_title, month, year)
SELECT 
    up.id,
    'most_toxic',
    'Drama Deity of the Month',
    EXTRACT(MONTH FROM NOW())::INTEGER,
    EXTRACT(YEAR FROM NOW())::INTEGER
FROM user_profiles up 
WHERE up.company_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY up.toxicity_score DESC
LIMIT 1
ON CONFLICT DO NOTHING;

-- Award for most viral post
INSERT INTO awards (user_id, award_type, award_title, month, year)
SELECT 
    c.user_id,
    'most_viral',
    'Viral Confession Champion',
    EXTRACT(MONTH FROM NOW())::INTEGER,
    EXTRACT(YEAR FROM NOW())::INTEGER
FROM confessions c
WHERE c.company_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY c.net_score DESC
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- UPDATE USER TOXICITY SCORES
-- =====================================================

-- Update all user toxicity scores based on their confessions
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM user_profiles LOOP
        PERFORM update_user_toxicity_score(user_record.id);
    END LOOP;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show sample data summary
SELECT 
    'Sample Data Summary' as info,
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT COUNT(*) FROM user_profiles) as total_users,
    (SELECT COUNT(*) FROM confessions) as total_confessions,
    (SELECT COUNT(*) FROM votes) as total_votes,
    (SELECT COUNT(*) FROM awards) as total_awards;

-- Show top confessions by net score
SELECT 
    'Top Confessions' as section,
    c.content,
    c.upvotes,
    c.downvotes,
    c.net_score,
    up.anonymous_username
FROM confessions c
JOIN user_profiles up ON c.user_id = up.id
ORDER BY c.net_score DESC
LIMIT 3;

-- Show user toxicity rankings
SELECT 
    'User Rankings' as section,
    up.anonymous_username,
    up.toxicity_score,
    up.total_upvotes,
    up.total_downvotes,
    co.name as company_name
FROM user_profiles up
JOIN companies co ON up.company_id = co.id
ORDER BY up.toxicity_score DESC
LIMIT 5;

SELECT 'Sample data insertion completed successfully!' as status; 