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
    // Get initial session and user data
    const getInitialSession = async () => {
      try {
        // Check for demo session first (client-side only)
        if (typeof window !== 'undefined') {
          const demoSessionStr = localStorage.getItem('demo_session')
          const demoProfileStr = localStorage.getItem('demo_profile')
          
          if (demoSessionStr && demoProfileStr) {
            try {
              const demoSession = JSON.parse(demoSessionStr)
              const demoProfile = JSON.parse(demoProfileStr)
              
              // Check if demo session is still valid
              if (Date.now() < demoSession.expires_at) {
                console.log('Demo session found and valid')
                setSession(demoSession)
                setUser(demoSession.user)
                setProfile(demoProfile)
                setLoading(false)
                return // Exit early for demo session
              } else {
                // Clean up expired demo session
                localStorage.removeItem('demo_session')
                localStorage.removeItem('demo_profile')
              }
            } catch (error) {
              console.error('Error parsing demo session:', error)
              localStorage.removeItem('demo_session')
              localStorage.removeItem('demo_profile')
            }
          }
        }

        // If no valid demo session, check Supabase
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

    // Listen for auth changes (this will work for real Supabase auth)
    // For demo auth, we'll rely on manual state updates
    const { data: { subscription } } = onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        setSession(session)
        
        if (session?.user) {
          try {
            const userData = await getCurrentUser()
            if (userData) {
              setUser(userData.user)
              setProfile(userData.profile)
            }
          } catch (error) {
            console.error('Error fetching user data on auth change:', error)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    // Also listen for demo session changes via storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo_session' || e.key === 'demo_profile') {
        console.log('Demo session storage changed')
        // Refresh user data when demo session changes
        refreshProfile()
      }
    }

    // Listen for demo session changes in the same tab
    const handleDemoSessionChange = () => {
      console.log('Demo session changed, refreshing...')
      refreshProfile()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('demo-session-change', handleDemoSessionChange)
    }

    return () => {
      subscription.unsubscribe()
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('demo-session-change', handleDemoSessionChange)
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authSignIn(email, password)
      
      // Check if this was a demo login by looking for demo session
      if (typeof window !== 'undefined') {
        const demoSessionStr = localStorage.getItem('demo_session')
        const demoProfileStr = localStorage.getItem('demo_profile')
        
        if (demoSessionStr && demoProfileStr) {
          // This was a demo login, manually update state
          const demoSession = JSON.parse(demoSessionStr)
          const demoProfile = JSON.parse(demoProfileStr)
          
          console.log('Demo login successful, updating state')
          setSession(demoSession)
          setUser(demoSession.user)
          setProfile(demoProfile)
          
          // Dispatch custom event for other components
          window.dispatchEvent(new CustomEvent('demo-session-change'))
          return
        }
      }
      
      // For real Supabase auth, refresh profile
      if (result && 'data' in result && result.data?.user) {
        await refreshProfile()
      } else if (result && 'user' in result) {
        // Real Supabase auth result
        await refreshProfile()
      }
    } catch (error) {
      throw error
    }
  }

  const signUp = async (email: string, password: string, inviteCode: string) => {
    try {
      const result = await authSignUp(email, password, inviteCode)
      
      // Check if this was a demo signup by looking for demo session
      if (typeof window !== 'undefined') {
        const demoSessionStr = localStorage.getItem('demo_session')
        const demoProfileStr = localStorage.getItem('demo_profile')
        
        if (demoSessionStr && demoProfileStr) {
          // This was a demo signup, manually update state
          const demoSession = JSON.parse(demoSessionStr)
          const demoProfile = JSON.parse(demoProfileStr)
          
          console.log('Demo signup successful, updating state')
          setSession(demoSession)
          setUser(demoSession.user)
          setProfile(demoProfile)
          
          // Dispatch custom event for other components
          window.dispatchEvent(new CustomEvent('demo-session-change'))
          return
        }
      }
      
      // For real Supabase auth, refresh profile
      if (result && 'data' in result && result.data?.user) {
        await refreshProfile()
      } else if (result && 'user' in result) {
        // Real Supabase auth result
        await refreshProfile()
      }
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    await authSignOut()
    
    // Manually clear state for demo accounts
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