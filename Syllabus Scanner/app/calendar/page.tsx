"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { GoogleAuthButton } from "@/components/google-auth-button"

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState("month")
  const [courseFilter, setCourseFilter] = useState("all")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authenticated with Google
  useEffect(() => {
    const checkAuth = () => {
      const hasAccessToken = document.cookie.includes("google_access_token=")
      setIsAuthenticated(hasAccessToken)
      setIsLoading(false)
    }

    checkAuth()

    // Also check when the component is focused
    window.addEventListener("focus", checkAuth)
    return () => window.removeEventListener("focus", checkAuth)
  }, [])

  // Mock events data
  const events = [
    { id: 1, title: "Midterm Exam", date: new Date(2024, 9, 15), course: "CS 101", type: "Exam" },
    { id: 2, title: "Final Project Due", date: new Date(2024, 11, 5), course: "CS 101", type: "Assignment" },
    { id: 3, title: "Research Paper", date: new Date(2024, 10, 20), course: "HIST 200", type: "Assignment" },
    { id: 4, title: "Quiz 3", date: new Date(2024, 9, 28), course: "MATH 301", type: "Quiz" },
    { id: 5, title: "Final Exam", date: new Date(2024, 11, 15), course: "CS 101", type: "Exam" },
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

  if (isLoading) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Calendar" text="View and manage your academic calendar." />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </DashboardShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Calendar" text="View and manage your academic calendar." />
        <Card>
          <CardHeader>
            <CardTitle>Connect Google Calendar</CardTitle>
            <CardDescription>Connect your Google Calendar to view and manage your academic events.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-center text-muted-foreground mb-6">
              To sync your academic events with Google Calendar, you need to connect your Google account.
            </p>
            <GoogleAuthButton size="lg" />
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Calendar" text="View and manage your academic calendar." />
      <div className="grid gap-4 md:grid-cols-7">
        <motion.div
          className="md:col-span-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-1.5">
                <CardTitle>Calendar</CardTitle>
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
          <Card className="h-full">
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
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.course}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-muted-foreground">No events scheduled for this day</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
