"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { getToxicityTier } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { ChevronUp, ChevronDown, Trash2, Clock, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ConfessionFeedProps {
  searchQuery: string
  currentUserId: string
}

interface Confession {
  id: string
  content: string
  image_url: string | null
  upvotes: number
  downvotes: number
  net_score: number
  created_at: string
  user_profiles: {
    anonymous_username: string
    toxicity_score: number
  }
  user_vote?: "upvote" | "downvote" | null
  is_own: boolean
}

export function ConfessionFeed({ searchQuery, currentUserId }: ConfessionFeedProps) {
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"popular" | "latest">("popular")
  const { toast } = useToast()

  useEffect(() => {
    fetchConfessions()
  }, [sortBy, searchQuery])

  const fetchConfessions = async () => {
    setLoading(true)
    try {
      // Use the search_confessions function from the database which handles complex search properly
      if (searchQuery.trim()) {
        const { data, error } = await supabase.rpc('search_confessions', {
          search_query: searchQuery,
          sort_by: sortBy,
          limit_count: 20,
          offset_count: 0
        })

        if (error) throw error

        const confessionsWithVotes = data?.map((confession: any) => ({
          ...confession,
          user_profiles: {
            anonymous_username: confession.anonymous_username,
            toxicity_score: confession.toxicity_score
          },
          user_vote: confession.user_vote,
          is_own: confession.is_own,
        })) || []

        setConfessions(confessionsWithVotes)
      } else {
        // No search query, use regular select
        let query = supabase.from("confessions").select(`
            *,
            user_profiles (
              anonymous_username,
              toxicity_score
            )
          `)

        // Add sorting
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
            user_vote: null, // No votes in demo
            is_own: confession.user_id === currentUserId,
          })) || []

        setConfessions(confessionsWithVotes)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (confessionId: string, voteType: "upvote" | "downvote") => {
    try {
      // Simulate vote update
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Update local state to show immediate feedback
      setConfessions((prev) =>
        prev.map((confession) => {
          if (confession.id === confessionId) {
            const currentVote = confession.user_vote
            let newUpvotes = confession.upvotes
            let newDownvotes = confession.downvotes
            let newUserVote = confession.user_vote

            // Remove previous vote
            if (currentVote === "upvote") {
              newUpvotes -= 1
            } else if (currentVote === "downvote") {
              newDownvotes -= 1
            }

            // Add new vote if different from current
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
        }),
      )

      toast({
        title: "Vote recorded!",
        description: "Your vote has been counted.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (confessionId: string) => {
    try {
      const { error } = await supabase.from("confessions").delete().eq("id", confessionId).eq("user_id", currentUserId)

      if (error) throw error

      toast({
        title: "Confession deleted",
        description: "Your confession has been removed.",
      })

      // Remove from local state
      setConfessions((prev) => prev.filter((c) => c.id !== confessionId))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
                          <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Confessions</h2>
        <Select value={sortBy} onValueChange={(value: "popular" | "latest") => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Most Popular
              </div>
            </SelectItem>
            <SelectItem value="latest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Latest
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {confessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No confessions found.</p>
            </CardContent>
          </Card>
        ) : (
          confessions.map((confession) => {
            const tier = getToxicityTier(confession.user_profiles.toxicity_score)

            return (
              <Card key={confession.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {confession.user_profiles.anonymous_username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{confession.user_profiles.anonymous_username}</span>
                        <Badge variant="outline" className={`${tier.color} text-xs`}>
                          {tier.emoji} {tier.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(confession.created_at), { addSuffix: true })}
                      </span>
                      {confession.is_own && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(confession.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-foreground leading-relaxed">{confession.content}</p>

                  {confession.image_url && (
                    <img
                      src={confession.image_url || "/placeholder.svg"}
                      alt="Confession image"
                      className="rounded-lg max-w-full h-auto max-h-96 object-cover"
                    />
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant={confession.user_vote === "upvote" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleVote(confession.id, "upvote")}
                        className={`flex items-center space-x-1 ${
                          confession.user_vote === "upvote" 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : ""
                        }`}
                      >
                        <ChevronUp className="h-4 w-4" />
                        <span>{confession.upvotes}</span>
                      </Button>

                      <Button
                        variant={confession.user_vote === "downvote" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleVote(confession.id, "downvote")}
                        className="flex items-center space-x-1"
                      >
                        <ChevronDown className="h-4 w-4" />
                        <span>{confession.downvotes}</span>
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Net Score:{" "}
                      <span className={confession.net_score >= 0 ? "text-green-600" : "text-red-600"}>
                        {confession.net_score >= 0 ? "+" : ""}
                        {confession.net_score}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
