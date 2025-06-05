"use client"

import { useState } from "react"
import { FileUp, Loader2, X, Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase, testSupabaseConnection, ensureAuthenticated, ensureSyllabiBucket } from "@/lib/supabase"
import { DatePreferences } from "./date-preferences"
import { processDocument } from "@/lib/ai-service"
import { ExtractedEventsReview } from "./extracted-events-review"
import { ExtractedEvent } from "@/lib/types"
import { createSecondaryCalendar, addEventsToCalendar, checkCalendarAccess, requestCalendarAccess } from "@/lib/calendar-service"
import { documentProcessor } from "@/lib/document-processor"

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
      // First check authentication status and ensure we have a valid session
      console.log("Starting authentication check...");
      const authStatus = await ensureAuthenticated()
      
      if (!authStatus.authenticated) {
        console.error("Authentication check failed:", authStatus.error)
        throw new Error("Your session has expired. Please sign in again.")
      }
      
      // Get the current session to ensure we have access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session || !session.access_token) {
        console.error("Session error:", sessionError || "No valid session or access token")
        throw new Error("Authentication error. Please sign out and sign in again.")
      }
      
      console.log("Authentication check passed with valid access token");
      setProgress(20)

      // Prepare file for upload
      const file = files[0];
      if (!file) {
        throw new Error('No file selected for upload');
      }
      
      console.log(`Preparing to upload file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`.toLowerCase();
      const filePath = `user_${user.id}/${fileName}`;
      
      console.log(`Generated file path: ${filePath}`);
      setProgress(30);
      
      // Upload the file to Supabase storage with explicit headers
      console.log(`Uploading file to Supabase storage...`);
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('syllabi')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (storageError) {
        console.error("Storage error details:", storageError)
        console.error("Storage error JSON:", JSON.stringify(storageError, null, 2))
        console.error("Storage error message:", storageError?.message)
        console.error("Storage error type:", typeof storageError)
        
        // Check if it's an auth error and provide helpful message
        if (storageError.message?.includes('authorization') || storageError.message?.includes('401')) {
          throw new Error("Authentication error. Please sign out and sign in again, then try uploading.")
        }
        
        throw new Error(`Upload failed: ${storageError.message || 'Unknown storage error'}`)
      }

      if (!storageData) {
        throw new Error("No data returned from storage upload")
      }

      console.log("Upload successful:", storageData)
      setProgress(50)

      // Store syllabus metadata in database
      const syllabusData = {
        file_name: file.name,
        file_path: filePath,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        course_code: file.name.match(/[A-Z]+\d+/)?.[0] || null,
        course_name: file.name.replace(/\.[^/.]+$/, "").replace(/[A-Z]+\d+/, "").trim() || null,
        instructor_name: "Dr. Sample Professor",
        status: 'processing'
      };

      console.log("Storing syllabus data:", syllabusData);
      const { data: syllabusRecord, error: dbError } = await supabase
        .from('syllabi')
        .insert([{
          user_id: user.id,
          ...syllabusData
        }])
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("Syllabus record created:", syllabusRecord);
      setSyllabusId(syllabusRecord.id);
      setProgress(50)
      
      // Process document with AI to extract real events
      console.log("🤖 Starting AI document processing...");
      setProgress(60)
      
      try {
        const { text, events } = await documentProcessor.processDocument(file);
        
        console.log(`📄 Extracted ${text.length} characters of text`);
        console.log(`🎯 Found ${events.length} events`);
        
        setProgress(80)
        
        // Store real extracted events in database
        if (events.length > 0) {
          const eventsToInsert = events.map(event => ({
            syllabus_id: syllabusRecord.id,
            title: event.title,
            description: event.description,
            event_date: event.date,
            event_type: event.eventType,
            confidence: event.confidence
          }));

          const { error: eventsError } = await supabase
            .from('events')
            .insert(eventsToInsert);

          if (eventsError) {
            console.error("Error storing events:", eventsError);
            // Don't fail the whole process for events error
          } else {
            console.log("✅ Real events stored successfully");
          }
        }
        
        // Update syllabus status to processed
        await supabase
          .from('syllabi')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', syllabusRecord.id);
          
        setExtractedEvents(events)
        setCourseInfo({
          courseName: syllabusData.course_name || syllabusData.title,
          courseCode: syllabusData.course_code || undefined,
          instructorName: syllabusData.instructor_name
        })
        
        setProgress(100)
        
      } catch (aiError) {
        console.error("AI processing failed, using fallback:", aiError);
        
        // Fallback to basic sample events if AI fails completely
        const fallbackEvents: ExtractedEvent[] = [
          {
            id: `fallback-${Date.now()}-1`,
            title: "Review Uploaded Syllabus",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Please review the uploaded syllabus and manually add important dates",
            eventType: 'other',
            confidence: 0.5
          }
        ];
        
        setExtractedEvents(fallbackEvents);
        setCourseInfo({
          courseName: syllabusData.course_name || syllabusData.title,
          courseCode: syllabusData.course_code || undefined,
          instructorName: syllabusData.instructor_name
        })
        
        setProgress(100)
      }
      
      // Move to the review step
      setStep("review")
      
      // Reset progress after a short delay
      setTimeout(() => {
        setProgress(0)
      }, 1000)

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