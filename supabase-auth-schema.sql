-- =============================================
-- TEAM TASKFLOW - AUTHENTICATION SCHEMA
-- =============================================
-- 🔐 Complete authentication setup for Supabase
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USER PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT DEFAULT 'https://i.pravatar.cc/150?img=1',
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{
        "theme": "light",
        "language": "en",
        "timezone": "Asia/Jakarta",
        "notifications": {
            "email": true,
            "push": true,
            "daily_digest": true
        }
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. USER SESSIONS TABLE (for custom session management)
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. AUTHENTICATION LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'failed_login', 'password_change'
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON auth_logs(created_at);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://i.pravatar.cc/150?img=' || (RANDOM() * 50)::INTEGER)
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ language 'plpgsql';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Auth logs policies (admin only)
CREATE POLICY "Admins can view auth logs" ON auth_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Get user profile with auth info
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    email TEXT,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT,
    department TEXT,
    is_active BOOLEAN,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        au.email,
        up.username,
        up.full_name,
        up.avatar_url,
        up.role,
        up.department,
        up.is_active,
        up.last_login,
        up.preferences,
        up.created_at
    FROM user_profiles up
    JOIN auth.users au ON up.id = au.id
    WHERE up.id = user_uuid AND up.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update last login
CREATE OR REPLACE FUNCTION update_last_login(user_uuid UUID DEFAULT auth.uid())
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET last_login = NOW() 
    WHERE id = user_uuid;
    
    INSERT INTO auth_logs (user_id, username, action, ip_address)
    SELECT 
        user_uuid,
        up.username,
        'login',
        inet_client_addr()
    FROM user_profiles up
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role TEXT, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_uuid 
        AND role = required_role 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active user sessions
CREATE OR REPLACE FUNCTION get_user_sessions(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    session_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    is_current BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        LEFT(us.session_token, 8) || '...' as session_token,
        us.expires_at,
        us.ip_address::TEXT,
        us.user_agent,
        us.session_token = current_setting('request.jwt.claims', true)::json->>'session_token' as is_current,
        us.created_at
    FROM user_sessions us
    WHERE us.user_id = user_uuid 
    AND us.is_active = true 
    AND us.expires_at > NOW()
    ORDER BY us.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample admin user (you'll need to create this user in Supabase Auth first)
-- This is just for reference - actual user creation should be done via Supabase Auth

-- Example of how to create users programmatically:
/*
-- After user is created via Supabase Auth, update their profile:
UPDATE user_profiles 
SET 
    username = 'admin',
    full_name = 'System Administrator',
    role = 'admin',
    department = 'IT'
WHERE id = 'your-user-uuid-here';
*/

-- =============================================
-- SCHEDULED FUNCTIONS (Optional)
-- =============================================

-- Clean up expired sessions daily
-- You can set this up in Supabase Edge Functions or pg_cron
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions()');

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 ===== AUTHENTICATION SCHEMA SETUP COMPLETE! =====';
    RAISE NOTICE '';
    RAISE NOTICE '📋 TABLES CREATED:';
    RAISE NOTICE '   ✅ user_profiles (extends auth.users)';
    RAISE NOTICE '   ✅ user_sessions (session management)';
    RAISE NOTICE '   ✅ auth_logs (audit trail)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SECURITY FEATURES:';
    RAISE NOTICE '   ✅ Row Level Security (RLS) enabled';
    RAISE NOTICE '   ✅ Role-based access control';
    RAISE NOTICE '   ✅ Session management';
    RAISE NOTICE '   ✅ Authentication logging';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '   1️⃣ Enable Email Auth in Supabase Dashboard';
    RAISE NOTICE '   2️⃣ Configure Auth settings';
    RAISE NOTICE '   3️⃣ Create your first admin user';
    RAISE NOTICE '   4️⃣ Test login functionality';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Ready to implement frontend auth!';
    RAISE NOTICE '';
END $$;