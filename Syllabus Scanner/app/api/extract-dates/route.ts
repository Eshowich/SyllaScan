import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read the file content
    const fileContent = await file.text()

    // Use AI to extract dates from the syllabus
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Extract all important dates and deadlines from the following syllabus. 
        Format the output as a JSON array of objects with the following properties:
        - title: The name of the event or assignment
        - date: The date in YYYY-MM-DD format
        - course: The course name if mentioned, otherwise use the filename
        - type: The type of event (Assignment, Exam, Quiz, Project, etc.)
        
        Here's the syllabus content:
        ${fileContent}
      `,
    })

    // Parse the AI response to get the extracted dates
    let extractedDates
    try {
      // Find JSON in the response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        extractedDates = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No valid JSON found in the response")
      }
    } catch (error) {
      console.error("Error parsing AI response:", error)
      return NextResponse.json({ error: "Failed to parse extracted dates" }, { status: 500 })
    }

    return NextResponse.json({ dates: extractedDates })
  } catch (error) {
    console.error("Error processing syllabus:", error)
    return NextResponse.json({ error: "Failed to process syllabus" }, { status: 500 })
  }
}
