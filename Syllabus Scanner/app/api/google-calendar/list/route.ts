import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { setCredentials, getUserCalendars, refreshAccessToken } from "@/lib/google-auth"

export async function GET() {
  try {
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

    // Get user's calendars
    let result = await getUserCalendars(oauth2Client)

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

        result = await getUserCalendars(oauth2Client)
      }
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error, needsAuth: true }, { status: 401 })
    }

    return NextResponse.json({ calendars: result.calendars })
  } catch (error) {
    console.error("Error getting calendars:", error)
    return NextResponse.json({ error: "Failed to get calendars" }, { status: 500 })
  }
}
