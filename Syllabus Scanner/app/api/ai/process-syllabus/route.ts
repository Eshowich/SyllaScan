import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ExtractedEvent, AIProcessingResponse } from "@/lib/types"

// Initialize Supabase client for server-side operations with better error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Log initialization to help debug issues
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('API Route: Missing Supabase environment variables:', { 
    hasUrl: !!supabaseUrl, 
    hasServiceKey: !!supabaseServiceKey 
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

// Sample event types and their associated keywords for detection
const eventTypeKeywords = {
  lecture: ["lecture", "class", "session", "meeting"],
  homework: ["homework", "assignment", "problem set", "quiz", "submission"],
  exam: ["exam", "test", "midterm", "final", "assessment"],
  project: ["project", "presentation", "report", "paper"],
  officeHours: ["office hours", "consultation", "help session"]
}

export async function POST(request: NextRequest) {
  try {
    const { userId, fileUrl, fileName } = await request.json()

    if (!userId || !fileUrl || !fileName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required parameters" 
      }, { status: 400 })
    }

    // TODO: In a production environment, you would:
    // 1. Download the file from the signed URL
    // 2. Use a document processing API (like OpenAI, Google Cloud Document AI, etc.)
    // 3. Process the text to extract dates and events

    // For now, we'll simulate AI extraction with mock data
    const extractedEvents: ExtractedEvent[] = simulateAIExtraction(fileName)
    
    // Extract course information from filename
    const courseInfo = extractCourseInfo(fileName)

    // Store extracted events in database
    await storeExtractedEvents(userId, fileName, extractedEvents, courseInfo)

    return NextResponse.json({
      success: true,
      extractedEvents,
      courseInfo
    })
  } catch (error) {
    console.error("Error processing syllabus:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process syllabus" 
    }, { status: 500 })
  }
}

// Function to simulate AI extraction (to be replaced with actual AI processing)
function simulateAIExtraction(fileName: string): ExtractedEvent[] {
  // Generate some plausible events based on the filename
  const currentDate = new Date()
  const semesterStart = new Date(currentDate)
  
  // Create a rough semester timeline (3-4 months)
  const events: ExtractedEvent[] = []
  
  // Add some lectures (weekly for 12 weeks)
  for (let week = 0; week < 12; week++) {
    const lectureDate = new Date(semesterStart)
    lectureDate.setDate(lectureDate.getDate() + (week * 7) + 1) // Monday lectures
    
    events.push({
      title: `Lecture ${week + 1}`,
      date: lectureDate.toISOString(),
      description: `Weekly lecture for week ${week + 1}`,
      eventType: 'lecture',
      confidence: 0.85 + (Math.random() * 0.1),
      approved: false
    })
  }
  
  // Add some assignments (every 2 weeks)
  for (let i = 0; i < 6; i++) {
    const assignmentDate = new Date(semesterStart)
    assignmentDate.setDate(assignmentDate.getDate() + (i * 14) + 10) // Due on Thursdays
    
    events.push({
      title: `Assignment ${i + 1}`,
      date: assignmentDate.toISOString(),
      description: `Homework assignment ${i + 1} due`,
      eventType: 'homework',
      confidence: 0.8 + (Math.random() * 0.15),
      approved: false
    })
  }
  
  // Add midterm and final exam
  const midtermDate = new Date(semesterStart)
  midtermDate.setDate(midtermDate.getDate() + 42) // Around week 6
  
  events.push({
    title: "Midterm Exam",
    date: midtermDate.toISOString(),
    description: "Midterm examination covering weeks 1-6",
    eventType: 'exam',
    confidence: 0.9,
    approved: false
  })
  
  const finalDate = new Date(semesterStart)
  finalDate.setDate(finalDate.getDate() + 84) // Around week 12
  
  events.push({
    title: "Final Exam",
    date: finalDate.toISOString(),
    description: "Final examination covering all course material",
    eventType: 'exam',
    confidence: 0.95,
    approved: false
  })
  
  // Add a project
  const projectDate = new Date(semesterStart)
  projectDate.setDate(projectDate.getDate() + 70) // Around week 10
  
  events.push({
    title: "Final Project Due",
    date: projectDate.toISOString(),
    description: "Final project submission deadline",
    eventType: 'project',
    confidence: 0.88,
    approved: false
  })
  
  return events
}

// Extract course information from filename
function extractCourseInfo(fileName: string) {
  // Try to extract a course code (e.g. CS101, MATH200, etc.)
  const courseCodeMatch = fileName.match(/([A-Z]{2,4})\s*[_\-\s]?(\d{2,4})/i)
  const courseCode = courseCodeMatch ? courseCodeMatch[0] : undefined
  
  // Default course name based on the file name
  let courseName = fileName.replace(/\.[^/.]+$/, "") // Remove extension
  
  // If we found a course code, try to create a better course name
  if (courseCode) {
    // Remove the course code from the filename to get a potential course name
    courseName = fileName
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(courseCode, "") // Remove the course code
      .replace(/[_\-]/g, " ") // Replace underscores and hyphens with spaces
      .trim()
      
    // If the course name is empty after removing the course code, use a generic name
    if (!courseName) {
      courseName = "Course Syllabus"
    }
  }
  
  return {
    courseCode,
    courseName,
    instructorName: undefined // Not enough information to extract instructor name
  }
}

// Store extracted events in Supabase
async function storeExtractedEvents(
  userId: string,
  fileName: string,
  events: ExtractedEvent[],
  courseInfo: any
) {
  try {
    // First, create an entry in the syllabi table
    const { data: syllabusData, error: syllabusError } = await supabase
      .from("syllabi")
      .insert([{
        user_id: userId,
        file_name: fileName,
        course_code: courseInfo.courseCode,
        course_name: courseInfo.courseName,
        instructor_name: courseInfo.instructorName,
        created_at: new Date()
      }])
      .select()
    
    if (syllabusError) throw syllabusError
    
    const syllabusId = syllabusData[0].id
    
    // Then, insert all events with reference to the syllabus
    const eventInserts = events.map(event => ({
      syllabus_id: syllabusId,
      title: event.title,
      date: event.date,
      end_date: event.endDate,
      description: event.description,
      location: event.location,
      event_type: event.eventType,
      confidence: event.confidence,
      approved: false // Default to not approved
    }))
    
    if (eventInserts.length > 0) {
      const { error: eventsError } = await supabase
        .from("syllabus_events")
        .insert(eventInserts)
      
      if (eventsError) throw eventsError
    }
    
    return syllabusId
  } catch (error) {
    console.error("Error storing extracted events:", error)
    throw error
  }
} 