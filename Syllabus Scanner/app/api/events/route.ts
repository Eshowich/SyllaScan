import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { syllabusId, title, description, event_date, event_type } = await request.json()

    if (!syllabusId || !title || !event_date || !event_type) {
      return NextResponse.json(
        { error: 'Syllabus ID, title, date, and type are required' },
        { status: 400 }
      )
    }

    console.log('➕ Creating new event:', { syllabusId, title, event_type })

    // Convert date to YYYY-MM-DD format for database storage
    const formattedDate = new Date(event_date).toISOString().split('T')[0]

    const eventData = {
      syllabus_id: syllabusId,
      title: title.trim(),
      description: description?.trim() || '',
      event_date: formattedDate, // Store as YYYY-MM-DD text
      event_type: event_type,
      confidence: 0.95, // User-created events have high confidence
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('saved_events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating event:', error)
      return NextResponse.json(
        { error: 'Failed to create event: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Event created successfully:', data?.id)

    return NextResponse.json({
      success: true,
      event: data,
      message: 'Event created successfully'
    })

  } catch (error) {
    console.error('❌ Event creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { eventId, title, description, event_date, event_type } = await request.json()

    if (!eventId || !title || !event_date || !event_type) {
      return NextResponse.json(
        { error: 'Event ID, title, date, and type are required' },
        { status: 400 }
      )
    }

    console.log('✏️ Updating event:', { eventId, title, event_type })

    // Convert date to YYYY-MM-DD format for database storage
    const formattedDate = new Date(event_date).toISOString().split('T')[0]

    const updateData = {
      title: title.trim(),
      description: description?.trim() || '',
      event_date: formattedDate, // Store as YYYY-MM-DD text
      event_type: event_type,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('saved_events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating event:', error)
      return NextResponse.json(
        { error: 'Failed to update event: ' + error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    console.log('✅ Event updated successfully:', data?.id)

    return NextResponse.json({
      success: true,
      event: data,
      message: 'Event updated successfully'
    })

  } catch (error) {
    console.error('❌ Event update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting event:', eventId)

    const { error } = await supabase
      .from('saved_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('❌ Error deleting event:', error)
      return NextResponse.json(
        { error: 'Failed to delete event: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Event deleted successfully:', eventId)

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error) {
    console.error('❌ Event deletion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete event' },
      { status: 500 }
    )
  }
} 