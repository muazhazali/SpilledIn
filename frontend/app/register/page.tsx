"use client"

import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/hooks/useAuth"

export default function RegisterPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (user) {
    // If user is already logged in, redirect to dashboard
    router.push('/dashboard')
    return null
  }

  return (
    <AuthForm 
      onSuccess={() => router.push('/dashboard')} 
    />
  )
} 