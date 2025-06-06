import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // First check if Google OAuth is configured
    const hasOAuthConfig = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    
    if (!hasOAuthConfig) {
      console.log("❌ Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET")
      return NextResponse.json({ 
        hasAccess: false,
        error: "Google OAuth credentials not configured"
      })
    }

    // Get the access token from cookies - using await as required by Next.js
    const cookieStore = await cookies()
    
    // Use a try-catch block since we're accessing cookies which could be undefined
    let accessToken = null
    let refreshToken = null
    
    try {
      accessToken = cookieStore.get("google_access_token")?.value
      refreshToken = cookieStore.get("google_refresh_token")?.value
    } catch (cookieError) {
      console.error("Error accessing cookies:", cookieError)
    }

    // Only consider having access if we have valid tokens AND OAuth is configured
    const hasValidTokens = !!(accessToken || refreshToken)
    const hasAccess = hasOAuthConfig && hasValidTokens
    
    // For debugging
    console.log("Calendar access check:", { 
      hasAccess, 
      hasOAuthConfig,
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken,
      hasValidTokens,
      accessTokenValue: accessToken ? 'present' : 'missing',
      refreshTokenValue: refreshToken ? 'present' : 'missing'
    })
    
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