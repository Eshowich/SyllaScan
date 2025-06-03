"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SyllabusUploader } from "@/components/syllabus-uploader"
import { useAuth } from "@/hooks/use-auth"
import { GoogleAuthButton } from "@/components/google-auth-button"

export default function UploadPage() {
  const { user, isLoading } = useAuth()

  // If user is not logged in, show sign-in prompt
  if (!isLoading && !user) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Upload Syllabi" text="Sign in to upload syllabi and extract important dates." />
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold">Sign in to upload syllabi</h2>
            <p className="text-muted-foreground">
              Sign in with Google to upload syllabi and extract important dates.
            </p>
          </div>
          <GoogleAuthButton size="lg" text="Sign in with Google" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Upload Syllabi" text="Upload your syllabi to extract important dates and deadlines." />
      <div className="grid gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>Upload your syllabi in PDF, Word, or text format.</CardDescription>
            </CardHeader>
            <CardContent>
              <SyllabusUploader />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
