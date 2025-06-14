import { supabase } from "./supabase"

export const getToxicityTier = (score: number): { name: string; color: string; emoji: string } => {
  if (score >= 1000) return { name: "Drama Deity", color: "text-purple-600 border-purple-500", emoji: "👑" }
  if (score >= 500) return { name: "Chaos Champion", color: "text-red-600 border-red-500", emoji: "🔥" }
  if (score >= 250) return { name: "Trouble Maker", color: "text-orange-600 border-orange-500", emoji: "😈" }
  if (score >= 100) return { name: "Stirrer", color: "text-yellow-600 border-yellow-500", emoji: "🌪️" }
  if (score >= 50) return { name: "Instigator", color: "text-amber-600 border-amber-500", emoji: "⚡" }
  if (score >= 0) return { name: "Neutral", color: "text-gray-600 border-gray-500", emoji: "😐" }
  if (score >= -50) return { name: "Peacekeeper", color: "text-blue-600 border-blue-500", emoji: "🕊️" }
  if (score >= -100) return { name: "Harmony Helper", color: "text-green-600 border-green-500", emoji: "🌱" }
  if (score >= -250) return { name: "Zen Master", color: "text-emerald-600 border-emerald-500", emoji: "🧘" }
  return { name: "Whisperer", color: "text-indigo-600 border-indigo-500", emoji: "🤫" }
}

export const signUp = async (email: string, password: string, inviteCode: string) => {
  // First, verify the invite code exists
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("invite_code", inviteCode)
    .single()

  if (companyError || !company) {
    throw new Error("Invalid invite code")
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  if (authData.user) {
    // Store user in localStorage for demo
    localStorage.setItem("spilledin_user", JSON.stringify(authData.user))

    // Generate anonymous username
    const { data: usernameData, error: usernameError } = await supabase.rpc("generate_anonymous_username")

    if (usernameError) throw usernameError

    // Create user profile (simulated)
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: authData.user.id,
      company_id: company.id,
      anonymous_username: usernameData,
    })

    if (profileError) throw profileError
  }

  return authData
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Store user in localStorage for demo
  if (data.user) {
    localStorage.setItem("spilledin_user", JSON.stringify(data.user))
  }

  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error

  // Remove user from localStorage
  localStorage.removeItem("spilledin_user")
}

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select(`
      *,
      companies (
        name,
        invite_code
      )
    `)
    .eq("id", user.id)
    .single()

  if (error) throw error

  return { user, profile }
}
