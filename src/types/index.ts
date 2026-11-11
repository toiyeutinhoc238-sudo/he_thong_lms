export type Role = 'student' | 'lecturer' | 'admin';

export type CourseTrack = 'Chuyên đề AI' | 'Khoa học máy tính' | 'Tin học ứng dụng';

export type TrainingType = 
  | 'Chuyên đề AI' 
  | 'Khoa học máy tính' 
  | 'Tin học ứng dụng'
  | 'ai_topics' 
  | 'computer_science' 
  | 'applied_informatics' 
  | 'student_regular' 
  | 'teacher_training' 
  | 'internal' 
  | 'community'
  | string;

export type AppView = 
  | 'dashboard' 
  | 'course-detail' 
  | 'activity' 
  | 'gradebook' 
  | 'certificates' 
  | 'teacher-studio' 
  | 'admin-panel' 
  | 'profile'
  | 'courses-list'
  | 'calendar'
  | 'inbox'
  | 'history'
  | 'help'
  | 'resources'
  | 'verify';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: Role;
  code: string; // MSSV or Mã Cán bộ
  department: string;
  school?: string;
  className?: string;
  classOrPosition: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  isProfileCompleted?: boolean;
}

export interface Activity {
  id: string;
  moduleId: string;
  title: string;
  type: 'video' | 'document' | 'assignment' | 'quiz' | 'forum';
  durationMinutes: number;
  isCompleted: boolean;
  isRequired: boolean;
  score?: number;
  maxScore?: number;
  description?: string;
  // Video specific
  videoUrl?: string;
  videoDuration?: number; // seconds
  watchedSeconds?: number;
  videoNotes?: { id: string; timestamp: number; note: string; createdAt: string }[];
  // Document specific
  fileUrl?: string;
  fileSize?: string;
  totalPages?: number;
  // Assignment specific
  dueDate?: string;
  assignmentPrompt?: string;
  submission?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    submittedAt?: string;
    textSubmission?: string;
    grade?: number;
    feedback?: string;
    status: 'not_submitted' | 'submitted' | 'graded';
  };
  // Quiz specific
  quizQuestions?: QuizQuestion[];
  timeLimitMinutes?: number;
  passScore?: number;
  quizResult?: {
    score: number;
    maxScore: number;
    passed: boolean;
    submittedAt: string;
    answers: Record<string, number | number[]>;
  };
  // Forum specific
  discussionsCount?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of option
  explanation?: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description: string;
  activities: Activity[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  category: TrainingType;
  gradeLevel: string; // Lớp 1 đến Lớp 12
  credits?: number;
  semester?: string;
  academicYear?: string;
  instructor: {
    id: string;
    name: string;
    title: string;
    avatar: string;
    email: string;
  };
  thumbnail: string;
  progress: number; // 0 - 100
  totalActivities: number;
  completedActivities: number;
  description: string;
  targetAudience?: string;
  syllabus: string[];
  modules: CourseModule[];
  announcements: CourseAnnouncement[];
  enrolledStudentsCount: number;
  certificateEligible: boolean;
}

export interface CourseAnnouncement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  createdAt: string;
  isImportant?: boolean;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  issueDate: string;
  scoreAverage: number;
  gradeClassification: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Đạt';
  qrVerificationUrl: string;
  signatureName: string;
  signatureTitle: string;
}

export interface GradeItem {
  id: string;
  courseId: string;
  activityId?: string;
  title: string;
  category: 'Chuyên cần' | 'Bài tập' | 'Giữa kỳ' | 'Trắc nghiệm' | 'Cuối kỳ';
  weight: number; // percentage, e.g. 20
  score: number | null;
  maxScore: number;
  feedback?: string;
  date?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'course' | 'deadline' | 'grade' | 'system';
  createdAt: string;
  read: boolean;
  linkCourseId?: string;
}

export interface ForumTopic {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  createdAt: string;
  replies: ForumReply[];
  views: number;
  likes: number;
}

export interface ForumReply {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  createdAt: string;
  isInstructorAnswer?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'live_class' | 'deadline' | 'quiz_opening' | 'exam';
  date: string; // YYYY-MM-DD or formatted
  time: string;
  courseCode: string;
  courseName: string;
  linkUrl?: string;
  location?: string;
  description?: string;
}

export interface LearningResource {
  id: string;
  title: string;
  category: 'textbook' | 'slide' | 'research_paper' | 'syllabus';
  author: string;
  year: number;
  fileSize: string;
  fileType: 'PDF' | 'PPTX' | 'DOCX';
  downloadCount: number;
  description: string;
  courseCode: string;
}
