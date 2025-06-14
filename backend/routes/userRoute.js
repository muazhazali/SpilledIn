// routes/users.js
const express = require('express');
const supabase = require('../config/supabaseClient')
const router = express.Router();

// Middleware to verify Supabase JWT token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// GET /api/users/profile - Get user profile with stats
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        *,
        Company (
          name,
          registration_link
        )
      `)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get confession count
    const { count: confessionCount } = await supabase
      .from('Confession')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    // Get recent activity
    const { data: recentConfessions } = await supabase
      .from('Confession')
      .select('confession_id, content, datetime_posted, upvote, downvote')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      profile,
      stats: {
        confessionCount: confessionCount || 0,
        recentConfessions: recentConfessions || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { anonymous_username } = req.body;

    // Validate input
    if (!anonymous_username || anonymous_username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ anonymous_username })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Username already taken' });
      }
      throw error;
    }

    res.json({ profile: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/toxicity-history - Get user's toxicity score history
router.get('/toxicity-history', authenticateUser, async (req, res) => {
  try {
    // This would require a toxicity_history table
    // For now, return current score
    const { data: profile } = await supabase
      .from('users')
      .select('toxicity_level, date_joined')
      .eq('user_id', req.user.id)
      .single();

    res.json({
      history: [
        {
          date: profile.date_joined,
          score: profile.toxicity_level,
          change: 0
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch toxicity history' });
  }
});

// POST /api/users/regenerate-username - Generate new anonymous username
router.post('/regenerate-username', authenticateUser, async (req, res) => {
  try {
    const { data: newUsername } = await supabase.rpc('generate_anonymous_username');

    const { data, error } = await supabase
      .from('users')
      .update({ anonymous_username: newUsername })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ username: newUsername });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate username' });
  }
});

// GET /api/users/awards - Get user's awards
router.get('/awards', authenticateUser, async (req, res) => {
  try {
    const { data: awards, error } = await supabase
      .from('awards')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ awards: awards || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch awards' });
  }
});

// DELETE /api/users/account - Delete user account
router.delete('/account', authenticateUser, async (req, res) => {
  try {
    // Delete user profile (cascades to confessions, votes, etc.)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
