"use client"

import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getToxicityTier } from "@/lib/auth"
import { LogOut, Plus, User, Trophy, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user, profile, signOut, loading } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access the dashboard.</p>
      </div>
    )
  }

  const toxicityTier = getToxicityTier(profile.toxicity_score)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                SpilledIn
              </h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {profile.companies?.name}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {profile.anonymous_username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {profile.anonymous_username}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Your Profile</span>
              </CardTitle>
              <CardDescription>Your anonymous identity and stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                    {profile.anonymous_username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile.anonymous_username}</p>
                  <Badge className={toxicityTier.color}>
                    {toxicityTier.emoji} {toxicityTier.name}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{profile.total_upvotes}</p>
                  <p className="text-xs text-gray-500">Upvotes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{profile.total_downvotes}</p>
                  <p className="text-xs text-gray-500">Downvotes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{profile.toxicity_score}</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>What would you like to do?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Post New Confession
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Browse Confessions
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <User className="h-4 w-4 mr-2" />
                View My Profile
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Trophy className="h-4 w-4 mr-2" />
                Toxic Wrapped
              </Button>
            </CardContent>
          </Card>

          {/* Company Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Company</span>
              </CardTitle>
              <CardDescription>Your workplace community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-lg">{profile.companies?.name}</p>
                <p className="text-sm text-gray-500">
                  Invite Code: <code className="bg-gray-100 px-2 py-1 rounded">{profile.companies?.invite_code}</code>
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Share the invite code with your colleagues to grow the community!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Welcome to SpilledIn, {profile.anonymous_username}! 🎉
                </h2>
                <p className="text-purple-100 mb-4">
                  You're now part of the anonymous confession community at {profile.companies?.name}.
                  Start sharing your thoughts, vote on confessions, and climb the toxicity tiers!
                </p>
                <div className="flex justify-center space-x-4">
                  <Button variant="secondary" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Post Your First Confession
                  </Button>
                  <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-purple-600">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Explore Feed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 