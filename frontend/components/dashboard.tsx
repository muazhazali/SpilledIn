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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 border-b border-red-500 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-4 sm:gap-8 py-2">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-100 to-pink-100 bg-clip-text text-transparent">
                SpilledIn
              </h1>
              <Badge variant="outline" className={`bg-white/90 text-red-700 border-red-300 font-medium shadow-sm`}>
                {tier.emoji} {tier.name}
              </Badge>
            </div>

            {/* Search Input in Header */}
            <div className="order-3 w-full sm:order-none sm:w-auto flex-1 sm:max-w-md mx-0 sm:mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                <Input
                  placeholder="Search confessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-white/95 border-white/50 text-red-700 placeholder-red-400 focus:border-white focus:ring-white focus:bg-white backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 ring-2 ring-white/30">
                  <AvatarFallback className="text-xs bg-white/90 text-red-700">
                    {user.profile.anonymous_username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-white">{user.profile.anonymous_username}</span>
              </div>

              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:text-white hover:bg-white/20 transition-colors">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-12 h-auto sm:h-16 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-2 shadow-lg gap-2">
            <TabsTrigger 
              value="feed" 
              className="flex items-center justify-center gap-3 h-12 text-base font-semibold rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-red-100 hover:text-red-700"
            >
              <Search className="h-5 w-5" />
              Feed
            </TabsTrigger>
            <TabsTrigger 
              value="create" 
              className="flex items-center justify-center gap-3 h-12 text-base font-semibold rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-red-100 hover:text-red-700"
            >
              <Plus className="h-5 w-5" />
              Confess
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex items-center justify-center gap-3 h-12 text-base font-semibold rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-red-100 hover:text-red-700"
            >
              <User className="h-5 w-5" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="wrapped" 
              className="flex items-center justify-center gap-3 h-12 text-base font-semibold rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-red-100 hover:text-red-700"
            >
              <Trophy className="h-5 w-5" />
              Toxic Wrapped
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
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
