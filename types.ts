
export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'link' | 'zip';
  url: string;
}

export interface VocabItem {
  id: string;
  french: string;
  translation: string;
  pronunciation?: string;
  example?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
  isInstructor?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  transcript?: string;
  duration: string;
  type: 'video' | 'text' | 'quiz' | 'audio';
  completed: boolean;
  videoUrl?: string;
  audioUrl?: string;
  comments: Comment[];
  vocabulary: VocabItem[];
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export type FrenchLevel = 'A1' | 'A2' | 'B1' | 'B2';

export interface CoursePackage {
  id: string;
  title: string;
  level: FrenchLevel;
  description: string;
  sections: Section[];
  resources: Resource[];
  announcements?: Announcement[];
}

export interface Course {
  id: string;
  title: string;
  thumbnail: string;
  instructor: string;
  studentsCount: number;
  rating: number;
  earnings: number;
  progress: number;
}

export interface NotificationPreferences {
  email: boolean;
  courseUpdates: boolean;
  weeklyReports: boolean;
}

export interface AppNotification {
  id: string;
  userId?: string; // If null, it's a global/course notification
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error' | 'course_update';
  link?: string;
  courseId?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'instructor' | 'admin' | 'superadmin';
  bio: string;
  levelGoal?: FrenchLevel;
  hasFullAccess: boolean;
  notifications?: NotificationPreferences;
  plan?: Plan; // 'autonomy' (default), 'integration', 'booster'
}

export interface Session {
  id: string;
  title: string;
  date: string; // ISO string 2026-01-15T19:00:00
  createdAt: string;
  teamsLink?: string;
  type: 'exchange' | 'culture';
  status: 'upcoming' | 'past' | 'archived';
  description?: string;
}

export interface ListeningLesson {
  id: string;
  number: number;
  title: string;
  focus: string; // e.g. "Grammar", "Vocabulary"
  youtuber: string;
  videoLink: string;
  docLink: string;
  createdAt: string;
}

export interface UserProgress {
  userId?: string; // stored in document ID usually, but handy here
  completedLessons: string[];
  courseProgress: { [courseId: string]: { completed: number; total: number } };
  learningHours: number;
  lastActivity: string | null;
  weeklyActivity: { [day: string]: number };
}
export type Plan = 'autonomy' | 'integration' | 'booster';

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  type: 'exchange' | 'culture' | 'lesson';
  title: string;
  content?: string; // Text content
  fileUrl?: string; // Optional file attachment
  status: 'pending' | 'corrected';
  feedback?: string;
  createdAt: string; // ISO string
  correctedAt?: string; // ISO string
}

export interface PlannedLesson {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  status: 'planned' | 'completed';
}

