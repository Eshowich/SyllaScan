-- SyllaScan Schema for Local Supabase
-- Run this in the Supabase Studio SQL Editor

-- Create tables
CREATE TABLE IF NOT EXISTS public.syllabi (
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

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabi(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT CHECK (event_type IN ('lecture', 'exam', 'assignment', 'office_hours', 'other')),
  confidence DECIMAL,
  added_to_calendar BOOLEAN DEFAULT false,
  calendar_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for syllabi
CREATE POLICY "Users can view their own syllabi"
  ON public.syllabi FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabi"
  ON public.syllabi FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabi"
  ON public.syllabi FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabi"
  ON public.syllabi FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for events
CREATE POLICY "Users can view events for their own syllabi"
  ON public.events FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.syllabi WHERE id = events.syllabus_id
    )
  );

CREATE POLICY "Users can create events for their own syllabi"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.syllabi WHERE id = events.syllabus_id
    )
  );

CREATE POLICY "Users can update events for their own syllabi"
  ON public.events FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.syllabi WHERE id = events.syllabus_id
    )
  );

CREATE POLICY "Users can delete events for their own syllabi"
  ON public.events FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.syllabi WHERE id = events.syllabus_id
    )
  );

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('syllabi', 'syllabi', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Authenticated users can view their own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'syllabi' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'syllabi' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'syllabi' AND (auth.uid() = owner OR auth.uid() IS NOT NULL));

CREATE POLICY "Authenticated users can delete their own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'syllabi' AND auth.uid() = owner);

