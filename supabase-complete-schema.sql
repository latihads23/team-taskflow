-- ============================================
-- TEAM TASKFLOW - COMPLETE DATABASE SCHEMA
-- ============================================
-- This script creates all tables needed for the Team TaskFlow application
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Store user profiles and information
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. AUTH_USERS TABLE 
-- ============================================
-- Store authentication credentials (simplified for demo)
-- In production, you'd use Supabase Auth instead
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- In production, use proper hashing
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TASKS TABLE
-- ============================================
-- Main tasks with all features: recurring, priorities, etc.
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assignee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT NOT NULL CHECK (status IN ('To Do', 'In Progress', 'Done')),
  reminder_at TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT CHECK (recurrence_rule IN ('daily', 'weekly', 'monthly') OR recurrence_rule IS NULL),
  recurrence_end_date DATE,
  original_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ACTIVITY_LOGS TABLE
-- ============================================
-- Track all user activities and system events
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', etc.
  message TEXT NOT NULL,
  details JSONB, -- Store additional context as JSON
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. CHAT_MESSAGES TABLE
-- ============================================
-- Store AI chat history for each user
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- Optional task context
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  session_id UUID, -- Group messages by chat session
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. USER_PREFERENCES TABLE
-- ============================================
-- Store user settings and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  default_view TEXT DEFAULT 'board' CHECK (default_view IN ('board', 'calendar')),
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  preferences JSONB DEFAULT '{}', -- Store additional preferences as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. TASK_COMMENTS TABLE
-- ============================================
-- Comments and notes on tasks
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs public comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. TASK_ATTACHMENTS TABLE
-- ============================================
-- File attachments for tasks
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in storage bucket
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Tasks indexes  
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_original_task_id ON tasks(original_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON tasks(is_recurring);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_task_id ON chat_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Task comments indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development (you can make these more restrictive later)
CREATE POLICY "Enable all operations for all users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all operations for all auth_users" ON auth_users FOR ALL USING (true);
CREATE POLICY "Enable all operations for all tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Enable all operations for all activity_logs" ON activity_logs FOR ALL USING (true);
CREATE POLICY "Enable all operations for all chat_messages" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Enable all operations for all user_preferences" ON user_preferences FOR ALL USING (true);
CREATE POLICY "Enable all operations for all task_comments" ON task_comments FOR ALL USING (true);
CREATE POLICY "Enable all operations for all task_attachments" ON task_attachments FOR ALL USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON auth_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample users
INSERT INTO users (id, name, email, avatar_url, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'Alex Johnson', 'alex.johnson@example.com', 'https://i.pravatar.cc/150?u=u1', 'admin'),
('00000000-0000-0000-0000-000000000002', 'Maria Garcia', 'maria.garcia@example.com', 'https://i.pravatar.cc/150?u=u2', 'user'),
('00000000-0000-0000-0000-000000000003', 'James Smith', 'james.smith@example.com', 'https://i.pravatar.cc/150?u=u3', 'user'),
('00000000-0000-0000-0000-000000000004', 'Li Wei', 'li.wei@example.com', 'https://i.pravatar.cc/150?u=u4', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample auth credentials (password is 'password123' - use proper hashing in production)
INSERT INTO auth_users (user_id, email, password_hash) VALUES 
((SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 'alex.johnson@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
((SELECT id FROM users WHERE email = 'maria.garcia@example.com'), 'maria.garcia@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
((SELECT id FROM users WHERE email = 'james.smith@example.com'), 'james.smith@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
((SELECT id FROM users WHERE email = 'li.wei@example.com'), 'li.wei@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (title, description, assignee_id, created_by, due_date, priority, status) VALUES 
('Setup Project Environment', 'Configure development environment and initialize project repository', 
 (SELECT id FROM users WHERE email = 'alex.johnson@example.com'),
 (SELECT id FROM users WHERE email = 'alex.johnson@example.com'),
 '2025-09-12', 'High', 'In Progress'),

('Design User Interface', 'Create mockups and wireframes for the main application interface', 
 (SELECT id FROM users WHERE email = 'maria.garcia@example.com'),
 (SELECT id FROM users WHERE email = 'alex.johnson@example.com'),
 '2025-09-14', 'Medium', 'To Do'),

('Implement Authentication', 'Set up user login and registration functionality', 
 (SELECT id FROM users WHERE email = 'james.smith@example.com'),
 (SELECT id FROM users WHERE email = 'alex.johnson@example.com'),
 '2025-09-15', 'High', 'To Do'),

('Database Migration', 'Migrate from Firebase to Supabase database', 
 (SELECT id FROM users WHERE email = 'alex.johnson@example.com'),
 (SELECT id FROM users WHERE email = 'alex.johnson@example.com'),
 '2025-09-11', 'Urgent', 'Done'),

('AI Integration Testing', 'Test Gemini AI integration with task parsing', 
 (SELECT id FROM users WHERE email = 'li.wei@example.com'),
 (SELECT id FROM users WHERE email = 'alex.johnson@example.com'),
 '2025-09-13', 'Medium', 'To Do');

-- Insert sample user preferences
INSERT INTO user_preferences (user_id, theme, default_view, notifications_enabled) VALUES 
((SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 'dark', 'board', true),
((SELECT id FROM users WHERE email = 'maria.garcia@example.com'), 'light', 'calendar', true),
((SELECT id FROM users WHERE email = 'james.smith@example.com'), 'light', 'board', false),
((SELECT id FROM users WHERE email = 'li.wei@example.com'), 'dark', 'board', true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample activity logs
INSERT INTO activity_logs (user_id, task_id, action, message) VALUES 
((SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 
 (SELECT id FROM tasks WHERE title = 'Database Migration' LIMIT 1),
 'created', 'Created task "Database Migration"'),

((SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 
 (SELECT id FROM tasks WHERE title = 'Database Migration' LIMIT 1),
 'status_changed', 'Moved task "Database Migration" to Done'),

((SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 
 (SELECT id FROM tasks WHERE title = 'Setup Project Environment' LIMIT 1),
 'created', 'Created task "Setup Project Environment"'),

((SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 
 (SELECT id FROM tasks WHERE title = 'Design User Interface' LIMIT 1),
 'created', 'Created task "Design User Interface"'),

((SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 
 (SELECT id FROM tasks WHERE title = 'Implement Authentication' LIMIT 1),
 'created', 'Created task "Implement Authentication"');

-- ============================================
-- USEFUL VIEWS FOR QUERIES
-- ============================================

-- View combining users with their task counts
CREATE OR REPLACE VIEW user_task_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.avatar_url,
    u.role,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'To Do' THEN 1 END) as todo_tasks,
    COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as completed_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.assignee_id
GROUP BY u.id, u.name, u.email, u.avatar_url, u.role;

-- View for recent activity feed
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    al.id,
    al.message,
    al.action,
    al.created_at,
    u.name as user_name,
    u.avatar_url as user_avatar,
    t.title as task_title
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN tasks t ON al.task_id = t.id
ORDER BY al.created_at DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Team TaskFlow database setup completed successfully!';
    RAISE NOTICE '✅ Created tables: users, auth_users, tasks, activity_logs, chat_messages, user_preferences, task_comments, task_attachments';
    RAISE NOTICE '✅ Added indexes for performance optimization';
    RAISE NOTICE '✅ Enabled Row Level Security (RLS) with permissive policies';
    RAISE NOTICE '✅ Created triggers for automatic updated_at timestamps';
    RAISE NOTICE '✅ Inserted sample data for testing';
    RAISE NOTICE '✅ Created useful views for common queries';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Sample Data Summary:';
    RAISE NOTICE '   - 4 Users: Alex Johnson (admin), Maria Garcia, James Smith, Li Wei';
    RAISE NOTICE '   - 5 Tasks with different priorities and statuses';
    RAISE NOTICE '   - Activity logs for task creation and status changes';
    RAISE NOTICE '   - User preferences for personalization';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your Team TaskFlow database is ready to use!';
END $$;
