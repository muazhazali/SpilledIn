const supabase = require('../config/supabaseClient');
// Uploads image to Supabase Storage and returns public URL
export async function uploadImageToSupabase(file, userId) {
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`

  const { data, error: uploadError } = await supabase.storage
    .from("Confession")
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from("Confession")
    .getPublicUrl(fileName)

  return publicUrl
}

// Inserts a new confession into Supabase DB
export async function createConfession(content, imageUrl, userId, companyId) {
  const { error } = await supabase.from("Confession").insert({
    user_id: userId,
    company_id: companyId,
    content: content.trim(),
    image_url: imageUrl || null,
  })

  if (error) throw error
}

// Delete a confession owned by the current user
export async function deleteConfession(confessionId, currentUserId) {
  const { error } = await supabase
    .from("Confession")
    .delete()
    .eq("confession_id", confessionId)
    .eq("user_id", currentUserId)

  if (error) throw error
}

export function applyVoteLogic(confessions, confessionId, voteType) {
  return confessions.map((confession) => {
    if (confession.id === confessionId) {
      const currentVote = confession.user_vote
      let newUpvotes = confession.upvotes
      let newDownvotes = confession.downvotes
      let newUserVote = confession.user_vote

      if (currentVote === "upvote") newUpvotes -= 1
      else if (currentVote === "downvote") newDownvotes -= 1

      if (currentVote !== voteType) {
        if (voteType === "upvote") {
          newUpvotes += 1
          newUserVote = "upvote"
        } else {
          newDownvotes += 1
          newUserVote = "downvote"
        }
      } else {
        newUserVote = null
      }

      return {
        ...confession,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        net_score: newUpvotes - newDownvotes,
        user_vote: newUserVote,
      }
    }

    return confession
  })
}