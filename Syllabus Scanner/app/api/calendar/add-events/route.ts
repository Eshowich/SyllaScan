import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { cookies } from "next/headers"
import { ExtractedEvent } from "@/lib/types"
import { refreshAccessToken } from "@/lib/google-auth"

export async function POST(request: NextRequest) {
  try {
    // Get the access token from cookies - using cookies API safely
    const cookieStore = await cookies()
    let accessToken = null
    
    try {
      accessToken = cookieStore.get("google_access_token")?.value
    } catch (cookieError) {
      console.error("Error accessing access token:", cookieError)
    }
    
    if (!accessToken) {
      // Try to refresh the token if we have a refresh token
      let refreshToken = null
      
      try {
        refreshToken = cookieStore.get("google_refresh_token")?.value
      } catch (cookieError) {
        console.error("Error accessing refresh token:", cookieError)
      }
      
      if (!refreshToken) {
        return NextResponse.json({ error: "Not authenticated with Google" }, { status: 401 })
      }
      
      // Refresh the token
      const refreshResult = await refreshAccessToken(refreshToken)
      if (!refreshResult.success) {
        return NextResponse.json({ error: "Failed to refresh access token" }, { status: 401 })
      }
    }
    
    // Get the latest token - safely
    let currentAccessToken = null
    try {
      currentAccessToken = cookieStore.get("google_access_token")?.value
    } catch (cookieError) {
      console.error("Error accessing current access token:", cookieError)
    }
    
    if (!currentAccessToken) {
      return NextResponse.json({ error: "No access token available" }, { status: 401 })
    }
    
    // Parse request body
    const { calendarId, events } = await request.json()
    
    if (!calendarId || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ 
        error: "Calendar ID and at least one event are required" 
      }, { status: 400 })
    }
    
    // Set up Google Calendar client
    const calendar = google.calendar({ version: "v3" })
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: currentAccessToken })
    
    // Add each event to the calendar
    const eventPromises = events.map(async (event: ExtractedEvent) => {
      // Parse the date
      const eventDate = new Date(event.date)
      
      // Calculate end date (if not provided, default to 1 hour after start)
      let endDate
      if (event.endDate) {
        endDate = new Date(event.endDate)
      } else {
        endDate = new Date(eventDate)
        endDate.setHours(endDate.getHours() + 1)
      }
      
      // Determine event color based on type (Google Calendar uses specific color IDs)
      let colorId
      switch (event.eventType) {
        case 'lecture':
          colorId = '1' // Blue
          break
        case 'homework':
          colorId = '2' // Green
          break
        case 'exam':
          colorId = '11' // Red
          break
        case 'project':
          colorId = '6' // Orange
          break
        case 'officeHours':
          colorId = '4' // Purple
          break
        default:
          colorId = '8' // Gray
      }
      
      try {
        // Create the event
        const calendarEvent = await calendar.events.insert({
          auth: oauth2Client,
          calendarId: calendarId,
          requestBody: {
            summary: event.title,
            description: event.description || `Added by SyllaScan`,
            location: event.location,
            start: {
              dateTime: eventDate.toISOString(),
              timeZone: 'America/New_York', // Can be made configurable
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: 'America/New_York', // Can be made configurable
            },
            colorId: colorId,
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 60 }, // 1 hour before
              ],
            },
          },
        })
        
        return { success: true, eventId: calendarEvent.data.id }
      } catch (eventError) {
        console.error("Error adding event:", eventError)
        return { success: false, error: eventError instanceof Error ? eventError.message : "Unknown error" }
      }
    })
    
    // Wait for all event additions to complete
    const results = await Promise.all(eventPromises)
    const successfulEvents = results.filter(result => result.success)
    const failedEvents = results.filter(result => !result.success)
    
    return NextResponse.json({
      success: true,
      addedEvents: successfulEvents.length,
      failedEvents: failedEvents.length,
      details: {
        successful: successfulEvents,
        failed: failedEvents
      }
    })
  } catch (error) {
    console.error("Error adding events to calendar:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to add events to calendar"
    }, { status: 500 })
  }
} 