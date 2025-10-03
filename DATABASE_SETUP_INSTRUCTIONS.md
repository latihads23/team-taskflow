# 🗄️ Database Setup Instructions

## 🎯 Setup Database Schema di Supabase

Karena Supabase REST API gak bisa execute DDL statements secara langsung, lo perlu run schema ini manual di Supabase Dashboard.

### 📋 Step-by-step:

#### 1. **Buka Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login ke account lo
   - Pilih project: **hyouvmkmqybjrmpdhukn**

#### 2. **Masuk ke SQL Editor**
   - Di sidebar kiri, klik **"SQL Editor"**
   - Klik **"New Query"**

#### 3. **Run Database Schema**
   - Copy seluruh content dari file: `supabase-complete-auth-schema.sql`
   - Paste ke SQL Editor
   - Klik **"Run"** button (atau tekan Ctrl+Enter)

#### 4. **Verify Tables Created**
   - Go to **"Table Editor"** di sidebar
   - Lo harus liat tables berikut:

   **✅ Authentication Tables:**
   - `user_profiles`
   - `user_sessions` 
   - `auth_logs`

   **✅ Task Management Tables:**
   - `categories`
   - `tasks`
   - `task_comments`
   - `time_entries`
   - `pomodoro_sessions`
   - `time_boxes`
   - `frog_tasks`

   **✅ Other Tables:**
   - `notifications`
   - `user_preferences`
   - `activity_logs`

---

## 🔧 Environment Variables

Udah setup di `.env.local`:

```env
VITE_SUPABASE_URL=https://hyouvmkmqybjrmpdhukn.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b3V2bWttcXlianJtcGRodWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTA2ODcsImV4cCI6MjA3NTA4NjY4N30.ro0OZn9b6kVPEARRPMGf342AE1GK3s906TjmJhWKOJA
```

---

## 🚀 What's Next?

Setelah database schema berhasil di-setup:

1. **Test Connection** - Pastikan aplikasi bisa connect ke database
2. **Setup Authentication** - Implement login/register functionality
3. **Test User Registration** - Buat user baru dan verify profile creation
4. **Implement Task Management** - CRUD operations untuk tasks
5. **Add Time Management** - Pomodoro, time tracking features

---

## 🐛 Troubleshooting

### ❌ **"Extension uuid-ossp does not exist"**
**Solution:** Enable extension di Supabase Dashboard:
1. Go to **Database** > **Extensions**
2. Search for "uuid-ossp" 
3. Click **Enable**

### ❌ **"Permission denied for schema auth"**
**Solution:** Run schema dengan service role key (bukan anon key):
1. Go to **Settings** > **API**
2. Copy **service_role** key
3. Use that for schema setup

### ❌ **"Trigger already exists"**
**Solution:** Normal, berarti schema udah partially installed. Continue aja.

---

## 🔍 Verify Setup

Run this query di SQL Editor untuk check semua tables:

```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected result: 11-13 tables created ✅

---

## 🎉 Ready to Code!

Setelah database setup selesai, lo siap untuk:
- Implement authentication service
- Build task management UI
- Add time tracking features
- Deploy ke production

**Need help?** Just ping me! 🤙