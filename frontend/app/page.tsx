"use client"

import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/auth-form"
import { Dashboard } from "@/components/dashboard"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthForm />
  }

  return <Dashboard user={{ user, profile }} />
}
