import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import crypto from 'crypto';
import multer from 'multer';
import zlib from 'zlib';
import {
  OFFICIAL_AI_GRADE6_LESSONS,
  AI6_BAI12_REVISION,
  buildAi6Bai12SeedData
} from './public/hoc-lieu/6aiab01/ai6SeedData.js';

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

const PORT = Number(process.env.PORT) || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Phục vụ tệp tĩnh trong uploads trực tiếp (tự động khôi phục từ MongoDB nếu Render restart/redeploy xóa đĩa tạm)
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '7d',
  setHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Nén HTTP Gzip tự động cho các phản hồi JSON lớn (>= 1KB) giúp tiết kiệm ~75-85% băng thông
app.use((req, res, next) => {
  const acceptEnc = String(req.headers['accept-encoding'] || '');
  if (!acceptEnc.includes('gzip')) return next();
  const origJson = res.json.bind(res);
  res.json = (body) => {
    if (res.headersSent) return origJson(body);
    try {
      const raw = Buffer.from(JSON.stringify(body), 'utf8');
      if (raw.length < 1024) return origJson(body);
      const gz = zlib.gzipSync(raw, { level: 6 });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Content-Length', String(gz.length));
      return res.end(gz);
    } catch {
      return origJson(body);
    }
  };
  next();
});

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

function getValidGeminiKey() {
  const raw = String(process.env.GEMINI_API_KEY || '').trim();
  if (!raw || ['none', 'disabled', 'false', 'null', 'undefined'].includes(raw.toLowerCase())) {
    return null;
  }
  return raw;
}

// Health check endpoint for Render & monitoring
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => {
  const geminiKey = getValidGeminiKey();
  res.json({
    status: 'ok',
    service: 'LMS Nhóm 2 API',
    version: '2.7-split-static-node-public',
    database: isMongoConnected ? 'MongoDB Atlas' : 'Local JSON DB',
    persistentFileStorage: isMongoConnected ? 'MongoDB Atlas (<=12MB) + Disk Cache' : 'Local Disk',
    geminiConfigured: Boolean(geminiKey),
    geminiMode: !geminiKey ? 'none' : (geminiKey.startsWith('AQ.') ? 'gemini-api+vertex-fallback' : 'gemini-api'),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ====================== MONGODB ATLAS INTEGRATION ======================
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
let isMongoConnected = false;

// Mongoose Schemas (Tuyệt đối không gán dữ liệu ảo)
const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  username: String,
  passwordHash: { type: String, default: '' },
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
  studentClass: String,
  studentSchool: String,
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
courseSchema.index({ code: 1 });
forumSchema.index({ courseId: 1 });
const UserModel = mongoose.model('User', userSchema);
const CourseModel = mongoose.model('Course', courseSchema);
const NotifModel = mongoose.model('Notification', notifSchema);
const CertModel = mongoose.model('Certificate', certSchema);
const ForumModel = mongoose.model('ForumTopic', forumSchema);

// Lưu trữ nhị phân tệp bài làm học sinh & tài liệu khóa học bền vững trên MongoDB Atlas (không bị mất khi Render restart/redeploy)
const MAX_MONGO_FILE_BYTES = 12 * 1024 * 1024; // 12 MB (an toàn trong giới hạn 16 MB BSON của MongoDB)
const uploadedFileSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  originalName: String,
  mimetype: String,
  sizeBytes: Number,
  data: Buffer,
  uploadedBy: Object,
  uploadedAt: String
});
const UploadedFileModel = mongoose.model('UploadedFile', uploadedFileSchema);

// Cài đặt hệ thống lưu bền vững (Admin Settings)
const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: Object,
  updatedAt: String
});
const SettingModel = mongoose.model('Setting', settingSchema);

const DEFAULT_SYSTEM_SETTINGS = {
  allowCustomFileUploads: true,
  maxUploadSizeMB: 100,
  allowAssignmentResubmit: true,
  autoGradeQuiz: true,
  showQuizReviewAfterSubmit: true,
  lockQuizAnswersBeforeSubmit: true,
  allowStudentForum: true,
  enableAIAssistant: true,
  autoUpdateProgress: true,
  autoIssueCertificate: true
};

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
  submissionHistory: { type: Array, default: [] },
  quizResult: Object,
  quizHistory: { type: Array, default: [] },
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
progressSchema.index({ userEmail: 1 });
progressSchema.index({ courseId: 1, userEmail: 1 });
const ProgressModel = mongoose.model('Progress', progressSchema);

// Helper: Lưu tệp vừa upload vào MongoDB Atlas để tồn tại vĩnh viễn qua các lần Render restart/redeploy
async function persistUploadedFileToDb(reqFile, originalName, uploader) {
  if (!isMongoConnected || !reqFile || !reqFile.path) return false;
  if (reqFile.size > MAX_MONGO_FILE_BYTES) return false;
  try {
    const data = fs.readFileSync(reqFile.path);
    await UploadedFileModel.findOneAndUpdate(
      { filename: reqFile.filename },
      {
        $set: {
          filename: reqFile.filename,
          originalName,
          mimetype: reqFile.mimetype || 'application/octet-stream',
          sizeBytes: reqFile.size,
          data,
          uploadedBy: uploader || null,
          uploadedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.warn('Không thể sao lưu tệp vào MongoDB:', err.message);
    return false;
  }
}

async function deletePersistedFile(filename) {
  if (!filename) return;
  const diskPath = path.join(uploadsDir, path.basename(filename));
  if (fs.existsSync(diskPath)) {
    try { fs.unlinkSync(diskPath); } catch (e) { }
  }
  if (isMongoConnected) {
    try { await UploadedFileModel.deleteOne({ filename: path.basename(filename) }); } catch (e) { }
  }
}

// Khôi phục & phục vụ tệp từ MongoDB nếu ổ đĩa tạm của Render đã bị xóa sau khi restart
app.get('/uploads/:filename', async (req, res, next) => {
  const safeName = path.basename(req.params.filename || '');
  if (!safeName) return next();
  const diskPath = path.join(uploadsDir, safeName);
  if (fs.existsSync(diskPath)) return res.sendFile(diskPath);
  try {
    await mongoReady;
    if (isMongoConnected) {
      const doc = await UploadedFileModel.findOne({ filename: safeName }).lean();
      if (doc && doc.data) {
        const buf = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data.buffer || doc.data);
        try { fs.writeFileSync(diskPath, buf); } catch (e) { }
        res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=604800');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(buf);
      }
    }
  } catch (e) { }
  return res.status(404).json({ message: 'Tệp không tồn tại hoặc đã bị xóa.' });
});

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
let mongoReady = Promise.resolve();
const MONGODB_DB = process.env.MONGODB_DB || 'lms_nhom2';
if (MONGODB_URI && process.env.DISABLE_MONGO !== '1') {
  console.log('🔄 Đang kết nối tới MongoDB Atlas...');
  mongoReady = mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB, serverSelectionTimeoutMS: 10000 })
    .then(async () => {
      isMongoConnected = true;
      console.log(`✅ Đã kết nối thành công tới MongoDB Atlas (Database: ${MONGODB_DB})!`);

      try {
        await UserModel.deleteMany({
          $or: [
            { email: { $regex: /hcmue/i } },
            { name: { $regex: /hcmue/i } },
            { code: 'SV-2026' }
          ]
        });
        console.log('🧹 Đã hoàn tất kiểm tra và làm sạch tài khoản trong MongoDB.');
        await ensureDefaultCourse();
        await ensureAi6Bai12Content();
        await ensureTin12B12Course();
        console.log('🧹 Đã đồng bộ khóa học 6AIAB01 (trọn bộ 8 bài) & Tin học 12 Bài 12 (A2.3).');
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

async function syncStudentIdentityAcrossCourses(user) {
  if (!user || !user.id || !user.email) return;
  const normEmail = String(user.email).toLowerCase().trim();
  if (!normEmail) return;

  try {
    if (isMongoConnected) {
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

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(plain, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const derived = crypto.scryptSync(String(plain), parts[1], 64);
    const expected = Buffer.from(parts[2], 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

const safeUser = (u) => {
  if (!u) return u;
  const { password, passwordHash, ...rest } = u;
  return { ...rest, hasPassword: Boolean(passwordHash) };
};

const isStaff = (user) => !!user && (
  user.role === 'admin' || 
  user.role === 'lecturer' || 
  (user.email && user.email.toLowerCase().trim() === 'phanphiphu04@gmail.com')
);

const hasQuizPart = (act) => !!act && (act.type === 'quiz' || (Array.isArray(act.quizQuestions) && act.quizQuestions.length > 0));

app.use(async (req, res, next) => {
  req.user = null;
  if (!req.path.startsWith('/api/')) return next();
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

async function listProgressForUser(user, courseId = null) {
  if (!user) return [];
  const normEmail = String(user.email || '').toLowerCase().trim();
  if (isMongoConnected) {
    const orClauses = [{ userId: user.id }];
    if (normEmail) orClauses.push({ userEmail: normEmail });
    const q = courseId ? { courseId, $or: orClauses } : { $or: orClauses };
    return ProgressModel.find(q).lean();
  }
  return (readDb().progress || []).filter(p => {
    if (courseId && p.courseId !== courseId) return false;
    return p.userId === user.id || (normEmail && String(p.userEmail || '').toLowerCase().trim() === normEmail);
  });
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

const STUDENT_STATE_FIELDS = ['submission', 'submissionHistory', 'quizResult', 'quizHistory', 'score', 'watchedSeconds', 'videoProgress', 'videoNotes', 'viewCount', 'timeSpentSeconds', 'firstAccessedAt', 'lastAccessedAt'];
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

function viewCourse(courseObj, user, progressRecords) {
  const byActivity = new Map();
  (progressRecords || []).forEach(p => {
    const ex = byActivity.get(p.activityId);
    if (!ex || (p.updatedAt || '') > (ex.updatedAt || '')) {
      byActivity.set(p.activityId, p);
    }
  });
  const hideAnswers = !isStaff(user);
  let total = 0;
  let completed = 0;
  const rawModules = stripStudentState(courseObj.modules).filter(m => !hideAnswers || !m.isHidden);
  const modules = rawModules.map(m => ({
    ...m,
    activities: m.activities
      .filter(a => !hideAnswers || !a.isHidden)
      .map(original => {
        total++;
        const p = byActivity.get(original.id);
        let a = original;
        if (hideAnswers && Array.isArray(a.quizQuestions) && !p?.quizResult) {
          a = { ...a, quizQuestions: a.quizQuestions.map(({ correctAnswer, explanation, optionFeedback, ...q }) => q) };
        }
        if (!p) return a;
        const out = { ...a, isCompleted: !!p.isCompleted };
        if (p.submission) out.submission = p.submission;
        if (p.submissionHistory) out.submissionHistory = p.submissionHistory;
        if (p.quizResult) out.quizResult = p.quizResult;
        if (p.quizHistory) out.quizHistory = p.quizHistory;
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
    enrolledStudents: user ? students : []
  };
}

async function viewCourseFor(courseObj, user) {
  const enriched = await resolveInstructorAvatar(courseObj);
  const records = user ? await listProgressForUser(user, enriched.id) : [];
  return viewCourse(enriched, user, records);
}

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

// 1. Auth: Đăng nhập bằng Tài khoản & Mật khẩu
app.post('/api/auth/login', async (req, res) => {
  const identifier = String(req.body?.username || req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Tên đăng nhập (hoặc Email) và Mật khẩu.' });
  }

  let userObj = null;
  if (isMongoConnected) {
    try {
      const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`^${escaped}$`, 'i');
      const doc = await UserModel.findOne({
        $or: [{ email: rx }, { username: rx }, { code: rx }]
      });
      if (doc) userObj = doc.toObject();
    } catch {}
  } else {
    const db = readDb();
    userObj = (db.users || []).find(u =>
      String(u.email || '').trim().toLowerCase() === identifier ||
      String(u.username || '').trim().toLowerCase() === identifier ||
      String(u.code || '').trim().toLowerCase() === identifier
    ) || null;
  }

  if (!userObj) {
    return res.status(401).json({ message: 'Tài khoản không tồn tại trên hệ thống.' });
  }
  if (!userObj.passwordHash) {
    return res.status(401).json({ message: 'Tài khoản này chưa được cấp mật khẩu. Vui lòng đăng nhập bằng Google hoặc nhờ Quản trị viên cấp mật khẩu.' });
  }
  if (!verifyPassword(password, userObj.passwordHash)) {
    return res.status(401).json({ message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.' });
  }

  const token = signToken(userObj.id);
  return res.json({ token, user: safeUser(userObj) });
});

// 1.1 Auth: Đăng nhập bằng Google OAuth
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Thiếu credential xác thực từ Google' });
  }

  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(401).json({ message: 'Google Token không hợp lệ hoặc đã hết hạn' });
    }

    const payload = await googleRes.json();
    const { sub: googleId, email, name, picture } = payload;

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
        user.role = isAdmin ? 'admin' : (user.role === 'lecturer' ? 'lecturer' : 'student');
        if (isAdmin || user.role === 'lecturer') {
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
        user.role = isAdmin ? 'admin' : (user.role === 'lecturer' ? 'lecturer' : 'student');
        if (isAdmin || user.role === 'lecturer') {
          user.isProfileCompleted = true;
        } else {
          user.isProfileCompleted = !!(user.isProfileCompleted && user.school && (user.className || user.classOrPosition));
        }
        writeDb(db);
      }
    }

    const token = signToken(user.id);
    const userObj = safeUser(user.toObject ? user.toObject() : { ...user });
    await syncStudentIdentityAcrossCourses(userObj);

    return res.json({ token, user: userObj });
  } catch (err) {
    console.error('Lỗi xác thực Google:', err);
    return res.status(500).json({ message: 'Lỗi xác thực Google OAuth: ' + err.message });
  }
});

// 2. Auth: Get current user profile
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

// 2.1 Auth: Update user profile
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

// 3. Courses: Get All
const instructorCache = new Map();

async function resolveInstructorAvatar(course) {
  if (!course) return course;
  const courseObj = course.toObject ? course.toObject() : { ...course };
  const targetEmail = (courseObj.instructor?.email || courseObj.creator?.email || 'phanphiphu04@gmail.com').toLowerCase().trim();

  let user = null;
  const cached = instructorCache.get(targetEmail);
  if (cached && Date.now() - cached.at < 60000) {
    user = cached.user;
  } else if (isMongoConnected) {
    try {
      user = await UserModel.findOne({ email: targetEmail }).lean();
      if (!user && targetEmail !== 'phanphiphu04@gmail.com') {
        user = await UserModel.findOne({ email: 'phanphiphu04@gmail.com' }).lean();
      }
      instructorCache.set(targetEmail, { user, at: Date.now() });
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

  const isMainCourse = courseObj.code === '6AIAB01' || (courseObj.name && (courseObj.name.includes('Chuyên đề AI') || courseObj.name.includes('lớp 6') || courseObj.name.includes('trí tuệ nhân tạo')));
  if (isMainCourse) {
    courseObj.name = 'Chuyên đề trí tuệ nhân tạo lớp 6: Chủ đề A và B';
    courseObj.code = '6AIAB01';
    courseObj.gradeLevel = 'Lớp 6';
    courseObj.category = 'Chuyên đề AI';

    courseObj.modules = Array.isArray(courseObj.modules) ? courseObj.modules : [];
    let modulesChanged = false;

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

// ====================== ĐỒNG BỘ HỌC LIỆU 8 BÀI TỪ ai6SeedData.js ======================
function mergeAi6Bai12IntoCourse(courseObj) {
  const { lessonModules, officialFiles, officialSyllabus } = buildAi6Bai12SeedData();
  courseObj.modules = Array.isArray(courseObj.modules) ? courseObj.modules : [];
  for (let i = 0; i < OFFICIAL_AI_GRADE6_LESSONS.length; i++) {
    if (!courseObj.modules[i]) {
      courseObj.modules.push({
        id: `module-lesson-${i + 1}`,
        courseId: '6AIAB01',
        order: i + 1,
        title: OFFICIAL_AI_GRADE6_LESSONS[i],
        description: `Nội dung học tập và bài thực hành cho ${OFFICIAL_AI_GRADE6_LESSONS[i]}`,
        activities: []
      });
    }
  }

  const mergeModule = (idx, seedMod) => {
    const cur = courseObj.modules[idx] || {};
    const existingActs = (cur.activities || []).filter(a => a && a.id);
    const seedIds = new Set(seedMod.activities.map(a => a.id));
    // Chỉ giữ lại các hoạt động do GV tự thêm tay trên web, bỏ các hoạt động seed cũ (ai6-b...) đã bị xóa trong ai6SeedData.js
    const extraTeacherActs = existingActs.filter(
      a => !seedIds.has(a.id) && !/^ai6-b\d+-act-/.test(a.id)
    );
    courseObj.modules[idx] = {
      ...cur,
      id: cur.id || seedMod.id,
      courseId: '6AIAB01',
      order: seedMod.order,
      title: seedMod.title,
      description: seedMod.description,
      learningObjectives: seedMod.learningObjectives,
      ownerName: (cur.ownerName && !/^Nhóm 2 – Bài \d+$/i.test(cur.ownerName)) ? cur.ownerName : seedMod.ownerName,
      activities: [...seedMod.activities.map(a => ({ ...a, moduleId: cur.id || seedMod.id })), ...extraTeacherActs]
    };
  };

  lessonModules.forEach((mod, idx) => mergeModule(idx, mod));

  if (!Array.isArray(courseObj.syllabus) || courseObj.syllabus.length < 8) {
    courseObj.syllabus = officialSyllabus;
  }

  const curFiles = (Array.isArray(courseObj.files) ? courseObj.files : []).filter(f => !/^file-ai6-b\d+-lmshtml$/.test(f?.id || ''));
  const fileById = new Map(curFiles.map(f => [f.id, f]));
  const mergedFiles = [...curFiles];
  officialFiles.forEach(f => {
    if (!fileById.has(f.id)) {
      mergedFiles.push(f);
    } else {
      const idx = mergedFiles.findIndex(x => x.id === f.id);
      if (idx !== -1) mergedFiles[idx] = { ...mergedFiles[idx], ...f };
    }
  });
  courseObj.files = mergedFiles;
  courseObj.totalActivities = courseObj.modules.reduce((s, m) => s + (m.activities || []).length, 0);
}

async function revokeStaleVideoCompletion(courseObj) {
  const videos = (courseObj.modules || []).flatMap(m => m.activities || [])
    .filter(a => a && a.type === 'video' && Array.isArray(a.videoCheckpoints) && a.videoCheckpoints.length > 0);
  let revoked = 0;
  for (const act of videos) {
    const cleared = p => act.videoCheckpoints.every(cp => {
      const r = p?.videoProgress?.checkpointResults?.[cp.id];
      return r && (cp.requireCorrect !== false ? !!r.isCorrect : true);
    });
    if (isMongoConnected) {
      const recs = await ProgressModel.find({ courseId: courseObj.id, activityId: act.id, isCompleted: true }).lean();
      for (const p of recs) {
        if (cleared(p)) continue;
        await ProgressModel.updateOne({ _id: p._id }, { $set: { isCompleted: false, completedAt: '', updatedAt: new Date().toISOString() } });
        revoked++;
      }
    } else {
      const db = readDb();
      let changed = false;
      (db.progress || []).forEach(p => {
        if (p.courseId === courseObj.id && p.activityId === act.id && p.isCompleted && !cleared(p)) {
          p.isCompleted = false; p.completedAt = ''; p.updatedAt = new Date().toISOString(); changed = true; revoked++;
        }
      });
      if (changed) writeDb(db);
    }
  }
  if (revoked) console.log(`Đã bỏ ${revoked} trạng thái hoàn thành video chưa vượt qua đủ neo chặn (${courseObj.id})`);
  return revoked;
}

async function ensureAi6Bai12Content() {
  if (isMongoConnected) {
    try {
      const flagDoc = await SettingModel.findOne({ key: 'seededAi6Bai12' }).lean();
      if (flagDoc?.value?.revision === AI6_BAI12_REVISION) return;
      const course = await CourseModel.findOne({ $or: [{ id: '6AIAB01' }, { code: '6AIAB01' }] });
      if (!course) return;
      mergeAi6Bai12IntoCourse(course);
      course.markModified('modules');
      course.markModified('files');
      course.markModified('syllabus');
      await course.save();
      await revokeStaleVideoCompletion(course.toObject ? course.toObject() : course);
      await SettingModel.findOneAndUpdate(
        { key: 'seededAi6Bai12' },
        { $set: { value: { seeded: true, revision: AI6_BAI12_REVISION }, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Thông báo đồng bộ Bài 1 & 2 cho 6AIAB01 Mongo:', e.message);
    }
  } else {
    const db = readDb();
    db.settings = db.settings || {};
    if (db.settings.ai6Bai12Revision === AI6_BAI12_REVISION) return;
    const course = (db.courses || []).find(c => c.id === '6AIAB01' || c.code === '6AIAB01');
    if (!course) return;
    mergeAi6Bai12IntoCourse(course);
    db.settings.ai6Bai12Revision = AI6_BAI12_REVISION;
    writeDb(db);
    await revokeStaleVideoCompletion(course);
  }
}

// ====================== KHÓA HỌC THỰC TẾ TIN HỌC 12 KNTT – BÀI 12: TẠO BIỂU MẪU (+ HỌC LIỆU TƯƠNG TÁC A2.3) ======================
function buildTin12B12Course() {
  return {
    id: 'TIN12-B12',
    code: 'TIN12-B12',
    name: 'Tin học 12 KNTT – Bài 12: Tạo biểu mẫu (2 tiết + Học liệu tương tác A2.3)',
    category: 'Tin học ứng dụng',
    gradeLevel: 'Lớp 12',
    semester: 'Học kỳ 1',
    academicYear: '2026-2027',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    description: 'Chủ đề 4 (Tin học 12 KNTT – Định hướng Tin học Ứng dụng): Biểu mẫu web <form>, các phần tử label, input (Bảng 12.1), radio, checkbox, select, textarea, fieldset, legend; Học liệu tương tác A2.3 “Phòng thí nghiệm Biểu mẫu: Đoán – Chạy – Giải thích”, trò chơi “Đấu trường Biểu mẫu” 12 câu, thực hành & kiểm duyệt mã AI theo Bảng kiểm 5 tiêu chí, và vận dụng nhúng <iframe> vào trang Bài 11.',
    targetAudience: 'Học sinh Lớp 12 (Định hướng Tin học Ứng dụng – KNTT)',
    instructor: {
      id: 'admin',
      name: 'Phan Phi Phú',
      email: 'phanphiphu04@gmail.com',
      avatar: '',
      title: 'SV Sư phạm Tin học (49.01.103.064) · GVHD: Phạm Thị Bích Tuyền'
    },
    syllabus: [
      'Tiết 1 – Hoạt động 1 & 2.1: Khởi động “Biểu mẫu quanh ta” (Đơn đặt hàng Hội chợ ẩm thực), Cấu trúc biểu mẫu web (<form>, action, mở rộng GET/POST, bảo vệ mật khẩu & quyền riêng tư).',
      'Blended tại nhà sau Tiết 1 – Hoạt động 2.2 (Bài A2.3): Phòng thí nghiệm Biểu mẫu “Đoán – Chạy – Giải thích” (4 chặng chạy mã HTML trực tiếp + 6 câu dự đoán có phản hồi riêng từng lựa chọn + Phiếu phản tư .txt).',
      'Tiết 2 – Hoạt động 3.1: Trò chơi “Đấu trường Biểu mẫu” (12 câu hỏi trắc nghiệm củng cố kiến thức & Câu 12 Ngôi sao hi vọng về an toàn CCCD khi dùng AI).',
      'Tiết 2 – Hoạt động 3.2: Thực hành tạo nv1_monan.html (Hình 12.2), nv2_dangkithi.html (Hình 12.3) và Nhiệm vụ 3 Kiểm duyệt mã AI gợi ý (5 lỗi + Bảng kiểm 5 tiêu chí + Phiếu nhật kí sử dụng AI).',
      'Hoạt động 4 (Vận dụng – SGK tr.70): Tạo biểu mẫu dangki_clb.html và nhúng vào trang web Bài 11 bằng liên kết target và khung nội tuyến <iframe>.'
    ],
    modules: [
      {
        id: 'tin12-mod-1',
        courseId: 'TIN12-B12',
        order: 1,
        title: 'BÀI 12 – TIẾT 1: KHỞI ĐỘNG & BIỂU MẪU WEB (HOẠT ĐỘNG 1 & 2.1)',
        description: 'Biểu mẫu quanh ta (Đơn đặt hàng Hội chợ ẩm thực), khái niệm 2 thành phần của biểu mẫu web, thẻ <form>, thuộc tính action, GET/POST & nguyên tắc an toàn thông tin.',
        learningObjectives: '• Nêu được vai trò và 2 thành phần của biểu mẫu web (phần hiển thị HTML và các script xử lí dữ liệu).\n• Biết cấu trúc cặp thẻ <form>...</form>, thuộc tính action, mở rộng phương thức GET/POST và vai trò bảo vệ thông tin của type="password".\n• Chỉ thu thập thông tin thật sự cần thiết, không nhập số CCCD hay mật khẩu thật vào công cụ AI hoặc trang lạ (NLb, 4.2.NC1a).',
        ownerName: 'Phan Phi Phú',
        activities: [
          {
            id: 'tin12-act-1-1',
            moduleId: 'tin12-mod-1',
            title: 'Hoạt động 1 (Khởi động): Biểu mẫu quanh ta – Đơn đặt hàng Hội chợ ẩm thực & Đăng kí tài khoản',
            type: 'forum',
            durationMinutes: 7,
            isCompleted: false,
            isRequired: true,
            description: 'Tình huống: Lớp 12 mở gian hàng bán bánh tráng trộn trong Hội chợ ẩm thực của trường và cần tạo “Đơn đặt hàng online” cho các lớp khác đặt trước.\n\nThảo luận cặp đôi (3 phút) và trả lời trên Diễn đàn:\n1. Đơn đặt hàng cần hỏi những thông tin nào? Hãy phân loại theo 4 nhóm: Gõ vào (Họ tên, Ghi chú...) | Chọn một (Kích cỡ Nhỏ/Lớn...) | Chọn nhiều (Phần ăn kèm...) | Nút bấm (Đặt hàng).\n2. Mở rộng (Hoạt động 1 – SGK tr.67): Em đã từng đăng kí tài khoản trên trang web hay ứng dụng nào? Mô tả các bước thực hiện (chú ý các ô nhập tên, mật khẩu, lựa chọn và nút Đăng kí).'
          },
          {
            id: 'tin12-act-1-2',
            moduleId: 'tin12-mod-1',
            title: 'Hoạt động 2.1: Kiến thức trọng tâm Biểu mẫu web, thẻ <form>, action, GET/POST & type="password" (SGK tr.67–68)',
            type: 'document',
            durationMinutes: 15,
            isCompleted: false,
            isRequired: true,
            description: '1. KHÁI NIỆM & 2 THÀNH PHẦN CỦA BIỂU MẪU WEB (SGK tr.67):\n• Biểu mẫu web (web form) là giao diện cho phép người dùng nhập dữ liệu trên trang web và gửi về máy chủ xử lí (VD: đăng kí tài khoản, đăng nhập, đặt hàng, bình chọn, tìm kiếm).\n• Một biểu mẫu web gồm 2 thành phần:\n  (1) Phần hiển thị trên trang web: tạo bằng các phần tử HTML như <form>, <label>, <input>, <select>, <textarea>, <fieldset>, <legend>.\n  (2) Các ứng dụng/script xử lí dữ liệu (ở máy chủ hoặc trình duyệt): tiếp nhận, kiểm tra và lưu trữ dữ liệu (phần này không thuộc phạm vi lập trình HTML Bài 12).\n\n2. CẤU TRÚC THẺ <form> VÀ THUỘC TÍNH action:\n<form action="/action_page.php" method="POST">\n  <!-- Các phần tử nhập dữ liệu đặt ở đây -->\n</form>\n• action: xác định địa chỉ (URL/chương trình) nơi dữ liệu biểu mẫu được gửi tới khi bấm nút Submit.\n• Mở rộng thuộc tính method:\n  - GET: dữ liệu gắn trực tiếp lên thanh địa chỉ URL (phù hợp ô tìm kiếm, KHÔNG dùng cho mật khẩu).\n  - POST: dữ liệu gửi ẩn trong thân gói tin HTTP (phù hợp đăng nhập, đăng kí, gửi thông tin cá nhân).\n\n3. AN TOÀN THÔNG TIN & QUYỀN RIÊNG TƯ (4.2.NC1a):\n• Dùng type="password" để che mật khẩu bằng dấu chấm (•••) tránh bị nhìn trộm trên màn hình.\n• Khi thiết kế biểu mẫu cho CLB hoặc gian hàng trường học: CHỈ hỏi những thông tin thật sự cần thiết (không thu thập thừa số CCCD, mật khẩu ngân hàng, địa chỉ nhà riêng...).\n• Khi dùng AI hỗ trợ viết mã HTML: tuyệt đối KHÔNG nhập dữ liệu cá nhân thật của mình hay bạn bè vào câu lệnh AI.'
          },
          {
            id: 'tin12-act-1-3',
            moduleId: 'tin12-mod-1',
            title: 'Phiếu học tập số 1 (Câu 1 & Câu 2 – Chọn phần tử cho Đơn đặt bánh tráng trộn)',
            type: 'assignment',
            durationMinutes: 15,
            isCompleted: false,
            isRequired: true,
            maxScore: 10,
            programmingLanguage: 'Tài liệu & Dự án',
            description: 'Hoàn thành Câu 1 & Câu 2 của Phiếu học tập số 1 theo KHBD Bài 12.',
            assignmentPrompt: 'PHIẾU HỌC TẬP SỐ 1 – BIỂU MẪU WEB VÀ CÁC PHẦN TỬ NHẬP DỮ LIỆU\n\nCâu 1 (Khái niệm – SGK tr.67):\n1) Biểu mẫu web dùng để làm gì? Gồm mấy thành phần?\n2) Kể tên 4 phần tử HTML thường dùng trong biểu mẫu.\n\nCâu 2 (Chọn phần tử phù hợp cho “Đơn đặt bánh tráng trộn” – CHỈ sử dụng các kiểu trong Bảng 12.1 SGK tr.68 cùng <select> và <textarea>):\nHãy chỉ rõ phần tử / thuộc tính type phù hợp và giải thích ngắn cho từng mục sau:\n1. Họ tên người đặt\n2. Email liên hệ\n3. Số phần ăn\n4. Giờ nhận hàng\n5. Kích cỡ: Nhỏ / Lớn (chỉ chọn một)\n6. Phần ăn kèm: Trứng cút, Khô bò, Xoài, Hành phi (được chọn nhiều)\n7. Lớp: chọn từ danh sách 10 / 11 / 12\n8. Ghi chú (nhiều dòng)\n\n(Gợi ý mở rộng: với Email/Số phần ăn/Giờ nhận hàng, ngoài type="text" trong Bảng 12.1, HTML5 còn hỗ trợ các kiểu mở rộng email, number, time.)'
          }
        ]
      },
      {
        id: 'tin12-mod-2',
        courseId: 'TIN12-B12',
        order: 2,
        title: 'BÀI 12 – HOẠT ĐỘNG 2.2 (A2.3): PHÒNG THÍ NGHIỆM BIỂU MẪU (ĐOÁN – CHẠY – GIẢI THÍCH)',
        description: 'Học liệu tương tác A2.3 triển khai theo mô hình Blended Learning (tự học ở nhà 15–20 phút sau Tiết 1): đọc mã, dự đoán, chạy biểu mẫu thật, sửa mã và phản tư.',
        learningObjectives: '• Dự đoán và giải thích được ảnh hưởng của for–id (Chặng 1), 7 giá trị type theo Bảng 12.1 (Chặng 2), name và value của radio (Chặng 3).\n• Tự chạy mã HTML trực tiếp, quan sát bảng “Dữ liệu gửi đi” (FormData) và sửa được 3 lỗi thường gặp ở Chặng 4 (mức Phân tích).\n• Xuất phiếu kết quả (.txt) & viết phản tư (Metacognitive) mà không cần lộ dữ liệu cá nhân.',
        ownerName: 'Phan Phi Phú',
        activities: [
          {
            id: 'tin12-act-2-1',
            moduleId: 'tin12-mod-2',
            title: 'Phòng thí nghiệm Biểu mẫu A2.3: Đoán – Chạy – Giải thích (Học liệu HTML5 trực tiếp)',
            type: 'document',
            durationMinutes: 20,
            isCompleted: false,
            isRequired: true,
            fileUrl: '/a23-phong-thi-nghiem-bieu-mau.html',
            description: 'Học liệu tương tác 4 chặng (Đoán → Chạy → Giải thích → Thử nghiệm) bám sát SGK Tin học 12 KNTT tr.67–69. Có nút phóng to chữ (UDL), bộ đếm thời gian 20 phút, chạy offline 1 tệp HTML và tải phiếu kết quả (.txt) không thu thập dữ liệu cá nhân.'
          },
          {
            id: 'tin12-act-2-2',
            moduleId: 'tin12-mod-2',
            title: 'Trắc nghiệm Dự đoán 4 Chặng A2.3 (6 câu gây nhiễu cao · Đếm ngược 10 phút)',
            type: 'quiz',
            durationMinutes: 10,
            isCompleted: false,
            isRequired: true,
            maxScore: 10,
            passScore: 5,
            timeLimitMinutes: 10,
            shuffleQuestions: false,
            description: '6 câu hỏi dự đoán 4 chặng A2.3 có bộ đếm ngược 10 phút và các phương án nhiễu gần giống nhau, đánh trúng ngộ nhận thực tế của HS lớp 12. Nộp bài xong sẽ hiện phản hồi sư phạm riêng cho đúng lựa chọn của em.',
            quizQuestions: [
              {
                id: 'a23-q1',
                question: '[Chặng 1 – label và input] Cho đoạn mã: <label for="ten">Họ tên:</label><input type="text" id="ten" name="hoTen">. Khi chạy đoạn mã rồi nháy chuột trực tiếp vào chữ “Họ tên:”, điều gì xảy ra?',
                options: [
                  'Con trỏ nhập liệu tự động nhảy vào ô nhập và điền sẵn nội dung mặc định là chữ “ten”',
                  'Con trỏ nhập liệu tự động nhảy vào ô nhập tương ứng bên cạnh để người dùng gõ ngay',
                  'Con trỏ chỉ nhảy vào ô nếu for trùng với name="hoTen", còn trùng id="ten" thì không có tác dụng',
                  'Chữ “Họ tên:” chỉ được bôi đậm lên để đánh dấu, người dùng vẫn phải bấm vào khung ô nhập để gõ'
                ],
                correctAnswer: 1,
                optionFeedback: [
                  'Gần đúng ở ý con trỏ nhảy vào ô, nhưng id="ten" chỉ là mã định danh chứ không tự điền chữ vào ô (muốn đặt giá trị sẵn phải dùng thuộc tính value).',
                  'Chính xác! Thuộc tính for="ten" của label trùng khớp với id="ten" của input nên nháy vào nhãn cũng kích hoạt trực tiếp ô nhập đó.',
                  'Rất nhiều bạn nhầm cặp for–id với name! Hãy nhớ: for của label luôn liên kết với id của input; còn name dùng khi gửi dữ liệu.',
                  'Chưa đúng. Label không chỉ là chữ trang trí — khi có for khớp id, nháy trực tiếp vào nhãn sẽ đưa con trỏ vào ngay ô nhập.'
                ],
                explanation: 'Theo SGK tr.67–68: label định nghĩa nhãn cho vùng nhập; giá trị for phải trùng id của input thì nhãn mới gắn với ô (“For với id là một cặp – phải giống nhau”).'
              },
              {
                id: 'a23-q2a',
                question: '[Chặng 2 – type="password"] Cho thẻ <input type="password" id="o1" name="oThu">. Khi gõ chuỗi abc vào ô rồi gửi biểu mẫu, cách hiển thị và dữ liệu gửi đi như thế nào?',
                options: [
                  'Trên màn hình hiện dấu chấm (•••), còn dữ liệu gửi đi cũng biến thành chuỗi dấu chấm (•••) thay cho abc',
                  'Trên màn hình bị che thành dấu chấm (•••), còn dữ liệu thực sự lưu trong ô và gửi đi vẫn là abc',
                  'Trên màn hình vẫn hiện rõ chữ abc khi đang gõ và chỉ chuyển thành dấu chấm (•••) sau khi bấm nút gửi',
                  'Trên màn hình hiện dấu chấm (•••), đồng thời trình duyệt tự động chặn không cho nhập chuỗi abc quá ngắn'
                ],
                correctAnswer: 1,
                optionFeedback: [
                  'Rất dễ nhầm! type="password" chỉ che phần hiển thị trên màn hình để tránh nhìn trộm, chứ không biến đổi hay mã hóa giá trị gốc bên trong ô.',
                  'Chính xác! Theo Bảng 12.1 (SGK tr.68), type="password" ẩn kí tự trên màn hình bằng dấu chấm, còn giá trị gửi đi vẫn là chuỗi người dùng gõ.',
                  'Chưa đúng. Trình duyệt che thành dấu chấm ngay tại thời điểm em gõ từng kí tự chứ không đợi tới khi bấm gửi.',
                  'Chưa đúng. Thuộc tính type="password" không tự kiểm tra độ dài hay độ mạnh mật khẩu; nó vẫn nhận chuỗi abc bình thường.'
                ],
                explanation: 'Theo Bảng 12.1 (SGK tr.68): type="password" tạo trường nhập mật khẩu giúp che kí tự hiển thị trên màn hình, dữ liệu gốc vẫn giữ nguyên khi gửi.'
              },
              {
                id: 'a23-q2b',
                question: '[Chặng 2 – Câu hỏi 2 SGK tr.69] Câu lệnh HTML nào tạo đúng nút bấm “Quên mật khẩu” mà KHÔNG gửi dữ liệu biểu mẫu đi?',
                options: [
                  '<input type="submit" value="Quên mật khẩu">',
                  '<input type="button" value="Quên mật khẩu">',
                  '<input type="button" name="Quên mật khẩu">',
                  '<input type="button">Quên mật khẩu</input>'
                ],
                correctAnswer: 1,
                optionFeedback: [
                  'Rất giống đáp án đúng nhưng type="submit" là nút gửi toàn bộ dữ liệu biểu mẫu đi, không phù hợp cho nút “Quên mật khẩu”.',
                  'Chính xác! Theo Bảng 12.1, type="button" tạo nút bấm thông thường (không gửi biểu mẫu) và chữ hiển thị trên nút đặt trong thuộc tính value.',
                  'Cẩn thận bẫy thuộc tính! name chỉ đặt tên biến nội bộ chứ không hiện chữ lên mặt nút — chữ hiển thị trên nút phải đặt ở thuộc tính value.',
                  'Dễ nhầm với cặp thẻ <button>...</button>! Thẻ <input> là thẻ đơn, không có thẻ đóng </input>; nhãn trên nút phải ghi bằng value="Quên mật khẩu".'
                ],
                explanation: 'Theo Bảng 12.1 (SGK tr.68–69): input là thẻ đơn; type="button" tạo nút bấm không gửi biểu mẫu và chữ trên nút đặt trong thuộc tính value.'
              },
              {
                id: 'a23-q3a',
                question: '[Chặng 3 – Hai ô radio khác name] Hai ô radio “Nhỏ” (name="size") và “Lớn” (name="size2") cùng nằm trong một <form>. Khi bấm chọn Nhỏ rồi bấm chọn Lớn, hiện tượng nào xảy ra?',
                options: [
                  'Chỉ ô Lớn được chọn, ô Nhỏ tự động bỏ chọn vì cả hai ô cùng nằm trong chung một thẻ <form>',
                  'Cả hai ô Nhỏ và Lớn cùng được chọn đồng thời và không tự loại trừ nhau khi bấm qua lại',
                  'Chỉ ô Nhỏ giữ nguyên trạng thái được chọn, ô Lớn bị khóa không bấm được do khác tên nhóm size',
                  'Cả hai ô đều bấm chọn được, nhưng khi bấm Gửi thì trình duyệt dừng lại và báo lỗi cú pháp HTML'
                ],
                correctAnswer: 1,
                optionFeedback: [
                  'Đây là ngộ nhận rất phổ biến! Đặt chung trong <form> là chưa đủ — radio chỉ tự bỏ chọn lẫn nhau khi có CÙNG giá trị thuộc tính name.',
                  'Chính xác! Vì name="size" và name="size2" khác nhau nên trình duyệt coi đây là 2 nhóm radio độc lập, cho phép chọn cả hai cùng lúc.',
                  'Chưa đúng. Trình duyệt không khóa ô thứ hai — cả hai ô vẫn bấm chọn được bình thường.',
                  'Trình duyệt không báo lỗi HTML kiểu này; biểu mẫu vẫn chạy và gửi đi sai ý đồ thiết kế.'
                ],
                explanation: 'Theo SGK tr.68: các ô radio thuộc cùng một nhóm lựa chọn loại trừ nhau bắt buộc phải có cùng giá trị thuộc tính name.'
              },
              {
                id: 'a23-q3b',
                question: '[Chặng 3 – Xóa value="nho"] Sau khi sửa 2 ô radio cùng name="size", nếu xóa thuộc tính value="nho" ở ô Nhỏ (id="nho"), chọn Nhỏ rồi bấm Gửi, dữ liệu gửi đi là gì?',
                options: [
                  'size = nho (trình duyệt tự lấy giá trị của thuộc tính id="nho" thay thế cho value bị thiếu)',
                  'size = on (trình duyệt gửi chuỗi mặc định “on” vì ô có name nhưng không khai báo thuộc tính value)',
                  'size = Nhỏ (trình duyệt tự lấy phần chữ bên trong thẻ <label for="nho">Nhỏ</label> để gửi đi)',
                  'size = (giá trị rỗng, vì trình duyệt chỉ gửi tên biến size mà không gắn kèm giá trị nào phía sau)'
                ],
                correctAnswer: 1,
                optionFeedback: [
                  'Rất nhiều bạn đoán vậy! Nhưng id chỉ dùng trong trang HTML (liên kết label/CSS/JS), trình duyệt không bao giờ lấy id gửi làm giá trị thay cho value.',
                  'Chính xác! Khi thiếu value, trình duyệt gửi giá trị mặc định “on”, máy chủ không phân biệt được em chọn ô nào. Vì vậy mỗi radio/checkbox luôn cần có value.',
                  'Rất dễ nhầm! Chữ trong <label> chỉ để người dùng đọc trên giao diện, trình duyệt không gửi nội dung thẻ label làm dữ liệu của ô radio.',
                  'Đó là cách hoạt động của ô nhập văn bản (text) để trống. Riêng radio và checkbox được chọn nhưng thiếu value sẽ gửi giá trị mặc định là “on”.'
                ],
                explanation: 'Câu chốt Chặng 3: “Radio thì nhớ: cùng name, thêm value.” Thiếu value sẽ gửi chuỗi mặc định on.'
              },
              {
                id: 'a23-q4',
                question: '[Chặng 4 – Phân tích lỗi đơn đặt hàng] Trong đoạn mã: Họ tên chỉ có id="ten" (không có name), Email có for="mail" và id="email" name="email", 2 radio dùng size1 và size2. Khi nhập đủ thông tin, chọn cả Nhỏ và Lớn rồi bấm “Gửi đơn hàng”, kết quả ở bảng dữ liệu gửi đi là gì?',
                options: [
                  'Chỉ bị mất dữ liệu “Họ tên”; còn “Email” và cả hai mục “Kích cỡ” (size1, size2) vẫn được gửi đi',
                  'Chỉ bị mất dữ liệu “Email” vì nhãn for="mail" không khớp id="email"; còn “Họ tên” vẫn gửi theo id="ten"',
                  'Bị mất cả “Họ tên” (thiếu name) lẫn “Email” (lệch for–id); chỉ có hai ô radio kích cỡ được gửi đi',
                  'Bị mất dữ liệu “Kích cỡ” vì hai ô radio đặt khác name (size1, size2) gây xung đột; “Họ tên” và “Email” vẫn gửi đủ'
                ],
                correctAnswer: 0,
                optionFeedback: [
                  'Chính xác! Ô Họ tên không có thuộc tính name nên trình duyệt bỏ qua hoàn toàn khi đóng gói dữ liệu. Quên name là mất dữ liệu!',
                  'Cẩn thận bẫy hai lỗi khác nhau! Lệch for–id chỉ làm nháy nhãn không vào ô chứ không làm mất dữ liệu gửi (ô Email vẫn có name="email"). Ngược lại, id="ten" không thay được name.',
                  'Đúng một nửa ở ô Họ tên, nhưng ô Email vẫn có đầy đủ name="email" nên dữ liệu người dùng gõ vào ô Email vẫn được gửi đi bình thường.',
                  'Hai ô radio khác name không làm mất dữ liệu mà khiến cả hai giá trị size1 và size2 cùng bị gửi đi.'
                ],
                explanation: 'Thuộc tính name của thẻ input dùng để định danh dữ liệu khi gửi tới máy chủ. Thiếu name thì trình duyệt bỏ qua ô đó khi gửi biểu mẫu.'
              }
            ]
          },
          {
            id: 'tin12-act-2-3',
            moduleId: 'tin12-mod-2',
            title: 'Nộp Phiếu kết quả A2.3 (.txt) & Phản tư (Metacognitive)',
            type: 'assignment',
            durationMinutes: 10,
            isCompleted: false,
            isRequired: true,
            maxScore: 10,
            programmingLanguage: 'Tài liệu & Dự án',
            description: 'Nộp tệp .txt tải về từ cuối Phòng thí nghiệm A2.3 (hoặc dán nội dung phản tư trực tiếp) để giáo viên nắm lỗi sai phổ biến trước Tiết 2.',
            assignmentPrompt: 'HƯỚNG DẪN NỘP KẾT QUẢ PHÒNG THÍ NGHIỆM BIỂU MẪU A2.3\n\n1. Hoàn thành đủ 4 chặng trong hoạt động “🔬 Phòng thí nghiệm Biểu mẫu A2.3” ở ngay phía trên.\n2. Ở màn hình Tổng kết & Phản tư, trả lời ngắn gọn 3 câu hỏi:\n   • Câu nào em đoán sai ở lần đầu?\n   • Vì sao lúc đầu em lại đoán như vậy?\n   • Sau khi chạy thử và sửa mã, giờ em hiểu lại như thế nào?\n3. Bấm nút “⬇ Tải phiếu kết quả (.txt)” rồi tải tệp đó lên mục này (hoặc chuyển sang tab “Nhập bài làm trực tiếp” để dán câu trả lời phản tư).\n\n(Mục đích: Đánh giá quá trình không tính áp lực điểm số — giúp giáo viên biết lỗi nào cả lớp hay mắc để chốt nhanh đầu Tiết 2.)'
          }
        ]
      },
      {
        id: 'tin12-mod-3',
        courseId: 'TIN12-B12',
        order: 3,
        title: 'BÀI 12 – TIẾT 2: TRÒ CHƠI “ĐẤU TRƯỜNG BIỂU MẪU” (HOẠT ĐỘNG 3.1)',
        description: '12 câu hỏi trắc nghiệm chuẩn KHBD Bài 12 củng cố toàn bộ thẻ & thuộc tính biểu mẫu HTML + Câu 12 Ngôi sao hi vọng về an toàn dữ liệu khi dùng AI.',
        learningObjectives: '• Củng cố chính xác thẻ <form>, <label>, <input> (Bảng 12.1), <textarea>, <select>, <fieldset>, <legend> và các thuộc tính action, for, id, name, type, value.\n• Nhận diện và xử lí đúng tình huống AI gợi ý thu thập thừa dữ liệu nhạy cảm (số CCCD).',
        ownerName: 'Phan Phi Phú',
        activities: [
          {
            id: 'tin12-act-3-1',
            moduleId: 'tin12-mod-3',
            title: 'Trò chơi “Đấu trường Biểu mẫu” (12 câu gây nhiễu cao · Đếm ngược 4 phút)',
            type: 'quiz',
            durationMinutes: 4,
            isCompleted: false,
            isRequired: true,
            maxScore: 10,
            passScore: 5,
            timeLimitMinutes: 4,
            shuffleQuestions: false,
            description: 'Gồm 12 câu hỏi chuẩn KHBD Bài 12 với bộ đếm ngược 4 phút (20 giây/câu như thi trên lớp), các đáp án nhiễu gần giống nhau kèm phản hồi riêng từng lựa chọn và Câu 12 “Ngôi sao hi vọng” về kiểm duyệt mã AI & bảo vệ số CCCD.',
            quizQuestions: [
              {
                id: 'dt-q1',
                question: 'Câu 1: Cặp thẻ HTML nào dùng để khai báo và bao bọc toàn bộ một biểu mẫu web?',
                options: ['<fieldset>', '<form>', '<input>', '<frame>'],
                correctAnswer: 1,
                optionFeedback: [
                  '<fieldset> chỉ dùng để vẽ khung nhóm các trường con ở BÊN TRONG biểu mẫu, không thay thế thẻ tạo biểu mẫu.',
                  'Chính xác! Cặp thẻ <form>...</form> định nghĩa toàn bộ biểu mẫu web và nơi nhận dữ liệu (action).',
                  '<input> là thẻ đơn tạo từng ô nhập/nút bấm bên trong biểu mẫu chứ không phải thẻ bao toàn bộ biểu mẫu.',
                  '<frame> (hoặc <iframe>) dùng để nhúng khung trang web, rất dễ nhầm mặt chữ với <form>!'
                ],
                explanation: 'Thẻ <form>...</form> dùng để tạo biểu mẫu web (SGK tr.67).'
              },
              {
                id: 'dt-q2',
                question: 'Câu 2: Để tạo trường nhập mật khẩu hiển thị ẩn kí tự bằng dấu chấm (•••), ta dùng giá trị type nào trong thẻ <input>?',
                options: ['text', 'hidden', 'secret', 'password'],
                correctAnswer: 3,
                optionFeedback: [
                  'type="text" hiển thị rõ toàn bộ kí tự người dùng gõ trên màn hình, không che mật khẩu.',
                  'Rất dễ nhầm! type="hidden" làm ẩn hoàn toàn cả ô nhập khỏi màn hình (người dùng không thấy ô để gõ).',
                  'Trong chuẩn HTML không có kiểu type="secret" — trình duyệt sẽ hiểu nhầm về ô text thông thường.',
                  'Chính xác! Theo Bảng 12.1 (SGK tr.68), type="password" tạo ô nhập mật khẩu che kí tự thành dấu chấm.'
                ],
                explanation: 'type="password" dùng để nhập mật khẩu, kí tự hiển thị ẩn bằng dấu chấm (Bảng 12.1 – SGK tr.68).'
              },
              {
                id: 'dt-q3',
                question: 'Câu 3: Phát biểu nào mô tả CHÍNH XÁC nhất đặc điểm hoạt động của ô chọn kiểu radio trong HTML?',
                options: [
                  'Cho phép chọn nhiều giá trị cùng lúc khi các ô có chung một thuộc tính name',
                  'Tự động chỉ cho chọn một giá trị duy nhất trên toàn bộ biểu mẫu bất kể name giống hay khác nhau',
                  'Chỉ cho phép chọn một giá trị duy nhất trong nhóm các ô có cùng thuộc tính name',
                  'Chỉ cho phép chọn một giá trị duy nhất trong nhóm các ô có cùng thuộc tính id'
                ],
                correctAnswer: 2,
                optionFeedback: [
                  'Đó là đặc điểm của checkbox, không phải radio! Radio cùng name sẽ loại trừ lẫn nhau.',
                  'Rất nhiều bạn nhầm ý này! Nếu đặt khác name, hai ô radio trong cùng <form> vẫn chọn được cả hai cùng lúc.',
                  'Chính xác! Các ô radio chỉ tạo thành một nhóm loại trừ nhau khi có cùng giá trị thuộc tính name.',
                  'Cẩn thận bẫy id vs name! Trong HTML, mỗi phần tử phải có id duy nhất; việc gom nhóm radio dựa vào thuộc tính name.'
                ],
                explanation: 'Các ô radio có cùng thuộc tính name tạo thành một nhóm và chỉ cho chọn duy nhất 1 giá trị (SGK tr.68).'
              },
              {
                id: 'dt-q4',
                question: 'Câu 4: Phần tử HTML chuẩn nào dùng để tạo vùng nhập văn bản nhiều dòng (như Ghi chú, Ý kiến đóng góp)?',
                options: ['<textarea>', '<input type="textarea">', '<input type="multiline">', '<textblock>'],
                correctAnswer: 0,
                optionFeedback: [
                  'Chính xác! <textarea>...</textarea> là phần tử riêng dùng để nhập văn bản nhiều dòng (SGK tr.68).',
                  'Rất hay bị nhầm! textarea là một thẻ riêng biệt (<textarea>), KHÔNG phải một giá trị type của <input>.',
                  'Chuẩn HTML không có type="multiline" cho thẻ <input>; muốn nhập nhiều dòng phải dùng <textarea>.',
                  'Chuẩn HTML không có thẻ <textblock>; phần tử chuẩn để nhập văn bản nhiều dòng là <textarea>.'
                ],
                explanation: 'Phần tử <textarea> dùng để nhập đoạn văn bản nhiều dòng như ghi chú, ý kiến đóng góp (SGK tr.68).'
              },
              {
                id: 'dt-q5',
                question: 'Câu 5: Cho đoạn mã <label for="email">Email</label><input id="email" type="email">. Vai trò chính xác của for="email" là gì?',
                options: [
                  'Quy định tên trường dữ liệu gửi về máy chủ là “email” thay cho thuộc tính name',
                  'Yêu cầu trình duyệt kiểm tra chuỗi người dùng nhập vào phải chứa kí tự @',
                  'Hiển thị dòng chữ gợi ý mờ “email” nằm sẵn bên trong ô nhập liệu',
                  'Liên kết trực tiếp nhãn với ô nhập có thuộc tính id="email" tương ứng'
                ],
                correctAnswer: 3,
                optionFeedback: [
                  'Đặt tên trường gửi về máy chủ là việc của thuộc tính name trên <input>, không phải for của <label>.',
                  'Kiểm tra định dạng email có kí tự @ là việc của thuộc tính type="email" trên <input>, không phải for.',
                  'Hiển thị chữ gợi ý mờ trong ô nhập là vai trò của thuộc tính placeholder, không phải for.',
                  'Chính xác! Thuộc tính for="email" của <label> liên kết nhãn với phần tử có id="email" để nháy vào nhãn là đưa con trỏ vào ô.'
                ],
                explanation: 'Thuộc tính for của <label> liên kết nhãn với ô nhập có id tương ứng — nháy vào nhãn sẽ đưa con trỏ vào ô (SGK tr.67–68).'
              },
              {
                id: 'dt-q6',
                question: 'Câu 6: Thuộc tính action của thẻ <form> xác định thông tin gì?',
                options: [
                  'Địa chỉ trang hoặc chương trình xử lí nơi dữ liệu biểu mẫu được gửi đến',
                  'Phương thức truyền gói tin dữ liệu biểu mẫu lên máy chủ (GET hoặc POST)',
                  'Hành động JavaScript tự động chạy khi người dùng bấm vào một nút type="button"',
                  'Quy tắc kiểm tra tính hợp lệ của từng ô dữ liệu trước khi cho phép gửi đi'
                ],
                correctAnswer: 0,
                optionFeedback: [
                  'Chính xác! Thuộc tính action chỉ định URL hoặc tệp script tiếp nhận và xử lí dữ liệu biểu mẫu khi gửi.',
                  'Rất dễ nhầm giữa action và method! GET/POST được khai báo trong thuộc tính method, còn nơi nhận là action.',
                  'Gắn hành động cho nút bấm thông thường dùng thuộc tính sự kiện (như onclick), không phải action của <form>.',
                  'Kiểm tra hợp lệ dữ liệu dùng type và các thuộc tính như required, min, max — không phải action.'
                ],
                explanation: 'Thuộc tính action chỉ định địa chỉ/chương trình tiếp nhận và xử lí dữ liệu biểu mẫu khi gửi đi (SGK tr.67).'
              },
              {
                id: 'dt-q7',
                question: 'Câu 7: Thuộc tính nào của thẻ <input> dùng để định danh và tham chiếu tới dữ liệu khi tính toán hay gửi tới máy chủ?',
                options: ['id', 'name', 'value', 'for'],
                correctAnswer: 1,
                optionFeedback: [
                  'Cực kỳ dễ nhầm! id dùng để định danh phần tử trong trang HTML (gắn label for, CSS), KHÔNG dùng làm khóa gửi dữ liệu.',
                  'Chính xác! Thuộc tính name đặt tên cho dữ liệu của ô nhập; nếu thiếu name, ô đó sẽ không được gửi đi.',
                  'value chứa giá trị/nội dung gửi đi của phần tử chứ không phải tên tham chiếu của trường dữ liệu.',
                  'for là thuộc tính của thẻ <label>, không dùng trên thẻ <input>.'
                ],
                explanation: 'Thuộc tính name dùng để định danh dữ liệu của ô nhập khi gửi tới máy chủ hoặc xử lí (SGK tr.68).'
              },
              {
                id: 'dt-q8',
                question: 'Câu 8: Phần tử HTML nào dùng để nhóm các phần tử có liên quan trong biểu mẫu bằng một khung hình chữ nhật bao quanh?',
                options: ['<legend>', '<formgroup>', '<fieldset>', '<optgroup>'],
                correctAnswer: 2,
                optionFeedback: [
                  'Rất hay bị đảo ngược cặp thẻ! <legend> chỉ đặt tiêu đề chữ nằm trên viền khung, còn khung bao quanh là <fieldset>.',
                  'Chuẩn HTML không có thẻ <formgroup>; phần tử chuẩn để nhóm các trường trong biểu mẫu là <fieldset>.',
                  'Chính xác! <fieldset> tạo khung hình chữ nhật gom nhóm các phần tử liên quan, đi kèm <legend> làm tiêu đề nhóm.',
                  '<optgroup> chỉ dùng để gom nhóm các thẻ <option> bên trong danh sách thả xuống <select>.'
                ],
                explanation: '<fieldset> dùng để nhóm các phần tử liên quan bằng khung hình chữ nhật; <legend> đặt tiêu đề cho khung đó (SGK tr.68).'
              },
              {
                id: 'dt-q9',
                question: 'Câu 9: Hai ô radio “Nam” và “Nữ” trong cùng một <form> lần lượt có name="gt1" và name="gt2". Khi chạy trên trình duyệt sẽ xảy ra hiện tượng gì?',
                options: [
                  'Người dùng có thể bấm chọn đồng thời cả hai ô “Nam” và “Nữ” cùng lúc',
                  'Người dùng chỉ chọn được tối đa một ô vì hai ô nằm cạnh nhau trong cùng thẻ <form>',
                  'Người dùng chỉ chọn được ô “Nam”, còn ô “Nữ” bị khóa do khác tên nhóm gt1',
                  'Trình duyệt hiện cảnh báo lỗi cú pháp HTML và không cho gửi biểu mẫu'
                ],
                correctAnswer: 0,
                optionFeedback: [
                  'Chính xác! Do gt1 và gt2 khác nhau nên hai ô thuộc hai nhóm radio độc lập, chọn được cả hai cùng lúc.',
                  'Ngộ nhận kinh điển! Nằm chung <form> không làm radio tự loại trừ nhau — phải đặt CÙNG giá trị name (VD: name="gt").',
                  'Trình duyệt không khóa ô thứ hai; cả hai ô radio đều bấm chọn bình thường.',
                  'Trình duyệt không báo lỗi HTML trong tình huống này nên lỗi chỉ lộ ra khi chạy thử!'
                ],
                explanation: 'Hai ô radio khác giá trị name nên thuộc 2 nhóm độc lập, trình duyệt cho phép chọn cả hai ô cùng lúc.'
              },
              {
                id: 'dt-q10',
                question: 'Câu 10: Để thu thập mục “Sở thích: Bóng đá, Cờ vua, Âm nhạc (được phép chọn nhiều)”, cách thiết kế nào chuẩn nhất?',
                options: [
                  'Dùng ba ô input kiểu radio đặt khác thuộc tính name để chọn được nhiều mục cùng lúc',
                  'Dùng ba ô input kiểu checkbox có cùng thuộc tính name và giá trị value riêng cho từng sở thích',
                  'Dùng một thẻ <select> mặc định kèm ba thẻ <option> lồng bên trong',
                  'Dùng ba ô input kiểu radio có cùng thuộc tính name và khác thuộc tính id'
                ],
                correctAnswer: 1,
                optionFeedback: [
                  'Bẫy rất tinh vi! Radio khác name tuy chọn được nhiều nhưng một khi đã bấm thì KHÔNG thể bấm lại để bỏ chọn, sai chuẩn giao diện.',
                  'Chính xác! Checkbox được thiết kế riêng cho lựa chọn nhiều mục (bật/tắt độc lập từng ô), mỗi ô có value rõ ràng.',
                  'Thẻ <select> mặc định (không có multiple) chỉ cho phép chọn duy nhất 1 mục trong danh sách thả xuống.',
                  'Ba ô radio cùng name chỉ cho phép chọn duy nhất 1 sở thích, không đáp ứng yêu cầu chọn nhiều.'
                ],
                explanation: 'Checkbox cho phép chọn nhiều mục cùng lúc và bật/tắt độc lập; radio chỉ dành cho chọn duy nhất 1 mục.'
              },
              {
                id: 'dt-q11',
                question: 'Câu 11: Muốn tạo nút cho phép người dùng chọn tệp từ thiết bị để tải lên máy chủ, ta dùng thẻ <input> có type nào?',
                options: ['submit', 'upload', 'attachment', 'file'],
                correctAnswer: 3,
                optionFeedback: [
                  'type="submit" chỉ tạo nút gửi toàn bộ biểu mẫu, không mở cửa sổ chọn tệp trên máy tính.',
                  'Rất dễ nhầm theo nghĩa tiếng Anh! Chuẩn HTML không có type="upload" mà dùng type="file".',
                  'Chuẩn HTML không có type="attachment"; giá trị đúng trong Bảng 12.1 là type="file".',
                  'Chính xác! Theo Bảng 12.1 (SGK tr.68), type="file" tạo nút chọn tệp để tải lên máy chủ.'
                ],
                explanation: 'Theo Bảng 12.1 (SGK tr.68): type="file" tạo nút chọn tệp từ thiết bị để tải lên máy chủ.'
              },
              {
                id: 'dt-q12',
                question: 'Câu 12 (Ngôi sao hi vọng): Khi nhờ AI gợi ý mã biểu mẫu đăng kí CLB học sinh, AI tự thêm ô nhập số CCCD không cần thiết. Cách xử lí đúng nhất là gì?',
                options: [
                  'Giữ nguyên ô nhập số CCCD vì AI tạo sẵn để ban chủ nhiệm CLB dễ xác minh danh tính thành viên',
                  'Nhập thử số CCCD thật của một thành viên vào công cụ AI để kiểm tra biểu mẫu có nhận đủ 12 số không',
                  'Kiểm duyệt lại mã, xóa bỏ ô số CCCD không cần thiết, chạy thử kiểm chứng trên trình duyệt rồi mới sử dụng',
                  'Giữ lại ô số CCCD nhưng đổi sang type="password" để che thành dấu chấm là bảo đảm an toàn dữ liệu'
                ],
                correctAnswer: 2,
                optionFeedback: [
                  'Không nên tin tuyệt đối vào mã do AI sinh ra! Biểu mẫu đăng kí CLB học sinh không cần thu thập số CCCD (dữ liệu định danh nhạy cảm).',
                  'Tuyệt đối KHÔNG nhập số CCCD thật hay dữ liệu cá nhân thật của mình/bạn bè vào công cụ AI công cộng!',
                  'Chính xác! Người thiết kế phải làm chủ và kiểm duyệt mã AI: loại bỏ trường thu thập thừa dữ liệu nhạy cảm, tự chạy thử rồi mới triển khai (4.2.NC1a).',
                  'Bẫy rất dễ mắc! type="password" chỉ che hiển thị trên màn hình chứ vẫn thu thập và gửi số CCCD đi — nguyên tắc quyền riêng tư là KHÔNG thu thập dữ liệu không cần thiết ngay từ đầu.'
                ],
                explanation: 'Phải kiểm duyệt mã do AI gợi ý: lược bỏ các trường thu thập dữ liệu nhạy cảm không cần thiết (số CCCD), chạy thử kiểm chứng rồi mới sử dụng, và tuyệt đối không nhập dữ liệu cá nhân thật vào AI (4.2.NC1a).'
              }
            ]
          }
        ]
      },
      {
        id: 'tin12-mod-4',
        courseId: 'TIN12-B12',
        order: 4,
        title: 'BÀI 12 – TIẾT 2: THỰC HÀNH TẠO BIỂU MẪU & KIỂM DUYỆT MÃ AI (HOẠT ĐỘNG 3.2)',
        description: 'Thực hành viết mã HTML trên máy (nv1_monan.html, nv2_dangkithi.html) và kiểm duyệt mã do AI gợi ý theo Bảng kiểm 5 tiêu chí + Phiếu nhật kí sử dụng AI.',
        learningObjectives: '• Tự viết được mã HTML tạo biểu mẫu Món ăn (Hình 12.2) và Đăng kí môn thi tốt nghiệp (Hình 12.3 có fieldset, legend, date, number, radio, checkbox, select).\n• Phát hiện và sửa đủ 5 lỗi trong đoạn mã AI mẫu theo Bảng kiểm 5 tiêu chí; ghi Phiếu nhật kí sử dụng AI trung thực.',
        ownerName: 'Phan Phi Phú',
        activities: [
          {
            id: 'tin12-act-4-1',
            moduleId: 'tin12-mod-4',
            title: 'Nhiệm vụ 1 & 2: Tạo nv1_monan.html (Hình 12.2) và nv2_dangkithi.html (Hình 12.3)',
            type: 'assignment',
            durationMinutes: 22,
            isCompleted: false,
            isRequired: true,
            maxScore: 10,
            programmingLanguage: 'Web HTML/CSS',
            description: 'Thực hành viết mã HTML chuẩn theo SGK Tin học 12 KNTT tr.69–70 và nộp tệp (.html / .zip) hoặc dán mã nguồn trực tiếp.',
            assignmentPrompt: 'HOẠT ĐỘNG 3.2 – THỰC HÀNH TẠO BIỂU MẪU (CẶP ĐÔI / CÁ NHÂN)\n\n• Nhiệm vụ 1 (nv1_monan.html – Hình 12.2 SGK tr.69): Tạo biểu mẫu gồm 1 ô nhập văn bản “Món ăn ưa thích” (<label for="monAn"> khớp id="monAn", có name="monAn") và nút gửi “Gửi” (<input type="submit" value="Gửi">).\n\n• Nhiệm vụ 2 (nv2_dangkithi.html – Hình 12.3 SGK tr.70): Tạo biểu mẫu “Đăng kí môn thi tốt nghiệp” gồm:\n  1. Khung <fieldset> với tiêu đề <legend>Thông tin thí sinh</legend>: Họ tên (text), Số CCCD (text – lưu ý: chỉ là khung mẫu thi tốt nghiệp, KHÔNG gõ số CCCD thật khi chụp ảnh nộp!), Ngày sinh (type="date"), Giới tính Nam/Nữ (radio cùng name="gioiTinh", có value).\n  2. Khung <fieldset> với <legend>Đăng kí môn thi</legend>: Môn thi bắt buộc (Toán, Ngữ văn – checkbox có name & value), Tổ hợp tự chọn (select/option: KHTN / KHXH), Điểm trung bình lớp 12 (type="number" step="0.1" min="0" max="10").\n  3. Nút “Đăng kí” (type="submit").\n\nTIÊU CHÍ CHẤM ĐIỂM (THANG 10Đ – RUBRIC KHBD):\n- Cấu trúc biểu mẫu (2,0đ): Đủ thẻ <form>, <fieldset>, <legend>, không lỗi mở/đóng thẻ.\n- Phần tử và kiểu nhập (3,0đ): Dùng đúng text, date, number, radio, checkbox, select, submit.\n- Thuộc tính nhãn, id, name (2,0đ): Đủ label–for khớp id, radio cùng name, có name & value.\n- Chạy thử và kết quả (2,0đ): Hiển thị đúng, chọn được 1 radio, chọn được nhiều checkbox.\n- An toàn & ghi nhận AI (1,0đ): Không dùng dữ liệu cá nhân thật; nếu có dùng AI phải kiểm duyệt rõ ràng.',
            starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Đăng kí môn thi tốt nghiệp</title>
</head>
<body>
  <h2>ĐĂNG KÍ MÔN THI TỐT NGHIỆP</h2>
  <form action="#" method="POST">
    <fieldset>
      <legend>Thông tin thí sinh</legend>
      <label for="hoTen">Họ và tên:</label>
      <input type="text" id="hoTen" name="hoTen" required><br><br>

      <label for="ngaySinh">Ngày sinh:</label>
      <input type="date" id="ngaySinh" name="ngaySinh"><br><br>

      Giới tính:
      <input type="radio" id="nam" name="gioiTinh" value="Nam">
      <label for="nam">Nam</label>
      <input type="radio" id="nu" name="gioiTinh" value="Nu">
      <label for="nu">Nữ</label>
    </fieldset>
    <br>
    <!-- Hoàn thiện tiếp fieldset Đăng kí môn thi & nút submit tại đây -->
    <input type="submit" value="Đăng kí">
  </form>
</body>
</html>`
          },
          {
            id: 'tin12-act-4-2',
            moduleId: 'tin12-mod-4',
            title: 'Nhiệm vụ 3: Kiểm duyệt mã AI gợi ý (5 lỗi) & Phiếu nhật kí sử dụng AI',
            type: 'assignment',
            durationMinutes: 15,
            isCompleted: false,
            isRequired: true,
            maxScore: 10,
            programmingLanguage: 'Web HTML/CSS',
            description: 'Kiểm tra đoạn mã biểu mẫu do AI tạo ra theo Bảng kiểm 5 tiêu chí (KHBD tr.21), sửa đủ 5 lỗi và hoàn thành Phiếu nhật kí sử dụng AI (KHBD tr.22).',
            assignmentPrompt: 'NHIỆM VỤ 3 – KIỂM DUYỆT MÃ DO AI GỢI Ý (KHBD BÀI 12 TR.21–22)\n\nYêu cầu 1: Đọc kỹ đoạn mã mẫu ở khung “Mã nguồn mẫu” bên dưới (chứa 5 lỗi điển hình khi AI sinh mã), đối chiếu BẢNG KIỂM 5 TIÊU CHÍ sau, liệt kê đủ 5 lỗi và nộp lại đoạn mã đã sửa hoàn chỉnh:\n  [1] Có đúng cặp thẻ <form> và nút gửi hợp lệ (type="submit")?\n  [2] Kiểu nhập (type) của từng ô có đúng yêu cầu không (đặc biệt Ngày sinh)?\n  [3] Mỗi ô radio cùng nhóm có cùng thuộc tính name không?\n  [4] Mỗi <label> có thuộc tính for khớp với id của ô nhập, và mỗi ô có thuộc tính name không?\n  [5] Có thu thập thừa dữ liệu nhạy cảm không? Có chạy thử kiểm chứng trên trình duyệt chưa?\n\nYêu cầu 2: Ghi ngắn gọn PHIẾU NHẬT KÍ SỬ DỤNG AI (6 mục):\n  1. Nhiệm vụ thực hiện:\n  2. Công cụ AI đã dùng (nếu có):\n  3. Câu lệnh (prompt) đã dùng:\n  4. Điểm AI làm tốt:\n  5. Lỗi/thiếu sót em phát hiện được:\n  6. Em đã tự sửa cụ thể những gì & cam kết không nhập dữ liệu cá nhân thật:',
            starterCode: `<!-- ĐOẠN MÃ MẪU DO AI TẠO (CHỨA 5 LỖI CẦN KIỂM DUYỆT & SỬA) -->
<form action="/submit">
  <fieldset>
    <legend>Thông tin thí sinh</legend>
    <label for="cccd">Số CCCD:</label>
    <input type="text" id="so_cccd" name="cccd"><br>

    <label for="ns">Ngày sinh:</label>
    <input type="text" id="ns" name="ngay_sinh"><br>

    Giới tính:
    <input type="radio" id="nam" name="gt1" value="Nam">
    <label for="nam">Nam</label>
    <input type="radio" id="nu" name="gt2" value="Nu">
    <label for="nu">Nữ</label><br>

    Môn thi:
    <input type="checkbox" id="toan" value="Toan">
    <label for="toan">Toán</label>
    <input type="checkbox" id="van" name="mon_thi" value="Van">
    <label for="van">Ngữ văn</label><br>

    <input type="button" value="Đăng kí">
  </fieldset>
</form>`
          }
        ]
      },
      {
        id: 'tin12-mod-5',
        courseId: 'TIN12-B12',
        order: 5,
        title: 'BÀI 12 – VẬN DỤNG: BIỂU MẪU ĐĂNG KÍ CLB & NHÚNG IFRAME (HOẠT ĐỘNG 4)',
        description: 'Vận dụng (SGK tr.70): Thiết kế biểu mẫu dangki_clb.html cho CLB trường học và nhúng trực tiếp vào trang web Bài 11 bằng thẻ <a> target và <iframe>.',
        learningObjectives: '• Thiết kế được biểu mẫu dangki_clb.html có ít nhất 6 trường đa dạng (text, radio, checkbox, select/textarea, fieldset, legend), bảo vệ quyền riêng tư (không hỏi thừa CCCD/mật khẩu).\n• Tích hợp biểu mẫu vào trang web giới thiệu CLB (Bài 11) bằng liên kết target và khung nội tuyến <iframe> (3.1.NC1a).',
        ownerName: 'Phan Phi Phú',
        activities: [
          {
            id: 'tin12-act-5-1',
            moduleId: 'tin12-mod-5',
            title: 'Vận dụng (SGK tr.70): Tạo dangki_clb.html & Nhúng bằng <iframe> vào trang Bài 11',
            type: 'assignment',
            durationMinutes: 30,
            isCompleted: false,
            isRequired: true,
            maxScore: 10,
            programmingLanguage: 'Web HTML/CSS',
            description: 'Nộp sản phẩm vận dụng gồm tệp dangki_clb.html và tệp trang chủ CLB (Bài 11 đã thêm liên kết target + khung <iframe>), kèm Phiếu nhật kí AI nếu có dùng AI.',
            assignmentPrompt: 'HOẠT ĐỘNG 4 – VẬN DỤNG (SGK TIN HỌC 12 KNTT TR.70)\n\nNhiệm vụ:\n1. Tạo tệp dangki_clb.html (Biểu mẫu đăng kí thành viên CLB của trường) bảo đảm:\n   • Có tối thiểu 6 trường dữ liệu đa dạng: text (Họ tên, Lớp), radio (Khối hoặc Vai trò dự kiến – cùng name, có value), checkbox (Kĩ năng/Sở thích – được chọn nhiều), select (CLB muốn tham gia), textarea (Lí do tham gia/Nguyện vọng), nút submit.\n   • Sử dụng <fieldset> và <legend> chia nhóm hợp lí; mọi <label for> khớp id.\n   • Đạo đức & quyền riêng tư: CHỈ hỏi thông tin cần thiết cho việc đăng kí CLB — KHÔNG yêu cầu số CCCD, mật khẩu hay ảnh giấy tờ tùy thân.\n\n2. Mở lại trang web giới thiệu CLB đã tạo ở Bài 11, thêm liên kết “Đăng kí” và khung nội tuyến <iframe> sao cho khi nháy vào liên kết “Đăng kí”, biểu mẫu dangki_clb.html hiển thị ngay trong khung iframe.\n\n3. Nén 2 tệp HTML thành .zip (hoặc nộp tệp dangki_clb.html / dán mã trực tiếp kèm Phiếu nhật kí sử dụng AI nếu có sử dụng).',
            starterCode: `<!-- Gợi ý nhúng biểu mẫu dangki_clb.html vào trang Bài 11 bằng <iframe> -->
<nav>
  <a href="dangki_clb.html" target="khungDangKi">📝 Mở biểu mẫu Đăng kí CLB</a>
</nav>

<iframe
  name="khungDangKi"
  src="dangki_clb.html"
  width="640"
  height="480"
  title="Biểu mẫu đăng kí thành viên CLB"
  style="border: 1px solid #cbd5e1; border-radius: 12px;"
></iframe>`
          }
        ]
      }
    ],
    enrolledStudents: [],
    enrolledStudentsCount: 0,
    files: [
      {
        id: 'file-tin12-a23-html',
        name: 'Phong_Thi_Nghiem_Bieu_Mau_A23.html',
        filename: 'a23-phong-thi-nghiem-bieu-mau.html',
        url: '/a23-phong-thi-nghiem-bieu-mau.html',
        size: '84 KB',
        mimetype: 'text/html',
        fileType: 'code',
        folder: 'Bài 2 - Hoạt động 2.2 (A2.3)',
        moduleId: 'tin12-mod-2',
        description: 'Học liệu tương tác HTML5 độc lập có đồng hồ đếm ngược 20 phút & font tiếng Việt chuẩn (chạy trực tiếp hoặc tải về chạy offline) — Bài A2.3 Phòng thí nghiệm Biểu mẫu.',
        uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
        uploadedAt: '27/11/2026'
      }
    ],
    announcements: [
      {
        id: 'anc-tin12-welcome',
        title: 'Hướng dẫn học tập Bài 12: Tạo biểu mẫu & Học liệu tương tác A2.3',
        content: 'Chào mừng các em đến với học phần Tin học 12 KNTT – Bài 12: Tạo biểu mẫu.\n• Sau Tiết 1 trên lớp, các em vào Mô-đun 2 mở “🔬 Phòng thí nghiệm Biểu mẫu A2.3: Đoán – Chạy – Giải thích” (đồng hồ đếm ngược chuẩn 20 phút, tùy chỉnh 10–30 phút, có tải chạy offline) rồi nộp Phiếu kết quả .txt.\n• Các đề trắc nghiệm đều có bộ đếm ngược thời gian, phương án nhiễu sát thực tế và phản hồi sư phạm riêng cho từng lựa chọn sau khi nộp bài.\n• Lưu ý an toàn thông tin: Học liệu A2.3 không thu thập dữ liệu cá nhân; trong suốt Bài 12 các em không nhập số CCCD hay mật khẩu thật vào AI hoặc biểu mẫu mẫu.',
        author: 'Phan Phi Phú',
        createdAt: '27/11/2026',
        isImportant: true
      }
    ],
    certificateEligible: true
  };
}

const TIN12_CONTENT_REVISION = 'v3-clean-ui';

function applyTin12RevisionV2(existingCourse, freshCourse) {
  const freshActs = new Map();
  (freshCourse.modules || []).forEach(m => (m.activities || []).forEach(a => freshActs.set(a.id, a)));
  let changed = false;
  existingCourse.modules = (existingCourse.modules || []).map(m => ({
    ...m,
    activities: (m.activities || []).map(a => {
      if ((a.id === 'tin12-act-2-1' || a.id === 'tin12-act-2-2' || a.id === 'tin12-act-3-1') && freshActs.has(a.id)) {
        changed = true;
        return freshActs.get(a.id);
      }
      return a;
    })
  }));
  if (Array.isArray(freshCourse.announcements) && freshCourse.announcements.length > 0) {
    existingCourse.announcements = freshCourse.announcements;
    changed = true;
  }
  return changed;
}

async function ensureTin12B12Course() {
  const tin12 = buildTin12B12Course();
  if (isMongoConnected) {
    try {
      const flagDoc = await SettingModel.findOne({ key: 'seededTin12B12' }).lean();
      const existing = await CourseModel.findOne({ $or: [{ id: 'TIN12-B12' }, { code: 'TIN12-B12' }] });
      if (existing) {
        const curRev = flagDoc?.value?.revision || '';
        if (curRev !== TIN12_CONTENT_REVISION) {
          applyTin12RevisionV2(existing, tin12);
          existing.markModified('modules');
          existing.markModified('announcements');
          await existing.save();
          await SettingModel.findOneAndUpdate(
            { key: 'seededTin12B12' },
            { $set: { value: { seeded: true, revision: TIN12_CONTENT_REVISION }, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
        }
        return existing.toObject();
      }
      if (flagDoc?.value?.seeded) return null;
      const created = await CourseModel.create(tin12);
      await SettingModel.findOneAndUpdate(
        { key: 'seededTin12B12' },
        { $set: { value: { seeded: true, revision: TIN12_CONTENT_REVISION }, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      return created.toObject();
    } catch (e) {
      console.warn('Thông báo seed TIN12-B12 Mongo:', e.message);
      return null;
    }
  } else {
    const db = readDb();
    db.courses = db.courses || [];
    db.settings = db.settings || {};
    const existing = db.courses.find(c => c.id === 'TIN12-B12' || c.code === 'TIN12-B12');
    if (existing) {
      if (db.settings.tin12Revision !== TIN12_CONTENT_REVISION) {
        applyTin12RevisionV2(existing, tin12);
        db.settings.seededTin12B12 = true;
        db.settings.tin12Revision = TIN12_CONTENT_REVISION;
        writeDb(db);
      }
      return existing;
    }
    if (db.settings.seededTin12B12) return null;
    db.courses.push(tin12);
    db.settings.seededTin12B12 = true;
    db.settings.tin12Revision = TIN12_CONTENT_REVISION;
    writeDb(db);
    return tin12;
  }
}

app.get('/api/courses', async (req, res) => {
  await ensureDefaultCourse();
  await ensureAi6Bai12Content();
  await ensureTin12B12Course();
  let list = isMongoConnected
    ? (await CourseModel.find()).map(c => c.toObject())
    : (readDb().courses || []);

  if (!list || list.length === 0 || !list.some(c => c.code === '6AIAB01' || c.id === '6AIAB01')) {
    const seeded = await ensureDefaultCourse();
    await ensureAi6Bai12Content();
    if (!list || list.length === 0) {
      list = [seeded];
    } else if (!list.some(c => c.code === '6AIAB01' || c.id === '6AIAB01')) {
      list.unshift(seeded);
    }
  }

  const records = req.user ? await listProgressForUser(req.user) : [];
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

// 5. Courses: Create new Course
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
    learningObjectives: req.body.learningObjectives || '',
    ownerName: req.body.ownerName || '',
    isHidden: Boolean(req.body.isHidden),
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

// 5.6 Activities: Add Activity
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

// 5.9 Courses: Đăng ký khóa học
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
  const visibleActs = (course.modules || [])
    .filter(m => !m.isHidden)
    .flatMap(m => (m.activities || []).filter(a => !a.isHidden));
  const ids = new Set(visibleActs.map(a => a.id));
  const records = await listProgress({ courseId: course.id, userId });
  const completed = records.filter(p => p.isCompleted && ids.has(p.activityId)).length;
  return ids.size > 0 ? Math.round((completed / ids.size) * 100) : 0;
}

async function maybeIssueCertificate(course, user) {
  if (!course || !user || isStaff(user) || course.certificateEligible === false) return null;
  const visibleActs = (course.modules || [])
    .filter(m => !m.isHidden)
    .flatMap(m => (m.activities || []).filter(a => !a.isHidden));
  if (visibleActs.length === 0) return null;

  const records = await listProgressForUser(user, course.id);
  const byAct = new Map();
  records.forEach(p => {
    const ex = byAct.get(p.activityId);
    if (!ex || (p.updatedAt || '') > (ex.updatedAt || '')) byAct.set(p.activityId, p);
  });
  const doneCount = visibleActs.filter(a => byAct.get(a.id)?.isCompleted).length;
  if (doneCount < visibleActs.length) return null;

  const scores = [...byAct.values()]
    .map(p => p.score)
    .filter(s => s !== null && s !== undefined && Number.isFinite(Number(s)))
    .map(Number);
  const avg = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 10;
  const gradeClassification = avg >= 8.5 ? 'Xuất sắc' : avg >= 7.5 ? 'Giỏi' : avg >= 6.0 ? 'Khá' : 'Đạt';

  const existingCert = isMongoConnected
    ? await CertModel.findOne({ courseId: course.id, studentId: user.id }).lean()
    : (readDb().certificates || []).find(c => c.courseId === course.id && c.studentId === user.id);

  const studentClass = user.className || user.classOrPosition || '';
  const studentSchool = user.school || '';

  if (existingCert) {
    const syncedPatch = {
      studentName: user.name || existingCert.studentName || 'Học viên',
      studentClass: studentClass || existingCert.studentClass || '',
      studentSchool: studentSchool || existingCert.studentSchool || ''
    };
    if (
      syncedPatch.studentName !== existingCert.studentName ||
      syncedPatch.studentClass !== (existingCert.studentClass || '') ||
      syncedPatch.studentSchool !== (existingCert.studentSchool || '')
    ) {
      if (isMongoConnected) {
        await CertModel.updateOne({ id: existingCert.id }, { $set: syncedPatch });
      } else {
        const db = readDb();
        const found = (db.certificates || []).find(c => c.id === existingCert.id);
        if (found) {
          Object.assign(found, syncedPatch);
          writeDb(db);
        }
      }
      return { ...existingCert, ...syncedPatch };
    }
    return existingCert;
  }

  const certNumber = `LMS2-${course.code || 'CERT'}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const cert = {
    id: `cert-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    certificateNumber: certNumber,
    courseId: course.id,
    courseName: course.name,
    studentId: user.id,
    studentName: user.name || 'Học viên',
    studentCode: user.code || (user.email ? user.email.split('@')[0].toUpperCase() : 'HV'),
    studentClass,
    studentSchool,
    issueDate: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    scoreAverage: avg,
    gradeClassification,
    qrVerificationUrl: `/api/certificates/verify/${certNumber}`,
    signatureName: course.instructor?.name || 'Phan Phi Phú',
    signatureTitle: 'Giáo viên phụ trách'
  };

  if (isMongoConnected) {
    await CertModel.create(cert);
  } else {
    const db = readDb();
    db.certificates = [cert, ...(db.certificates || [])];
    writeDb(db);
  }
  return cert;
}

function isPastDeadline(activity) {
  if (!activity?.dueDateIso) return false;
  const ts = Date.parse(activity.dueDateIso);
  return Number.isFinite(ts) && Date.now() > ts;
}

// 6. Activities: Mark Completed
app.post('/api/courses/:id/activities/:actId/complete', requireAuth, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;
  const existing = await getOneProgress(ctx.course.id, req.user.id, ctx.activity.id);
  const now = nowVN();
  if (ctx.activity.type === 'quiz') {
    return res.status(400).json({ message: 'Bài trắc nghiệm chỉ được tính hoàn thành khi nộp bài và đạt điểm sàn.' });
  }
  if (Array.isArray(ctx.activity.quizQuestions) && ctx.activity.quizQuestions.length > 0 && !isStaff(req.user)) {
    return res.status(400).json({ message: `Em cần làm bài trắc nghiệm trong học liệu và đạt từ ${Number(ctx.activity.passScore) || 8}/10 điểm để hoàn thành.` });
  }
  if (ctx.activity.type === 'video' && !isStaff(req.user)) {
    const cps = Array.isArray(ctx.activity.videoCheckpoints) ? ctx.activity.videoCheckpoints : [];
    const prevVp = existing?.videoProgress || {};
    const passed = cps.filter(cp => {
      const r = prevVp.checkpointResults?.[cp.id];
      if (!r) return false;
      return cp.requireCorrect !== false ? !!r.isCorrect : true;
    }).length;
    if (cps.length > 0 && passed < cps.length) {
      return res.status(400).json({ message: `Bạn cần vượt qua đủ ${cps.length} neo chặn trong video trước khi hoàn thành (hiện tại ${passed}/${cps.length}).` });
    }
    if (ctx.activity.preventVideoSkip && (prevVp.progressPercent || 0) < 80) {
      return res.status(400).json({ message: 'Giáo viên đã bật chống tua nhanh — bạn cần xem ít nhất 80% thời lượng video để hoàn thành.' });
    }
  }
  {
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
  const cert = await maybeIssueCertificate(ctx.course, req.user);
  res.json({ success: true, progress: await courseProgressOf(ctx.course, req.user.id), certificateIssued: !!cert });
});

// 6.05 Activities: Telemetry Tracking
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

// 6.1 Activities: Track Video Progress
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

  const checkpoints = Array.isArray(ctx.activity.videoCheckpoints) ? ctx.activity.videoCheckpoints : [];
  const rawCpResults = (req.body.checkpointResults && typeof req.body.checkpointResults === 'object') ? req.body.checkpointResults : {};
  const incomingCpResults = {};
  for (const cp of checkpoints) {
    const r = rawCpResults[cp.id];
    if (!r || typeof r !== 'object') continue;
    const selected = Number.isInteger(r.selectedAnswer) ? r.selectedAnswer : -1;
    const prev = prevVp.checkpointResults?.[cp.id];
    incomingCpResults[cp.id] = {
      ...r,
      selectedAnswer: selected,
      isCorrect: selected === cp.correctAnswer || !!prev?.isCorrect,
      attempts: Math.max(Number(r.attempts) || 1, prev?.attempts || 0)
    };
  }
  const mergedCpResults = { ...(prevVp.checkpointResults || {}), ...incomingCpResults };
  const checkpointsTotal = checkpoints.length;
  const checkpointsPassed = checkpoints.filter(cp => {
    const r = mergedCpResults[cp.id];
    if (!r) return false;
    return cp.requireCorrect !== false ? !!r.isCorrect : true;
  }).length;

  const maxWatchedSeconds = Math.max(prevVp.watchedSeconds || 0, currentPos);
  const maxProgressPercent = Math.min(100, Math.max(prevVp.progressPercent || 0, incomingPercent));
  const allCheckpointsCleared = checkpointsTotal === 0 || checkpointsPassed >= checkpointsTotal;
  const isCompleted = allCheckpointsCleared && (!!existing?.isCompleted || maxProgressPercent >= 80);
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
  } else if (existing?.isCompleted && checkpointsTotal > 0) {
    patch.isCompleted = false;
    patch.completedAt = '';
  }

  await saveProgress(ctx.course.id, req.user.id, ctx.activity.id, patch, req.user.email);
  const cert = isCompleted ? await maybeIssueCertificate(ctx.course, req.user) : null;
  res.json({
    success: true,
    isCompleted,
    videoProgress,
    overallCourseProgress: await courseProgressOf(ctx.course, req.user.id),
    certificateIssued: !!cert
  });
});

// 7. Activities: Submit Assignment
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

  const prevHistory = Array.isArray(existing?.submissionHistory) ? [...existing.submissionHistory] : [];
  if (existing?.submission) {
    prevHistory.push({
      ...existing.submission,
      version: existing.submission.version || prevHistory.length + 1,
      previousScore: existing.score ?? existing.submission.grade ?? null,
      archivedAt: now
    });
  }
  const submissionHistory = prevHistory.slice(-10);

  const subData = {
    status: 'submitted',
    version: submissionHistory.length + 1,
    fileName,
    fileSize: String(req.body.fileSize || '').slice(0, 30),
    fileUrl: String(req.body.fileUrl || '').slice(0, 500),
    submittedAt: now,
    isLate: isPastDeadline(ctx.activity),
    textSubmission,
    previousGrade: existing?.submission?.grade ?? existing?.score ?? null,
    previousFeedback: existing?.submission?.feedback || ''
  };
  await saveProgress(ctx.course.id, req.user.id, ctx.activity.id, {
    isCompleted: true,
    completedAt: existing?.completedAt || now,
    submission: subData,
    submissionHistory,
    score: existing?.score ?? null,
    viewCount: Math.max(1, existing?.viewCount || 0),
    firstAccessedAt: existing?.firstAccessedAt || now,
    lastAccessedAt: now,
    lastAction: submissionHistory.length > 0 ? `Nộp lại bài tập (lần ${subData.version})` : (subData.isLate ? 'Nộp bài tập (trễ hạn)' : 'Đã nộp bài tập')
  }, req.user.email);
  const cert = await maybeIssueCertificate(ctx.course, req.user);
  res.json({ success: true, submission: subData, submissionHistory, certificateIssued: !!cert });
});

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

  const rosterMap = new Map();
  const addToRoster = (entry) => {
    const normEmail = String(entry.email || '').toLowerCase().trim();
    const realUser = userById.get(entry.id) || (normEmail ? userByEmail.get(normEmail) : null);
    if (realUser && isStaff(realUser)) return;
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

// 7.1 Giáo viên xem bài nộp / kết quả / tiến độ của TỪNG học sinh
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
      submissionHistory: p?.submissionHistory || [],
      quizResult: p?.quizResult || null,
      quizHistory: p?.quizHistory || (p?.quizResult ? [p.quizResult] : []),
      videoProgress: p?.videoProgress || null,
      timeSpentSeconds: p?.timeSpentSeconds || 0,
      viewCount: p?.viewCount || 0,
      lastAccessedAt: p?.lastAccessedAt || ''
    };
  }));
});

// 8. Activities: Grade Assignment
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

// 9. Activities: Submit Quiz
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
  const prevHistory = Array.isArray(existing?.quizHistory) && existing.quizHistory.length > 0
    ? [...existing.quizHistory]
    : (existing?.quizResult ? [{ ...existing.quizResult, attempt: existing.quizResult.attempt || existing.quizResult.attemptCount || 1 }] : []);

  const maxAttempts = Number(ctx.activity.maxAttempts) || 0;
  if (maxAttempts > 0 && !isStaff(req.user) && prevHistory.length >= maxAttempts) {
    return res.status(400).json({ message: `Bạn đã dùng hết ${maxAttempts}/${maxAttempts} lượt làm bài kiểm tra này.` });
  }

  const attemptCount = Math.max(prevHistory.length, existing?.quizResult?.attemptCount || 0) + 1;
  const bestScore = existing?.score !== undefined && existing?.score !== null ? Math.max(existing.score, score) : score;
  const late = isPastDeadline(ctx.activity);
  const quizResult = {
    attempt: attemptCount,
    score,
    bestScore,
    maxScore,
    passed,
    isLate: late,
    submittedAt: now,
    answers,
    correctCount,
    totalQuestions: questions.length,
    attemptCount,
    durationSeconds
  };
  const quizHistory = [...prevHistory, quizResult].slice(-20);
  const isCompleted = !!existing?.isCompleted || passed;

  await saveProgress(ctx.course.id, req.user.id, ctx.activity.id, {
    isCompleted,
    completedAt: isCompleted ? (existing?.completedAt || now) : '',
    score: bestScore,
    maxScore,
    quizResult,
    quizHistory,
    viewCount: Math.max(1, existing?.viewCount || 0),
    timeSpentSeconds: (existing?.timeSpentSeconds || 0) + durationSeconds,
    firstAccessedAt: existing?.firstAccessedAt || now,
    lastAccessedAt: now,
    lastAction: `Nộp trắc nghiệm lần ${attemptCount} (${score}/10)${late ? ' • Trễ hạn' : ''}`
  }, req.user.email);
  const cert = isCompleted ? await maybeIssueCertificate(ctx.course, req.user) : null;
  res.json({ success: true, passed, score, bestScore, result: quizResult, quizHistory, questions, certificateIssued: !!cert });
});

// 9.01 Sổ điểm & Bảng theo dõi tiến độ toàn diện của cả lớp
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
    quizQuestions: a.quizQuestions || []
  }));

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
      const questionsForRow = (isStaff(req.user) || p?.quizResult) ? act.quizQuestions : [];

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
        submissionHistory: p?.submissionHistory || [],
        quizResult: p?.quizResult || null,
        quizHistory: p?.quizHistory || (p?.quizResult ? [p.quizResult] : []),
        quizQuestions: questionsForRow,
        timeSpentSeconds,
        viewCount,
        lastAccessedAt: p?.lastAccessedAt || '',
        lastAction: p?.lastAction || ''
      };
    });

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
      if (hasQuizPart(act) && ap.quizResult?.answers) {
        submittedCount++;
        (act.quizQuestions || []).forEach(q => {
          qAttemptMap.set(q.id, (qAttemptMap.get(q.id) || 0) + 1);
          if (ap.quizResult.answers[q.id] === q.correctAnswer) {
            qCorrectMap.set(q.id, (qCorrectMap.get(q.id) || 0) + 1);
          }
        });
      }
    });

    const questionStats = hasQuizPart(act) && isStaff(req.user)
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

// 9.02 Giáo viên ghi danh học viên mới vào lớp
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

// 9.025 Giáo viên ghi danh hàng loạt học sinh
app.post('/api/courses/:id/enroll-bulk', requireStaff, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
  const list = Array.isArray(req.body?.students) ? req.body.students : [];
  if (list.length === 0) return res.status(400).json({ message: 'Danh sách học sinh đang trống.' });

  const existingEmails = new Set((course.enrolledStudents || []).map(s => String(s.email || '').toLowerCase().trim()).filter(Boolean));
  const incomingEmails = list.map(s => String(s.email || '').toLowerCase().trim()).filter(Boolean);
  const matchedUsers = await findUsersByEmails(incomingEmails);
  const userByEmail = new Map(matchedUsers.map(u => [String(u.email || '').toLowerCase().trim(), u]));

  const toAdd = [];
  let skippedCount = 0;
  for (let i = 0; i < list.length; i++) {
    const raw = list[i];
    const email = String(raw.email || '').toLowerCase().trim();
    const name = String(raw.name || email.split('@')[0] || '').trim();
    if (!email || !email.includes('@') || existingEmails.has(email)) {
      skippedCount++;
      continue;
    }
    existingEmails.add(email);
    const mu = userByEmail.get(email);
    toAdd.push({
      id: mu?.id || `student-${Date.now()}-${i}`,
      name: mu?.name || name || 'Học sinh',
      email,
      className: mu?.className || String(raw.className || 'Lớp 6A').trim(),
      code: mu?.code || String(raw.code || '').trim() || `HS${Math.floor(100 + Math.random() * 900)}`,
      school: mu?.school || 'THCS',
      avatar: mu?.avatar || '',
      enrolledAt: nowVN(),
      status: 'Đang học'
    });
  }

  if (toAdd.length > 0) {
    if (isMongoConnected) {
      await CourseModel.updateOne(
        { $or: [{ id: course.id }, { code: course.id }] },
        { $push: { enrolledStudents: { $each: toAdd } }, $inc: { enrolledStudentsCount: toAdd.length } }
      );
      const matchedIds = toAdd.filter(s => userByEmail.has(s.email)).map(s => s.id);
      if (matchedIds.length > 0) {
        await UserModel.updateMany({ id: { $in: matchedIds } }, { $addToSet: { enrolledCourses: course.id } });
      }
    } else {
      const db = readDb();
      const c = db.courses?.find(x => x.id === course.id || x.code === course.id);
      if (c) {
        c.enrolledStudents = [...(c.enrolledStudents || []), ...toAdd];
        c.enrolledStudentsCount = c.enrolledStudents.length;
      }
      writeDb(db);
    }
  }

  res.json({ success: true, addedCount: toAdd.length, skippedCount, students: toAdd });
});

// 9.026 Sắp xếp lại thứ tự mô-đun & hoạt động
app.put('/api/courses/:id/reorder-modules', requireStaff, async (req, res) => {
  const orderIds = Array.isArray(req.body?.moduleIds) ? req.body.moduleIds : [];
  if (orderIds.length === 0) return res.status(400).json({ message: 'Thiếu danh sách thứ tự mô-đun.' });
  const reorder = (mods) => {
    const map = new Map((mods || []).map(m => [m.id, m]));
    const ordered = [];
    orderIds.forEach(mid => { if (map.has(mid)) { ordered.push(map.get(mid)); map.delete(mid); } });
    map.forEach(m => ordered.push(m));
    return ordered.map((m, idx) => ({ ...m, order: idx + 1 }));
  };
  if (isMongoConnected) {
    const doc = await getCourseDoc(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
    doc.modules = reorder(doc.modules);
    doc.markModified('modules');
    await doc.save();
    return res.json({ success: true });
  }
  const db = readDb();
  const c = (db.courses || []).find(x => x.id === req.params.id || x.code === req.params.id);
  if (!c) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
  c.modules = reorder(c.modules);
  writeDb(db);
  res.json({ success: true });
});

app.put('/api/courses/:id/modules/:modId/reorder-activities', requireStaff, async (req, res) => {
  const orderIds = Array.isArray(req.body?.activityIds) ? req.body.activityIds : [];
  if (orderIds.length === 0) return res.status(400).json({ message: 'Thiếu danh sách thứ tự hoạt động.' });
  const reorder = (acts) => {
    const map = new Map((acts || []).map(a => [a.id, a]));
    const ordered = [];
    orderIds.forEach(aid => { if (map.has(aid)) { ordered.push(map.get(aid)); map.delete(aid); } });
    map.forEach(a => ordered.push(a));
    return ordered;
  };
  if (isMongoConnected) {
    const doc = await getCourseDoc(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
    const mod = (doc.modules || []).find(m => m.id === req.params.modId);
    if (!mod) return res.status(404).json({ message: 'Không tìm thấy mô-đun.' });
    mod.activities = reorder(mod.activities);
    doc.markModified('modules');
    await doc.save();
    return res.json({ success: true });
  }
  const db = readDb();
  const c = (db.courses || []).find(x => x.id === req.params.id || x.code === req.params.id);
  const mod = c?.modules?.find(m => m.id === req.params.modId);
  if (!mod) return res.status(404).json({ message: 'Không tìm thấy mô-đun.' });
  mod.activities = reorder(mod.activities);
  writeDb(db);
  res.json({ success: true });
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

// 9.035 Nhập gói học liệu / mô-đun từ file JSON
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

  const normalizeActivity = (a, modId, idx) => {
    const clean = { ...(a || {}) };
    for (const k of STUDENT_STATE_FIELDS) delete clean[k];
    if (Array.isArray(clean.quizQuestions)) {
      clean.quizQuestions = clean.quizQuestions.map((q, qi) => ({ ...q, id: q.id || `q-${Date.now()}-${idx}-${qi}` }));
    }
    if (Array.isArray(clean.videoCheckpoints)) {
      clean.videoCheckpoints = clean.videoCheckpoints.map((cp, ci) => ({ ...cp, id: cp.id || `cp-${Date.now()}-${idx}-${ci}` }));
    }
    return {
      ...clean,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 10000)}-${idx}`,
      moduleId: modId,
      isCompleted: false
    };
  };

  if (isMongoConnected) {
    const doc = await getCourseDoc(course.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
    doc.modules = doc.modules || [];

    if (targetModuleId) {
      const targetMod = doc.modules.find(m => m.id === targetModuleId);
      if (!targetMod) {
        return res.status(404).json({ message: 'Không tìm thấy mô-đun đích để nhập học liệu.' });
      }
      targetMod.activities = targetMod.activities || [];
      incomingModules.forEach(im => {
        (im.activities || []).forEach((a, idx) => {
          targetMod.activities.push(normalizeActivity(a, targetMod.id, idx));
          addedActivities++;
        });
      });
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
          learningObjectives: im.learningObjectives || '',
          ownerName: im.ownerName || '',
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
      if (!targetMod) {
        return res.status(404).json({ message: 'Không tìm thấy mô-đun đích để nhập học liệu.' });
      }
      targetMod.activities = targetMod.activities || [];
      incomingModules.forEach(im => {
        (im.activities || []).forEach((a, idx) => {
          targetMod.activities.push(normalizeActivity(a, targetMod.id, idx));
          addedActivities++;
        });
      });
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
          learningObjectives: im.learningObjectives || '',
          ownerName: im.ownerName || '',
          activities: acts
        });
      });
    }
    c.totalActivities = c.modules.reduce((s, m) => s + (m.activities || []).length, 0);
    writeDb(db);
    return res.json({ success: true, addedModules, addedActivities, course: await viewCourseFor(c, req.user) });
  }
});

// 9.04 API Bảng điểm cá nhân
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

// 9.1 Thông báo lớp học
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

// 9.2 Diễn đàn
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

// ====================== 9.3 TẬP TIN HỌC LIỆU & TẢI TỆP TÙY Ý ======================
app.post('/api/upload', requireAuth, (req, res, next) => {
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
  const uploader = req.user ? {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar
  } : { name: 'Thành viên', email: '' };

  const persistedInDb = await persistUploadedFileToDb(req.file, originalName, uploader);

  const fileData = {
    id: `file-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name: originalName,
    filename: req.file.filename,
    url: fileUrl,
    size: sizeFormatted,
    sizeBytes: fileBytes,
    mimetype: req.file.mimetype,
    fileType,
    persistedInDb,
    uploadedBy: uploader,
    uploadedAt: nowVN()
  };

  res.status(201).json(fileData);
});

app.get('/api/courses/:id/files', async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json(course.files || []);
});

app.post('/api/courses/:id/files', requireStaff, (req, res, next) => {
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
    const uploader = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar
    };
    const persistedInDb = await persistUploadedFileToDb(req.file, originalName, uploader);

    fileItem = {
      id: `file-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name: originalName,
      filename: req.file.filename,
      url: fileUrl,
      size: sizeFormatted,
      sizeBytes: fileBytes,
      mimetype: req.file.mimetype,
      fileType,
      persistedInDb,
      folder: String(req.body.folder || '').trim(),
      moduleId: String(req.body.moduleId || '').trim(),
      description: req.body.description || '',
      uploadedBy: uploader,
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
      folder: String(req.body.folder || '').trim(),
      moduleId: String(req.body.moduleId || '').trim(),
      description: req.body.description || '',
      uploadedBy: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      },
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

app.delete('/api/courses/:id/files/:fileId', requireStaff, async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });

  const fileId = req.params.fileId;
  const fileToDelete = (course.files || []).find(f => f.id === fileId);

  if (fileToDelete && fileToDelete.filename) {
    await deletePersistedFile(fileToDelete.filename);
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

app.get('/api/files/download/:filename', async (req, res) => {
  const safeName = path.basename(req.params.filename || '');
  const filePath = path.join(uploadsDir, safeName);
  const downloadName = String(req.query.name || safeName);
  if (fs.existsSync(filePath)) {
    return res.download(filePath, downloadName);
  }
  if (isMongoConnected) {
    try {
      const doc = await UploadedFileModel.findOne({ filename: safeName }).lean();
      if (doc && doc.data) {
        const buf = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data.buffer || doc.data);
        try { fs.writeFileSync(filePath, buf); } catch (e) { }
        const finalName = req.query.name ? String(req.query.name) : (doc.originalName || safeName);
        res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(finalName)}`);
        return res.send(buf);
      }
    } catch (e) { }
  }
  return res.status(404).json({ message: 'Tệp không tồn tại hoặc đã bị xóa.' });
});

// 10. Certificates (tự động đồng bộ Họ tên, Lớp, Trường mới nhất từ hồ sơ học sinh)
async function enrichCertificatesWithUsers(certs) {
  if (!Array.isArray(certs) || certs.length === 0) return [];
  const ids = [...new Set(certs.map(c => c.studentId).filter(Boolean))];
  let userMap = new Map();
  if (ids.length > 0) {
    if (isMongoConnected) {
      try {
        const users = await UserModel.find({ id: { $in: ids } }).lean();
        users.forEach(u => userMap.set(u.id, u));
      } catch {}
    } else {
      const db = readDb();
      (db.users || []).forEach(u => {
        if (ids.includes(u.id)) userMap.set(u.id, u);
      });
    }
  }
  return certs.map(c => {
    const u = userMap.get(c.studentId);
    if (!u) return c;
    return {
      ...c,
      studentName: u.name || c.studentName || 'Học viên',
      studentClass: u.className || u.classOrPosition || c.studentClass || '',
      studentSchool: u.school || c.studentSchool || '',
      studentCode: u.code || c.studentCode || ''
    };
  });
}

app.get('/api/certificates', async (req, res) => {
  let certs = [];
  if (isMongoConnected) {
    try {
      certs = await CertModel.find().lean();
    } catch (err) {
      certs = [];
    }
  } else {
    certs = readDb().certificates || [];
  }
  if (req.user && !isStaff(req.user)) {
    certs = certs.filter(c => c.studentId === req.user.id);
  }
  const enriched = await enrichCertificatesWithUsers(certs || []);
  res.json(enriched);
});

app.get('/api/certificates/verify/:certNumber', async (req, res) => {
  const certNumber = String(req.params.certNumber || '').trim();
  const cert = isMongoConnected
    ? await CertModel.findOne({ certificateNumber: certNumber }).lean()
    : (readDb().certificates || []).find(c => c.certificateNumber === certNumber);
  if (!cert) return res.status(404).json({ message: 'Không tìm thấy chứng chỉ hợp lệ với mã này.' });
  const [enriched] = await enrichCertificatesWithUsers([cert]);
  res.json(enriched || cert);
});

// 10.5 System Settings
app.get('/api/settings', async (req, res) => {
  if (isMongoConnected) {
    try {
      const doc = await SettingModel.findOne({ key: 'global' }).lean();
      return res.json({ ...DEFAULT_SYSTEM_SETTINGS, ...(doc?.value || {}) });
    } catch { }
  }
  const db = readDb();
  res.json({ ...DEFAULT_SYSTEM_SETTINGS, ...(db.settings || {}) });
});

app.put('/api/settings', requireStaff, async (req, res) => {
  const merged = { ...DEFAULT_SYSTEM_SETTINGS, ...(req.body || {}) };
  if (isMongoConnected) {
    await SettingModel.findOneAndUpdate(
      { key: 'global' },
      { $set: { key: 'global', value: merged, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  } else {
    const db = readDb();
    db.settings = merged;
    writeDb(db);
  }
  res.json({ success: true, settings: merged });
});

// 10.6 Trợ lý AI
app.post('/api/ai/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim().slice(0, 2000);
  if (!message) return res.status(400).json({ message: 'Vui lòng nhập câu hỏi.' });

  const courseId = req.body?.courseId || '6AIAB01';
  const course = await loadCourseObj(courseId);
  const view = course ? await viewCourseFor(course, req.user) : null;
  const activeMod = view && req.body?.moduleId ? (view.modules || []).find(m => m.id === req.body.moduleId) : null;
  const allActs = (view?.modules || []).flatMap(m => (m.activities || []).map(a => ({ ...a, moduleTitle: m.title })));
  const activeAct = req.body?.activityId ? allActs.find(a => a.id === req.body.activityId) : null;
  const pendingActs = allActs.filter(a => !a.isCompleted);
  const upcomingDeadlines = allActs.filter(a => a.dueDate || a.dueDateIso);

  const geminiKey = getValidGeminiKey();
  if (geminiKey) {
    const sysPrompt = `Bạn là Trợ lý Học tập AI thân thiện của Hệ thống LMS Nhóm 2 (Tin học & Chuyên đề AI Lớp 6).
Ngữ cảnh thực tế hiện tại:
- Khóa học: ${view?.name || 'Chuyên đề AI Lớp 6'} (${view?.progress || 0}% hoàn thành, ${view?.completedActivities || 0}/${view?.totalActivities || 0} mục).
- Bài đang mở: ${activeMod?.title || 'Tổng quan toàn khóa'}.
- Hoạt động đang mở: ${activeAct ? `${activeAct.title} (${activeAct.type}) - ${activeAct.description || ''}` : 'Chưa chọn hoạt động cụ thể'}.
- Danh sách 8 bài học: ${(view?.modules || []).map(m => m.title).join('; ')}.
- Các mục chưa hoàn thành: ${pendingActs.slice(0, 6).map(a => a.title).join(', ') || 'Đã xong hết'}.
- Hạn nộp: ${upcomingDeadlines.slice(0, 5).map(a => `${a.title} (${a.dueDate || a.dueDateIso})`).join(', ') || 'Chưa có hạn nộp cụ thể'}.
Hãy trả lời ngắn gọn, dễ hiểu bằng tiếng Việt, đúng trọng tâm câu hỏi của người học.`;

    const isAQKey = geminiKey.startsWith('AQ.');
    const candidates = [
      { model: 'gemini-2.5-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', disableThinking: true },
      { model: 'gemini-2.5-flash-lite', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', disableThinking: true },
      ...(isAQKey
        ? [
            { model: 'vertex-gemini-2.5-flash', url: 'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent', disableThinking: true },
            { model: 'vertex-gemini-2.5-flash-lite', url: 'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent', disableThinking: true }
          ]
        : [])
    ];

    for (const candidate of candidates) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const generationConfig = {
        temperature: 0.7,
        maxOutputTokens: 2048,
        ...(candidate.disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {})
      };
      try {
        const gRes = await fetch(candidate.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${sysPrompt}\n\nCâu hỏi: ${message}` }] }],
            generationConfig
          }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (gRes.ok) {
          const gJson = await gRes.json();
          const parts = gJson?.candidates?.[0]?.content?.parts || [];
          const reply = parts
            .filter(p => typeof p?.text === 'string' && !p?.thought)
            .map(p => p.text)
            .join('')
            .trim();
          if (reply) {
            return res.json({ reply, engine: 'gemini', model: candidate.model });
          }
        } else {
          const errText = await gRes.text().catch(() => '');
          console.warn(`Gemini (${candidate.model}) HTTP ${gRes.status}:`, errText.slice(0, 200));
        }
      } catch (e) {
        clearTimeout(timer);
        console.warn(`Gemini (${candidate.model}) lỗi kết nối:`, e.message);
      }
    }
    console.warn('Tất cả endpoint Gemini đều không phản hồi, fallback sang bộ trợ lý ngữ cảnh nội bộ.');
  }

  const lower = message.toLowerCase();
  let reply = '';
  if (lower.includes('hạn nộp') || lower.includes('deadline') || lower.includes('cần làm') || lower.includes('chưa xong')) {
    if (pendingActs.length === 0 && allActs.length > 0) {
      reply = `🎉 Tuyệt vời! Bạn đã hoàn thành toàn bộ ${allActs.length}/${allActs.length} học liệu trong khóa "${view?.name || 'khóa học này'}" rồi!`;
    } else if (pendingActs.length > 0) {
      const lines = pendingActs.slice(0, 6).map((a, i) => `${i + 1}. [${a.type.toUpperCase()}] ${a.title}${a.dueDate ? ` — Hạn: ${a.dueDate}` : ''}`);
      reply = `⏰ Bạn còn **${pendingActs.length} mục chưa hoàn thành** trong "${view?.name}":\n${lines.join('\n')}\n\nTiến độ hiện tại của bạn: **${view?.progress || 0}%**.`;
    } else {
      reply = `Hiện tại khóa "${view?.name || '6AIAB01'}" chưa có học liệu có hạn nộp. Khi giáo viên thêm bài tập hoặc bài kiểm tra, mình sẽ tự động nhắc lịch cho bạn nhé!`;
    }
  } else if (lower.includes('tiến độ') || lower.includes('điểm')) {
    const scored = allActs.filter(a => a.score !== undefined && a.score !== null);
    const avg = scored.length > 0 ? (scored.reduce((s, a) => s + Number(a.score), 0) / scored.length).toFixed(1) : null;
    reply = `📊 **Tiến độ thực tế của bạn trong "${view?.name}":**\n• Hoàn thành: **${view?.completedActivities || 0}/${view?.totalActivities || 0} học liệu (${view?.progress || 0}%)**\n• Điểm trung bình hiện tại: **${avg ? `${avg}/10` : 'Chưa có bài chấm điểm'}**\n• Bạn có thể mở mục **Tiến độ & Sổ điểm** để xem chi tiết từng bài video và câu đúng/sai trắc nghiệm.`;
  } else if (lower.includes('tóm tắt')) {
    if (activeAct) {
      reply = `📖 **Tóm tắt hoạt động đang mở: ${activeAct.title}**\n• Loại: ${activeAct.type}\n• Mô tả: ${activeAct.description || activeAct.assignmentPrompt || 'Nội dung trọng tâm của bài học.'}\n${activeAct.type === 'video' ? `• Lưu ý: Cần xem tối thiểu 80% thời lượng${(activeAct.videoCheckpoints?.length || 0) > 0 ? ` và vượt qua ${activeAct.videoCheckpoints.length} neo chặn câu hỏi` : ''}.` : ''}`;
    } else if (activeMod) {
      reply = `📖 **Tóm tắt ${activeMod.title}:**\n• ${activeMod.description || 'Chuyên đề trọng tâm trong chương trình AI Lớp 6.'}\n• Hiện có **${(activeMod.activities || []).length} học liệu**: ${(activeMod.activities || []).map(a => a.title).join(', ') || 'Giáo viên đang cập nhật thêm.'}`;
    } else {
      reply = `📖 **Tổng quan khóa học ${view?.name || 'Chuyên đề AI Lớp 6'}:**\nGồm **${(view?.modules || []).length} bài học** xuyên suốt Chủ đề A & B:\n${(view?.modules || []).slice(0, 8).map((m, i) => `${i + 1}. ${m.title}`).join('\n')}`;
    }
  } else if (lower.includes('trắc nghiệm') || lower.includes('ôn tập') || lower.includes('câu hỏi')) {
    const focus = activeMod?.title || activeAct?.title || 'Trí tuệ Nhân tạo Lớp 6';
    reply = `🎯 **3 câu hỏi ôn tập nhanh cho "${focus}":**\n1. AI học hỏi và đưa ra dự đoán dựa trên yếu tố nào là quan trọng nhất?\n2. Vì sao con người vẫn giữ vai trò quyết định cuối cùng thay vì tin tuyệt đối vào kết quả của AI?\n3. Khi sử dụng công cụ AI, những dữ liệu cá nhân nào tuyệt đối không nên chia sẻ?\n\n*(Gợi ý: Bạn có thể trả lời thử ngay tại đây để mình nhận xét nhé!)*`;
  } else {
    reply = `💡 Mình đã ghi nhận câu hỏi "${message}" trong ngữ cảnh **${activeAct?.title || activeMod?.title || view?.name || 'LMS Nhóm 2'}**.\n• Gợi ý nhanh: Bạn có thể hỏi mình về **"tiến độ của tôi"**, **"hạn nộp bài tập"**, **"tóm tắt bài học này"**, hoặc **"tạo câu hỏi ôn tập"**.`;
  }
  res.json({ reply, engine: 'lms-context' });
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
      const users = await UserModel.find({}).lean();
      return res.json((users || []).map(safeUser));
    } catch (err) {
      return res.json([]);
    }
  }
  const db = readDb();
  const safeUsers = (db.users || []).map(safeUser);
  res.json(safeUsers || []);
});

// 13.1 Thêm người dùng mới
app.post('/api/users', requireStaff, async (req, res) => {
  const { name, email, username, password, role, code, className, school, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ Họ tên và Email.' });
  }
  const rawPassword = String(password || '').trim();
  if (rawPassword && rawPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = String(username || normalizedEmail.split('@')[0]).toLowerCase().trim().replace(/\s+/g, '');
  const userCode = (code || normalizedUsername).toUpperCase();
  const userRole = role === 'admin' && normalizedEmail !== 'phanphiphu04@gmail.com' ? 'student' : (role || 'student');
  const passwordHash = rawPassword ? hashPassword(rawPassword) : '';

  const newUser = {
    id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name: name.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
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
      const existing = await UserModel.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
      });
      if (existing) {
        return res.status(409).json({ message: 'Email hoặc Tên đăng nhập này đã tồn tại trong hệ thống.' });
      }
      const created = await UserModel.create(newUser);
      const obj = created.toObject ? created.toObject() : created;
      return res.status(201).json(safeUser(obj));
    } catch (err) {
      return res.status(500).json({ message: 'Lỗi khi lưu người dùng vào MongoDB.' });
    }
  } else {
    const db = readDb();
    if ((db.users || []).some(u =>
      u.email?.toLowerCase().trim() === normalizedEmail ||
      (u.username && u.username.toLowerCase().trim() === normalizedUsername)
    )) {
      return res.status(409).json({ message: 'Email hoặc Tên đăng nhập này đã tồn tại trong hệ thống.' });
    }
    db.users = db.users || [];
    db.users.push(newUser);
    writeDb(db);
    return res.status(201).json(safeUser(newUser));
  }
});

// 13.12 Cấp / Đặt lại mật khẩu cho người dùng
app.put('/api/users/:userId/password', requireStaff, async (req, res) => {
  const userId = req.params.userId;
  const rawPassword = String(req.body?.password || '').trim();
  if (rawPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
  }
  const hashed = hashPassword(rawPassword);

  if (isMongoConnected) {
    const target = await UserModel.findOne({ id: userId });
    if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    const isTargetRoot = target.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com';
    const isCallerRoot = req.user.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com';
    if (isTargetRoot && !isCallerRoot) {
      return res.status(403).json({ message: 'Không thể đổi mật khẩu của Quản trị viên gốc.' });
    }
    target.passwordHash = hashed;
    target.set('password', undefined);
    await target.save();
    return res.json({ success: true, message: 'Đã cập nhật mật khẩu đăng nhập thành công.' });
  }

  const db = readDb();
  const target = (db.users || []).find(u => u.id === userId);
  if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  const isTargetRoot = target.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com';
  const isCallerRoot = req.user.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com';
  if (isTargetRoot && !isCallerRoot) {
    return res.status(403).json({ message: 'Không thể đổi mật khẩu của Quản trị viên gốc.' });
  }
  target.passwordHash = hashed;
  delete target.password;
  writeDb(db);
  res.json({ success: true, message: 'Đã cập nhật mật khẩu đăng nhập thành công.' });
});

// 13.15 Đổi vai trò người dùng
app.put('/api/users/:userId/role', requireStaff, async (req, res) => {
  const userId = req.params.userId;
  const nextRole = req.body?.role === 'lecturer' ? 'lecturer' : 'student';
  if (isMongoConnected) {
    const target = await UserModel.findOne({ id: userId });
    if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    if (target.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com') {
      return res.status(403).json({ message: 'Không thể thay đổi vai trò của Quản trị viên gốc.' });
    }
    target.role = nextRole;
    target.classOrPosition = nextRole === 'lecturer' ? 'Giáo viên' : (target.className || 'Học viên');
    await target.save();
    return res.json({ success: true, user: safeUser(target.toObject()) });
  }
  const db = readDb();
  const target = (db.users || []).find(u => u.id === userId);
  if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  if (target.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com') {
    return res.status(403).json({ message: 'Không thể thay đổi vai trò của Quản trị viên gốc.' });
  }
  target.role = nextRole;
  target.classOrPosition = nextRole === 'lecturer' ? 'Giáo viên' : (target.className || 'Học viên');
  writeDb(db);
  res.json({ success: true, user: safeUser(target) });
});

// 13.2 Xóa người dùng
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

// 14. Students in Course
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
// Chặn trình duyệt tải trực tiếp các file .js chứa dữ liệu & đáp án trong public/hoc-lieu/6aiab01
app.use('/hoc-lieu/6aiab01', (req, res, next) => {
  if (req.path.endsWith('.js')) return res.status(404).send('Not found');
  next();
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      }
    }
  }));

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
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LMS Nhóm 2 Backend API (Node Runtime)',
      version: '2.7-split-static-node-public',
      health: '/api/health'
    });
  });
  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại.` });
  });
}

// Start Server on all interfaces (0.0.0.0) for Render compatibility
const httpServer = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Server listen error:', err);
    process.exit(1);
  }
  const addr = httpServer.address();
  const bound = typeof addr === 'object' && addr ? `${addr.address}:${addr.port}` : `0.0.0.0:${PORT}`;
  console.log(`\n======================================================`);
  console.log(`LMS Nhóm 2 Full-Stack Server is running!`);
  console.log(`Bound: http://${bound}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Database Mode: ${isMongoConnected ? 'MongoDB Atlas' : 'Local JSON DB'}`);
  console.log(`======================================================\n`);
});
httpServer.keepAliveTimeout = 120000;
httpServer.headersTimeout = 120000;