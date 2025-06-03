"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GoogleAuthButton } from "@/components/google-auth-button"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "unknown_error"
  const message = searchParams.get("message") || ""

  const errorMessages: Record<string, string> = {
    no_code: "No authorization code was received from Google.",
    callback_failed: "There was an error processing your Google authentication.",
    token_exchange_failed: "Failed to exchange the authorization code for tokens.",
    user_info_failed: "Failed to retrieve your user information from Google.",
    access_denied: "You denied access to your Google account.",
    unknown_error: "An unknown authentication error occurred.",
  }

  const errorMessage = errorMessages[error] || errorMessages.unknown_error
  const detailedMessage = message ? `Details: ${message}` : ""

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>There was a problem with Google authentication.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
              {detailedMessage && <p className="mt-2 text-xs opacity-80">{detailedMessage}</p>}
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">What happened?</h3>
            <p className="text-sm text-muted-foreground">
              There was an issue connecting to your Google account. This could be due to:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              <li>Temporary authentication issues with Google</li>
              <li>You denied permission to access your calendar</li>
              <li>Your session expired</li>
              <li>Network connectivity problems</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/calendar">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
            <GoogleAuthButton className="w-full sm:w-auto" />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
