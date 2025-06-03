"use client"

import { useEffect, useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { getUserSyllabi, type SyllabusData } from "@/lib/dashboard"

export function RecentUploads() {
  const { user } = useAuth()
  const [syllabi, setSyllabi] = useState<SyllabusData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSyllabi() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const data = await getUserSyllabi(user.id)
        setSyllabi(data)
      } catch (error) {
        console.error("Error fetching syllabi:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSyllabi()
  }, [user])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>Your recently uploaded syllabi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (syllabi.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>Your recently uploaded syllabi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No syllabi uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Uploads</CardTitle>
        <CardDescription>Your recently uploaded syllabi.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {syllabi.map((syllabus) => (
            <div key={syllabus.id} className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{syllabus.filename}</p>
                <p className="text-sm text-muted-foreground">
                  {syllabus.course} • {syllabus.eventsExtracted} events extracted
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploaded on {new Date(syllabus.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
