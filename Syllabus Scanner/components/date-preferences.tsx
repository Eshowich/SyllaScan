"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface DatePreferencesProps {
  onSave: (preferences: DatePreferences) => void
  defaultPreferences?: DatePreferences
}

export interface DatePreferences {
  lectures: boolean
  homework: boolean
  exams: boolean
  projects: boolean
  officeHours: boolean
}

export function DatePreferences({ onSave, defaultPreferences }: DatePreferencesProps) {
  const [preferences, setPreferences] = useState<DatePreferences>(
    defaultPreferences || {
      lectures: true,
      homework: true,
      exams: true,
      projects: true,
      officeHours: false,
    }
  )

  const handleToggle = (key: keyof DatePreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Preferences</CardTitle>
        <CardDescription>
          Select which types of dates you want to extract from your syllabi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="lectures" 
              checked={preferences.lectures} 
              onCheckedChange={() => handleToggle("lectures")} 
            />
            <Label htmlFor="lectures">Lecture Dates</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="homework" 
              checked={preferences.homework} 
              onCheckedChange={() => handleToggle("homework")} 
            />
            <Label htmlFor="homework">Homework & Assignment Dates</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="exams" 
              checked={preferences.exams} 
              onCheckedChange={() => handleToggle("exams")} 
            />
            <Label htmlFor="exams">Exam Dates</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="projects" 
              checked={preferences.projects} 
              onCheckedChange={() => handleToggle("projects")} 
            />
            <Label htmlFor="projects">Project Deadlines</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="officeHours" 
              checked={preferences.officeHours} 
              onCheckedChange={() => handleToggle("officeHours")} 
            />
            <Label htmlFor="officeHours">Office Hours</Label>
          </div>
          
          <Button onClick={() => onSave(preferences)} className="mt-2">
            <Check className="mr-2 h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 