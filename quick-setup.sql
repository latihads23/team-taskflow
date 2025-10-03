-- =============================================
-- QUICK SETUP FOR TEAM TASKFLOW AUTHENTICATION
-- =============================================
-- Copy and paste this into Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT DEFAULT 'https://i.pravatar.cc/150?img=1',
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    type VARCHAR(20) DEFAULT 'main' CHECK (type IN ('main', 'sub')),
    parent_id VARCHAR(50) REFERENCES categories(id) ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Review', 'Done')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100),
    recurrence_end_date DATE,
    original_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    eat_that_frog BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for authenticated users
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "All users can view categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "All users can view tasks" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create tasks" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update tasks" ON tasks FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Auto-create user profile trigger
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Sample data
INSERT INTO categories (id, name, color, description, icon, type, "order") VALUES
('cat-main-work', 'Work', '#3B82F6', 'Work-related tasks', '🏢', 'main', 1),
('cat-main-personal', 'Personal', '#EC4899', 'Personal tasks', '🏠', 'main', 2),
('cat-sub-meeting', 'Meetings', '#60A5FA', 'Client meetings and calls', '👥', 'sub', 1),
('cat-sub-development', 'Development', '#8B5CF6', 'Coding and development', '💻', 'sub', 2)
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Team TaskFlow database setup complete!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Enable Email Auth in Supabase Dashboard';
    RAISE NOTICE '2. Test your app at http://localhost:5173';
    RAISE NOTICE '3. Create your first user account';
END $$;