"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Calendar, Clock, FileText, MoreHorizontal, Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { RecentUploads } from "@/components/recent-uploads"
import { UpcomingEvents } from "@/components/upcoming-events"
import { useAuth } from "@/hooks/use-auth"
import { getUserStats, type UserStats } from "@/lib/dashboard"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { SyllabusUploader } from "@/components/syllabus-uploader"

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    totalSyllabi: 0,
    totalEvents: 0,
    eventsThisWeek: 0,
    activeCourses: 0,
    semesterProgress: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchStats() {
      if (userLoading) return;
      
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const userStats = await getUserStats(user.id)
        setStats(userStats)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user, userLoading])

  const handleUploadClick = () => {
    router.push('/upload')
  }

  // If user is not logged in, show sign-in prompt
  if (!userLoading && !user) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Dashboard" text="Sign in to view your dashboard." />
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold">Sign in to access your dashboard</h2>
            <p className="text-muted-foreground">
              Sign in with Google to upload syllabi and track your academic schedule.
            </p>
          </div>
          <GoogleAuthButton size="lg" text="Sign in with Google" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="View your syllabus scanning activity and upcoming events.">
        <Button onClick={handleUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Syllabus
        </Button>
      </DashboardHeader>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Syllabi</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSyllabi}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalSyllabi > 0 
                      ? `${stats.totalEvents} events extracted` 
                      : "Upload your first syllabus"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.eventsThisWeek} events this week
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Semester Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.semesterProgress}%</div>
                  <Progress value={stats.semesterProgress} className="mt-2" />
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Courses</CardTitle>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCourses}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeCourses === 0 
                      ? "No courses tracked yet" 
                      : stats.activeCourses === 1 
                        ? "1 course active" 
                        : `${stats.activeCourses} courses active`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <motion.div
              className="col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <UpcomingEvents />
            </motion.div>
            <motion.div
              className="col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <RecentUploads />
            </motion.div>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View detailed analytics about your syllabi and events.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate and download reports about your academic schedule.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Reports feature coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
