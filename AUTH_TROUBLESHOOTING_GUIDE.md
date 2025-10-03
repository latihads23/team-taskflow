# 🚨 AUTH TROUBLESHOOTING GUIDE

## ❌ **Current Issue:**
**"Database error saving new user"** - Even basic signup without triggers fails

## 🔍 **Root Cause Analysis:**
- ✅ Database schema is correct
- ✅ Tables are accessible  
- ✅ Functions exist and work
- ✅ RLS policies are working
- ❌ **Issue is in Supabase Auth configuration or database constraints**

## 🛠️ **SOLUTIONS (Try in order):**

### 1. **Fix Database Trigger (Most Likely)**
Run `debug-auth-trigger.sql` in Supabase SQL Editor:

```sql
-- This will disable problematic trigger and create safer version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION create_user_profile_simple()
RETURNS TRIGGER AS $$
BEGIN
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
        RAISE NOTICE 'Profile creation failed: %', SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_simple();
```

### 2. **Check Supabase Auth Settings**
Go to **Supabase Dashboard** → **Authentication** → **Settings**:

- ✅ **Disable email confirmation** temporarily:
  - Set "Enable email confirmations" to **OFF**
  
- ✅ **Check password requirements:**
  - Make sure password policy isn't too strict
  
- ✅ **Check rate limiting:**
  - Temporarily disable rate limiting

### 3. **Check Database Constraints**
Run this query in SQL Editor to check constraints:

```sql
-- Check user_profiles constraints
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass;

-- Check for unique constraints that might be violated
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles';
```

### 4. **Temporary Workaround: Disable Trigger**
If nothing works, disable the trigger completely:

```sql
-- Disable trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Test signup without auto profile creation
-- Then manually create profiles using: manual_create_user_profile()
```

### 5. **Manual Profile Creation Approach**
After successful signup, manually create profile:

```javascript
// After signup success
const { data: profileResult } = await supabase
    .rpc('manual_create_user_profile', {
        user_uuid: user.id,
        user_email: user.email,
        display_name: 'User Name'
    })
```

## 🧪 **Testing Steps:**

1. **Run debug fix:**
   ```bash
   # Copy debug-auth-trigger.sql to Supabase SQL Editor and run
   ```

2. **Test basic signup:**
   ```bash
   node test-auth-simple.js
   ```

3. **If successful, test full auth:**
   ```bash
   node test-auth-detailed.js
   ```

## 🎯 **Expected Results After Fix:**

```
✅ Basic signup successful!
✅ Manual profile creation successful!
✅ Login successful!
✅ Profile retrieved!
```

## 🔧 **Most Common Solutions:**

### **90% of cases:** Trigger function error
- **Fix:** Run `debug-auth-trigger.sql` 

### **5% of cases:** Email confirmation enabled
- **Fix:** Disable email confirmation in Auth settings

### **5% of cases:** Unique constraint violation  
- **Fix:** Check for duplicate usernames/emails

## 🚀 **After Fix:**

Once auth is working:

1. **Enable trigger back** (if disabled)
2. **Test complete auth flow**
3. **Integrate with existing TaskCard/MonthlyView**
4. **Add authentication to app routes**

## ⚡ **Quick Fix (Try First):**

1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Paste this:
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   ```
4. Run → Test auth again with `node test-auth-simple.js`

If signup works after disabling trigger, then trigger is the issue! 🎯

---

**Need help?** Run these commands and share results:
- `node check-database.js` 
- `node test-auth-simple.js`