"use client"

import { useState } from "react"
import { FileUp, Loader2, X, Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase, testSupabaseConnection, ensureBucketExists, ensureAuthenticated } from "@/lib/supabase"
import { DatePreferences } from "./date-preferences"
import { processDocument } from "@/lib/ai-service"
import { ExtractedEventsReview } from "./extracted-events-review"
import { ExtractedEvent } from "@/lib/types"
import { createSecondaryCalendar, addEventsToCalendar, checkCalendarAccess, requestCalendarAccess } from "@/lib/calendar-service"

export function SyllabusUploader() {
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [step, setStep] = useState<"upload" | "preferences" | "processing" | "review" | "success">("upload")
  const [datePreferences, setDatePreferences] = useState<{
    lectures: boolean
    homework: boolean
    exams: boolean
    projects: boolean
    officeHours: boolean
  }>({
    lectures: true,
    homework: true,
    exams: true,
    projects: true,
    officeHours: false,
  })
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([])
  const [courseInfo, setCourseInfo] = useState<{
    courseCode?: string
    courseName?: string
    instructorName?: string
  }>({})
  const [syllabusId, setSyllabusId] = useState<string>("")
  const [calendarId, setCalendarId] = useState<string>("")
  const [hasCalendarAccess, setHasCalendarAccess] = useState<boolean>(false)
  
  const { user } = useAuth()
  const { toast } = useToast()

  // Check if we have calendar access
  const checkGCalAccess = async () => {
    const hasAccess = await checkCalendarAccess()
    setHasCalendarAccess(hasAccess)
    return hasAccess
  }

  // Request calendar access
  const handleRequestAccess = async () => {
    const result = await requestCalendarAccess()
    
    if ('url' in result) {
      // Redirect to Google auth page
      window.location.href = result.url
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileArray = Array.from(event.target.files)
      setFiles((prev) => [...prev, ...fileArray])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePreferenceSave = (preferences: any) => {
    setDatePreferences(preferences)
    setStep("upload") // Return to the upload step
  }

  const uploadFiles = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload files",
        variant: "destructive",
      })
      return
    }

    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setProgress(0)
    setStep("processing")

    try {
      // First check authentication status
      const authStatus = await ensureAuthenticated()
      if (!authStatus.authenticated) {
        console.error("Authentication check failed:", authStatus.error)
        throw new Error("Your session has expired. Please sign in again.")
      }
      
      if (authStatus.refreshed) {
        console.log("Authentication token was refreshed automatically")
      }
      
      // Now test Supabase connection
      const connectionTest = await testSupabaseConnection()
      console.log("Connection test result:", connectionTest)
      
      if (!connectionTest.success) {
        throw new Error(`Supabase connection failed: ${connectionTest.message || 'Unknown error'}`)
      }

      // Check for calendar access
      const hasAccess = await checkGCalAccess()
      if (!hasAccess) {
        // We'll continue with the upload but note that we need to request access later
      }

      // Ensure the bucket exists before uploading
      const bucketResult = await ensureBucketExists('syllabi')
      console.log("Bucket check result:", bucketResult)
      
      if (!bucketResult.success) {
        // Only throw an error if this isn't a temporary issue or we have details
        if (bucketResult.error) {
          throw new Error(`Failed to access storage: ${bucketResult.message || 'Unknown error'}`)
        }
      }

      // Upload file to Supabase Storage
      const file = files[0] // For simplicity, process one file at a time
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      
      // Simplify the file path to just use the file name directly in the root of the bucket
      // This avoids permissions issues with nested folders
      const filePath = fileName

      setProgress(20) // Update progress

      // Try to upload directly without bucket creation check
      try {
        console.log("Starting file upload for:", filePath)
        
        // First make absolutely sure we're authenticated
        const authCheck = await ensureAuthenticated()
        if (!authCheck.authenticated) {
          console.error("Authentication required for upload. Auth status:", authCheck)
          throw new Error("You need to be logged in to upload files. Please sign in again.")
        }
        
        console.log(`Auth check passed, user authenticated with session ID: ${authCheck.session?.id.slice(0, 8)}...`)
        
        // Upload with detailed logging
        console.log(`Uploading file to path: syllabi/${filePath}`)
        
        // Try to use a simpler upload approach that's less error-prone
        const { data: storageData, error: storageError } = await supabase.storage
          .from('syllabi')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          })

        // Log the complete error for debugging
        if (storageError) {
          console.error("Storage error details:", storageError)
          console.error("Storage error JSON:", JSON.stringify(storageError, null, 2))
          
          // Check auth-related errors specifically
          if (storageError.statusCode === 401) {
            console.error("Authentication error for storage. Current auth session:")
            const { data } = await supabase.auth.getSession()
            console.error("Session exists:", !!data?.session)
            console.error("Session expires at:", data?.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'N/A')
            
            // Try one more refresh
            console.log("Trying to refresh session...")
            const refreshResult = await supabase.auth.refreshSession()
            console.log("Refresh result:", refreshResult.error ? 'Failed' : 'Success')
            
            throw new Error("Authentication error: Your session may have expired. Please try signing out and in again.")
          }
          
          // Provide user-friendly error messages
          if (storageError.message?.includes("storage/permission_denied")) {
            throw new Error("You don't have permission to upload files. Make sure the storage bucket has proper RLS policies.")
          } else if (storageError.message?.includes("not_found") || storageError.statusCode === 404) {
            throw new Error("Storage bucket not found. Please create the 'syllabi' bucket in your Supabase project.")
          } else if (storageError.statusCode === 403 || storageError.message?.includes("forbidden")) {
            throw new Error("Access denied. Make sure you're signed in and have proper access to the bucket.")
          } else {
            throw new Error(`Upload failed: ${storageError.message || 'Unknown storage error'}`)
          }
        }

        if (!storageData) {
          throw new Error("No data returned from storage upload")
        }

        console.log("Upload successful:", storageData)
        setProgress(40) // Update progress

        // Mock AI processing since we can't access the API
        // In a production app, this would call the AI service
        setProgress(60)
        
        // For demo purposes, create sample events
        const sampleEvents = [
          {
            id: `event-${Date.now()}-1`,
            title: "Midterm Exam",
            date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Midterm examination",
            eventType: 'exam',
            confidence: 0.9
          },
          {
            id: `event-${Date.now()}-2`,
            title: "Assignment Due",
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Assignment 1 submission deadline",
            eventType: 'homework',
            confidence: 0.8
          },
          {
            id: `event-${Date.now()}-3`,
            title: "Lecture: Introduction",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Introduction to key concepts",
            eventType: 'lecture',
            confidence: 0.95
          }
        ]
        
        setProgress(80)
        
        // Store the filtered events and course info
        const courseNameFromFile = file.name.replace(/\.[^/.]+$/, "")
        setExtractedEvents(sampleEvents)
        setCourseInfo({
          courseName: courseNameFromFile,
          courseCode: courseNameFromFile.match(/[A-Z]+\d+/)?.[0] || undefined
        })
        
        // Move to the review step
        setStep("review")

        // Reset progress after processing
        setProgress(100)
        setTimeout(() => {
          setProgress(0)
        }, 1000)
      } catch (error) {
        console.error("Error uploading file:", error)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "There was a problem uploading your file",
          variant: "destructive",
        })
        setStep("upload")
      }
    } catch (error) {
      console.error("Error in upload process:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was a problem with the upload process",
        variant: "destructive",
      })
      setStep("upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleApproveEvents = async (approvedEventIds: string[]) => {
    if (!courseInfo.courseName) {
      toast({
        title: "Error",
        description: "Course name is required to create a calendar",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      
      // Check if we need to request calendar access
      if (!hasCalendarAccess) {
        await handleRequestAccess()
        return // The page will redirect and return when access is granted
      }
      
      // Create a new calendar for this syllabus
      const calendarResult = await createSecondaryCalendar(
        courseInfo.courseName,
        courseInfo.courseCode
      )
      
      if (!calendarResult.success || !calendarResult.calendarId) {
        throw new Error(calendarResult.error || "Failed to create calendar")
      }
      
      setCalendarId(calendarResult.calendarId)
      
      // Filter the approved events
      const eventsToAdd = extractedEvents.filter(event => 
        approvedEventIds.includes(event.id || "")
      )
      
      // Add events to the calendar
      const addResult = await addEventsToCalendar(calendarResult.calendarId, eventsToAdd)
      
      if (!addResult.success) {
        throw new Error(addResult.error || "Failed to add events to calendar")
      }
      
      toast({
        title: "Success!",
        description: `Added ${addResult.addedEvents} events to your Google Calendar`,
      })
      
      // Move to success step
      setStep("success")
      
    } catch (error) {
      console.error("Error adding events to calendar:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add events to calendar",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetUploader = () => {
    setFiles([])
    setExtractedEvents([])
    setCourseInfo({})
    setSyllabusId("")
    setCalendarId("")
    setStep("upload")
  }

  // Show different content based on the current step
  const renderStepContent = () => {
    switch (step) {
      case "preferences":
        return (
          <DatePreferences 
            onSave={handlePreferenceSave} 
            defaultPreferences={datePreferences} 
          />
        )
      
      case "processing":
        return (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-center text-lg font-medium">Processing your syllabus</p>
            <p className="text-center text-muted-foreground">
              Our AI is scanning your document to extract dates and events
            </p>
            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )
      
      case "review":
        return (
          <ExtractedEventsReview
            events={extractedEvents}
            courseInfo={courseInfo}
            onApprove={handleApproveEvents}
            isProcessing={isUploading}
            hasCalendarAccess={hasCalendarAccess}
            onRequestAccess={handleRequestAccess}
          />
        )
      
      case "success":
        return (
          <div className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-medium">Success!</h3>
              <p className="text-muted-foreground mt-2">
                Your events have been added to a new Google Calendar.
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={resetUploader}>
                Upload Another Syllabus
              </Button>
              <Button onClick={() => window.open("https://calendar.google.com", "_blank")}>
                <Calendar className="mr-2 h-4 w-4" />
                View in Google Calendar
              </Button>
            </div>
          </div>
        )
      
      case "upload":
      default:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <label 
                    htmlFor="file-upload" 
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center py-6">
                      <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-lg font-medium mb-1">Drag & drop or click to upload</p>
                      <p className="text-sm text-muted-foreground">
                        Support for PDF, DOCX, and TXT files
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                  </label>
                </CardContent>
              </Card>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Files:</p>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary/50 p-2 rounded-md">
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("preferences")}
                  disabled={isUploading}
                  className="sm:flex-1"
                >
                  Date Preferences
                </Button>
                
                <Button
                  className="sm:flex-1"
                  onClick={uploadFiles}
                  disabled={files.length === 0 || isUploading}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload and Process {files.length > 0 ? `(${files.length})` : ''}
                </Button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {renderStepContent()}
    </div>
  )
} 