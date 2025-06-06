import { google } from "googleapis"
import { cookies } from "next/headers"

// Get environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"

// Define the scopes we need
export const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
]

// Create an OAuth2 client
export function getOAuth2Client() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI)
}

// Generate the authorization URL
export function getAuthUrl(state = "") {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Get a refresh token
    scope: SCOPES,
    prompt: "consent", // Force consent screen to ensure we get a refresh token
    state, // Pass state parameter for security
  })
}

// Exchange code for tokens
export async function getTokens(code: string) {
  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    return { success: true, tokens }
  } catch (error) {
    console.error("Error getting tokens:", error)
    return { success: false, error: error.message || "Failed to get tokens" }
  }
}

// Refresh the access token using the refresh token
export async function refreshAccessToken(refreshToken: string) {
  try {
    const oauth2Client = getOAuth2Client()
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    })
    
    const { credentials } = await oauth2Client.refreshAccessToken()
    
    try {
      // Update cookies with new tokens
      const cookieStore = await cookies()
      
      // Set the access token
      if (credentials.access_token) {
        cookieStore.set("google_access_token", credentials.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: credentials.expiry_date 
            ? Math.floor((credentials.expiry_date - Date.now()) / 1000) 
            : 3600,
          path: "/",
        })
      }
      
      // If we received a new refresh token, update that as well
      if (credentials.refresh_token) {
        cookieStore.set("google_refresh_token", credentials.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        })
      }
    } catch (cookieError) {
      console.error("Error updating cookies:", cookieError)
      // We'll continue even if cookies couldn't be updated
      // The function will return success but the client may need to reauthenticate sooner
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error refreshing token:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

// Set credentials on OAuth2 client
export function setCredentials(tokens: any) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials(tokens)
  return oauth2Client
}

// Get user info from Google
export async function getUserInfo(oauth2Client: any) {
  try {
    const people = google.people({ version: "v1", auth: oauth2Client })
    const res = await people.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses,photos",
    })
    return { success: true, data: res.data }
  } catch (error) {
    console.error("Error getting user info:", error)
    return { success: false, error: error.message || "Failed to get user info" }
  }
}

// Get user's calendars
export async function getUserCalendars(oauth2Client: any) {
  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    const res = await calendar.calendarList.list()
    return { success: true, calendars: res.data.items || [] }
  } catch (error) {
    console.error("Error getting calendars:", error)
    return { success: false, error: error.message || "Failed to get calendars" }
  }
}

// Add an event to Google Calendar
export async function addEventToCalendar(oauth2Client: any, event: any, calendarId = "primary") {
  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.title,
        description: `Event from ${event.course}${event.type ? ` - Type: ${event.type}` : ""}`,
        start: {
          dateTime: new Date(event.date + "T" + (event.time || "09:00:00")).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(
            new Date(event.date + "T" + (event.time || "09:00:00")).getTime() + 60 * 60 * 1000,
          ).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        colorId: getEventColorId(event.type),
      },
    })
    return { success: true, event: res.data }
  } catch (error) {
    console.error("Error adding event:", error)
    return { success: false, error: error.message || "Failed to add event" }
  }
}

// Add multiple events to Google Calendar
export async function addEventsToCalendar(oauth2Client: any, events: any[], calendarId = "primary") {
  const results = await Promise.all(events.map((event) => addEventToCalendar(oauth2Client, event, calendarId)))
  const successful = results.filter((result) => result.success)
  const failed = results.filter((result) => !result.success)

  return {
    success: failed.length === 0,
    added: successful.length,
    failed: failed.length,
    events: successful.map((result) => result.event),
    errors: failed.map((result) => result.error),
  }
}

// Helper function to get color ID based on event type
function getEventColorId(type: string): string {
  // Google Calendar color IDs (1-11)
  switch (type?.toLowerCase()) {
    case "exam":
      return "4" // Red
    case "quiz":
      return "5" // Yellow
    case "assignment":
      return "6" // Orange
    case "project":
      return "10" // Green
    default:
      return "1" // Blue
  }
}
