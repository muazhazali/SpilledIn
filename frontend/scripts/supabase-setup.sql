-- =====================================================
-- SpilledIn - Supabase Database Setup Script
-- =====================================================
-- This script sets up the complete database schema for SpilledIn
-- Anonymous Confession Platform with sample data
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TABLES
-- =====================================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    anonymous_username TEXT UNIQUE NOT NULL,
    toxicity_score INTEGER DEFAULT 0,
    total_upvotes INTEGER DEFAULT 0,
    total_downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Confessions table
CREATE TABLE IF NOT EXISTS confessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 1000),
    image_url TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    net_score INTEGER GENERATED ALWAYS AS (upvotes - downvotes) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    confession_id UUID NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, confession_id)
);

-- Awards table for monthly recognition
CREATE TABLE IF NOT EXISTS awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    award_type TEXT NOT NULL,
    award_title TEXT NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_confessions_company_id ON confessions(company_id);
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_net_score ON confessions(net_score DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_user_id ON confessions(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_confession_id ON votes(confession_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_toxicity_score ON user_profiles(toxicity_score DESC);

-- Full-text search index for confessions
CREATE INDEX IF NOT EXISTS idx_confessions_content_search ON confessions USING gin(to_tsvector('english', content));

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- Function to generate anonymous usernames
CREATE OR REPLACE FUNCTION generate_anonymous_username()
RETURNS TEXT AS $$
DECLARE
    adjectives TEXT[] := ARRAY[
        'Mysterious', 'Silent', 'Whispering', 'Hidden', 'Secret', 'Anonymous', 
        'Shadowy', 'Cryptic', 'Enigmatic', 'Veiled', 'Masked', 'Covert',
        'Stealthy', 'Elusive', 'Phantom', 'Ghost', 'Invisible', 'Unknown'
    ];
    nouns TEXT[] := ARRAY[
        'Confessor', 'Whisperer', 'Storyteller', 'Revealer', 'Speaker', 'Voice',
        'Truth-teller', 'Messenger', 'Oracle', 'Sage', 'Witness', 'Narrator',
        'Chronicler', 'Bard', 'Scribe', 'Herald', 'Prophet', 'Seer'
    ];
    username TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        username := adjectives[1 + floor(random() * array_length(adjectives, 1))] || 
                   nouns[1 + floor(random() * array_length(nouns, 1))] || 
                   floor(random() * 9999 + 1)::TEXT;
        
        -- Check if username already exists
        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE anonymous_username = username) THEN
            RETURN username;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            -- Fallback to UUID if we can't generate unique username
            RETURN 'Anonymous' || replace(uuid_generate_v4()::TEXT, '-', '')[:8];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update user toxicity score
CREATE OR REPLACE FUNCTION update_user_toxicity_score(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        total_upvotes = (
            SELECT COALESCE(SUM(upvotes), 0) 
            FROM confessions 
            WHERE user_id = user_uuid
        ),
        total_downvotes = (
            SELECT COALESCE(SUM(downvotes), 0) 
            FROM confessions 
            WHERE user_id = user_uuid
        ),
        toxicity_score = (
            SELECT COALESCE(SUM(upvotes - downvotes), 0) 
            FROM confessions 
            WHERE user_id = user_uuid
        )
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to search confessions with user context
CREATE OR REPLACE FUNCTION search_confessions(
    search_query TEXT DEFAULT NULL,
    company_uuid UUID DEFAULT NULL,
    sort_by TEXT DEFAULT 'popular',
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    image_url TEXT,
    upvotes INTEGER,
    downvotes INTEGER,
    net_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    anonymous_username TEXT,
    toxicity_score INTEGER,
    user_vote TEXT,
    is_own BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.content,
        c.image_url,
        c.upvotes,
        c.downvotes,
        c.net_score,
        c.created_at,
        c.user_id,
        up.anonymous_username,
        up.toxicity_score,
        v.vote_type as user_vote,
        (c.user_id = auth.uid()) as is_own
    FROM confessions c
    JOIN user_profiles up ON c.user_id = up.id
    LEFT JOIN votes v ON c.id = v.confession_id AND v.user_id = auth.uid()
    WHERE 
        (company_uuid IS NULL OR c.company_id = company_uuid)
        AND (search_query IS NULL OR 
             to_tsvector('english', c.content) @@ plainto_tsquery('english', search_query) OR
             up.anonymous_username ILIKE '%' || search_query || '%')
    ORDER BY 
        CASE 
            WHEN sort_by = 'popular' THEN c.net_score 
            ELSE NULL 
        END DESC,
        CASE 
            WHEN sort_by = 'latest' THEN c.created_at 
            ELSE NULL 
        END DESC,
        c.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly statistics
CREATE OR REPLACE FUNCTION get_monthly_stats(target_month INTEGER, target_year INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'top_users', (
            SELECT json_agg(
                json_build_object(
                    'anonymous_username', up.anonymous_username,
                    'toxicity_score', up.toxicity_score,
                    'total_upvotes', up.total_upvotes,
                    'total_downvotes', up.total_downvotes
                )
            )
            FROM user_profiles up
            WHERE EXISTS (
                SELECT 1 FROM confessions c 
                WHERE c.user_id = up.id 
                AND EXTRACT(MONTH FROM c.created_at) = target_month
                AND EXTRACT(YEAR FROM c.created_at) = target_year
            )
            ORDER BY up.toxicity_score DESC
            LIMIT 10
        ),
        'top_confessions', (
            SELECT json_agg(
                json_build_object(
                    'id', c.id,
                    'content', c.content,
                    'net_score', c.net_score,
                    'anonymous_username', up.anonymous_username,
                    'created_at', c.created_at
                )
            )
            FROM confessions c
            JOIN user_profiles up ON c.user_id = up.id
            WHERE EXTRACT(MONTH FROM c.created_at) = target_month
            AND EXTRACT(YEAR FROM c.created_at) = target_year
            ORDER BY c.net_score DESC
            LIMIT 10
        ),
        'total_confessions', (
            SELECT COUNT(*)
            FROM confessions
            WHERE EXTRACT(MONTH FROM created_at) = target_month
            AND EXTRACT(YEAR FROM created_at) = target_year
        ),
        'average_toxicity', (
            SELECT COALESCE(AVG(toxicity_score), 0)
            FROM user_profiles up
            WHERE EXISTS (
                SELECT 1 FROM confessions c 
                WHERE c.user_id = up.id 
                AND EXTRACT(MONTH FROM c.created_at) = target_month
                AND EXTRACT(YEAR FROM c.created_at) = target_year
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get company statistics
CREATE OR REPLACE FUNCTION get_company_stats(company_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (
            SELECT COUNT(*) FROM user_profiles WHERE company_id = company_uuid
        ),
        'total_confessions', (
            SELECT COUNT(*) FROM confessions WHERE company_id = company_uuid
        ),
        'total_votes', (
            SELECT COUNT(*) FROM votes v
            JOIN confessions c ON v.confession_id = c.id
            WHERE c.company_id = company_uuid
        ),
        'average_toxicity', (
            SELECT COALESCE(AVG(toxicity_score), 0)
            FROM user_profiles
            WHERE company_id = company_uuid
        ),
        'top_users', (
            SELECT json_agg(
                json_build_object(
                    'anonymous_username', anonymous_username,
                    'toxicity_score', toxicity_score
                )
            )
            FROM user_profiles
            WHERE company_id = company_uuid
            ORDER BY toxicity_score DESC
            LIMIT 5
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Trigger to update confession vote counts
CREATE OR REPLACE FUNCTION update_confession_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE confessions SET upvotes = upvotes + 1 WHERE id = NEW.confession_id;
        ELSE
            UPDATE confessions SET downvotes = downvotes + 1 WHERE id = NEW.confession_id;
        END IF;
        
        -- Update user toxicity score
        PERFORM update_user_toxicity_score((
            SELECT user_id FROM confessions WHERE id = NEW.confession_id
        ));
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE confessions SET upvotes = upvotes - 1 WHERE id = OLD.confession_id;
        ELSE
            UPDATE confessions SET downvotes = downvotes - 1 WHERE id = OLD.confession_id;
        END IF;
        
        -- Update user toxicity score
        PERFORM update_user_toxicity_score((
            SELECT user_id FROM confessions WHERE id = OLD.confession_id
        ));
        
        RETURN OLD;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Handle vote type change
        IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
            UPDATE confessions SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.confession_id;
        ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
            UPDATE confessions SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.confession_id;
        END IF;
        
        -- Update user toxicity score
        PERFORM update_user_toxicity_score((
            SELECT user_id FROM confessions WHERE id = NEW.confession_id
        ));
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_confession_votes
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_confession_votes();

-- Trigger to create user profile on auth user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    company_uuid UUID;
    username TEXT;
BEGIN
    -- Get company_id from user metadata (set during registration)
    company_uuid := (NEW.raw_user_meta_data->>'company_id')::UUID;
    
    IF company_uuid IS NULL THEN
        RAISE EXCEPTION 'Company ID is required for user registration';
    END IF;
    
    -- Generate anonymous username
    username := generate_anonymous_username();
    
    -- Create user profile
    INSERT INTO user_profiles (id, company_id, anonymous_username)
    VALUES (NEW.id, company_uuid, username);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

-- User profiles policies
CREATE POLICY "Users can view all profiles in their company" ON user_profiles
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Confessions policies
CREATE POLICY "Users can view confessions in their company" ON confessions
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create confessions" ON confessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete their own confessions" ON confessions
    FOR DELETE USING (user_id = auth.uid());

-- Votes policies
CREATE POLICY "Users can view votes on confessions in their company" ON votes
    FOR SELECT USING (
        confession_id IN (
            SELECT c.id FROM confessions c
            JOIN user_profiles up ON c.company_id = up.company_id
            WHERE up.id = auth.uid()
        )
    );

CREATE POLICY "Users can create votes" ON votes
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        confession_id IN (
            SELECT c.id FROM confessions c
            JOIN user_profiles up ON c.company_id = up.company_id
            WHERE up.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (user_id = auth.uid());

-- Awards policies
CREATE POLICY "Users can view all awards in their company" ON awards
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM user_profiles up
            WHERE up.company_id IN (
                SELECT company_id FROM user_profiles WHERE id = auth.uid()
            )
        )
    );

-- =====================================================
-- 6. STORAGE BUCKET FOR IMAGES
-- =====================================================

-- Create storage bucket for confession images
INSERT INTO storage.buckets (id, name, public)
VALUES ('confession-images', 'confession-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload confession images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'confession-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Anyone can view confession images" ON storage.objects
    FOR SELECT USING (bucket_id = 'confession-images');

CREATE POLICY "Users can delete their own confession images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'confession-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- 7. SAMPLE DATA
-- =====================================================

-- Insert sample companies
INSERT INTO companies (id, name, invite_code) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'TechCorp Inc', 'TECH2024'),
    ('550e8400-e29b-41d4-a716-446655440002', 'StartupHub', 'STARTUP2024')
ON CONFLICT (invite_code) DO NOTHING;

-- Note: Sample users and confessions would be created through the application
-- since they require proper auth.users entries. The following is for reference:

-- Sample user profiles (these would be created via the trigger when users sign up)
-- INSERT INTO user_profiles (id, company_id, anonymous_username, toxicity_score, total_upvotes, total_downvotes) VALUES
--     ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'MysteriousConfessor42', 15, 20, 5),
--     ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'SilentWhisperer99', -3, 5, 8);

-- Sample confessions (these would be created through the application)
-- INSERT INTO confessions (id, user_id, company_id, content, upvotes, downvotes) VALUES
--     ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'I accidentally sent a meme to the CEO instead of my friend. He actually laughed and said it made his day!', 15, 2),
--     ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'I have been working from a coffee shop for 3 months and telling everyone I am at home. The wifi is better here.', 8, 12);

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'SpilledIn database setup completed successfully!' as status;