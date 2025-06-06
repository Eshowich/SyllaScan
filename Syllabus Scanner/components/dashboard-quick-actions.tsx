"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Calendar, 
  Clock, 
  BookOpen, 
  Brain, 
  Zap, 
  Target,
  Bell,
  Share,
  Download,
  Upload,
  FileText,
  Users,
  Coffee,
  Timer,
  Lightbulb,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  Settings,
  ExternalLink,
  X,
  Play
} from "lucide-react"
import Link from "next/link"

interface SavedEvent {
  id: string
  title: string
  event_date: string
  event_type: string
  description: string
  confidence: number
}

interface QuickActionsProps {
  events: SavedEvent[]
  onRefresh: () => void
  onSwitchToFocus?: () => void
}

export function DashboardQuickActions({ events, onRefresh, onSwitchToFocus }: QuickActionsProps) {
  const [quickAddText, setQuickAddText] = useState("")
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [showStudyPlan, setShowStudyPlan] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [studyPlan, setStudyPlan] = useState<any>(null)

  const todayEvents = events.filter(event => {
    const today = new Date()
    const eventDate = new Date(event.event_date)
    return eventDate.toDateString() === today.toDateString()
  })

  const urgentEvents = events.filter(event => {
    const now = new Date()
    const eventDate = new Date(event.event_date)
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 3 && daysUntil >= 0
  }).slice(0, 3)

  const handleStartFocus = () => {
    if (onSwitchToFocus) {
      onSwitchToFocus()
      // Small delay to ensure tab switch happens, then scroll to focus section
      setTimeout(() => {
        const focusElement = document.querySelector('[data-focus-mode]')
        if (focusElement) {
          focusElement.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      // Fallback: redirect to analytics tab with focus mode
      window.location.hash = '#analytics-focus'
    }
  }

  const handleGenerateStudyPlan = async () => {
    setIsGeneratingPlan(true)
    setShowStudyPlan(true)
    
    // Simulate AI study plan generation
    setTimeout(() => {
      const upcomingEvents = events
        .filter(event => new Date(event.event_date) > new Date())
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .slice(0, 5)

      const plan = {
        recommendations: [
          {
            title: "Focus on urgent deadlines first",
            description: "Prioritize assignments due within the next 3 days",
            events: urgentEvents.map(e => e.title),
            timeBlocks: "2-3 hours daily"
          },
          {
            title: "Break large projects into chunks",
            description: "Divide long-term projects into manageable daily tasks",
            events: upcomingEvents.filter(e => e.event_type === 'project').map(e => e.title),
            timeBlocks: "1 hour daily"
          },
          {
            title: "Review material before exams",
            description: "Start reviewing 1 week before exam dates",
            events: upcomingEvents.filter(e => e.event_type === 'exam').map(e => e.title),
            timeBlocks: "90 minutes daily"
          }
        ],
        schedule: [
          { time: "9:00 AM - 11:00 AM", activity: "Deep work session", type: "focus" },
          { time: "11:00 AM - 11:15 AM", activity: "Break", type: "break" },
          { time: "11:15 AM - 12:15 PM", activity: "Review session", type: "review" },
          { time: "2:00 PM - 3:30 PM", activity: "Project work", type: "project" },
          { time: "7:00 PM - 8:00 PM", activity: "Light review", type: "review" }
        ]
      }
      
      setStudyPlan(plan)
      setIsGeneratingPlan(false)
    }, 2000)
  }

  const handleExportCalendar = () => {
    setShowExportModal(true)
  }

  const downloadICS = () => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SyllaScan//Academic Events//EN\n'
    
    events.forEach(event => {
      const startDate = new Date(event.event_date)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration
      
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }
      
      icsContent += `BEGIN:VEVENT\n`
      icsContent += `UID:${event.id}@syllascan.com\n`
      icsContent += `DTSTAMP:${formatDate(new Date())}\n`
      icsContent += `DTSTART:${formatDate(startDate)}\n`
      icsContent += `DTEND:${formatDate(endDate)}\n`
      icsContent += `SUMMARY:${event.title}\n`
      icsContent += `DESCRIPTION:${event.description || event.event_type}\n`
      icsContent += `CATEGORIES:${event.event_type.toUpperCase()}\n`
      icsContent += `END:VEVENT\n`
    })
    
    icsContent += 'END:VCALENDAR'
    
    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'syllascan-calendar.ics'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    setShowExportModal(false)
  }

  const handleQuickAddEvent = async () => {
    if (!quickAddText.trim()) return
    
    // Simple AI parsing simulation
    const text = quickAddText.toLowerCase()
    let eventType = 'homework'
    
    if (text.includes('exam') || text.includes('test')) eventType = 'exam'
    else if (text.includes('project')) eventType = 'project'
    else if (text.includes('quiz')) eventType = 'quiz'
    else if (text.includes('lecture') || text.includes('class')) eventType = 'lecture'
    
    // Extract date (simplified)
    let eventDate = new Date()
    if (text.includes('tomorrow')) {
      eventDate.setDate(eventDate.getDate() + 1)
    } else if (text.includes('next week')) {
      eventDate.setDate(eventDate.getDate() + 7)
    } else if (text.includes('friday')) {
      eventDate.setDate(eventDate.getDate() + (5 - eventDate.getDay()))
    }
    
    // For demo purposes, just show a success message
    alert(`Event parsed: "${quickAddText}" scheduled for ${eventDate.toLocaleDateString()} as ${eventType}`)
    setQuickAddText("")
    setIsAddingEvent(false)
  }

  const quickActions = [
    {
      title: "Add Event",
      description: "Quick add any deadline",
      icon: Plus,
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => setIsAddingEvent(true)
    },
    {
      title: "Focus Mode",
      description: "Start a study session",
      icon: Target,
      color: "bg-purple-500 hover:bg-purple-600",
      action: handleStartFocus
    },
    {
      title: "AI Study Plan",
      description: "Get personalized schedule",
      icon: Brain,
      color: "bg-green-500 hover:bg-green-600",
      action: handleGenerateStudyPlan
    },
    {
      title: "Export Calendar",
      description: "Sync with Google Calendar",
      icon: Download,
      color: "bg-orange-500 hover:bg-orange-600",
      action: handleExportCalendar
    }
  ]

  const aiSuggestions = [
    {
      type: "study_session",
      title: "Start reviewing for Midterm Exam",
      description: "Due in 3 days - recommended 2 hour session",
      priority: "high",
      estimatedTime: "2 hours",
      icon: BookOpen
    },
    {
      type: "break_reminder",
      title: "Take a study break",
      description: "You've been focused for 90 minutes",
      priority: "medium",
      estimatedTime: "15 mins",
      icon: Coffee
    },
    {
      type: "deadline_prep",
      title: "Begin Project Proposal draft",
      description: "Due next week - start with outline",
      priority: "medium",
      estimatedTime: "1 hour",
      icon: FileText
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Today's Priority */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Today's Priority
          </CardTitle>
          <CardDescription>Focus on what matters most today</CardDescription>
        </CardHeader>
        <CardContent>
          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.slice(0, 2).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.event_type} • Today</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Start Working
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </motion.div>
              ))}
              {todayEvents.length > 2 && (
                <p className="text-sm text-gray-500 text-center">+{todayEvents.length - 2} more events today</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p className="font-medium">No events today! 🎉</p>
              <p className="text-sm">Great time to get ahead on upcoming work</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={action.action}
                className={`
                  ${action.color} text-white p-6 rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg
                  flex flex-col items-center text-center space-y-3 min-h-[140px] justify-center
                `}
              >
                <action.icon className="h-8 w-8 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold text-base leading-tight">{action.title}</p>
                  <p className="text-xs opacity-90 leading-tight">{action.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Suggestions
          </CardTitle>
          <CardDescription>Smart recommendations based on your schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
                    <suggestion.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{suggestion.title}</p>
                    <p className="text-xs text-gray-600">{suggestion.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Timer className="h-3 w-3 mr-1" />
                        {suggestion.estimatedTime}
                      </Badge>
                      <Badge variant={suggestion.priority === 'high' ? 'destructive' : suggestion.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                        {suggestion.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Urgent Deadlines */}
      {urgentEvents.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Urgent Deadlines
            </CardTitle>
            <CardDescription>Events due within 3 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentEvents.map((event) => {
                const daysUntil = Math.ceil((new Date(event.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-red-600">
                          {daysUntil === 0 ? 'Due today!' : 
                           daysUntil === 1 ? 'Due tomorrow' : 
                           `Due in ${daysUntil} days`}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="destructive">
                      Plan Study
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Event */}
      {isAddingEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Add Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="e.g., 'Physics exam tomorrow 2pm' or 'Essay due next Friday'"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleQuickAddEvent}>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Parse & Add
                </Button>
                <Button variant="outline" onClick={() => setIsAddingEvent(false)}>
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                💡 Tip: Use natural language like "Math homework due next Monday" and AI will extract the details!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Productivity Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Productivity Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start">
              <Search className="h-4 w-4 mr-2" />
              Search All Events
            </Button>
            <Button variant="outline" className="justify-start">
              <Filter className="h-4 w-4 mr-2" />
              Filter by Subject
            </Button>
            <Button variant="outline" className="justify-start">
              <Share className="h-4 w-4 mr-2" />
              Share Schedule
            </Button>
            <Button variant="outline" className="justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
            <Link href="/upload" className="md:col-span-2">
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Upload Another Syllabus
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Study Streak & Motivation */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="text-4xl">🔥</div>
              <div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">7 Day Streak!</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Keep the momentum going</p>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="w-3 h-3 bg-purple-500 rounded-full"></div>
              ))}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Complete one study session today to continue your streak! 💪
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Study Plan Modal */}
      {showStudyPlan && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-500" />
                AI Generated Study Plan
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowStudyPlan(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Personalized recommendations based on your upcoming events</CardDescription>
          </CardHeader>
          <CardContent>
            {isGeneratingPlan ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Analyzing your schedule and generating personalized recommendations...</p>
              </div>
            ) : studyPlan && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-900 dark:text-green-100">📋 Study Recommendations</h4>
                  <div className="space-y-3">
                    {studyPlan.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="font-medium text-sm text-green-900 dark:text-green-100">{rec.title}</p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">{rec.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{rec.timeBlocks}</Badge>
                          {rec.events.length > 0 && (
                            <span className="text-xs text-green-600">{rec.events.length} event(s)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-green-900 dark:text-green-100">⏰ Suggested Daily Schedule</h4>
                  <div className="space-y-2">
                    {studyPlan.schedule.map((slot: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            slot.type === 'focus' ? 'bg-blue-500' :
                            slot.type === 'break' ? 'bg-green-500' :
                            slot.type === 'review' ? 'bg-purple-500' :
                            'bg-orange-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-sm">{slot.activity}</p>
                            <p className="text-xs text-gray-500">{slot.time}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleStartFocus}>
                    <Target className="h-4 w-4 mr-2" />
                    Start Focus Session
                  </Button>
                  <Button variant="outline" onClick={() => setShowStudyPlan(false)}>
                    Save Plan
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Calendar Modal */}
      {showExportModal && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-orange-500" />
                Export Calendar
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowExportModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Export your academic events to external calendar apps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={downloadICS} className="justify-start bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Download .ICS File
                <span className="ml-auto text-xs opacity-75">Works with all calendar apps</span>
              </Button>
              
              <Button variant="outline" className="justify-start" onClick={() => {
                const icsUrl = 'data:text/calendar;charset=utf8,' + encodeURIComponent('Your calendar data here')
                window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&location=&details=Imported from SyllaScan`, '_blank')
              }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Google Calendar
                <span className="ml-auto text-xs opacity-75">Import manually</span>
              </Button>
              
              <Button variant="outline" className="justify-start" onClick={() => {
                navigator.clipboard.writeText(window.location.origin + '/api/calendar/ics')
                alert('Calendar URL copied to clipboard!')
              }}>
                <Share className="h-4 w-4 mr-2" />
                Copy Calendar URL
                <span className="ml-auto text-xs opacity-75">For calendar apps</span>
              </Button>
            </div>
            
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                📅 <strong>How to import:</strong> Download the .ICS file and import it into your calendar app. 
                All {events.length} events will be added with proper categories and reminders.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 