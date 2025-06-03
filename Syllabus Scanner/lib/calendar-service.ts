"use client"

import { ExtractedEvent } from "./types"

// Create a new secondary calendar for a course
export async function createSecondaryCalendar(
  courseName: string,
  courseCode?: string
): Promise<{ success: boolean; calendarId?: string; error?: string }> {
  try {
    const response = await fetch("/api/calendar/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: courseCode ? `${courseCode} - ${courseName}` : courseName,
        description: `Calendar for ${courseName} created by SyllaScan`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create calendar")
    }

    const result = await response.json()
    return {
      success: true,
      calendarId: result.calendarId,
    }
  } catch (error) {
    console.error("Error creating calendar:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Add approved events to the secondary calendar
export async function addEventsToCalendar(
  calendarId: string,
  events: ExtractedEvent[]
): Promise<{ success: boolean; addedEvents?: number; error?: string }> {
  try {
    const response = await fetch("/api/calendar/add-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        calendarId,
        events,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to add events to calendar")
    }

    const result = await response.json()
    return {
      success: true,
      addedEvents: result.addedEvents,
    }
  } catch (error) {
    console.error("Error adding events to calendar:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Check if the user has granted calendar access
export async function checkCalendarAccess(): Promise<boolean> {
  try {
    const response = await fetch("/api/calendar/check-access")
    
    if (!response.ok) {
      return false
    }
    
    const result = await response.json()
    return result.hasAccess
  } catch (error) {
    console.error("Error checking calendar access:", error)
    return false
  }
}

// Request calendar access
export async function requestCalendarAccess(): Promise<{ url: string } | { error: string }> {
  try {
    const response = await fetch("/api/calendar/request-access")
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to request calendar access")
    }
    
    const result = await response.json()
    return { url: result.authUrl }
  } catch (error) {
    console.error("Error requesting calendar access:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
} 