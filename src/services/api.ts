/**
 * API Service Client for LMS Nhóm 2
 */

import { Course, CourseModule, User, Certificate, NotificationItem, ForumTopic, Activity, GradeItem, QuizQuestion, CourseAnnouncement, CourseFile } from '../types';

export interface StudentSubmission {
  student: { id: string; name: string; email?: string; code?: string; className?: string; avatar?: string };
  isCompleted: boolean;
  completedAt: string;
  score: number | null;
  submission: Activity['submission'] | null;
  quizResult: Activity['quizResult'] | null;
  videoProgress?: Activity['videoProgress'] | null;
  timeSpentSeconds?: number;
  viewCount?: number;
  lastAccessedAt?: string;
}

function normalizeApiBase(raw?: string): string {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '/api';
  if (trimmed.startsWith('/')) return trimmed;
  // Hỗ trợ cả URL đầy đủ, domain .onrender.com lẫn tên service nội bộ (Render fromService.property: host)
  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    const bareHost = normalized.split('/')[0];
    if (!bareHost.includes('.') && !bareHost.includes(':') && bareHost !== 'localhost') {
      normalized = `${bareHost}.onrender.com${normalized.slice(bareHost.length)}`;
    }
    normalized = `https://${normalized}`;
  }
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

export const API_BASE_URL = normalizeApiBase((import.meta as any).env?.VITE_API_BASE_URL);

// Origin của máy chủ Node Backend (ví dụ: https://he-thong-lms.onrender.com) khi tách Frontend Static Site riêng
export const BACKEND_ORIGIN = /^https?:\/\//i.test(API_BASE_URL)
  ? API_BASE_URL.replace(/\/api$/i, '')
  : '';

// Chuyển mọi đường dẫn tệp tương đối (/uploads/..., /api/...) sang đúng máy chủ Backend khi chạy 2 dịch vụ tách biệt
export function resolveBackendUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith('/') && BACKEND_ORIGIN) return `${BACKEND_ORIGIN}${url}`;
  return url;
}

function safeReadToken(): string | null {
  try {
    return localStorage.getItem('lms2_token') || localStorage.getItem('hcmue_vle_token');
  } catch {
    return null;
  }
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = safeReadToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      // Tự động thử lại nhẹ 1 lần cho request GET hoặc /auth/google khi Backend Render gói Free vừa thức dậy (502/503/504)
      const isRetryable = method === 'GET' || endpoint === '/auth/google';
      if (!response.ok && isRetryable && [502, 503, 504].includes(response.status) && retryCount < 1) {
        await new Promise(r => setTimeout(r, 3000));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(errorData.message || `HTTP Error ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      const isRetryable = method === 'GET' || endpoint === '/auth/google';
      if (isRetryable && !error?.status && retryCount < 1) {
        await new Promise(r => setTimeout(r, 3000));
        return this.request<T>(endpoint, options, retryCount + 1);
      }
      console.warn(`[API Client] Yêu cầu tới ${endpoint} thất bại:`, error.message);
      throw error;
    }
  }

  // Auth & Profile
  auth = {
    login: (credentials: { username: string; password: string; program?: string }) =>
      this.request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    googleLogin: (credential: string) =>
      this.request<{ token: string; user: User }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential })
      }),
    getMe: () => this.request<User>('/auth/me'),
    updateProfile: (data: Partial<User>) =>
      this.request<User>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    logout: () => {
      try {
        localStorage.removeItem('lms2_token');
        localStorage.removeItem('lms2_user');
        localStorage.removeItem('hcmue_vle_token');
        localStorage.removeItem('hcmue_vle_user');
      } catch { }
      return Promise.resolve();
    }
  };

  // Courses
  courses = {
    getAll: (params?: { category?: string; query?: string }) => {
      const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return this.request<Course[]>(`/courses${qs}`);
    },
    getById: (id: string) => this.request<Course>(`/courses/${id}`),
    create: (data: Partial<Course>) => this.request<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: Partial<Course>) => this.request<Course>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => this.request<{ success: boolean }>(`/courses/${id}`, {
      method: 'DELETE'
    }),
    addAnnouncement: (id: string, data: { title: string; content: string; isImportant?: boolean }) =>
      this.request<CourseAnnouncement>(`/courses/${id}/announcements`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    enroll: (id: string, studentData?: any) => this.request<{ success: boolean; course: Course; message?: string }>(`/courses/${id}/enroll`, {
      method: 'POST',
      body: JSON.stringify(studentData || {})
    }),
    enrollStudent: (courseId: string, studentData: { id?: string; name: string; email: string; className?: string; code?: string; school?: string; avatar?: string }) =>
      this.request<{ success: boolean; student: any }>(`/courses/${courseId}/enroll-student`, {
        method: 'POST',
        body: JSON.stringify(studentData)
      }),
    enrollBulk: (courseId: string, students: Array<{ name: string; email: string; className?: string; code?: string }>) =>
      this.request<{ success: boolean; addedCount: number; skippedCount: number; students: any[] }>(`/courses/${courseId}/enroll-bulk`, {
        method: 'POST',
        body: JSON.stringify({ students })
      }),
    reorderModules: (courseId: string, moduleIds: string[]) =>
      this.request<{ success: boolean }>(`/courses/${courseId}/reorder-modules`, {
        method: 'PUT',
        body: JSON.stringify({ moduleIds })
      }),
    removeStudent: (courseId: string, studentId: string) =>
      this.request<{ success: boolean }>(`/courses/${courseId}/students/${studentId}`, {
        method: 'DELETE'
      }),
    importPackage: (courseId: string, data: { modules: any[]; targetModuleId?: string | null }) =>
      this.request<{ success: boolean; addedModules: number; addedActivities: number; course: Course }>(`/courses/${courseId}/import-package`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getGradebook: (courseId: string) =>
      this.request<{
        courseId: string;
        courseName: string;
        modules: any[];
        activities: any[];
        students: any[];
        summary: any;
      }>(`/courses/${courseId}/gradebook`),
    getEnrolledStudents: (id: string) => this.request<any[]>(`/courses/${id}/students`)
  };

  // Modules
  modules = {
    create: (courseId: string, data: Partial<CourseModule>) =>
      this.request<CourseModule>(`/courses/${courseId}/modules`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (courseId: string, modId: string, data: Partial<CourseModule>) =>
      this.request<CourseModule>(`/courses/${courseId}/modules/${modId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (courseId: string, modId: string) =>
      this.request<{ success: boolean }>(`/courses/${courseId}/modules/${modId}`, {
        method: 'DELETE'
      }),
    reorderActivities: (courseId: string, modId: string, activityIds: string[]) =>
      this.request<{ success: boolean }>(`/courses/${courseId}/modules/${modId}/reorder-activities`, {
        method: 'PUT',
        body: JSON.stringify({ activityIds })
      })
  };

  // Activities & Kho học liệu
  activities = {
    create: (courseId: string, modId: string, data: Partial<Activity>) =>
      this.request<Activity>(`/courses/${courseId}/modules/${modId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (courseId: string, actId: string, data: Partial<Activity>) =>
      this.request<Activity>(`/courses/${courseId}/activities/${actId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (courseId: string, actId: string) =>
      this.request<{ success: boolean }>(`/courses/${courseId}/activities/${actId}`, {
        method: 'DELETE'
      }),
    markCompleted: (courseId: string, activityId: string) =>
      this.request<{ success: boolean; progress: number }>(`/courses/${courseId}/activities/${activityId}/complete`, {
        method: 'POST'
      }),
    trackActivity: (courseId: string, activityId: string, data: { event?: 'view' | 'heartbeat'; deltaSeconds?: number; action?: string }) =>
      this.request<{ success: boolean; viewCount: number; timeSpentSeconds: number; lastAccessedAt: string }>(`/courses/${courseId}/activities/${activityId}/track`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateVideoProgress: (courseId: string, activityId: string, data: { watchedSeconds: number; totalSeconds: number; progressPercent: number; deltaSeconds?: number; checkpointResults?: Record<string, any> }) =>
      this.request<{ success: boolean; isCompleted: boolean; videoProgress: any; overallCourseProgress?: number }>(`/courses/${courseId}/activities/${activityId}/video-progress`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    submitAssignment: (courseId: string, activityId: string, data: { fileName: string; fileSize?: string; fileUrl?: string; textSubmission?: string }) =>
      this.request<{ success: boolean; submission: any }>(`/courses/${courseId}/activities/${activityId}/submit`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    gradeAssignment: (courseId: string, activityId: string, data: { studentId: string; grade: number; feedback: string }) =>
      this.request<{ success: boolean }>(`/courses/${courseId}/activities/${activityId}/grade`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    // Giáo viên: bài nộp / kết quả của từng học sinh cho một hoạt động
    getSubmissions: (courseId: string, activityId: string) =>
      this.request<StudentSubmission[]>(`/courses/${courseId}/activities/${activityId}/submissions`),
    submitQuiz: (courseId: string, activityId: string, data: { answers: Record<string, number | number[]>; score: number; maxScore: number; durationSeconds?: number }) =>
      this.request<{ success: boolean; passed: boolean; score: number; result: NonNullable<Activity['quizResult']>; questions?: QuizQuestion[] }>(`/courses/${courseId}/activities/${activityId}/quiz-submit`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    addActivity: (courseId: string, moduleId: string, data: Partial<Activity>) =>
      this.request<Activity>(`/courses/${courseId}/modules/${moduleId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  };

  // Grades
  grades = {
    getMyGrades: () => this.request<GradeItem[]>('/grades'),
    getCourseGrades: (courseId: string) => this.request<GradeItem[]>(`/courses/${courseId}/grades`)
  };

  // Certificates
  certificates = {
    getMyCertificates: () => this.request<Certificate[]>('/certificates'),
    verify: (certNumber: string) => this.request<Certificate>(`/certificates/verify/${certNumber}`)
  };

  // Notifications
  notifications = {
    getAll: () => this.request<NotificationItem[]>('/notifications'),
    markRead: (id: string) => this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT'
    })
  };

  // Forum
  forum = {
    getByCourse: (courseId: string) => this.request<ForumTopic[]>(`/courses/${courseId}/forum`),
    createTopic: (courseId: string, data: { title: string; content: string }) =>
      this.request<ForumTopic>(`/courses/${courseId}/forum`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    postReply: (topicId: string, data: { content: string }) =>
      this.request<any>(`/forum/${topicId}/replies`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  };

  // Users (Admin)
  users = {
    getAll: () => this.request<User[]>('/users'),
    getStudentsByCourse: (courseId: string) => this.request<any[]>(`/courses/${courseId}/students`),
    create: (data: Partial<User>) => this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateRole: (userId: string, role: 'student' | 'lecturer') =>
      this.request<{ success: boolean; user: User }>(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      }),
    delete: (userId: string) => this.request<{ success: boolean; userId: string }>(`/users/${userId}`, {
      method: 'DELETE'
    })
  };

  // System Settings (Admin)
  settings = {
    get: () => this.request<Record<string, any>>('/settings'),
    save: (data: Record<string, any>) => this.request<{ success: boolean; settings: Record<string, any> }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  };

  // AI Assistant
  ai = {
    chat: (data: { message: string; courseId?: string | null; moduleId?: string | null; activityId?: string | null }) =>
      this.request<{ reply: string; engine: 'gemini' | 'lms-context' }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  };

  // Files / Tập tin học liệu (Hỗ trợ upload mọi loại tệp tùy ý)
  files = {
    upload: async (file: File): Promise<CourseFile> => {
      const formData = new FormData();
      formData.append('file', file);
      const token = safeReadToken();
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Lỗi khi tải tệp lên máy chủ');
      }
      return await response.json();
    },
    getByCourse: (courseId: string) => this.request<CourseFile[]>(`/courses/${courseId}/files`),
    addToCourse: (courseId: string, data: Partial<CourseFile>) =>
      this.request<CourseFile>(`/courses/${courseId}/files`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteFromCourse: (courseId: string, fileId: string) =>
      this.request<{ success: boolean }>(`/courses/${courseId}/files/${fileId}`, {
        method: 'DELETE'
      })
  };
}

export const api = new ApiClient();
export default api;

