import { Course, User, NotificationItem, ForumTopic, Certificate } from '../types';

// Dữ liệu ban đầu rỗng để sẵn sàng nhận dữ liệu thật từ API backend
export const initialUser: User = {
  id: '',
  name: 'Người dùng',
  username: '',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'student',
  code: '',
  department: 'Đang tải...',
  classOrPosition: ''
};

export const initialCourses: Course[] = [];
export const mockCertificates: Certificate[] = [];
export const mockNotifications: NotificationItem[] = [];
export const mockForumTopics: ForumTopic[] = [];
export const mockCalendarEvents: any[] = [];
export const mockLearningResources: any[] = [];
