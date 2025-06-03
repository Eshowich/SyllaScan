-- SyllaScan Supabase Setup
-- This file contains all SQL needed to configure a Supabase project for SyllaScan

-- TABLE SETUP

-- Syllabi table to store metadata about uploaded syllabi
CREATE TABLE IF NOT EXISTS syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  title TEXT,
  course_code TEXT,
  course_name TEXT,
  instructor TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('uploaded', 'processing', 'processed', 'error')) DEFAULT 'uploaded'
);

-- Events table to store extracted events from syllabi
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT CHECK (event_type IN ('lecture', 'exam', 'assignment', 'office_hours', 'other')),
  confidence DECIMAL,
  added_to_calendar BOOLEAN DEFAULT false,
  calendar_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS POLICIES

-- Enable Row Level Security
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Syllabi policies - users can only access their own syllabi
CREATE POLICY "Users can view their own syllabi"
  ON syllabi FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabi"
  ON syllabi FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabi"
  ON syllabi FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabi"
  ON syllabi FOR DELETE
  USING (auth.uid() = user_id);

-- Events policies - users can only access events for their own syllabi
CREATE POLICY "Users can view events for their own syllabi"
  ON events FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM syllabi WHERE id = events.syllabus_id
    )
  );

CREATE POLICY "Users can create events for their own syllabi"
  ON events FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM syllabi WHERE id = events.syllabus_id
    )
  );

CREATE POLICY "Users can update events for their own syllabi"
  ON events FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM syllabi WHERE id = events.syllabus_id
    )
  );

CREATE POLICY "Users can delete events for their own syllabi"
  ON events FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM syllabi WHERE id = events.syllabus_id
    )
  );

-- STORAGE SETUP

-- Create 'syllabi' bucket if it doesn't exist 
-- NOTE: You will need to create this through the Supabase Dashboard
-- or using service_role key, as bucket creation is not allowed in SQL scripts

-- STORAGE POLICIES
-- The following section needs to be executed in Storage > Policies in the Supabase Dashboard
-- You can copy and paste these policies when creating new policies

-- SELECT (Read) policy for authenticated users to access their own files
-- Policy name: "Authenticated users can view their own files"
-- Definition: (bucket_id = 'syllabi'::text) AND (auth.uid() = owner)

-- INSERT (Upload) policy for authenticated users
-- Policy name: "Authenticated users can upload files"
-- Definition: (bucket_id = 'syllabi'::text) AND (auth.uid() IS NOT NULL)

-- UPDATE policy for authenticated users to update their own files
-- Policy name: "Authenticated users can update their own files"
-- Definition: (bucket_id = 'syllabi'::text) AND (auth.uid() = owner OR auth.uid() IS NOT NULL)

-- DELETE policy for authenticated users to delete their own files
-- Policy name: "Authenticated users can delete their own files"
-- Definition: (bucket_id = 'syllabi'::text) AND (auth.uid() = owner) 