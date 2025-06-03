import { NextRequest, NextResponse } from "next/server"
import { getOAuth2Client } from "@/lib/google-auth"

export async function GET(request: NextRequest) {
  try {
    const oauth2Client = getOAuth2Client()
    
    // Generate a unique state parameter for security
    const state = Math.random().toString(36).substring(2, 15)
    
    // Generate auth URL with calendar scope
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ],
      prompt: "consent", // Force to get refresh token
      state: state // For security to prevent CSRF
    })
    
    return NextResponse.json({ 
      authUrl 
    })
  } catch (error) {
    console.error("Error requesting calendar access:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to request calendar access" 
    }, { status: 500 })
  }
} 