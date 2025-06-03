import { supabase } from '@/lib/supabase';

export type SyllabusData = {
  id: string;
  filename: string;
  course: string;
  uploadDate: string;
  eventsExtracted: number;
};

export type EventData = {
  id: string;
  title: string;
  date: string;
  time: string;
  course: string;
  type: string;
};

export type UserStats = {
  totalSyllabi: number;
  totalEvents: number;
  eventsThisWeek: number;
  activeCourses: number;
  semesterProgress: number;
};

// Fetch user's syllabi from Supabase
export const getUserSyllabi = async (userId: string): Promise<SyllabusData[]> => {
  try {
    const { data, error } = await supabase
      .from('syllabi')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching syllabi:', error);
      return [];
    }

    // Transform data to match our expected format
    return data.map((item) => ({
      id: item.id,
      filename: item.data.fileName || 'Unknown File',
      course: extractCourseFromFilename(item.data.fileName) || 'Unknown Course',
      uploadDate: new Date(item.created_at).toISOString().split('T')[0],
      eventsExtracted: (item.data.extractedDates?.dates?.length || 0),
    }));
  } catch (error) {
    console.error('Error in getUserSyllabi:', error);
    return [];
  }
};

// Fetch user's upcoming events from Supabase
export const getUserEvents = async (userId: string): Promise<EventData[]> => {
  try {
    const { data, error } = await supabase
      .from('syllabi')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    // Extract all events from all syllabi
    const allEvents: EventData[] = [];
    
    data.forEach((syllabus) => {
      const dates = syllabus.data.extractedDates?.dates || [];
      const courseName = extractCourseFromFilename(syllabus.data.fileName) || 'Unknown Course';
      
      dates.forEach((date: any, index: number) => {
        const eventDate = new Date(date.date);
        
        allEvents.push({
          id: `${syllabus.id}-${index}`,
          title: date.title || 'Untitled Event',
          date: eventDate.toISOString().split('T')[0],
          time: eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          course: courseName,
          type: determineEventType(date.title),
        });
      });
    });

    // Sort events by date and return only upcoming events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allEvents
      .filter((event) => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('Error in getUserEvents:', error);
    return [];
  }
};

// Get user stats for dashboard
export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // Fetch all user syllabi
    const { data: syllabi, error } = await supabase
      .from('syllabi')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Count total syllabi
    const totalSyllabi = syllabi.length;

    // Extract all events and courses
    let allEvents: any[] = [];
    const courseSet = new Set<string>();

    syllabi.forEach((syllabus) => {
      const dates = syllabus.data.extractedDates?.dates || [];
      const courseName = extractCourseFromFilename(syllabus.data.fileName);
      
      if (courseName) {
        courseSet.add(courseName);
      }
      
      allEvents = [...allEvents, ...dates.map((date: any) => ({
        ...date,
        date: new Date(date.date),
      }))];
    });

    // Count events this week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    const eventsThisWeek = allEvents.filter(
      (event) => event.date >= today && event.date <= oneWeekLater
    ).length;

    // Calculate semester progress (assume 16 week semester from August to December)
    const semesterStart = new Date(today.getFullYear(), 7, 15); // August 15
    const semesterEnd = new Date(today.getFullYear(), 11, 15); // December 15
    
    // If today is before the start date, progress is 0
    if (today < semesterStart) {
      return {
        totalSyllabi,
        totalEvents: allEvents.length,
        eventsThisWeek,
        activeCourses: courseSet.size,
        semesterProgress: 0,
      };
    }
    
    // If today is after the end date, progress is 100
    if (today > semesterEnd) {
      return {
        totalSyllabi,
        totalEvents: allEvents.length,
        eventsThisWeek,
        activeCourses: courseSet.size,
        semesterProgress: 100,
      };
    }
    
    // Calculate progress percentage
    const totalDays = (semesterEnd.getTime() - semesterStart.getTime()) / (1000 * 3600 * 24);
    const daysElapsed = (today.getTime() - semesterStart.getTime()) / (1000 * 3600 * 24);
    const semesterProgress = Math.round((daysElapsed / totalDays) * 100);

    return {
      totalSyllabi,
      totalEvents: allEvents.length,
      eventsThisWeek,
      activeCourses: courseSet.size,
      semesterProgress,
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      totalSyllabi: 0,
      totalEvents: 0,
      eventsThisWeek: 0,
      activeCourses: 0,
      semesterProgress: 0,
    };
  }
};

// Helper functions
function extractCourseFromFilename(filename?: string): string | null {
  if (!filename) return null;
  
  // Try to extract course code patterns like CS101, MATH 301, etc.
  const coursePattern = /([A-Z]{2,5})\s*[-_]?\s*(\d{2,3})/i;
  const match = filename.match(coursePattern);
  
  if (match) {
    return `${match[1].toUpperCase()} ${match[2]}`;
  }
  
  return null;
}

function determineEventType(title: string): string {
  title = title.toLowerCase();
  
  if (title.includes('exam') || title.includes('midterm') || title.includes('final')) {
    return 'Exam';
  } else if (title.includes('quiz')) {
    return 'Quiz';
  } else if (title.includes('assignment') || title.includes('homework')) {
    return 'Assignment';
  } else if (title.includes('project')) {
    return 'Project';
  } else if (title.includes('presentation')) {
    return 'Presentation';
  } else if (title.includes('paper')) {
    return 'Paper';
  } else {
    return 'Deadline';
  }
} 