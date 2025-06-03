"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { LogOut, RefreshCw, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { useToast } from "@/components/ui/use-toast"

interface UserInfo {
  name: string
  email: string
  picture: string
}

export function UserAuthStatus() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const loadUserInfo = () => {
    // Check if user info is in a cookie
    const userInfoCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_info="))
      ?.split("=")[1]

    if (userInfoCookie) {
      try {
        const decodedInfo = decodeURIComponent(userInfoCookie)
        setUserInfo(JSON.parse(decodedInfo))
      } catch (error) {
        console.error("Error parsing user info:", error)
        setUserInfo(null)
      }
    } else {
      setUserInfo(null)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadUserInfo()

    // Also check when the component is focused
    window.addEventListener("focus", loadUserInfo)
    return () => window.removeEventListener("focus", loadUserInfo)
  }, [])

  const handleLogout = async () => {
    // Clear cookies
    document.cookie = "google_access_token=; Max-Age=0; path=/; SameSite=Lax"
    document.cookie = "google_refresh_token=; Max-Age=0; path=/; SameSite=Lax"
    document.cookie = "user_info=; Max-Age=0; path=/; SameSite=Lax"

    // Reset state
    setUserInfo(null)

    toast({
      title: "Logged out",
      description: "You have been logged out of your Google account.",
    })
  }

  const handleRefreshToken = async () => {
    setIsRefreshing(true)

    try {
      const response = await fetch("/api/auth/google/refresh")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to refresh token")
      }

      toast({
        title: "Token Refreshed",
        description: "Your Google authentication has been refreshed.",
      })
    } catch (error) {
      console.error("Error refreshing token:", error)
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh your Google authentication.",
        variant: "destructive",
      })

      // If refresh fails, clear user info
      setUserInfo(null)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    )
  }

  if (!userInfo) {
    return <GoogleAuthButton variant="outline" size="sm" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {userInfo.picture ? (
            <Image
              src={userInfo.picture || "/placeholder.svg"}
              alt={userInfo.name || "User"}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="hidden md:inline">{userInfo.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <span className="truncate max-w-[200px]">{userInfo.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRefreshToken} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Token"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
