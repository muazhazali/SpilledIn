"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2, X } from "lucide-react"

interface CreateConfessionProps {
  userId: string
  companyId: string
  onSuccess: () => void
}

export function CreateConfession({ userId, companyId, onSuccess }: CreateConfessionProps) {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

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
      let imageUrl = null

      // Upload image if present (simulated)
      if (image) {
        const fileExt = image.name.split(".").pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("confession-images")
          .upload(fileName, image)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("confession-images").getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Create confession (simulated)
      const { error } = await supabase.from("confessions").insert({
        user_id: userId,
        company_id: companyId,
        content: content.trim(),
        image_url: imageUrl,
      })

      if (error) throw error

      toast({
        title: "Confession posted!",
        description: "Your anonymous confession has been shared. Check the feed to see it!",
      })

      // Reset form
      setContent("")
      setImage(null)
      setImagePreview(null)
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
            <div className="text-right text-sm text-gray-500">{content.length}/1000 characters</div>
          </div>

          <div className="space-y-4">
            <Label>Add Image (Optional)</Label>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-sm text-gray-600">Click to upload an image</span>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
              </div>
            )}
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
