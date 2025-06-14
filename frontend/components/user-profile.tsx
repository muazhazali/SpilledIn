"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getToxicityTier } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Trophy, TrendingUp, TrendingDown, Calendar, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UserProfileProps {
  user: any
}

interface UserConfession {
  id: string
  content: string
  image_url: string | null
  upvotes: number
  downvotes: number
  net_score: number
  created_at: string
}

interface UserAward {
  id: string
  award_type: string
  award_title: string
  month: number
  year: number
  created_at: string
}

export function UserProfile({ user }: UserProfileProps) {
  const [confessions, setConfessions] = useState<UserConfession[]>([])
  const [awards, setAwards] = useState<UserAward[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserData()
  }, [])

  // Update user profile to show demo user data

  const fetchUserData = async () => {
    try {
      // For demo, show some sample confessions for the current user
      const demoConfessions = [
        {
          id: "my_conf_1",
          content:
            "I've been using the same password for everything since 2015. It's 'password123' and I'm too scared to change it now.",
          image_url: null,
          upvotes: 23,
          downvotes: 45,
          net_score: -22,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "my_conf_2",
          content:
            "I told my team I was 'researching' for 3 hours but I was actually watching cat videos. The research was very thorough though.",
          image_url: null,
          upvotes: 67,
          downvotes: 12,
          net_score: 55,
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
      ]

      // Demo awards
      const demoAwards = [
        {
          id: "award_1",
          award_type: "Most Viral",
          award_title: "Most Viral Post - November 2024",
          month: 11,
          year: 2024,
          created_at: new Date().toISOString(),
        },
      ]

      setConfessions(demoConfessions)
      setAwards(demoAwards)
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

  const handleDeleteConfession = async (confessionId: string) => {
    try {
      // Simulate deletion
      await new Promise((resolve) => setTimeout(resolve, 500))

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

  const tier = getToxicityTier(user.profile.toxicity_score)

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">
                {user.profile.anonymous_username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.profile.anonymous_username}</h2>
              <Badge className={`${tier.color} mt-1`}>
                {tier.emoji} {tier.name}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{user.profile.toxicity_score}</div>
              <div className="text-sm text-gray-500">Toxicity Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-5 w-5" />
                {user.profile.total_upvotes}
              </div>
              <div className="text-sm text-gray-500">Total Upvotes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                <TrendingDown className="h-5 w-5" />
                {user.profile.total_downvotes}
              </div>
              <div className="text-sm text-gray-500">Total Downvotes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                <Calendar className="h-5 w-5" />
                {confessions.length}
              </div>
              <div className="text-sm text-gray-500">Confessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Awards */}
      {awards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Awards & Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {awards.map((award) => (
                <div
                  key={award.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="font-medium">{award.award_title}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(award.year, award.month - 1).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{award.award_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's Confessions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Confessions</CardTitle>
        </CardHeader>
        <CardContent>
          {confessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't posted any confessions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {confessions.map((confession) => (
                <div key={confession.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(confession.created_at), { addSuffix: true })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteConfession(confession.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-gray-800 mb-3">{confession.content}</p>

                  {confession.image_url && (
                    <img
                      src={confession.image_url || "/placeholder.svg"}
                      alt="Confession image"
                      className="rounded-lg max-w-full h-auto max-h-48 object-cover mb-3"
                    />
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        {confession.upvotes}
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        {confession.downvotes}
                      </span>
                    </div>
                    <div className={`font-medium ${confession.net_score >= 0 ? "text-green-600" : "text-red-600"}`}>
                      Net: {confession.net_score >= 0 ? "+" : ""}
                      {confession.net_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
