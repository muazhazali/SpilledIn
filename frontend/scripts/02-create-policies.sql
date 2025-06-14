-- RLS Policies

-- Companies: Only authenticated users can read
CREATE POLICY "Users can read companies" ON companies
  FOR SELECT TO authenticated USING (true);

-- User profiles: Users can read all profiles, but only update their own
CREATE POLICY "Users can read all profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Confessions: Users can read all, insert their own, delete their own
CREATE POLICY "Users can read all confessions" ON confessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own confessions" ON confessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own confessions" ON confessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Votes: Users can read all, insert/update/delete their own
CREATE POLICY "Users can read all votes" ON votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own votes" ON votes
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Awards: Users can read all
CREATE POLICY "Users can read all awards" ON awards
  FOR SELECT TO authenticated USING (true);
