"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserProfile } from "@/components/user-profile"

export function MainNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Calendar className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">SyllaScan</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link 
              href="/dashboard" 
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/dashboard" ? "text-foreground font-semibold" : "text-foreground/60"
              )}
            >
              Dashboard
            </Link>
            <Link 
              href="/upload" 
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/upload" ? "text-foreground font-semibold" : "text-foreground/60"
              )}
            >
              Upload
            </Link>
            <Link 
              href="/calendar" 
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/calendar" ? "text-foreground font-semibold" : "text-foreground/60"
              )}
            >
              Calendar
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserProfile />
        </div>
      </div>
    </header>
  )
} 