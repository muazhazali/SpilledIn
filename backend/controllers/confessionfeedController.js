const supabase = require('../config/supabaseClient');
// Fetch confessions with search + sorting + user info
export async function fetchConfessions(searchQuery, sortBy, currentUserId) {
  let query = supabase.from("Confession").select(`
    *,
    users (
      username,
      toxicity_level
    )
  `)

  // Apply search
  if (searchQuery.trim()) {
    query = query.or(
      `content.ilike.%${searchQuery}%,users.username.ilike.%${searchQuery}%`
    )
  }

  // Apply sorting
  if (sortBy === "popular") {
    query = query.order("net_score", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data, error } = await query

  if (error) throw error

  const confessionsWithVotes =
    data?.map((confession) => ({
      ...confession,
      user_vote: null, // Mocked vote for now
      is_own: confession.user_id === currentUserId,
    })) || []

  return confessionsWithVotes
}
