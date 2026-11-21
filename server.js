import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import crypto from 'crypto';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================== FILE UPLOAD CONFIGURATION (MULTER) ======================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    console.error('Không thể tạo thư mục uploads:', e);
  }
}

// Cấu hình Multer lưu tệp vào uploads/ với tên an toàn và hỗ trợ đầy đủ tiếng Việt/Unicode
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    let originalName = file.originalname;
    try {
      originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (e) { }
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\-\u00C0-\u1EF9]/g, '_').slice(0, 80);
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${base}-${unique}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB cho phép tải tùy ý tệp lớn
  }
});

// Helper: Phân loại loại tệp để hiển thị icon và giao diện trực quan
function getFileTypeCategory(filename, mimetype) {
  const ext = (path.extname(filename || '')).toLowerCase().replace('.', '');
  const mime = (mimetype || '').toLowerCase();

  if (ext === 'pdf' || mime.includes('pdf')) return 'pdf';
  if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheetml')) return 'excel';
  if (['ppt', 'pptx'].includes(ext) || mime.includes('powerpoint') || mime.includes('presentationml')) return 'powerpoint';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext) || mime.startsWith('image/')) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || mime.startsWith('video/')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || mime.startsWith('audio/')) return 'audio';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) return 'archive';
  if (['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'c', 'cpp', 'java', 'sql', 'sh'].includes(ext)) return 'code';
  if (['txt', 'md', 'rtf'].includes(ext) || mime.startsWith('text/')) return 'text';
  return 'other';
}

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
  } catch (e) { }
}

const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Phục vụ tệp tĩnh trong uploads trực tiếp
app.use('/uploads', express.static(uploadsDir, {
  setHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Cho phép nhúng giao diện học liệu bằng <iframe> vào các LMS khác (Moodle, Canvas, Google Sites...)
  if (req.path.startsWith('/api/')) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'no-store');
  }
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint for Render & monitoring
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  service: 'LMS Nhóm 2 API',
  version: '2.4-share-export-scorm',
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
  files: Array,
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

userSchema.index({ id: 1 });
userSchema.index({ email: 1 });
courseSchema.index({ id: 1 });
forumSchema.index({ courseId: 1 });
const UserModel = mongoose.model('User', userSchema);
const CourseModel = mongoose.model('Course', courseSchema);
const NotifModel = mongoose.model('Notification', notifSchema);
const CertModel = mongoose.model('Certificate', certSchema);
const ForumModel = mongoose.model('ForumTopic', forumSchema);

// Tiến độ học tập lưu RIÊNG cho từng học sinh (mỗi bản ghi = 1 học sinh x 1 hoạt động)
const progressSchema = new mongoose.Schema({
  courseId: String,
  userId: String,
  userEmail: String,
  activityId: String,
  isCompleted: { type: Boolean, default: false },
  completedAt: String,
  score: Number,
  maxScore: Number,
  submission: Object,
  quizResult: Object,
  videoProgress: Object,
  viewCount: { type: Number, default: 0 },
  timeSpentSeconds: { type: Number, default: 0 },
  firstAccessedAt: String,
  lastAccessedAt: String,
  lastAction: String,
  updatedAt: String
}, { strict: false });
progressSchema.index({ courseId: 1, userId: 1, activityId: 1 }, { unique: true });
progressSchema.index({ userId: 1 });
progressSchema.index({ courseId: 1, userEmail: 1 });
const ProgressModel = mongoose.model('Progress', progressSchema);

// Helper tìm document khóa học an toàn (hỗ trợ cả id string và MongoDB _id)
async function getCourseDoc(id) {
  if (!id) return null;
  if (isMongoConnected) {
    try {
      let course = await CourseModel.findOne({ $or: [{ id }, { code: id }] });
      if (!course && mongoose.isValidObjectId(id)) {
        course = await CourseModel.findById(id);
      }
      if (!course && (id === '6AIAB01' || id === 'course-6aiab01' || id === 'course-ai-grade6' || id.toLowerCase().includes('6aiab01'))) {
        course = await CourseModel.findOne({ $or: [{ id: '6AIAB01' }, { code: '6AIAB01' }] });
      }
      return course;
    } catch (e) {
      return null;
    }
  } else {
    const db = readDb();
    return (db.courses || []).find(c => c.id === id || c.code === id || c._id === id || (c.code === '6AIAB01' && (id === 'course-6aiab01' || id === '6AIAB01' || id === 'course-ai-grade6')));
  }
}

// Kết nối MongoDB Atlas (Không seed bất kỳ dữ liệu ảo nào)
// mongoReady: các request chờ kết nối xong rồi mới xử lý (tránh đọc nhầm Local JSON lúc server vừa khởi động)
let mongoReady = Promise.resolve();
const MONGODB_DB = process.env.MONGODB_DB || 'lms_nhom2';
if (MONGODB_URI && process.env.DISABLE_MONGO !== '1') {
  console.log('🔄 Đang kết nối tới MongoDB Atlas...');
  mongoReady = mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB, serverSelectionTimeoutMS: 10000 })
    .then(async () => {
      isMongoConnected = true;
      console.log(`✅ Đã kết nối thành công tới MongoDB Atlas (Database: ${MONGODB_DB})!`);

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
        // Đảm bảo khóa học 6AIAB01 luôn sạch dữ liệu ảo (xóa sạch act-*-1..4 cũ và học sinh ảo mẫu)
        await ensureDefaultCourse();
        console.log('🧹 Đã đồng bộ & dọn sạch dữ liệu ảo trong khóa học 6AIAB01.');
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

let _dbCache = null;
let _dbMtime = 0;

function readDb() {
  try {
    const stat = fs.statSync(DB_FILE);
    if (_dbCache && stat.mtimeMs === _dbMtime) {
      return structuredClone(_dbCache);
    }
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    _dbCache = parsed;
    _dbMtime = stat.mtimeMs;
    return structuredClone(parsed);
  } catch {
    return { users: [], courses: [], notifications: [], certificates: [], forumTopics: [], progress: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  _dbCache = structuredClone(data);
  try { _dbMtime = fs.statSync(DB_FILE).mtimeMs; } catch { _dbMtime = Date.now(); }
}

// ====================== XÁC THỰC & PHÂN QUYỀN ======================
// Token được ký HMAC nên không thể tự bịa. Nên đặt biến môi trường JWT_SECRET;
// nếu chưa đặt, khóa ký được suy ra từ MONGODB_URI (bí mật, ổn định qua các lần khởi động lại).
const TOKEN_SECRET = process.env.JWT_SECRET
  || (MONGODB_URI
    ? crypto.createHash('sha256').update('lms2-token-secret:' + MONGODB_URI).digest('hex')
    : crypto.randomBytes(32).toString('hex'));
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

function signToken(userId) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `lms2.${payload}.${sig}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'lms2') return null;
  const expected = Buffer.from(crypto.createHmac('sha256', TOKEN_SECRET).update(parts[1]).digest('base64url'));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!data.uid || !data.exp || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

async function findUserById(id) {
  if (!id) return null;
  if (isMongoConnected) return UserModel.findOne({ id }).lean();
  return (readDb().users || []).find(u => u.id === id) || null;
}

async function findUsersByIds(ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  if (!uniqueIds.length) return [];
  if (isMongoConnected) return UserModel.find({ id: { $in: uniqueIds } }).lean();
  return (readDb().users || []).filter(u => uniqueIds.includes(u.id));
}

async function findUsersByEmails(emails) {
  const normalized = [...new Set((emails || []).map(e => String(e || '').toLowerCase().trim()).filter(Boolean))];
  if (!normalized.length) return [];
  if (isMongoConnected) return UserModel.find({ email: { $in: normalized } }).lean();
  return (readDb().users || []).filter(u => normalized.includes(String(u.email || '').toLowerCase().trim()));
}

// Đồng bộ ID, họ tên, avatar, lớp học thật của học sinh vào tất cả khóa học & bản ghi tiến độ khi đăng nhập/cập nhật hồ sơ
async function syncStudentIdentityAcrossCourses(user) {
  if (!user || !user.id || !user.email) return;
  const normEmail = String(user.email).toLowerCase().trim();
  if (!normEmail) return;

  try {
    if (isMongoConnected) {
      // 1. Cập nhật thông tin học sinh trong enrolledStudents nếu trùng email
      const courses = await CourseModel.find({ 'enrolledStudents.email': { $regex: new RegExp(`^${normEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      for (const course of courses) {
        let changed = false;
        const oldIds = [];
        course.enrolledStudents = (course.enrolledStudents || []).map(s => {
          if (String(s.email || '').toLowerCase().trim() === normEmail) {
            if (s.id && s.id !== user.id) oldIds.push(s.id);
            changed = true;
            return {
              ...s,
              id: user.id,
              name: user.name || s.name,
              email: normEmail,
              code: user.code || s.code || '',
              className: user.className || user.classOrPosition || s.className || '',
              school: user.school || user.department || s.school || '',
              avatar: user.avatar || s.avatar || ''
            };
          }
          return s;
        });
        if (changed) {
          course.markModified('enrolledStudents');
          await course.save();
          // Gộp bản ghi tiến độ của id cũ (nếu có) sang user.id thật
          for (const oldId of oldIds) {
            const oldRecs = await ProgressModel.find({ courseId: course.id, userId: oldId }).lean();
            for (const rec of oldRecs) {
              const { _id, __v, ...rest } = rec;
              await ProgressModel.findOneAndUpdate(
                { courseId: course.id, userId: user.id, activityId: rec.activityId },
                { $setOnInsert: { ...rest, userId: user.id, userEmail: normEmail } },
                { upsert: true }
              );
              await ProgressModel.deleteOne({ _id });
            }
          }
        }
      }
      // 2. Gắn userEmail cho mọi bản ghi progress hiện có của user.id
      await ProgressModel.updateMany({ userId: user.id, $or: [{ userEmail: { $exists: false } }, { userEmail: '' }] }, { $set: { userEmail: normEmail } });
    } else {
      const db = readDb();
      let changed = false;
      (db.courses || []).forEach(course => {
        (course.enrolledStudents || []).forEach(s => {
          if (String(s.email || '').toLowerCase().trim() === normEmail) {
            const oldId = s.id;
            s.id = user.id;
            s.name = user.name || s.name;
            s.email = normEmail;
            s.code = user.code || s.code || '';
            s.className = user.className || user.classOrPosition || s.className || '';
            s.school = user.school || user.department || s.school || '';
            s.avatar = user.avatar || s.avatar || '';
            changed = true;
            if (oldId && oldId !== user.id) {
              (db.progress || []).forEach(p => {
                if (p.courseId === course.id && p.userId === oldId) {
                  p.userId = user.id;
                  p.userEmail = normEmail;
                }
              });
            }
          }
        });
      });
      (db.progress || []).forEach(p => {
        if (p.userId === user.id && !p.userEmail) {
          p.userEmail = normEmail;
          changed = true;
        }
      });
      if (changed) writeDb(db);
    }
  } catch (err) {
    console.warn('Đồng bộ danh tính học sinh:', err.message);
  }
}

// Tự động ghi danh học sinh khi học sinh bắt đầu tương tác/học bài trong khóa học để KHÔNG BAO GIỜ bị mất tiến độ
async function ensureStudentEnrolled(course, user) {
  if (!course || !user || isStaff(user)) return course;
  if (isEnrolled(course, user)) return course;

  const normEmail = String(user.email || '').toLowerCase().trim();
  const studentObj = {
    id: user.id,
    name: user.name || 'Học viên',
    email: normEmail,
    code: user.code || '',
    className: user.className || user.classOrPosition || '',
    school: user.school || user.department || '',
    avatar: user.avatar || '',
    enrolledAt: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    status: 'Đang học'
  };

  try {
    if (isMongoConnected) {
      await UserModel.updateOne({ id: user.id }, { $addToSet: { enrolledCourses: course.id } });
      await CourseModel.updateOne(
        { id: course.id, 'enrolledStudents.id': { $ne: user.id } },
        { $push: { enrolledStudents: studentObj }, $inc: { enrolledStudentsCount: 1 } }
      );
    } else {
      const db = readDb();
      const u = (db.users || []).find(x => x.id === user.id);
      if (u) {
        u.enrolledCourses = u.enrolledCourses || [];
        if (!u.enrolledCourses.includes(course.id)) u.enrolledCourses.push(course.id);
      }
      const c = (db.courses || []).find(x => x.id === course.id);
      if (c && !isEnrolled(c, user)) {
        c.enrolledStudents = c.enrolledStudents || [];
        c.enrolledStudents.push(studentObj);
        c.enrolledStudentsCount = c.enrolledStudents.length;
      }
      writeDb(db);
    }
    course.enrolledStudents = [...(course.enrolledStudents || []), studentObj];
    course.enrolledStudentsCount = course.enrolledStudents.length;
  } catch (err) {
    console.warn('Auto-enroll error:', err.message);
  }
  return course;
}

const safeUser = (u) => {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
};

const isStaff = (user) => !!user && (
  user.role === 'admin' || 
  user.role === 'lecturer' || 
  (user.email && user.email.toLowerCase().trim() === 'phanphiphu04@gmail.com')
);

// Gắn req.user từ token (vai trò luôn lấy từ cơ sở dữ liệu, không tin dữ liệu client gửi lên)
app.use(async (req, res, next) => {
  req.user = null;
  await mongoReady;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const uid = verifyToken(authHeader.slice(7).trim());
    if (uid) {
      try {
        req.user = await findUserById(uid);
      } catch (e) {
        return res.status(503).json({ message: 'Không kết nối được cơ sở dữ liệu, vui lòng thử lại.' });
      }
    }
  }
  next();
});

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
  next();
}

function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
  if (!isStaff(req.user)) return res.status(403).json({ message: 'Chỉ giáo viên hoặc quản trị viên mới được thực hiện thao tác này.' });
  next();
}

// ====================== TIẾN ĐỘ THEO TỪNG HỌC SINH ======================
const nowVN = () => new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

async function listProgress(filter) {
  if (isMongoConnected) return ProgressModel.find(filter).lean();
  return (readDb().progress || []).filter(p => Object.entries(filter).every(([k, v]) => p[k] === v));
}

async function getOneProgress(courseId, userId, activityId) {
  if (isMongoConnected) return ProgressModel.findOne({ courseId, userId, activityId }).lean();
  return (readDb().progress || []).find(p => p.courseId === courseId && p.userId === userId && p.activityId === activityId) || null;
}

async function saveProgress(courseId, userId, activityId, patch, userEmail = '') {
  const key = { courseId, userId, activityId };
  const data = { ...patch, updatedAt: new Date().toISOString() };
  if (userEmail) data.userEmail = String(userEmail).toLowerCase().trim();
  if (isMongoConnected) {
    return ProgressModel.findOneAndUpdate(key, { $set: data }, { upsert: true, returnDocument: 'after' }).lean();
  }
  const db = readDb();
  db.progress = db.progress || [];
  let rec = db.progress.find(p => p.courseId === courseId && p.userId === userId && p.activityId === activityId);
  if (!rec) {
    rec = { ...key };
    db.progress.push(rec);
  }
  Object.assign(rec, data);
  writeDb(db);
  return rec;
}

async function removeProgress(filter) {
  if (isMongoConnected) {
    await ProgressModel.deleteMany(filter);
    return;
  }
  const db = readDb();
  db.progress = (db.progress || []).filter(p => !Object.entries(filter).every(([k, v]) => p[k] === v));
  writeDb(db);
}

async function loadCourseObj(id) {
  if (isMongoConnected) {
    let doc = await getCourseDoc(id);
    if (!doc && (id === '6AIAB01' || id === 'course-6aiab01' || id === 'course-ai-grade6' || id?.toLowerCase()?.includes('6aiab01'))) {
      const seeded = await ensureDefaultCourse();
      return seeded;
    }
    return doc ? doc.toObject() : null;
  }
  const db = readDb();
  let course = (db.courses || []).find(c => c.id === id || c._id === id || c.code === id || (c.code === '6AIAB01' && (id === 'course-6aiab01' || id === '6AIAB01' || id === 'course-ai-grade6')));
  if (!course && (id === '6AIAB01' || id === 'course-6aiab01' || id === 'course-ai-grade6' || id?.toLowerCase()?.includes('6aiab01'))) {
    course = await ensureDefaultCourse();
  }
  return course || null;
}

const allActivities = (course) => (course.modules || []).flatMap(m => m.activities || []);

const isEnrolled = (course, user) => !!user && (course.enrolledStudents || []).some(
  s => s.id === user.id || (user.email && s.email && String(s.email).toLowerCase().trim() === String(user.email).toLowerCase().trim())
);

// Dữ liệu của học sinh không được nằm trong tài liệu khóa học dùng chung
const STUDENT_STATE_FIELDS = ['submission', 'quizResult', 'score', 'watchedSeconds', 'videoProgress', 'videoNotes', 'viewCount', 'timeSpentSeconds', 'firstAccessedAt', 'lastAccessedAt'];
function stripStudentState(modules) {
  return (modules || []).map(m => ({
    ...m,
    activities: (m.activities || []).map(a => {
      const clean = { ...a, isCompleted: false };
      for (const k of STUDENT_STATE_FIELDS) delete clean[k];
      return clean;
    })
  }));
}

// Trả về khóa học theo góc nhìn của người đang đăng nhập: chỉ gắn tiến độ CỦA CHÍNH HỌ
function viewCourse(courseObj, user, progressRecords) {
  const byActivity = new Map((progressRecords || []).map(p => [p.activityId, p]));
  const hideAnswers = !isStaff(user);
  let total = 0;
  let completed = 0;
  const modules = stripStudentState(courseObj.modules).map(m => ({
    ...m,
    activities: m.activities.map(original => {
      total++;
      const p = byActivity.get(original.id);
      let a = original;
      // Học sinh chỉ nhận đáp án & lời giải SAU KHI đã nộp bài trắc nghiệm
      if (hideAnswers && Array.isArray(a.quizQuestions) && !p?.quizResult) {
        a = { ...a, quizQuestions: a.quizQuestions.map(({ correctAnswer, explanation, ...q }) => q) };
      }
      if (!p) return a;
      const out = { ...a, isCompleted: !!p.isCompleted };
      if (p.submission) out.submission = p.submission;
      if (p.quizResult) out.quizResult = p.quizResult;
      if (p.score !== undefined && p.score !== null) out.score = p.score;
      if (p.videoProgress) {
        out.videoProgress = p.videoProgress;
        out.watchedSeconds = p.videoProgress.watchedSeconds || 0;
        if (p.videoProgress.totalSeconds) out.videoDuration = p.videoProgress.totalSeconds;
      }
      if (p.viewCount) out.viewCount = p.viewCount;
      if (p.timeSpentSeconds) out.timeSpentSeconds = p.timeSpentSeconds;
      if (p.firstAccessedAt) out.firstAccessedAt = p.firstAccessedAt;
      if (p.lastAccessedAt) out.lastAccessedAt = p.lastAccessedAt;
      if (out.isCompleted) completed++;
      return out;
    })
  }));
  const students = courseObj.enrolledStudents || [];
  return {
    ...courseObj,
    modules,
    totalActivities: total,
    completedActivities: completed,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    enrolledStudentsCount: students.length,
    // Khách chưa đăng nhập không được xem danh sách (email) học sinh
    enrolledStudents: user ? students : []
  };
}

async function viewCourseFor(courseObj, user) {
  const enriched = await resolveInstructorAvatar(courseObj);
  const records = user ? await listProgress({ courseId: enriched.id, userId: user.id }) : [];
  return viewCourse(enriched, user, records);
}

// Kiểm tra chung cho thao tác học tập: khóa học + hoạt động tồn tại, tự động ghi danh học sinh để không bao giờ mất tiến độ
async function learningContext(req, res) {
  const course = await loadCourseObj(req.params.id);
  if (!course) {
    res.status(404).json({ message: 'Không tìm thấy khóa học' });
    return null;
  }
  const activity = allActivities(course).find(a => a.id === req.params.actId);
  if (!activity) {
    res.status(404).json({ message: 'Không tìm thấy hoạt động học tập' });
    return null;
  }
  if (req.user && !isStaff(req.user) && !isEnrolled(course, req.user)) {
    await ensureStudentEnrolled(course, req.user);
  }
  return { course, activity };
}

// ====================== API ROUTES ======================

// 1. Auth: Đăng nhập bằng tên đăng nhập đã bị gỡ bỏ vì không kiểm tra mật khẩu
// (ai cũng có thể đăng nhập thành người khác, kể cả quản trị viên). Chỉ còn đăng nhập Google.
app.post('/api/auth/login', (req, res) => {
  res.status(410).json({ message: 'Hình thức đăng nhập này đã ngừng hỗ trợ. Vui lòng đăng nhập bằng Google.' });
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

    // Chỉ chấp nhận token Google được cấp cho chính ứng dụng này
    const allowedClientIds = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.VITE_GOOGLE_CLIENT_ID,
      '976502172307-q6lsed0gssm2udppc8cda0ai8u5e4alg.apps.googleusercontent.com'
    ].filter(Boolean);
    if (!allowedClientIds.includes(payload.aud)) {
      return res.status(401).json({ message: 'Google Token không được cấp cho ứng dụng này' });
    }
    if (String(payload.email_verified) !== 'true') {
      return res.status(401).json({ message: 'Email Google chưa được xác minh' });
    }
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

    const token = signToken(user.id);
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    // Đồng bộ ID, avatar, họ tên thật của học sinh vào danh sách lớp và bản ghi tiến độ
    await syncStudentIdentityAcrossCourses(userObj);

    return res.json({ token, user: userObj });
  } catch (err) {
    console.error('Lỗi xác thực Google:', err);
    return res.status(500).json({ message: 'Lỗi xác thực Google OAuth: ' + err.message });
  }
});

// 2. Auth: Get current user profile (Yêu cầu token hợp lệ, tuyệt đối không trả về mock user)
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

// 2.1 Auth: Update user profile — chỉ sửa được hồ sơ của chính mình (xác định bằng token)
app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const { phone, dateOfBirth, address, name, school, className, classOrPosition } = req.body;

  const applyProfile = (user) => {
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
  };

  if (isMongoConnected) {
    const user = await UserModel.findOne({ id: req.user.id });
    if (!user) return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn' });
    applyProfile(user);
    await user.save();
    const out = safeUser(user.toObject());
    await syncStudentIdentityAcrossCourses(out);
    return res.json(out);
  }

  const db = readDb();
  const user = (db.users || []).find(u => u.id === req.user.id);
  if (!user) return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn' });
  applyProfile(user);
  writeDb(db);
  const out = safeUser(user);
  await syncStudentIdentityAcrossCourses(out);
  res.json(out);
});

// 3. Courses: Get All (Không có dữ liệu ảo)
// Danh sách 8 bài học chuẩn theo Chuyên đề Trí tuệ Nhân tạo Lớp 6 (Chủ đề A và B)
const OFFICIAL_AI_GRADE6_LESSONS = [
  'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
  'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
  'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
  'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
  'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
  'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
  'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
  'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO'
];

// Helper: Lấy thông tin & Avatar thật từ tài khoản Google của giáo viên/người tạo
async function resolveInstructorAvatar(course) {
  if (!course) return course;
  const courseObj = course.toObject ? course.toObject() : { ...course };
  const targetEmail = (courseObj.instructor?.email || courseObj.creator?.email || 'phanphiphu04@gmail.com').toLowerCase().trim();

  let user = null;
  if (isMongoConnected) {
    try {
      user = await UserModel.findOne({ email: targetEmail });
      if (!user && targetEmail !== 'phanphiphu04@gmail.com') {
        user = await UserModel.findOne({ email: 'phanphiphu04@gmail.com' });
      }
    } catch (e) { }
  } else {
    const db = readDb();
    user = (db.users || []).find(u => u.email?.toLowerCase().trim() === targetEmail);
    if (!user && targetEmail !== 'phanphiphu04@gmail.com') {
      user = (db.users || []).find(u => u.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com');
    }
  }

  if (!courseObj.instructor) courseObj.instructor = {};
  courseObj.instructor.email = targetEmail;

  // Xóa bỏ hoàn toàn mọi URL ảnh stock man/unsplash
  const isStockAvatar = (url) => typeof url === 'string' && (
    url.includes('unsplash.com') || 
    url.includes('photo-1507003211169') || 
    url.includes('photo-') ||
    url.includes('images.unsplash')
  );

  if (isStockAvatar(courseObj.instructor.avatar)) {
    courseObj.instructor.avatar = '';
  }

  if (user) {
    if (user.avatar && !isStockAvatar(user.avatar)) {
      courseObj.instructor.avatar = user.avatar;
    }
    courseObj.instructor.name = user.name || 'Phan Phi Phú';

    if (courseObj.creator) {
      if (user.avatar && !isStockAvatar(user.avatar)) courseObj.creator.avatar = user.avatar;
      courseObj.creator.name = user.name || 'Phan Phi Phú';
    }
  } else {
    courseObj.instructor.name = (!courseObj.instructor.name || courseObj.instructor.name === 'Giáo viên' || courseObj.instructor.name === 'Giáo viên phụ trách')
      ? 'Phan Phi Phú'
      : courseObj.instructor.name;
  }

  // Chuẩn hóa tên khóa học chính và khởi tạo chuẩn 8 bài học
  const isMainCourse = courseObj.code === '6AIAB01' || (courseObj.name && (courseObj.name.includes('Chuyên đề AI') || courseObj.name.includes('lớp 6') || courseObj.name.includes('trí tuệ nhân tạo')));
  if (isMainCourse) {
    courseObj.name = 'Chuyên đề trí tuệ nhân tạo lớp 6: Chủ đề A và B';
    courseObj.code = '6AIAB01';
    courseObj.gradeLevel = 'Lớp 6';
    courseObj.category = 'Chuyên đề AI';

    courseObj.modules = Array.isArray(courseObj.modules) ? courseObj.modules : [];
    let modulesChanged = false;

    // Đảm bảo đủ 8 bài học chuẩn xác theo danh sách đề ra
    for (let i = 0; i < OFFICIAL_AI_GRADE6_LESSONS.length; i++) {
      const officialTitle = OFFICIAL_AI_GRADE6_LESSONS[i];
      if (!courseObj.modules[i]) {
        courseObj.modules.push({
          id: `module-lesson-${i + 1}`,
          title: officialTitle,
          description: `Chương trình học tập và bài thực hành cho ${officialTitle}`,
          isLocked: false,
          activities: []
        });
        modulesChanged = true;
      } else if (courseObj.modules[i].title !== officialTitle && !courseObj.modules[i].title.startsWith(`BÀI ${i + 1}:`)) {
        courseObj.modules[i].title = officialTitle;
        modulesChanged = true;
      }
    }

    if (modulesChanged) {
      if (isMongoConnected) {
        try {
          await CourseModel.updateOne(
            { $or: [{ id: courseObj.id }, { code: '6AIAB01' }] },
            { $set: { modules: courseObj.modules, name: courseObj.name, instructor: courseObj.instructor } }
          );
        } catch (e) { }
      } else {
        const db = readDb();
        const found = (db.courses || []).find(c => c.id === courseObj.id || c.code === '6AIAB01');
        if (found) {
          found.modules = courseObj.modules;
          found.name = courseObj.name;
          found.instructor = courseObj.instructor;
          writeDb(db);
        }
      }
    }
  }

  return courseObj;
}

// Khởi tạo và bảo đảm khóa học Chuyên đề Trí tuệ Nhân tạo Lớp 6 luôn tồn tại đầy đủ 8 bài học (không gán dữ liệu ảo)
const FAKE_DEMO_STUDENT_IDS = new Set(['hs-601', 'hs-602', 'hs-603', 'hs-604']);

async function ensureDefaultCourse() {
  const defaultCourse = {
    id: '6AIAB01',
    code: '6AIAB01',
    name: 'Chuyên đề trí tuệ nhân tạo lớp 6: Chủ đề A và B',
    category: 'Chuyên đề AI',
    gradeLevel: 'Lớp 6',
    semester: 'Học kỳ 1',
    academicYear: '2026-2027',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    description: 'Chương trình đào tạo Chuyên đề Trí tuệ Nhân tạo Lớp 6: Chủ đề A và B dành cho học sinh THCS.',
    targetAudience: 'Học sinh Lớp 6',
    instructor: {
      id: 'admin',
      name: 'Phan Phi Phú',
      email: 'phanphiphu04@gmail.com',
      avatar: '',
      title: 'Giáo viên phụ trách'
    },
    modules: OFFICIAL_AI_GRADE6_LESSONS.map((title, idx) => ({
      id: `module-lesson-${idx + 1}`,
      courseId: '6AIAB01',
      order: idx + 1,
      title: title,
      description: `Nội dung học tập và bài thực hành cho ${title}`,
      activities: []
    })),
    enrolledStudents: [],
    enrolledStudentsCount: 0,
    files: [],
    announcements: [
      {
        id: 'anc-welcome',
        title: 'Thông báo môn học Chuyên đề Trí tuệ Nhân tạo Lớp 6',
        content: 'Chào mừng các em học sinh tham gia học tập. Hãy theo dõi các bài học và nộp bài tập đúng hạn.',
        author: 'Phan Phi Phú',
        createdAt: '15/11/2026',
        isImportant: true
      }
    ],
    certificateEligible: true
  };

  if (isMongoConnected) {
    try {
      const existing = await CourseModel.findOne({ $or: [{ id: '6AIAB01' }, { code: '6AIAB01' }] });
      if (!existing) {
        const created = await CourseModel.create(defaultCourse);
        return created.toObject();
      } else {
        let changed = false;
        if (!existing.modules || existing.modules.length < 8) {
          existing.modules = defaultCourse.modules;
          changed = true;
        } else {
          existing.modules = existing.modules.map((m, idx) => {
            const cleanActs = (m.activities || []).filter(a => !a?.id || !/^act-\d+-[1234]$/.test(a.id));
            if (cleanActs.length !== (m.activities || []).length) changed = true;
            return {
              ...m,
              id: m.id || `module-lesson-${idx + 1}`,
              title: OFFICIAL_AI_GRADE6_LESSONS[idx] || m.title,
              activities: cleanActs
            };
          });
        }
        if (existing.name !== defaultCourse.name) {
          existing.name = defaultCourse.name;
          changed = true;
        }
        // Dọn dẹp 4 học sinh ảo mẫu (hs-601..604) để bảng theo dõi chỉ hiển thị học sinh thật
        if (Array.isArray(existing.enrolledStudents) && existing.enrolledStudents.some(s => FAKE_DEMO_STUDENT_IDS.has(s?.id))) {
          existing.enrolledStudents = existing.enrolledStudents.filter(s => !FAKE_DEMO_STUDENT_IDS.has(s?.id));
          existing.enrolledStudentsCount = existing.enrolledStudents.length;
          existing.markModified('enrolledStudents');
          changed = true;
        }
        if (changed) {
          existing.markModified('modules');
          await existing.save();
        }
        return existing.toObject();
      }
    } catch (e) {
      return defaultCourse;
    }
  } else {
    const db = readDb();
    db.courses = db.courses || [];
    let existing = db.courses.find(c => c.id === '6AIAB01' || c.code === '6AIAB01');
    if (!existing) {
      db.courses.push(defaultCourse);
      writeDb(db);
      return defaultCourse;
    } else {
      let changed = false;
      if (!existing.modules || existing.modules.length < 8) {
        existing.modules = defaultCourse.modules;
        changed = true;
      } else {
        existing.modules = existing.modules.map((m, idx) => {
          const cleanActs = (m.activities || []).filter(a => !a?.id || !/^act-\d+-[1234]$/.test(a.id));
          if (cleanActs.length !== (m.activities || []).length) changed = true;
          return {
            ...m,
            id: m.id || `module-lesson-${idx + 1}`,
            title: OFFICIAL_AI_GRADE6_LESSONS[idx] || m.title,
            activities: cleanActs
          };
        });
      }
      if (existing.name !== defaultCourse.name) {
        existing.name = defaultCourse.name;
        changed = true;
      }
      if (Array.isArray(existing.enrolledStudents) && existing.enrolledStudents.some(s => FAKE_DEMO_STUDENT_IDS.has(s?.id))) {
        existing.enrolledStudents = existing.enrolledStudents.filter(s => !FAKE_DEMO_STUDENT_IDS.has(s?.id));
        existing.enrolledStudentsCount = existing.enrolledStudents.length;
        changed = true;
      }
      if (changed) {
        writeDb(db);
      }
      return existing;
    }
  }
}

app.get('/api/courses', async (req, res) => {
  let list = isMongoConnected
    ? (await CourseModel.find()).map(c => c.toObject())
    : (readDb().courses || []);

  if (!list || list.length === 0 || !list.some(c => c.code === '6AIAB01' || c.id === '6AIAB01')) {
    const seeded = await ensureDefaultCourse();
    if (!list || list.length === 0) {
      list = [seeded];
    } else if (!list.some(c => c.code === '6AIAB01' || c.id === '6AIAB01')) {
      list.unshift(seeded);
    }
  }

  const records = req.user ? await listProgress({ userId: req.user.id }) : [];
  const result = await Promise.all(list.map(async (c) => {
    const enriched = await resolveInstructorAvatar(c);
    return viewCourse(enriched, req.user, records.filter(p => p.courseId === enriched.id));
  }));
  res.json(result);
});

// 4. Courses: Get By ID
app.get('/api/courses/:id', async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json(await viewCourseFor(course, req.user));
});

// 5. Courses: Create new Course (Thêm khóa học thật từ API)
app.post('/api/courses', requireStaff, async (req, res) => {
  const creatorEmail = (req.body.instructor?.email || req.body.creator?.email || 'phanphiphu04@gmail.com').toLowerCase().trim();
  let userCreator = null;
  if (isMongoConnected) {
    try {
      userCreator = await UserModel.findOne({ email: creatorEmail });
    } catch (e) { }
  } else {
    const db = readDb();
    userCreator = (db.users || []).find(u => u.email?.toLowerCase().trim() === creatorEmail);
  }

  const realAvatar = (userCreator && userCreator.avatar)
    ? userCreator.avatar
    : (req.body.instructor?.avatar && !req.body.instructor.avatar.includes('unsplash.com') ? req.body.instructor.avatar : '');
  const realName = (userCreator && userCreator.name)
    ? userCreator.name
    : (req.body.instructor?.name && req.body.instructor.name !== 'Giáo viên' && req.body.instructor.name !== 'Giáo viên phụ trách' ? req.body.instructor.name : 'Phú Phan');

  const newCourseData = {
    id: req.body.id || `course-${Date.now()}`,
    code: req.body.code || 'HP-NEW',
    name: req.body.name || 'Học phần mới',
    category: req.body.category || 'Chuyên đề AI',
    gradeLevel: req.body.gradeLevel || 'Lớp 10',
    credits: req.body.credits || 3,
    semester: req.body.semester || 'Học kỳ 1',
    academicYear: '2026 - 2027',
    instructor: {
      name: realName,
      title: req.body.instructor?.title || 'Giáo viên phụ trách',
      avatar: realAvatar,
      email: creatorEmail
    },
    creator: {
      name: realName,
      email: creatorEmail,
      avatar: realAvatar
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
    files: req.body.files || [],
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
app.put('/api/courses/:id', requireStaff, async (req, res) => {
  const { id } = req.params;
  // Danh sách ghi danh do API đăng ký quản lý, tiến độ nằm ở bảng riêng:
  // không cho bản dữ liệu (có thể đã cũ) từ trình duyệt ghi đè lên.
  const { _id, __v, id: _ignoredId, enrolledStudents, enrolledStudentsCount, progress, completedActivities, ...updateData } = req.body || {};
  if (updateData.modules) updateData.modules = stripStudentState(updateData.modules);

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
app.delete('/api/courses/:id', requireStaff, async (req, res) => {
  const { id } = req.params;

  const existing = await loadCourseObj(id);
  if (existing) await removeProgress({ courseId: existing.id });

  if (isMongoConnected) {
    try {
      await CourseModel.deleteOne({ $or: [{ id }, ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : [])] });
      return res.json({ success: true, message: 'Đã xóa khóa học thành công' });
    } catch (err) { }
  }

  const db = readDb();
  db.courses = (db.courses || []).filter(c => c.id !== id && c._id !== id);
  writeDb(db);
  res.json({ success: true, message: 'Đã xóa khóa học thành công' });
});

// 5.3 Modules: Add Module to Course
app.post('/api/courses/:id/modules', requireStaff, async (req, res) => {
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
app.put('/api/courses/:id/modules/:modId', requireStaff, async (req, res) => {
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
    } catch (err) { }
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
app.delete('/api/courses/:id/modules/:modId', requireStaff, async (req, res) => {
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
    } catch (err) { }
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
app.post('/api/courses/:id/modules/:modId/activities', requireStaff, async (req, res) => {
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
app.put('/api/courses/:id/activities/:actId', requireStaff, async (req, res) => {
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
    } catch (err) { }
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
app.delete('/api/courses/:id/activities/:actId', requireStaff, async (req, res) => {
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
              await removeProgress({ courseId: course.id, activityId: actId });
              return res.json({ success: true, message: 'Đã xóa bài học thành công' });
            }
          }
        }
      }
    } catch (err) { }
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

// 5.9 Courses: Đăng ký khóa học — danh tính lấy từ token, không lấy từ dữ liệu client gửi lên
app.post('/api/courses/:id/enroll', requireAuth, async (req, res) => {
  const user = req.user;
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học để đăng ký' });

  const studentObj = {
    id: user.id,
    name: user.name || 'Học viên',
    email: user.email || '',
    code: user.code || '',
    className: user.className || user.classOrPosition || '',
    school: user.school || user.department || '',
    avatar: user.avatar || '',
    enrolledAt: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    status: 'Đang học'
  };

  if (isMongoConnected) {
    await UserModel.updateOne({ id: user.id }, { $addToSet: { enrolledCourses: course.id } });
    if (!isEnrolled(course, user)) {
      await CourseModel.updateOne(
        { id: course.id, 'enrolledStudents.id': { $ne: user.id } },
        { $push: { enrolledStudents: studentObj }, $inc: { enrolledStudentsCount: 1 } }
      );
    }
  } else {
    const db = readDb();
    const u = (db.users || []).find(x => x.id === user.id);
    if (u) {
      u.enrolledCourses = u.enrolledCourses || [];
      if (!u.enrolledCourses.includes(course.id)) u.enrolledCourses.push(course.id);
    }
    const c = (db.courses || []).find(x => x.id === course.id);
    if (c && !isEnrolled(c, user)) {
      c.enrolledStudents = c.enrolledStudents || [];
      c.enrolledStudents.push(studentObj);
      c.enrolledStudentsCount = c.enrolledStudents.length;
    }
    writeDb(db);
  }

  const fresh = await loadCourseObj(course.id);
  res.json({ success: true, course: await viewCourseFor(fresh, user), message: 'Đăng ký khóa học thành công' });
});

async function courseProgressOf(course, userId) {
  const ids = new Set(allActivities(course).map(a => a.id));
  const records = await listProgress({ courseId: course.id, userId });
  const completed = records.filter(p => p.isCompleted && ids.has(p.activityId)).length;
  return ids.size > 0 ? Math.round((completed / ids.size) * 100) : 0;
}

// 6. Activities: Mark Completed (ghi nhận cho đúng học sinh đang đăng nhập)
app.post('/api/courses/:id/activities/:actId/complete', requireAuth, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;
  const existing = await getOneProgress(ctx.course.id, req.user.id, ctx.activity.id);
  const now = nowVN();
  // Bài trắc nghiệm chỉ được tính hoàn thành khi nộp bài và đạt điểm (xử lý ở quiz-submit)
  if (ctx.activity.type !== 'quiz') {
    const patch = {
      isCompleted: true,
      completedAt: existing?.completedAt || now,
      lastAccessedAt: now,
      firstAccessedAt: existing?.firstAccessedAt || now,
      viewCount: Math.max(1, existing?.viewCount || 0)
    };
    if (ctx.activity.type === 'video') {
      const prevVp = existing?.videoProgress || {};
      const totalSeconds = prevVp.totalSeconds || (ctx.activity.videoDuration || 0);
      patch.videoProgress = {
        ...prevVp,
        watchedSeconds: Math.max(prevVp.watchedSeconds || 0, totalSeconds),
        lastPositionSeconds: Math.max(prevVp.lastPositionSeconds || 0, totalSeconds),
        totalSeconds,
        progressPercent: 100,
        lastWatchedAt: now
      };
    }
    await saveProgress(ctx.course.id, req.user.id, ctx.activity.id, patch, req.user.email);
  }
  res.json({ success: true, progress: await courseProgressOf(ctx.course, req.user.id) });
});

// 6.05 Activities: Telemetry Tracking (ghi nhận lượt truy cập & thời gian học tập thực tế cho mọi hoạt động)
app.post('/api/courses/:id/activities/:actId/track', requireAuth, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;

  const event = req.body.event === 'heartbeat' ? 'heartbeat' : 'view';
  const deltaSeconds = Math.min(120, Math.max(0, Math.floor(Number(req.body.deltaSeconds) || 0)));
  const actionLabel = String(req.body.action || '').slice(0, 120);

  const existing = await getOneProgress(ctx.course.id, req.user.id, ctx.activity.id);
  const now = nowVN();
  const viewCount = (existing?.viewCount || 0) + (event === 'view' ? 1 : 0);
  const timeSpentSeconds = (existing?.timeSpentSeconds || 0) + deltaSeconds;

  const patch = {
    viewCount: Math.max(1, viewCount),
    timeSpentSeconds,
    firstAccessedAt: existing?.firstAccessedAt || now,
    lastAccessedAt: now,
    lastAction: actionLabel || existing?.lastAction || 'Đang học'
  };

  await saveProgress(ctx.course.id, req.user.id, ctx.activity.id, patch, req.user.email);
  res.json({ success: true, viewCount: patch.viewCount, timeSpentSeconds, lastAccessedAt: now });
});

// 6.1 Activities: Track Video Progress (giữ mốc % cao nhất, lưu vị trí xem, tự động hoàn thành khi >= 80%)
app.post('/api/courses/:id/activities/:actId/video-progress', requireAuth, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;

  const existing = await getOneProgress(ctx.course.id, req.user.id, ctx.activity.id);
  const prevVp = existing?.videoProgress || {};

  const currentPos = Math.max(0, Math.floor(Number(req.body.watchedSeconds) || 0));
  const incomingTotal = Math.max(0, Math.floor(Number(req.body.totalSeconds) || 0));
  const totalSeconds = Math.max(incomingTotal, prevVp.totalSeconds || 0);
  const deltaSeconds = Math.min(120, Math.max(0, Math.floor(Number(req.body.deltaSeconds) || 0)));

  let incomingPercent = Math.min(100, Math.max(0, Math.round(Number(req.body.progressPercent) || 0)));
  if (totalSeconds > 0 && incomingPercent === 0 && currentPos > 0) {
    incomingPercent = Math.min(100, Math.round((currentPos / totalSeconds) * 100));
  }

  // Gộp kết quả trả lời các neo chặn video (Video Checkpoints)
  const checkpoints = Array.isArray(ctx.activity.videoCheckpoints) ? ctx.activity.videoCheckpoints : [];
  const incomingCpResults = (req.body.checkpointResults && typeof req.body.checkpointResults === 'object') ? req.body.checkpointResults : {};
  const mergedCpResults = { ...(prevVp.checkpointResults || {}), ...incomingCpResults };
  const checkpointsTotal = checkpoints.length;
  const checkpointsPassed = checkpoints.filter(cp => {
    const r = mergedCpResults[cp.id];
    if (!r) return false;
    return cp.requireCorrect !== false ? !!r.isCorrect : true;
  }).length;

  // Bảo toàn mốc tiến độ cao nhất (high-water mark) để học sinh tua lại xem không bị mất % đã đạt
  const maxWatchedSeconds = Math.max(prevVp.watchedSeconds || 0, currentPos);
  const maxProgressPercent = Math.min(100, Math.max(prevVp.progressPercent || 0, incomingPercent));
  const allCheckpointsCleared = checkpointsTotal === 0 || checkpointsPassed >= checkpointsTotal;
  const isCompleted = !!existing?.isCompleted || (maxProgressPercent >= 80 && allCheckpointsCleared);
  const now = nowVN();

  const videoProgress = {
    watchedSeconds: maxWatchedSeconds,
    lastPositionSeconds: currentPos,
    totalSeconds,
    progressPercent: maxProgressPercent,
    lastWatchedAt: now,
    checkpointResults: mergedCpResults,
    checkpointsPassed,
    checkpointsTotal
  };

  const patch = {
    videoProgress,
    viewCount: Math.max(1, existing?.viewCount || 0),
    timeSpentSeconds: (existing?.timeSpentSeconds || 0) + deltaSeconds,
    firstAccessedAt: existing?.firstAccessedAt || now,
    lastAccessedAt: now,
    lastAction: checkpointsTotal > 0
      ? `Xem video (${maxProgressPercent}% • Neo ${checkpointsPassed}/${checkpointsTotal})`
      : `Xem video (${maxProgressPercent}%)`
  };
  if (isCompleted) {
    patch.isCompleted = true;
    patch.completedAt = existing?.completedAt || now;
  }

  await saveProgress(ctx.course.id, req.user.id, ctx.activity.id, patch, req.user.email);
  res.json({
    success: true,
    isCompleted,
    videoProgress,
    overallCourseProgress: await courseProgressOf(ctx.course, req.user.id)
  });
});

// 7. Activities: Submit Assignment (mỗi học sinh một bài nộp riêng)
app.post('/api/courses/:id/activities/:actId/submit', requireAuth, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;

  const fileName = String(req.body.fileName || '').slice(0, 300);
  const textSubmission = String(req.body.textSubmission || '').slice(0, 50000);
  if (!fileName && !textSubmission.trim()) {
    return res.status(400).json({ message: 'Bài nộp đang trống.' });
  }

  const existing = await getOneProgress(ctx.course.id, req.user.id, ctx.activity.id);
  const now = nowVN();
  const subData = {
    status: 'submitted',
    fileName,
    fileSize: String(req.body.fileSize || '').slice(0, 30),
    fileUrl: String(req.body.fileUrl || '').slice(0, 500),
    submittedAt: now,
    textSubmission
  };
  await saveProgress(ctx.course.id, req.user.id, ctx.activity.id, {
    isCompleted: true,
    completedAt: existing?.completedAt || now,
    submission: subData,
    score: null,
    viewCount: Math.max(1, existing?.viewCount || 0),
    firstAccessedAt: existing?.firstAccessedAt || now,
    lastAccessedAt: now,
    lastAction: 'Đã nộp bài tập'
  }, req.user.email);
  res.json({ success: true, submission: subData });
});

// Helper: gom danh sách học sinh thực tế + khớp tiến độ theo cả userId và email (chống mất dữ liệu khi đăng nhập Google)
async function buildStudentRosterWithProgress(course, allRecords, includeOnlyUser = null) {
  const enrolledRaw = (course.enrolledStudents || []).filter(s => !FAKE_DEMO_STUDENT_IDS.has(s?.id));
  const recordUserIds = [...new Set(allRecords.map(r => r.userId).filter(Boolean))];
  const enrolledIds = enrolledRaw.map(s => s.id).filter(Boolean);
  const enrolledEmails = enrolledRaw.map(s => String(s.email || '').toLowerCase().trim()).filter(Boolean);

  const [usersById, usersByEmail] = await Promise.all([
    findUsersByIds([...enrolledIds, ...recordUserIds]),
    findUsersByEmails(enrolledEmails)
  ]);

  const userById = new Map(usersById.map(u => [u.id, u]));
  const userByEmail = new Map();
  [...usersById, ...usersByEmail].forEach(u => {
    const em = String(u.email || '').toLowerCase().trim();
    if (em) userByEmail.set(em, u);
  });

  // Xây dựng roster chuẩn không trùng lặp, tự động bao gồm cả học sinh có bản ghi tiến độ nhưng chưa nằm trong enrolledStudents
  const rosterMap = new Map();
  const addToRoster = (entry) => {
    const normEmail = String(entry.email || '').toLowerCase().trim();
    const realUser = userById.get(entry.id) || (normEmail ? userByEmail.get(normEmail) : null);
    if (realUser && isStaff(realUser)) return; // Không trộn giáo viên/admin vào danh sách học sinh chấm điểm
    const canonicalId = realUser?.id || entry.id;
    const key = normEmail || canonicalId;
    if (!key) return;
    if (!rosterMap.has(key)) {
      rosterMap.set(key, {
        id: canonicalId,
        rawIds: new Set([entry.id, canonicalId].filter(Boolean)),
        name: realUser?.name || entry.name || 'Học sinh',
        email: normEmail || String(realUser?.email || '').toLowerCase().trim(),
        className: realUser?.className || realUser?.classOrPosition || entry.className || '',
        code: realUser?.code || entry.code || '',
        school: realUser?.school || realUser?.department || entry.school || '',
        avatar: realUser?.avatar || entry.avatar || '',
        enrolledAt: entry.enrolledAt || '',
        status: entry.status || 'Đang học'
      });
    } else {
      const ex = rosterMap.get(key);
      if (entry.id) ex.rawIds.add(entry.id);
      if (canonicalId) ex.rawIds.add(canonicalId);
      if (!ex.avatar && (realUser?.avatar || entry.avatar)) ex.avatar = realUser?.avatar || entry.avatar;
      if (!ex.className && (realUser?.className || entry.className)) ex.className = realUser?.className || entry.className;
    }
  };

  enrolledRaw.forEach(addToRoster);
  recordUserIds.forEach(uid => {
    const u = userById.get(uid);
    if (u && !isStaff(u)) {
      addToRoster({ id: u.id, name: u.name, email: u.email, className: u.className, code: u.code, school: u.school, avatar: u.avatar });
    }
  });

  let roster = [...rosterMap.values()];
  if (includeOnlyUser) {
    const myEmail = String(includeOnlyUser.email || '').toLowerCase().trim();
    roster = roster.filter(s => s.id === includeOnlyUser.id || (myEmail && s.email === myEmail));
    if (roster.length === 0) {
      roster = [{
        id: includeOnlyUser.id,
        rawIds: new Set([includeOnlyUser.id]),
        name: includeOnlyUser.name || 'Học sinh',
        email: myEmail,
        className: includeOnlyUser.className || includeOnlyUser.classOrPosition || '',
        code: includeOnlyUser.code || '',
        school: includeOnlyUser.school || '',
        avatar: includeOnlyUser.avatar || '',
        enrolledAt: '',
        status: 'Đang học'
      }];
    }
  }

  // Gắn danh sách bản ghi tiến độ khớp theo cả userId (tất cả rawIds) lẫn userEmail
  return roster.map(student => {
    const studentRecords = allRecords.filter(p => {
      if (student.rawIds.has(p.userId)) return true;
      const recEmail = String(p.userEmail || userById.get(p.userId)?.email || '').toLowerCase().trim();
      return !!(student.email && recEmail && recEmail === student.email);
    });
    const { rawIds, ...cleanStudent } = student;
    return { student: cleanStudent, records: studentRecords };
  });
}

// 7.1 Giáo viên xem bài nộp / kết quả / tiến độ của TỪNG học sinh cho một hoạt động (Video, Quiz, Assignment, Document)
app.get('/api/courses/:id/activities/:actId/submissions', requireStaff, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;
  const records = await listProgress({ courseId: ctx.course.id, activityId: ctx.activity.id });
  const roster = await buildStudentRosterWithProgress(ctx.course, records);

  res.json(roster.map(({ student, records: mine }) => {
    const p = mine[0] || null;
    return {
      student: { id: student.id, name: student.name, email: student.email, code: student.code, className: student.className, avatar: student.avatar },
      isCompleted: !!p?.isCompleted,
      completedAt: p?.completedAt || '',
      score: p?.score ?? null,
      submission: p?.submission || null,
      quizResult: p?.quizResult || null,
      videoProgress: p?.videoProgress || null,
      timeSpentSeconds: p?.timeSpentSeconds || 0,
      viewCount: p?.viewCount || 0,
      lastAccessedAt: p?.lastAccessedAt || ''
    };
  }));
});

// 8. Activities: Grade Assignment (chỉ giáo viên, chấm cho một học sinh cụ thể)
app.post('/api/courses/:id/activities/:actId/grade', requireStaff, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;

  const { studentId, feedback } = req.body;
  const grade = Number(req.body.grade);
  const maxScore = Number(ctx.activity.maxScore) || 10;
  if (!studentId) return res.status(400).json({ message: 'Thiếu mã học sinh cần chấm điểm.' });
  if (!Number.isFinite(grade) || grade < 0 || grade > maxScore) {
    return res.status(400).json({ message: `Điểm phải nằm trong khoảng 0 - ${maxScore}.` });
  }

  let [record] = await listProgress({ courseId: ctx.course.id, userId: studentId, activityId: ctx.activity.id });
  let targetUserId = studentId;
  if (!record) {
    // Fallback tìm theo email của student trong lớp nếu ID trước đây khác
    const enrolled = (ctx.course.enrolledStudents || []).find(s => s.id === studentId);
    if (enrolled?.email) {
      const actRecords = await listProgress({ courseId: ctx.course.id, activityId: ctx.activity.id });
      const normEmail = String(enrolled.email).toLowerCase().trim();
      record = actRecords.find(r => String(r.userEmail || '').toLowerCase().trim() === normEmail);
      if (record) targetUserId = record.userId;
    }
  }
  if (!record || !record.submission) {
    return res.status(404).json({ message: 'Học sinh này chưa nộp bài.' });
  }

  const submission = {
    ...record.submission,
    status: 'graded',
    grade,
    feedback: String(feedback || '').slice(0, 5000),
    gradedAt: nowVN(),
    gradedBy: req.user.name || req.user.email
  };
  await saveProgress(ctx.course.id, targetUserId, ctx.activity.id, { score: grade, submission }, record.userEmail || '');
  res.json({ success: true, submission });
});

// 9. Activities: Submit Quiz (điểm do server tự chấm theo đáp án, lưu số câu đúng, số lần làm & thời gian làm bài)
app.post('/api/courses/:id/activities/:actId/quiz-submit', requireAuth, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;

  const answers = (req.body.answers && typeof req.body.answers === 'object') ? req.body.answers : {};
  const questions = Array.isArray(ctx.activity.quizQuestions) ? ctx.activity.quizQuestions : [];
  const maxScore = 10;
  const durationSeconds = Math.max(0, Math.floor(Number(req.body.durationSeconds) || 0));

  let score;
  let correctCount = 0;
  if (questions.length > 0) {
    correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    score = Number(((correctCount / questions.length) * maxScore).toFixed(1));
  } else {
    score = Math.min(Math.max(Number(req.body.score) || 0, 0), maxScore);
  }
  const passScore = Number(ctx.activity.passScore) || 5;
  const passed = score >= passScore;

  const existing = await getOneProgress(ctx.course.id, req.user.id, ctx.activity.id);
  const now = nowVN();
  const attemptCount = (existing?.quizResult?.attemptCount || 0) + 1;
  const quizResult = {
    score,
    maxScore,
    passed,
    submittedAt: now,
    answers,
    correctCount,
    totalQuestions: questions.length,
    attemptCount,
    durationSeconds
  };
  const isCompleted = !!existing?.isCompleted || passed;
  const bestScore = existing?.score !== undefined && existing?.score !== null ? Math.max(existing.score, score) : score;

  await saveProgress(ctx.course.id, req.user.id, ctx.activity.id, {
    isCompleted,
    completedAt: isCompleted ? (existing?.completedAt || now) : '',
    score: bestScore,
    maxScore,
    quizResult,
    viewCount: Math.max(1, existing?.viewCount || 0),
    timeSpentSeconds: (existing?.timeSpentSeconds || 0) + durationSeconds,
    firstAccessedAt: existing?.firstAccessedAt || now,
    lastAccessedAt: now,
    lastAction: `Nộp trắc nghiệm (${score}/10)`
  }, req.user.email);
  res.json({ success: true, passed, score, result: quizResult, questions });
});

// 9.01 Sổ điểm & Bảng theo dõi tiến độ toàn diện của cả lớp (kèm phân tích mô-đun, câu hỏi trắc nghiệm & cảnh báo học sinh)
app.get('/api/courses/:id/gradebook', requireAuth, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });

  const modulesRaw = course.modules || [];
  const moduleTitleById = new Map(modulesRaw.map(m => [m.id, m.title]));
  const acts = modulesRaw.flatMap(m => (m.activities || []).map(a => ({ ...a, moduleId: a.moduleId || m.id, moduleTitle: m.title })));
  const records = await listProgress({ courseId: course.id });

  const roster = await buildStudentRosterWithProgress(course, records, isStaff(req.user) ? null : req.user);

  const activitiesBase = acts.map(a => ({
    id: a.id,
    moduleId: a.moduleId,
    moduleTitle: a.moduleTitle || moduleTitleById.get(a.moduleId) || '',
    title: a.title,
    type: a.type,
    maxScore: a.maxScore || 10,
    dueDate: a.dueDate || '',
    videoDuration: a.videoDuration || 0,
    videoCheckpointsCount: Array.isArray(a.videoCheckpoints) ? a.videoCheckpoints.length : 0,
    passScore: a.passScore || 5,
    quizQuestions: isStaff(req.user) ? (a.quizQuestions || []) : (a.quizQuestions || [])
  }));

  // Tính dòng tiến độ cho từng học sinh
  const studentRows = roster.map(({ student, records: mineRecords }) => {
    const recByAct = new Map();
    mineRecords.forEach(p => {
      const existing = recByAct.get(p.activityId);
      if (!existing || (p.updatedAt || '') > (existing.updatedAt || '')) {
        recByAct.set(p.activityId, p);
      }
    });

    let totalScore = 0;
    let scoreCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let totalTimeSpentSeconds = 0;
    let totalViews = 0;
    let latestIso = '';

    const activityProgress = activitiesBase.map(act => {
      const p = recByAct.get(act.id);
      const isCompleted = !!p?.isCompleted;
      const vp = p?.videoProgress || null;
      const viewCount = p?.viewCount || 0;
      const timeSpentSeconds = p?.timeSpentSeconds || 0;
      const hasStarted = isCompleted || !!p?.submission || !!p?.quizResult || (vp?.progressPercent || 0) > 0 || viewCount > 0 || timeSpentSeconds > 0;

      if (isCompleted) completedCount++;
      else if (hasStarted) inProgressCount++;

      totalTimeSpentSeconds += timeSpentSeconds;
      totalViews += viewCount;
      if (p?.updatedAt && p.updatedAt > latestIso) latestIso = p.updatedAt;

      const score = p?.score ?? null;
      if (score !== null && Number.isFinite(score)) {
        totalScore += score;
        scoreCount++;
      }

      const status = isCompleted ? 'completed' : hasStarted ? 'in_progress' : 'not_started';
      // Ẩn đáp án với học sinh chưa làm quiz
      const questionsForRow = (isStaff(req.user) || p?.quizResult)
        ? act.quizQuestions
        : [];

      return {
        activityId: act.id,
        moduleId: act.moduleId,
        moduleTitle: act.moduleTitle,
        title: act.title,
        type: act.type,
        maxScore: act.maxScore,
        status,
        isCompleted,
        completedAt: p?.completedAt || '',
        score,
        videoProgress: vp,
        submission: p?.submission || null,
        quizResult: p?.quizResult || null,
        quizQuestions: questionsForRow,
        timeSpentSeconds,
        viewCount,
        lastAccessedAt: p?.lastAccessedAt || '',
        lastAction: p?.lastAction || ''
      };
    });

    // Tiến độ riêng theo từng bài học (8 mô-đun)
    const moduleProgress = modulesRaw.map(m => {
      const mActs = activityProgress.filter(ap => ap.moduleId === m.id);
      const mDone = mActs.filter(ap => ap.isCompleted).length;
      const mInProg = mActs.filter(ap => ap.status === 'in_progress').length;
      return {
        moduleId: m.id,
        moduleTitle: m.title,
        order: m.order,
        total: mActs.length,
        completed: mDone,
        inProgress: mInProg,
        percent: mActs.length > 0 ? Math.round((mDone / mActs.length) * 100) : 0
      };
    });

    const overallProgress = acts.length > 0 ? Math.round((completedCount / acts.length) * 100) : 0;
    const averageScore = scoreCount > 0 ? Number((totalScore / scoreCount).toFixed(1)) : null;

    // Phân loại trạng thái học tập thông minh giúp giáo viên dễ nhận diện học sinh cần hỗ trợ
    let engagementStatus = 'inactive';
    if (acts.length > 0 && overallProgress === 100) engagementStatus = 'completed';
    else if (overallProgress >= 50 || (averageScore !== null && averageScore >= 7)) engagementStatus = 'on_track';
    else if (completedCount > 0 || inProgressCount > 0 || totalViews > 0) engagementStatus = 'needs_attention';

    return {
      student,
      overallProgress,
      completedCount,
      inProgressCount,
      totalActivities: acts.length,
      averageScore,
      totalTimeSpentSeconds,
      totalViews,
      lastActivityAt: latestIso,
      engagementStatus,
      moduleProgress,
      activities: activityProgress
    };
  });

  // Thống kê theo từng hoạt động & phân tích từng câu hỏi trắc nghiệm (tỷ lệ đúng/sai)
  const activitiesEnriched = activitiesBase.map(act => {
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let scoreSum = 0;
    let scoreNum = 0;
    let videoPctSum = 0;
    let videoWatchers = 0;
    let pendingGradingCount = 0;
    let submittedCount = 0;

    const qCorrectMap = new Map();
    const qAttemptMap = new Map();

    studentRows.forEach(row => {
      const ap = row.activities.find(x => x.activityId === act.id);
      if (!ap) return;
      if (ap.isCompleted) completedCount++;
      else if (ap.status === 'in_progress') inProgressCount++;
      else notStartedCount++;

      if (ap.score !== null && Number.isFinite(ap.score)) {
        scoreSum += ap.score;
        scoreNum++;
      }
      if (act.type === 'video') {
        const pct = ap.videoProgress?.progressPercent ?? (ap.isCompleted ? 100 : 0);
        if (pct > 0) {
          videoPctSum += pct;
          videoWatchers++;
        }
      }
      if (act.type === 'assignment' && ap.submission) {
        submittedCount++;
        if (ap.submission.status !== 'graded') pendingGradingCount++;
      }
      if (act.type === 'quiz' && ap.quizResult?.answers) {
        submittedCount++;
        (act.quizQuestions || []).forEach(q => {
          qAttemptMap.set(q.id, (qAttemptMap.get(q.id) || 0) + 1);
          if (ap.quizResult.answers[q.id] === q.correctAnswer) {
            qCorrectMap.set(q.id, (qCorrectMap.get(q.id) || 0) + 1);
          }
        });
      }
    });

    const questionStats = act.type === 'quiz' && isStaff(req.user)
      ? (act.quizQuestions || []).map((q, idx) => {
          const attempts = qAttemptMap.get(q.id) || 0;
          const correct = qCorrectMap.get(q.id) || 0;
          return {
            id: q.id,
            index: idx + 1,
            question: q.question,
            attempts,
            correct,
            wrong: Math.max(0, attempts - correct),
            accuracyPercent: attempts > 0 ? Math.round((correct / attempts) * 100) : null
          };
        })
      : [];

    return {
      ...act,
      quizQuestions: isStaff(req.user) ? act.quizQuestions : [],
      stats: {
        completedCount,
        inProgressCount,
        notStartedCount,
        completionRate: studentRows.length > 0 ? Math.round((completedCount / studentRows.length) * 100) : 0,
        avgScore: scoreNum > 0 ? Number((scoreSum / scoreNum).toFixed(1)) : null,
        avgVideoPercent: videoWatchers > 0 ? Math.round(videoPctSum / videoWatchers) : 0,
        videoWatchers,
        submittedCount,
        pendingGradingCount
      },
      questionStats
    };
  });

  // Thống kê theo từng mô-đun (8 bài học)
  const modulesSummary = modulesRaw.map(m => {
    const mActsCount = (m.activities || []).length;
    let pctSum = 0;
    let doneStudents = 0;
    studentRows.forEach(r => {
      const mp = r.moduleProgress.find(x => x.moduleId === m.id);
      if (mp) {
        pctSum += mp.percent;
        if (mActsCount > 0 && mp.completed === mActsCount) doneStudents++;
      }
    });
    return {
      id: m.id,
      title: m.title,
      order: m.order,
      activityCount: mActsCount,
      avgCompletionPercent: studentRows.length > 0 && mActsCount > 0 ? Math.round(pctSum / studentRows.length) : 0,
      completedStudentsCount: doneStudents
    };
  });

  // Tóm tắt KPI toàn lớp
  const totalStudents = studentRows.length;
  const avgProgress = totalStudents > 0
    ? Math.round(studentRows.reduce((s, r) => s + r.overallProgress, 0) / totalStudents)
    : 0;
  const scoredRows = studentRows.filter(r => r.averageScore !== null);
  const classAvgScore = scoredRows.length > 0
    ? Number((scoredRows.reduce((s, r) => s + r.averageScore, 0) / scoredRows.length).toFixed(1))
    : null;
  const pendingGrading = activitiesEnriched.reduce((s, a) => s + (a.stats.pendingGradingCount || 0), 0);
  const completedStudentsCount = studentRows.filter(r => r.engagementStatus === 'completed').length;
  const activeStudentsCount = studentRows.filter(r => r.engagementStatus !== 'inactive').length;
  const atRiskStudentsCount = studentRows.filter(r => r.engagementStatus === 'inactive' || r.engagementStatus === 'needs_attention').length;
  const totalTimeSpentSeconds = studentRows.reduce((s, r) => s + (r.totalTimeSpentSeconds || 0), 0);

  res.json({
    courseId: course.id,
    courseName: course.name,
    modules: modulesSummary,
    activities: activitiesEnriched,
    students: studentRows,
    summary: {
      totalStudents,
      avgProgress,
      classAvgScore,
      pendingGrading,
      completedStudentsCount,
      activeStudentsCount,
      atRiskStudentsCount,
      totalTimeSpentSeconds
    }
  });
});

// 9.02 Giáo viên ghi danh học viên mới vào lớp (tự động liên kết tài khoản Google thật nếu đã tồn tại)
app.post('/api/courses/:id/enroll-student', requireStaff, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const className = String(req.body.className || 'Lớp 6A').trim();
  const code = String(req.body.code || '').trim();

  if (!name || !email) {
    return res.status(400).json({ message: 'Vui lòng nhập họ tên và email học sinh.' });
  }

  const existing = (course.enrolledStudents || []).find(
    s => String(s.email || '').toLowerCase().trim() === email || (req.body.id && s.id === req.body.id)
  );
  if (existing) {
    return res.status(400).json({ message: 'Học sinh này đã có trong danh sách lớp.' });
  }

  // Tìm tài khoản User thật đã tồn tại theo email để khớp đúng userId
  const [matchedUser] = await findUsersByEmails([email]);
  const studentObj = {
    id: matchedUser?.id || req.body.id || `student-${Date.now()}`,
    name: matchedUser?.name || name,
    email,
    className: matchedUser?.className || className,
    code: matchedUser?.code || code || `HS${Math.floor(100 + Math.random() * 900)}`,
    school: matchedUser?.school || req.body.school || 'THCS',
    avatar: matchedUser?.avatar || req.body.avatar || '',
    enrolledAt: nowVN(),
    status: 'Đang học'
  };

  if (isMongoConnected) {
    await CourseModel.updateOne(
      { $or: [{ id: course.id }, { code: course.id }] },
      { $push: { enrolledStudents: studentObj }, $inc: { enrolledStudentsCount: 1 } }
    );
    if (matchedUser?.id) {
      await UserModel.updateOne({ id: matchedUser.id }, { $addToSet: { enrolledCourses: course.id } });
    }
  } else {
    const db = readDb();
    const c = db.courses?.find(x => x.id === course.id || x.code === course.id);
    if (c) {
      c.enrolledStudents = c.enrolledStudents || [];
      c.enrolledStudents.push(studentObj);
      c.enrolledStudentsCount = c.enrolledStudents.length;
    }
    if (matchedUser?.id) {
      const u = (db.users || []).find(x => x.id === matchedUser.id);
      if (u) {
        u.enrolledCourses = u.enrolledCourses || [];
        if (!u.enrolledCourses.includes(course.id)) u.enrolledCourses.push(course.id);
      }
    }
    writeDb(db);
  }

  res.json({ success: true, student: studentObj });
});

// 9.03 Giáo viên gỡ học viên khỏi danh sách lớp
app.delete('/api/courses/:id/students/:studentId', requireStaff, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
  const targetId = req.params.studentId;

  if (isMongoConnected) {
    const doc = await getCourseDoc(course.id);
    if (doc) {
      doc.enrolledStudents = (doc.enrolledStudents || []).filter(s => s.id !== targetId);
      doc.enrolledStudentsCount = doc.enrolledStudents.length;
      doc.markModified('enrolledStudents');
      await doc.save();
    }
  } else {
    const db = readDb();
    const c = (db.courses || []).find(x => x.id === course.id || x.code === course.id);
    if (c) {
      c.enrolledStudents = (c.enrolledStudents || []).filter(s => s.id !== targetId);
      c.enrolledStudentsCount = c.enrolledStudents.length;
      writeDb(db);
    }
  }
  res.json({ success: true, studentId: targetId });
});

// 9.035 Nhập gói học liệu / mô-đun từ file JSON đã xuất (chuyển giữa các khóa học hoặc LMS)
app.post('/api/courses/:id/import-package', requireStaff, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });

  const incomingModules = Array.isArray(req.body?.modules) ? req.body.modules : [];
  if (incomingModules.length === 0) {
    return res.status(400).json({ message: 'Tệp gói học liệu không chứa mô-đun hoặc hoạt động nào.' });
  }

  const targetModuleId = req.body.targetModuleId || null;
  let addedModules = 0;
  let addedActivities = 0;

  const normalizeActivity = (a, modId, idx) => ({
    ...a,
    id: `act-${Date.now()}-${Math.floor(Math.random() * 10000)}-${idx}`,
    moduleId: modId,
    isCompleted: false
  });

  if (isMongoConnected) {
    const doc = await getCourseDoc(course.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
    doc.modules = doc.modules || [];

    if (targetModuleId) {
      const targetMod = doc.modules.find(m => m.id === targetModuleId);
      if (targetMod) {
        targetMod.activities = targetMod.activities || [];
        incomingModules.forEach(im => {
          (im.activities || []).forEach((a, idx) => {
            targetMod.activities.push(normalizeActivity(a, targetMod.id, idx));
            addedActivities++;
          });
        });
      }
    } else {
      incomingModules.forEach((im, mIdx) => {
        const newModId = `mod-${Date.now()}-${mIdx}-${Math.floor(Math.random() * 1000)}`;
        const acts = (im.activities || []).map((a, idx) => normalizeActivity(a, newModId, idx));
        addedActivities += acts.length;
        addedModules++;
        doc.modules.push({
          id: newModId,
          courseId: doc.id,
          order: doc.modules.length + 1,
          title: im.title || `Mô-đun nhập #${doc.modules.length + 1}`,
          description: im.description || '',
          activities: acts
        });
      });
    }
    doc.totalActivities = doc.modules.reduce((s, m) => s + (m.activities || []).length, 0);
    doc.markModified('modules');
    await doc.save();
    return res.json({ success: true, addedModules, addedActivities, course: await viewCourseFor(doc.toObject(), req.user) });
  } else {
    const db = readDb();
    const c = (db.courses || []).find(x => x.id === course.id || x.code === course.id);
    if (!c) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
    c.modules = c.modules || [];
    if (targetModuleId) {
      const targetMod = c.modules.find(m => m.id === targetModuleId);
      if (targetMod) {
        targetMod.activities = targetMod.activities || [];
        incomingModules.forEach(im => {
          (im.activities || []).forEach((a, idx) => {
            targetMod.activities.push(normalizeActivity(a, targetMod.id, idx));
            addedActivities++;
          });
        });
      }
    } else {
      incomingModules.forEach((im, mIdx) => {
        const newModId = `mod-${Date.now()}-${mIdx}-${Math.floor(Math.random() * 1000)}`;
        const acts = (im.activities || []).map((a, idx) => normalizeActivity(a, newModId, idx));
        addedActivities += acts.length;
        addedModules++;
        c.modules.push({
          id: newModId,
          courseId: c.id,
          order: c.modules.length + 1,
          title: im.title || `Mô-đun nhập #${c.modules.length + 1}`,
          description: im.description || '',
          activities: acts
        });
      });
    }
    c.totalActivities = c.modules.reduce((s, m) => s + (m.activities || []).length, 0);
    writeDb(db);
    return res.json({ success: true, addedModules, addedActivities, course: await viewCourseFor(c, req.user) });
  }
});

// 9.04 API Bảng điểm cá nhân (fix lỗi 404 cho Gradebook.tsx)
app.get('/api/grades', requireAuth, async (req, res) => {
  const list = isMongoConnected
    ? (await CourseModel.find()).map(c => c.toObject())
    : (readDb().courses || []);
  const records = await listProgress({ userId: req.user.id });
  const byCourse = new Map();
  records.forEach(p => {
    if (!byCourse.has(p.courseId)) byCourse.set(p.courseId, []);
    byCourse.get(p.courseId).push(p);
  });

  const rows = list.map(course => {
    const acts = allActivities(course);
    const mine = byCourse.get(course.id) || [];
    const byAct = new Map(mine.map(p => [p.activityId, p]));
    let completed = 0;
    let quizSum = 0, quizCnt = 0;
    let assignSum = 0, assignCnt = 0;
    acts.forEach(a => {
      const p = byAct.get(a.id);
      if (p?.isCompleted) completed++;
      if (a.type === 'quiz' && p?.score !== null && p?.score !== undefined) { quizSum += p.score; quizCnt++; }
      if (a.type === 'assignment' && p?.score !== null && p?.score !== undefined) { assignSum += p.score; assignCnt++; }
    });
    const attendance = acts.length > 0 ? Number(((completed / acts.length) * 10).toFixed(1)) : null;
    const quizAvg = quizCnt > 0 ? Number((quizSum / quizCnt).toFixed(1)) : null;
    const assignAvg = assignCnt > 0 ? Number((assignSum / assignCnt).toFixed(1)) : null;
    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      progress: acts.length > 0 ? Math.round((completed / acts.length) * 100) : 0,
      attendanceScore: attendance,
      quizScore: quizAvg,
      assignmentScore: assignAvg
    };
  });
  res.json(rows);
});

app.get('/api/courses/:id/grades', requireAuth, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
  const acts = allActivities(course);
  const records = await listProgress({ courseId: course.id, userId: req.user.id });
  const byAct = new Map(records.map(p => [p.activityId, p]));
  res.json(acts.map(a => {
    const p = byAct.get(a.id);
    return {
      activityId: a.id,
      title: a.title,
      type: a.type,
      score: p?.score ?? null,
      maxScore: a.maxScore || 10,
      isCompleted: !!p?.isCompleted,
      videoProgress: p?.videoProgress || null,
      feedback: p?.submission?.feedback || ''
    };
  }));
});

// 9.1 Thông báo lớp học (giáo viên đăng, lưu vào khóa học)
app.post('/api/courses/:id/announcements', requireStaff, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  const title = String(req.body.title || '').trim().slice(0, 300);
  const content = String(req.body.content || '').trim().slice(0, 10000);
  if (!title || !content) return res.status(400).json({ message: 'Thông báo cần có tiêu đề và nội dung.' });

  const announcement = {
    id: `anc-${Date.now()}`,
    title,
    content,
    author: req.user.name || 'Giáo viên',
    authorRole: req.user.role === 'admin' ? 'Quản trị viên' : 'Giáo viên',
    createdAt: nowVN(),
    isImportant: !!req.body.isImportant
  };

  if (isMongoConnected) {
    await CourseModel.updateOne({ id: course.id }, { $push: { announcements: { $each: [announcement], $position: 0 } } });
  } else {
    const db = readDb();
    const c = db.courses.find(x => x.id === course.id);
    c.announcements = [announcement, ...(c.announcements || [])];
    writeDb(db);
  }
  res.status(201).json(announcement);
});

// 9.2 Diễn đàn: tạo chủ đề & phản hồi (tác giả lấy từ token)
const forumAuthor = (user) => ({
  id: user.id,
  name: user.name || 'Thành viên',
  avatar: user.avatar || '',
  role: user.role === 'admin' ? 'Quản trị viên' : user.role === 'lecturer' ? 'Giáo viên' : 'Học sinh'
});

app.post('/api/courses/:id/forum', requireAuth, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  if (!isStaff(req.user) && !isEnrolled(course, req.user)) {
    return res.status(403).json({ message: 'Bạn cần đăng ký khóa học trước khi tham gia thảo luận.' });
  }
  const title = String(req.body.title || '').trim().slice(0, 300);
  const content = String(req.body.content || '').trim().slice(0, 10000);
  if (!title) return res.status(400).json({ message: 'Chủ đề cần có tiêu đề.' });

  const topic = {
    id: `topic-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    courseId: course.id,
    title,
    content,
    author: forumAuthor(req.user),
    createdAt: nowVN(),
    replies: [],
    views: 0,
    likes: 0
  };
  if (isMongoConnected) {
    await ForumModel.create(topic);
  } else {
    const db = readDb();
    db.forumTopics = [topic, ...(db.forumTopics || [])];
    writeDb(db);
  }
  res.status(201).json(topic);
});

app.post('/api/forum/:topicId/replies', requireAuth, async (req, res) => {
  const content = String(req.body.content || '').trim().slice(0, 10000);
  if (!content) return res.status(400).json({ message: 'Nội dung phản hồi đang trống.' });

  const topic = isMongoConnected
    ? await ForumModel.findOne({ id: req.params.topicId }).lean()
    : (readDb().forumTopics || []).find(t => t.id === req.params.topicId);
  if (!topic) return res.status(404).json({ message: 'Không tìm thấy chủ đề thảo luận' });
  const course = await loadCourseObj(topic.courseId);
  if (!isStaff(req.user) && !(course && isEnrolled(course, req.user))) {
    return res.status(403).json({ message: 'Bạn cần đăng ký khóa học trước khi tham gia thảo luận.' });
  }

  const reply = {
    id: `reply-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    author: forumAuthor(req.user),
    content,
    createdAt: nowVN(),
    isInstructorAnswer: isStaff(req.user)
  };
  if (isMongoConnected) {
    await ForumModel.updateOne({ id: topic.id }, { $push: { replies: reply } });
  } else {
    const db = readDb();
    const t = db.forumTopics.find(x => x.id === topic.id);
    t.replies = [...(t.replies || []), reply];
    writeDb(db);
  }
  res.status(201).json(reply);
});

// ====================== 9.3 TẬP TIN HỌC LIỆU & TẢI TỆP TÙY Ý (FILE UPLOAD ENGINE) ======================
// 1. Upload tệp tùy ý (hỗ trợ bất kỳ định dạng nào: PDF, Word, Excel, PowerPoint, Ảnh, Video, Code, ZIP...)
app.post('/api/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Tệp quá lớn. Giới hạn tối đa là 100MB.' });
      }
      return res.status(400).json({ message: err.message || 'Lỗi khi tải tệp lên' });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn một tệp để tải lên.' });
  }

  let originalName = req.file.originalname;
  try {
    originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  } catch (e) { }

  const fileBytes = req.file.size;
  const sizeFormatted = fileBytes > 1024 * 1024
    ? `${(fileBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(fileBytes / 1024).toFixed(1)} KB`;

  const fileUrl = `/uploads/${req.file.filename}`;
  const fileType = getFileTypeCategory(originalName, req.file.mimetype);

  const fileData = {
    id: `file-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name: originalName,
    filename: req.file.filename,
    url: fileUrl,
    size: sizeFormatted,
    sizeBytes: fileBytes,
    mimetype: req.file.mimetype,
    fileType,
    uploadedBy: req.user ? {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar
    } : {
      name: 'Thành viên',
      email: ''
    },
    uploadedAt: nowVN()
  };

  res.status(201).json(fileData);
});

// 2. Lấy danh sách tập tin học liệu của khóa học
app.get('/api/courses/:id/files', async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json(course.files || []);
});

// 3. Thêm tập tin vào khóa học (Hỗ trợ upload trực tiếp hoặc gửi thông tin tệp đã upload)
app.post('/api/courses/:id/files', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Tệp quá lớn. Giới hạn tối đa là 100MB.' });
      }
      return res.status(400).json({ message: err.message || 'Lỗi khi tải tệp lên' });
    }
    next();
  });
}, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });

  let fileItem;
  if (req.file) {
    let originalName = req.file.originalname;
    try {
      originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    } catch (e) { }

    const fileBytes = req.file.size;
    const sizeFormatted = fileBytes > 1024 * 1024
      ? `${(fileBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(fileBytes / 1024).toFixed(1)} KB`;

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = getFileTypeCategory(originalName, req.file.mimetype);

    fileItem = {
      id: `file-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name: originalName,
      filename: req.file.filename,
      url: fileUrl,
      size: sizeFormatted,
      sizeBytes: fileBytes,
      mimetype: req.file.mimetype,
      fileType,
      description: req.body.description || '',
      uploadedBy: req.user ? {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      } : {
        name: req.body.authorName || 'Thành viên',
        email: req.body.authorEmail || ''
      },
      uploadedAt: nowVN()
    };
  } else if (req.body.url && req.body.name) {
    fileItem = {
      id: req.body.id || `file-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name: req.body.name,
      filename: req.body.filename || path.basename(req.body.url),
      url: req.body.url,
      size: req.body.size || '0 KB',
      sizeBytes: req.body.sizeBytes || 0,
      mimetype: req.body.mimetype || 'application/octet-stream',
      fileType: req.body.fileType || getFileTypeCategory(req.body.name, req.body.mimetype),
      description: req.body.description || '',
      uploadedBy: req.user ? {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      } : (req.body.uploadedBy || { name: 'Thành viên', email: '' }),
      uploadedAt: nowVN()
    };
  } else {
    return res.status(400).json({ message: 'Vui lòng cung cấp tệp hợp lệ.' });
  }

  if (isMongoConnected) {
    await CourseModel.updateOne(
      { id: course.id },
      { $push: { files: { $each: [fileItem], $position: 0 } } }
    );
  } else {
    const db = readDb();
    const c = db.courses.find(x => x.id === course.id);
    if (c) {
      c.files = [fileItem, ...(c.files || [])];
      writeDb(db);
    }
  }

  res.status(201).json(fileItem);
});

// 4. Xóa tập tin khỏi khóa học
app.delete('/api/courses/:id/files/:fileId', async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });

  const fileId = req.params.fileId;
  const fileToDelete = (course.files || []).find(f => f.id === fileId);

  // Xóa tệp vật lý trên ổ đĩa nếu nằm trong thư mục uploads
  if (fileToDelete && fileToDelete.filename) {
    const diskPath = path.join(uploadsDir, fileToDelete.filename);
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) { }
    }
  }

  if (isMongoConnected) {
    await CourseModel.updateOne(
      { id: course.id },
      { $pull: { files: { id: fileId } } }
    );
  } else {
    const db = readDb();
    const c = db.courses.find(x => x.id === course.id);
    if (c) {
      c.files = (c.files || []).filter(f => f.id !== fileId);
      writeDb(db);
    }
  }

  res.json({ success: true, fileId });
});

// 5. Tải tệp xuống trực tiếp với tên gốc UTF-8
app.get('/api/files/download/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Tệp không tồn tại hoặc đã bị xóa.' });
  }
  const downloadName = req.query.name || req.params.filename;
  res.download(filePath, downloadName);
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

app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
  if (isMongoConnected) {
    try {
      await NotifModel.updateOne({ id: req.params.id }, { $set: { read: true } });
      return res.json({ success: true });
    } catch (err) { }
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
app.get('/api/users', requireStaff, async (req, res) => {
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

// 13.1 Thêm người dùng mới (Quyền Quản trị viên - Đáp ứng chuẩn rubric quản trị)
app.post('/api/users', requireStaff, async (req, res) => {
  const { name, email, role, code, className, school, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ Họ tên và Email.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userCode = (code || normalizedEmail.split('@')[0]).toUpperCase();
  const userRole = role === 'admin' && normalizedEmail !== 'phanphiphu04@gmail.com' ? 'student' : (role || 'student');

  const newUser = {
    id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name: name.trim(),
    username: normalizedEmail.split('@')[0],
    email: normalizedEmail,
    role: userRole,
    code: userCode,
    className: className || '',
    classOrPosition: className || (userRole === 'admin' ? 'Quản trị viên' : userRole === 'lecturer' ? 'Giáo viên' : 'Học viên'),
    school: school || department || 'LMS Nhóm 2',
    department: school || department || 'LMS Nhóm 2',
    avatar: '',
    isProfileCompleted: true,
    enrolledCourses: [],
    createdAt: nowVN()
  };

  if (isMongoConnected) {
    try {
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ message: 'Email người dùng này đã tồn tại trong hệ thống.' });
      }
      const created = await UserModel.create(newUser);
      const obj = created.toObject ? created.toObject() : created;
      delete obj.password;
      return res.status(201).json(obj);
    } catch (err) {
      return res.status(500).json({ message: 'Lỗi khi lưu người dùng vào MongoDB.' });
    }
  } else {
    const db = readDb();
    if ((db.users || []).some(u => u.email?.toLowerCase().trim() === normalizedEmail)) {
      return res.status(409).json({ message: 'Email người dùng này đã tồn tại trong hệ thống.' });
    }
    db.users = db.users || [];
    db.users.push(newUser);
    writeDb(db);
    return res.status(201).json(newUser);
  }
});

// 13.2 Xóa người dùng (Quyền Quản trị viên)
app.delete('/api/users/:userId', requireStaff, async (req, res) => {
  const userId = req.params.userId;
  if (isMongoConnected) {
    try {
      const target = await UserModel.findOne({ id: userId });
      if (target && target.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com') {
        return res.status(403).json({ message: 'Không thể xóa tài khoản Quản trị viên gốc.' });
      }
      await UserModel.deleteOne({ id: userId });
      return res.json({ success: true, userId });
    } catch (err) {
      return res.status(500).json({ message: 'Lỗi khi xóa người dùng.' });
    }
  } else {
    const db = readDb();
    const target = (db.users || []).find(u => u.id === userId);
    if (target && target.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản Quản trị viên gốc.' });
    }
    db.users = (db.users || []).filter(u => u.id !== userId);
    writeDb(db);
    return res.json({ success: true, userId });
  }
});

// 14. Students in Course — giáo viên nhận kèm tiến độ chi tiết của từng học sinh (khớp chính xác theo cả ID & Email)
app.get('/api/courses/:id/students', requireAuth, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.json([]);
  const students = (course.enrolledStudents || []).filter(s => !FAKE_DEMO_STUDENT_IDS.has(s?.id));

  if (!isStaff(req.user)) {
    if (!isEnrolled(course, req.user)) {
      return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này.' });
    }
    return res.json(students.map(s => ({
      id: s.id, name: s.name, className: s.className, school: s.school, avatar: s.avatar, enrolledAt: s.enrolledAt, status: s.status
    })));
  }

  const activities = allActivities(course);
  const records = await listProgress({ courseId: course.id });
  const roster = await buildStudentRosterWithProgress(course, records);

  res.json(roster.map(({ student, records: mineList }) => {
    const mine = new Map(mineList.map(p => [p.activityId, p]));
    let totalScore = 0;
    let scoreCount = 0;
    let totalTimeSpentSeconds = 0;

    const detail = activities.map(a => {
      const p = mine.get(a.id);
      if (p?.score !== null && p?.score !== undefined && Number.isFinite(p.score)) {
        totalScore += p.score;
        scoreCount++;
      }
      totalTimeSpentSeconds += p?.timeSpentSeconds || 0;
      return {
        activityId: a.id,
        title: a.title,
        type: a.type,
        isCompleted: !!p?.isCompleted,
        completedAt: p?.completedAt || '',
        score: p?.score ?? null,
        maxScore: a.maxScore || 10,
        submissionStatus: p?.submission?.status || (p?.quizResult ? 'quiz_done' : 'none'),
        videoProgress: p?.videoProgress || null,
        submission: p?.submission || null,
        quizResult: p?.quizResult || null,
        quizQuestions: a.quizQuestions || [],
        timeSpentSeconds: p?.timeSpentSeconds || 0,
        viewCount: p?.viewCount || 0,
        lastAccessedAt: p?.lastAccessedAt || ''
      };
    });
    const completed = detail.filter(d => d.isCompleted).length;
    const lastActivityAt = [...mine.values()].map(p => p.updatedAt || '').sort().pop() || '';
    const progress = activities.length > 0 ? Math.round((completed / activities.length) * 100) : 0;

    return {
      ...student,
      totalActivities: activities.length,
      completedActivities: completed,
      progress,
      averageScore: scoreCount > 0 ? Number((totalScore / scoreCount).toFixed(1)) : null,
      totalTimeSpentSeconds,
      lastActivityAt,
      activities: detail
    };
  }));
});

// ====================== SERVE PRODUCTION FRONTEND ======================
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  // Tệp trong /assets có mã băm trong tên nên cache dài hạn; index.html luôn kiểm tra bản mới
  app.use(express.static(distPath, {
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      }
    }
  }));

  // SPA Fallback cho Express 5 (không dùng app.get('*') để tránh lỗi PathError trong Express 5)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: `API route ${req.method} ${req.path} không tồn tại.` });
    }
    if (req.path.startsWith('/uploads/')) {
      return res.status(404).json({ message: `Tệp không tồn tại hoặc đã bị xóa.` });
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
