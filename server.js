import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tự động nạp cấu hình từ .env nếu có (không cần cài thêm thư viện phụ thuộc)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
  } catch (e) {}
}

const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint for Render & monitoring
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => res.json({ 
  status: 'ok', 
  service: 'LMS Nhóm 2 API', 
  database: isMongoConnected ? 'MongoDB Atlas' : 'Local JSON DB',
  uptime: process.uptime(), 
  timestamp: new Date().toISOString() 
}));

// ====================== MONGODB ATLAS INTEGRATION ======================
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
let isMongoConnected = false;

// Mongoose Schemas (Tuyệt đối không gán dữ liệu ảo)
const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  username: String,
  password: { type: String, default: 'password123' },
  email: String,
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student' },
  code: String,
  department: String,
  school: String,
  className: String,
  classOrPosition: String,
  phone: String,
  dateOfBirth: String,
  address: String,
  gender: String,
  avatar: String,
  isProfileCompleted: { type: Boolean, default: false },
  enrolledCourses: { type: [String], default: [] }
}, { strict: false });

const courseSchema = new mongoose.Schema({
  id: String,
  code: String,
  name: String,
  category: String,
  gradeLevel: String,
  credits: Number,
  semester: String,
  academicYear: String,
  instructor: Object,
  creator: Object,
  thumbnail: String,
  progress: Number,
  totalActivities: Number,
  completedActivities: Number,
  description: String,
  targetAudience: String,
  syllabus: [String],
  modules: Array,
  announcements: Array,
  enrolledStudentsCount: { type: Number, default: 0 },
  enrolledStudents: { type: Array, default: [] },
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

// Helper tìm document khóa học an toàn (hỗ trợ cả id string và MongoDB _id)
async function getCourseDoc(id) {
  if (!id) return null;
  if (isMongoConnected) {
    try {
      let course = await CourseModel.findOne({ id });
      if (!course && mongoose.isValidObjectId(id)) {
        course = await CourseModel.findById(id);
      }
      return course;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Kết nối MongoDB Atlas (Không seed bất kỳ dữ liệu ảo nào)
if (MONGODB_URI) {
  console.log('🔄 Đang kết nối tới MongoDB Atlas...');
  mongoose.connect(MONGODB_URI, { dbName: 'lms_nhom2' })
    .then(async () => {
      isMongoConnected = true;
      console.log('✅ Đã kết nối thành công tới MongoDB Atlas (Database: lms_nhom2)!');
      
      // Tự động dọn dẹp các tài khoản ảo hoặc mẫu thử nghiệm cũ nếu có
      try {
        await UserModel.deleteMany({
          $or: [
            { email: { $regex: /hcmue/i } },
            { name: { $regex: /hcmue/i } },
            { code: 'SV-2026' }
          ]
        });
        console.log('🧹 Đã hoàn tất kiểm tra và làm sạch tài khoản trong MongoDB.');
      } catch (cleanErr) {
        console.warn('Thông báo dọn dẹp dữ liệu cũ:', cleanErr.message);
      }
    })
    .catch(err => {
      console.warn('⚠️ Kết nối MongoDB Atlas thất bại, tự động chuyển về Local JSON DB:', err.message);
    });
} else {
  console.log('ℹ️ Chưa có MONGODB_URI, sử dụng Local JSON Database (db.json)');
}

// ====================== LOCAL JSON FALLBACK (DỮ LIỆU RỖNG 100%) ======================
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const emptyDb = {
      users: [],
      courses: [],
      notifications: [],
      certificates: [],
      forumTopics: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(emptyDb, null, 2), 'utf-8');
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

      // Tạo tài khoản mới trực tiếp từ dữ liệu người dùng nhập
      const role = username?.toLowerCase().includes('admin') ? 'admin' 
                 : (username?.toLowerCase().includes('gv') || username?.toLowerCase().includes('teacher')) ? 'lecturer' 
                 : 'student';

      const newUser = new UserModel({
        id: `user-${Date.now()}`,
        name: username,
        username,
        email: `${username}@lms2.edu.vn`,
        role,
        code: username,
        department: 'LMS Nhóm 2',
        classOrPosition: role === 'student' ? 'Học viên' : role === 'lecturer' ? 'Giáo viên' : 'Quản trị viên',
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
  let user = db.users.find(u => 
    (u.username === username || u.code === username || u.email === username)
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
    email: `${username}@lms2.edu.vn`,
    role,
    code: username,
    department: 'LMS Nhóm 2',
    classOrPosition: role === 'student' ? 'Học viên' : role === 'lecturer' ? 'Giáo viên' : 'Quản trị viên',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  db.users.push(newUser);
  writeDb(db);

  return res.json({
    token: `jwt_token_${newUser.id}_${Date.now()}`,
    user: newUser
  });
});

// 1.1 Auth: Đăng nhập bằng Google OAuth (Google Identity Services)
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Thiếu credential xác thực từ Google' });
  }

  try {
    // Gọi Google Token Info endpoint để kiểm tra chữ ký số mật mã và lấy thông tin người dùng
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(401).json({ message: 'Google Token không hợp lệ hoặc đã hết hạn' });
    }

    const payload = await googleRes.json();
    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Không thể trích xuất địa chỉ email từ Google' });
    }

    // Phân quyền: CHỈ DUY NHẤT phanphiphu04@gmail.com là admin, tất cả người khác mặc định là student (học viên)
    const isAdmin = normalizedEmail === 'phanphiphu04@gmail.com';
    const role = isAdmin ? 'admin' : 'student';

    let user;
    if (isMongoConnected) {
      user = await UserModel.findOne({ email: normalizedEmail });
      if (!user) {
        user = new UserModel({
          id: `user-google-${googleId ? googleId.slice(-6) : Date.now().toString().slice(-6)}`,
          name: name || normalizedEmail.split('@')[0],
          username: normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role,
          code: normalizedEmail.split('@')[0].toUpperCase(),
          department: isAdmin ? 'Ban Quản trị LMS Nhóm 2' : '',
          school: isAdmin ? 'LMS Nhóm 2' : '',
          className: isAdmin ? 'Quản trị viên' : '',
          classOrPosition: isAdmin ? 'Quản trị viên' : '',
          avatar: picture || '',
          phone: '',
          dateOfBirth: '',
          address: '',
          isProfileCompleted: isAdmin ? true : false
        });
        await user.save();
      } else {
        user.name = name || user.name;
        user.avatar = picture || user.avatar || '';
        user.role = role; // Luôn đảm bảo chỉ phanphiphu04@gmail.com là admin, còn lại là student
        if (isAdmin) {
          user.isProfileCompleted = true;
        } else {
          user.isProfileCompleted = !!(user.isProfileCompleted && user.school && (user.className || user.classOrPosition));
        }
        await user.save();
      }
    } else {
      const db = readDb();
      db.users = db.users || [];
      user = db.users.find(u => u.email === normalizedEmail);
      if (!user) {
        user = {
          id: `user-google-${googleId ? googleId.slice(-6) : Date.now().toString().slice(-6)}`,
          name: name || normalizedEmail.split('@')[0],
          username: normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role,
          code: normalizedEmail.split('@')[0].toUpperCase(),
          department: isAdmin ? 'Ban Quản trị LMS Nhóm 2' : '',
          school: isAdmin ? 'LMS Nhóm 2' : '',
          className: isAdmin ? 'Quản trị viên' : '',
          classOrPosition: isAdmin ? 'Quản trị viên' : '',
          avatar: picture || '',
          phone: '',
          dateOfBirth: '',
          address: '',
          isProfileCompleted: isAdmin ? true : false
        };
        db.users.push(user);
        writeDb(db);
      } else {
        user.name = name || user.name;
        user.avatar = picture || user.avatar || '';
        user.role = role;
        if (isAdmin) {
          user.isProfileCompleted = true;
        } else {
          user.isProfileCompleted = !!(user.isProfileCompleted && user.school && (user.className || user.classOrPosition));
        }
        writeDb(db);
      }
    }

    const token = `jwt_token_${user.id}_${Date.now()}`;
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    return res.json({ token, user: userObj });
  } catch (err) {
    console.error('Lỗi xác thực Google:', err);
    return res.status(500).json({ message: 'Lỗi xác thực Google OAuth: ' + err.message });
  }
});

// 2. Auth: Get current user profile (Yêu cầu token hợp lệ, tuyệt đối không trả về mock user)
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const match = token.match(/^jwt_token_(.+)_\d+$/);
  if (!match) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
  const userId = match[1];

  if (isMongoConnected) {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (user) {
        const u = user.toObject();
        delete u.password;
        return res.json(u);
      }
    } catch (err) {}
  }

  const db = readDb();
  const user = (db.users || []).find(u => u.id === userId);
  if (user) {
    const { password, ...safeUser } = user;
    return res.json(safeUser);
  }

  return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn' });
});

// 2.1 Auth: Update user profile (phone, dateOfBirth, address, school, className)
app.put('/api/auth/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  let userId = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const match = token.match(/^jwt_token_(.+)_\d+$/);
    if (match) {
      userId = match[1];
    }
  }

  const { phone, dateOfBirth, address, name, school, className, classOrPosition, isProfileCompleted, email } = req.body;

  if (isMongoConnected) {
    try {
      let user = userId ? await UserModel.findOne({ id: userId }) : null;
      if (!user && email) {
        user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      }
      if (user) {
        if (name) user.name = name;
        if (school !== undefined) {
          user.school = school;
          user.department = school;
        }
        if (className !== undefined || classOrPosition !== undefined) {
          const cls = className || classOrPosition;
          user.className = cls;
          user.classOrPosition = cls;
        }
        if (phone !== undefined) user.phone = phone;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
        if (address !== undefined) user.address = address;
        user.isProfileCompleted = true;

        await user.save();
        const u = user.toObject();
        delete u.password;
        u.isProfileCompleted = true;
        u.school = user.school;
        u.className = user.className;
        return res.json(u);
      }
    } catch (err) {
      console.error('Lỗi cập nhật hồ sơ Mongo:', err);
    }
  }

  const db = readDb();
  let user = (db.users || []).find(u => (userId && u.id === userId) || (email && u.email === email.toLowerCase().trim()));
  if (user) {
    if (name) user.name = name;
    if (school !== undefined) {
      user.school = school;
      user.department = school;
    }
    if (className !== undefined || classOrPosition !== undefined) {
      const cls = className || classOrPosition;
      user.className = cls;
      user.classOrPosition = cls;
    }
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (address !== undefined) user.address = address;
    user.isProfileCompleted = true;

    writeDb(db);
    const { password, ...safeUser } = user;
    safeUser.isProfileCompleted = true;
    return res.json(safeUser);
  }

  // Fallback: Tạo user mới nếu chưa tồn tại
  const fallbackUser = {
    id: userId || `user-${Date.now()}`,
    name: name || 'Học viên',
    username: name ? name.toLowerCase().replace(/\s+/g, '_') : 'hocvien',
    email: email || `${userId || 'user'}@lms2.edu.vn`,
    role: 'student',
    school: school || 'LMS Nhóm 2',
    department: school || 'LMS Nhóm 2',
    className: className || classOrPosition || 'Lớp học',
    classOrPosition: className || classOrPosition || 'Học viên',
    phone: phone || '',
    isProfileCompleted: true
  };
  db.users = db.users || [];
  db.users.push(fallbackUser);
  writeDb(db);
  return res.json(fallbackUser);
});

// 3. Courses: Get All (Không có dữ liệu ảo)
app.get('/api/courses', async (req, res) => {
  if (isMongoConnected) {
    try {
      const courses = await CourseModel.find();
      return res.json(courses || []);
    } catch (err) {
      return res.json([]);
    }
  }

  const db = readDb();
  res.json(db.courses || []);
});

// 4. Courses: Get By ID
app.get('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course) return res.json(course.toObject ? course.toObject() : course);
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json(course);
});

// 5. Courses: Create new Course (Thêm khóa học thật từ API)
app.post('/api/courses', async (req, res) => {
  const newCourseData = {
    id: req.body.id || `course-${Date.now()}`,
    code: req.body.code || 'HP-NEW',
    name: req.body.name || 'Học phần mới',
    category: req.body.category || 'Chuyên đề AI',
    gradeLevel: req.body.gradeLevel || 'Lớp 10',
    credits: req.body.credits || 3,
    semester: req.body.semester || 'Học kỳ 1',
    academicYear: '2026 - 2027',
    instructor: req.body.instructor || {
      name: 'Giáo viên',
      title: 'Giáo viên phụ trách',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      email: 'phanphiphu04@gmail.com'
    },
    creator: req.body.creator || req.body.instructor || {
      name: 'Giáo viên',
      email: 'phanphiphu04@gmail.com'
    },
    thumbnail: req.body.thumbnail || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
    progress: 0,
    totalActivities: 0,
    completedActivities: 0,
    description: req.body.description || '',
    targetAudience: req.body.targetAudience || 'Học sinh',
    syllabus: req.body.syllabus || [],
    modules: req.body.modules || [],
    announcements: req.body.announcements || [],
    enrolledStudentsCount: 0,
    enrolledStudents: [],
    certificateEligible: true,
    ...req.body
  };

  if (isMongoConnected) {
    try {
      const created = await CourseModel.create(newCourseData);
      return res.status(201).json(created);
    } catch (err) {
      console.error('Lỗi tạo khóa học Mongo:', err);
    }
  }

  const db = readDb();
  db.courses = db.courses || [];
  db.courses.push(newCourseData);
  writeDb(db);
  res.status(201).json(newCourseData);
});

// 5.1 Courses: Update Course
app.put('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course) {
        Object.assign(course, updateData);
        if (updateData.modules) course.markModified('modules');
        if (updateData.enrolledStudents) course.markModified('enrolledStudents');
        if (updateData.instructor) course.markModified('instructor');
        await course.save();
        return res.json(course.toObject ? course.toObject() : course);
      }
    } catch (err) {
      console.error('Lỗi cập nhật khóa học Mongo:', err);
    }
  }

  const db = readDb();
  const idx = (db.courses || []).findIndex(c => c.id === id || c._id === id);
  if (idx !== -1) {
    db.courses[idx] = { ...db.courses[idx], ...updateData };
    writeDb(db);
    return res.json(db.courses[idx]);
  }
  res.status(404).json({ message: 'Không tìm thấy khóa học để cập nhật' });
});

// 5.2 Courses: Delete Course
app.delete('/api/courses/:id', async (req, res) => {
  const { id } = req.params;

  if (isMongoConnected) {
    try {
      await CourseModel.deleteOne({ $or: [{ id }, ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : [])] });
      return res.json({ success: true, message: 'Đã xóa khóa học thành công' });
    } catch (err) {}
  }

  const db = readDb();
  db.courses = (db.courses || []).filter(c => c.id !== id && c._id !== id);
  writeDb(db);
  res.json({ success: true, message: 'Đã xóa khóa học thành công' });
});

// 5.3 Modules: Add Module to Course
app.post('/api/courses/:id/modules', async (req, res) => {
  const { id } = req.params;
  const newModule = {
    id: req.body.id || `mod-${Date.now()}`,
    courseId: id,
    title: req.body.title || 'Mô-đun mới',
    order: req.body.order || 1,
    description: req.body.description || '',
    activities: req.body.activities || []
  };

  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course) {
        course.modules = course.modules || [];
        const existingIdx = course.modules.findIndex(m => m.id === newModule.id);
        if (existingIdx !== -1) {
          course.modules[existingIdx] = { ...course.modules[existingIdx], ...newModule };
        } else {
          course.modules.push(newModule);
        }
        course.markModified('modules');
        await course.save();
        return res.status(201).json(newModule);
      }
    } catch (err) {
      console.error('Lỗi thêm mô-đun Mongo:', err);
    }
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (course) {
    course.modules = course.modules || [];
    const existingIdx = course.modules.findIndex(m => m.id === newModule.id);
    if (existingIdx !== -1) {
      course.modules[existingIdx] = { ...course.modules[existingIdx], ...newModule };
    } else {
      course.modules.push(newModule);
    }
    writeDb(db);
    return res.status(201).json(newModule);
  }
  res.status(404).json({ message: 'Không tìm thấy khóa học để thêm mô-đun' });
});

// 5.4 Modules: Update Module
app.put('/api/courses/:id/modules/:modId', async (req, res) => {
  const { id, modId } = req.params;
  const updateData = req.body;

  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course && course.modules) {
        const modIdx = course.modules.findIndex(m => m.id === modId);
        if (modIdx !== -1) {
          course.modules[modIdx] = { ...course.modules[modIdx], ...updateData };
          course.markModified('modules');
          await course.save();
          return res.json(course.modules[modIdx]);
        }
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (course && course.modules) {
    const modIdx = course.modules.findIndex(m => m.id === modId);
    if (modIdx !== -1) {
      course.modules[modIdx] = { ...course.modules[modIdx], ...updateData };
      writeDb(db);
      return res.json(course.modules[modIdx]);
    }
  }
  res.status(404).json({ message: 'Không tìm thấy mô-đun để cập nhật' });
});

// 5.5 Modules: Delete Module
app.delete('/api/courses/:id/modules/:modId', async (req, res) => {
  const { id, modId } = req.params;

  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course && course.modules) {
        course.modules = course.modules.filter(m => m.id !== modId);
        course.markModified('modules');
        await course.save();
        return res.json({ success: true, message: 'Đã xóa mô-đun thành công' });
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (course && course.modules) {
    course.modules = course.modules.filter(m => m.id !== modId);
    writeDb(db);
    return res.json({ success: true, message: 'Đã xóa mô-đun thành công' });
  }
  res.status(404).json({ message: 'Không tìm thấy mô-đun để xóa' });
});

// 5.6 Activities: Add Activity / Learning Resource (Video, Link, Assignment, Quiz,...)
app.post('/api/courses/:id/modules/:modId/activities', async (req, res) => {
  const { id, modId } = req.params;
  const newActivity = {
    id: req.body.id || `act-${Date.now()}`,
    moduleId: modId,
    title: req.body.title || 'Bài học mới',
    type: req.body.type || 'document',
    durationMinutes: req.body.durationMinutes || 15,
    isCompleted: false,
    isRequired: req.body.isRequired ?? true,
    description: req.body.description || 'Xem trang',
    videoUrl: req.body.videoUrl || '',
    fileUrl: req.body.fileUrl || '',
    dueDate: req.body.dueDate || '',
    maxScore: req.body.maxScore || 10,
    assignmentPrompt: req.body.assignmentPrompt || '',
    quizQuestions: req.body.quizQuestions || [],
    ...req.body
  };

  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course && course.modules) {
        const mod = course.modules.find(m => m.id === modId);
        if (mod) {
          mod.activities = mod.activities || [];
          const existingActIdx = mod.activities.findIndex(a => a.id === newActivity.id);
          if (existingActIdx !== -1) {
            mod.activities[existingActIdx] = { ...mod.activities[existingActIdx], ...newActivity };
          } else {
            mod.activities.push(newActivity);
          }
          course.totalActivities = (course.totalActivities || 0) + 1;
          course.markModified('modules');
          await course.save();
          return res.status(201).json(newActivity);
        }
      }
    } catch (err) {
      console.error('Lỗi thêm bài học Mongo:', err);
    }
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (course && course.modules) {
    const mod = course.modules.find(m => m.id === modId);
    if (mod) {
      mod.activities = mod.activities || [];
      const existingActIdx = mod.activities.findIndex(a => a.id === newActivity.id);
      if (existingActIdx !== -1) {
        mod.activities[existingActIdx] = { ...mod.activities[existingActIdx], ...newActivity };
      } else {
        mod.activities.push(newActivity);
      }
      course.totalActivities = (course.totalActivities || 0) + 1;
      writeDb(db);
      return res.status(201).json(newActivity);
    }
  }
  res.status(404).json({ message: 'Không tìm thấy mô-đun để thêm hoạt động' });
});

// 5.7 Activities: Update Activity
app.put('/api/courses/:id/activities/:actId', async (req, res) => {
  const { id, actId } = req.params;
  const updateData = req.body;

  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course && course.modules) {
        for (const mod of course.modules) {
          if (mod.activities) {
            const actIdx = mod.activities.findIndex(a => a.id === actId);
            if (actIdx !== -1) {
              mod.activities[actIdx] = { ...mod.activities[actIdx], ...updateData };
              course.markModified('modules');
              await course.save();
              return res.json(mod.activities[actIdx]);
            }
          }
        }
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (course && course.modules) {
    for (const mod of course.modules) {
      if (mod.activities) {
        const actIdx = mod.activities.findIndex(a => a.id === actId);
        if (actIdx !== -1) {
          mod.activities[actIdx] = { ...mod.activities[actIdx], ...updateData };
          writeDb(db);
          return res.json(mod.activities[actIdx]);
        }
      }
    }
  }
  res.status(404).json({ message: 'Không tìm thấy bài học để cập nhật' });
});

// 5.8 Activities: Delete Activity
app.delete('/api/courses/:id/activities/:actId', async (req, res) => {
  const { id, actId } = req.params;

  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course && course.modules) {
        for (const mod of course.modules) {
          if (mod.activities) {
            const beforeCount = mod.activities.length;
            mod.activities = mod.activities.filter(a => a.id !== actId);
            if (mod.activities.length !== beforeCount) {
              course.totalActivities = Math.max(0, (course.totalActivities || 1) - 1);
              course.markModified('modules');
              await course.save();
              return res.json({ success: true, message: 'Đã xóa bài học thành công' });
            }
          }
        }
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (course && course.modules) {
    for (const mod of course.modules) {
      if (mod.activities) {
        const beforeCount = mod.activities.length;
        mod.activities = mod.activities.filter(a => a.id !== actId);
        if (mod.activities.length !== beforeCount) {
          course.totalActivities = Math.max(0, (course.totalActivities || 1) - 1);
          writeDb(db);
          return res.json({ success: true, message: 'Đã xóa bài học thành công' });
        }
      }
    }
  }
  res.status(404).json({ message: 'Không tìm thấy bài học để xóa' });
});

// 5.9 Courses: Đăng ký khóa học cho học viên (Enrollment)
app.post('/api/courses/:id/enroll', async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  let userId = req.body.id || req.body.userId;
  let userName = req.body.name;
  let userEmail = req.body.email;
  let userClass = req.body.className || req.body.classOrPosition;
  let userSchool = req.body.school || req.body.department;
  let userAvatar = req.body.avatar;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const match = token.match(/^jwt_token_(.+)_\d+$/);
    if (match) {
      userId = userId || match[1];
    }
  }

  let dbUser = null;
  if (isMongoConnected) {
    try {
      if (userId) dbUser = await UserModel.findOne({ id: userId });
      if (!dbUser && userEmail) dbUser = await UserModel.findOne({ email: userEmail.toLowerCase().trim() });
    } catch (e) {}
  }
  if (!dbUser) {
    const db = readDb();
    dbUser = (db.users || []).find(u => (userId && u.id === userId) || (userEmail && u.email === userEmail.toLowerCase().trim()));
  }

  if (dbUser) {
    userId = dbUser.id || userId;
    userName = dbUser.name || userName;
    userEmail = dbUser.email || userEmail;
    userClass = dbUser.className || dbUser.classOrPosition || userClass;
    userSchool = dbUser.school || dbUser.department || userSchool;
    userAvatar = dbUser.avatar || userAvatar;
  }

  const studentObj = {
    id: userId || `user-${Date.now()}`,
    name: userName || 'Học viên',
    email: userEmail || 'hocvien@lms2.edu.vn',
    className: userClass || 'Lớp học',
    school: userSchool || 'LMS Nhóm 2',
    avatar: userAvatar || '',
    enrolledAt: new Date().toLocaleDateString('vi-VN'),
    status: 'Đang học'
  };

  // Add course ID to user's enrolledCourses
  if (isMongoConnected && dbUser) {
    try {
      dbUser.enrolledCourses = dbUser.enrolledCourses || [];
      if (!dbUser.enrolledCourses.includes(id)) {
        dbUser.enrolledCourses.push(id);
        dbUser.markModified('enrolledCourses');
        await dbUser.save();
      }
    } catch (e) {}
  } else if (dbUser) {
    const db = readDb();
    const u = (db.users || []).find(x => x.id === dbUser.id);
    if (u) {
      u.enrolledCourses = u.enrolledCourses || [];
      if (!u.enrolledCourses.includes(id)) {
        u.enrolledCourses.push(id);
        writeDb(db);
      }
    }
  }

  // Add student to course's enrolledStudents
  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course) {
        course.enrolledStudents = course.enrolledStudents || [];
        const isAlreadyEnrolled = course.enrolledStudents.some(s => s.id === studentObj.id || (studentObj.email && s.email === studentObj.email));
        if (!isAlreadyEnrolled) {
          course.enrolledStudents.push(studentObj);
          course.enrolledStudentsCount = course.enrolledStudents.length;
          course.markModified('enrolledStudents');
          await course.save();
        }
        return res.json({ success: true, course: course.toObject ? course.toObject() : course, message: 'Đăng ký khóa học thành công' });
      }
    } catch (err) {
      console.error('Lỗi đăng ký khóa học Mongo:', err);
    }
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (course) {
    course.enrolledStudents = course.enrolledStudents || [];
    const isAlreadyEnrolled = course.enrolledStudents.some(s => s.id === studentObj.id || (studentObj.email && s.email === studentObj.email));
    if (!isAlreadyEnrolled) {
      course.enrolledStudents.push(studentObj);
      course.enrolledStudentsCount = course.enrolledStudents.length;
      writeDb(db);
    }
    return res.json({ success: true, course, message: 'Đăng ký khóa học thành công' });
  }

  res.status(404).json({ message: 'Không tìm thấy khóa học để đăng ký' });
});
      }
    } catch (err) {}
  }

  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id);
  if (course && course.modules) {
    for (const mod of course.modules) {
      if (mod.activities) {
        const beforeCount = mod.activities.length;
        mod.activities = mod.activities.filter(a => a.id !== actId);
        if (mod.activities.length !== beforeCount) {
          course.totalActivities = Math.max(0, (course.totalActivities || 1) - 1);
          writeDb(db);
          return res.json({ success: true, message: 'Đã xóa bài học thành công' });
        }
      }
    }
  }
  res.status(404).json({ message: 'Không tìm thấy bài học để xóa' });
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

// 8. Activities: Grade Assignment
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
      return res.json(certs || []);
    } catch (err) {
      return res.json([]);
    }
  }
  const db = readDb();
  res.json(db.certificates || []);
});

// 11. Notifications
app.get('/api/notifications', async (req, res) => {
  if (isMongoConnected) {
    try {
      const notifs = await NotifModel.find();
      return res.json(notifs || []);
    } catch (err) {
      return res.json([]);
    }
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
      return res.json(topics || []);
    } catch (err) {
      return res.json([]);
    }
  }
  const db = readDb();
  const topics = (db.forumTopics || []).filter(t => t.courseId === req.params.id);
  res.json(topics || []);
});

// 13. Users (Admin)
app.get('/api/users', async (req, res) => {
  if (isMongoConnected) {
    try {
      const users = await UserModel.find({}, { password: 0 });
      return res.json(users || []);
    } catch (err) {
      return res.json([]);
    }
  }
  const db = readDb();
  const safeUsers = (db.users || []).map(({ password, ...u }) => u);
  res.json(safeUsers || []);
});

// 14. Students in Course (Lấy danh sách học viên cùng lớp đã đăng ký khóa học này)
app.get('/api/courses/:id/students', async (req, res) => {
  const { id } = req.params;
  if (isMongoConnected) {
    try {
      const course = await getCourseDoc(id);
      if (course && Array.isArray(course.enrolledStudents)) {
        return res.json(course.enrolledStudents);
      }
    } catch (err) {}
  }
  const db = readDb();
  const course = (db.courses || []).find(c => c.id === id || c._id === id);
  if (course && Array.isArray(course.enrolledStudents)) {
    return res.json(course.enrolledStudents);
  }
  return res.json([]);
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
  console.log(`🚀 LMS Nhóm 2 Full-Stack Server is running!`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Database Mode: ${isMongoConnected ? 'MongoDB Atlas' : 'Local JSON DB'}`);
  console.log(`Dữ liệu: HOÀN TOÀN TRỐNG (Không có dữ liệu ảo)`);
  console.log(`======================================================\n`);
});
