"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Edit, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { EventReview } from "@/components/event-review"

interface ExtractedDate {
  id: string
  title: string
  date: string
  course: string
  type: string
}

interface ExtractedDatesProps {
  dates: ExtractedDate[]
}

export function ExtractedDates({ dates }: ExtractedDatesProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [editedValues, setEditedValues] = useState<Partial<ExtractedDate>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSelectAll = () => {
    if (selectedDates.length === dates.length) {
      setSelectedDates([])
    } else {
      setSelectedDates(dates.map((date) => date.id))
    }
  }

  const handleSelect = (id: string) => {
    if (selectedDates.includes(id)) {
      setSelectedDates(selectedDates.filter((dateId) => dateId !== id))
    } else {
      setSelectedDates([...selectedDates, id])
    }
  }

  const handleEdit = (date: ExtractedDate) => {
    setEditingId(date.id)
    setEditedValues(date)
  }

  const handleSaveEdit = () => {
    // In a real app, this would update the date in the database
    setEditingId(null)
    setEditedValues({})
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditedValues({})
  }

  const handleInputChange = (field: keyof ExtractedDate, value: string) => {
    setEditedValues({
      ...editedValues,
      [field]: value,
    })
  }

  const handleStartReview = () => {
    if (selectedDates.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to review.",
        variant: "destructive",
      })
      return
    }
    setIsReviewing(true)
  }

  const handleCancelReview = () => {
    setIsReviewing(false)
  }

  const handleCompleteReview = async (approvedEvents: any[], calendarId: string) => {
    if (approvedEvents.length === 0) {
      toast({
        title: "No events approved",
        description: "You didn't approve any events to add to your calendar.",
      })
      setIsReviewing(false)
      return
    }

    setIsLoading(true)
    setNeedsAuth(false)

    try {
      // Call the API to sync events to Google Calendar
      const response = await fetch("/api/google-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: approvedEvents,
          calendarId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.needsAuth) {
          setNeedsAuth(true)
          toast({
            title: "Authentication Required",
            description: "Please connect your Google Calendar account to sync events.",
            variant: "destructive",
          })
        } else if (data.partialSuccess) {
          toast({
            title: "Partial Success",
            description: `Added ${data.added} events, but ${data.failed} failed.`,
            variant: "default",
          })

          if (data.added > 0) {
            // Redirect to calendar page after partial success
            setTimeout(() => router.push("/calendar"), 2000)
          }
        } else {
          throw new Error(data.error || "Failed to sync events to Google Calendar")
        }
      } else {
        toast({
          title: "Events Added",
          description: `Successfully added ${data.events.length} events to your Google Calendar.`,
        })

        // Redirect to calendar page after successful sync
        setTimeout(() => router.push("/calendar"), 2000)
      }
    } catch (error) {
      console.error("Error syncing events:", error)
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync events to Google Calendar.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsReviewing(false)
    }
  }

  // If we're in review mode, show the review component
  if (isReviewing) {
    const eventsToReview = dates.filter((date) => selectedDates.includes(date.id))
    return <EventReview events={eventsToReview} onComplete={handleCompleteReview} onCancel={handleCancelReview} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selectedDates.length === dates.length && dates.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All
          </label>
        </div>
        <div className="flex items-center gap-2">
          {needsAuth ? (
            <GoogleAuthButton state="/upload" />
          ) : (
            <Button
              variant="default"
              size="sm"
              disabled={selectedDates.length === 0 || isLoading}
              onClick={handleStartReview}
            >
              {isLoading ? "Processing..." : "Review & Add Selected"}
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={selectedDates.length === 0}>
            <Trash className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dates.map((date) => (
              <TableRow key={date.id}>
                <TableCell>
                  <Checkbox checked={selectedDates.includes(date.id)} onCheckedChange={() => handleSelect(date.id)} />
                </TableCell>
                <TableCell>
                  {editingId === date.id ? (
                    <Input
                      value={editedValues.title || ""}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    date.title
                  )}
                </TableCell>
                <TableCell>
                  {editingId === date.id ? (
                    <Input
                      type="date"
                      value={editedValues.date || ""}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    new Date(date.date).toLocaleDateString()
                  )}
                </TableCell>
                <TableCell>
                  {editingId === date.id ? (
                    <Input
                      value={editedValues.course || ""}
                      onChange={(e) => handleInputChange("course", e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    date.course
                  )}
                </TableCell>
                <TableCell>
                  {editingId === date.id ? (
                    <Select value={editedValues.type || ""} onValueChange={(value) => handleInputChange("type", value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Assignment">Assignment</SelectItem>
                        <SelectItem value="Exam">Exam</SelectItem>
                        <SelectItem value="Quiz">Quiz</SelectItem>
                        <SelectItem value="Project">Project</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{date.type}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === date.id ? (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(date)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
