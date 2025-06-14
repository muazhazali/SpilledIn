import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          company_id: string
          anonymous_username: string
          toxicity_score: number
          total_upvotes: number
          total_downvotes: number
          created_at: string
        }
        Insert: {
          id: string
          company_id: string
          anonymous_username: string
          toxicity_score?: number
          total_upvotes?: number
          total_downvotes?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          anonymous_username?: string
          toxicity_score?: number
          total_upvotes?: number
          total_downvotes?: number
          created_at?: string
        }
      }
      confessions: {
        Row: {
          id: string
          user_id: string
          company_id: string
          content: string
          image_url: string | null
          upvotes: number
          downvotes: number
          net_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          content: string
          image_url?: string | null
          upvotes?: number
          downvotes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          content?: string
          image_url?: string | null
          upvotes?: number
          downvotes?: number
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          confession_id: string
          vote_type: "upvote" | "downvote"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          confession_id: string
          vote_type: "upvote" | "downvote"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          confession_id?: string
          vote_type?: "upvote" | "downvote"
          created_at?: string
        }
      }
      awards: {
        Row: {
          id: string
          user_id: string
          award_type: string
          award_title: string
          month: number
          year: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          award_type: string
          award_title: string
          month: number
          year: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          award_type?: string
          award_title?: string
          month?: number
          year?: number
          created_at?: string
        }
      }
    }
    Functions: {
      generate_anonymous_username: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_user_toxicity_score: {
        Args: {
          user_uuid: string
        }
        Returns: void
      }
      search_confessions: {
        Args: {
          search_query?: string
          company_uuid?: string
          sort_by?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          content: string
          image_url: string | null
          upvotes: number
          downvotes: number
          net_score: number
          created_at: string
          user_id: string
          anonymous_username: string
          toxicity_score: number
          user_vote: string | null
          is_own: boolean
        }[]
      }
      get_monthly_stats: {
        Args: {
          target_month: number
          target_year: number
        }
        Returns: {
          top_users: {
            anonymous_username: string
            toxicity_score: number
            total_upvotes: number
            total_downvotes: number
          }[]
          top_confessions: {
            id: string
            content: string
            net_score: number
            anonymous_username: string
            created_at: string
          }[]
          total_confessions: number
          total_votes: number
          average_toxicity: number
        }
      }
      get_company_stats: {
        Args: {
          company_uuid: string
        }
        Returns: {
          total_users: number
          total_confessions: number
          total_votes: number
          average_toxicity: number
          top_users: {
            anonymous_username: string
            toxicity_score: number
          }[]
        }
      }
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// Specific table types for easier use
export type Company = Tables<'companies'>
export type UserProfile = Tables<'user_profiles'>
export type Confession = Tables<'confessions'>
export type Vote = Tables<'votes'>
export type Award = Tables<'awards'>

// Extended types with relations
export type ConfessionWithProfile = Confession & {
  user_profiles: {
    anonymous_username: string
    toxicity_score: number
  }
  user_vote?: string | null
  is_own?: boolean
}

export type UserProfileWithCompany = UserProfile & {
  companies: {
    name: string
    invite_code: string
  }
}

// Utility functions for Supabase operations
export const getConfessions = async (sortBy: 'popular' | 'latest' = 'popular', limit = 20, offset = 0) => {
  const { data, error } = await supabase.rpc('search_confessions', {
    search_query: null,
    company_uuid: null,
    sort_by: sortBy,
    limit_count: limit,
    offset_count: offset
  })

  if (error) throw error
  return data
}

export const searchConfessions = async (query: string, sortBy: 'popular' | 'latest' = 'popular', limit = 20, offset = 0) => {
  const { data, error } = await supabase.rpc('search_confessions', {
    search_query: query,
    company_uuid: null,
    sort_by: sortBy,
    limit_count: limit,
    offset_count: offset
  })

  if (error) throw error
  return data
}

export const createConfession = async (content: string, imageFile?: File) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get user profile to get company_id
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  let imageUrl = null

  // Upload image if provided
  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('confession-images')
      .upload(fileName, imageFile)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('confession-images')
      .getPublicUrl(fileName)

    imageUrl = publicUrl
  }

  // Create confession
  const { data, error } = await supabase
    .from('confessions')
    .insert({
      user_id: user.id,
      company_id: profile.company_id,
      content,
      image_url: imageUrl
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const voteOnConfession = async (confessionId: string, voteType: 'upvote' | 'downvote') => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('confession_id', confessionId)
    .single()

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Remove vote if same type
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)
      
      if (error) throw error
      return { action: 'removed', voteType }
    } else {
      // Update vote if different type
      const { error } = await supabase
        .from('votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id)
      
      if (error) throw error
      return { action: 'updated', voteType }
    }
  } else {
    // Create new vote
    const { error } = await supabase
      .from('votes')
      .insert({
        user_id: user.id,
        confession_id: confessionId,
        vote_type: voteType
      })
    
    if (error) throw error
    return { action: 'created', voteType }
  }
}

export const deleteConfession = async (confessionId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('confessions')
    .delete()
    .eq('id', confessionId)
    .eq('user_id', user.id) // Ensure user can only delete their own confessions

  if (error) throw error
}

export const getMonthlyStats = async (month: number, year: number) => {
  const { data, error } = await supabase.rpc('get_monthly_stats', {
    target_month: month,
    target_year: year
  })

  if (error) throw error
  return data
}

export const getUserProfile = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  const targetUserId = userId || user?.id
  
  if (!targetUserId) throw new Error('User not found')

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      companies (
        name,
        invite_code
      )
    `)
    .eq('id', targetUserId)
    .single()

  if (error) throw error
  return data as UserProfileWithCompany
}

export const getUserConfessions = async (userId?: string, limit = 20, offset = 0) => {
  const { data: { user } } = await supabase.auth.getUser()
  const targetUserId = userId || user?.id
  
  if (!targetUserId) throw new Error('User not found')

  // Fetch confessions first
  const { data: confessions, error: confessionsError } = await supabase
    .from('confessions')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (confessionsError) throw confessionsError

  // Fetch user profile separately
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('anonymous_username, toxicity_score')
    .eq('id', targetUserId)
    .single()

  if (profileError) throw profileError

  // Combine the data
  const confessionsWithProfile = confessions?.map(confession => ({
    ...confession,
    user_profiles: {
      anonymous_username: userProfile.anonymous_username,
      toxicity_score: userProfile.toxicity_score
    }
  })) || []

  return confessionsWithProfile
}

export const getTopUsers = async (limit = 10) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('anonymous_username, toxicity_score, total_upvotes, total_downvotes')
    .order('toxicity_score', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
