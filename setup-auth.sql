-- =============================================
-- MINIMAL AUTHENTICATION SETUP - RUN DI SUPABASE SQL EDITOR
-- =============================================

-- 1. CREATE USER_PROFILES TABLE (YANG PALING PENTING)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT DEFAULT 'https://i.pravatar.cc/150?img=1',
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{"theme": "light", "language": "en"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE BASIC POLICIES
CREATE POLICY "Users can view all profiles" ON user_profiles 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. AUTO-CREATE USER PROFILE TRIGGER
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, username, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. CREATE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. TIME ENTRIES TABLE (untuk Pomodoro & Time Tracking)
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    description TEXT,
    entry_type VARCHAR(20) DEFAULT 'work' CHECK (entry_type IN ('work', 'break', 'pomodoro')),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TIME BOXES TABLE (untuk Time Boxing)
CREATE TABLE IF NOT EXISTS time_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    category VARCHAR(50),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. POMODORO SESSIONS TABLE
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    work_duration INTEGER DEFAULT 25, -- minutes
    break_duration INTEGER DEFAULT 5, -- minutes
    long_break_duration INTEGER DEFAULT 15, -- minutes
    current_session INTEGER DEFAULT 1,
    total_sessions INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'work' CHECK (status IN ('work', 'short_break', 'long_break', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. FROG TASKS TABLE (Eat That Frog feature)
CREATE TABLE IF NOT EXISTS frog_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    selected_date DATE NOT NULL,
    is_eaten BOOLEAN DEFAULT false,
    eaten_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, selected_date) -- Only one frog per day per user
);

-- 10. USER ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'task', 'frog', 'pomodoro', 'time_entry'
    resource_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    related_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE RLS FOR ALL TIME MANAGEMENT TABLES
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE frog_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES FOR TIME MANAGEMENT TABLES
-- Time Entries Policies
CREATE POLICY "Users can manage their own time entries" ON time_entries
    FOR ALL USING (auth.uid() = user_id);

-- Time Boxes Policies  
CREATE POLICY "Users can manage their own time boxes" ON time_boxes
    FOR ALL USING (auth.uid() = user_id);

-- Pomodoro Sessions Policies
CREATE POLICY "Users can manage their own pomodoro sessions" ON pomodoro_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Frog Tasks Policies
CREATE POLICY "Users can manage their own frog tasks" ON frog_tasks
    FOR ALL USING (auth.uid() = user_id);

-- Activity Logs Policies
CREATE POLICY "Users can view their own activity logs" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create their own activity logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_time_entries_user_task ON time_entries(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_time_boxes_user_date ON time_boxes(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user ON pomodoro_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_frog_tasks_user_date ON frog_tasks(user_id, selected_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- UPDATE TASKS TABLE untuk support Eat That Frog
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS eat_that_frog BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_minutes INTEGER;

-- 12. ADD SAMPLE CATEGORIES (jika belum ada)
INSERT INTO categories (id, name, color, description, icon, type, "order") VALUES
('work', 'Work', '#3B82F6', 'Work tasks', '💼', 'main', 1),
('personal', 'Personal', '#EC4899', 'Personal tasks', '🏠', 'main', 2),
('meetings', 'Meetings', '#10B981', 'Client meetings', '👥', 'sub', 3),
('development', 'Development', '#8B5CF6', 'Coding tasks', '💻', 'sub', 4),
('learning', 'Learning', '#F59E0B', 'Study & learning', '📚', 'sub', 5)
ON CONFLICT (id) DO NOTHING;

-- UTILITY FUNCTIONS FOR TIME MANAGEMENT

-- Function to get today's frog task
CREATE OR REPLACE FUNCTION get_todays_frog(user_uuid UUID)
RETURNS TABLE (
    frog_id UUID,
    task_id UUID,
    task_title TEXT,
    task_description TEXT,
    is_eaten BOOLEAN,
    eaten_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ft.id as frog_id,
        ft.task_id,
        t.title as task_title,
        t.description as task_description,
        ft.is_eaten,
        ft.eaten_at
    FROM frog_tasks ft
    JOIN tasks t ON ft.task_id = t.id
    WHERE ft.user_id = user_uuid 
    AND ft.selected_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user productivity stats
CREATE OR REPLACE FUNCTION get_user_productivity_stats(user_uuid UUID, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    total_tasks INTEGER,
    completed_tasks INTEGER,
    frogs_eaten INTEGER,
    total_pomodoros INTEGER,
    total_work_minutes INTEGER,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT t.id)::INTEGER as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'Done' THEN t.id END)::INTEGER as completed_tasks,
        COUNT(DISTINCT CASE WHEN ft.is_eaten = true THEN ft.id END)::INTEGER as frogs_eaten,
        COUNT(DISTINCT ps.id)::INTEGER as total_pomodoros,
        COALESCE(SUM(te.duration_minutes), 0)::INTEGER as total_work_minutes,
        CASE 
            WHEN COUNT(DISTINCT t.id) > 0 THEN 
                ROUND((COUNT(DISTINCT CASE WHEN t.status = 'Done' THEN t.id END)::DECIMAL / COUNT(DISTINCT t.id)::DECIMAL) * 100, 2)
            ELSE 0 
        END as completion_rate
    FROM tasks t
    LEFT JOIN frog_tasks ft ON t.id = ft.task_id AND ft.user_id = user_uuid
    LEFT JOIN pomodoro_sessions ps ON t.id = ps.task_id AND ps.user_id = user_uuid
    LEFT JOIN time_entries te ON t.id = te.task_id AND te.user_id = user_uuid
    WHERE t.assignee_id = user_uuid 
    AND t.created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT '🎉 COMPLETE SETUP WITH TIME MANAGEMENT! 🎉' as message;
SELECT 'Tables created: user_profiles, time_entries, time_boxes, pomodoro_sessions, frog_tasks, activity_logs, notifications' as tables_created;
SELECT 'Features ready: Authentication, Time Tracking, Pomodoro, Time Boxing, Eat That Frog!' as features_ready;
