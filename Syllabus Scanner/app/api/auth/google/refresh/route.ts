import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { refreshAccessToken } from "@/lib/google-auth"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("google_refresh_token")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 401 })
    }

    const result = await refreshAccessToken(refreshToken)

    if (!result.success) {
      // Clear cookies if refresh fails
      cookieStore.set("google_access_token", "", { maxAge: 0, path: "/" })
      cookieStore.set("google_refresh_token", "", { maxAge: 0, path: "/" })
      cookieStore.set("user_info", "", { maxAge: 0, path: "/" })

      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // The refreshAccessToken function already sets the cookies internally
    // So we don't need to set them again here

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error refreshing token:", error)
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 })
  }
}
