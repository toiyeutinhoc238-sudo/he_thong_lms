/**
 * API Service Client for LMS Nhóm 2
 */

import { Course, CourseModule, User, Certificate, NotificationItem, ForumTopic, Activity, GradeItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('lms2_token') || localStorage.getItem('hcmue_vle_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
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
    logout: () => {
      localStorage.removeItem('lms2_token');
      localStorage.removeItem('hcmue_vle_token');
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
    })
  };

  // Modules
  modules = {
    create: (courseId: string, data: { title: string; description?: string }) =>
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
    submitAssignment: (courseId: string, activityId: string, data: { fileName: string; fileUrl?: string; textSubmission?: string }) => 
      this.request<{ success: boolean; submission: any }>(`/courses/${courseId}/activities/${activityId}/submit`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    gradeAssignment: (courseId: string, activityId: string, data: { grade: number; feedback: string }) => 
      this.request<{ success: boolean }>(`/courses/${courseId}/activities/${activityId}/grade`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    submitQuiz: (courseId: string, activityId: string, data: { answers: Record<string, number | number[]>; score: number; maxScore: number }) => 
      this.request<{ success: boolean; result: any }>(`/courses/${courseId}/activities/${activityId}/quiz-submit`, {
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
    getStudentsByCourse: (courseId: string) => this.request<any[]>(`/courses/${courseId}/students`)
  };
}

export const api = new ApiClient();
export default api;

