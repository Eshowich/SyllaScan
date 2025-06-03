import { NextResponse } from "next/server"
import { getAuthUrl } from "@/lib/google-auth"

export async function GET() {
  try {
    // Generate the authorization URL
    const authUrl = getAuthUrl()

    // Redirect the user to the Google OAuth consent screen
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Error initiating Google OAuth:", error)
    return NextResponse.json({ error: "Failed to initiate Google OAuth" }, { status: 500 })
  }
}
