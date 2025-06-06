"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Calendar, ChevronDown, ExternalLink, Plus, LayoutGrid } from "lucide-react"
import { UserProfile } from "@/components/user-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SharedHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is authenticated with Google
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/calendar/check-access")
        const result = await response.json()
        setIsAuthenticated(result.hasAccess || false)
      } catch (error) {
        console.error("Error checking auth status:", error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
    
    const handleFocus = () => {
      checkAuth()
    }
    
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/80 dark:border-gray-700/50">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 group">
            <div className="relative">
              <Calendar className="h-6 w-6 text-blue-600 group-hover:text-purple-600 transition-colors duration-300" />
            </div>
            <span className="hidden font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent sm:inline-block">
              SyllaScan
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link 
              href="/dashboard" 
              className="relative group transition-colors hover:text-blue-600 duration-300"
            >
              Dashboard
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></div>
            </Link>
            <Link 
              href="/upload" 
              className="relative group transition-colors hover:text-blue-600 duration-300"
            >
              Upload
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></div>
            </Link>
            
            {/* Calendar Tab with Dropdown for Authenticated Users */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative group transition-colors hover:text-blue-600 duration-300 flex items-center gap-1">
                    Calendar
                    <ChevronDown className="h-3 w-3" />
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-96 p-0" align="start">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-sm text-green-800 dark:text-green-200">
                            🎉 Google Calendar Connected!
                          </CardTitle>
                          <CardDescription className="text-xs text-green-600 dark:text-green-300">
                            Ready to import your academic events
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {/* Quick Steps */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          📋 Quick Import Guide
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            Upload syllabus → AI extracts dates
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Click "Add to Calendar" button
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            Events sync to "My Syllabus Events"
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Link href="/upload" className="block">
                          <Button className="w-full h-8 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <Plus className="h-3 w-3 mr-1" />
                            Upload Syllabus
                          </Button>
                        </Link>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Link href="/calendar">
                            <Button variant="outline" className="w-full h-8 text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              View Calendar
                            </Button>
                          </Link>
                          <a 
                            href="https://calendar.google.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <Button variant="outline" className="w-full h-8 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Google Cal
                            </Button>
                          </a>
                        </div>
                      </div>

                      {/* Pro Tip */}
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          💡 <strong>Tip:</strong> Look for "My Syllabus Events" in your Google Calendar sidebar
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link 
                href="/calendar" 
                className="relative group transition-colors hover:text-blue-600 duration-300"
              >
                Calendar
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></div>
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserProfile />
        </div>
      </div>
    </header>
  )
} 