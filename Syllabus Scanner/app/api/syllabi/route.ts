import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const { syllabusId, title, course_code, course_name, instructor_name } = await request.json()

    if (!syllabusId || !title) {
      return NextResponse.json(
        { error: 'Syllabus ID and title are required' },
        { status: 400 }
      )
    }

    console.log('✏️ Updating syllabus:', { syllabusId, title })

    const updateData = {
      title: title.trim(),
      course_code: course_code?.trim() || '',
      course_name: course_name?.trim() || '',
      instructor_name: instructor_name?.trim() || '',
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('saved_syllabi')
      .update(updateData)
      .eq('id', syllabusId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating syllabus:', error)
      return NextResponse.json(
        { error: 'Failed to update syllabus: ' + error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Syllabus not found' },
        { status: 404 }
      )
    }

    console.log('✅ Syllabus updated successfully:', data?.id)

    return NextResponse.json({
      success: true,
      syllabus: data,
      message: 'Syllabus updated successfully'
    })

  } catch (error) {
    console.error('❌ Syllabus update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update syllabus' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const syllabusId = searchParams.get('syllabusId')
    const deleteAll = searchParams.get('deleteAll')

    if (deleteAll === 'true') {
      console.log('🗑️ Deleting all syllabi and events for anonymous user')

      // Delete all events first (due to foreign key constraint)
      const { error: eventsError } = await supabase
        .from('saved_events')
        .delete()
        .in('syllabus_id', 
          supabase
            .from('saved_syllabi')
            .select('id')
            .eq('user_id', 'anonymous')
        )

      if (eventsError) {
        console.error('❌ Error deleting events:', eventsError)
        return NextResponse.json(
          { error: 'Failed to delete events: ' + eventsError.message },
          { status: 500 }
        )
      }

      // Then delete all syllabi
      const { error: syllabiError } = await supabase
        .from('saved_syllabi')
        .delete()
        .eq('user_id', 'anonymous')

      if (syllabiError) {
        console.error('❌ Error deleting syllabi:', syllabiError)
        return NextResponse.json(
          { error: 'Failed to delete syllabi: ' + syllabiError.message },
          { status: 500 }
        )
      }

      console.log('✅ All syllabi and events deleted successfully')

      return NextResponse.json({
        success: true,
        message: 'All syllabi and events deleted successfully'
      })
    }

    if (!syllabusId) {
      return NextResponse.json(
        { error: 'Syllabus ID is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting syllabus and its events:', syllabusId)

    // Delete all events for this syllabus first (due to foreign key constraint)
    const { error: eventsError } = await supabase
      .from('saved_events')
      .delete()
      .eq('syllabus_id', syllabusId)

    if (eventsError) {
      console.error('❌ Error deleting events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to delete events: ' + eventsError.message },
        { status: 500 }
      )
    }

    // Then delete the syllabus
    const { error: syllabusError } = await supabase
      .from('saved_syllabi')
      .delete()
      .eq('id', syllabusId)

    if (syllabusError) {
      console.error('❌ Error deleting syllabus:', syllabusError)
      return NextResponse.json(
        { error: 'Failed to delete syllabus: ' + syllabusError.message },
        { status: 500 }
      )
    }

    console.log('✅ Syllabus and events deleted successfully:', syllabusId)

    return NextResponse.json({
      success: true,
      message: 'Syllabus and all associated events deleted successfully'
    })

  } catch (error) {
    console.error('❌ Syllabus deletion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete syllabus' },
      { status: 500 }
    )
  }
} 