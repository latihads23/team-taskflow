-- =============================================
-- TEAM TASKFLOW - COMPLETE SUPABASE SCHEMA v2.0
-- =============================================
-- 🚀 Run this script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- DROP EXISTING TABLES (IF RECREATING)
-- =============================================
-- Uncomment below if you want to recreate everything
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS user_preferences CASCADE;
-- DROP TABLE IF EXISTS time_entries CASCADE;
-- DROP TABLE IF EXISTS task_comments CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'https://i.pravatar.cc/150?img=1',
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY, -- Using string ID for easier frontend integration
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color #ffffff
    description TEXT,
    icon VARCHAR(10), -- Emoji
    type VARCHAR(20) DEFAULT 'main' CHECK (type IN ('main', 'sub')),
    parent_id VARCHAR(50) REFERENCES categories(id) ON DELETE CASCADE,
    main_category_color VARCHAR(7),
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. ENHANCED TASKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Core fields
    due_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Review', 'Done')),
    
    -- Time tracking
    estimated_hours INTEGER DEFAULT 0,
    actual_hours INTEGER DEFAULT 0,
    
    -- Reminders  
    reminder_at TIMESTAMP WITH TIME ZONE,
    
    -- Recurring tasks
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100), -- 'daily', 'weekly', 'monthly'
    recurrence_end_date DATE,
    original_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Special features
    eat_that_frog BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Search
    search_vector tsvector,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. TASK COMMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. TIME ENTRIES (Pomodoro & Time Tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    description TEXT,
    entry_type VARCHAR(20) DEFAULT 'work' CHECK (entry_type IN ('work', 'break', 'pomodoro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'reminder')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    related_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. USER PREFERENCES
-- =============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- UI Preferences
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'id',
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    
    -- Notifications
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    daily_digest BOOLEAN DEFAULT true,
    reminder_minutes_before INTEGER DEFAULT 30,
    
    -- Dashboard
    dashboard_layout JSONB DEFAULT '{"view": "kanban", "columns": ["To Do", "In Progress", "Review", "Done"]}',
    default_priority VARCHAR(20) DEFAULT 'Medium',
    
    -- Pomodoro settings
    pomodoro_work_minutes INTEGER DEFAULT 25,
    pomodoro_short_break INTEGER DEFAULT 5,
    pomodoro_long_break INTEGER DEFAULT 15,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. ACTIVITY LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- Tasks (comprehensive indexing)
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_tasks_frog ON tasks(eat_that_frog) WHERE eat_that_frog = true;
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING GIN(search_vector);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_priority ON tasks(due_date, priority);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;

-- Other tables
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_user ON time_entries(task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search vector update function
CREATE OR REPLACE FUNCTION update_task_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('indonesian', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_task_search_vector();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (customize based on your auth setup)
-- For development, allowing all operations
CREATE POLICY "Enable all operations for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON task_comments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON time_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON user_preferences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON activity_logs FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Get tasks with full details
CREATE OR REPLACE FUNCTION get_tasks_with_details()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    assignee_id UUID,
    assignee_name TEXT,
    assignee_email TEXT,
    assignee_avatar TEXT,
    category_id TEXT,
    category_name TEXT,
    category_color TEXT,
    category_icon TEXT,
    due_date DATE,
    priority TEXT,
    status TEXT,
    is_recurring BOOLEAN,
    eat_that_frog BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.title, t.description, t.assignee_id,
        u.name as assignee_name, u.email as assignee_email, u.avatar_url as assignee_avatar,
        t.category_id, c.name as category_name, c.color as category_color, c.icon as category_icon,
        t.due_date, t.priority, t.status, t.is_recurring, t.eat_that_frog,
        t.created_at, t.updated_at
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.due_date ASC, 
             CASE t.priority 
                WHEN 'Urgent' THEN 1
                WHEN 'High' THEN 2  
                WHEN 'Medium' THEN 3
                WHEN 'Low' THEN 4
             END ASC;
END;
$$ LANGUAGE plpgsql;

-- Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_tasks INTEGER,
    completed_tasks INTEGER,
    pending_tasks INTEGER,
    overdue_tasks INTEGER,
    completion_rate DECIMAL,
    total_time_minutes INTEGER,
    frogs_eaten INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tasks,
        COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::INTEGER as completed_tasks,
        COUNT(CASE WHEN t.status != 'Done' THEN 1 END)::INTEGER as pending_tasks,
        COUNT(CASE WHEN t.status != 'Done' AND t.due_date < CURRENT_DATE THEN 1 END)::INTEGER as overdue_tasks,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
            ELSE 0 
        END as completion_rate,
        COALESCE(SUM(te.duration_minutes), 0)::INTEGER as total_time_minutes,
        COUNT(CASE WHEN t.eat_that_frog = true AND t.status = 'Done' THEN 1 END)::INTEGER as frogs_eaten
    FROM tasks t
    LEFT JOIN time_entries te ON t.id = te.task_id
    WHERE t.assignee_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample users
INSERT INTO users (id, name, email, avatar_url, role, department) VALUES
('00000000-0000-0000-0000-000000000001', 'Alex Johnson', 'alex@teamtaskflow.com', 'https://i.pravatar.cc/150?img=1', 'admin', 'Management'),
('00000000-0000-0000-0000-000000000002', 'Sarah Wilson', 'sarah@teamtaskflow.com', 'https://i.pravatar.cc/150?img=2', 'manager', 'Development'),
('00000000-0000-0000-0000-000000000003', 'Mike Chen', 'mike@teamtaskflow.com', 'https://i.pravatar.cc/150?img=3', 'member', 'Development'),
('00000000-0000-0000-0000-000000000004', 'Emma Davis', 'emma@teamtaskflow.com', 'https://i.pravatar.cc/150?img=4', 'member', 'Design')
ON CONFLICT (id) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (id, name, color, description, icon, type, parent_id, "order", created_by) VALUES
-- Main Categories
('cat-main-kerjaan', 'Kerjaan', '#3B82F6', 'Semua tugas terkait pekerjaan', '🏢', 'main', NULL, 1, '00000000-0000-0000-0000-000000000001'),
('cat-main-personal', 'Personal', '#EC4899', 'Tugas-tugas pribadi', '🏠', 'main', NULL, 2, '00000000-0000-0000-0000-000000000001'),

-- Work Subcategories
('cat-sub-meeting', 'Meeting Customer', '#60A5FA', 'Meeting dan komunikasi dengan client', '👥', 'sub', 'cat-main-kerjaan', 1, '00000000-0000-0000-0000-000000000001'),
('cat-sub-imers', 'Imers', '#10B981', 'Tugas imers dan proyek khusus', '💰', 'sub', 'cat-main-kerjaan', 2, '00000000-0000-0000-0000-000000000001'),
('cat-sub-development', 'Development', '#8B5CF6', 'Coding, development, dan technical tasks', '🔧', 'sub', 'cat-main-kerjaan', 3, '00000000-0000-0000-0000-000000000001'),
('cat-sub-admin', 'Admin', '#F59E0B', 'Administrative tasks dan dokumentasi', '📊', 'sub', 'cat-main-kerjaan', 4, '00000000-0000-0000-0000-000000000001'),

-- Personal Subcategories
('cat-sub-olahraga', 'Olahraga', '#EF4444', 'Aktivitas fisik dan kesehatan', '🏃‍♂️', 'sub', 'cat-main-personal', 1, '00000000-0000-0000-0000-000000000001'),
('cat-sub-belajar', 'Belajar', '#6366F1', 'Learning dan self improvement', '📚', 'sub', 'cat-main-personal', 2, '00000000-0000-0000-0000-000000000001'),
('cat-sub-masak', 'Masak', '#FACC15', 'Memasak dan urusan dapur', '🍳', 'sub', 'cat-main-personal', 3, '00000000-0000-0000-0000-000000000001'),
('cat-sub-hobi', 'Hobi', '#14B8A6', 'Hobi dan aktivitas rekreasi', '🎮', 'sub', 'cat-main-personal', 4, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (title, description, assignee_id, created_by, category_id, due_date, priority, status, eat_that_frog) VALUES
('Setup Team TaskFlow Database', 'Configure Supabase database dengan schema lengkap dan sample data', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'cat-sub-development', CURRENT_DATE + INTERVAL '2 days', 'High', 'In Progress', true),
('Client Meeting - Q4 Planning', 'Quarterly planning meeting dengan major client untuk review progress', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'cat-sub-meeting', CURRENT_DATE + INTERVAL '5 days', 'Urgent', 'To Do', true),
('UI/UX Design Review', 'Review dan approve new dashboard designs untuk better user experience', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'cat-sub-development', CURRENT_DATE + INTERVAL '3 days', 'Medium', 'To Do', false),
('Morning Workout', 'Daily exercise routine - 30 menit cardio dan strength training', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'cat-sub-olahraga', CURRENT_DATE + INTERVAL '1 day', 'Medium', 'To Do', false),
('Learn Advanced React', 'Study React hooks, context, dan performance optimization techniques', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'cat-sub-belajar', CURRENT_DATE + INTERVAL '7 days', 'Low', 'To Do', false),
('Masak Menu Sehat', 'Prep meal untuk seminggu - focus pada protein dan sayuran', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'cat-sub-masak', CURRENT_DATE + INTERVAL '2 days', 'Low', 'To Do', false)
ON CONFLICT DO NOTHING;

-- Insert sample user preferences
INSERT INTO user_preferences (user_id, theme, dashboard_layout, pomodoro_work_minutes) VALUES
('00000000-0000-0000-0000-000000000001', 'light', '{"view": "kanban", "columns": ["To Do", "In Progress", "Review", "Done"]}', 25),
('00000000-0000-0000-0000-000000000002', 'dark', '{"view": "list", "columns": ["To Do", "In Progress", "Done"]}', 30),
('00000000-0000-0000-0000-000000000003', 'light', '{"view": "calendar", "columns": ["To Do", "In Progress", "Review", "Done"]}', 25),
('00000000-0000-0000-0000-000000000004', 'auto', '{"view": "kanban", "columns": ["To Do", "In Progress", "Done"]}', 20)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Tasks with full details view
CREATE OR REPLACE VIEW tasks_detailed AS
SELECT 
    t.id, t.title, t.description, 
    t.assignee_id, u.name as assignee_name, u.email as assignee_email, u.avatar_url as assignee_avatar,
    t.category_id, c.name as category_name, c.color as category_color, c.icon as category_icon,
    c.type as category_type, c.parent_id as category_parent_id,
    t.due_date, t.priority, t.status, t.is_recurring, t.eat_that_frog,
    t.estimated_hours, t.actual_hours, t.reminder_at,
    t.created_at, t.updated_at, t.completed_at
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id  
LEFT JOIN categories c ON t.category_id = c.id;

-- User dashboard stats view
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status != 'Done' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.status != 'Done' AND t.due_date < CURRENT_DATE THEN 1 END) as overdue_tasks,
    COUNT(CASE WHEN t.eat_that_frog = true AND t.status = 'Done' THEN 1 END) as frogs_eaten,
    COALESCE(SUM(te.duration_minutes), 0) as total_time_minutes
FROM users u
LEFT JOIN tasks t ON u.id = t.assignee_id
LEFT JOIN time_entries te ON t.id = te.task_id
GROUP BY u.id, u.name;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===== TEAM TASKFLOW DATABASE SETUP COMPLETE! =====';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLES CREATED:';
    RAISE NOTICE '   ✅ users (4 sample users)';
    RAISE NOTICE '   ✅ categories (10 categories with hierarchy)';  
    RAISE NOTICE '   ✅ tasks (6 sample tasks with variety)';
    RAISE NOTICE '   ✅ task_comments (for task discussions)';
    RAISE NOTICE '   ✅ time_entries (for time tracking & pomodoro)';
    RAISE NOTICE '   ✅ notifications (for user alerts)';
    RAISE NOTICE '   ✅ user_preferences (for personalization)';
    RAISE NOTICE '   ✅ activity_logs (for audit trail)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SECURITY:';
    RAISE NOTICE '   ✅ Row Level Security (RLS) enabled';
    RAISE NOTICE '   ✅ Policies configured for authenticated access';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ PERFORMANCE:';
    RAISE NOTICE '   ✅ Comprehensive indexes created';
    RAISE NOTICE '   ✅ Full-text search ready (Indonesian)';
    RAISE NOTICE '   ✅ Auto-updating timestamps';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 READY TO USE:';
    RAISE NOTICE '   ✅ Utility functions available';
    RAISE NOTICE '   ✅ Dashboard views created';
    RAISE NOTICE '   ✅ Sample data populated';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Your Team TaskFlow app is now ready!';
    RAISE NOTICE '   Test connection at: http://localhost:5173';
    RAISE NOTICE '';
END $$;