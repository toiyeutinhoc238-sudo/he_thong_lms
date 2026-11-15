import { Course, User, NotificationItem, ForumTopic, Certificate } from '../types';

export const OFFICIAL_AI_GRADE6_LESSONS = [
  'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
  'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
  'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
  'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
  'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
  'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
  'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
  'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO'
];

// Khóa học chuẩn không gắn bất kỳ dữ liệu ảo nào bên trong các bài
// Giáo viên / Quản trị viên tự do thêm/xóa/sửa học liệu theo nhu cầu thực tế
export const defaultGrade6Course: Course = {
  id: '6AIAB01',
  code: '6AIAB01',
  name: 'Chuyên đề trí tuệ nhân tạo lớp 6: Chủ đề A và B',
  category: 'Chuyên đề AI',
  gradeLevel: 'Lớp 6',
  semester: 'Học kỳ 1',
  academicYear: '2026-2027',
  instructor: {
    id: 'gv-phanphiphu',
    name: 'Phan Phi Phú',
    email: 'phanphiphu04@gmail.com',
    avatar: '',
    title: 'Giáo viên phụ trách'
  },
  thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  progress: 0,
  totalActivities: 0,
  completedActivities: 0,
  description: 'Chương trình đào tạo Chuyên đề Trí tuệ Nhân tạo Lớp 6: Chủ đề A và B dành cho học sinh THCS.',
  targetAudience: 'Học sinh Lớp 6',
  syllabus: [
    'Chủ đề A: Máy tính và cộng đồng - Khám phá Trí tuệ Nhân tạo',
    'Chủ đề B: Mạng máy tính và Internet - An toàn và Đạo đức số'
  ],
  modules: OFFICIAL_AI_GRADE6_LESSONS.map((title, idx) => ({
    id: `module-lesson-${idx + 1}`,
    courseId: '6AIAB01',
    order: idx + 1,
    title: title,
    description: `Nội dung học tập và bài thực hành cho ${title}`,
    activities: []
  })),
  announcements: [
    {
      id: 'anc-welcome',
      title: 'Thông báo môn học Chuyên đề Trí tuệ Nhân tạo Lớp 6',
      content: 'Chào mừng các em học sinh tham gia học tập. Hãy theo dõi các bài học và nộp bài tập đúng hạn.',
      author: 'Phan Phi Phú',
      authorRole: 'Giáo viên phụ trách',
      createdAt: '15/11/2026',
      isImportant: true
    }
  ],
  files: [],
  enrolledStudentsCount: 0,
  enrolledStudents: [],
  certificateEligible: true
};

export const initialCourses: Course[] = [defaultGrade6Course];

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

export const mockCertificates: Certificate[] = [];
export const mockNotifications: NotificationItem[] = [];
export const mockForumTopics: ForumTopic[] = [];
export const mockCalendarEvents: any[] = [];
export const mockLearningResources: any[] = [];
