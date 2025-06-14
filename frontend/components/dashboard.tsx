"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ConfessionFeed } from "@/components/confession-feed"
import { CreateConfession } from "@/components/create-confession"
import { UserProfile } from "@/components/user-profile"
import { ToxicWrapped } from "@/components/toxic-wrapped"
import { signOut, getToxicityTier } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, User, Trophy, Search } from "lucide-react"

interface DashboardProps {
  user: any
}

export function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("feed")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const tier = getToxicityTier(user.profile.toxicity_score)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                SpilledIn
              </h1>
              <Badge variant="outline" className={`${tier.color} font-medium`}>
                {tier.emoji} {tier.name}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user.profile.anonymous_username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.profile.anonymous_username}</span>
              </div>

              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Confess
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="wrapped" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Toxic Wrapped
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Confessions</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search by content or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </CardContent>
            </Card>
            <ConfessionFeed searchQuery={searchQuery} currentUserId={user.user.id} />
          </TabsContent>

          <TabsContent value="create">
            <CreateConfession
              userId={user.user.id}
              companyId={user.profile.company_id}
              onSuccess={() => setActiveTab("feed")}
            />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile user={user} />
          </TabsContent>

          <TabsContent value="wrapped">
            <ToxicWrapped />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
