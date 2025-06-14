import { useState, useEffect } from 'react'
import { 
  getConfessions, 
  searchConfessions, 
  createConfession, 
  voteOnConfession, 
  deleteConfession,
  ConfessionWithProfile 
} from '@/lib/supabase'

export const useConfessions = (sortBy: 'popular' | 'latest' = 'popular', limit = 20) => {
  const [confessions, setConfessions] = useState<ConfessionWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchConfessions = async (reset = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentOffset = reset ? 0 : offset
      const data = await getConfessions(sortBy, limit, currentOffset)
      
      if (reset) {
        setConfessions(data)
        setOffset(limit)
      } else {
        setConfessions(prev => [...prev, ...data])
        setOffset(prev => prev + limit)
      }
      
      setHasMore(data.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch confessions')
    } finally {
      setLoading(false)
    }
  }

  const searchConfessionsData = async (query: string, reset = true) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentOffset = reset ? 0 : offset
      const data = await searchConfessions(query, sortBy, limit, currentOffset)
      
      if (reset) {
        setConfessions(data)
        setOffset(limit)
      } else {
        setConfessions(prev => [...prev, ...data])
        setOffset(prev => prev + limit)
      }
      
      setHasMore(data.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search confessions')
    } finally {
      setLoading(false)
    }
  }

  const addConfession = async (content: string, imageFile?: File) => {
    try {
      await createConfession(content, imageFile)
      // Refresh confessions after adding
      await fetchConfessions(true)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create confession')
    }
  }

  const vote = async (confessionId: string, voteType: 'upvote' | 'downvote') => {
    try {
      await voteOnConfession(confessionId, voteType)
      
      // Update the confession in the local state
      setConfessions(prev => prev.map(confession => {
        if (confession.id === confessionId) {
          const currentVote = confession.user_vote
          let newUpvotes = confession.upvotes
          let newDownvotes = confession.downvotes
          
          // Remove previous vote if exists
          if (currentVote === 'upvote') {
            newUpvotes -= 1
          } else if (currentVote === 'downvote') {
            newDownvotes -= 1
          }
          
          // Add new vote if different from current
          if (currentVote !== voteType) {
            if (voteType === 'upvote') {
              newUpvotes += 1
            } else {
              newDownvotes += 1
            }
          }
          
          return {
            ...confession,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            net_score: newUpvotes - newDownvotes,
            user_vote: currentVote === voteType ? null : voteType
          }
        }
        return confession
      }))
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to vote on confession')
    }
  }

  const removeConfession = async (confessionId: string) => {
    try {
      await deleteConfession(confessionId)
      setConfessions(prev => prev.filter(confession => confession.id !== confessionId))
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete confession')
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchConfessions(false)
    }
  }

  const refresh = () => {
    fetchConfessions(true)
  }

  useEffect(() => {
    fetchConfessions(true)
  }, [sortBy])

  return {
    confessions,
    loading,
    error,
    hasMore,
    addConfession,
    vote,
    removeConfession,
    searchConfessions: searchConfessionsData,
    loadMore,
    refresh
  }
}

export const useConfessionSearch = () => {
  const [results, setResults] = useState<ConfessionWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string, sortBy: 'popular' | 'latest' = 'popular') => {
    if (!query.trim()) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const data = await searchConfessions(query, sortBy, 50, 0)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setResults([])
    setError(null)
  }

  return {
    results,
    loading,
    error,
    search,
    clear
  }
} 