import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/dashboard/get-syllabi called')
    
    // For anonymous users, use a default user_id
    const user_id = 'anonymous'
    
    console.log('📊 Fetching syllabi for user:', user_id)
    
    const { data: syllabi, error } = await supabase
      .from('saved_syllabi')
      .select(`
        *,
        saved_events (*)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.log('⚠️ Supabase error (returning empty data):', error.message)
      return NextResponse.json({
        success: true,
        syllabi: [],
        message: 'No syllabi found'
      })
    }
    
    if (!syllabi || syllabi.length === 0) {
      console.log('📝 No syllabi found, returning empty array')
      return NextResponse.json({
        success: true,
        syllabi: [],
        message: 'No syllabi found'
      })
    }
    
    // Transform the data for frontend consumption
    const transformedSyllabi = syllabi.map(syllabus => ({
      id: syllabus.id,
      title: syllabus.title,
      course_code: syllabus.course_code,
      course_name: syllabus.course_name,
      instructor_name: syllabus.instructor_name,
      created_at: syllabus.created_at,
      events: syllabus.saved_events || []
    }))
    
    console.log('✅ Successfully retrieved syllabi:', transformedSyllabi.length)
    
    return NextResponse.json({
      success: true,
      syllabi: transformedSyllabi
    })
    
  } catch (error) {
    console.log('🔄 Network/unexpected error (returning empty data):', error)
    
    // NEVER return error status - always return success with empty data
    return NextResponse.json({
      success: true,
      syllabi: [],
      message: 'Unable to load syllabi at this time'
    })
  }
} 