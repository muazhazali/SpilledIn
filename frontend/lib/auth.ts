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

// Demo user credentials for bypass
const DEMO_USERS = [
  {
    email: "demo@spilledin.com",
    password: "demo123",
    id: "demo-user-1",
    profile: {
      id: "demo-user-1",
      company_id: "demo-company-1",
      anonymous_username: "DemoDeity99",
      toxicity_score: 1250,
      total_upvotes: 89,
      total_downvotes: 23,
      created_at: new Date().toISOString(),
      companies: {
        name: "Demo Corp",
        invite_code: "DEMO2024"
      }
    }
  },
  {
    email: "test@spilledin.com",
    password: "test123",
    id: "demo-user-2",
    profile: {
      id: "demo-user-2",
      company_id: "demo-company-1",
      anonymous_username: "TestTrouble88",
      toxicity_score: 456,
      total_upvotes: 45,
      total_downvotes: 12,
      created_at: new Date().toISOString(),
      companies: {
        name: "Demo Corp",
        invite_code: "DEMO2024"
      }
    }
  }
]

// Check if email is a demo account
const isDemoAccount = (email: string): boolean => {
  return DEMO_USERS.some(user => user.email === email)
}

// Get demo user by email
const getDemoUser = (email: string, password: string) => {
  return DEMO_USERS.find(user => user.email === email && user.password === password)
}

// Store demo session in localStorage
const storeDemoSession = (demoUser: any) => {
  const session = {
    user: {
      id: demoUser.id,
      email: demoUser.email,
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      role: "authenticated"
    },
    access_token: `demo-token-${demoUser.id}`,
    refresh_token: `demo-refresh-${demoUser.id}`,
    expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    token_type: "bearer"
  }
  
  localStorage.setItem('demo_session', JSON.stringify(session))
  localStorage.setItem('demo_profile', JSON.stringify(demoUser.profile))
  return session
}

// Get demo session from localStorage
const getDemoSession = () => {
  try {
    const sessionStr = localStorage.getItem('demo_session')
    const profileStr = localStorage.getItem('demo_profile')
    
    if (!sessionStr || !profileStr) return null
    
    const session = JSON.parse(sessionStr)
    const profile = JSON.parse(profileStr)
    
    // Check if session is expired
    if (Date.now() > session.expires_at) {
      localStorage.removeItem('demo_session')
      localStorage.removeItem('demo_profile')
      return null
    }
    
    return { session, profile }
  } catch {
    return null
  }
}

// Clear demo session
const clearDemoSession = () => {
  localStorage.removeItem('demo_session')
  localStorage.removeItem('demo_profile')
}

export const signUp = async (email: string, password: string, inviteCode: string) => {
  // Check if it's a demo account trying to sign up
  if (isDemoAccount(email)) {
    throw new Error("Demo accounts already exist. Please use the login form instead.")
  }

  // For demo purposes, allow any invite code that starts with "DEMO" or is in the demo list
  const demoInviteCodes = ["TECH2024", "STARTUP123", "MEGA456", "DEMO2024"]
  if (!demoInviteCodes.includes(inviteCode.toUpperCase())) {
    // First, verify the invite code exists in the database
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("invite_code", inviteCode)
      .single()

    if (companyError || !company) {
      throw new Error("Invalid invite code")
    }
  }

  // For demo purposes, create a mock user without real Supabase signup
  if (inviteCode.toUpperCase() === "DEMO2024" || demoInviteCodes.includes(inviteCode.toUpperCase())) {
    // Create a demo user
    const demoUser = {
      id: `demo-user-${Date.now()}`,
      email: email,
      profile: {
        id: `demo-user-${Date.now()}`,
        company_id: "demo-company-1",
        anonymous_username: `DemoUser${Math.floor(Math.random() * 100)}`,
        toxicity_score: 0,
        total_upvotes: 0,
        total_downvotes: 0,
        created_at: new Date().toISOString(),
        companies: {
          name: "Demo Corp",
          invite_code: inviteCode.toUpperCase()
        }
      }
    }

    const session = storeDemoSession(demoUser)
    return { data: { user: session.user, session }, error: null }
  }

  // Real Supabase signup for production
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  if (authData.user) {
    // Generate anonymous username using the database function
    const { data: usernameData, error: usernameError } = await supabase.rpc("generate_anonymous_username")

    if (usernameError) throw usernameError

    // Create user profile
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: authData.user.id,
      company_id: "demo-company-1", // Use demo company for now
      anonymous_username: usernameData,
    })

    if (profileError) throw profileError
  }

  return authData
}

export const signIn = async (email: string, password: string) => {
  // Check if it's a demo account
  if (isDemoAccount(email)) {
    const demoUser = getDemoUser(email, password)
    if (!demoUser) {
      throw new Error("Invalid demo credentials")
    }
    
    const session = storeDemoSession(demoUser)
    return { data: { user: session.user, session }, error: null }
  }

  // Real Supabase signin for production
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signOut = async () => {
  // Clear demo session if it exists
  clearDemoSession()
  
  // Also sign out from Supabase
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  // First check for demo session
  const demoData = getDemoSession()
  if (demoData) {
    return { user: demoData.session.user, profile: demoData.profile }
  }

  // Check real Supabase session
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

export const getSession = async () => {
  // First check for demo session
  const demoData = getDemoSession()
  if (demoData) {
    return demoData.session
  }

  // Check real Supabase session
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Additional auth helper functions
export const resetPassword = async (email: string) => {
  if (isDemoAccount(email)) {
    throw new Error("Password reset is not available for demo accounts. Use the demo credentials to login.")
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw error
}

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) throw error
}

// Auth state change listener
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Demo helper functions
export const getDemoCredentials = () => {
  return DEMO_USERS.map(user => ({
    email: user.email,
    password: user.password,
    username: user.profile.anonymous_username
  }))
}
