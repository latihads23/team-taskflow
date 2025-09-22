-- =============================================================================
-- Team TaskFlow - Supabase Database Setup
-- =============================================================================
-- Run this in your Supabase SQL Editor to create the missing tables

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL, -- user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add some example categories
INSERT INTO public.categories (name, color, description, created_by) VALUES
('Work', '#3B82F6', 'Work-related tasks', 'u1'),
('Personal', '#10B981', 'Personal tasks and activities', 'u1'),
('Urgent', '#EF4444', 'High-priority urgent tasks', 'u1'),
('Learning', '#8B5CF6', 'Learning and development tasks', 'u1')
ON CONFLICT DO NOTHING;

-- Verify tables exist
SELECT 'tasks' as table_name, count(*) as count FROM public.tasks
UNION ALL
SELECT 'users' as table_name, count(*) as count FROM public.users  
UNION ALL
SELECT 'categories' as table_name, count(*) as count FROM public.categories;

-- Show sample data
SELECT 'Sample Tasks:' as info;
SELECT id, title, created_at FROM public.tasks LIMIT 3;

SELECT 'Sample Users:' as info;
SELECT id, name, email FROM public.users LIMIT 3;

SELECT 'Sample Categories:' as info;
SELECT id, name, color FROM public.categories LIMIT 3;