"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Loader2 } from "lucide-react"
import { signInWithGoogle } from "@/lib/supabase"

interface GoogleAuthButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  state?: string
  text?: string
}

export function GoogleAuthButton({
  variant = "default",
  size = "default",
  className,
  state = "",
  text = "Connect with Google"
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async () => {
    setIsLoading(true)
    try {
      // Use Supabase Google OAuth
      const result = await signInWithGoogle();
      if (result.success && result.url) {
        // Redirect to the Supabase OAuth URL
        window.location.href = result.url;
        return; // Stop execution here since we're redirecting
      } else {
        // Fallback to the original method if Supabase auth fails
        const stateParam = state ? `?state=${encodeURIComponent(state)}` : ""
        router.push(`/api/auth/google${stateParam}`)
      }
    } catch (error) {
      console.error("Error initiating Google auth:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleAuth} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
      {text}
    </Button>
  )
}
