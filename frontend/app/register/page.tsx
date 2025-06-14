"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Info } from "lucide-react"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const inviteCode = formData.get("inviteCode") as string

    // Validate password confirmation
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, inviteCode)
      toast({
        title: "Account created!",
        description: "Welcome to SpilledIn! You can now start confessing.",
      })
      router.push('/dashboard')
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SpilledIn
          </CardTitle>
          <CardDescription>Join the anonymous confession community.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Info about invite codes */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Company Invite Required</h3>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>You need a valid company invite code to join.</p>
                  <p>
                    <strong>Demo codes:</strong> TECH2024, STARTUP123, MEGA456
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Company Invite Code</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                placeholder="TECH2024"
                defaultValue="TECH2024"
                required
                className="uppercase"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase()
                }}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-600 hover:text-purple-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Terms and privacy notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our anonymous confession platform terms.
              Your identity remains completely anonymous.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 