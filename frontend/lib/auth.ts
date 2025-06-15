'use client'

import { supabase } from "./supabase"

/**
 * Utility: map a toxicity score to a tier label & styling helpers
 */
export const getToxicityTier = (score: number): { name: string; color: string; emoji: string } => {
  if (score >= 1000) return { name: "Drama Deity", color: "bg-purple-100 text-purple-800 border-purple-300", emoji: "👑" }
  if (score >= 500) return { name: "Chaos Champion", color: "bg-red-100 text-red-800 border-red-300", emoji: "🔥" }
  if (score >= 250) return { name: "Trouble Maker", color: "bg-orange-100 text-orange-800 border-orange-300", emoji: "😈" }
  if (score >= 100) return { name: "Stirrer", color: "bg-yellow-100 text-yellow-800 border-yellow-300", emoji: "🌪️" }
  if (score >= 50) return { name: "Instigator", color: "bg-amber-100 text-amber-800 border-amber-300", emoji: "⚡" }
  if (score >= 0) return { name: "Neutral", color: "bg-gray-100 text-gray-800 border-gray-300", emoji: "😐" }
  if (score >= -50) return { name: "Peacekeeper", color: "bg-blue-100 text-blue-800 border-blue-300", emoji: "🕊️" }
  if (score >= -100) return { name: "Harmony Helper", color: "bg-green-100 text-green-800 border-green-300", emoji: "🌱" }
  if (score >= -250) return { name: "Zen Master", color: "bg-emerald-100 text-emerald-800 border-emerald-300", emoji: "🧘" }
  return { name: "Whisperer", color: "bg-indigo-100 text-indigo-800 border-indigo-300", emoji: "🤫" }
}

// ---------------------------------------------------------------------------
// Core authentication helpers – all production-grade, no demo shortcuts
// ---------------------------------------------------------------------------

/**
 * Sign a new user up.
 * 1. Validate the provided invite-code exists in `companies`.
 * 2. Call Supabase auth sign-up.
 * 3. Generate an anonymous username via the stored procedure and create a profile row.
 */
export const signUp = async (email: string, password: string, inviteCode: string) => {
  // Step 1 – verify invite code → company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("invite_code", inviteCode)
    .single()

  if (companyError || !company) {
    throw new Error("Invalid invite code")
  }

  // Step 2 – create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
  if (authError) throw authError

  // Step 3 – create profile row for the new user
  if (authData.user) {
    // Generate anonymous username using Postgres function
    const { data: usernameData, error: usernameError } = await supabase.rpc("generate_anonymous_username")
    if (usernameError) throw usernameError

    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: authData.user.id,
      company_id: company.id,
      anonymous_username: usernameData,
    })

    if (profileError) throw profileError
  }

  return authData
}

/**
 * Regular email / password login.
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Sign the current user out. */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Fetch the current user + their extended profile.
 */
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select(
      `*,
      companies (
        name,
        invite_code
      )`
    )
    .eq("id", user.id)
    .single()

  if (error) throw error

  return { user, profile }
}

/** Return the current auth session (if any). */
export const getSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/** Pass-through helper for real-time auth state changes. */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}
