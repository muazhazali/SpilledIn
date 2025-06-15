"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { supabase } from "@/lib/supabase"
import { getToxicityTier } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Trophy, Crown, TrendingUp, Calendar, Sparkles, Flame, MessageSquare, Award } from "lucide-react"

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
  user_profiles: {
    anonymous_username: string
    toxicity_score: number
  }
}

interface MonthlyStats {
  total_confessions: number
  total_votes: number
  most_active_day: string
  average_toxicity: number
}

export function ToxicWrapped() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [topConfessions, setTopConfessions] = useState<TopConfession[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchWrappedData()
  }, [selectedMonth, selectedYear])

  const fetchWrappedData = async () => {
    setLoading(true)
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0)

      // Fetch top users by toxicity score
      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select("anonymous_username, toxicity_score, total_upvotes, total_downvotes")
        .order("toxicity_score", { ascending: false })
        .limit(10)

      if (usersError) throw usersError

      // Fetch top confessions from the selected month
      const { data: confessionsData, error: confessionsError } = await supabase
        .from("confessions")
        .select(`
          id,
          content,
          upvotes,
          downvotes,
          net_score,
          user_id
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("net_score", { ascending: false })
        .limit(5)

      if (confessionsError) throw confessionsError

      // Fetch user profiles for the confession authors
      const userIds = confessionsData?.map(c => c.user_id) || []
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, anonymous_username, toxicity_score")
        .in("id", userIds)

      if (profilesError) throw profilesError

      // Combine confession data with user profiles
      const confessionsWithProfiles = confessionsData?.map(confession => {
        const userProfile = profilesData?.find(p => p.id === confession.user_id)
        return {
          ...confession,
          user_profiles: userProfile ? {
            anonymous_username: userProfile.anonymous_username,
            toxicity_score: userProfile.toxicity_score
          } : {
            anonymous_username: "Unknown User",
            toxicity_score: 0
          }
        }
      }) || []

      // Fetch monthly statistics
      const { data: statsData, error: statsError } = await supabase
        .from("confessions")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (statsError) throw statsError

      // Calculate stats
      const totalConfessions = statsData?.length || 0
      const avgToxicity = usersData?.reduce((sum, user) => sum + user.toxicity_score, 0) / (usersData?.length || 1)

      setTopUsers(usersData || [])
      setTopConfessions(confessionsWithProfiles)
      setMonthlyStats({
        total_confessions: totalConfessions,
        total_votes: usersData?.reduce((sum, user) => sum + user.total_upvotes + user.total_downvotes, 0) || 0,
        most_active_day: "Monday", // This would need more complex calculation
        average_toxicity: Math.round(avgToxicity),
      })
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

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  if (loading) {
    return (
      <Card className="w-full shadow-sm border bg-white dark:bg-slate-900">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Sparkles className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-40 animate-pulse"></div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-64 mt-2 animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-sm border bg-white dark:bg-slate-900">
      {/* Compact Header */}
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Sparkles className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Toxic Wrapped
              </CardTitle>
              <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Monthly recap of the most toxic confessions and users</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
            >
              <SelectTrigger className="w-32 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={month} value={(index + 1).toString()}>
                    {month.slice(0, 3)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
              <SelectTrigger className="w-24 h-10 text-sm">
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
        </div>

        {/* Quick Stats Bar */}
        {monthlyStats && (
          <div className="grid grid-cols-4 gap-8 mt-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-slate-500" />
                <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{monthlyStats.total_confessions}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Confessions</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-slate-500" />
                <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{monthlyStats.total_votes}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-slate-500" />
                <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{monthlyStats.average_toxicity}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Avg Toxicity</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-slate-500" />
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{monthlyStats.most_active_day}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Most Active</div>
            </div>
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="pt-0 space-y-8">
          {/* Highlights Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-100 dark:bg-slate-800 border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🔥</div>
                <div className="font-semibold mb-3 text-slate-700 dark:text-slate-300">Hottest Drama</div>
                <div className="text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
                  {topConfessions[0]?.net_score || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">net votes</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-100 dark:bg-slate-800 border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">👑</div>
                <div className="font-semibold mb-3 text-slate-700 dark:text-slate-300">Toxicity Champion</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate mb-2">
                  {topUsers[0]?.anonymous_username || "No one yet"}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{topUsers[0]?.toxicity_score || 0}</span> points
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Users - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Top Toxic Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topUsers.slice(0, 3).map((user, index) => {
                  const tier = getToxicityTier(user.toxicity_score)
                  return (
                    <div
                      key={user.anonymous_username}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-yellow-600">#{index + 1}</div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{user.anonymous_username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{user.anonymous_username}</div>
                          <Badge className={`${tier.color} text-xs`}>
                            {tier.emoji} {tier.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">{user.toxicity_score}</div>
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

          {/* Top Confessions - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                Top Confessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topConfessions.slice(0, 3).map((confession, index) => {
                  const tier = getToxicityTier(confession.user_profiles.toxicity_score)
                  return (
                    <div key={confession.id} className="border rounded-lg p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-green-600">#{index + 1}</div>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {confession.user_profiles.anonymous_username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm truncate max-w-32">{confession.user_profiles.anonymous_username}</span>
                          <Badge variant="outline" className={`${tier.color} text-xs`}>
                            {tier.emoji}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">+{confession.net_score}</div>
                          <div className="text-xs text-muted-foreground">
                            {confession.upvotes}↑ {confession.downvotes}↓
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {confession.content.length > 120
                          ? `${confession.content.substring(0, 120)}...`
                          : confession.content}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </CardContent>
    </Card>
  )
}
