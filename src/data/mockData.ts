import { Course, User, NotificationItem, ForumTopic, Certificate } from '../types';

// Dữ liệu ban đầu rỗng để sẵn sàng nhận dữ liệu thật từ API backend
export const initialUser: User = {
  id: '',
  name: 'Chưa đăng nhập',
  username: '',
  email: '',
  avatar: '',
  role: 'student',
  code: '',
  department: 'LMS Nhóm 2',
  classOrPosition: 'Khách'
};

export const initialCourses: Course[] = [];
export const mockCertificates: Certificate[] = [];
export const mockNotifications: NotificationItem[] = [];
export const mockForumTopics: ForumTopic[] = [];
export const mockCalendarEvents: any[] = [];
export const mockLearningResources: any[] = [];
