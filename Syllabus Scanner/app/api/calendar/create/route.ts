import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { cookies } from "next/headers"
import { refreshAccessToken } from "@/lib/google-auth"

export async function POST(request: NextRequest) {
  try {
    // Get the access token from cookies - using cookies API safely
    const cookieStore = cookies()
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
    const { summary, description } = await request.json()
    
    if (!summary) {
      return NextResponse.json({ error: "Calendar summary (name) is required" }, { status: 400 })
    }
    
    // Set up Google Calendar client
    const calendar = google.calendar({ version: "v3" })
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: currentAccessToken })
    
    // Create the calendar
    const calendarResponse = await calendar.calendars.insert({
      auth: oauth2Client,
      requestBody: {
        summary,
        description: description || `Calendar created by SyllaScan on ${new Date().toDateString()}`,
        timeZone: "America/New_York" // Default timezone (can be made configurable)
      }
    })
    
    if (!calendarResponse.data.id) {
      throw new Error("Failed to create calendar")
    }
    
    return NextResponse.json({
      success: true,
      calendarId: calendarResponse.data.id
    })
  } catch (error) {
    console.error("Error creating calendar:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create calendar"
    }, { status: 500 })
  }
} 