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
  totalActivities: 32,
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
    description: `Nội dung học tập, bài giảng và bài thực hành cho ${title}`,
    activities: [
      {
        id: `act-${idx + 1}-1`,
        moduleId: `module-lesson-${idx + 1}`,
        courseId: '6AIAB01',
        title: `Video bài giảng: ${title.replace(/^BÀI\s*\d+\s*:\s*/i, '')}`,
        type: 'video',
        description: 'Xem video bài giảng tương tác và ghi chép nội dung chính',
        videoUrl: 'https://www.youtube.com/watch?v=JMUxmLyrhSk',
        durationMinutes: 15,
        isRequired: true,
        isCompleted: false,
        order: 1
      },
      {
        id: `act-${idx + 1}-2`,
        moduleId: `module-lesson-${idx + 1}`,
        courseId: '6AIAB01',
        title: `Tài liệu học tập & Đọc hiểu: ${title.replace(/^BÀI\s*\d+\s*:\s*/i, '')}`,
        type: 'document',
        description: 'Đọc kỹ tài liệu chuyên đề trước khi làm bài thực hành',
        fileUrl: '',
        durationMinutes: 20,
        isRequired: true,
        isCompleted: false,
        order: 2
      },
      {
        id: `act-${idx + 1}-3`,
        moduleId: `module-lesson-${idx + 1}`,
        courseId: '6AIAB01',
        title: `Bài tập thực hành: ${title.replace(/^BÀI\s*\d+\s*:\s*/i, '')}`,
        type: 'assignment',
        description: 'Thực hiện bài tập và tải tệp bài làm lên hệ thống',
        assignmentPrompt: `Yêu cầu: Học sinh vận dụng kiến thức đã học ở ${title} để hoàn thành câu hỏi thực hành và tải tệp bài làm lên hệ thống.`,
        durationMinutes: 30,
        maxScore: 10,
        isRequired: true,
        isCompleted: false,
        order: 3
      },
      {
        id: `act-${idx + 1}-4`,
        moduleId: `module-lesson-${idx + 1}`,
        courseId: '6AIAB01',
        title: `Trắc nghiệm củng cố: ${title.replace(/^BÀI\s*\d+\s*:\s*/i, '')}`,
        type: 'quiz',
        description: 'Hoàn thành các câu hỏi trắc nghiệm kiểm tra nhanh kiến thức',
        durationMinutes: 15,
        maxScore: 10,
        isRequired: true,
        isCompleted: false,
        quizQuestions: [
          {
            id: `q-${idx + 1}-1`,
            question: `Khái niệm cốt lõi được đề cập trong ${title} là gì?`,
            options: [
              'Trí tuệ nhân tạo học từ dữ liệu và hỗ trợ con người ra quyết định',
              'Máy tính tự động làm tất cả không cần con người kiểm soát',
              'Chỉ cài đặt phần mềm trò chơi trên máy tính',
              'Không có ứng dụng nào trong học tập và đời sống'
            ],
            correctAnswer: 0,
            explanation: 'AI học hỏi từ dữ liệu huấn luyện để đưa ra gợi ý, con người giữ vai trò làm chủ và kiểm chứng thông tin.'
          }
        ],
        order: 4
      }
    ]
  })),
  announcements: [
    {
      id: 'anc-welcome',
      title: 'Chào mừng các em học sinh đến với Chuyên đề Trí tuệ Nhân tạo Lớp 6!',
      content: 'Thầy Phan Phi Phú chúc các em học tập hiệu quả, tích cực trao đổi trên diễn đàn và nộp bài đúng hạn nhé.',
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
