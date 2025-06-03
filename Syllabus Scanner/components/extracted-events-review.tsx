"use client"

import { useState } from "react"
import { Calendar, Check, CheckCircle2, Circle, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate } from "@/lib/utils"
import { ExtractedEvent } from "@/lib/types"

interface ExtractedEventsReviewProps {
  events: ExtractedEvent[]
  courseInfo: {
    courseCode?: string
    courseName?: string
    instructorName?: string
  }
  onApprove: (approvedEventIds: string[]) => void
  isProcessing: boolean
  hasCalendarAccess: boolean
  onRequestAccess: () => void
}

export function ExtractedEventsReview({
  events,
  courseInfo,
  onApprove,
  isProcessing,
  hasCalendarAccess,
  onRequestAccess
}: ExtractedEventsReviewProps) {
  const [selectedEvents, setSelectedEvents] = useState<Record<string, boolean>>({})
  const [selectAll, setSelectAll] = useState<boolean>(true)

  // Initialize all events as selected
  useState(() => {
    const initialSelection: Record<string, boolean> = {}
    events.forEach(event => {
      if (event.id) {
        initialSelection[event.id] = true
      }
    })
    setSelectedEvents(initialSelection)
  })

  const handleToggle = (eventId: string) => {
    setSelectedEvents((prev) => {
      const newState = { ...prev, [eventId]: !prev[eventId] }
      
      // Check if all events are now selected
      const allSelected = events.every(event => event.id && newState[event.id])
      setSelectAll(allSelected)
      
      return newState
    })
  }

  const handleToggleAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    
    const newSelection: Record<string, boolean> = {}
    events.forEach(event => {
      if (event.id) {
        newSelection[event.id] = newSelectAll
      }
    })
    setSelectedEvents(newSelection)
  }

  const handleApprove = () => {
    const approvedEventIds = Object.entries(selectedEvents)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id)
      
    onApprove(approvedEventIds)
  }

  // Get event type badge
  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case 'lecture':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Lecture</Badge>
      case 'homework':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Homework</Badge>
      case 'exam':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Exam</Badge>
      case 'project':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Project</Badge>
      case 'officeHours':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Office Hours</Badge>
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  // Format the confidence score as a percentage
  const formatConfidence = (score?: number) => {
    if (!score) return null
    return `${Math.round(score * 100)}%`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Review Extracted Events
          {courseInfo.courseCode && ` - ${courseInfo.courseCode}`}
        </CardTitle>
        <CardDescription>
          {courseInfo.courseName
            ? `Events extracted from "${courseInfo.courseName}" syllabus`
            : "Select the events you want to add to your calendar"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p>No events were extracted from this document.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 pb-2 border-b mb-4">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleToggleAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select all events ({events.length})
              </label>
            </div>
            
            <ScrollArea className="h-[360px] pr-4">
              <div className="space-y-3">
                {events.map((event) => (
                  <div 
                    key={event.id || event.title} 
                    className="flex items-start p-3 rounded-md border hover:bg-secondary/30 transition-colors"
                  >
                    <Checkbox
                      id={`event-${event.id}`}
                      checked={event.id ? selectedEvents[event.id] : false}
                      onCheckedChange={() => event.id && handleToggle(event.id)}
                      className="mt-1"
                    />
                    <div className="ml-3 space-y-1 flex-1">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{event.title}</div>
                        {getEventTypeBadge(event.eventType)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(event.date)}
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                      
                      {event.confidence && (
                        <div className="text-xs text-muted-foreground flex items-center">
                          <span>Confidence: {formatConfidence(event.confidence)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="pt-4 border-t flex flex-col sm:flex-row justify-between gap-2">
              {hasCalendarAccess ? (
                <Button onClick={handleApprove} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Add Selected Events to Calendar
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={onRequestAccess} disabled={isProcessing}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 