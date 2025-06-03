"use client"

import { ExtractedEvent, AIProcessingResponse } from "./types"
import { supabase } from "./supabase"

// Function to send a file to our AI API for processing
export async function processDocument(
  userId: string,
  filePath: string,
  fileName: string
): Promise<AIProcessingResponse> {
  try {
    // First get a download URL for the file from Supabase storage
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from("syllabi")
      .createSignedUrl(filePath, 60) // URL valid for 60 seconds

    if (downloadError) {
      console.error("Error creating signed URL:", downloadError)
      throw new Error("Could not access the file for processing")
    }

    const fileUrl = downloadData.signedUrl

    // Send the file URL to our AI processing API
    const response = await fetch("/api/ai/process-syllabus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        fileUrl,
        fileName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to process document")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error in processDocument:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Function to update event approval status
export async function updateEventApproval(
  syllabusId: string,
  eventId: string,
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("syllabus_events")
      .update({ approved })
      .eq("id", eventId)
      .eq("syllabus_id", syllabusId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error updating event approval:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event approval",
    }
  }
}

// Function to bulk approve/reject events
export async function bulkUpdateEvents(
  syllabusId: string,
  eventIds: string[],
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update all events with the provided IDs
    const { error } = await supabase
      .from("syllabus_events")
      .update({ approved })
      .eq("syllabus_id", syllabusId)
      .in("id", eventIds)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error in bulk update:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update events",
    }
  }
} 