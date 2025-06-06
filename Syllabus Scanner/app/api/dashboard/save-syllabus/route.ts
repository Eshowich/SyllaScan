import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ExtractedEvent } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { syllabusName, events, courseInfo } = await request.json()

    if (!syllabusName || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Syllabus name and events are required' },
        { status: 400 }
      )
    }

    console.log('💾 Saving syllabus to dashboard:', { syllabusName, eventCount: events.length })

    // Create syllabus record with simplified structure
    const syllabusRecord = {
      user_id: 'anonymous',
      title: syllabusName,
      course_code: courseInfo?.courseCode || 'IMPORTED',
      course_name: courseInfo?.courseName || 'Imported Syllabus', 
      instructor_name: courseInfo?.instructorName || 'Unknown',
      created_at: new Date().toISOString()
    }

    const { data: syllabusData, error: syllabusError } = await supabase
      .from('saved_syllabi')
      .insert([syllabusRecord])
      .select()
      .single()

    if (syllabusError) {
      console.error('❌ Error creating syllabus record:', syllabusError)
      
      // If table doesn't exist, provide helpful error message
      if (syllabusError.message.includes('relation') || syllabusError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database tables not configured. Please set up your Supabase database first.',
            details: 'The saved_syllabi table does not exist. Check your database setup.'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to save syllabus: ' + syllabusError.message },
        { status: 500 }
      )
    }

    console.log('✅ Syllabus record created:', syllabusData?.id)

    // Save events with simplified structure
    const eventsToInsert = events.map((event: ExtractedEvent) => ({
      syllabus_id: syllabusData?.id,
      title: event.title,
      description: event.description || '',
      event_date: event.date,
      event_type: event.eventType,
      confidence: event.confidence || 0.8,
      created_at: new Date().toISOString()
    }))

    const { data: eventsData, error: eventsError } = await supabase
      .from('saved_events')
      .insert(eventsToInsert)
      .select()

    if (eventsError) {
      console.error('❌ Error saving events:', eventsError)
      
      // Try to cleanup the syllabus record if events failed
      try {
        await supabase.from('saved_syllabi').delete().eq('id', syllabusData?.id)
      } catch (cleanupError) {
        console.log('Could not cleanup syllabus record:', cleanupError)
      }
      
      // Provide helpful error message for missing table
      if (eventsError.message.includes('relation') || eventsError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database tables not configured. Please set up your Supabase database first.',
            details: 'The saved_events table does not exist. Check your database setup.'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to save events: ' + eventsError.message },
        { status: 500 }
      )
    }

    console.log('✅ Events saved successfully:', eventsData?.length || 0)

    return NextResponse.json({
      success: true,
      syllabusId: syllabusData?.id,
      savedEvents: eventsData?.length || 0,
      message: `Successfully saved ${eventsData?.length || 0} events to dashboard`
    })

  } catch (error) {
    console.error('❌ Dashboard save error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save to dashboard' },
      { status: 500 }
    )
  }
} 