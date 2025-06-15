"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreateConfessionProps {
  userId: string
  companyId: string
  onSuccess: () => void
}

export function CreateConfession({ userId, companyId, onSuccess }: CreateConfessionProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter your confession",
        variant: "destructive",
      })
      return
    }

    if (content.length > 1000) {
      toast({
        title: "Error",
        description: "Confession must be less than 1000 characters",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create confession
      const { error } = await supabase.from("confessions").insert({
        user_id: userId,
        company_id: companyId,
        content: content.trim(),
      })

      if (error) throw error

      toast({
        title: "Confession posted!",
        description: "Your anonymous confession has been shared. Check the feed to see it!",
      })

      // Reset form
      setContent("")
      onSuccess()
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Confession</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder="Share your anonymous confession... (max 1000 characters)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32 resize-none"
              maxLength={1000}
            />
            <div className="text-right text-sm text-muted-foreground">{content.length}/1000 characters</div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !content.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Confession Anonymously
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
