"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { getToxicityTier } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Trophy, Crown, TrendingUp, Calendar, Sparkles } from "lucide-react"

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
          user_profiles (
            anonymous_username,
            toxicity_score
          )
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("net_score", { ascending: false })
        .limit(5)

      if (confessionsError) throw confessionsError

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
      setTopConfessions(confessionsData || [])
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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
          <div className="flex gap-4">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
            >
              <SelectTrigger className="w-40 bg-white text-black">
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

            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
              <SelectTrigger className="w-32 bg-white text-black">
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

      {/* Monthly Stats */}
      {monthlyStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {months[selectedMonth - 1]} {selectedYear} Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{monthlyStats.total_confessions}</div>
                <div className="text-sm text-muted-foreground">Total Confessions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{monthlyStats.total_votes}</div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{monthlyStats.average_toxicity}</div>
                <div className="text-sm text-muted-foreground">Avg Toxicity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{monthlyStats.most_active_day}</div>
                <div className="text-sm text-muted-foreground">Most Active Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Toxic Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Most Toxic Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.slice(0, 5).map((user, index) => {
              const tier = getToxicityTier(user.toxicity_score)
              const isTop3 = index < 3

              return (
                <div
                  key={user.anonymous_username}
                  className={`flex items-center justify-between p-4 rounded-lg ${isTop3 ? "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200" : "bg-muted/50"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${isTop3 ? "text-yellow-600" : "text-muted-foreground"}`}>
                      #{index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{user.anonymous_username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.anonymous_username}</div>
                      <Badge className={`${tier.color} text-xs`}>
                        {tier.emoji} {tier.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{user.toxicity_score}</div>
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

      {/* Top Confessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Most Popular Confessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topConfessions.map((confession, index) => {
              const tier = getToxicityTier(confession.user_profiles.toxicity_score)

              return (
                <div key={confession.id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-green-600">#{index + 1}</div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {confession.user_profiles.anonymous_username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{confession.user_profiles.anonymous_username}</span>
                        <Badge variant="outline" className={`${tier.color} text-xs`}>
                          {tier.emoji} {tier.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600">+{confession.net_score}</div>
                      <div className="text-xs text-muted-foreground">
                        {confession.upvotes}↑ {confession.downvotes}↓
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground leading-relaxed">
                    {confession.content.length > 200
                      ? `${confession.content.substring(0, 200)}...`
                      : confession.content}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fun Facts */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" />
            Fun Facts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl mb-2">🔥</div>
              <div className="font-medium">Hottest Drama</div>
              <div className="text-sm text-muted-foreground">
                {topConfessions[0]?.net_score || 0} net votes on a single confession
              </div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl mb-2">👑</div>
              <div className="font-medium">Toxicity Champion</div>
              <div className="text-sm text-muted-foreground">
                {topUsers[0]?.anonymous_username || "No one yet"} leads with {topUsers[0]?.toxicity_score || 0} points
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
