import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { setCredentials, addEventsToCalendar, refreshAccessToken } from "@/lib/google-auth"

export async function POST(request: Request) {
  try {
    const { events, calendarId = "primary" } = await request.json()

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "No events provided or invalid format" }, { status: 400 })
    }

    // Get tokens from cookies
    const cookieStore = cookies()
    const accessToken = cookieStore.get("google_access_token")?.value
    const refreshToken = cookieStore.get("google_refresh_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated with Google", needsAuth: true }, { status: 401 })
    }

    // Set up OAuth2 client with tokens
    let oauth2Client = setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    // Add events to Google Calendar
    let result = await addEventsToCalendar(oauth2Client, events, calendarId)

    // If token is expired, try to refresh it
    if (!result.success && refreshToken) {
      const refreshResult = await refreshAccessToken(refreshToken)

      if (refreshResult.success) {
        // Update access token cookie
        cookieStore.set("google_access_token", refreshResult.tokens.access_token || "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: refreshResult.tokens.expiry_date
            ? Math.floor((refreshResult.tokens.expiry_date - Date.now()) / 1000)
            : 3600,
          path: "/",
        })

        // Try again with new token
        oauth2Client = setCredentials({
          access_token: refreshResult.tokens.access_token,
          refresh_token: refreshToken,
        })

        result = await addEventsToCalendar(oauth2Client, events, calendarId)
      }
    }

    if (!result.success) {
      // Check if all events failed due to auth issues
      if (result.errors.every((error) => error.includes("invalid_grant") || error.includes("token expired"))) {
        return NextResponse.json({ error: "Google authentication expired", needsAuth: true }, { status: 401 })
      }

      // Some events failed for other reasons
      return NextResponse.json(
        {
          partialSuccess: result.added > 0,
          added: result.added,
          failed: result.failed,
          errors: result.errors,
        },
        { status: 207 },
      ) // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: `Added ${result.added} events to Google Calendar`,
      events: result.events,
    })
  } catch (error) {
    console.error("Error adding events to Google Calendar:", error)
    return NextResponse.json({ error: "Failed to add events to Google Calendar" }, { status: 500 })
  }
}
