"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Brain, 
  Target, 
  Zap, 
  BookOpen,
  GraduationCap,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Flame,
  Trophy,
  Timer,
  Coffee,
  Plus
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Area, AreaChart } from "recharts"
import { StudySessionTracker } from "@/components/study-session-tracker"

interface SavedEvent {
  id: string
  title: string
  event_date: string
  event_type: string
  description: string
  confidence: number
}

interface AnalyticsProps {
  events: SavedEvent[]
  syllabusCount: number
}

export function DashboardAnalytics({ events, syllabusCount }: AnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "semester">("month")
  const [studyStreak, setStudyStreak] = useState(7)
  const [totalStudyHours, setTotalStudyHours] = useState(42.5)

  // Analytics calculations
  const analytics = useMemo(() => {
    const now = new Date()
    const upcomingEvents = events.filter(event => new Date(event.event_date) >= now)
    const pastEvents = events.filter(event => new Date(event.event_date) < now)
    
    // This week's events
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    
    const thisWeekEvents = events.filter(event => {
      const eventDate = new Date(event.event_date)
      return eventDate >= weekStart && eventDate < weekEnd
    })

    // Workload analysis
    const eventsByType = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get events by day for the next 7 days
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i)
      return date
    })

    const weeklySchedule = next7Days.map(date => {
      const dayEvents = upcomingEvents.filter(event => 
        new Date(event.event_date).toDateString() === date.toDateString()
      )
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        events: dayEvents.length,
        exams: dayEvents.filter(e => e.event_type === 'exam').length,
        homework: dayEvents.filter(e => e.event_type === 'homework').length,
        projects: dayEvents.filter(e => e.event_type === 'project').length
      }
    })

    // Workload intensity calculation
    const workloadIntensity = thisWeekEvents.length > 5 ? 'High' : thisWeekEvents.length > 2 ? 'Medium' : 'Low'
    
    return {
      upcomingCount: upcomingEvents.length,
      pastCount: pastEvents.length,
      thisWeekCount: thisWeekEvents.length,
      eventsByType,
      weeklySchedule,
      workloadIntensity,
      completionRate: pastEvents.length > 0 ? Math.round((pastEvents.length / (pastEvents.length + upcomingEvents.length)) * 100) : 0
    }
  }, [events])

  const eventTypeColors = {
    exam: "#ef4444",
    homework: "#3b82f6", 
    project: "#10b981",
    lecture: "#8b5cf6",
    quiz: "#f59e0b"
  }

  const pieData = Object.entries(analytics.eventsByType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    fill: eventTypeColors[type as keyof typeof eventTypeColors] || "#6b7280"
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Study Streak</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{studyStreak} days</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">Keep it up! 🔥</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{analytics.completionRate}%</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
              <Progress value={analytics.completionRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Study Hours</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalStudyHours}h</p>
                </div>
                <Timer className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">This week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={`bg-gradient-to-br ${
            analytics.workloadIntensity === 'High' ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800' :
            analytics.workloadIntensity === 'Medium' ? 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800' :
            'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    analytics.workloadIntensity === 'High' ? 'text-red-600 dark:text-red-400' :
                    analytics.workloadIntensity === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>Workload</p>
                  <p className={`text-2xl font-bold ${
                    analytics.workloadIntensity === 'High' ? 'text-red-900 dark:text-red-100' :
                    analytics.workloadIntensity === 'Medium' ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-green-900 dark:text-green-100'
                  }`}>{analytics.workloadIntensity}</p>
                </div>
                <Activity className={`h-8 w-8 ${
                  analytics.workloadIntensity === 'High' ? 'text-red-500' :
                  analytics.workloadIntensity === 'Medium' ? 'text-yellow-500' :
                  'text-green-500'
                }`} />
              </div>
              <p className={`text-xs mt-1 ${
                analytics.workloadIntensity === 'High' ? 'text-red-600/70 dark:text-red-400/70' :
                analytics.workloadIntensity === 'Medium' ? 'text-yellow-600/70 dark:text-yellow-400/70' :
                'text-green-600/70 dark:text-green-400/70'
              }`}>{analytics.thisWeekCount} events this week</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="focus" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Focus Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Event Distribution
                </CardTitle>
                <CardDescription>Breakdown of your academic events by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <RechartsPieChart data={pieData} cx="50%" cy="50%" outerRadius={80}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </RechartsPieChart>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-wrap gap-2 mt-4">
                  {pieData.map((item) => (
                    <Badge key={item.name} variant="outline" className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Schedule Preview
                </CardTitle>
                <CardDescription>Your upcoming week at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.weeklySchedule}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="events" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Next 7 Days Detailed Schedule</CardTitle>
              <CardDescription>Day-by-day breakdown of your upcoming events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analytics.weeklySchedule.map((day, index) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">{day.day}</p>
                        <p className="text-2xl font-bold text-blue-600">{day.date}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{day.events} events total</p>
                        <div className="flex gap-2 text-xs">
                          {day.exams > 0 && <Badge variant="destructive">📝 {day.exams} exam{day.exams > 1 ? 's' : ''}</Badge>}
                          {day.homework > 0 && <Badge variant="default">📚 {day.homework} homework</Badge>}
                          {day.projects > 0 && <Badge variant="secondary">🎯 {day.projects} project{day.projects > 1 ? 's' : ''}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {day.events === 0 ? (
                        <Badge variant="outline" className="text-green-600">✨ Free day</Badge>
                      ) : day.events > 3 ? (
                        <Badge variant="destructive">🔥 Heavy day</Badge>
                      ) : (
                        <Badge variant="secondary">📅 Normal day</Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Study Recommendations
                </CardTitle>
                <CardDescription>Personalized insights based on your schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">Optimal Study Time</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Based on your schedule, 2-4 PM appears to be your most productive time. Consider scheduling important study sessions then.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900 dark:text-amber-100">Workload Alert</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">You have 3 major deadlines next week. Consider starting early on the largest project to avoid cramming.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">Great Progress!</p>
                        <p className="text-sm text-green-700 dark:text-green-300">You're maintaining a great study streak. Your completion rate is above average for this time of semester.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Study Habits Analytics</CardTitle>
                <CardDescription>Insights into your academic patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Coffee className="h-8 w-8 mx-auto mb-2 text-brown-600" />
                    <p className="font-medium">Peak Hours</p>
                    <p className="text-sm text-gray-600">2-4 PM</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">Avg Session</p>
                    <p className="text-sm text-gray-600">2.5 hours</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Productivity</p>
                    <p className="text-sm text-gray-600">+15% this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="focus" className="mt-6" data-focus-mode>
          <StudySessionTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
} 