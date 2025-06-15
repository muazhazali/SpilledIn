'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { UserProfileWithCompany } from '@/lib/supabase'
import { 
  signIn as authSignIn, 
  signUp as authSignUp, 
  signOut as authSignOut, 
  getCurrentUser, 
  getSession,
  onAuthStateChange 
} from '@/lib/auth'

interface AuthContextType {
  user: User | null
  profile: UserProfileWithCompany | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, inviteCode: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfileWithCompany | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    try {
      const userData = await getCurrentUser()
      if (userData) {
        setUser(userData.user)
        setProfile(userData.profile)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
      setUser(null)
      setProfile(null)
    }
  }

  useEffect(() => {
    // Load current Supabase session & user profile
    const getInitialSession = async () => {
      try {
        const sessionData = await getSession()
        const userData = await getCurrentUser()
        
        setSession(sessionData)
        
        if (userData) {
          setUser(userData.user)
          setProfile(userData.profile)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setSession(null)
        setUser(null)
        setProfile(null)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes (supabase provides real-time listener)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => refreshProfile())
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', () => refreshProfile())
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await authSignIn(email, password)
      // Always refresh the profile after a successful sign-in
      await refreshProfile()
    } catch (error) {
      throw error
    }
  }

  const signUp = async (email: string, password: string, inviteCode: string) => {
    try {
      await authSignUp(email, password, inviteCode)
      // Refresh profile after sign-up completes
      await refreshProfile()
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    await authSignOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Standalone hook for components that don't need the full context
export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await getCurrentUser()
        setUser(userData?.user ?? null)
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
} 