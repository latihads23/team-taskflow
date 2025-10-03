-- ====================================
-- DEBUG AUTH TRIGGER ISSUES
-- ====================================

-- First, let's check if trigger exists and is causing issues
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Temporarily disable the trigger to test signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Let's create a simpler version of the create_user_profile function
CREATE OR REPLACE FUNCTION create_user_profile_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Just create basic user profile without additional operations
    INSERT INTO user_profiles (user_id, email, username, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the whole signup
        RAISE NOTICE 'Profile creation failed: %', SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create the trigger again with the simpler function
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_simple();

-- Alternative: Create function to manually create profile after signup
CREATE OR REPLACE FUNCTION manual_create_user_profile(user_uuid UUID, user_email TEXT, display_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_profiles (user_id, email, username, full_name)
    VALUES (
        user_uuid,
        user_email,
        COALESCE(display_name, split_part(user_email, '@', 1)),
        COALESCE(display_name, user_email)
    ) ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    -- Create default categories
    INSERT INTO categories (user_id, name, description, color, icon) VALUES
    (user_uuid, 'Work', 'Work related tasks', '#3B82F6', 'briefcase'),
    (user_uuid, 'Personal', 'Personal tasks and goals', '#10B981', 'user'),
    (user_uuid, 'Learning', 'Education and skill development', '#8B5CF6', 'book-open'),
    (user_uuid, 'Health', 'Health and fitness goals', '#EF4444', 'heart')
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Create user preferences
    INSERT INTO user_preferences (user_id) VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'User profile created successfully for %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check for any constraint violations
SELECT 
    conname,
    contype,
    conrelid::regclass,
    pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass;