import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint for Render & monitoring
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => res.json({ 
  status: 'ok', 
  service: 'HCMUE VLE LMS API', 
  database: isMongoConnected ? 'MongoDB Atlas' : 'Local JSON DB',
  uptime: process.uptime(), 
  timestamp: new Date().toISOString() 
}));

// ====================== MONGODB ATLAS INTEGRATION ======================
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
let isMongoConnected = false;

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  username: String,
  password: { type: String, default: 'password123' },
  email: String,
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student' },
  code: String,
  department: String,
  classOrPosition: String,
  phone: String,
  avatar: String
}, { strict: false });

const courseSchema = new mongoose.Schema({
  id: String,
  code: String,
  name: String,
  category: String,
  credits: Number,
  semester: String,
  academicYear: String,
  instructor: Object,
  thumbnail: String,
  progress: Number,
  totalActivities: Number,
  completedActivities: Number,
  description: String,
  targetAudience: String,
  syllabus: [String],
  modules: Array,
  announcements: Array,
  enrolledStudentsCount: Number,
  certificateEligible: Boolean
}, { strict: false });

const notifSchema = new mongoose.Schema({
  id: String,
  title: String,
  message: String,
  type: String,
  createdAt: String,
  read: Boolean,
  linkCourseId: String
}, { strict: false });

const certSchema = new mongoose.Schema({
  id: String,
  certificateNumber: String,
  courseId: String,
  courseName: String,
  studentId: String,
  studentName: String,
  studentCode: String,
  issueDate: String,
  scoreAverage: Number,
  gradeClassification: String,
  qrVerificationUrl: String,
  signatureName: String,
  signatureTitle: String
}, { strict: false });

const forumSchema = new mongoose.Schema({
  id: String,
  courseId: String,
  title: String,
  author: Object,
  content: String,
  createdAt: String,
  replies: Array,
  views: Number,
  likes: Number
}, { strict: false });

const UserModel = mongoose.model('User', userSchema);
const CourseModel = mongoose.model('Course', courseSchema);
const NotifModel = mongoose.model('Notification', notifSchema);
const CertModel = mongoose.model('Certificate', certSchema);
const ForumModel = mongoose.model('ForumTopic', forumSchema);

// Kết nối MongoDB Atlas
if (MONGODB_URI) {
  console.log('🔄 Đang kết nối tới MongoDB Atlas...');
  mongoose.connect(MONGODB_URI, { dbName: 'vle_hcmue' })
    .then(async () => {
      isMongoConnected = true;
      console.log('✅ Đã kết nối thành công tới MongoDB Atlas (Database: vle_hcmue)!');
      await seedMongoIfEmpty();
    })
    .catch(err => {
      console.warn('⚠️ Kết nối MongoDB Atlas thất bại, tự động chuyển về Local JSON DB:', err.message);
    });
} else {
  console.log('ℹ️ Chưa có MONGODB_URI, sử dụng Local JSON Database (db.json)');
}

async function seedMongoIfEmpty() {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Đang tạo dữ liệu mẫu khởi tạo trên MongoDB Atlas...');
      const localData = readDb();
      if (localData.users?.length) await UserModel.insertMany(localData.users);
      if (localData.courses?.length) await CourseModel.insertMany(localData.courses);
      if (localData.notifications?.length) await NotifModel.insertMany(localData.notifications);
      console.log('✅ Đã tạo dữ liệu mẫu thành công trên MongoDB Atlas!');
    }
  } catch (e) {
    console.error('Lỗi khi seed MongoDB:', e.message);
  }
}

// ====================== LOCAL JSON FALLBACK ======================
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [
        {
          id: 'user-sv-01',
          name: 'Nguyễn Văn An',
          username: '48.01.104.055',
          password: 'password123',
          email: '4801104055@student.hcmue.edu.vn',
          role: 'student',
          code: '48.01.104.055',
          department: 'Khoa Công nghệ Thông tin',
          classOrPosition: 'Lớp Sư phạm Tin học K48',
          phone: '0903 123 456',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        },
        {
          id: 'user-gv-01',
          name: 'TS. Trần Minh Khoa',
          username: 'khoatm@hcmue.edu.vn',
          password: 'password123',
          email: 'khoatm@hcmue.edu.vn',
          role: 'lecturer',
          code: 'CB-HCMUE-2015',
          department: 'Khoa Tâm lý - Giáo dục',
          classOrPosition: 'Giảng viên chính / Trưởng bộ môn',
          phone: '0912 345 678',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        },
        {
          id: 'user-adm-01',
          name: 'ThS. Lê Hoàng Long',
          username: 'admin',
          password: 'password123',
          email: 'hotrovle@hcmue.edu.vn',
          role: 'admin',
          code: 'ADMIN-001',
          department: 'Trung tâm CNTT & Đào tạo Trực tuyến',
          classOrPosition: 'Quản trị viên Hệ thống Cổng Đào tạo VLE',
          phone: '028 3835 2020',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
        }
      ],
      courses: [
        {
          id: 'course-tlh102',
          code: 'TLH102',
          name: 'Tâm lý học Sư phạm và Giáo dục học',
          category: 'student_regular',
          credits: 3,
          semester: 'Học kỳ 1',
          academicYear: '2026 - 2027',
          instructor: {
            id: 'user-gv-01',
            name: 'TS. Trần Minh Khoa',
            title: 'Giảng viên chính - Khoa Tâm lý GD',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            email: 'khoatm@hcmue.edu.vn'
          },
          thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
          progress: 50,
          totalActivities: 4,
          completedActivities: 2,
          description: 'Học phần trang bị cho sinh viên ngành Sư phạm các quy luật tâm lý của hoạt động dạy và học, bản chất của quá trình hình thành nhân cách học sinh.',
          targetAudience: 'Sinh viên năm 2 các ngành Sư phạm trực thuộc ĐH Sư phạm TP.HCM.',
          syllabus: [
            'Chương 1: Những vấn đề chung của Tâm lý học Sư phạm',
            'Chương 2: Kỹ năng giao tiếp và ứng xử sư phạm'
          ],
          announcements: [
            {
              id: 'anc-1',
              title: 'Lịch kiểm tra trực tuyến Chuyên đề 1',
              content: 'Chào các bạn sinh viên, bài trắc nghiệm Chuyên đề 1 sẽ mở vào thứ 6 tuần này.',
              author: 'TS. Trần Minh Khoa',
              authorRole: 'Giảng viên phụ trách',
              createdAt: '11/11/2026 09:00',
              isImportant: true
            }
          ],
          enrolledStudentsCount: 120,
          certificateEligible: true,
          modules: [
            {
              id: 'mod-1',
              courseId: 'course-tlh102',
              title: 'Chuyên đề 1: Tổng quan Tâm lý học Sư phạm',
              order: 1,
              description: 'Nghiên cứu các đặc điểm tâm sinh lý học sinh THPT',
              activities: [
                {
                  id: 'act-1',
                  moduleId: 'mod-1',
                  title: 'Video bài giảng: Đặc điểm tâm sinh lý tuổi dậy thì',
                  type: 'video',
                  durationMinutes: 20,
                  isCompleted: true,
                  isRequired: true,
                  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                },
                {
                  id: 'act-2',
                  moduleId: 'mod-1',
                  title: 'Tài liệu: Giáo trình Tâm lý học Sư phạm chương 1',
                  type: 'document',
                  durationMinutes: 25,
                  isCompleted: true,
                  isRequired: true,
                  fileSize: '3.8 MB',
                  totalPages: 32
                },
                {
                  id: 'act-3',
                  moduleId: 'mod-1',
                  title: 'Bài tập: Xây dựng giải pháp xử lý xung đột lớp học',
                  type: 'assignment',
                  durationMinutes: 45,
                  isCompleted: false,
                  isRequired: true,
                  dueDate: '20/11/2026 - 23:59',
                  assignmentPrompt: 'Trình bày kế hoạch 4 bước giải quyết xung đột giữa 2 học sinh THPT trong giờ học.'
                },
                {
                  id: 'act-4',
                  moduleId: 'mod-1',
                  title: 'Kiểm tra trắc nghiệm Chuyên đề 1 (15 phút)',
                  type: 'quiz',
                  durationMinutes: 15,
                  isCompleted: false,
                  isRequired: true,
                  timeLimitMinutes: 15,
                  passScore: 5.0,
                  quizQuestions: [
                    {
                      id: 'q1',
                      question: 'Động lực học tập của học sinh trung học phổ thông chủ yếu xuất phát từ yếu tố nào?',
                      options: [
                        'Sự áp đặt nghiêm khắc từ cha mẹ',
                        'Ý thức nghề nghiệp tương lai và nhu cầu khẳng định bản thân',
                        'Chỉ nhằm đối phó với thi cử',
                        'Phần thưởng vật chất ngắn hạn'
                      ],
                      correctAnswer: 1,
                      explanation: 'Ở lứa tuổi thanh niên học sinh, định hướng nghề nghiệp và tự ý thức là động lực nội tại chủ đạo.'
                    },
                    {
                      id: 'q2',
                      question: 'Theo thuyết Vùng phát triển gần nhất (ZPD) của Vygotsky, vai trò của người dạy là gì?',
                      options: [
                        'Yêu cầu học sinh chép lại bài làm mẫu',
                        'Để học sinh tự làm hoàn toàn không can thiệp',
                        'Cung cấp giàn giáo (scaffolding) hỗ trợ học sinh vươn tới mức phát triển tiềm năng',
                        'Chỉ chấm điểm bài thi cuối kỳ'
                      ],
                      correctAnswer: 2,
                      explanation: 'Vygotsky chỉ ra vai trò nâng đỡ (scaffolding) của người thầy giúp học sinh đạt đến mức tiềm năng.'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      notifications: [
        {
          id: 'notif-1',
          title: 'Chào mừng bạn đến với VLE HCMUE',
          message: 'Hệ thống Đào tạo Trực tuyến Trường Đại học Sư phạm TP.HCM đã sẵn sàng phục vụ học tập.',
          type: 'system',
          createdAt: 'Vừa xong',
          read: false
        }
      ],
      certificates: [],
      forumTopics: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

initDb();

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return { users: [], courses: [], notifications: [], certificates: [], forumTopics: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ====================== API ROUTES ======================

// 1. Auth: Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (isMongoConnected) {
    try {
      let user = await UserModel.findOne({
        $or: [{ username }, { code: username }, { email: username }]
      });

      if (user) {
        const token = `jwt_token_${user.id}_${Date.now()}`;
        const userObj = user.toObject();
        delete userObj.password;
        return res.json({ token, user: userObj });
      }

      // Dynamic account creation
      const role = username?.toLowerCase().includes('admin') ? 'admin' 
                 : (username?.toLowerCase().includes('gv') || username?.toLowerCase().includes('teacher')) ? 'lecturer' 
                 : 'student';

      const newUser = new UserModel({
        id: `user-${Date.now()}`,
        name: username,
        username,
        email: `${username}@hcmue.edu.vn`,
        role,
        code: username,
        department: 'Trường ĐH Sư phạm TP.HCM',
        classOrPosition: role === 'student' ? 'Sinh viên chính quy' : role === 'lecturer' ? 'Cán bộ Giảng viên' : 'Quản trị viên',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      });

      await newUser.save();
      const userObj = newUser.toObject();
      delete userObj.password;

      return res.json({
        token: `jwt_token_${newUser.id}_${Date.now()}`,
        user: userObj
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Local JSON DB Fallback
  const db = readDb();
  const user = db.users.find(u => 
    (u.username === username || u.code === username || u.email === username) &&
    (!password || u.password === password || password === '123456' || password === 'password123')
  );

  if (user) {
    const token = `jwt_token_${user.id}_${Date.now()}`;
    const { password, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  }

  const role = username?.toLowerCase().includes('admin') ? 'admin' 
             : (username?.toLowerCase().includes('gv') || username?.toLowerCase().includes('teacher')) ? 'lecturer' 
             : 'student';

  const newUser = {
    id: `user-${Date.now()}`,
    name: username,
    username,
    email: `${username}@hcmue.edu.vn`,
    role,
    code: username,
    department: 'Trường ĐH Sư phạm TP.HCM',
    classOrPosition: role === 'student' ? 'Sinh viên chính quy' : role === 'lecturer' ? 'Cán bộ Giảng viên' : 'Quản trị viên',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  db.users.push(newUser);
  writeDb(db);

  return res.json({
    token: `jwt_token_${newUser.id}_${Date.now()}`,
    user: newUser
  });
});

// 2. Auth: Get current user profile
app.get('/api/auth/me', async (req, res) => {
  if (isMongoConnected) {
    try {
      const user = await UserModel.findOne();
      if (user) {
        const u = user.toObject();
        delete u.password;
        return res.json(u);
      }
    } catch (err) {}
  }

  const db = readDb();
  const { password, ...defaultUser } = db.users[0] || {};
  res.json(defaultUser);
});

// 3. Courses: Get All
app.get('/api/courses', async (req, res) => {
  if (isMongoConnected) {
    try {
      const courses = await CourseModel.find();
      return res.json(courses);
    } catch (err) {}
  }

  const db = readDb();
  res.json(db.courses || []);
});

// 4. Courses: Get By ID
app.get('/api/courses/:id', async (req, res) => {
  if (isMongoConnected) {
    try {
      const course = await CourseModel.findOne({ id: req.params.id });
      if (course) return res.json(course);
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json(course);
});

// 5. Courses: Create new Course (Lecturer / Admin)
app.post('/api/courses', async (req, res) => {
  const newCourseData = {
    id: `course-${Date.now()}`,
    code: req.body.code || 'HP-MOI',
    name: req.body.name || 'Học phần mới',
    category: req.body.category || 'student_regular',
    credits: req.body.credits || 3,
    semester: req.body.semester || 'Học kỳ 1',
    academicYear: '2026 - 2027',
    instructor: req.body.instructor || {
      name: 'Giảng viên HCMUE',
      title: 'Khoa Sư phạm',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      email: 'gv@hcmue.edu.vn'
    },
    thumbnail: req.body.thumbnail || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
    progress: 0,
    totalActivities: 0,
    completedActivities: 0,
    description: req.body.description || '',
    targetAudience: req.body.targetAudience || 'Sinh viên Sư phạm',
    syllabus: req.body.syllabus || ['Chuyên đề 1', 'Chuyên đề 2'],
    modules: [],
    announcements: [],
    enrolledStudentsCount: 1,
    certificateEligible: true,
    ...req.body
  };

  if (isMongoConnected) {
    try {
      const created = await CourseModel.create(newCourseData);
      return res.status(201).json(created);
    } catch (err) {}
  }

  const db = readDb();
  db.courses.push(newCourseData);
  writeDb(db);
  res.status(201).json(newCourseData);
});

// 6. Activities: Mark Completed
app.post('/api/courses/:id/activities/:actId/complete', async (req, res) => {
  if (isMongoConnected) {
    try {
      const course = await CourseModel.findOne({ id: req.params.id });
      if (course) {
        let total = 0;
        let completed = 0;
        (course.modules || []).forEach(m => {
          (m.activities || []).forEach(a => {
            total++;
            if (a.id === req.params.actId) a.isCompleted = true;
            if (a.isCompleted) completed++;
          });
        });
        course.completedActivities = completed;
        course.totalActivities = total;
        course.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        course.markModified('modules');
        await course.save();
        return res.json({ success: true, progress: course.progress });
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy môn học' });

  let total = 0;
  let completed = 0;
  (course.modules || []).forEach(m => {
    (m.activities || []).forEach(a => {
      total++;
      if (a.id === req.params.actId) a.isCompleted = true;
      if (a.isCompleted) completed++;
    });
  });

  course.completedActivities = completed;
  course.totalActivities = total;
  course.progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  writeDb(db);
  res.json({ success: true, progress: course.progress });
});

// 7. Activities: Submit Assignment
app.post('/api/courses/:id/activities/:actId/submit', async (req, res) => {
  const { fileName, textSubmission } = req.body;
  const subData = {
    status: 'submitted',
    fileName: fileName || 'BaiTap_Nop.pdf',
    fileSize: '2.1 MB',
    submittedAt: new Date().toLocaleString('vi-VN'),
    textSubmission
  };

  if (isMongoConnected) {
    try {
      const course = await CourseModel.findOne({ id: req.params.id });
      if (course) {
        (course.modules || []).forEach(m => {
          (m.activities || []).forEach(a => {
            if (a.id === req.params.actId) {
              a.isCompleted = true;
              a.submission = subData;
            }
          });
        });
        course.markModified('modules');
        await course.save();
        return res.json({ success: true, submission: subData });
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy môn học' });

  (course.modules || []).forEach(m => {
    (m.activities || []).forEach(a => {
      if (a.id === req.params.actId) {
        a.isCompleted = true;
        a.submission = subData;
      }
    });
  });

  writeDb(db);
  res.json({ success: true, submission: subData });
});

// 8. Activities: Grade Assignment (Lecturer)
app.post('/api/courses/:id/activities/:actId/grade', async (req, res) => {
  const { grade, feedback } = req.body;

  if (isMongoConnected) {
    try {
      const course = await CourseModel.findOne({ id: req.params.id });
      if (course) {
        (course.modules || []).forEach(m => {
          (m.activities || []).forEach(a => {
            if (a.id === req.params.actId && a.submission) {
              a.score = Number(grade);
              a.submission.status = 'graded';
              a.submission.grade = Number(grade);
              a.submission.feedback = feedback;
            }
          });
        });
        course.markModified('modules');
        await course.save();
        return res.json({ success: true });
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy môn học' });

  (course.modules || []).forEach(m => {
    (m.activities || []).forEach(a => {
      if (a.id === req.params.actId && a.submission) {
        a.score = Number(grade);
        a.submission.status = 'graded';
        a.submission.grade = Number(grade);
        a.submission.feedback = feedback;
      }
    });
  });

  writeDb(db);
  res.json({ success: true });
});

// 9. Activities: Submit Quiz
app.post('/api/courses/:id/activities/:actId/quiz-submit', async (req, res) => {
  const { answers, score, maxScore } = req.body;
  const passed = score >= (maxScore * 0.5);

  if (isMongoConnected) {
    try {
      const course = await CourseModel.findOne({ id: req.params.id });
      if (course) {
        (course.modules || []).forEach(m => {
          (m.activities || []).forEach(a => {
            if (a.id === req.params.actId) {
              a.isCompleted = passed;
              a.score = score;
              a.maxScore = maxScore;
              a.quizResult = {
                score,
                maxScore,
                passed,
                submittedAt: new Date().toLocaleString('vi-VN'),
                answers
              };
            }
          });
        });
        course.markModified('modules');
        await course.save();
        return res.json({ success: true, passed, score });
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy môn học' });

  (course.modules || []).forEach(m => {
    (m.activities || []).forEach(a => {
      if (a.id === req.params.actId) {
        a.isCompleted = passed;
        a.score = score;
        a.maxScore = maxScore;
        a.quizResult = {
          score,
          maxScore,
          passed,
          submittedAt: new Date().toLocaleString('vi-VN'),
          answers
        };
      }
    });
  });

  writeDb(db);
  res.json({ success: true, passed, score });
});

// 10. Certificates
app.get('/api/certificates', async (req, res) => {
  if (isMongoConnected) {
    try {
      const certs = await CertModel.find();
      return res.json(certs);
    } catch (err) {}
  }
  const db = readDb();
  res.json(db.certificates || []);
});

// 11. Notifications
app.get('/api/notifications', async (req, res) => {
  if (isMongoConnected) {
    try {
      const notifs = await NotifModel.find();
      return res.json(notifs);
    } catch (err) {}
  }
  const db = readDb();
  res.json(db.notifications || []);
});

app.put('/api/notifications/:id/read', async (req, res) => {
  if (isMongoConnected) {
    try {
      await NotifModel.updateOne({ id: req.params.id }, { $set: { read: true } });
      return res.json({ success: true });
    } catch (err) {}
  }
  const db = readDb();
  (db.notifications || []).forEach(n => {
    if (n.id === req.params.id) n.read = true;
  });
  writeDb(db);
  res.json({ success: true });
});

// 12. Forum
app.get('/api/courses/:id/forum', async (req, res) => {
  if (isMongoConnected) {
    try {
      const topics = await ForumModel.find({ courseId: req.params.id });
      return res.json(topics);
    } catch (err) {}
  }
  const db = readDb();
  const topics = (db.forumTopics || []).filter(t => t.courseId === req.params.id);
  res.json(topics);
});

// 13. Users (Admin)
app.get('/api/users', async (req, res) => {
  if (isMongoConnected) {
    try {
      const users = await UserModel.find({}, { password: 0 });
      return res.json(users);
    } catch (err) {}
  }
  const db = readDb();
  const safeUsers = (db.users || []).map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// 14. Students in Course
app.get('/api/courses/:id/students', async (req, res) => {
  if (isMongoConnected) {
    try {
      const users = await UserModel.find({ role: 'student' });
      const students = users.map(s => ({
        code: s.code,
        name: s.name,
        class: s.classOrPosition || 'Sư phạm K48',
        progress: 50,
        status: 'Đang học'
      }));
      return res.json(students);
    } catch (err) {}
  }
  const db = readDb();
  const students = (db.users || [])
    .filter(u => u.role === 'student')
    .map(s => ({
      code: s.code,
      name: s.name,
      class: s.classOrPosition || 'Sư phạm K48',
      progress: 50,
      status: 'Đang học'
    }));
  res.json(students);
});

// ====================== SERVE PRODUCTION FRONTEND ======================
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // SPA Fallback cho Express 5 (không dùng app.get('*') để tránh lỗi PathError trong Express 5)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: `API route ${req.method} ${req.path} không tồn tại.` });
    }
    next();
  });
}

// Start Server on all interfaces (0.0.0.0) for Render compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 HCMUE VLE LMS Full-Stack Server is running!`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Database Mode: ${isMongoConnected ? 'MongoDB Atlas' : 'Local JSON DB'}`);
  console.log(`======================================================\n`);
});
