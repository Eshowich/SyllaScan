"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Brain,
  Target,
  Coffee,
  BookOpen,
  GraduationCap,
  Users,
  FileText,
  Zap,
  Timer,
  ArrowRight
} from "lucide-react"

interface SavedEvent {
  id: string
  title: string
  event_date: string
  event_type: string
  description: string
  confidence: number
}

interface SmartCalendarProps {
  events: SavedEvent[]
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: SavedEvent[]
  studyLoad: number
  hasConflicts: boolean
}

export function DashboardSmartCalendar({ events }: SmartCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const days: CalendarDay[] = []

    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: [],
        studyLoad: 0,
        hasConflicts: false
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dayEvents = events.filter(event => 
        new Date(event.event_date).toDateString() === date.toDateString()
      )
      
      // Calculate study load (number of events weighted by type)
      const studyLoad = dayEvents.reduce((load, event) => {
        switch (event.event_type) {
          case 'exam': return load + 3
          case 'project': return load + 2
          case 'homework': return load + 1
          case 'quiz': return load + 1.5
          default: return load + 0.5
        }
      }, 0)

      // Check for conflicts (multiple high-priority events on same day)
      const highPriorityEvents = dayEvents.filter(e => 
        e.event_type === 'exam' || e.event_type === 'project'
      )
      const hasConflicts = highPriorityEvents.length > 1

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents,
        studyLoad,
        hasConflicts
      })
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: [],
        studyLoad: 0,
        hasConflicts: false
      })
    }

    return days
  }, [currentDate, events, currentYear, currentMonth])

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'exam': return <GraduationCap className="h-3 w-3" />
      case 'homework': return <FileText className="h-3 w-3" />
      case 'project': return <BookOpen className="h-3 w-3" />
      case 'lecture': return <Users className="h-3 w-3" />
      case 'quiz': return <Clock className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getStudyLoadColor = (load: number) => {
    if (load >= 4) return 'bg-red-100 border-red-300 text-red-800'
    if (load >= 2) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    if (load >= 1) return 'bg-blue-100 border-blue-300 text-blue-800'
    return 'bg-gray-50 border-gray-200 text-gray-600'
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const selectedDayEvents = selectedDate ? 
    events.filter(event => 
      new Date(event.event_date).toDateString() === selectedDate.toDateString()
    ) : []

  // AI-generated study suggestions
  const studySuggestions = useMemo(() => {
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.event_date)
      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil > 0 && daysUntil <= 14
    }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

    return upcomingEvents.slice(0, 3).map(event => {
      const daysUntil = Math.ceil((new Date(event.event_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      let suggestion = ""
      let urgency = "medium"
      
      if (event.event_type === 'exam') {
        if (daysUntil <= 3) {
          suggestion = "Intensive review sessions recommended"
          urgency = "high"
        } else if (daysUntil <= 7) {
          suggestion = "Start comprehensive review"
          urgency = "medium"
        } else {
          suggestion = "Begin practice problems"
          urgency = "low"
        }
      } else if (event.event_type === 'project') {
        if (daysUntil <= 3) {
          suggestion = "Focus on final edits and submission prep"
          urgency = "high"
        } else if (daysUntil <= 7) {
          suggestion = "Complete main sections"
          urgency = "medium"
        } else {
          suggestion = "Work on outline and research"
          urgency = "low"
        }
      } else if (event.event_type === 'homework') {
        suggestion = daysUntil <= 2 ? "Complete soon" : "Start working on problems"
        urgency = daysUntil <= 2 ? "medium" : "low"
      }

      return {
        event,
        suggestion,
        urgency,
        daysUntil
      }
    })
  }, [events, today])

  return (
    <div className="space-y-6">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="month" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-4">
                  <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-500">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        onClick={() => setSelectedDate(day.date)}
                        className={`
                          relative p-2 h-24 text-left text-sm border rounded-lg transition-all hover:shadow-md
                          ${day.isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50 opacity-50'}
                          ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                          ${day.hasConflicts ? 'ring-2 ring-red-400' : ''}
                          ${getStudyLoadColor(day.studyLoad)}
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${day.isToday ? 'text-blue-600' : ''}`}>
                            {day.date.getDate()}
                          </span>
                          {day.hasConflicts && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {day.events.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`
                                text-xs px-1 py-0.5 rounded truncate flex items-center gap-1
                                ${event.event_type === 'exam' ? 'bg-red-100 text-red-700' :
                                  event.event_type === 'project' ? 'bg-green-100 text-green-700' :
                                  event.event_type === 'homework' ? 'bg-blue-100 text-blue-700' :
                                  event.event_type === 'quiz' ? 'bg-orange-100 text-orange-700' :
                                  'bg-purple-100 text-purple-700'}
                              `}
                            >
                              {getEventIcon(event.event_type)}
                              <span className="truncate">{event.title}</span>
                            </div>
                          ))}
                          {day.events.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{day.events.length - 2} more
                            </div>
                          )}
                        </div>
                        
                        {day.studyLoad > 0 && (
                          <div className="absolute top-1 right-1">
                            <div className={`
                              w-2 h-2 rounded-full
                              ${day.studyLoad >= 4 ? 'bg-red-500' :
                                day.studyLoad >= 2 ? 'bg-yellow-500' :
                                'bg-green-500'}
                            `}></div>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Selected Day Details */}
              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDayEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                          >
                            <div className={`
                              p-2 rounded-lg
                              ${event.event_type === 'exam' ? 'bg-red-100 text-red-600' :
                                event.event_type === 'project' ? 'bg-green-100 text-green-600' :
                                event.event_type === 'homework' ? 'bg-blue-100 text-blue-600' :
                                event.event_type === 'quiz' ? 'bg-orange-100 text-orange-600' :
                                'bg-purple-100 text-purple-600'}
                            `}>
                              {getEventIcon(event.event_type)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{event.title}</p>
                              <p className="text-xs text-gray-500">{event.event_type}</p>
                              {event.description && (
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">No events scheduled</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Study Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Smart Study Plan
                  </CardTitle>
                  <CardDescription>AI recommendations for your upcoming events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studySuggestions.map((item, index) => (
                      <motion.div
                        key={item.event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                          p-3 rounded-lg border
                          ${item.urgency === 'high' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                            item.urgency === 'medium' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                            'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.event.title}</p>
                            <p className="text-xs text-gray-600 mb-2">
                              Due in {item.daysUntil} day{item.daysUntil !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs">{item.suggestion}</p>
                          </div>
                          <Badge 
                            variant={item.urgency === 'high' ? 'destructive' : 
                                   item.urgency === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.urgency}
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline" className="w-full mt-3">
                          <Timer className="h-3 w-3 mr-1" />
                          Schedule Study Time
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Calendar Legend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calendar Legend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>High workload (4+ events)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Medium workload (2-3 events)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Light workload (1 event)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span>Schedule conflicts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Week View</CardTitle>
              <CardDescription>Detailed view of your current week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Week view coming soon!</p>
                <p className="text-sm">Will show detailed hourly schedule</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Agenda View</CardTitle>
              <CardDescription>Chronological list of all upcoming events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events
                  .filter(event => new Date(event.event_date) >= today)
                  .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                  .slice(0, 10)
                  .map((event, index) => {
                    const daysUntil = Math.ceil((new Date(event.event_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className={`
                          p-3 rounded-lg
                          ${event.event_type === 'exam' ? 'bg-red-100 text-red-600' :
                            event.event_type === 'project' ? 'bg-green-100 text-green-600' :
                            event.event_type === 'homework' ? 'bg-blue-100 text-blue-600' :
                            event.event_type === 'quiz' ? 'bg-orange-100 text-orange-600' :
                            'bg-purple-100 text-purple-600'}
                        `}>
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {daysUntil === 0 ? ' (Today)' : 
                             daysUntil === 1 ? ' (Tomorrow)' : 
                             ` (in ${daysUntil} days)`}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Plan
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </motion.div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 