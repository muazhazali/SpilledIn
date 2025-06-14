-- Function to generate random anonymous username
CREATE OR REPLACE FUNCTION generate_anonymous_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Sneaky', 'Mysterious', 'Curious', 'Brave', 'Witty', 'Clever', 'Bold', 'Swift', 'Silent', 'Fierce'];
  nouns TEXT[] := ARRAY['Panda', 'Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Hawk', 'Owl', 'Shark'];
  username TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    username := adjectives[1 + floor(random() * array_length(adjectives, 1))] || 
                nouns[1 + floor(random() * array_length(nouns, 1))] || 
                floor(random() * 1000)::TEXT;
    
    -- Check if username already exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE anonymous_username = username) THEN
      RETURN username;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      -- Fallback to UUID if we can't generate unique username
      RETURN 'User' || replace(uuid_generate_v4()::TEXT, '-', '')::TEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get toxicity tier
CREATE OR REPLACE FUNCTION get_toxicity_tier(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  CASE 
    WHEN score >= 1000 THEN RETURN 'Drama Deity 👑'
    WHEN score >= 500 THEN RETURN 'Chaos Champion'
    WHEN score >= 250 THEN RETURN 'Trouble Maker'
    WHEN score >= 100 THEN RETURN 'Stirrer'
    WHEN score >= 50 THEN RETURN 'Instigator'
    WHEN score >= 0 THEN RETURN 'Neutral'
    WHEN score >= -50 THEN RETURN 'Peacekeeper'
    WHEN score >= -100 THEN RETURN 'Harmony Helper'
    WHEN score >= -250 THEN RETURN 'Zen Master'
    ELSE RETURN 'Whisperer'
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update user toxicity score
CREATE OR REPLACE FUNCTION update_user_toxicity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update confession vote counts
    IF NEW.vote_type = 'upvote' THEN
      UPDATE confessions SET upvotes = upvotes + 1 WHERE id = NEW.confession_id;
    ELSE
      UPDATE confessions SET downvotes = downvotes + 1 WHERE id = NEW.confession_id;
    END IF;
    
    -- Update user toxicity score
    UPDATE user_profiles 
    SET 
      total_upvotes = (SELECT COALESCE(SUM(upvotes), 0) FROM confessions WHERE user_id = user_profiles.id),
      total_downvotes = (SELECT COALESCE(SUM(downvotes), 0) FROM confessions WHERE user_id = user_profiles.id),
      toxicity_score = (SELECT COALESCE(SUM(upvotes - downvotes), 0) FROM confessions WHERE user_id = user_profiles.id)
    WHERE id = (SELECT user_id FROM confessions WHERE id = NEW.confession_id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote changes
    UPDATE confessions 
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE 0 END - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE 0 END,
      downvotes = downvotes + CASE WHEN NEW.vote_type = 'downvote' THEN 1 ELSE 0 END - CASE WHEN OLD.vote_type = 'downvote' THEN 1 ELSE 0 END
    WHERE id = NEW.confession_id;
    
    -- Update user toxicity score
    UPDATE user_profiles 
    SET 
      total_upvotes = (SELECT COALESCE(SUM(upvotes), 0) FROM confessions WHERE user_id = user_profiles.id),
      total_downvotes = (SELECT COALESCE(SUM(downvotes), 0) FROM confessions WHERE user_id = user_profiles.id),
      toxicity_score = (SELECT COALESCE(SUM(upvotes - downvotes), 0) FROM confessions WHERE user_id = user_profiles.id)
    WHERE id = (SELECT user_id FROM confessions WHERE id = NEW.confession_id);
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove vote counts
    IF OLD.vote_type = 'upvote' THEN
      UPDATE confessions SET upvotes = upvotes - 1 WHERE id = OLD.confession_id;
    ELSE
      UPDATE confessions SET downvotes = downvotes - 1 WHERE id = OLD.confession_id;
    END IF;
    
    -- Update user toxicity score
    UPDATE user_profiles 
    SET 
      total_upvotes = (SELECT COALESCE(SUM(upvotes), 0) FROM confessions WHERE user_id = user_profiles.id),
      total_downvotes = (SELECT COALESCE(SUM(downvotes), 0) FROM confessions WHERE user_id = user_profiles.id),
      toxicity_score = (SELECT COALESCE(SUM(upvotes - downvotes), 0) FROM confessions WHERE user_id = user_profiles.id)
    WHERE id = (SELECT user_id FROM confessions WHERE id = OLD.confession_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote updates
CREATE TRIGGER trigger_update_toxicity
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_user_toxicity();
