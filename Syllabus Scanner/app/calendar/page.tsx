"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, FileText, GraduationCap, BookOpen, LayoutGrid, Plus, Users, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { GoogleAuthButton } from "@/components/google-auth-button"
import Link from "next/link"

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState("month")
  const [courseFilter, setCourseFilter] = useState("all")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Also check when the component is focused
    const handleFocus = () => {
      checkAuth()
    }
    
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  // Mock events data for demo
  const events = [
    { id: 1, title: "Midterm Exam", date: new Date(2024, 9, 15), course: "CS 101", type: "exam" },
    { id: 2, title: "Final Project Due", date: new Date(2024, 11, 5), course: "CS 101", type: "project" },
    { id: 3, title: "Research Paper", date: new Date(2024, 10, 20), course: "HIST 200", type: "homework" },
    { id: 4, title: "Quiz 3", date: new Date(2024, 9, 28), course: "MATH 301", type: "quiz" },
    { id: 5, title: "Final Exam", date: new Date(2024, 11, 15), course: "CS 101", type: "exam" },
    { id: 6, title: "Lab Assignment", date: new Date(2024, 9, 20), course: "PHYS 201", type: "homework" },
  ]

  // Filter events based on selected course
  const filteredEvents = courseFilter === "all" ? events : events.filter((event) => event.course === courseFilter)

  // Get unique courses for filter
  const courses = Array.from(new Set(events.map((event) => event.course)))

  // Function to check if a date has events
  const hasEvent = (day: Date) => {
    return filteredEvents.some(
      (event) =>
        event.date.getDate() === day.getDate() &&
        event.date.getMonth() === day.getMonth() &&
        event.date.getFullYear() === day.getFullYear(),
    )
  }

  // Function to get events for the selected date
  const getEventsForDate = (selectedDate: Date) => {
    return filteredEvents.filter(
      (event) =>
        event.date.getDate() === selectedDate.getDate() &&
        event.date.getMonth() === selectedDate.getMonth() &&
        event.date.getFullYear() === selectedDate.getFullYear(),
    )
  }

  // Get events for the selected date
  const selectedDateEvents = date ? getEventsForDate(date) : []

  const getEventsByType = (eventType: string) => {
    return events.filter(event => event.type === eventType)
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    return events
      .filter(event => event.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'exam': return <GraduationCap className="h-4 w-4" />
      case 'homework': return <FileText className="h-4 w-4" />
      case 'project': return <BookOpen className="h-4 w-4" />
      case 'lecture': return <Users className="h-4 w-4" />
      case 'quiz': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'exam': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'homework': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'project': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'lecture': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'quiz': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading calendar...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
        {/* Background Pattern */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/15 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-100/15 via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-6xl relative">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Calendar
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage your academic calendar.
                </p>
              </div>
            </div>
          </div>

          {/* Connect Google Calendar Empty State */}
          <div className="min-h-[70vh] flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-lg mx-auto text-center space-y-8 p-8">
              {/* Animated Illustration */}
              <div className="relative">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <CalendarIcon className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 w-6 h-6 bg-yellow-400 rounded-full opacity-70 animate-ping"></div>
                <div className="absolute -bottom-2 -left-6 w-4 h-4 bg-green-400 rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute -bottom-4 -right-6 w-5 h-5 bg-blue-400 rounded-full opacity-60 animate-bounce delay-150"></div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  📅 Connect Google Calendar
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Connect your Google Calendar to view and manage your academic events.
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                  To sync your academic events with Google Calendar, you need to connect your Google account.
                </p>
              </div>

              {/* Main Action Button */}
              <div className="space-y-4">
                <GoogleAuthButton size="lg" className="w-full py-4 text-lg font-semibold" />
                
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  🔒 Your data is secure and only used for calendar integration
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 gap-4 mt-8">
                <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Sync Academic Events</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">All your assignments and exams in one place</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Smart Reminders</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified before important deadlines</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <LayoutGrid className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Organized View</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">See all your courses and events organized</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/15 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-100/15 via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Calendar
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage your academic calendar.
              </p>
            </div>
          </div>
          
          <Link href="/upload">
            <Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4" />
              <span>Add Events</span>
            </Button>
          </Link>
        </div>

        {/* Google Calendar Import Instructions - Only shown when authenticated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-800 dark:text-green-200">
                    🎉 Google Calendar Connected!
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-300">
                    Your account is connected. Here's how to import your academic events.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Step-by-step instructions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    📋 How to Import Events
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-white/50">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Upload Your Syllabus</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Go to the Upload tab and add your course syllabus</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-white/50">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Review Extracted Events</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Our AI will find all your important dates and deadlines</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-white/50">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Click "Add to Calendar"</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Select events and sync them to your Google Calendar</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions and benefits */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    ⚡ Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link href="/upload">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload New Syllabus
                      </Button>
                    </Link>
                    
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        View Dashboard
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">✨ Pro Tips</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <li>• Events sync automatically to "My Syllabus Events" calendar</li>
                      <li>• You can edit events after importing</li>
                      <li>• Get reminders before important deadlines</li>
                      <li>• Access your schedule across all devices</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold">{getUpcomingEvents().length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Exams</p>
                  <p className="text-2xl font-bold">{getEventsByType('exam').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Assignments</p>
                  <p className="text-2xl font-bold">{getEventsByType('homework').length + getEventsByType('project').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div className="grid gap-6 md:grid-cols-7">
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-1.5">
                  <CardTitle>Academic Calendar</CardTitle>
                  <CardDescription>View your academic schedule and important dates.</CardDescription>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Select value={view} onValueChange={setView}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">
                      {date?.toLocaleString("default", { month: "long", year: "numeric" })}
                    </h2>
                    <Button variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{
                      hasEvent: (day) => hasEvent(day),
                    }}
                    modifiersStyles={{
                      hasEvent: {
                        fontWeight: "bold",
                        backgroundColor: "rgba(var(--primary), 0.1)",
                        color: "hsl(var(--primary))",
                        borderRadius: "0.25rem",
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="space-y-6">
              {/* Google Calendar Access Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Access Google Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your imported events appear in the <strong>"My Syllabus Events"</strong> calendar.
                  </p>
                  <a 
                    href="https://calendar.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block w-full"
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Google Calendar
                    </Button>
                  </a>
                  <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1 pt-2 border-t border-blue-200 dark:border-blue-700">
                    <p>💡 <strong>Tip:</strong> Look for the "My Syllabus Events" calendar in your left sidebar</p>
                    <p>📱 <strong>Mobile:</strong> Events sync to your phone's calendar app automatically</p>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Date Events Card */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {date?.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <CardDescription>{selectedDateEvents.length} events scheduled</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDateEvents.map((event) => (
                        <div key={event.id} className="flex flex-col space-y-1 border-l-2 border-primary pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{event.title}</h3>
                            <Badge variant="outline" className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.course}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-muted-foreground">No events scheduled for this day</p>
                      <Link href="/upload">
                        <Button variant="outline" size="sm" className="mt-4">
                          Add Event
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
