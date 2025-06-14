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