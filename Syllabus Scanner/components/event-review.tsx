"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Check, Clock, FileText, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarSelector } from "@/components/calendar-selector"
import { cn } from "@/lib/utils"

interface EventReviewProps {
  events: any[]
  onComplete: (approvedEvents: any[], calendarId: string) => void
  onCancel: () => void
}

export function EventReview({ events, onComplete, onCancel }: EventReviewProps) {
  const [approvedEvents, setApprovedEvents] = useState<string[]>(events.map((event) => event.id))
  const [rejectedEvents, setRejectedEvents] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewMode, setReviewMode] = useState<"individual" | "batch">("individual")
  const [selectedCalendarId, setSelectedCalendarId] = useState("primary")
  const [isReviewComplete, setIsReviewComplete] = useState(false)

  // Get current event for individual review
  const currentEvent = events[currentIndex]

  // Handle approving an event
  const handleApprove = (eventId: string) => {
    setApprovedEvents((prev) => [...prev.filter((id) => id !== eventId), eventId])
    setRejectedEvents((prev) => prev.filter((id) => id !== eventId))

    if (reviewMode === "individual" && currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }

    if (reviewMode === "individual" && currentIndex === events.length - 1) {
      setIsReviewComplete(true)
    }
  }

  // Handle rejecting an event
  const handleReject = (eventId: string) => {
    setRejectedEvents((prev) => [...prev.filter((id) => id !== eventId), eventId])
    setApprovedEvents((prev) => prev.filter((id) => id !== eventId))

    if (reviewMode === "individual" && currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }

    if (reviewMode === "individual" && currentIndex === events.length - 1) {
      setIsReviewComplete(true)
    }
  }

  // Handle toggling an event's approval status
  const handleToggle = (eventId: string) => {
    if (approvedEvents.includes(eventId)) {
      handleReject(eventId)
    } else {
      handleApprove(eventId)
    }
  }

  // Handle completing the review
  const handleComplete = () => {
    const finalApprovedEvents = events.filter((event) => approvedEvents.includes(event.id))
    onComplete(finalApprovedEvents, selectedCalendarId)
  }

  // Get event status
  const getEventStatus = (eventId: string) => {
    if (approvedEvents.includes(eventId)) return "approved"
    if (rejectedEvents.includes(eventId)) return "rejected"
    return "pending"
  }

  // Render the individual review mode
  const renderIndividualReview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {currentIndex + 1}/{events.length}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {approvedEvents.length} approved, {rejectedEvents.length} rejected
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setReviewMode("batch")}>
          View All
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentEvent.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{currentEvent.title}</CardTitle>
                  <CardDescription>{currentEvent.course}</CardDescription>
                </div>
                <Badge>{currentEvent.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(currentEvent.date).toLocaleDateString()}</span>
                {currentEvent.time && (
                  <>
                    <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                    <span>{currentEvent.time}</span>
                  </>
                )}
              </div>
              {currentEvent.description && <p className="text-sm">{currentEvent.description}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="w-1/2 mr-2" onClick={() => handleReject(currentEvent.id)}>
                <ThumbsDown className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button className="w-1/2 ml-2" onClick={() => handleApprove(currentEvent.id)}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>

      {isReviewComplete && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Complete</CardTitle>
              <CardDescription>
                You've reviewed all {events.length} events. {approvedEvents.length} approved, {rejectedEvents.length}{" "}
                rejected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label htmlFor="calendar-selector" className="text-sm font-medium">
                  Select Calendar
                </label>
                <CalendarSelector selectedCalendarId={selectedCalendarId} onSelect={setSelectedCalendarId} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleComplete} disabled={approvedEvents.length === 0}>
                Add {approvedEvents.length} Events to Calendar
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  )

  // Render the batch review mode
  const renderBatchReview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Batch Review</span>
          <Badge variant="outline">
            {approvedEvents.length} approved, {rejectedEvents.length} rejected
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setReviewMode("individual")}>
          Review One by One
        </Button>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const status = getEventStatus(event.id)
          return (
            <div
              key={event.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-md border",
                status === "approved" && "border-green-500 bg-green-50 dark:bg-green-950/20",
                status === "rejected" && "border-red-500 bg-red-50 dark:bg-red-950/20",
              )}
            >
              <div className="flex items-center gap-3">
                {status === "approved" ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : status === "rejected" ? (
                  <X className="h-5 w-5 text-red-500" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">{event.title}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>{event.course}</span>
                    <span className="mx-1">•</span>
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    {event.time && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{event.time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event.type}</Badge>
                <Button
                  variant={status === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleReject(event.id)}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button
                  variant={status === "approved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApprove(event.id)}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Calendar</CardTitle>
          <CardDescription>Choose which Google Calendar to add these events to</CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarSelector selectedCalendarId={selectedCalendarId} onSelect={setSelectedCalendarId} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={approvedEvents.length === 0}>
            Add {approvedEvents.length} Events to Calendar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Review Events</h2>
        <p className="text-muted-foreground">Review and approve events before adding them to your Google Calendar.</p>
      </div>

      <Separator />

      {reviewMode === "individual" ? renderIndividualReview() : renderBatchReview()}
    </div>
  )
}
