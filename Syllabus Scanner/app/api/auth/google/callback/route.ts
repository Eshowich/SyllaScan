import { NextRequest, NextResponse } from "next/server"
import { getTokens } from "@/lib/google-auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("OAuth error:", error)
      return NextResponse.redirect(new URL(`/upload?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/upload?error=no_code", request.url))
    }

    // Exchange code for tokens
    const tokenResult = await getTokens(code)
    
    if (!tokenResult.success) {
      console.error("Token exchange failed:", tokenResult.error)
      return NextResponse.redirect(new URL(`/upload?error=${encodeURIComponent(tokenResult.error)}`, request.url))
    }

    // Store tokens in cookies
    const cookieStore = await cookies()
    
    if (tokenResult.tokens.access_token) {
      cookieStore.set("google_access_token", tokenResult.tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: tokenResult.tokens.expiry_date 
          ? Math.floor((tokenResult.tokens.expiry_date - Date.now()) / 1000)
          : 3600,
        path: "/",
      })
    }

    if (tokenResult.tokens.refresh_token) {
      cookieStore.set("google_refresh_token", tokenResult.tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
    }

    console.log("✅ Google Calendar access granted successfully")
    
    // Redirect back to upload page with success
    return NextResponse.redirect(new URL("/upload?calendar_connected=true", request.url))
    
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(new URL(`/upload?error=${encodeURIComponent("callback_failed")}`, request.url))
  }
}
