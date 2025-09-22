-- Extended Team TaskFlow Database Schema
-- Includes: Users, Categories, Tasks with full management capabilities

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table for task organization
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color code
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, created_by) -- Unique category name per user
);

-- Enhanced tasks table with categories and improved fields
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done')),
    reminder_at TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(20) CHECK (recurrence_rule IN ('daily', 'weekly', 'monthly')),
    recurrence_end_date DATE,
    original_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    estimated_duration INTEGER DEFAULT 30, -- in minutes
    actual_time_spent INTEGER DEFAULT 0, -- in minutes
    is_eat_that_frog BOOLEAN DEFAULT false,
    eat_that_frog_date DATE, -- Date when this task is the "frog"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_recurrence CHECK (
        (is_recurring = false) OR 
        (is_recurring = true AND recurrence_rule IS NOT NULL)
    ),
    CONSTRAINT valid_eat_that_frog CHECK (
        (is_eat_that_frog = false) OR 
        (is_eat_that_frog = true AND eat_that_frog_date IS NOT NULL)
    )
);

-- Time entries table for time tracking
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER NOT NULL DEFAULT 0, -- in seconds
    description TEXT,
    is_manual BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time boxes table for daily planning
CREATE TABLE IF NOT EXISTS time_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#0ea5e9',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily plans table for eat that frog tracking
CREATE TABLE IF NOT EXISTS daily_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    eat_that_frog_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    total_planned_minutes INTEGER DEFAULT 0,
    actual_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_eat_that_frog ON tasks(is_eat_that_frog, eat_that_frog_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_boxes_user ON time_boxes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_plans_updated_at BEFORE UPDATE ON daily_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (id, name, email, avatar_url, role, is_active) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@taskflow.com', 'https://i.pravatar.cc/150?u=admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert default users
INSERT INTO users (id, name, email, avatar_url, role, is_active) VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Alex Johnson', 'alex.johnson@taskflow.com', 'https://i.pravatar.cc/150?u=alex', 'user', true),
    ('00000000-0000-0000-0000-000000000003', 'Maria Garcia', 'maria.garcia@taskflow.com', 'https://i.pravatar.cc/150?u=maria', 'user', true),
    ('00000000-0000-0000-0000-000000000004', 'James Smith', 'james.smith@taskflow.com', 'https://i.pravatar.cc/150?u=james', 'user', true),
    ('00000000-0000-0000-0000-000000000005', 'Li Wei', 'li.wei@taskflow.com', 'https://i.pravatar.cc/150?u=liwei', 'user', true)
ON CONFLICT (email) DO NOTHING;

-- Insert default categories
INSERT INTO categories (id, name, color, description, created_by) VALUES 
    ('00000000-0000-0000-0000-000000000101', 'Work', '#3B82F6', 'Work-related tasks', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000102', 'Personal', '#10B981', 'Personal tasks and goals', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000103', 'Project', '#F59E0B', 'Project-specific tasks', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000104', 'Meeting', '#EF4444', 'Meetings and appointments', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000105', 'Learning', '#8B5CF6', 'Learning and development', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all active users" ON users FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Categories policies
CREATE POLICY "Users can view all categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Admins can manage all categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Tasks policies
CREATE POLICY "Users can view tasks assigned to them or created by them" ON tasks FOR SELECT TO authenticated USING (
    assignee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update tasks assigned to them" ON tasks FOR UPDATE TO authenticated USING (
    assignee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can delete tasks assigned to them" ON tasks FOR DELETE TO authenticated USING (
    assignee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Time entries policies
CREATE POLICY "Users can manage their own time entries" ON time_entries FOR ALL TO authenticated USING (user_id = auth.uid());

-- Time boxes policies
CREATE POLICY "Users can manage their own time boxes" ON time_boxes FOR ALL TO authenticated USING (user_id = auth.uid());

-- Daily plans policies
CREATE POLICY "Users can manage their own daily plans" ON daily_plans FOR ALL TO authenticated USING (user_id = auth.uid());