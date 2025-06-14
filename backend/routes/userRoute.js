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
      .from('user_profiles')
      .select(`
        *,
        companies (
          name,
          invite_code
        )
      `)
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get confession count
    const { count: confessionCount } = await supabase
      .from('confessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    // Get recent activity
    const { data: recentConfessions } = await supabase
      .from('confessions')
      .select('id, content, created_at, upvotes, downvotes')
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
      .from('user_profiles')
      .update({ anonymous_username })
      .eq('id', req.user.id)
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
      .from('user_profiles')
      .select('toxicity_score, created_at')
      .eq('id', req.user.id)
      .single();

    res.json({
      history: [
        {
          date: profile.created_at,
          score: profile.toxicity_score,
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
      .from('user_profiles')
      .update({ anonymous_username: newUsername })
      .eq('id', req.user.id)
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
