-- =====================================================
-- SpilledIn Database Setup Script for Supabase
-- =====================================================
-- This script creates all necessary tables, functions, triggers, 
-- policies, and storage buckets for the SpilledIn platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

-- Companies table (for invite code management)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
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
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 1000),
    image_url TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    net_score INTEGER GENERATED ALWAYS AS (upvotes - downvotes) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table (tracks individual user votes)
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confession_id UUID NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, confession_id)
);

-- Awards table (for monthly recognition)
CREATE TABLE IF NOT EXISTS awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    award_type TEXT NOT NULL,
    award_title TEXT NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_confessions_company_id ON confessions(company_id);
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_net_score ON confessions(net_score DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_user_id ON confessions(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_confession_id ON votes(confession_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_toxicity_score ON user_profiles(toxicity_score DESC);
CREATE INDEX IF NOT EXISTS idx_awards_user_id ON awards(user_id);
CREATE INDEX IF NOT EXISTS idx_awards_month_year ON awards(year DESC, month DESC);

-- Full-text search index for confessions
CREATE INDEX IF NOT EXISTS idx_confessions_content_search ON confessions USING gin(to_tsvector('english', content));

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate anonymous usernames
CREATE OR REPLACE FUNCTION generate_anonymous_username()
RETURNS TEXT AS $$
DECLARE
    adjectives TEXT[] := ARRAY[
        'Sneaky', 'Mysterious', 'Chaotic', 'Dramatic', 'Toxic', 'Savage', 'Spicy', 'Shady',
        'Fierce', 'Wild', 'Bold', 'Sassy', 'Rebel', 'Rogue', 'Stealth', 'Shadow', 'Storm',
        'Fire', 'Ice', 'Thunder', 'Lightning', 'Venom', 'Phantom', 'Ghost', 'Ninja',
        'Pirate', 'Warrior', 'Hunter', 'Ranger', 'Wizard', 'Demon', 'Angel', 'Dragon'
    ];
    animals TEXT[] := ARRAY[
        'Panda', 'Fox', 'Wolf', 'Tiger', 'Lion', 'Bear', 'Eagle', 'Hawk', 'Raven', 'Owl',
        'Snake', 'Spider', 'Shark', 'Whale', 'Dolphin', 'Octopus', 'Panther', 'Jaguar',
        'Cheetah', 'Leopard', 'Lynx', 'Falcon', 'Phoenix', 'Griffin', 'Unicorn', 'Pegasus',
        'Kraken', 'Hydra', 'Cerberus', 'Sphinx', 'Minotaur', 'Chimera', 'Basilisk', 'Wyvern'
    ];
    username TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        username := (adjectives[1 + floor(random() * array_length(adjectives, 1))::int]) ||
                   (animals[1 + floor(random() * array_length(animals, 1))::int]) ||
                   floor(random() * 100)::text;
        
        -- Check if username already exists
        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE anonymous_username = username) THEN
            RETURN username;
        END IF;
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 100 THEN
            username := username || '_' || extract(epoch from now())::bigint;
            RETURN username;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update user toxicity scores
CREATE OR REPLACE FUNCTION update_user_toxicity_score(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        toxicity_score = (
            SELECT COALESCE(SUM(net_score), 0) 
            FROM confessions 
            WHERE user_id = user_uuid
        ),
        total_upvotes = (
            SELECT COALESCE(SUM(upvotes), 0) 
            FROM confessions 
            WHERE user_id = user_uuid
        ),
        total_downvotes = (
            SELECT COALESCE(SUM(downvotes), 0) 
            FROM confessions 
            WHERE user_id = user_uuid
        )
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to handle vote changes
CREATE OR REPLACE FUNCTION handle_vote_change()
RETURNS TRIGGER AS $$
DECLARE
    confession_user_id UUID;
BEGIN
    -- Get the confession's user_id
    SELECT user_id INTO confession_user_id 
    FROM confessions 
    WHERE id = COALESCE(NEW.confession_id, OLD.confession_id);

    -- Update confession vote counts
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE confessions SET upvotes = upvotes + 1 WHERE id = NEW.confession_id;
        ELSE
            UPDATE confessions SET downvotes = downvotes + 1 WHERE id = NEW.confession_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Remove old vote
        IF OLD.vote_type = 'upvote' THEN
            UPDATE confessions SET upvotes = upvotes - 1 WHERE id = OLD.confession_id;
        ELSE
            UPDATE confessions SET downvotes = downvotes - 1 WHERE id = OLD.confession_id;
        END IF;
        -- Add new vote
        IF NEW.vote_type = 'upvote' THEN
            UPDATE confessions SET upvotes = upvotes + 1 WHERE id = NEW.confession_id;
        ELSE
            UPDATE confessions SET downvotes = downvotes + 1 WHERE id = NEW.confession_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE confessions SET upvotes = upvotes - 1 WHERE id = OLD.confession_id;
        ELSE
            UPDATE confessions SET downvotes = downvotes - 1 WHERE id = OLD.confession_id;
        END IF;
    END IF;

    -- Update user toxicity score
    PERFORM update_user_toxicity_score(confession_user_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to search confessions
CREATE OR REPLACE FUNCTION search_confessions(
    search_query TEXT,
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
    anonymous_username TEXT,
    user_toxicity_score INTEGER
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
        up.anonymous_username,
        up.toxicity_score
    FROM confessions c
    JOIN user_profiles up ON c.user_id = up.id
    WHERE 
        (company_uuid IS NULL OR c.company_id = company_uuid)
        AND (
            search_query IS NULL 
            OR search_query = '' 
            OR to_tsvector('english', c.content) @@ plainto_tsquery('english', search_query)
            OR up.anonymous_username ILIKE '%' || search_query || '%'
        )
    ORDER BY 
        CASE 
            WHEN sort_by = 'popular' THEN c.net_score 
            ELSE NULL 
        END DESC,
        CASE 
            WHEN sort_by = 'latest' THEN c.created_at 
            ELSE NULL 
        END DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly stats for Toxic Wrapped
CREATE OR REPLACE FUNCTION get_monthly_stats(
    target_month INTEGER,
    target_year INTEGER,
    company_uuid UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := DATE(target_year || '-' || target_month || '-01');
    end_date := (start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    SELECT json_build_object(
        'total_confessions', (
            SELECT COUNT(*) 
            FROM confessions c
            WHERE c.created_at::DATE BETWEEN start_date AND end_date
            AND (company_uuid IS NULL OR c.company_id = company_uuid)
        ),
        'total_votes', (
            SELECT COUNT(*) 
            FROM votes v
            JOIN confessions c ON v.confession_id = c.id
            WHERE v.created_at::DATE BETWEEN start_date AND end_date
            AND (company_uuid IS NULL OR c.company_id = company_uuid)
        ),
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
            WHERE (company_uuid IS NULL OR up.company_id = company_uuid)
            ORDER BY up.toxicity_score DESC
            LIMIT 10
        ),
        'top_confessions', (
            SELECT json_agg(
                json_build_object(
                    'id', c.id,
                    'content', c.content,
                    'net_score', c.net_score,
                    'anonymous_username', up.anonymous_username
                )
            )
            FROM confessions c
            JOIN user_profiles up ON c.user_id = up.id
            WHERE c.created_at::DATE BETWEEN start_date AND end_date
            AND (company_uuid IS NULL OR c.company_id = company_uuid)
            ORDER BY c.net_score DESC
            LIMIT 5
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for vote changes
DROP TRIGGER IF EXISTS trigger_vote_change ON votes;
CREATE TRIGGER trigger_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION handle_vote_change();

-- Trigger to update toxicity score when confession is deleted
CREATE OR REPLACE FUNCTION handle_confession_delete()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_toxicity_score(OLD.user_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_confession_delete ON confessions;
CREATE TRIGGER trigger_confession_delete
    AFTER DELETE ON confessions
    FOR EACH ROW
    EXECUTE FUNCTION handle_confession_delete();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Companies are viewable by authenticated users" ON companies
    FOR SELECT USING (auth.role() = 'authenticated');

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Confessions policies
CREATE POLICY "Confessions are viewable by authenticated users" ON confessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own confessions" ON confessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own confessions" ON confessions
    FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Users can view all votes" ON votes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own votes" ON votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (auth.uid() = user_id);

-- Awards policies
CREATE POLICY "Awards are viewable by authenticated users" ON awards
    FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for confession images
INSERT INTO storage.buckets (id, name, public)
VALUES ('confession-images', 'confession-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for confession images
CREATE POLICY "Confession images are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'confession-images');

CREATE POLICY "Authenticated users can upload confession images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'confession-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own confession images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'confession-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample companies
INSERT INTO companies (name, invite_code) VALUES
    ('TechCorp Inc', 'TECH2024'),
    ('StartupXYZ', 'STARTUP123'),
    ('MegaCorp Ltd', 'MEGA456'),
    ('InnovateLab', 'INNOVATE789'),
    ('DigitalFirst', 'DIGITAL2024')
ON CONFLICT (invite_code) DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS FOR ADMIN
-- =====================================================

-- Function to get company statistics
CREATE OR REPLACE FUNCTION get_company_stats(company_uuid UUID)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'company_name', c.name,
            'total_users', (
                SELECT COUNT(*) FROM user_profiles WHERE company_id = company_uuid
            ),
            'total_confessions', (
                SELECT COUNT(*) FROM confessions WHERE company_id = company_uuid
            ),
            'total_votes', (
                SELECT COUNT(*) FROM votes v 
                JOIN confessions conf ON v.confession_id = conf.id 
                WHERE conf.company_id = company_uuid
            ),
            'average_toxicity', (
                SELECT COALESCE(AVG(toxicity_score), 0) 
                FROM user_profiles 
                WHERE company_id = company_uuid
            )
        )
        FROM companies c
        WHERE c.id = company_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old votes first (due to foreign key constraints)
    DELETE FROM votes 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    -- Delete old confessions
    DELETE FROM confessions 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'SpilledIn database setup completed successfully!';
    RAISE NOTICE 'Tables created: companies, user_profiles, confessions, votes, awards';
    RAISE NOTICE 'Functions created: generate_anonymous_username, search_confessions, get_monthly_stats, etc.';
    RAISE NOTICE 'Storage bucket created: confession-images';
    RAISE NOTICE 'Row Level Security policies enabled';
    RAISE NOTICE 'Sample companies inserted with invite codes: TECH2024, STARTUP123, MEGA456, INNOVATE789, DIGITAL2024';
END $$;