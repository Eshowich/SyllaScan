export interface ExtractedEvent {
  id?: string;
  title: string;
  date: string;
  endDate?: string;
  description?: string;
  location?: string;
  eventType: 'lecture' | 'homework' | 'exam' | 'quiz' | 'project' | 'officeHours' | 'other';
  confidence?: number; // AI confidence score
  approved?: boolean; // User approval status
}

export interface SyllabusData {
  id?: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  courseCode?: string;
  courseName?: string;
  instructorName?: string;
  extractedEvents?: ExtractedEvent[];
  calendarId?: string; // The ID of the Google Calendar created for this syllabus
}

export interface UserPreferences {
  id?: string;
  userId: string;
  datePreferences: {
    lectures: boolean;
    homework: boolean;
    exams: boolean;
    projects: boolean;
    officeHours: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AIProcessingResponse {
  success: boolean;
  extractedEvents?: ExtractedEvent[];
  courseInfo?: {
    courseCode?: string;
    courseName?: string;
    instructorName?: string;
  };
  error?: string;
} 