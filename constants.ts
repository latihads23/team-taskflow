// Constants for Team TaskFlow Application

// Timezone Configuration
export const TIMEZONE = 'Asia/Jakarta'; // WIB - Indonesia timezone
export const LOCALE = 'id-ID'; // Indonesian locale

// Date formatting options
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
};

export const DATETIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
};

export const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit'
};

// Date utility functions
export const formatDateWIB = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTimeWIB = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTimeWIB = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getCurrentWIBDate = (): Date => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: TIMEZONE}));
};

export const getCurrentWIBDateString = (): string => {
  return getCurrentWIBDate().toISOString().split('T')[0];
};

// Helper function to get date string in WIB timezone consistently
export const getWIBDateString = (date: Date): string => {
  // Convert date to WIB timezone and get YYYY-MM-DD format
  const wibDate = new Date(date.toLocaleString("en-US", {timeZone: TIMEZONE}));
  const year = wibDate.getFullYear();
  const month = String(wibDate.getMonth() + 1).padStart(2, '0');
  const day = String(wibDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// App constants
export const APP_NAME = 'Team TaskFlow';
export const VERSION = '1.3.0';

// Current user ID constant
const CURRENT_USER_ID = 'u1';

// Default categories (with Indonesian structure)
export const DEFAULT_CATEGORIES = [
  // Main Categories
  {
    id: 'cat-main-kerjaan',
    name: 'Kerjaan',
    color: '#3B82F6',
    description: 'Semua tugas terkait pekerjaan',
    type: 'main' as const,
    parentId: undefined,
    mainCategoryColor: '#EFF6FF',
    icon: '🏢',
    order: 1,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  {
    id: 'cat-main-personal',
    name: 'Personal',
    color: '#EC4899',
    description: 'Tugas-tugas pribadi',
    type: 'main' as const,
    parentId: undefined,
    mainCategoryColor: '#FDF2F8',
    icon: '🏠',
    order: 2,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  // Kerjaan Subcategories
  {
    id: 'cat-sub-meeting',
    name: 'Meeting Customer',
    color: '#60A5FA',
    description: 'Meeting dan komunikasi dengan client',
    type: 'sub' as const,
    parentId: 'cat-main-kerjaan',
    mainCategoryColor: '#EFF6FF',
    icon: '👥',
    order: 1,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  {
    id: 'cat-sub-imers',
    name: 'Imers',
    color: '#10B981',
    description: 'Tugas imers dan proyek khusus',
    type: 'sub' as const,
    parentId: 'cat-main-kerjaan',
    mainCategoryColor: '#EFF6FF',
    icon: '💰',
    order: 2,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  {
    id: 'cat-sub-development',
    name: 'Development',
    color: '#8B5CF6',
    description: 'Coding, development, dan technical tasks',
    type: 'sub' as const,
    parentId: 'cat-main-kerjaan',
    mainCategoryColor: '#EFF6FF',
    icon: '🔧',
    order: 3,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  {
    id: 'cat-sub-admin',
    name: 'Admin',
    color: '#F59E0B',
    description: 'Administrative tasks dan dokumentasi',
    type: 'sub' as const,
    parentId: 'cat-main-kerjaan',
    mainCategoryColor: '#EFF6FF',
    icon: '📊',
    order: 4,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  // Personal Subcategories
  {
    id: 'cat-sub-olahraga',
    name: 'Olahraga',
    color: '#EF4444',
    description: 'Aktivitas fisik dan kesehatan',
    type: 'sub' as const,
    parentId: 'cat-main-personal',
    mainCategoryColor: '#FDF2F8',
    icon: '🏃‍♂️',
    order: 1,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  {
    id: 'cat-sub-belajar',
    name: 'Belajar',
    color: '#6366F1',
    description: 'Learning dan self improvement',
    type: 'sub' as const,
    parentId: 'cat-main-personal',
    mainCategoryColor: '#FDF2F8',
    icon: '📚',
    order: 2,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  {
    id: 'cat-sub-masak',
    name: 'Masak',
    color: '#FACC15',
    description: 'Memasak dan urusan dapur',
    type: 'sub' as const,
    parentId: 'cat-main-personal',
    mainCategoryColor: '#FDF2F8',
    icon: '🍳',
    order: 3,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  },
  {
    id: 'cat-sub-hobi',
    name: 'Hobi',
    color: '#14B8A6',
    description: 'Hobi dan aktivitas rekreasi',
    type: 'sub' as const,
    parentId: 'cat-main-personal',
    mainCategoryColor: '#FDF2F8',
    icon: '🎮',
    order: 4,
    isActive: true,
    createdBy: CURRENT_USER_ID,
    createdAt: getCurrentWIBDate().toISOString(),
    updatedAt: getCurrentWIBDate().toISOString()
  }
];
