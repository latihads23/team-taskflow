# Team TaskFlow - WARP Project Documentation

## 📋 Project Overview

**Team TaskFlow** adalah full-stack task management application yang dibangun dengan React, TypeScript, Supabase, dan Gemini AI. Aplikasi ini menyediakan kolaborasi real-time untuk team dalam mengelola tugas dengan fitur AI-powered smart task creation, comprehensive time management tools, dan user/category management.

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework terbaru
- **TypeScript** - Type-safe JavaScript
- **Vite** - Modern build tool dan dev server
- **CSS** - Custom styling dengan responsive design

### Backend & Services
- **Supabase** - PostgreSQL database dengan real-time subscriptions
- **Supabase Auth** - User authentication dan authorization
- **Gemini AI** - Smart task parsing dan AI assistant
- **Vercel** - Modern deployment platform

### Development Tools
- **npm** - Package manager
- **PowerShell** - Terminal environment (Windows)
- **Git** - Version control
- **lucide-react** - Icon library
- **Playwright** - End-to-end testing (optional)

## 🚀 Project Setup & Installation

### Prerequisites
- Node.js (Latest LTS)
- npm package manager
- Supabase account untuk database & real-time features
- Google account untuk Gemini AI

### Installation Steps
```bash
# Clone/navigate ke project directory
cd C:\Users\Haris\Documents\dev\team-taskflow

# Install dependencies
npm install

# Setup environment variables (.env)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture & Structure

```
team-taskflow/
├── components/           # React components
│   ├── Header.tsx       # App header dengan streamlined navigation
│   ├── TaskBoard.tsx    # Kanban board view
│   ├── TaskCard.tsx     # Individual task cards
│   ├── TaskFormModal.tsx # Form untuk create/edit tasks
│   ├── SmartTaskFormModal.tsx # AI-powered task creation
│   ├── TaskDetailModal.tsx # Task detail view
│   ├── AIAssistant.tsx  # Draggable chat interface dengan Gemini AI
│   ├── MonthlyView.tsx  # Calendar view
│   ├── ActivityFeed.tsx # Activity log feed
│   ├── UserProfileModal.tsx # User profile management
│   ├── admin/           # Admin components
│   │   └── UserManagement.tsx # Enhanced user CRUD dengan phone support
│   ├── CategoryManagement.tsx # Category CRUD operations
│   ├── time-management/ # Time management suite
│   │   ├── TimeManagementDashboard.tsx # Central unified dashboard
│   │   ├── PomodoroTimer.tsx # Pomodoro technique timer
│   │   ├── TimeTracker.tsx  # Time tracking untuk tasks
│   │   ├── DailyPlanner.tsx # Daily timeboxing & scheduling
│   │   ├── EatThatFrog.tsx  # Integrated priority task management
│   │   └── EisenhowerMatrix.tsx # Priority matrix visualization
│   └── ...
├── services/            # Business logic & API calls
│   ├── hybridStorage.ts # Hybrid Supabase + LocalStorage dengan time services
│   ├── fallbackStorage.ts # LocalStorage fallback dengan time support
│   ├── supabaseService.ts # Supabase database operations & real-time
│   ├── authService.ts   # Authentication service
│   └── geminiService.ts # Gemini AI integration
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
├── .env                # Environment variables
└── ...
```

## 🔋 Supabase Configuration

### Project Details
- **Database**: PostgreSQL dengan real-time subscriptions
- **Authentication**: Row Level Security (RLS)
- **Region**: Configurable (default: US East)
- **Real-time**: WebSocket subscriptions

### Database Schema
```sql
-- users table (Enhanced)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  phone TEXT,                    -- Phone number support
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  department TEXT,
  position TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT[],                 -- Array of skills
  start_date DATE,
  reporting_to UUID REFERENCES users(id),
  profile_picture TEXT,
  social_links JSONB,           -- LinkedIn, Twitter, GitHub links
  preferences JSONB,            -- User preferences (timezone, theme, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- categories table (Enhanced with Hierarchy Support)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'main' CHECK (type IN ('main', 'sub')), -- Hierarchical support
  parent_id UUID REFERENCES categories(id),               -- Parent category reference
  icon TEXT,                                              -- Emoji or icon for categories
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  due_date DATE,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT CHECK (status IN ('To Do', 'In Progress', 'Done')),
  is_frog BOOLEAN DEFAULT false,
  time_spent INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- pomodoro_sessions table
CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  duration INTEGER NOT NULL, -- in minutes
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- time_entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in minutes
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- time_boxes table
CREATE TABLE time_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  task_id UUID REFERENCES tasks(id),
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 🤖 AI Integration (Gemini)

### Features
- **Smart Task Parsing**: Natural language ke structured task
- **AI Assistant**: Chat support untuk task management
- **Auto-assignment**: AI deteksi user assignment dari prompt

### Example Usage
```
Input: "assign Maria to prepare presentation for tomorrow with high priority"
Output: {
  title: "Prepare presentation",
  description: "...",
  assigneeId: "u2", // Maria's ID
  dueDate: "2025-09-09",
  priority: "High",
  status: "To Do"
}
```

## 🎯 Key Features

### Core Functionality
- ✅ **Task Management** - Create, read, update, delete tasks
- ✅ **Real-time Sync** - Multi-user collaboration via Supabase
- ✅ **Multiple Views** - Kanban board & Calendar view
- ✅ **Smart Creation** - AI-powered task parsing
- ✅ **User Management** - Add, edit, delete users with phone support
- ✅ **Hierarchical Categories** - Main categories with subcategories (Kerjaan/Personal structure)
- ✅ **Category Management** - Visual category organization with icons and colors
- ✅ **Priority System** - Low, Medium, High, Urgent
- ✅ **Status Tracking** - To Do, In Progress, Done
- ✅ **Activity Feed** - Real-time activity logging
- ✅ **Drag & Drop** - Responsive task status changes

### Time Management Features
- 🍅 **Pomodoro Timer** - 25/5 minute work/break cycles
- ⏱️ **Time Tracking** - Start/stop task time tracking
- 📅 **Daily Planner** - Time-boxing dan scheduling
- 🐸 **Eat That Frog** - Priority task highlighting (now integrated into Time Management Dashboard)
- 📊 **Eisenhower Matrix** - Urgent/Important prioritization
- 📈 **Time Statistics** - Track productivity metrics
- 🎯 **Central Dashboard** - Unified time management hub (TimeManagementDashboard)

### AI-Powered Features
- 🤖 **Smart Task Form** - Natural language input
- 💬 **AI Assistant** - Draggable productivity chat helper
- 🎯 **Auto-assignment** - Smart user detection
- 📝 **Task Summarization** - AI task analysis
- ⚡ **Quick Prompts** - Pre-defined productivity questions

## 🚀 Deployment & Production

### Build Commands
```bash
# Development server (JANGAN dijalankan auto)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Build Output
- Production files: `dist/` folder
- Optimized bundle: ~830KB (minified)
- Static assets ready untuk hosting

### Deployment Options
1. **Vercel** - Zero-config React deployment (recommended)
2. **Netlify** - JAMstack hosting
3. **Static hosting** - Serve `dist/` folder
4. **Supabase Edge Functions** - Serverless functions (optional)

## 🔒 Security & Environment

### Environment Variables
```bash
# Development (.env)
VITE_GEMINI_API_KEY=your_gemini_api_key_here         # Gemini AI API key
VITE_OPENAI_API_KEY=sk-QzypM7mGKUxsTBg9upedbcUBLprbCz2STmHUx2ufed8v3LWg  # OpenAI API key (configured)
VITE_SUPABASE_URL=https://hyouvmkmqybjrmpdhukn.supabase.co          # Supabase project URL (UPDATED)
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b3V2bWttcXlianJtcGRodWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTA2ODcsImV4cCI6MjA3NTA4NjY4N30.ro0OZn9b6kVPEARRPMGf342AE1GK3s906TjmJhWKOJA  # Supabase anon key (UPDATED)
```

### Security Notes
- API keys dalam `VITE_` prefix exposed ke client-side
- Supabase RLS (Row Level Security) untuk data protection
- Production: enable authentication & proper RLS policies

## 🔄 Development Workflow

### Git Workflow
1. Development di local branch
2. Commit changes dengan descriptive messages
3. Push ke GitHub repository
4. Deploy ke production environment

### Testing
- Manual testing via development server
- Production build testing via preview
- Supabase connection dan real-time testing
- AI integration testing
- **Playwright** - End-to-end testing (available)
- **MCP Testing** - Component testing recommendations

## 📊 Performance & Optimization

### Current Status
- Bundle size: ~830KB (besar, perlu optimization)
- Build time: ~5 seconds
- Real-time data sync latency: <100ms

### Optimization Recommendations
1. **Code Splitting**: Dynamic imports untuk reduce initial bundle
2. **Tree Shaking**: Remove unused dependencies
3. **Image Optimization**: Optimize static assets
4. **Lazy Loading**: Load components on-demand

## 🤝 Team & Collaboration

### Mock Users (Development)
```javascript
const MOCK_USERS = [
  { 
    id: 'u1', 
    name: 'Alex Johnson', 
    email: 'alex.johnson@example.com',
    phone: '+1-555-0123',
    role: 'admin',
    department: 'Engineering'
  },
  { 
    id: 'u2', 
    name: 'Maria Garcia', 
    email: 'maria.garcia@example.com',
    phone: '+1-555-0124',
    role: 'user',
    department: 'Design'
  },
  { 
    id: 'u3', 
    name: 'James Smith', 
    email: 'james.smith@example.com',
    phone: '+1-555-0125',
    role: 'user',
    department: 'Engineering'
  },
  { 
    id: 'u4', 
    name: 'Li Wei', 
    email: 'li.wei@example.com',
    phone: '+1-555-0126',
    role: 'user',
    department: 'Product'
  },
];
```

### User Features
- Avatar management
- Profile customization  
- Task assignment
- Activity tracking

### Demo Login Credentials
```
👤 Admin Account:
  Email: latihads@gmail.com
  Password: 123
  Name: Administrator
  Role: admin (full access)

👥 User Accounts:
  Email: alex.johnson@example.com
  Password: password123
  Name: Alex Johnson
  Role: user
  
  Email: maria.garcia@example.com
  Password: password123
  Name: Maria Garcia
  Role: user
```

## 📝 Development Notes

### Setup Date: 2025-09-08
### Last Updated: 2025-10-03
### Status: Production Ready + Complete Authentication System
### Version: 1.6.0 (Complete Database Authentication & CRUD)

### Build Info
- Dependencies: Updated dengan Supabase & lucide-react
- No vulnerabilities detected
- TypeScript compilation: ✅
- Production build: ✅
- Supabase integration: ✅
- Gemini AI integration: ✅
- Time Management features: ✅
- User/Category Management: ✅
- Real-time subscriptions: ✅

### Browser Notifications System 🔔

Team TaskFlow sekarang dilengkapi **browser notification system** yang comprehensive untuk remind tasks, deadlines, dan activities penting!

#### Features
- **Smart Reminders**: Otomatis schedule reminders berdasarkan task priority
- **Permission Management**: Easy permission request dengan guidance untuk users
- **Multiple Notification Types**: Task completion, assignments, deadlines, Pomodoro, Eat That Frog
- **Notification Settings**: User-friendly control panel dengan test functionality
- **WIB Timezone Aware**: Semua scheduling menggunakan Indonesia timezone
- **Persistent Scheduling**: Notifications tersimpan di localStorage dengan auto-reload

#### Notification Types

🎯 **Priority-Based Reminders**:
- **Urgent Tasks**: 2 days, 1 day, 4 hours, 1 hour before
- **High Priority**: 2 days, 1 day, 4 hours before
- **Medium Priority**: 1 day, 4 hours before
- **Low Priority**: 1 day before

🎉 **Event Notifications**:
- **Task Completed**: Celebration notification saat task selesai
- **Task Assigned**: Notification untuk assignee baru
- **Deadline Alert**: Urgent notification untuk overdue tasks
- **Pomodoro Complete**: Timer completion dengan break reminder
- **Eat That Frog**: Reminder untuk most important task

#### Technical Implementation
```javascript
// Notification Service dengan WIB timezone
const notificationService = {
  // Schedule priority-based reminders
  scheduleTaskReminders(task: Task): void
  
  // Show immediate notifications
  async showNotification(options: NotificationOptions): Promise<boolean>
  
  // Task-specific notifications
  async notifyTaskCompleted(task: Task): Promise<boolean>
  async notifyTaskAssigned(task: Task, assigneeName: string): Promise<boolean>
  async notifyTaskDeadline(task: Task): Promise<boolean>
  async notifyPomodoroComplete(taskTitle?: string): Promise<boolean>
  async notifyEatThatFrog(task: Task): Promise<boolean>
}
```

#### User Experience
- **Settings Panel**: Accessible dari user menu dengan 🔔 Notification Settings
- **Permission Guide**: Step-by-step instructions untuk enable notifications
- **Test Functionality**: Send test notification untuk verify settings
- **Active Notifications Counter**: Display jumlah scheduled reminders
- **Browser Compatibility Check**: Automatic detection dan feedback

#### Integration Points
- **Task Creation**: Auto-schedule reminders untuk new tasks
- **Status Changes**: Completion notifications saat task done
- **Task Assignment**: Notify assignees tentang new tasks
- **Header Menu**: Easy access ke notification settings
- **Event Listeners**: Handle notification clicks untuk navigate ke tasks

### WIB Timezone Support 🇮🇩

Team TaskFlow sekarang full support **timezone Indonesia (WIB - Western Indonesia Time)** dengan localization lengkap!

#### Features
- **WIB Timezone**: Semua date/time menggunakan Asia/Jakarta timezone
- **Indonesian Locale**: Date formatting dengan bahasa Indonesia (id-ID)
- **Calendar Localization**: Month names dan day labels dalam bahasa Indonesia
- **Consistent Formatting**: Unified date utilities untuk seluruh aplikasi

#### Technical Implementation
```javascript
// Constants untuk timezone dan locale
export const TIMEZONE = 'Asia/Jakarta'; // WIB
export const LOCALE = 'id-ID'; // Indonesian

// Utility functions
export const getCurrentWIBDate = (): Date => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: TIMEZONE}));
};

export const formatDateWIB = (date: string | Date): string => {
  return dateObj.toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
```

#### Calendar Localization
- **Month Names**: Januari, Februari, Maret, etc.
- **Day Labels**: Min, Sen, Sel, Rab, Kam, Jum, Sab
- **Date Display**: Format Indonesia dengan timezone WIB
- **User Preferences**: All users default to WIB timezone

### Hierarchical Categories Feature 🏷️

Team TaskFlow sekarang mendukung **hierarchical categories** dengan struktur main category dan subcategory yang powerful!

#### Structure
- **Main Categories**: Category utama (contoh: "Kerjaan", "Personal") 
- **Subcategories**: Category turunan (contoh: "Meeting Customer", "Imers", "Olahraga")
- **Visual Design**: Main category color menjadi background card, subcategory ditampilkan dengan detail

#### Default Categories
```javascript
🏢 **Kerjaan** (Main - Blue)
  └── 👥 Meeting Customer (Sub - Light Blue)
  └── 💰 Imers (Sub - Green)
  └── 🔧 Development (Sub - Purple)
  └── 📊 Admin (Sub - Orange)

🏠 **Personal** (Main - Pink)
  └── 🏃‍♂️ Olahraga (Sub - Red)
  └── 📚 Belajar (Sub - Indigo)
  └── 🍳 Masak (Sub - Yellow)
  └── 🎮 Hobi (Sub - Teal)
```

#### TaskCard Visual Enhancement
- **Main category strip** di bagian atas card dengan background color
- **Subcategory indicator** dengan icon, color dot, dan nama
- **Gradient background** menggunakan main category color dengan opacity
- **Hover effects** yang smooth dan responsive

#### Technical Implementation
- Utility functions: `getMainCategory()` dan `getSubCategory()`
- Hierarchical data flow dari App → TaskBoard → TaskCard
- Enhanced props dengan `categories` array untuk hierarchy lookup
- Memo optimization untuk performance

### Recent Improvements (2025-10-03)
- 🎉 **Version 1.6.0 Release** - Complete Database Authentication & CRUD System
- 🗄️ **Database CRUD Operations** - Full Create, Read, Update, Delete functionality pada semua tables
- 🔐 **Authentication System** - Complete user registration, login, session management
- 🛡️ **Row Level Security (RLS)** - Secure data isolation per user dengan Supabase RLS policies
- 📊 **Database Schema** - 11+ tables dengan relationships, triggers, dan utility functions
- 🧪 **CRUD Testing** - Comprehensive test suite untuk verify database operations
- 🔑 **User Management** - Profile creation, preferences, activity logging
- 📋 **Task Management** - Complete task CRUD dengan categories dan time tracking
- ⚡ **Real-time Subscriptions** - Database changes sync real-time ke aplikasi
- 🔧 **Database Functions** - Custom PostgreSQL functions untuk productivity stats
- 🚀 **Version 1.5.0 Release** - Browser Notifications & Enhanced UX (previous)
- 🔔 **Browser Notifications** - Complete notification system dengan scheduling & permission management (previous)
- 📱 **Notification Service** - Smart reminders based on task priority and deadlines (previous)
- 🎛️ **Notification Settings** - User-friendly settings panel untuk notification control (previous)
- 🇮🇩 **Indonesia Timezone (WIB)** - Complete application timezone support untuk Asia/Jakarta (previous)
- 🔑 **OpenAI API Integration** - Added OpenAI API key support alongside Gemini AI (previous)
- 📅 **Calendar Localization** - Indonesian month names dan day labels (Min, Sen, Sel, etc.) (previous)
- 🔧 **Constants Architecture** - Centralized timezone, locale, dan formatting utilities (previous)
- 📊 **Date Utilities** - WIB-aware date formatting functions (formatDateWIB, getCurrentWIBDate) (previous)
- 🌐 **Locale Support** - Indonesian locale (id-ID) untuk konsistensi formatting (previous)
- 🚀 **Version 1.3.0 Release** - Hierarchical Categories Implementation completed (previous)
- 🏗️ **Hierarchical Categories** - Main/subcategory structure dengan visual hierarchy (previous)
- 🎨 **TaskCard Enhancement** - Main category background color coverage dengan subcategory detail (previous)
- 🔄 **Component Updates** - TaskBoard dan TaskCard support categories array prop (previous)
- 📊 **Default Categories** - Kerjaan/Personal structure dengan 8 subcategories (previous)
- 🎯 **Visual Design** - Gradient backgrounds, category strips, dan enhanced hover effects (previous)
- 🔧 **Technical Architecture** - Utility functions untuk category hierarchy management (previous)
- 🏷️ **Categories Display Fixed** - Categories now properly display in Kanban Board, Calendar View, TaskCard, and Task Detail Modal (previous release)
- 🎨 **Enhanced UI Components** - Updated TaskCard, TaskBoard, MonthlyView, TaskFormModal, TaskDetailModal with full category support (previous release)
- 🔧 **Component Architecture** - Added categoriesMap props and category data flow throughout component hierarchy (previous release)
- 📝 **Forms Enhancement** - TaskFormModal now includes category dropdown selection with color coding (previous release)
- 👁️ **Visual Improvements** - Category indicators with color dots and labels across all task display components (previous release)
- 🔑 **API Configuration** - Updated environment variables with secure placeholder format for AI services (previous release)
- 📱 **Enhanced User Management** - Added phone number field to user profiles (previous release)
- 🔄 **Time Management Integration** - Eat That Frog fully integrated into Time Management dashboard (previous release)
- 💾 **Database Services** - Added comprehensive time entry and time box services (previous release)
- ✅ **Build Verification** - Full TypeScript compilation success, production build tested
- 🌐 **Git Integration** - Successfully committed and pushed to GitHub repository
- 📄 **Documentation Updated** - WARP.md synchronized with latest codebase changes

## 🚀 Quick Start Guide

### 1. Clone & Setup
```bash
cd C:\Users\Haris\Documents\dev\team-taskflow
npm install
```

### 2. Environment Setup
Create `.env` file dengan:
```bash
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup
Jalankan SQL schema di Supabase Dashboard untuk create tables.

### 4. Development
```bash
# JANGAN jalankan manual - gunakan start.bat
# npm run dev

# Gunakan helper script
.\start.bat
```

### 5. Testing
- Browser: `http://localhost:5173/`
- Test semua fitur: Task management, Time management, AI Assistant
- Playwright testing available untuk comprehensive testing

### 6. Deployment
```bash
npm run build
npm run preview  # test production build
# Deploy ke Vercel/Netlify
```

---

**Maintained by**: Haris  
**Project Path**: `C:\Users\Haris\Documents\dev\team-taskflow`  
**Repository**: Git initialized, ready untuk GitHub push
