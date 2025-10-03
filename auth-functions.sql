-- ====================================
-- AUTH SERVICE COMPATIBILITY FUNCTIONS
-- ====================================

-- Function to get user profile with preferences
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    username VARCHAR,
    full_name VARCHAR,
    avatar_url TEXT,
    role VARCHAR,
    department VARCHAR,
    is_active BOOLEAN,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.username,
        up.full_name,
        up.avatar_url,
        up.role,
        CAST(NULL AS VARCHAR) as department, -- Add department to user_profiles if needed
        up.is_active,
        up.last_login_at as last_login,
        COALESCE(
            jsonb_build_object(
                'theme', pref.theme,
                'language', pref.language,
                'timezone', pref.timezone,
                'notifications', jsonb_build_object(
                    'email', pref.email_notifications,
                    'push', pref.push_notifications,
                    'daily_digest', pref.daily_reminder
                )
            ),
            jsonb_build_object(
                'theme', 'light',
                'language', 'en',
                'timezone', 'UTC',
                'notifications', jsonb_build_object(
                    'email', true,
                    'push', true,
                    'daily_digest', true
                )
            )
        ) as preferences,
        up.created_at
    FROM user_profiles up
    LEFT JOIN user_preferences pref ON pref.user_id = up.user_id
    WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET last_login_at = NOW()
    WHERE user_id = auth.uid();
    
    -- Insert activity log
    INSERT INTO activity_logs (user_id, action, entity_type)
    VALUES (auth.uid(), 'login', 'auth');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default categories for new user
CREATE OR REPLACE FUNCTION create_default_categories_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO categories (user_id, name, description, color, icon) VALUES
    (user_uuid, 'Work', 'Work related tasks', '#3B82F6', 'briefcase'),
    (user_uuid, 'Personal', 'Personal tasks and goals', '#10B981', 'user'),
    (user_uuid, 'Learning', 'Education and skill development', '#8B5CF6', 'book-open'),
    (user_uuid, 'Health', 'Health and fitness goals', '#EF4444', 'heart');
    
    -- Create default user preferences
    INSERT INTO user_preferences (user_id) VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the create_user_profile function to include default categories
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO user_profiles (user_id, email, username, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Create default categories and preferences
    PERFORM create_default_categories_for_user(NEW.id);
    
    -- Log the signup
    INSERT INTO activity_logs (user_id, action, entity_type, new_values)
    VALUES (
        NEW.id,
        'signup',
        'auth',
        jsonb_build_object('email', NEW.email, 'signup_method', 'email')
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get user tasks with category info
CREATE OR REPLACE FUNCTION get_user_tasks(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    status VARCHAR,
    priority VARCHAR,
    due_date TIMESTAMP WITH TIME ZONE,
    category_name VARCHAR,
    category_color VARCHAR,
    tags TEXT[],
    is_frog_task BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        c.name as category_name,
        c.color as category_color,
        t.tags,
        t.is_frog_task,
        t.created_at,
        t.updated_at
    FROM tasks t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = user_uuid
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user categories
CREATE OR REPLACE FUNCTION get_user_categories(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    color VARCHAR,
    icon VARCHAR,
    task_count BIGINT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.color,
        c.icon,
        COUNT(t.id) as task_count,
        c.is_active
    FROM categories c
    LEFT JOIN tasks t ON t.category_id = c.id AND t.status != 'cancelled'
    WHERE c.user_id = user_uuid AND c.is_active = true
    GROUP BY c.id, c.name, c.description, c.color, c.icon, c.is_active
    ORDER BY c.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;