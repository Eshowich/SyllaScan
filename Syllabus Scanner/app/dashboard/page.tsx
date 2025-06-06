"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Calendar, Clock, FileText, MoreHorizontal, Upload, BookOpen, Users, GraduationCap, LayoutDashboard, Plus, ExternalLink, TrendingUp, Brain, Target, Zap, Trophy, Activity, Edit, Trash2, Save, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { RecentUploads } from "@/components/recent-uploads"
import { UpcomingEvents } from "@/components/upcoming-events"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { SyllabusUploader } from "@/components/syllabus-uploader"
import { Badge } from "@/components/ui/badge"
import { DashboardAnalytics } from "@/components/dashboard-analytics"
import { DashboardQuickActions } from "@/components/dashboard-quick-actions"
import { DashboardSmartCalendar } from "@/components/dashboard-smart-calendar"
import Link from "next/link"

interface SavedEvent {
  id: string
  title: string
  event_date: string
  event_type: string
  description: string
  confidence: number
}

interface NewEventData extends SavedEvent {
  syllabusId?: string
}

interface SavedSyllabus {
  id: string
  title: string
  course_code: string
  course_name: string
  instructor_name: string
  created_at: string
  events: SavedEvent[]
}

export default function DashboardPage() {
  const [savedSyllabi, setSavedSyllabi] = useState<SavedSyllabus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [editingEvent, setEditingEvent] = useState<SavedEvent | NewEventData | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingMode, setEditingMode] = useState<string | null>(null) // syllabusId when in edit mode
  const [editingSyllabus, setEditingSyllabus] = useState<string | null>(null) // syllabusId when editing syllabus info
  const [syllabusEditData, setSyllabusEditData] = useState<{
    title: string
    course_code: string
    course_name: string
    instructor_name: string
  }>({
    title: '',
    course_code: '',
    course_name: '',
    instructor_name: ''
  })
  const [newEvent, setNewEvent] = useState<{
    title: string
    event_date: string
    event_type: 'homework' | 'exam' | 'project' | 'lecture' | 'quiz'
    description: string
  }>({
    title: '',
    event_date: '',
    event_type: 'homework',
    description: ''
  })

  useEffect(() => {
    fetchSavedSyllabi()
  }, [])

  const fetchSavedSyllabi = async () => {
    setIsLoading(true)
    
    try {
      console.log('🔍 Fetching syllabi from dashboard API...')
      
      const response = await fetch('/api/dashboard/get-syllabi', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('📡 API Response status:', response.status)
      
      // NEVER throw errors - always handle gracefully
      if (response.ok) {
        try {
          const data = await response.json()
          console.log('✅ API Response data:', data)
          
          if (data.success && Array.isArray(data.syllabi)) {
            console.log('📚 Loaded syllabi with events:', data.syllabi.map((s: SavedSyllabus) => ({
              title: s.title,
              eventCount: s.events?.length || 0,
              events: s.events?.map((e: SavedEvent) => ({ title: e.title, date: e.event_date })) || []
            })))
            setSavedSyllabi(data.syllabi)
          } else {
            console.log('📝 No syllabi found, showing empty state')
            setSavedSyllabi([])
          }
        } catch (parseError) {
          console.log('⚠️ Failed to parse response, showing empty state')
          setSavedSyllabi([])
        }
      } else {
        console.log('⚠️ API returned error status, showing empty state')
        setSavedSyllabi([])
      }
      
    } catch (networkError) {
      console.log('🔄 Network error, showing empty state:', networkError)
      setSavedSyllabi([])
    }
    
    setIsLoading(false)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getAllEvents = () => {
    return savedSyllabi.flatMap(syllabus => 
      syllabus.events.map(event => ({ ...event, syllabusTitle: syllabus.title }))
    )
  }

  const getEventsByType = (eventType: string) => {
    return getAllEvents().filter(event => event.event_type === eventType)
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    // Set time to start of today to include events happening today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const allEvents = getAllEvents()
    
    console.log('🔍 Debug getUpcomingEvents:', {
      totalEvents: allEvents.length,
      todayDate: today.toISOString(),
      todayDateString: today.toDateString(),
      sampleEvents: allEvents.slice(0, 5).map(e => ({
        title: e.title,
        raw_date: e.event_date,
        parsed_date: new Date(e.event_date),
        parsed_date_string: new Date(e.event_date).toDateString(),
        parsed_date_iso: new Date(e.event_date).toISOString(),
        is_valid_date: !isNaN(new Date(e.event_date).getTime()),
        is_upcoming: new Date(e.event_date) >= today,
        comparison: `${new Date(e.event_date).getTime()} >= ${today.getTime()}`
      }))
    })
    
    const upcomingEvents = allEvents
      .filter(event => {
        const eventDate = new Date(event.event_date)
        // Check if the date is valid
        if (isNaN(eventDate.getTime())) {
          console.warn('⚠️ Invalid date found:', event.event_date, 'for event:', event.title)
          return false
        }
        
        // Include events from today onwards
        const isUpcoming = eventDate >= today
        console.log(`📅 Event "${event.title}" on ${event.event_date}: ${isUpcoming ? 'UPCOMING' : 'PAST'} (eventDate: ${eventDate.toISOString()}, today: ${today.toISOString()})`)
        return isUpcoming
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 10)
    
    console.log('📊 Upcoming events result:', {
      count: upcomingEvents.length,
      events: upcomingEvents.map(e => ({ title: e.title, date: e.event_date }))
    })
    
    return upcomingEvents
  }

  const handleSwitchToFocus = () => {
    setActiveTab("analytics")
    // Small delay to ensure tab switch happens, then trigger focus tab
    setTimeout(() => {
      // Find and click the focus tab within analytics
      const focusTab = document.querySelector('[value="focus"]')
      if (focusTab) {
        (focusTab as HTMLElement).click()
      }
      // Also scroll to the focus section
      setTimeout(() => {
        const focusElement = document.querySelector('[data-focus-mode]')
        if (focusElement) {
          focusElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 200)
    }, 100)
  }

  // Event management functions
  const handleAddEvent = (syllabusId: string) => {
    setEditingEvent(null)
    setNewEvent({
      title: '',
      event_date: '',
      event_type: 'homework',
      description: ''
    })
    // Store the target syllabus ID for the new event
    const newEventData: NewEventData = { 
      id: '', 
      title: '', 
      event_date: '', 
      event_type: '', 
      description: '', 
      confidence: 0, 
      syllabusId 
    }
    setEditingEvent(newEventData)
    setIsEventModalOpen(true)
  }

  const handleEditEvent = (event: SavedEvent) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      event_date: event.event_date.split('T')[0], // Format for date input
      event_type: event.event_type as any, // Allow any event type from saved events
      description: event.description || ''
    })
    setIsEventModalOpen(true)
  }

  const handleDeleteEvent = async (syllabusId: string, eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      console.log('🗑️ Deleting event:', eventId)

      const response = await fetch(`/api/events?eventId=${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Event deleted successfully:', result)
        
        // Update local state immediately for better UX
        setSavedSyllabi(prev => prev.map(syllabus => 
          syllabus.id === syllabusId 
            ? { ...syllabus, events: syllabus.events.filter(event => event.id !== eventId) }
            : syllabus
        ))
      } else {
        const error = await response.json()
        console.error('❌ Failed to delete event:', error)
        alert('Failed to delete event: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Network error deleting event:', error)
      alert('Network error: Unable to delete event. Please try again.')
    }
  }

  const handleSaveEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const isEditing = editingEvent && editingEvent.id
      const syllabusId = (editingEvent as NewEventData)?.syllabusId || savedSyllabi[0]?.id

      if (!syllabusId && !isEditing) {
        alert('No syllabus available to add the event to')
        return
      }

      console.log(isEditing ? '✏️ Updating event:' : '➕ Creating event:', { 
        eventId: editingEvent?.id, 
        syllabusId, 
        title: newEvent.title 
      })

      if (isEditing) {
        // Update existing event
        const response = await fetch('/api/events', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: editingEvent.id,
            title: newEvent.title,
            description: newEvent.description,
            event_date: newEvent.event_date,
            event_type: newEvent.event_type
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Event updated successfully:', result)
          
          // Update local state with the updated event
          setSavedSyllabi(prev => prev.map(syllabus => ({
            ...syllabus,
            events: syllabus.events.map(event => 
              event.id === editingEvent.id ? result.event : event
            )
          })))
        } else {
          const error = await response.json()
          console.error('❌ Failed to update event:', error)
          alert('Failed to update event: ' + (error.error || 'Unknown error'))
          return
        }
      } else {
        // Create new event
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            syllabusId: syllabusId,
            title: newEvent.title,
            description: newEvent.description,
            event_date: newEvent.event_date,
            event_type: newEvent.event_type
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Event created successfully:', result)
          
          // Add the new event to local state
          setSavedSyllabi(prev => prev.map((syllabus) => 
            syllabus.id === syllabusId 
              ? { ...syllabus, events: [...syllabus.events, result.event] }
              : syllabus
          ))
        } else {
          const error = await response.json()
          console.error('❌ Failed to create event:', error)
          alert('Failed to create event: ' + (error.error || 'Unknown error'))
          return
        }
      }

      // Close modal and reset form
      setIsEventModalOpen(false)
      setEditingEvent(null)
      setNewEvent({ title: '', event_date: '', event_type: 'homework', description: '' })
      
    } catch (error) {
      console.error('❌ Network error saving event:', error)
      alert('Network error: Unable to save event. Please try again.')
    }
  }

  // Syllabus management functions
  const handleEditSyllabus = (syllabus: SavedSyllabus) => {
    setEditingSyllabus(syllabus.id)
    setSyllabusEditData({
      title: syllabus.title,
      course_code: syllabus.course_code || '',
      course_name: syllabus.course_name || '',
      instructor_name: syllabus.instructor_name || ''
    })
  }

  const handleSaveSyllabus = async (syllabusId: string) => {
    if (!syllabusEditData.title.trim()) {
      alert('Syllabus title is required')
      return
    }

    try {
      console.log('✏️ Updating syllabus:', { syllabusId, title: syllabusEditData.title })

      const response = await fetch('/api/syllabi', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syllabusId: syllabusId,
          title: syllabusEditData.title,
          course_code: syllabusEditData.course_code,
          course_name: syllabusEditData.course_name,
          instructor_name: syllabusEditData.instructor_name
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Syllabus updated successfully:', result)
        
        // Update local state with the updated syllabus
        setSavedSyllabi(prev => prev.map(syllabus => 
          syllabus.id === syllabusId ? { ...syllabus, ...result.syllabus } : syllabus
        ))
        
        setEditingSyllabus(null)
      } else {
        const error = await response.json()
        console.error('❌ Failed to update syllabus:', error)
        alert('Failed to update syllabus: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Network error updating syllabus:', error)
      alert('Network error: Unable to update syllabus. Please try again.')
    }
  }

  const handleDeleteSyllabus = async (syllabusId: string, syllabusTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${syllabusTitle}" and all its events? This action cannot be undone.`)) return

    try {
      console.log('🗑️ Deleting syllabus:', syllabusId)

      const response = await fetch(`/api/syllabi?syllabusId=${syllabusId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Syllabus deleted successfully:', result)
        
        // Remove from local state
        setSavedSyllabi(prev => prev.filter(syllabus => syllabus.id !== syllabusId))
      } else {
        const error = await response.json()
        console.error('❌ Failed to delete syllabus:', error)
        alert('Failed to delete syllabus: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Network error deleting syllabus:', error)
      alert('Network error: Unable to delete syllabus. Please try again.')
    }
  }

  const handleDeleteAllSyllabi = async () => {
    if (!confirm(`Are you sure you want to delete ALL syllabi and events? This will permanently remove all your data and cannot be undone.`)) return

    try {
      console.log('🗑️ Deleting all syllabi')

      const response = await fetch('/api/syllabi?deleteAll=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ All syllabi deleted successfully:', result)
        
        // Clear local state
        setSavedSyllabi([])
      } else {
        const error = await response.json()
        console.error('❌ Failed to delete all syllabi:', error)
        alert('Failed to delete all syllabi: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Network error deleting all syllabi:', error)
      alert('Network error: Unable to delete all syllabi. Please try again.')
    }
  }

  // If user is not logged in, show sign-in prompt
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* Simple background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/15 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-100/15 via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        {/* Enhanced Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <LayoutDashboard className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Academic Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Your intelligent study companion
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchSavedSyllabi} className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Refresh
            </Button>
            {savedSyllabi.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteAllSyllabi} 
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </Button>
            )}
            <Link href="/upload">
              <Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                <Plus className="h-4 w-4" />
                <span>Add Syllabus</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Syllabi</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{savedSyllabi.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">Events</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{getAllEvents().length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400">Upcoming</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{getUpcomingEvents().length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400">Exams</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{getEventsByType('exam').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Streak</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">7d</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {savedSyllabi.length === 0 ? (
          <div className="min-h-[70vh] flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-lg mx-auto text-center space-y-8 p-8">
              {/* Animated Illustration */}
              <div className="relative">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <LayoutDashboard className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 w-6 h-6 bg-yellow-400 rounded-full opacity-70 animate-ping"></div>
                <div className="absolute -bottom-2 -left-6 w-4 h-4 bg-green-400 rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute -bottom-4 -right-6 w-5 h-5 bg-blue-400 rounded-full opacity-60 animate-bounce delay-150"></div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  🎓 Ready to Get Organized?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Your academic command center is empty, but that's about to change!
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                  Upload your syllabus and let our AI extract all your important dates, assignments, and exams automatically.
                </p>
              </div>

              {/* Main Action Button */}
              <div className="space-y-4">
                <Link href="/upload">
                  <Button 
                    size="lg" 
                    className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Upload className="h-6 w-6 mr-3" />
                    Upload Your First Syllabus
                  </Button>
                </Link>
                
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  ✨ Try our demo with sample syllabus text or upload your own PDF
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 gap-4 mt-8">
                <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Smart Event Detection</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI automatically finds all your important dates</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Organized Categories</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Exams, homework, and projects sorted automatically</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Never Miss Deadlines</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sync with Google Calendar and get reminders</p>
                  </div>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/upload" className="flex-1">
                  <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                    📝 Try Demo Text
                  </Button>
                </Link>
                <Button variant="ghost" onClick={fetchSavedSyllabi} className="flex-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                  🔄 Refresh Dashboard
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Smart Calendar
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </TabsTrigger>
              <TabsTrigger value="syllabi" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Syllabi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
                    <CardHeader>
                      <CardTitle>Upcoming Events</CardTitle>
                      <CardDescription>Your next 10 upcoming academic events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getUpcomingEvents().length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No upcoming events found</p>
                          </div>
                        ) : (
                          getUpcomingEvents().map((event: any) => (
                            <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-full ${getEventTypeColor(event.event_type)}`}>
                                  {getEventIcon(event.event_type)}
                                </div>
                                <div>
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-sm text-gray-500">
                                    {event.syllabusTitle} • {formatDate(event.event_date)}
                                  </p>
                                  {event.description && (
                                    <p className="text-xs text-gray-400 max-w-md truncate mt-1">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">
                                  {event.event_type}
                                </Badge>
                                {event.confidence && (
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round(event.confidence * 100)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <DashboardQuickActions 
                    events={getAllEvents()} 
                    onRefresh={fetchSavedSyllabi}
                    onSwitchToFocus={handleSwitchToFocus}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <DashboardAnalytics 
                events={getAllEvents()} 
                syllabusCount={savedSyllabi.length} 
              />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <DashboardSmartCalendar events={getAllEvents()} />
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <DashboardQuickActions 
                events={getAllEvents()} 
                onRefresh={fetchSavedSyllabi}
                onSwitchToFocus={handleSwitchToFocus}
              />
            </TabsContent>

            <TabsContent value="syllabi" className="mt-6">
              <div className="grid gap-6">
                {savedSyllabi.map((syllabus) => (
                  <Card key={syllabus.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingSyllabus === syllabus.id ? (
                            <div className="space-y-3">
                              <Input
                                value={syllabusEditData.title}
                                onChange={(e) => setSyllabusEditData(prev => ({ ...prev, title: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSyllabus(syllabus.id)
                                  if (e.key === 'Escape') setEditingSyllabus(null)
                                }}
                                placeholder="Syllabus title"
                                className="font-semibold text-lg"
                                autoFocus
                              />
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <Input
                                  value={syllabusEditData.course_code}
                                  onChange={(e) => setSyllabusEditData(prev => ({ ...prev, course_code: e.target.value }))}
                                  placeholder="Course code (e.g., CS101)"
                                  className="text-sm"
                                />
                                <Input
                                  value={syllabusEditData.course_name}
                                  onChange={(e) => setSyllabusEditData(prev => ({ ...prev, course_name: e.target.value }))}
                                  placeholder="Course name"
                                  className="text-sm"
                                />
                                <Input
                                  value={syllabusEditData.instructor_name}
                                  onChange={(e) => setSyllabusEditData(prev => ({ ...prev, instructor_name: e.target.value }))}
                                  placeholder="Instructor name"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <CardTitle className="text-xl cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleEditSyllabus(syllabus)}>
                                {syllabus.course_code ? `${syllabus.course_code}: ${syllabus.title}` : syllabus.title}
                                <Edit className="h-4 w-4 inline ml-2 opacity-50" />
                              </CardTitle>
                              <CardDescription>
                                {syllabus.instructor_name && `Instructor: ${syllabus.instructor_name} • `}
                                Added {new Date(syllabus.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingSyllabus === syllabus.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSaveSyllabus(syllabus.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingSyllabus(null)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge variant="secondary">
                                {syllabus.events.length} events
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleAddEvent(syllabus.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Event
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMode(editingMode === syllabus.id ? null : syllabus.id)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {editingMode === syllabus.id ? 'Done' : 'Edit'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSyllabus(syllabus.id, syllabus.title)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {syllabus.events.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No events yet</p>
                            <p className="text-sm">Add some events to get started!</p>
                            <Button
                              onClick={() => handleAddEvent(syllabus.id)}
                              className="mt-4 bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Event
                            </Button>
                          </div>
                        ) : (
                          syllabus.events.map((event) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${getEventTypeColor(event.event_type)}`}>
                                  {getEventIcon(event.event_type)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(event.event_date)} • {event.event_type}
                                  </p>
                                  {event.description && (
                                    <p className="text-xs text-gray-400 mt-1 max-w-md truncate">
                                      {event.description}
                                    </p>
                                  )}
                                  {event.confidence && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {Math.round(event.confidence * 100)}% confidence
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {editingMode === syllabus.id && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditEvent(event)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteEvent(syllabus.id, event.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Event Edit/Add Modal */}
              <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? 'Edit Event' : 'Add New Event'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEvent 
                        ? 'Make changes to your event details below.' 
                        : 'Add a new academic event to your schedule.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Event Title *</label>
                      <Input
                        placeholder="e.g., Midterm Exam, Project Due"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Date *</label>
                        <Input
                          type="date"
                          value={newEvent.event_date}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Type</label>
                        <Select
                          value={newEvent.event_type}
                          onValueChange={(value) => setNewEvent(prev => ({ ...prev, event_type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="homework">📚 Homework</SelectItem>
                            <SelectItem value="exam">📝 Exam</SelectItem>
                            <SelectItem value="project">🎯 Project</SelectItem>
                            <SelectItem value="quiz">❓ Quiz</SelectItem>
                            <SelectItem value="lecture">👨‍🏫 Lecture</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                      <Textarea
                        placeholder="Additional details about this event..."
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEventModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEvent} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      {editingEvent ? 'Save Changes' : 'Add Event'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
