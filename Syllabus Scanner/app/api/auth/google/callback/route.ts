import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getTokens, setCredentials, getUserInfo } from "@/lib/google-auth"

export async function GET(request: Request) {
  try {
    // Get the authorization code from the URL
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state") || ""
    const error = url.searchParams.get("error")

    // Handle error from Google
    if (error) {
      return NextResponse.redirect(new URL(`/auth/error?error=${error}`, url.origin))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/auth/error?error=no_code", url.origin))
    }

    // Exchange the code for tokens
    const tokenResult = await getTokens(code)

    if (!tokenResult.success) {
      return NextResponse.redirect(
        new URL(`/auth/error?error=token_exchange_failed&message=${encodeURIComponent(tokenResult.error)}`, url.origin),
      )
    }

    const tokens = tokenResult.tokens

    // Get the OAuth2 client with credentials
    const oauth2Client = setCredentials(tokens)

    // Get user info
    const userInfoResult = await getUserInfo(oauth2Client)

    if (!userInfoResult.success) {
      return NextResponse.redirect(
        new URL(`/auth/error?error=user_info_failed&message=${encodeURIComponent(userInfoResult.error)}`, url.origin),
      )
    }

    const userInfo = userInfoResult.data

    // Store tokens in cookies (in a real app, you'd store these securely)
    const cookieStore = cookies()
    cookieStore.set("google_access_token", tokens.access_token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
      path: "/",
    })

    if (tokens.refresh_token) {
      cookieStore.set("google_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
    }

    // Store user info in a cookie
    cookieStore.set(
      "user_info",
      JSON.stringify({
        email: userInfo.emailAddresses?.[0]?.value,
        name: userInfo.names?.[0]?.displayName,
        picture: userInfo.photos?.[0]?.url,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      },
    )

    // Redirect based on state parameter or default to calendar page
    const redirectPath = state || "/calendar"
    return NextResponse.redirect(new URL(redirectPath, url.origin))
  } catch (error) {
    console.error("Error handling Google OAuth callback:", error)
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=callback_failed&message=${encodeURIComponent(error.message || "Unknown error")}`,
        request.url,
      ),
    )
  }
}
