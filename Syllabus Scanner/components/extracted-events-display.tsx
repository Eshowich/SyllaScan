'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ExtractedEvent } from '@/lib/types'
import { Calendar, Download, RefreshCw, Clock, BookOpen, GraduationCap, FileText, Users, Trash2, CheckCircle, LayoutDashboard, Plus, Sparkles, Star, Trophy, Target, Zap } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { createSecondaryCalendar, addEventsToCalendar, checkCalendarAccess, requestCalendarAccess } from '@/lib/calendar-service'

interface ExtractedEventsDisplayProps {
  events: ExtractedEvent[];
  onReset: () => void;
}

export function ExtractedEventsDisplay({ events, onReset }: ExtractedEventsDisplayProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isSavingToDashboard, setIsSavingToDashboard] = useState(false)
  const [hasCalendarAccess, setHasCalendarAccess] = useState<boolean>(false)
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(events.map(e => e.id || '').filter(Boolean)))
  const [activeTab, setActiveTab] = useState('all')
  const { toast } = useToast()

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'exam': return <GraduationCap className="h-5 w-5" />
      case 'homework': return <FileText className="h-5 w-5" />
      case 'project': return <BookOpen className="h-5 w-5" />
      case 'lecture': return <Users className="h-5 w-5" />
      case 'quiz': return <Clock className="h-5 w-5" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'exam': return 'bg-red-500/10 border-red-400/30 hover:bg-red-500/20 backdrop-blur-sm'
      case 'homework': return 'bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20 backdrop-blur-sm'
      case 'project': return 'bg-green-500/10 border-green-400/30 hover:bg-green-500/20 backdrop-blur-sm'
      case 'lecture': return 'bg-purple-500/10 border-purple-400/30 hover:bg-purple-500/20 backdrop-blur-sm'
      case 'quiz': return 'bg-orange-500/10 border-orange-400/30 hover:bg-orange-500/20 backdrop-blur-sm'
      default: return 'bg-gray-500/10 border-gray-400/30 hover:bg-gray-500/20 backdrop-blur-sm'
    }
  }

  const getEventIconColor = (eventType: string) => {
    switch (eventType) {
      case 'exam': return 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg'
      case 'homework': return 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg'
      case 'project': return 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg'
      case 'lecture': return 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg'
      case 'quiz': return 'bg-gradient-to-br from-orange-500 to-yellow-600 text-white shadow-lg'
      default: return 'bg-gradient-to-br from-gray-500 to-slate-600 text-white shadow-lg'
    }
  }

  const getBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'exam': return 'bg-red-500/20 text-red-200 border-red-400/30'
      case 'homework': return 'bg-blue-500/20 text-blue-200 border-blue-400/30'
      case 'project': return 'bg-green-500/20 text-green-200 border-green-400/30'
      case 'lecture': return 'bg-purple-500/20 text-purple-200 border-purple-400/30'
      case 'quiz': return 'bg-orange-500/20 text-orange-200 border-orange-400/30'
      default: return 'bg-gray-500/20 text-gray-200 border-gray-400/30'
    }
  }

  const getTabIconColor = (eventType: string) => {
    switch (eventType) {
      case 'all': return 'bg-gradient-to-br from-blue-500 to-purple-600'
      case 'exam': return 'bg-gradient-to-br from-red-500 to-pink-600'
      case 'homework': return 'bg-gradient-to-br from-blue-500 to-cyan-600'
      case 'project': return 'bg-gradient-to-br from-green-500 to-emerald-600'
      case 'lecture': return 'bg-gradient-to-br from-purple-500 to-indigo-600'
      case 'quiz': return 'bg-gradient-to-br from-orange-500 to-yellow-600'
      default: return 'bg-gradient-to-br from-gray-500 to-slate-600'
    }
  }

  const filterEventsByType = (eventType: string) => {
    if (eventType === 'all') return events
    return events.filter(event => event.eventType === eventType)
  }

  const getEventTypeCount = (eventType: string) => {
    if (eventType === 'all') return events.length
    return events.filter(event => event.eventType === eventType).length
  }

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    const newSelected = new Set(selectedEvents)
    if (checked) {
      newSelected.add(eventId)
    } else {
      newSelected.delete(eventId)
    }
    setSelectedEvents(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    const currentEvents = filterEventsByType(activeTab)
    const newSelected = new Set(selectedEvents)
    
    currentEvents.forEach(event => {
      if (event.id) {
        if (checked) {
          newSelected.add(event.id)
        } else {
          newSelected.delete(event.id)
        }
      }
    })
    
    setSelectedEvents(newSelected)
  }

  const handleRemoveSelected = () => {
    setSelectedEvents(new Set())
    toast({
      title: "Events removed",
      description: "Selected events have been removed from your list",
    })
  }

  const getSelectedEvents = () => {
    return events.filter(event => event.id && selectedEvents.has(event.id))
  }

  const clearAuthTokens = async () => {
    try {
      document.cookie = 'google_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'google_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      console.log('🧹 Cleared existing auth tokens')
    } catch (error) {
      console.log('Could not clear tokens:', error)
    }
  }

  const handleExportToCalendar = async () => {
    const eventsToExport = getSelectedEvents()
    
    if (eventsToExport.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to add to your calendar",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      console.log('🔍 Checking calendar access...')
      
      const hasAccess = await checkCalendarAccess()
      console.log('📋 Calendar access result:', hasAccess)
      
      if (!hasAccess) {
        console.log('🔑 No calendar access, requesting authentication...')
        await clearAuthTokens()
        
        const result = await requestCalendarAccess()
        
        if ('url' in result) {
          console.log('🔗 Redirecting to Google OAuth:', result.url)
          window.location.href = result.url
          return
        } else {
          console.error('❌ Failed to get auth URL:', result.error)
          throw new Error(result.error)
        }
      }

      console.log('📅 Creating calendar...')
      const calendarResult = await createSecondaryCalendar(
        'My Syllabus Events',
        'SYLLABUS'
      )
      
      console.log('📅 Calendar creation result:', calendarResult)
      
      if (!calendarResult.success || !calendarResult.calendarId) {
        if (calendarResult.error?.includes('access token') || calendarResult.error?.includes('401')) {
          console.log('🔄 Auth error detected, clearing tokens and retrying...')
          await clearAuthTokens()
          
          const result = await requestCalendarAccess()
          if ('url' in result) {
            console.log('🔗 Redirecting to Google OAuth for re-authentication:', result.url)
            window.location.href = result.url
            return
          }
        }
        throw new Error(calendarResult.error || "Failed to create calendar")
      }
      
      console.log('📝 Adding events to calendar...')
      const addResult = await addEventsToCalendar(calendarResult.calendarId, eventsToExport)
      
      console.log('📝 Add events result:', addResult)
      
      if (!addResult.success) {
        throw new Error(addResult.error || "Failed to add events to calendar")
      }
      
      toast({
        title: "Success!",
        description: `Added ${addResult.addedEvents} selected events to your Google Calendar`,
      })
      
    } catch (error) {
      console.error("❌ Calendar export error:", error)
      
      let errorMessage = "Failed to export to calendar"
      
      if (error instanceof Error) {
        if (error.message.includes('access token') || error.message.includes('401')) {
          errorMessage = "Google authentication required. Clearing tokens and please try again."
          await clearAuthTokens()
        } else if (error.message.includes('refresh')) {
          errorMessage = "Authentication expired. Please try again to re-authenticate with Google"
          await clearAuthTokens()
        } else if (error.message.includes('credentials not configured')) {
          errorMessage = "Google OAuth credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env.local file"
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number)
      const localDate = new Date(year, month - 1, day)
      
      return localDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const downloadAsText = () => {
    const eventsToDownload = getSelectedEvents()
    const eventText = eventsToDownload.map(event => 
      `${formatDate(event.date)} - ${event.title} (${event.eventType})\n${event.description || ''}\n`
    ).join('\n')
    
    const blob = new Blob([eventText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'syllabus-events.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSaveToDashboard = async () => {
    const eventsToSave = getSelectedEvents()
    
    if (eventsToSave.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to save to dashboard",
        variant: "destructive",
      })
      return
    }

    setIsSavingToDashboard(true)

    try {
      console.log('💾 Saving events to dashboard...')
      
      const response = await fetch('/api/dashboard/save-syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syllabusName: `Syllabus ${new Date().toLocaleDateString()}`,
          events: eventsToSave,
          courseInfo: {
            courseName: 'Imported Syllabus',
            courseCode: 'IMPORTED'
          }
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle database setup error specifically
        if (result.error && result.error.includes('Database tables not configured')) {
          toast({
            title: "Database Setup Required",
            description: "Please run the database setup script in your Supabase project. Check the database-setup.sql file.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || 'Failed to save to dashboard',
            variant: "destructive",
          })
        }
        return
      }
      
      toast({
        title: "Success! 🎉",
        description: `Saved ${eventsToSave.length} events to your dashboard. View them in the Dashboard tab.`,
      })
      
      console.log('✅ Successfully saved to dashboard:', result)
      
      // Optional: Add a small delay and then redirect to dashboard
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          toast({
            title: "View Dashboard",
            description: "Click the Dashboard tab to see your saved events!",
          })
        }
      }, 2000)
      
    } catch (error) {
      console.error("❌ Dashboard save error:", error)
      
      toast({
        title: "Connection Error",
        description: "Unable to connect to the database. Please check your internet connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingToDashboard(false)
    }
  }

  const eventTypes = ['all', 'lecture', 'homework', 'exam', 'quiz', 'project', 'other']
  const currentEvents = filterEventsByType(activeTab)
  const selectedInCurrentView = currentEvents.filter(event => event.id && selectedEvents.has(event.id)).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-400/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 rounded-full mb-6 shadow-2xl">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Events Successfully Extracted!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We found <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{events.length} events</span> in your syllabus. 
            Review and select the ones you want to add to your calendar.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-white bg-clip-text text-transparent">{events.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{selectedEvents.size}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Selected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">{selectedInCurrentView}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">In Current View</div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleExportToCalendar}
                  disabled={isExporting || selectedEvents.size === 0}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[180px] h-12 flex items-center justify-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isExporting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full flex-shrink-0"
                      />
                    ) : (
                      <Calendar className="h-5 w-5 flex-shrink-0" />
                    )}
                    <span className="text-base font-semibold whitespace-nowrap">
                      {isExporting ? 'Adding...' : 'Add to Calendar'}
                    </span>
                  </div>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSaveToDashboard}
                  disabled={isSavingToDashboard || selectedEvents.size === 0}
                  variant="outline"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[180px] h-12 flex items-center justify-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isSavingToDashboard ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full flex-shrink-0"
                      />
                    ) : (
                      <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                    )}
                    <span className="text-base font-semibold whitespace-nowrap">
                      {isSavingToDashboard ? 'Saving...' : 'Save to Dashboard'}
                    </span>
                  </div>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-2 h-auto shadow-xl">
              <div className="grid grid-cols-7 gap-2 w-full">
                {eventTypes.map((type, index) => (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + (index * 0.1) }}
                    className="w-full"
                  >
                    <TabsTrigger
                      value={type}
                      className="w-full flex flex-col items-center space-y-3 p-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-purple-50 dark:data-[state=active]:from-blue-900/30 dark:data-[state=active]:to-purple-900/30 data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-blue-200 dark:data-[state=active]:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 min-h-[100px]"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${getTabIconColor(type)} shadow-lg`}>
                        <span className="text-white">
                          {type === 'all' ? <Target className="h-5 w-5" /> :
                           type === 'exam' ? <GraduationCap className="h-5 w-5" /> :
                           type === 'homework' ? <FileText className="h-5 w-5" /> :
                           type === 'project' ? <BookOpen className="h-5 w-5" /> :
                           type === 'lecture' ? <Users className="h-5 w-5" /> :
                           type === 'quiz' ? <Clock className="h-5 w-5" /> :
                           <Clock className="h-5 w-5" />}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-center capitalize">
                        {type === 'all' ? 'All Events' : type}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0"
                      >
                        {getEventTypeCount(type)}
                      </Badge>
                    </TabsTrigger>
                  </motion.div>
                ))}
              </div>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {activeTab === 'all' ? 'All Events' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Events`}
                  </span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">({currentEvents.length})</span>
                </CardTitle>
                
                {currentEvents.length > 0 && (
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="select-all"
                        checked={currentEvents.every(event => event.id && selectedEvents.has(event.id))}
                        onCheckedChange={handleSelectAll}
                        className="w-5 h-5 border-2"
                      />
                      <label htmlFor="select-all" className="text-lg font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                        Select All
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadAsText}
                          disabled={selectedEvents.size === 0}
                          className="bg-white/50 dark:bg-gray-800/50 text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 backdrop-blur-sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveSelected}
                          disabled={selectedEvents.size === 0}
                          className="bg-white/50 dark:bg-gray-800/50 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 backdrop-blur-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onReset}
                          className="bg-white/50 dark:bg-gray-800/50 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 backdrop-blur-sm"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Upload New
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {currentEvents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-xl font-medium text-gray-500 dark:text-gray-400">
                    No {activeTab === 'all' ? 'events' : activeTab} found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentEvents.map((event, index) => (
                    <motion.div
                      key={event.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className={`p-6 transition-all duration-300 border-l-4 ${getEventTypeColor(event.eventType)}`}
                    >
                      <div className="flex items-start space-x-4">
                        <Checkbox
                          id={`event-${event.id || index}`}
                          checked={event.id ? selectedEvents.has(event.id) : false}
                          onCheckedChange={(checked) => {
                            if (event.id) {
                              handleSelectEvent(event.id, !!checked)
                            }
                          }}
                          className="mt-1 w-5 h-5 border-2"
                        />
                        
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getEventIconColor(event.eventType)}`}>
                          {getEventIcon(event.eventType)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                              {event.title}
                            </h3>
                            <Badge className={`ml-4 px-3 py-1 text-sm font-semibold border ${getBadgeColor(event.eventType)}`}>
                              {event.eventType}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
                            <Calendar className="h-5 w-5 mr-3" />
                            <span className="font-semibold text-lg">{formatDate(event.date)}</span>
                          </div>
                          
                          {event.description && (
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Success Message */}
        {selectedEvents.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border-green-300/50 dark:border-green-600/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Ready to sync!</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      You have <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedEvents.size} events</span> selected and ready to add to your calendar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
} 