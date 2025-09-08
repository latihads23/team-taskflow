# Team TaskFlow - WARP Project Documentation

## 📋 Project Overview

**Team TaskFlow** adalah full-stack task management application yang dibangun dengan React, TypeScript, Firebase, dan Gemini AI. Aplikasi ini menyediakan kolaborasi real-time untuk team dalam mengelola tugas dengan fitur AI-powered smart task creation.

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework terbaru
- **TypeScript** - Type-safe JavaScript
- **Vite** - Modern build tool dan dev server
- **CSS** - Custom styling dengan responsive design

### Backend & Services
- **Firebase Firestore** - NoSQL database untuk real-time data
- **Firebase Hosting** - Static site hosting (optional)
- **Gemini AI** - Smart task parsing dan AI assistant

### Development Tools
- **npm** - Package manager
- **PowerShell** - Terminal environment
- **Git** - Version control

## 🚀 Project Setup & Installation

### Prerequisites
- Node.js (Latest LTS)
- npm package manager
- Google account untuk Firebase & Gemini AI

### Installation Steps
```bash
# Clone/navigate ke project directory
cd C:\Users\Haris\Documents\dev\team-taskflow

# Install dependencies
npm install

# Setup environment variables (.env.local)
VITE_GEMINI_API_KEY=AIzaSyBQTDHzCsMc_FQJlnmQPTsQFsgTveJt4D0
VITE_FIREBASE_API_KEY=AIzaSyCiSS2srdWvRZYi9_RVMrZZ4tLAdqCFnN0
VITE_FIREBASE_AUTH_DOMAIN=taskflow-369e2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=taskflow-369e2
VITE_FIREBASE_STORAGE_BUCKET=taskflow-369e2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=323073743006
VITE_FIREBASE_APP_ID=1:323073743006:web:8a86512961f3ca64c3038f

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture & Structure

```
team-taskflow/
├── components/           # React components
│   ├── Header.tsx       # App header dengan navigation
│   ├── TaskBoard.tsx    # Kanban board view
│   ├── TaskCard.tsx     # Individual task cards
│   ├── TaskFormModal.tsx # Form untuk create/edit tasks
│   ├── SmartTaskFormModal.tsx # AI-powered task creation
│   ├── TaskDetailModal.tsx # Task detail view
│   ├── AIAssistant.tsx  # Chat interface dengan Gemini AI
│   ├── MonthlyView.tsx  # Calendar view
│   ├── ActivityFeed.tsx # Activity log feed
│   ├── UserProfileModal.tsx # User profile management
│   └── ...
├── services/            # Business logic & API calls
│   ├── firebaseService.ts # Firestore database operations
│   └── geminiService.ts   # Gemini AI integration
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
├── firebaseConfig.ts   # Firebase configuration
└── ...
```

## 🔥 Firebase Configuration

### Project Details
- **Project ID**: `taskflow-369e2`
- **Database**: Firestore (NoSQL)
- **Region**: `asia-southeast1` (Singapore)
- **Rules**: Test mode (development)

### Firestore Collections
```javascript
// tasks collection structure
{
  id: string,
  title: string,
  description: string,
  assigneeId: string,
  dueDate: string, // YYYY-MM-DD
  priority: 'Low' | 'Medium' | 'High' | 'Urgent',
  status: 'To Do' | 'In Progress' | 'Done',
  reminderAt?: string,
  isRecurring?: boolean,
  recurrenceRule?: 'daily' | 'weekly' | 'monthly',
  recurrenceEndDate?: string,
  originalTaskId?: string
}
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
- ✅ **Real-time Sync** - Multi-user collaboration
- ✅ **Multiple Views** - Kanban board & Calendar view
- ✅ **Smart Creation** - AI-powered task parsing
- ✅ **User Assignment** - Multi-user task assignment
- ✅ **Priority System** - Low, Medium, High, Urgent
- ✅ **Status Tracking** - To Do, In Progress, Done
- ✅ **Activity Feed** - Real-time activity logging
- ✅ **Recurring Tasks** - Daily, weekly, monthly repetition

### AI-Powered Features
- 🤖 **Smart Task Form** - Natural language input
- 💬 **AI Assistant** - Task management help
- 🎯 **Auto-assignment** - Smart user detection
- 📝 **Task Summarization** - AI task analysis

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
1. **Firebase Hosting** - Integrated dengan Firebase project
2. **Vercel** - Zero-config React deployment
3. **Netlify** - JAMstack hosting
4. **Static hosting** - Serve `dist/` folder

## 🔒 Security & Environment

### Environment Variables
```bash
# Development (.env.local)
VITE_GEMINI_API_KEY=         # Gemini AI API key
VITE_FIREBASE_API_KEY=       # Firebase web API key
VITE_FIREBASE_AUTH_DOMAIN=   # Firebase auth domain
VITE_FIREBASE_PROJECT_ID=    # Firebase project identifier
VITE_FIREBASE_STORAGE_BUCKET= # Cloud storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID= # FCM sender ID
VITE_FIREBASE_APP_ID=        # Firebase app identifier
```

### Security Notes
- API keys dalam `VITE_` prefix exposed ke client-side
- Firebase security rules: test mode (development only)
- Production: implementasikan proper authentication & authorization

## 🔄 Development Workflow

### Git Workflow
1. Development di local branch
2. Commit changes dengan descriptive messages
3. Push ke GitHub repository
4. Deploy ke production environment

### Testing
- Manual testing via development server
- Production build testing via preview
- Firebase connection testing
- AI integration testing

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
  { id: 'u1', name: 'Alex Johnson', email: 'alex.johnson@example.com' },
  { id: 'u2', name: 'Maria Garcia', email: 'maria.garcia@example.com' },
  { id: 'u3', name: 'James Smith', email: 'james.smith@example.com' },
  { id: 'u4', name: 'Li Wei', email: 'li.wei@example.com' },
];
```

### User Features
- Avatar management
- Profile customization  
- Task assignment
- Activity tracking

## 📝 Development Notes

### Setup Date: 2025-09-08
### Last Updated: 2025-09-08
### Status: Production Ready
### Version: 0.0.0 (Initial Release)

### Build Info
- Dependencies: 128 packages installed
- No vulnerabilities detected
- TypeScript compilation: ✅
- Production build: ✅
- Firebase integration: ✅
- Gemini AI integration: ✅

---

**Maintained by**: Haris  
**Project Path**: `C:\Users\Haris\Documents\dev\team-taskflow`  
**Repository**: Git initialized, ready untuk GitHub push
