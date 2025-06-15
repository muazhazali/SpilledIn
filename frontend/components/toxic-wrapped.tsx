"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { getToxicityTier } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Trophy, Crown, TrendingUp, Calendar, Sparkles, Loader2, AlertCircle } from "lucide-react"

// Updated interfaces to match API response
interface TopUser {
  anonymous_username: string
  toxicity_score: number
  total_upvotes: number
  total_downvotes: number
}

interface TopConfession {
  id: string
  content: string
  upvotes: number
  downvotes: number
  net_score: number
  created_at: string
  user_profiles: {
    anonymous_username: string
    toxicity_score: number
  } | null
}

interface MonthlyStats {
  totalConfessions: number
  totalVotes: number
  averageToxicity: number
  topConfessionsCount: number
  topToxicUsersCount: number
}

interface GeneratedSummary {
  month: number
  year: number
  monthName: string
  summary: string
  stats: MonthlyStats
  generatedAt: string
  dateRange: {
    start: string
    end: string
  }
}

interface WrappedData {
  topUsers: TopUser[]
  topConfessions: TopConfession[]
  monthlyStats: MonthlyStats
  mostActiveDay?: string
}

export function ToxicWrapped() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null)
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  const fetchWrappedData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999)

      // Check if requesting future month
      if (startDate > new Date()) {
        throw new Error("Cannot fetch data for future months")
      }

      // Fetch all data in parallel
      const [usersResult, confessionsResult, statsResult] = await Promise.all([
        // Top toxic users (all time, not month-specific for leaderboard)
        supabase
          .from("user_profiles")
          .select("anonymous_username, toxicity_score, total_upvotes, total_downvotes")
          .gt("toxicity_score", 0)
          .order("toxicity_score", { ascending: false })
          .limit(10),

        // Top confessions for the month
        supabase
          .from("confessions")
          .select(`
            id,
            content,
            upvotes,
            downvotes,
            net_score,
            created_at,
            user_profiles!inner(anonymous_username, toxicity_score)
          `)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("net_score", { ascending: false })
          .limit(5),

        // Monthly stats
        supabase
          .from("confessions")
          .select("created_at, upvotes, downvotes")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
      ])

      if (usersResult.error) throw new Error(`Failed to fetch users: ${usersResult.error.message}`)
      if (confessionsResult.error) throw new Error(`Failed to fetch confessions: ${confessionsResult.error.message}`)
      if (statsResult.error) throw new Error(`Failed to fetch stats: ${statsResult.error.message}`)

      // Process the data
      const topUsers = usersResult.data || []
      const topConfessions = confessionsResult.data || []
      const statsData = statsResult.data || []

      // Calculate monthly stats
      const totalConfessions = statsData.length
      const totalVotes = statsData.reduce((sum, item) => sum + (item.upvotes || 0) + (item.downvotes || 0), 0)
      const averageToxicity = topUsers.length > 0
        ? topUsers.reduce((sum, user) => sum + user.toxicity_score, 0) / topUsers.length
        : 0

      // Calculate most active day
      const dayCount: Record<string, number> = {}
      statsData.forEach(item => {
        const day = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'long' })
        dayCount[day] = (dayCount[day] || 0) + 1
      })
      const mostActiveDay = Object.entries(dayCount)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || "No data"

      setWrappedData({
        topUsers,
        topConfessions,
        monthlyStats: {
          totalConfessions,
          totalVotes,
          averageToxicity: Math.round(averageToxicity * 10) / 10,
          topConfessionsCount: topConfessions.length,
          topToxicUsersCount: topUsers.length
        },
        mostActiveDay
      })

      // Clear any previous generated summary when data changes
      setGeneratedSummary(null)

    } catch (error: any) {
      console.error('Error fetching wrapped data:', error)
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, toast])

  useEffect(() => {
    fetchWrappedData()
  }, [fetchWrappedData])

  const handleGenerateSummary = async () => {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to generate summary")
      }

      if (data.success && data.data) {
        setGeneratedSummary(data.data)
        toast({
          title: "Summary Generated! ✨",
          description: "Your monthly recap is ready!",
        })
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      console.error('Error generating summary:', error)
      setError(error.message)
      toast({
        title: "Failed to Generate Summary",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const LoadingCard = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-muted rounded w-1/3"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  )

  const ErrorCard = ({ message }: { message: string }) => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{message}</span>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    )
  }

  if (error && !wrappedData) {
    return <ErrorCard message={error} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            Toxic Wrapped
          </CardTitle>
          <p className="text-purple-100">Monthly recap of the most toxic confessions and users</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-40 bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={month} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-32 bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Generated Summary */}
      {generatedSummary && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              AI-Generated Monthly Recap
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Generated on {new Date(generatedSummary.generatedAt).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {generatedSummary.summary}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Stats */}
      {wrappedData?.monthlyStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {months[selectedMonth - 1]} {selectedYear} Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {wrappedData.monthlyStats.totalConfessions}
                </div>
                <div className="text-sm text-muted-foreground">Total Confessions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {wrappedData.monthlyStats.totalVotes}
                </div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {wrappedData.monthlyStats.averageToxicity}
                </div>
                <div className="text-sm text-muted-foreground">Avg Toxicity</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {wrappedData.mostActiveDay}
                </div>
                <div className="text-sm text-muted-foreground">Most Active Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Users */}
      {wrappedData?.topUsers && wrappedData.topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Most Toxic Users (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wrappedData.topUsers.slice(0, 5).map((user, index) => {
                const tier = getToxicityTier(user.toxicity_score)
                const isTop3 = index < 3

                return (
                  <div
                    key={user.anonymous_username}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${isTop3
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200"
                      : "bg-muted/50 hover:bg-muted"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${isTop3 ? "text-yellow-600" : "text-muted-foreground"
                        }`}>
                        #{index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.anonymous_username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.anonymous_username}</div>
                        <Badge className={`${tier.color} text-xs`}>
                          {tier.emoji} {tier.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {user.toxicity_score}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.total_upvotes}↑ {user.total_downvotes}↓
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Confessions */}
      {wrappedData?.topConfessions && wrappedData.topConfessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Most Popular Confessions This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wrappedData.topConfessions.map((confession, index) => {
                const userProfile = confession.user_profiles
                const tier = userProfile ? getToxicityTier(userProfile.toxicity_score) : {
                  name: "Unknown",
                  emoji: "❓",
                  color: "bg-gray-100 text-gray-800"
                }

                return (
                  <div
                    key={confession.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-green-600">#{index + 1}</div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {(userProfile?.anonymous_username || "??").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {userProfile?.anonymous_username || "Unknown User"}
                          </span>
                          <Badge variant="outline" className={`${tier.color} text-xs`}>
                            {tier.emoji} {tier.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          +{confession.net_score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {confession.upvotes}↑ {confession.downvotes}↓
                        </div>
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed">
                      {confession.content.length > 300
                        ? `${confession.content.substring(0, 300)}...`
                        : confession.content}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Summary Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {wrappedData?.monthlyStats.totalConfessions === 0
            ? "No data available for this month"
            : generatedSummary
              ? "Summary generated successfully!"
              : "Generate an AI-powered summary of this month's activity"
          }
        </div>
        <Button
          onClick={handleGenerateSummary}
          disabled={generating || !wrappedData || wrappedData.monthlyStats.totalConfessions === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Summary
            </>
          )}
        </Button>
      </div>

      {/* Fun Facts */}
      {wrappedData && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-500" />
              Fun Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl mb-2">🔥</div>
                <div className="font-medium">Hottest Drama</div>
                <div className="text-sm text-muted-foreground">
                  {wrappedData.topConfessions[0]?.net_score || 0} net votes on a single confession
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl mb-2">👑</div>
                <div className="font-medium">Toxicity Champion</div>
                <div className="text-sm text-muted-foreground">
                  {wrappedData.topUsers[0]?.anonymous_username || "No one yet"} leads with{" "}
                  {wrappedData.topUsers[0]?.toxicity_score || 0} points
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {wrappedData?.monthlyStats.totalConfessions === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🤐</div>
            <h3 className="text-xl font-semibold mb-2">No Confessions This Month</h3>
            <p className="text-muted-foreground">
              Looks like {months[selectedMonth - 1]} {selectedYear} was a quiet month.
              Try selecting a different time period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
