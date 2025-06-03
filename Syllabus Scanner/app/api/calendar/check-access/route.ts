import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Get the access token from cookies - using await as required by Next.js
    const cookieStore = await cookies()
    
    // Use a try-catch block since we're accessing cookies which could be undefined
    let accessToken = null
    let refreshToken = null
    
    try {
      accessToken = cookieStore.get("google_access_token")?.value
      if (!accessToken) {
        // If no access token, check if we have a refresh token
        refreshToken = cookieStore.get("google_refresh_token")?.value
      }
    } catch (cookieError) {
      console.error("Error accessing cookies:", cookieError)
    }

    const hasAccess = !!accessToken || !!refreshToken
    
    // For debugging
    console.log("Calendar access check:", { hasAccess, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken })
    
    // If we have an access token or refresh token, we consider that the user has granted access
    return NextResponse.json({ 
      hasAccess
    })
  } catch (error) {
    console.error("Error checking calendar access:", error)
    return NextResponse.json({ 
      hasAccess: false,
      error: error instanceof Error ? error.message : "Failed to check calendar access"
    }, { status: 500 })
  }
} 