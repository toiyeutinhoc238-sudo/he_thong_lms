import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import crypto from 'crypto';
import multer from 'multer';
import zlib from 'zlib';

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
        // Đảm bảo khóa học 6AIAB01 luôn sạch dữ liệu ảo (xóa sạch act-*-1..4 cũ và học sinh ảo mẫu) và nạp trọn bộ học liệu Bài 1 & Bài 2
        await ensureDefaultCourse();
        await ensureAi6Bai12Content();
        // Khởi tạo 1 lần khóa học thực tế Tin học 12 KNTT – Bài 12: Tạo biểu mẫu (kèm Học liệu tương tác A2.3) nếu chưa có
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

// Hoạt động có phần trắc nghiệm do máy chủ chấm: bài trắc nghiệm, hoặc học liệu HTML có bài trắc nghiệm bên trong
const hasQuizPart = (act) => !!act && (act.type === 'quiz' || (Array.isArray(act.quizQuestions) && act.quizQuestions.length > 0));

// Gắn req.user từ token (vai trò luôn lấy từ cơ sở dữ liệu, không tin dữ liệu client gửi lên)
app.use(async (req, res, next) => {
  req.user = null;
  // Chỉ chờ MongoDB & xác thực token cho API routes, giúp trang chủ & health check phản hồi tức thì
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

// Truy vấn tiến độ của một học sinh khớp theo CẢ userId và email (không bao giờ mất tiến độ khi đổi phiên đăng nhập)
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

// Dữ liệu của học sinh không được nằm trong tài liệu khóa học dùng chung
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

// Trả về khóa học theo góc nhìn của người đang đăng nhập: chỉ gắn tiến độ CỦA CHÍNH HỌ (ẩn mô-đun/hoạt động nháp với học sinh)
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
        // Học sinh chỉ nhận đáp án, lời giải & phản hồi riêng từng lựa chọn SAU KHI đã nộp bài trắc nghiệm
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
    // Khách chưa đăng nhập không được xem danh sách (email) học sinh
    enrolledStudents: user ? students : []
  };
}

async function viewCourseFor(courseObj, user) {
  const enriched = await resolveInstructorAvatar(courseObj);
  const records = user ? await listProgressForUser(user, enriched.id) : [];
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
// 1. Auth: Đăng nhập bằng Tài khoản & Mật khẩu (băm scrypt an toàn — phục vụ Giảng viên kiểm tra BT4 & tài khoản được cấp)
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
        // Giữ nguyên quyền 'lecturer' nếu Quản trị viên đã phân quyền cho thành viên/giảng viên; chỉ duy nhất email gốc là admin
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

// Bộ nhớ đệm 60 giây cho thông tin giáo viên tránh truy vấn lặp lại MongoDB ở GET /api/courses
const instructorCache = new Map();

// Helper: Lấy thông tin & Avatar thật từ tài khoản Google của giáo viên/người tạo
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

// ====================== HỌC LIỆU CHÍNH THỨC TRỌN BỘ 8 BÀI CHO KHÓA HỌC 6AIAB01 ======================
// Đồng bộ 100% với 8 thư mục BAI1/..BAI8/ (0.SGK.docx, 1.KHBD.docx, 2.HocLieuSo.docx) — tuyệt đối KHÔNG chứa dữ liệu ảo
const AI6_BAI12_REVISION = 'v14-video-neo-chan-khoa-tua';

function buildAi6Bai12SeedData() {
  const bai1Module = {
    id: 'module-lesson-1',
    courseId: '6AIAB01',
    order: 1,
    title: 'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
    description: 'Thời lượng: 02 tiết (Tiết 1: Trực tuyến trên LMS – Mức Hiểu 6.A1.1 | Tiết 2: Trực tiếp tại lớp – Mức Vận dụng 6.A1.2).',
    learningObjectives: '• (6.A1.1) Giải thích được AI là sản phẩm do con người tạo ra, lập trình và điều khiển để thực hiện những nhiệm vụ cụ thể; AI không tự sinh ra và không hoạt động độc lập; nêu ví dụ công cụ AI quen thuộc và vai trò con người (Dữ liệu – Thuật toán – Điều khiển).\n• (6.A1.2) Trình bày được vai trò của AI chỉ là công cụ hỗ trợ; con người luôn giám sát (Humans in the Loop / EU AI Act 2024), đưa ra quyết định cuối cùng và chịu trách nhiệm 100%.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b1-act-1',
        moduleId: 'module-lesson-1',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 1 – Nguồn gốc của AI và quyền quyết định',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai1/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 1: Nguồn gốc của AI và quyền quyết định (YCCĐ 6.A1.1 & 6.A1.2 · 02 tiết Blended).'
      },
      {
        id: 'ai6-b1-act-2',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 1 (Khởi động): Tình huống ba bạn An, Minh, Khoa & Khảo sát nguồn gốc AI',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 BƯỚC (TIẾT 1 – 45 PHÚT): (1) Khởi động 5p → (2) Xem sơ đồ trực quan & Video có 3 câu neo chặn 25p → (3) Chốt chặn kiểm tra ≥ 8/10đ (10p) → (4) Nhiệm vụ cầu nối bạn Minh (5p).\n\nKIẾN THỨC NỀN (Tin học 6): Máy tính xử lí thông tin dựa trên dữ liệu đầu vào và thực hiện chương trình do con người viết ra.\n\nTÌNH HUỐNG KHỞI ĐỘNG (Hình 1.1 SGK Bài 1): Sau giờ Tin học, bạn An thắc mắc liệu rô-bốt AI ngoài đời thật có thể “tự thức tỉnh” như trong phim khoa học viễn tưởng không; bạn Minh băn khoăn ai đã dạy YouTube gợi ý đúng bài hát và điện thoại mở khóa khuôn mặt.\n\nEm hãy trả lời 2 câu hỏi lên Diễn đàn:\n1. Theo em, AI ngoài đời thực tự sinh ra trong vi mạch hay do con người thu thập dữ liệu, lập trình và điều khiển?\n2. Hãy kể tên ít nhất 01 ứng dụng hoặc thiết bị có AI mà em hoặc gia đình từng sử dụng.'
      },
      {
        id: 'ai6-b1-act-3',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 2.1 (Video – Code.org): How AI Works – AI hoạt động như thế nào? (01:30 · 3 câu neo chặn)',
        type: 'video',
        durationMinutes: 4,
        isCompleted: false,
        isRequired: true,
        videoUrl: 'https://www.youtube.com/watch?v=Ok-xpKjKp2g',
        videoDuration: 90,
        preventVideoSkip: true,
        description: 'Xem video hoạt hình ngắn về cách AI hoạt động (bật phụ đề tiếng Việt nếu cần) theo đúng KHBD Bài 1 (không khóa tua phức tạp). 3 câu hỏi định hướng khi xem:\n(1) Vì sao công nghệ này được gọi là Trí tuệ “Nhân tạo”?\n(2) Máy tính cần có gì do con người cung cấp để có thể học và nhận diện?\n(3) Ghi chú 3 bước con người tạo ra AI (Thu thập & xử lí dữ liệu → Thiết kế thuật toán & lập trình → Triển khai, điều khiển) vào SGK Bài 1.\nVideo sẽ tự dừng ở 3 điểm để em trả lời câu hỏi; em cần trả lời đúng mới xem tiếp được và không tua nhanh qua đoạn chưa xem.',
        videoCheckpoints: [
          {
            id: 'b1-cp1',
            timeSeconds: 18,
            question: 'Theo video, AI đang có mặt ở đâu trong đời sống?',
            options: [
              'Chỉ có trong phim khoa học viễn tưởng.',
              'Chỉ có trong phòng thí nghiệm, học sinh chưa từng dùng.',
              'Trong y tế, giáo dục, lớp học, nhà ở – em đã và đang dùng nhiều ứng dụng AI hằng ngày.'
            ],
            correctAnswer: 2,
            explanation: 'AI đã có mặt quanh em: gợi ý video, dịch ngôn ngữ, trợ lý ảo, mở khóa bằng khuôn mặt… Đó đều là công cụ do con người tạo ra.',
            requireCorrect: true
          },
          {
            id: 'b1-cp2',
            timeSeconds: 42,
            question: 'Theo video, nhờ đâu máy tính có thể học cách nhận ra đồ vật?',
            options: [
              'Con người dùng dữ liệu để huấn luyện máy tính và lập trình cách máy tính học.',
              'Máy tính tự sinh ra trí thông minh mà không cần con người.',
              'Máy tính chỉ cần được cắm điện là tự biết.'
            ],
            correctAnswer: 0,
            explanation: 'AI không tự sinh ra: con người thu thập dữ liệu, thiết kế thuật toán để huấn luyện máy tính, rồi điều khiển nó (6.A1.1).',
            requireCorrect: true
          },
          {
            id: 'b1-cp3',
            timeSeconds: 69,
            question: 'Video nhắc chúng ta cần đặt ra câu hỏi khó nào khi dùng AI?',
            options: [
              'Máy tính có thể chạy nhanh đến mức nào?',
              'Không chỉ máy tính làm được gì, mà máy tính NÊN làm gì.',
              'Làm sao để AI tự quyết định thay con người?'
            ],
            correctAnswer: 1,
            explanation: 'Con người quyết định AI nên được dùng vào việc gì, giám sát và chịu trách nhiệm về kết quả – AI chỉ là công cụ hỗ trợ (6.A1.2).',
            requireCorrect: true
          }
        ]
      },
      {
        id: 'ai6-b1-act-4',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 3A (Chốt chặn kiểm tra ≥ 8/10đ): Phân loại công cụ AI & Vai trò con người (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Tiết 1 (5 câu, thang 10 điểm, điều kiện đạt ≥ 8/10 điểm theo KHBD Bài 1). Sau khi nộp bài, hệ thống chấm tự động và hiển thị phản hồi riêng cho từng phương án em chọn.',
        quizQuestions: [
          {
            id: 'ai6-b1-q1',
            question: 'Câu 1 (Phân loại công cụ AI): Trong các thiết bị và ứng dụng sau, công cụ nào CÓ ứng dụng Trí tuệ nhân tạo (AI)?',
            options: [
              'Chiếc quạt điện có điều khiển hẹn giờ tự tắt theo số phút cài sẵn',
              'Ứng dụng dịch ngôn ngữ qua giọng nói và chữ trên hình ảnh (như Google Dịch)',
              'Chiếc máy tính bỏ túi khoa học thực hiện nhanh các phép tính công thức cố định',
              'Chiếc nồi cơm điện tử tự chuyển sang chế độ giữ ấm khi cảm biến đủ nhiệt độ'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Quạt hẹn giờ chỉ đếm lùi thời gian theo bộ đếm cố định chứ không học từ dữ liệu — không phải AI.',
              'Chính xác! Ứng dụng dịch ngôn ngữ dùng AI để học từ dữ liệu ngôn ngữ, nhận diện giọng nói, mặt chữ và dịch nghĩa theo ngữ cảnh.',
              'Rất dễ nhầm! Máy tính bỏ túi dù tính rất nhanh nhưng chỉ chạy theo công thức cài sẵn cố định, không học từ dữ liệu.',
              'Nồi cơm điện chỉ hoạt động theo cảm biến/rơ-le nhiệt lập trình sẵn mức nhiệt cố định, không phải AI.'
            ],
            explanation: 'Theo Infographic 2 (Hình 1.3 SGK Bài 1): Công cụ AI có khả năng học từ dữ liệu để nhận dạng, dự đoán, dịch thuật hoặc gợi ý thông minh.'
          },
          {
            id: 'ai6-b1-q2',
            question: 'Câu 2 (Phân loại thiết bị thông thường): Thiết bị hoặc tính năng nào dưới đây KHÔNG phải là công cụ ứng dụng Trí tuệ nhân tạo (AI)?',
            options: [
              'Tính năng mở khóa điện thoại bằng nhận diện khuôn mặt chủ nhân (Face ID)',
              'Hệ thống tự động đề xuất video trên YouTube dựa theo lịch sử xem',
              'Chiếc máy tính bỏ túi cầm tay thực hiện phép cộng, trừ, nhân, chia cơ bản',
              'Trợ lý ảo nghe hiểu câu lệnh giọng nói (Google Assistant, Siri) để tìm kiếm thông tin'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Face ID có ứng dụng AI để học và phân tích đặc điểm khuôn mặt nhằm nhận diện đúng chủ nhân.',
              'Hệ thống gợi ý YouTube sử dụng AI phân tích lịch sử xem để dự đoán nội dung phù hợp.',
              'Chính xác! Máy tính bỏ túi thông thường chỉ hoạt động theo mạch điện tử và công thức cố định, không học từ dữ liệu.',
              'Trợ lý ảo giọng nói ứng dụng AI để nhận dạng âm thanh và hiểu ngôn ngữ tự nhiên.'
            ],
            explanation: 'Không phải mọi thiết bị điện tử đều là AI: máy tính bỏ túi, quạt cơ, đèn pin chỉ thực hiện thao tác cố định.'
          },
          {
            id: 'ai6-b1-q3',
            question: 'Câu 3 (Vai trò con người – Dữ liệu): Để một hệ thống AI có thể nhận diện chính xác hình ảnh con mèo, bước đầu tiên các kĩ sư con người phải thực hiện là gì?',
            options: [
              'Cài đặt công cụ AI lên điện thoại rồi chờ máy tính tự chụp và tự suy ra hình ảnh con mèo',
              'Thu thập, phân loại và làm sạch hàng nghìn bức ảnh mẫu về các loài mèo để dạy máy tính học',
              'Chỉ cần viết một câu lệnh điều kiện kiểm tra kích thước tệp ảnh mà không cần ảnh mẫu',
              'Bật nguồn máy tính và để hệ thống AI tự sinh ra cơ sở dữ liệu mẫu trong bộ nhớ'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'AI không thể tự biết con mèo là gì nếu chưa được con người cung cấp dữ liệu mẫu để huấn luyện trước.',
              'Chính xác! Thu thập và xử lí dữ liệu là bước nền tảng đầu tiên do con người thực hiện (Hình 1.2 SGK Bài 1, UNESCO 2024).',
              'Kích thước tệp ảnh không thể giúp máy tính phân biệt được con mèo với các vật thể khác.',
              'Máy tính không thể tự sinh ra dữ liệu chuẩn nếu không có con người lựa chọn và làm sạch.'
            ],
            explanation: 'Bước 1 trong 3 bước tạo ra AI: Con người lựa chọn, thu thập và làm sạch lượng lớn dữ liệu làm nguồn học cho máy tính.'
          },
          {
            id: 'ai6-b1-q4',
            question: 'Câu 4 (Vai trò con người – Thuật toán): Trong quy trình phát triển công cụ AI, công việc “viết chương trình máy tính và hướng dẫn máy tính cách học từ dữ liệu, nhận diện mẫu” thuộc bước nào?',
            options: [
              'Thiết kế thuật toán và lập trình',
              'Thu thập và làm sạch dữ liệu đầu vào',
              'Triển khai, bật tắt và vận hành thiết bị cuối',
              'Giám sát đạo đức sau khi người dùng sử dụng'
            ],
            correctAnswer: 0,
            optionFeedback: [
              'Chính xác! Con người thiết kế thuật toán và viết chương trình để dẫn dắt cách máy tính học từ dữ liệu.',
              'Thu thập và làm sạch dữ liệu là Bước 1 (chuẩn bị nguồn học), chưa phải bước viết thuật toán lập trình.',
              'Triển khai và điều khiển là Bước 3 (đưa AI vào thiết bị, bật/tắt, cập nhật khi có sai sót).',
              'Giám sát trong quá trình sử dụng thuộc vai trò người dùng vận hành AI ở bước triển khai.'
            ],
            explanation: 'Theo Hình 1.2 SGK Bài 1: Bước 2 là Thiết kế thuật toán và lập trình do các kĩ sư thực hiện.'
          },
          {
            id: 'ai6-b1-q5',
            question: 'Câu 5 (Bản chất nguồn gốc & Quyền quyết định): Phát biểu nào sau đây là CHÍNH XÁC nhất về nguồn gốc và vai trò của Trí tuệ nhân tạo (AI)?',
            options: [
              'AI có ý thức độc lập sau khi được huấn luyện xong và có thể tự chịu trách nhiệm nếu đưa kết quả sai',
              'AI là sản phẩm do con người tạo ra, lập trình và điều khiển; con người luôn giữ quyền quyết định cuối cùng',
              'Mọi thiết bị điện tử thông minh chạy bằng điện trong gia đình đều là hệ thống Trí tuệ nhân tạo',
              'AI do con người tạo ra nhưng một khi đã cài đặt vào thiết bị thì con người không thể kiểm soát hay điều chỉnh nữa'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'AI chỉ là phần mềm/công cụ, không có ý thức riêng và không có tư cách pháp lí để chịu trách nhiệm thay con người.',
              'Xuất sắc! Em đã nắm vững yêu cầu 6.A1.1 & 6.A1.2: Con người tạo ra, dẫn dắt, giám sát và chịu trách nhiệm 100% khi dùng AI.',
              'Nhiều thiết bị chạy điện như quạt cơ, đèn bàn, máy tính bỏ túi hoạt động cố định, không phải AI.',
              'Ở Bước 3 (Triển khai & điều khiển), con người luôn trực tiếp bật, tắt, kiểm tra và cập nhật khi AI sai sót.'
            ],
            explanation: 'Kiến thức trọng tâm Bài 1: AI do con người tạo ra, lập trình và điều khiển; AI chỉ là công cụ hỗ trợ — con người luôn ở trong vòng lặp (Humans in the Loop).'
          }
        ]
      },
      {
        id: 'ai6-b1-act-5',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 3B (Nhiệm vụ cầu nối chuẩn bị Tiết 2): Tình huống bạn Minh nộp bài Lịch sử sai năm sinh',
        type: 'assignment',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Nhiệm vụ cầu nối cuối Tiết 1 chuẩn bị cho Tiết 2 trực tiếp tại lớp (trích Luyện tập 3 SGK Bài 1).',
        assignmentPrompt: 'NHIỆM VỤ CẦU NỐI CHUẨN BỊ TIẾT 2 (Luyện tập 3 – SGK Bài 1)\n\nTình huống: Trong giờ học Lịch sử, bạn Minh nhờ một công cụ AI tóm tắt thông tin về một nhân vật lịch sử và chép nguyên văn vào bài nộp mà không kiểm tra lại với sách giáo khoa. Kết quả là bài làm của Minh bị sai năm sinh của nhân vật đó.\n\nEm hãy trả lời ngắn gọn (nhập trực tiếp bên dưới):\n1. Nếu là bạn Minh, em sẽ làm gì trước khi nộp bài cho cô giáo?\n2. Theo em, khi bài nộp bị sai thông tin như vậy thì ai là người phải chịu trách nhiệm? Vì sao?\n\n(Thầy/Cô sẽ tổng hợp các ý kiến tiêu biểu để cả lớp thảo luận mở đầu Tiết 2!)'
      },
      {
        id: 'ai6-b1-act-6',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 5 & 6 (Tiết 2 – Vận dụng): Tòa án công nghệ giả định & Lập “Tuyên ngôn làm chủ AI” (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Hoàn thành tình huống Vận dụng 1 (Tòa án công nghệ giả định) và Vận dụng 2 (Tuyên ngôn làm chủ AI: 1 điều NÊN – 1 điều KHÔNG NÊN) kèm Rubric 10 điểm.',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG TIẾT 2 (SGK BÀI 1)\n\nPhần 1 – Tình huống “Tòa án công nghệ giả định” (Vận dụng 1):\nMột chiếc ô tô có tích hợp tính năng AI hỗ trợ lái tự động. Người lái xe đã bật chế độ tự lái rồi bỏ tay khỏi vô-lăng để chơi trò chơi trên điện thoại, dẫn đến việc xe không kịp phanh khi gặp chướng ngại vật bất ngờ.\n→ Nếu là thành viên hội đồng phân xử, em kết luận trách nhiệm thuộc về ai và rút ra bài học gì về nguyên tắc “Con người trong vòng lặp” (Humans in the Loop / EU AI Act 2024)?\n\nPhần 2 – Lập “Tuyên ngôn làm chủ AI” (Vận dụng 2):\nHãy chọn 01 công việc học tập hằng ngày của em (VD: học từ vựng Tiếng Anh, lập dàn ý bài văn, tìm ý tưởng vẽ tranh...) và viết rõ:\n• Công việc học tập em chọn:\n• 1 điều em NÊN làm (tận dụng AI hỗ trợ đúng cách):\n• 1 điều em KHÔNG NÊN làm (giữ quyền quyết định, bước kiểm chứng và tính trung thực):\n\nTIÊU CHÍ CHẤM ĐIỂM (RUBRIC 10 ĐIỂM – KHBD BÀI 1):\n- Phân định rõ vai trò hỗ trợ của AI – Quy tắc NÊN (4,0đ)\n- Thể hiện quyền quyết định & trách nhiệm – Quy tắc KHÔNG NÊN (4,0đ)\n- Trình bày mạch lạc, chính tả chuẩn và tính thực tiễn (2,0đ)'
      }
    ]
  };

  const bai2Module = {
    id: 'module-lesson-2',
    courseId: '6AIAB01',
    order: 2,
    title: 'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
    description: 'Thời lượng: 01 tiết – 45 phút (Dạy học trực tuyến trên hệ thống LMS theo chu trình 5 thành phần – Yêu cầu cần đạt 6.A3.2).',
    learningObjectives: '• (6.A3.2) Trình bày được 3 lợi ích của AI trong học tập (học hỏi kiến thức mới, rèn luyện kĩ năng, mở rộng hiểu biết) khi sử dụng đúng mục đích.\n• Nắm công thức viết câu lệnh (Prompt) 3 thành phần: Bối cảnh (Ngữ cảnh) + Vai trò + Yêu cầu & định dạng cụ thể; tuân thủ Cẩm nang “4 KHÔNG” bảo vệ dữ liệu cá nhân.\n• Sử dụng công cụ AI phù hợp lứa tuổi hỗ trợ 1 nhiệm vụ học tập lớp 6 và tự tóm tắt 3–5 câu bằng ngôn ngữ riêng kèm đối chiếu SGK chuẩn bị Bài 3.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b2-act-1',
        moduleId: 'module-lesson-2',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 2 – Lợi ích và cách sử dụng công cụ AI phù hợp',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai2/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 2: Lợi ích và cách sử dụng công cụ AI phù hợp (YCCĐ 6.A3.2 · 01 tiết Trực tuyến).'
      },
      {
        id: 'ai6-b2-act-2',
        moduleId: 'module-lesson-2',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): Công cụ AI hỗ trợ em học tập như thế nào? (Hình 2.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 BƯỚC (45 PHÚT): (1) Khởi động Diễn đàn 5p → (2) Xem Video tương tác có 3 câu neo chặn, đọc Kiến thức trọng tâm & làm trắc nghiệm củng cố ≥ 7/10đ 15p → (3) Thực hành “Hỏi đúng – Trúng đáp án” 15p → (4) Viết tóm tắt “Nhà báo nhí” & Cầu nối Bài 3 (10p).\n\nCHỦ ĐỀ THẢO LUẬN (Gắn tình huống An, Minh, Khoa – Hình 2.1 SGK Bài 2):\nBạn Khoa dùng ứng dụng AI để luyện 5 câu hội thoại tiếng Anh về bảo vệ môi trường, sửa phát âm và giải thích từ mới rất rõ ràng. Hãy chia sẻ ngắn gọn 2 câu hỏi:\n1. Khi gặp một bài tập khó hoặc một khái niệm chưa hiểu rõ ở nhà, em thường làm gì để tìm sự trợ giúp?\n2. Nếu được sử dụng một công cụ AI hỗ trợ học tập phù hợp lứa tuổi, câu hỏi học tập đầu tiên em muốn nhờ công cụ đó giải thích là gì?\n\nLưu ý: Gõ tiếng Việt có dấu, lịch sự và tuyệt đối KHÔNG chia sẻ thông tin cá nhân (họ tên đầy đủ, địa chỉ nhà, số điện thoại, mật khẩu).'
      },
      {
        id: 'ai6-b2-act-video',
        moduleId: 'module-lesson-2',
        title: 'Hoạt động 2 (Video tương tác): Bí kíp giao tiếp với AI – Bối cảnh, Vai trò, Yêu cầu (06:28 · 3 câu neo chặn)',
        type: 'video',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        videoUrl: 'https://www.youtube.com/watch?v=fmQWlfG3Rcs',
        videoDuration: 388,
        preventVideoSkip: true,
        description: 'Em xem video về cách viết câu lệnh cho AI. Video sẽ tự dừng ở 3 điểm để em trả lời câu hỏi; em cần trả lời đúng mới xem tiếp được. Hoàn thành khi xem hết video và vượt qua cả 3 câu hỏi. Sau đó đối chiếu với Hình 2.2, Hình 2.3 SGK Bài 2.',
        videoCheckpoints: [
          {
            id: 'b2-cp1',
            timeSeconds: 105,
            question: 'Qua ví dụ so sánh giữa câu lệnh “Viết về măng” và “Viết 3 câu bán măng sạch”, vì sao câu lệnh thứ hai giúp AI trả lời hữu ích hơn?',
            options: [
              'Vì câu lệnh thứ hai ngắn hơn và dùng dấu chấm than.',
              'Vì câu lệnh thứ hai giao việc rõ ràng, nêu cụ thể số lượng (3 câu) và mục đích sử dụng.',
              'Vì AI tự bỏ qua câu lệnh thứ nhất do đường truyền mạng.'
            ],
            correctAnswer: 1,
            explanation: 'AI trả lời dựa trên thông tin em đưa vào; yêu cầu càng rõ mục đích và số lượng thì kết quả càng sát nhu cầu.',
            requireCorrect: true
          },
          {
            id: 'b2-cp2',
            timeSeconds: 220,
            question: 'Công thức gồm 3 thành phần để viết một câu lệnh hiệu quả cho AI là gì?',
            options: [
              'Bối cảnh + Vai trò + Yêu cầu (nhiệm vụ) cụ thể.',
              'Tên điện thoại + Họ tên người dùng + Mật khẩu tài khoản.',
              'Lời khen công cụ AI + Thời gian chờ + Lời cảm ơn.'
            ],
            correctAnswer: 0,
            explanation: 'Câu lệnh rõ ràng gồm: Bối cảnh (em là ai, cần gì) + Vai trò của AI + Yêu cầu và cách trình bày cụ thể.',
            requireCorrect: true
          },
          {
            id: 'b2-cp3',
            timeSeconds: 330,
            question: 'Trong câu lệnh “Tôi là nông dân mới trồng sâm. Hãy đóng vai một chuyên gia nông nghiệp. Viết 3 gạch đầu dòng những lưu ý quan trọng nhất về tưới nước cho cây sâm 1 năm tuổi”, cụm nào là BỐI CẢNH?',
            options: [
              '“Hãy đóng vai một chuyên gia nông nghiệp”',
              '“Tôi là nông dân mới trồng sâm”',
              '“Viết 3 gạch đầu dòng những lưu ý quan trọng nhất”'
            ],
            correctAnswer: 1,
            explanation: '“Tôi là nông dân mới trồng sâm” cho AI biết người hỏi là ai – đó là Bối cảnh. “Đóng vai chuyên gia” là Vai trò, “Viết 3 gạch đầu dòng” là Yêu cầu.',
            requireCorrect: true
          }
        ]
      },
      {
        id: 'ai6-b2-act-3',
        moduleId: 'module-lesson-2',
        title: 'Hoạt động 2A (Kiến thức trọng tâm & Cẩm nang 4 KHÔNG): 3 Lợi ích của AI & Công thức Prompt 3 thành phần',
        type: 'document',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        description: '1. BA LỢI ÍCH CỦA CÔNG CỤ AI KHI SỬ DỤNG ĐÚNG CÁCH (UNESCO 2023 – Hình 2.2 SGK):\n• Hỗ trợ học hỏi kiến thức mới: Giải thích khái niệm phức tạp bằng ngôn ngữ đơn giản, dễ hiểu cho học sinh lớp 6 kèm ví dụ minh họa gần gũi.\n• Rèn luyện kĩ năng học tập: Luyện phát âm ngoại ngữ, chỉnh sửa lỗi chính tả, tạo bộ câu hỏi trắc nghiệm tự ôn tập.\n• Mở rộng hiểu biết và tư duy: Đặt câu hỏi khám phá lịch sử, địa lí, khoa học, nghệ thuật để mở mang tri thức.\nLưu ý: KHÔNG dùng AI để làm thay toàn bộ bài tập hay sao chép thụ động.\n\n2. CÔNG THỨC VIẾT CÂU LỆNH (PROMPT) 3 THÀNH PHẦN (Hình 2.3 SGK):\n[1. BỐI CẢNH (NGỮ CẢNH)] + [2. VAI TRÒ CỦA AI] + [3. YÊU CẦU & ĐỊNH DẠNG CỤ THỂ]\n• Ví dụ chưa rõ (Câu lệnh A): “Nước tuần hoàn thế nào?”\n• Ví dụ đạt chuẩn (Câu lệnh B): “Em là học sinh lớp 6. Hãy đóng vai một giáo viên Khoa học tự nhiên, giải thích ngắn gọn quá trình tuần hoàn của nước trong tự nhiên bằng ngôn ngữ dễ hiểu trong 4 câu kèm 1 ví dụ thực tế.”\n\n3. CẨM NANG “4 KHÔNG” BẢO VỆ DỮ LIỆU CÁ NHÂN KHI TƯƠNG TÁC VỚI AI:\n1. KHÔNG nhập họ tên đầy đủ và ngày tháng năm sinh của bản thân hoặc người thân.\n2. KHÔNG cung cấp số điện thoại, địa chỉ nhà riêng hoặc tên trường, lớp đang học.\n3. KHÔNG tải lên hình ảnh khuôn mặt riêng tư hoặc các thông tin bí mật của gia đình.\n4. KHÔNG nhập mật khẩu tài khoản học tập, thư điện tử hoặc mạng xã hội vào ô trò chuyện AI.'
      },
      {
        id: 'ai6-b2-act-4',
        moduleId: 'module-lesson-2',
        title: 'Hoạt động 2B (Trắc nghiệm chốt chặn ≥ 7/10đ): “Bí kíp giao tiếp với AI” & Bài tập SGK (5 câu · 8 phút)',
        type: 'quiz',
        durationMinutes: 8,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 7,
        timeLimitMinutes: 8,
        shuffleQuestions: false,
        description: 'Bài trắc nghiệm củng cố Hoạt động 2B (5 câu, ngưỡng đạt ≥ 7/10 điểm): 3 lợi ích của AI, công thức câu lệnh 3 thành phần, Cẩm nang 4 KHÔNG và 2 câu kiểm tra SGK Bài 2. Câu hỏi khác với 3 câu neo chặn trong video. Sau khi nộp bài, em nhận phản hồi riêng cho từng phương án.',
        quizQuestions: [
          {
            id: 'ai6-b2-q1b',
            question: 'Câu 1 (SGK Bài 2 – Mục 1): Bạn Khoa dùng công cụ AI để luyện phát âm tiếng Anh và tự sửa lỗi chính tả trong bài viết. Đây là lợi ích nào của AI trong học tập?',
            options: [
              'Hỗ trợ học hỏi kiến thức mới',
              'Rèn luyện kĩ năng học tập',
              'Mở rộng hiểu biết và tư duy',
              'Làm bài tập thay cho học sinh'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Học kiến thức mới là khi AI giải thích khái niệm khó bằng ví dụ dễ hiểu; ở đây Khoa đang luyện tập kĩ năng.',
              'Chính xác! Luyện phát âm, sửa lỗi chính tả, tự tạo câu hỏi ôn tập đều là rèn luyện kĩ năng học tập.',
              'Mở rộng hiểu biết là khám phá thêm kiến thức Khoa học, Lịch sử, Nghệ thuật…; ở đây Khoa đang luyện kĩ năng.',
              'AI không làm bài thay học sinh; Khoa vẫn tự luyện tập và tự sửa bài của mình.'
            ],
            explanation: 'Ba lợi ích của AI khi dùng đúng cách: hỗ trợ học kiến thức mới; rèn luyện kĩ năng học tập (luyện phát âm, sửa chính tả, tạo câu hỏi ôn tập); mở rộng hiểu biết và tư duy.'
          },
          {
            id: 'ai6-b2-q2b',
            question: 'Câu 2 (Công thức câu lệnh): Trong câu lệnh “Em là học sinh lớp 6. Hãy đóng vai giáo viên Toán. Giải thích phân số là gì trong 3 câu kèm 1 ví dụ.”, phần “Hãy đóng vai giáo viên Toán” là thành phần nào?',
            options: [
              'Bối cảnh (Ngữ cảnh)',
              'Vai trò của AI',
              'Yêu cầu và định dạng cụ thể',
              'Thông tin cá nhân của người học'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Bối cảnh là phần cho AI biết em là ai: “Em là học sinh lớp 6”.',
              'Chính xác! Giao cho AI đóng vai ai (giáo viên, chuyên gia…) là thành phần Vai trò.',
              'Yêu cầu và định dạng là phần “Giải thích phân số là gì trong 3 câu kèm 1 ví dụ”.',
              'Câu lệnh này không có thông tin cá nhân nào – đúng với Cẩm nang 4 KHÔNG.'
            ],
            explanation: 'Câu lệnh rõ ràng gồm 3 thành phần: Bối cảnh (em là ai) + Vai trò của AI (đóng vai ai) + Yêu cầu và định dạng cụ thể (làm gì, bao nhiêu câu).'
          },
          {
            id: 'ai6-b2-q3b',
            question: 'Câu 3 (Cẩm nang 4 KHÔNG): Khi trò chuyện với công cụ AI để học tập, thông tin nào sau đây em KHÔNG được nhập vào ô trò chuyện?',
            options: [
              '“Em là học sinh lớp 6.”',
              'Tên bài học em cần ôn tập',
              'Mật khẩu tài khoản học tập hoặc thư điện tử của em',
              'Số câu em muốn AI trả lời'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Đây là thông tin học tập chung, không làm lộ danh tính của em, nên được phép nhập.',
              'Tên bài học là thông tin học tập chung, giúp AI trả lời đúng nội dung.',
              'Chính xác! KHÔNG nhập mật khẩu tài khoản học tập, thư điện tử hoặc mạng xã hội vào ô trò chuyện AI.',
              'Số câu muốn AI trả lời là yêu cầu về định dạng, giúp câu lệnh rõ ràng hơn.'
            ],
            explanation: 'Cẩm nang 4 KHÔNG: không nhập họ tên và ngày sinh; không cung cấp số điện thoại, địa chỉ, tên trường lớp; không tải ảnh khuôn mặt hay bí mật gia đình; không nhập mật khẩu tài khoản.'
          },
          {
            id: 'ai6-b2-q4',
            question: 'Câu 4 (SGK Bài 2 – Mục 2): Câu lệnh nào được viết rõ ràng, đủ ngữ cảnh và phù hợp nhất để hỗ trợ học sinh lớp 6 ôn tập môn Tiếng Anh?',
            options: [
              '“Làm giúp em toàn bộ bài tập Tiếng Anh lớp 6 hôm nay thật nhanh và đầy đủ để em chép nộp.”',
              '“Em là học sinh lớp 6, hãy đưa ra 5 từ vựng tiếng Anh về chủ đề Trường học kèm nghĩa tiếng Việt và một câu ví dụ đơn giản cho mỗi từ.”',
              '“Cho 5 từ vựng tiếng Anh chủ đề Trường học bất kì, không cần giải thích hay lấy ví dụ.”',
              '“Em tên là Nguyễn Minh An học lớp 6A1 trường THCS A, hãy dịch giúp em bài văn Tiếng Anh.”'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Nhờ AI làm thay toàn bộ bài tập để chép nộp là lạm dụng AI, làm giảm tư duy độc lập của người học.',
              'Chính xác! Đủ ngữ cảnh (học sinh lớp 6), nhiệm vụ rõ ràng (5 từ vựng chủ đề Trường học) và định dạng cụ thể (kèm nghĩa + 1 câu ví dụ đơn giản).',
              'Câu lệnh thiếu ngữ cảnh trình độ lớp 6 và bỏ qua giải thích/ví dụ nên khó giúp học sâu và hiểu cách dùng từ.',
              'Vi phạm Cẩm nang “4 KHÔNG”: để lộ họ tên đầy đủ và tên trường, lớp đang học vào ô trò chuyện AI!'
            ],
            explanation: 'Câu lệnh hiệu quả cho HS lớp 6 phải có ngữ cảnh trình độ, yêu cầu học tập rõ ràng, định dạng cụ thể và bảo vệ dữ liệu cá nhân.'
          },
          {
            id: 'ai6-b2-q5',
            question: 'Câu 5 (SGK Bài 2 – Luyện tập 1): Trường hợp nào dưới đây KHÔNG phải là cách sử dụng công cụ AI đúng mục đích để phát triển bản thân trong học tập?',
            options: [
              'Nhờ AI giải thích khái niệm “Quang hợp” bằng ví dụ dễ hiểu cho lớp 6 rồi tự tóm tắt lại vào vở',
              'Nhờ AI tạo 4 câu hỏi trắc nghiệm về bài Lịch sử vừa học để tự ôn tập và kiểm tra kiến thức',
              'Nhập toàn bộ đề bài văn biểu cảm vào AI rồi sao chép nguyên văn bài AI viết để nộp lấy điểm',
              'Nhờ AI gợi ý dàn ý 3 phần cho bài thuyết trình nhóm để cả nhóm thảo luận và tự triển khai nội dung'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Đây là cách dùng AI ĐÚNG mục đích (hỗ trợ học hỏi kiến thức mới kết hợp tự tóm tắt lại bằng lời mình).',
              'Đây là cách dùng AI ĐÚNG mục đích (rèn luyện kĩ năng và tự kiểm tra kiến thức).',
              'Chính xác! Sao chép nguyên văn bài do AI viết thay mình là lạm dụng AI, vi phạm tính trung thực và làm thui chột khả năng tư duy.',
              'Dùng AI gợi ý dàn ý rồi tự thảo luận và phát triển là cách dùng AI đúng vai trò hỗ trợ.'
            ],
            explanation: 'Theo SGK Bài 2: Không sử dụng AI để làm thay toàn bộ nhiệm vụ học tập; người học cần chủ động suy nghĩ, kiểm chứng và rèn luyện.'
          }
        ]
      },
      {
        id: 'ai6-b2-act-5',
        moduleId: 'module-lesson-2',
        title: 'Hoạt động 3 (Luyện tập – Assignment): Thực hành “Hỏi đúng – Trúng đáp án” trên Trạm AI an toàn (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Thực hành viết câu lệnh 3 thành phần trên SchoolAI Space (hoặc Trạm luyện Prompt trong Bộ học liệu số Bài 2), chụp ảnh màn hình minh chứng và nộp lên LMS.',
        assignmentPrompt: 'HOẠT ĐỘNG 3 – THỰC HÀNH “HỎI ĐÚNG – TRÚNG ĐÁP ÁN” (KHBD BÀI 2)\n\nBước 1 – Tuân thủ Cẩm nang “4 KHÔNG”: Không nhập họ tên đầy đủ, ngày sinh, số điện thoại, địa chỉ, tên trường lớp, ảnh khuôn mặt hay mật khẩu.\n\nBước 2 – Chọn 01 trong 03 chủ đề học tập lớp 6 sau và soạn câu lệnh theo đúng 3 thành phần (Bối cảnh + Vai trò + Yêu cầu & định dạng cụ thể):\n  • Chủ đề 1 (Lịch sử 6): Ý nghĩa lịch sử của Chiến thắng Bạch Đằng năm 938 do Ngô Quyền lãnh đạo.\n  • Chủ đề 2 (Khoa học tự nhiên 6): Giải thích vì sao Mặt Trăng có các hình dạng khác nhau (tròn, khuyết) khi quan sát từ Trái Đất.\n  • Chủ đề 3 (Địa lí 6): Nguyên nhân xảy ra hiện tượng ngày và đêm luân phiên trên Trái Đất.\n(Mẫu gợi ý: “Em là học sinh lớp 6. Hãy đóng vai một giáo viên Lịch sử, giải thích ngắn gọn ý nghĩa của Chiến thắng Bạch Đằng năm 938 trong khoảng 4 câu dễ hiểu.”)\n\nBước 3 – Chạy câu lệnh trên SchoolAI Space (qua Room Code giáo viên cung cấp) hoặc Trạm luyện câu lệnh ở Hoạt động đầu bài, chụp ảnh màn hình hiển thị đầy đủ câu lệnh + phản hồi AI, đặt tên tệp [HoTen]_[Lop]_Prompt.png và tải lên đây (hoặc dán câu lệnh + kết quả trực tiếp).\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 2):\n- Cấu trúc câu lệnh đủ 3 thành phần Bối cảnh – Vai trò – Yêu cầu/Định dạng (5,0đ)\n- Nội dung đúng chủ đề lớp 6, tiếng Việt có dấu, an toàn dữ liệu 4 KHÔNG (3,0đ)\n- Ảnh chụp minh chứng rõ nét, đúng quy cách tên tệp (2,0đ)'
      },
      {
        id: 'ai6-b2-act-6',
        moduleId: 'module-lesson-2',
        title: 'Hoạt động 4 (Vận dụng & Cầu nối Bài 3): “Nhà báo nhí tổng hợp tin tức” (Tóm tắt 3–5 câu + Đối chiếu SGK – Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Gấp màn hình AI, tự tóm tắt 3–5 câu kiến thức học thêm được bằng văn phong cá nhân kèm dòng đối chiếu SGK chuẩn bị sang Bài 3: Thực chứng thông tin – Làm chủ AI.',
        assignmentPrompt: 'HOẠT ĐỘNG 4 – “NHÀ BÁO NHÍ TỔNG HỢP TIN TỨC” & CẦU NỐI BÀI 3 (KHBD BÀI 2)\n\nNhiệm vụ 1 – Viết bản tin tóm tắt bằng chính lời văn của em:\nĐọc kĩ câu trả lời của AI ở Hoạt động 3, sau đó đóng cửa sổ trò chuyện AI, tự suy nghĩ và viết 01 đoạn văn ngắn từ 3 đến 5 câu tóm tắt điều em vừa học thêm được bằng văn phong cá nhân.\nQuy tắc tự chủ: Tuyệt đối KHÔNG sao chép (copy-paste) nguyên văn câu chữ của AI.\n\nNhiệm vụ 2 – Cầu nối chuẩn bị Bài 3 (Thực chứng thông tin – Làm chủ AI):\nMở Sách giáo khoa Lịch sử & Địa lí 6 hoặc Khoa học tự nhiên 6 để đối chiếu lại các sự kiện, con số trong câu trả lời của AI và ghi thêm 01 dòng nhận xét cuối bài:\n  “Em đã đối chiếu với SGK [Tên môn] trang [...] và thấy thông tin của AI [chính xác / cần chỉnh sửa ở điểm...].”\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 2):\n- Tính tự chủ, diễn đạt hoàn toàn bằng ngôn ngữ riêng, không copy-paste (5,0đ)\n- Dung lượng 3–5 câu, kiến thức chính xác và có ghi chú đối chiếu SGK (3,0đ)\n- Trình bày mạch lạc, viết hoa đầu câu, đúng chính tả và dấu câu (2,0đ)'
      }
    ]
  };

  const bai3Module = {
    id: 'module-lesson-3',
    courseId: '6AIAB01',
    order: 3,
    title: 'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
    description: 'Thời lượng: 01 tiết – 45 phút (Trực tiếp tại lớp kết hợp hỗ trợ trên hệ thống LMS – Mức Phân tích – Vận dụng, YCCĐ 6.A1.3).',
    learningObjectives: '• (6.A1.3) Giải thích được vì sao kết quả do AI cung cấp có thể không chính xác (hiện tượng “Ảo giác AI” / nguyên lý “Con vẹt ngẫu nhiên” – UNESCO 2023).\n• Thực hiện được việc kiểm tra, đối chiếu kết quả của AI qua 3 kênh đáng tin cậy (Sách giáo khoa, nguồn uy tín .gov.vn/.edu.vn, hỏi thầy cô hoặc cha mẹ).\n• Rèn thói quen chủ động thực chứng, giữ vai trò “con người quyết định cuối cùng” và không tin mù quáng vào kết quả AI.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b3-act-1',
        moduleId: 'module-lesson-3',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 3 – Thực chứng thông tin – Làm chủ AI',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai3/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 3: Thực chứng thông tin – Làm chủ AI (YCCĐ 6.A1.3 · 01 tiết Blended).'
      },
      {
        id: 'ai6-b3-act-2',
        moduleId: 'module-lesson-3',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): Trò chơi “Tin hay Không tin?” (Đoạn văn A & B về Trái Đất)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN BÀI 3 (45 PHÚT TRỰC TIẾP + LMS): Trước giờ đọc Sổ tay hướng dẫn & Kiến thức nền → Tại lớp (Khởi động 5p, Hình thành kiến thức 12p, Trò chơi biểu quyết “Phòng thí nghiệm thực chứng” & Phiếu Bạch Đằng 18p, Vận dụng 10p) → Sau giờ làm bài trắc nghiệm chốt chặn (≥ 8/10đ) & nộp bài Vận dụng.\n\nTÌNH HUỐNG KHỞI ĐỘNG (Hình 3.1 SGK Bài 3): Bạn Khoa hỏi công cụ AI về Trái Đất và nhận được hai đoạn văn:\n• Đoạn văn A: “Trái Đất có dạng hình cầu, quay quanh Mặt Trời và tự quay quanh trục hết khoảng 24 giờ tạo ra ngày và đêm.”\n• Đoạn văn B: “Trái Đất có dạng hình vuông, quay quanh Mặt Trăng và mỗi ngày dài đúng 36 giờ.”\n\nEm hãy thảo luận trên Diễn đàn:\n1. Đoạn văn nào chính xác, đoạn văn nào có lỗi sai? Dựa vào kiến thức đã học nào em nhận ra?\n2. Theo em, vì sao một công cụ AI đôi khi vẫn có thể viết ra những câu nghe rất trôi chảy nhưng lại sai sự thật?'
      },
      {
        id: 'ai6-b3-act-3',
        moduleId: 'module-lesson-3',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): “Ảo giác AI”, nguyên lý “Con vẹt ngẫu nhiên” & 3 Kênh kiểm chứng thông tin',
        type: 'document',
        durationMinutes: 12,
        isCompleted: false,
        isRequired: true,
        description: '1. VÌ SAO KẾT QUẢ CỦA AI CÓ THỂ KHÔNG CHÍNH XÁC? (SGK Bài 3 & UNESCO 2023):\n• AI hoạt động theo nguyên lý “Con vẹt ngẫu nhiên” (Stochastic Parrots): hệ thống dự đoán và ghép nối từ ngữ dựa trên xác suất thống kê từ kho dữ liệu đã học, chứ không thực sự hiểu ý nghĩa hay kiểm chứng sự thật như con người.\n• “Ảo giác AI” (AI Hallucination): là hiện tượng AI tự bịa đặt thông tin, mốc thời gian, nhân vật hoặc công thức sai sự thật nhưng diễn đạt bằng giọng điệu rất tự tin, trôi chảy.\n• Ngoài ra, dữ liệu huấn luyện có thể cũ, thiếu hụt, chưa cập nhật hoặc câu lệnh (Prompt) của người dùng chưa rõ ngữ cảnh.\n\n2. QUY TẮC 3 KÊNH KIỂM CHỨNG THÔNG TIN KHI DÙNG AI (Hình 3.3 SGK):\n• Kênh 1 – Sách giáo khoa & tài liệu chính thống: Đối chiếu ngay các mốc lịch sử, định nghĩa, công thức với SGK và tài liệu học tập chính thức.\n• Kênh 2 – Nguồn thông tin tin cậy trên Internet: Kiểm tra trên trang của cơ quan nhà nước (.gov.vn), tổ chức giáo dục (.edu.vn), viện nghiên cứu, bách khoa uy tín.\n• Kênh 3 – Hỏi thầy cô, cha mẹ hoặc tự kiểm tra lại: Hỏi người có chuyên môn; với bài toán cần thay kết quả vào đề để thử lại phép tính.\n\nNguyên tắc vàng: AI chỉ là công cụ tham khảo — con người luôn kiểm chứng và giữ quyền quyết định cuối cùng.'
      },
      {
        id: 'ai6-b3-act-4',
        moduleId: 'module-lesson-3',
        title: 'Hoạt động 4A (Trắc nghiệm chốt chặn ≥ 8/10đ): Ảo giác AI & 3 Kênh thực chứng thông tin (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 3 gồm 5 câu trắc nghiệm (thang 10 điểm, điều kiện đạt ≥ 8/10 điểm theo KHBD Bài 3). Đọc kĩ các phương án gần giống nhau trước khi chọn.',
        quizQuestions: [
          {
            id: 'ai6-b3-q1',
            question: 'Câu 1: Hiện tượng công cụ AI tự tạo ra thông tin sai sự thật, bịa đặt mốc thời gian hoặc sự kiện nhưng trình bày với văn phong rất tự tin, trôi chảy được gọi là gì?',
            options: [
              'Lỗi hiển thị phông chữ tiếng Việt của hệ thống AI khi bị nghẽn đường truyền mạng',
              'Hiện tượng “Ảo giác AI” (AI Hallucination) do AI ghép từ theo xác suất thay vì hiểu bản chất sự thật',
              'Quá trình AI tự động sáng tạo thêm chi tiết nghệ thuật nhằm giúp người đọc dễ ghi nhớ bài học hơn',
              'Hiện tượng “Bong bóng thông tin” (Filter Bubble) khiến AI chỉ trả lời lặp lại một chủ đề duy nhất'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Lỗi phông chữ hay nghẽn mạng chỉ ảnh hưởng cách hiển thị kí tự, không phải nguyên nhân khiến AI bịa đặt sự kiện sai sự thật.',
              'Chính xác! “Ảo giác AI” (AI Hallucination) xảy ra khi AI tự tạo thông tin không có thật nhưng viết nghe rất mạch lạc, thuyết phục.',
              'Trong học tập khoa học và lịch sử, việc AI bịa chi tiết không có thật là lỗi sai nghiêm trọng, không phải sáng tạo hữu ích.',
              '“Bong bóng thông tin” là hiện tượng của thuật toán gợi ý nội dung (Bài 4), khác với hiện tượng bịa đặt thông tin của AI.'
            ],
            explanation: 'Theo Mục 1 SGK Bài 3: “Ảo giác AI” là hiện tượng hệ thống AI tạo ra nội dung sai sự thật hoặc không tồn tại nhưng diễn đạt rất tự tin.'
          },
          {
            id: 'ai6-b3-q2',
            question: 'Câu 2: Theo báo cáo của UNESCO (2023), vì sao mô hình ngôn ngữ AI đôi khi được ví như “Con vẹt ngẫu nhiên” (Stochastic Parrots)?',
            options: [
              'Vì công cụ AI chỉ có khả năng đọc to văn bản bằng giọng nói giả lập chứ không hiển thị được chữ viết',
              'Vì AI chủ yếu dự đoán và ghép nối từ ngữ theo xác suất từ dữ liệu đã học mà không thực sự hiểu ý nghĩa hay kiểm chứng sự thật',
              'Vì AI tự động ghi nhớ nguyên văn từng trang sách giáo khoa mới nhất nên câu trả lời luôn khớp 100% thực tế',
              'Vì AI có khả năng suy luận độc lập như con người nhưng cố tình chọn đáp án ngẫu nhiên để kiểm tra người học'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'AI tạo sinh chủ yếu sinh văn bản; phép ẩn dụ “Con vẹt ngẫu nhiên” nói về cơ chế xử lí ngôn ngữ, không phải tính năng đọc thành tiếng.',
              'Chính xác! AI ghép các chuỗi từ hợp lí về mặt xác suất ngôn ngữ, chứ không hiểu bản chất thế giới thực hay tự đi xác minh sự thật.',
              'AI không lưu nguyên văn toàn bộ SGK mới nhất và rất dễ trộn lẫn hoặc làm sai lệch các con số, mốc lịch sử.',
              'AI không có ý thức hay ý định chủ quan để cố tình đánh đố người học.'
            ],
            explanation: 'Nguyên lý “Con vẹt ngẫu nhiên” (UNESCO 2023): AI dự đoán từ tiếp theo theo xác suất thống kê mà không có sự thấu hiểu thực tế.'
          },
          {
            id: 'ai6-b3-q3',
            question: 'Câu 3: Khi AI cung cấp một đoạn tóm tắt về Chiến thắng Bạch Đằng năm 938 có vài chi tiết khiến em nghi ngờ, nguồn nào dưới đây là ĐÁNG TIN CẬY NHẤT để kiểm chứng trước tiên?',
            options: [
              'Hỏi lại chính công cụ AI đó xem thông tin nó vừa viết có chính xác hay không',
              'Đối chiếu trực tiếp với Sách giáo khoa Lịch sử và Địa lí 6 hoặc trang thông tin chính thống có tên miền .gov.vn, .edu.vn',
              'Đọc các bình luận có nhiều lượt thích nhất dưới một video ngắn trên mạng xã hội',
              'Dùng một công cụ AI miễn phí khác viết lại đoạn văn đó cho mượt mà hơn rồi tin theo bản mới'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Hỏi lại chính công cụ AI đó không đảm bảo loại bỏ ảo giác vì AI vẫn có thể tự khẳng định sai hoặc tiếp tục bịa chi tiết khác.',
              'Chính xác! Sách giáo khoa và các cổng thông tin chính thống (.gov.vn, .edu.vn) đã qua thẩm định khoa học, là kênh kiểm chứng chuẩn nhất.',
              'Số lượt thích trên mạng xã hội không phản ánh độ chính xác khoa học hay lịch sử.',
              'Chuyển sang công cụ AI khác để viết lại mượt hơn không thay thế được việc đối chiếu với nguồn tri thức chính thống.'
            ],
            explanation: 'Trong 3 kênh kiểm chứng thông tin (SGK Bài 3), Sách giáo khoa và nguồn chính thống (.gov.vn, .edu.vn) là căn cứ đáng tin cậy hàng đầu.'
          },
          {
            id: 'ai6-b3-q4',
            question: 'Câu 4: Bộ “3 kênh kiểm chứng thông tin” cơ bản dành cho học sinh lớp 6 khi đối chiếu kết quả do AI cung cấp gồm những kênh nào?',
            options: [
              'Hỏi lại AI lần hai – Kiểm tra độ dài câu trả lời – Đếm số từ khóa chuyên môn trong bài',
              'Sách giáo khoa & tài liệu chính thống – Nguồn tin cậy (.gov.vn, .edu.vn, từ điển) – Hỏi thầy cô, cha mẹ hoặc tự kiểm tra lại',
              'Mạng xã hội nhiều người theo dõi – Hội nhóm trò chơi trực tuyến – Ý kiến đoán của bạn cùng lớp',
              'Gõ lại câu lệnh bằng tiếng Anh – Dùng công cụ dịch tự động – Lưu lại màn hình để nộp ngay'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Độ dài câu trả lời hay số từ chuyên môn không chứng minh được tính đúng đắn của thông tin.',
              'Chính xác! Em đã ghi nhớ trọn vẹn 3 kênh thực chứng thông tin chuẩn theo Hình 3.3 SGK Bài 3.',
              'Mạng xã hội và suy đoán cảm tính chưa qua thẩm định dễ lan truyền thông tin sai lệch.',
              'Dịch sang ngôn ngữ khác không làm biến mất sai sót về mặt kiến thức nếu AI đã bịa dữ kiện.'
            ],
            explanation: '3 kênh kiểm chứng chuẩn (SGK Bài 3): (1) Sách giáo khoa; (2) Nguồn tin cậy (.gov.vn, .edu.vn, tài liệu chính thống); (3) Thầy cô, cha mẹ và tự thử lại.'
          },
          {
            id: 'ai6-b3-q5',
            question: 'Câu 5: Khi giải một bài toán tìm x, công cụ AI giải thích các bước rất dài và kết luận x = 10. Tuy nhiên, khi em thay x = 10 vào biểu thức ban đầu thì hai vế KHÔNG bằng nhau. Cách xử lí nào thể hiện đúng năng lực làm chủ AI?',
            options: [
              'Vẫn chép kết quả x = 10 vào vở vì AI là phần mềm máy tính nên chắc chắn tính đúng hơn học sinh lớp 6',
              'Tin vào phép kiểm tra lại của bản thân, tìm chỗ sai trong lời giải của AI, tự tính lại và nhờ thầy cô xác nhận nếu cần',
              'Thay đổi đề bài ban đầu sao cho khi thay x = 10 vào thì hai vế bằng nhau để khớp với AI',
              'Hỏi lại AI nhưng không chỉ ra chỗ sai rồi chép nguyên văn con số mới AI đưa ra mà không thử lại'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'AI vẫn thường mắc lỗi trong các bước suy luận toán học nhiều bước; không bao giờ được tin mù quáng khi phép thử đã chứng minh sai.',
              'Xuất sắc! Phép thử lại bằng chính tư duy toán học của em là bằng chứng thực chứng rõ ràng nhất — con người luôn giữ quyền quyết định cuối cùng.',
              'Sửa đề bài để chiều theo kết quả sai của AI là sai nguyên tắc học tập trung thực và khoa học.',
              'Nếu không tự kiểm tra lại kết quả mới, em vẫn có nguy cơ tiếp tục chép đáp án sai từ AI.'
            ],
            explanation: 'SGK Bài 3 (Luyện tập & Vận dụng): Khi tự kiểm chứng phát hiện AI sai, học sinh phải tin kết quả kiểm chứng đúng, rà lại phép tính và trao đổi với thầy cô.'
          }
        ]
      },
      {
        id: 'ai6-b3-act-5',
        moduleId: 'module-lesson-3',
        title: 'Hoạt động 3 & 4B (Thực hành & Vận dụng): Đính chính Bạch Đằng 938, Quy tắc thực chứng & Cầu nối Bài 4 (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Hoàn thành Phiếu đính chính đoạn văn AI viết sai về Chiến thắng Bạch Đằng năm 938 (3 lỗi sai), viết Quy tắc thực chứng cá nhân, kiểm chứng 01 thông tin địa phương và trả lời câu hỏi cầu nối chuẩn bị Bài 4.',
        assignmentPrompt: 'NHIỆM VỤ THỰC HÀNH & VẬN DỤNG BÀI 3 (SGK & KHBD BÀI 3)\n\nPhần 1 – Đính chính đoạn văn AI viết sai về Chiến thắng Bạch Đằng năm 938:\nĐoạn văn do AI tạo: “Năm 938, dưới sự lãnh đạo của Lý Thường Kiệt, quân dân ta đã cắm cọc gỗ trên sông Hồng và đánh tan quân xâm lược Mông Cổ, mở ra thời kì độc lập lâu dài.”\n→ Em hãy chỉ rõ ĐỦ 3 LỖI SAI trong đoạn văn trên, sửa lại cho chính xác theo SGK Lịch sử và Địa lí 6 và ghi rõ kênh em đã dùng để kiểm chứng.\n\nPhần 2 – Quy tắc thực chứng thông tin cá nhân & Kiểm chứng thực tế địa phương:\n1. Viết 01 Quy tắc thực chứng ngắn gọn (1–2 câu) để nhắc bản thân luôn kiểm tra thông tin do AI đưa ra trước khi sử dụng.\n2. Chọn 01 thông tin lịch sử, địa lí hoặc khoa học quen thuộc ở địa phương em (hoặc bài học lớp 6), nêu rõ 02 kênh đáng tin cậy em sẽ dùng để đối chiếu nếu AI đưa ra kết quả về thông tin đó.\n\nPhần 3 – Nhiệm vụ cầu nối chuẩn bị Bài 4 (Mặt tích cực và tiêu cực của tính năng AI):\nKhi em xem video hoặc tìm kiếm thông tin trên mạng, các nền tảng có AI thường tự động đề xuất hàng loạt nội dung giống sở thích của em. Theo em, tính năng gợi ý đó mang lại lợi ích gì và có thể gây ra hạn chế nào?\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 3):\n- Phát hiện & đính chính chính xác đủ 3 lỗi Bạch Đằng 938 kèm nguồn đối chiếu (4,0đ)\n- Quy tắc thực chứng cá nhân & kế hoạch kiểm chứng 2 kênh thực tế rõ ràng, khả thi (4,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 4, trình bày mạch lạc, đúng chính tả (2,0đ)'
      }
    ]
  };

  const bai4Module = {
    id: 'module-lesson-4',
    courseId: '6AIAB01',
    order: 4,
    title: 'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
    description: 'Thời lượng: 01 tiết – 45 phút (Dạy học trực tuyến trên hệ thống LMS – Mức Phân tích – Vận dụng, YCCĐ 6.B1.1).',
    learningObjectives: '• (6.B1.1) Chỉ ra được mặt tích cực và hạn chế của một số tính năng AI phổ biến: thu thập dữ liệu để gợi ý nội dung (Recommender Systems vs Filter Bubbles), nhận diện khuôn mặt/giọng nói, tạo sinh văn bản/hình ảnh.\n• Hiểu cơ chế thuật toán gợi ý hình thành “bong bóng thông tin” (DP-REG 2023) và nguy cơ đối với quyền riêng tư cá nhân.\n• Đề xuất được ít nhất 02 thao tác kĩ thuật khả thi giúp kiểm soát thuật toán gợi ý và bảo vệ quyền riêng tư số.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b4-act-1',
        moduleId: 'module-lesson-4',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 4 – Khám phá mặt tích cực và tiêu cực của một số tính năng AI',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai4/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 4: Mặt tích cực và tiêu cực của một số tính năng AI (YCCĐ 6.B1.1 · 01 tiết Trực tuyến).'
      },
      {
        id: 'ai6-b4-act-2',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): Quan sát “Trang chủ video của em” & Tình huống An–Minh–Khoa (Hình 4.1)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 CHẶNG (45 PHÚT TRỰC TUYẾN): (1) Khởi động 5p → (2) Video có 3 câu neo chặn, sơ đồ trực quan & Kiến thức trọng tâm 15p → (3) Trắc nghiệm chốt chặn 5 câu ≥ 8/10đ (15p) → (4) Vận dụng 2 thao tác kĩ thuật & Cầu nối Bài 5 (10p).\n\nNHIỆM VỤ KHỞI ĐỘNG (Gắn tình huống An, Minh, Khoa – Hình 4.1 SGK Bài 4):\n1. Mở trang chủ YouTube của em và quan sát 10 video đầu tiên: có bao nhiêu video trùng khớp với chủ đề em vừa xem hoặc tìm kiếm gần đây?\n2. Em hãy viết 1–2 câu chia sẻ cảm nhận của bản thân: tính năng tự động đề xuất video đúng sở thích mang lại sự tiện lợi gì, và có khiến em băn khoăn điều gì không?'
      },
      {
        id: 'ai6-b4-act-video',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 2 – Nhiệm vụ 1 (Video): Cơ chế thuật toán gợi ý – Vì sao ứng dụng biết em muốn gì? (05:47 · 3 câu neo chặn)',
        type: 'video',
        durationMinutes: 7,
        isCompleted: false,
        isRequired: true,
        videoUrl: 'https://www.youtube.com/watch?v=Wl5Hb2cfIh0',
        videoDuration: 347,
        preventVideoSkip: true,
        description: 'Em xem video giải thích cách thuật toán gợi ý thu thập hành vi người dùng (lượt nhấp, thời gian dừng màn hình, lượt thích, lịch sử tìm kiếm) để đoán em muốn gì. Video sẽ tự dừng ở 3 điểm để em trả lời câu hỏi; em cần trả lời đúng mới xem tiếp được. Xem xong, em đối chiếu với Mục 1 và Mục 2 SGK Bài 4 về hai mặt của tính năng AI.',
        videoCheckpoints: [
          {
            id: 'b4-cp1',
            timeSeconds: 88,
            question: 'Vì sao ứng dụng mua sắm gợi ý đúng món đồ em đang cần?',
            options: [
              'Vì ứng dụng nghe lén cuộc trò chuyện của em qua micro.',
              'Vì hệ thống phân tích hành vi của em như tìm kiếm, nhấp xem, thời gian dừng lại và những món đã mua trước đó.',
              'Vì đó là sự trùng hợp ngẫu nhiên.'
            ],
            correctAnswer: 1,
            explanation: 'Thuật toán gợi ý không cần nghe lén: nó học từ dữ liệu hành vi em để lại khi dùng ứng dụng để dự đoán nhu cầu của em.',
            requireCorrect: true
          },
          {
            id: 'b4-cp2',
            timeSeconds: 171,
            question: 'Hệ thống kết nối các sản phẩm với nhau để làm gì?',
            options: [
              'Để xóa bớt những sản phẩm em không mua.',
              'Để tăng giá các sản phẩm được nhiều người xem.',
              'Để từ món em đã xem hoặc đã mua, gợi ý thêm những món có liên quan.'
            ],
            correctAnswer: 2,
            explanation: 'Nhờ “bản đồ” kết nối giữa các sản phẩm, hệ thống tìm ra những món liên quan đến điều em quan tâm để gợi ý tiếp.',
            requireCorrect: true
          },
          {
            id: 'b4-cp3',
            timeSeconds: 335,
            question: 'Tính năng gợi ý cá nhân hóa có hai mặt. Ý nào nêu đúng cả hai mặt đó?',
            options: [
              'Giúp em tìm đúng thứ cần nhanh hơn, nhưng hệ thống thu thập nhiều dữ liệu hành vi và có thể khiến em xem hoặc mua nhiều hơn dự định.',
              'Chỉ có lợi, không có hạn chế nào.',
              'Chỉ có hại, nên không bao giờ dùng ứng dụng có gợi ý.'
            ],
            correctAnswer: 0,
            explanation: 'Mọi tính năng AI đều có hai mặt: tiết kiệm thời gian, nhưng ảnh hưởng quyền riêng tư và dễ tạo “bong bóng thông tin” nếu em không tự kiểm soát.',
            requireCorrect: true
          }
        ]
      },
      {
        id: 'ai6-b4-act-3',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Hệ thống gợi ý, “Bong bóng thông tin” (Filter Bubbles) & Hai mặt của 3 tính năng AI',
        type: 'document',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        description: '1. HỆ THỐNG GỢI Ý NỘI DUNG & “BONG BÓNG THÔNG TIN” (SGK Bài 4 & DP-REG 2023):\n• Hệ thống gợi ý (Recommender Systems) thu thập dữ liệu hành vi (lịch sử xem, thời gian dừng lại, lượt thích, tìm kiếm) để dự đoán và đề xuất nội dung phù hợp sở thích.\n• Mặt tích cực: Tiết kiệm thời gian tìm kiếm, nhanh chóng tiếp cận bài giảng, tài liệu và nội dung giải trí phù hợp nhu cầu.\n• Mặt hạn chế: Dễ tạo “Bong bóng thông tin” (Filter Bubbles) khiến người dùng bị thu hẹp góc nhìn trong một chiều thông tin; dễ cuốn vào chuỗi xem liên tục gây mất thời gian và tiềm ẩn nguy cơ thu thập dữ liệu hành vi quá mức, ảnh hưởng quyền riêng tư.\n\n2. HAI MẶT CỦA HAI TÍNH NĂNG AI PHỔ BIẾN KHÁC (Hình 4.2 SGK Bài 4):\n• Nhận diện khuôn mặt và giọng nói: Tích cực = mở khóa nhanh, tìm kiếm bằng giọng nói, hỗ trợ người khuyết tật; Hạn chế = dữ liệu sinh trắc học nếu rò rỉ hoặc thu thập không phép có thể bị lợi dụng giả mạo, xâm phạm quyền riêng tư.\n• AI tạo sinh văn bản và hình ảnh: Tích cực = hỗ trợ gợi ý ý tưởng, giải thích khái niệm, minh họa học tập nhanh; Hạn chế = có thể tạo thông tin sai lệch (ảo giác AI), tin giả, ảnh cắt ghép giả mạo hoặc khiến người học ỷ lại, giảm tư duy nếu lạm dụng.'
      },
      {
        id: 'ai6-b4-act-4',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 3 (Trắc nghiệm chốt chặn ≥ 8/10đ): Phân tích hai mặt tính năng AI & Bong bóng thông tin (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 4 (5 câu, thang 10 điểm, ngưỡng đạt ≥ 8/10 điểm) bao quát cơ chế thuật toán gợi ý, Filter Bubbles, phân loại hai mặt của 3 tính năng AI và thao tác kiểm soát thuật toán.',
        quizQuestions: [
          {
            id: 'ai6-b4-q1',
            question: 'Câu 1: Hệ thống gợi ý nội dung (Recommender Systems) trên YouTube hoặc nền tảng học tập dựa vào nguồn dữ liệu nào là chủ yếu để đoán sở thích của người dùng?',
            options: [
              'Chỉ dựa vào tên thương hiệu điện thoại và dung lượng pin còn lại của thiết bị người dùng',
              'Dữ liệu hành vi tương tác như lịch sử video đã xem, từ khóa tìm kiếm, lượt thích và thời gian dừng lại trên từng nội dung',
              'Chỉ dựa vào điểm số các môn học ở trường được lưu trong sổ liên lạc điện tử',
              'Lựa chọn hoàn toàn ngẫu nhiên các video mới tải lên trong ngày mà không cần ghi nhận lịch sử xem'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Hãng điện thoại hay phần trăm pin không cho biết người dùng thích xem nội dung khoa học, âm nhạc hay thể thao.',
              'Chính xác! Thuật toán gợi ý học trực tiếp từ dữ liệu hành vi (xem, tìm kiếm, thích, thời gian xem) để dự đoán và đề xuất nội dung tương tự.',
              'Các nền tảng video không có quyền truy cập vào sổ điểm nhà trường của học sinh.',
              'Nếu chọn ngẫu nhiên hoàn toàn thì trang chủ sẽ không trùng khớp với các chủ đề em vừa xem gần đây.'
            ],
            explanation: 'Cơ chế Recommender Systems (SGK Bài 4): Thu thập và phân tích dữ liệu hành vi người dùng để cá nhân hóa danh sách nội dung đề xuất.'
          },
          {
            id: 'ai6-b4-q2',
            question: 'Câu 2: Hiện tượng “Bong bóng thông tin” (Filter Bubble – DP-REG 2023) xảy ra khi sử dụng hệ thống gợi ý AI được hiểu chính xác nhất là gì?',
            options: [
              'Màn hình điện thoại hiển thị nhiều khung thông báo quảng cáo che kín phần nội dung video đang xem',
              'Thuật toán liên tục đẩy các nội dung lặp lại một chiều theo sở thích cũ khiến người dùng ít có cơ hội tiếp cận kiến thức và góc nhìn đa dạng khác',
              'Hệ thống AI tự động lọc bỏ toàn bộ tin giả và chỉ giữ lại các bài giảng sách giáo khoa chuẩn xác trên Internet',
              'Đường truyền Internet bị quá tải khiến danh sách video gợi ý không thể tải tiếp các nội dung mới'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Khung quảng cáo che màn hình là vấn đề giao diện quảng cáo, không phải bản chất của “Bong bóng thông tin”.',
              'Chính xác! “Bong bóng thông tin” (Filter Bubble) bao bọc người dùng trong một nhóm chủ đề hẹp lặp đi lặp lại, làm thu hẹp góc nhìn.',
              'Thuật toán gợi ý tối ưu theo mức độ thu hút sự chú ý chứ không tự động lọc sạch tin giả hay chỉ giữ lại bài giảng SGK.',
              'Filter Bubble là hiện tượng do thuật toán cá nhân hóa tạo ra, không phải lỗi đường truyền mạng.'
            ],
            explanation: 'Theo DP-REG (2023) & SGK Bài 4: “Bong bóng thông tin” khiến người dùng chỉ thấy những nội dung giống sở thích đã xem, hạn chế tư duy đa chiều.'
          },
          {
            id: 'ai6-b4-q3',
            question: 'Câu 3: Trong các tình huống sau đây, trường hợp nào phản ánh MẶT HẠN CHẾ của tính năng nhận diện khuôn mặt hoặc giọng nói bằng AI?',
            options: [
              'Người khiếm thị sử dụng tính năng điều khiển bằng giọng nói để nghe đọc tài liệu học tập thuận tiện hơn',
              'Mở khóa điện thoại nhanh chóng bằng khuôn mặt chủ nhân mà không cần gõ mật khẩu mỗi lần sử dụng',
              'Một ứng dụng giải trí miễn phí thu thập ảnh khuôn mặt và mẫu giọng nói không rõ mục đích, tiềm ẩn nguy cơ bị đánh cắp hoặc giả mạo',
              'Ứng dụng học ngoại ngữ nghe giọng đọc của học sinh để góp ý cách phát âm chuẩn từng từ vựng'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Hỗ trợ người khiếm thị tiếp cận tri thức là mặt tích cực rất nhân văn của AI nhận diện giọng nói.',
              'Tiện lợi khi mở khóa thiết bị cá nhân là mặt tích cực của tính năng nhận diện khuôn mặt.',
              'Chính xác! Dữ liệu khuôn mặt và giọng nói gắn liền với danh tính cá nhân; nếu bị thu thập mập mờ sẽ gây rủi ro lớn về quyền riêng tư và giả mạo.',
              'Hỗ trợ rèn luyện phát âm ngoại ngữ là mặt tích cực của AI trong học tập.'
            ],
            explanation: 'Mục 2 SGK Bài 4: Tính năng nhận diện khuôn mặt/giọng nói rất tiện ích nhưng tiềm ẩn rủi ro lộ dữ liệu sinh trắc học và giả mạo nếu thiếu kiểm soát.'
          },
          {
            id: 'ai6-b4-q4',
            question: 'Câu 4: Nhận định nào sau đây đánh giá ĐÚNG VÀ CÂN BẰNG NHẤT về hai mặt của công cụ AI tạo sinh văn bản, hình ảnh trong học tập?',
            options: [
              'AI tạo sinh chỉ mang lại lợi ích tuyệt đối vì giúp rút ngắn thời gian hoàn thành mọi bài tập mà không có rủi ro nào',
              'AI tạo sinh hoàn toàn có hại nên học sinh cần tránh sử dụng mọi tính năng gợi ý hay minh họa từ AI',
              'AI tạo sinh giúp gợi ý ý tưởng và trực quan hóa kiến thức nhanh, nhưng có thể tạo thông tin sai lệch hoặc làm giảm năng lực tự tư duy nếu học sinh lạm dụng',
              'AI tạo sinh chỉ có hạn chế ở tốc độ xử lí chậm, còn nội dung văn bản và hình ảnh tạo ra luôn đảm bảo độ chính xác khoa học'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Đánh giá một chiều! AI tạo sinh vẫn có rủi ro ảo giác thông tin, ảnh giả mạo và nguy cơ khiến người học lệ thuộc.',
              'Đánh giá cực đoan! Nếu sử dụng có kiểm chứng và đúng mục đích (Bài 2–3), AI tạo sinh là công cụ hỗ trợ học tập rất tốt.',
              'Chính xác! Đánh giá khách quan cả hai mặt giúp học sinh tận dụng ưu điểm đồng thời chủ động phòng ngừa mặt hạn chế.',
              'Hạn chế lớn của AI tạo sinh không phải tốc độ, mà là nguy cơ sai sự thật (ảo giác AI) và thói quen ỷ lại.'
            ],
            explanation: 'Kiến thức trọng tâm Bài 4: Mỗi tính năng AI đều có hai mặt tích cực và hạn chế; người dùng thông minh cần nhận diện rõ để sử dụng an toàn, hiệu quả.'
          },
          {
            id: 'ai6-b4-q5',
            question: 'Câu 5: Khi nhận thấy trang chủ video của mình chỉ toàn các clip trò chơi lặp đi lặp lại khiến em dễ mất tập trung học tập, nhóm thao tác kĩ thuật nào sau đây giúp kiểm soát thuật toán gợi ý và phá vỡ “bong bóng thông tin” HIỆU QUẢ NHẤT?',
            options: [
              'Tăng âm lượng thiết bị và nhấp xem thật nhanh nhiều video trò chơi khác nhau để làm mới danh sách',
              'Xóa lịch sử xem/tìm kiếm định kì, tắt Tự động phát (Autoplay) và chủ động gõ từ khóa tìm kiếm các chủ đề khoa học, học tập đa dạng',
              'Đăng xuất rồi tạo thêm nhiều tài khoản mới nhưng vẫn tiếp tục xem lại các video trò chơi cũ ngay sau đó',
              'Tắt kết nối Wi-Fi trong 5 phút rồi bật lại để thuật toán tự động xóa sạch dữ liệu hành vi cũ'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Càng nhấp xem thêm nhiều video trò chơi, thuật toán càng ghi nhận tín hiệu quan tâm và đẩy nội dung trò chơi dày đặc hơn.',
              'Xuất sắc! Xóa lịch sử làm sạch dữ liệu đầu vào, tắt Autoplay ngắt chuỗi cuốn hút liên hoàn, và tìm kiếm đa chiều giúp mở rộng luồng gợi ý.',
              'Nếu hành vi xem vẫn lặp lại một chiều thì tài khoản mới cũng sẽ nhanh chóng hình thành bong bóng thông tin tương tự.',
              'Tắt rồi bật lại Wi-Fi không xóa lịch sử hành vi vốn đã được lưu trên tài khoản của nền tảng.'
            ],
            explanation: '5 thao tác kĩ thuật chuẩn (KHBD Bài 4): Xóa lịch sử xem/tìm kiếm, tắt Autoplay, dùng Chế độ Ẩn danh khi cần, chủ động tìm kiếm đa chiều, tắt cá nhân hóa quảng cáo.'
          }
        ]
      },
      {
        id: 'ai6-b4-act-5',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 4 (Vận dụng & Cầu nối Bài 5): Đề xuất 2 thao tác kĩ thuật kiểm soát thuật toán gợi ý & bảo vệ quyền riêng tư (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Đề xuất 02 thao tác kĩ thuật khả thi kiểm soát thuật toán gợi ý / bảo vệ quyền riêng tư kèm giải thích cơ sở khoa học và hoàn thành câu hỏi cầu nối chuẩn bị Bài 5 (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 4 & CẦU NỐI BÀI 5 (KHBD BÀI 4)\n\nTình huống: Bạn của em chia sẻ rằng mỗi tối lên mạng tìm tài liệu học tập chỉ định xem 10 phút, nhưng cứ bị cuốn theo danh sách video giải trí tự động gợi ý đến khuya và còn thường xuyên thấy quảng cáo bám đuổi theo các từ khóa vừa tìm.\n\nEm hãy trình bày bài nộp gồm đầy đủ 3 phần:\n1. Thao tác kĩ thuật số 1 & Cơ sở khoa học: Nêu rõ tên thao tác, cách thực hiện trên thiết bị/ứng dụng và giải thích vì sao thao tác đó giúp kiểm soát thuật toán gợi ý hoặc bảo vệ quyền riêng tư.\n2. Thao tác kĩ thuật số 2 & Cơ sở khoa học: Nêu rõ thao tác kĩ thuật khả thi thứ hai kèm giải thích khoa học.\n3. Nhiệm vụ cầu nối chuẩn bị Bài 5 (Đánh giá độ an toàn của AI): Trước khi cài đặt hoặc đăng nhập một ứng dụng AI mới, em sẽ đặt câu hỏi kiểm tra nào để biết ứng dụng đó có an toàn và minh bạch về dữ liệu hay không?\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 4):\n- Đề xuất đủ 02 thao tác kĩ thuật cụ thể, khả thi trên thiết bị/tài khoản (4,0đ)\n- Giải thích rõ cơ sở khoa học gắn với cơ chế thu thập dữ liệu, bong bóng thông tin hoặc quyền riêng tư (4,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 5, trình bày mạch lạc, đúng chính tả (2,0đ)'
      }
    ]
  };

  const bai5Module = {
    id: 'module-lesson-5',
    courseId: '6AIAB01',
    order: 5,
    title: 'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
    description: 'Thời lượng: 01 tiết – 45 phút (Trực tiếp tại lớp kết hợp hỗ trợ trên hệ thống LMS – Mức Đánh giá – Vận dụng, YCCĐ 6.B2.1).',
    learningObjectives: '• (6.B2.1) Đặt được Bộ 4 câu hỏi kiểm tra tính an toàn và minh bạch của công cụ AI trước khi sử dụng (UNICEF 2021, U.S. Dept. of Education 2023).\n• Đọc hiểu được mục “An toàn dữ liệu” (Data Safety) / “Quyền riêng tư” (App Privacy) trên kho ứng dụng để nhận diện yêu cầu cấp quyền bất hợp lí (ví dụ ứng dụng chỉnh ảnh đòi Danh bạ và Vị trí chính xác).\n• So sánh và đưa ra nhận xét, quyết định lựa chọn công cụ AI an toàn, phù hợp lứa tuổi học sinh lớp 6.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b5-act-1',
        moduleId: 'module-lesson-5',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 5 – Đánh giá độ an toàn của Trí tuệ nhân tạo',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai5/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 5: Đánh giá độ an toàn của Trí tuệ nhân tạo (YCCĐ 6.B2.1 · 01 tiết Blended).'
      },
      {
        id: 'ai6-b5-act-2',
        moduleId: 'module-lesson-5',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): “Cài đặt hay Không cài đặt?” – Tình huống Ứng dụng A vs B (Hình 5.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'TÌNH HUỐNG KHỞI ĐỘNG (Hình 5.1 SGK Bài 5): An muốn cài một ứng dụng AI hỗ trợ học tiếng Anh trên điện thoại và thấy hai lựa chọn:\n• Ứng dụng A: Ghi rõ tên nhà phát triển giáo dục uy tín, công khai mục “An toàn dữ liệu” chỉ xin quyền Micro khi luyện nói, cho phép tắt lưu lịch sử giọng nói.\n• Ứng dụng B: Không rõ nhà phát triển, miễn phí kèm nhiều quảng cáo, vừa mở lên đã đòi quyền truy cập Danh bạ, Vị trí GPS chính xác và toàn bộ Thư viện ảnh.\n\nEm hãy thảo luận trên Diễn đàn:\n1. Nếu là An, em chọn cài đặt ứng dụng nào? Vì sao?\n2. Trước khi bấm “Cài đặt” một ứng dụng có tích hợp AI, em cần kiểm tra những dấu hiệu nào đầu tiên?'
      },
      {
        id: 'ai6-b5-act-3',
        moduleId: 'module-lesson-5',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Tính an toàn, Tính minh bạch (UNICEF 2021), Bộ 4 câu hỏi kiểm tra & Mục “An toàn dữ liệu”',
        type: 'document',
        durationMinutes: 12,
        isCompleted: false,
        isRequired: true,
        description: '1. HAI TIÊU CHÍ CỐT LÕI KHI ĐÁNH GIÁ CÔNG CỤ AI (UNICEF 2021 & SGK Bài 5):\n• Tính an toàn (Safety): Nội dung và cách hoạt động phù hợp lứa tuổi, không chứa nội dung độc hại, không gây rủi ro lộ lọt thông tin cá nhân hay thiệt hại cho người dùng.\n• Tính minh bạch (Transparency): Nhà phát triển công khai rõ ràng danh tính, mục đích sử dụng dữ liệu, quyền truy cập ứng dụng yêu cầu và cơ chế kiểm soát của người dùng.\n\n2. BỘ 4 CÂU HỎI KIỂM TRA TRƯỚC KHI SỬ DỤNG CÔNG CỤ AI (Hình 5.3 SGK):\n• Câu hỏi 1: Công cụ AI này có an toàn và phù hợp với lứa tuổi học sinh lớp 6 không?\n• Câu hỏi 2: Ứng dụng có yêu cầu thu thập thông tin cá nhân không cần thiết cho chức năng chính hay không?\n• Câu hỏi 3: Người dùng có thể chủ động tắt tính năng theo dõi hoặc xóa lịch sử hoạt động không?\n• Câu hỏi 4: Nhà phát triển và chính sách quyền riêng tư có được công khai rõ ràng, minh bạch không?\n\n3. KĨ NĂNG ĐỌC MỤC “AN TOÀN DỮ LIỆU” (DATA SAFETY / APP PRIVACY):\nLuôn kiểm tra phần “An toàn dữ liệu” (Google Play) hoặc “Quyền riêng tư của ứng dụng” (App Store) trước khi tải để phát hiện ngay các yêu cầu quyền bất hợp lí (ví dụ: ứng dụng chỉnh ảnh lại đòi quyền Danh bạ và Vị trí GPS chính xác).'
      },
      {
        id: 'ai6-b5-act-4',
        moduleId: 'module-lesson-5',
        title: 'Hoạt động 4A (Trắc nghiệm chốt chặn ≥ 8/10đ): Kiểm định độ an toàn và minh bạch của ứng dụng AI (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Ngân hàng 5 câu trắc nghiệm chốt chặn chuẩn theo Học liệu số Bài 5 (thang 10 điểm, ngưỡng đạt ≥ 8/10 điểm). Đọc kĩ các phương án nhiễu gần giống nhau để chọn đáp án chuẩn xác nhất.',
        quizQuestions: [
          {
            id: 'ai6-b5-q1',
            question: 'Câu 1: Theo hướng dẫn của UNICEF (2021) và SGK Bài 5, “Tính minh bạch” (Transparency) của một công cụ AI được hiểu chính xác nhất là gì?',
            options: [
              'Ứng dụng có giao diện màu trắng trong suốt, hiển thị rõ chữ viết và không chứa hình nền phức tạp',
              'Công cụ công khai rõ ràng nhà phát triển, mục đích thu thập – sử dụng dữ liệu và cho người dùng biết AI đang hoạt động như thế nào',
              'Ứng dụng cho phép mọi người dùng tải về hoàn toàn miễn phí mà không cần tạo tài khoản đăng nhập',
              'Công cụ công khai toàn bộ tin nhắn và lịch sử học tập của người dùng này cho những người dùng khác cùng xem'
            ],
            correctAnswer: 1,
            optionFeedback: [
              '“Minh bạch” trong đạo đức AI nói về sự rõ ràng về nhà phát triển và cách xử lí dữ liệu, không phải màu sắc giao diện.',
              'Chính xác! Tính minh bạch giúp người dùng và phụ huynh biết rõ ai tạo ra công cụ, thu thập dữ liệu gì và nhằm mục đích gì.',
              'Nhiều ứng dụng miễn phí không cần đăng nhập vẫn có thể thu thập dữ liệu ngầm thiếu minh bạch.',
              'Công khai lịch sử riêng tư của người dùng cho người khác xem là hành vi vi phạm nghiêm trọng quyền riêng tư!'
            ],
            explanation: 'UNICEF (2021) & SGK Bài 5: Tính minh bạch đòi hỏi công cụ AI công khai rõ ràng nhà phát triển, cơ chế hoạt động và mục đích xử lí dữ liệu.'
          },
          {
            id: 'ai6-b5-q2',
            question: 'Câu 2: Một ứng dụng chỉnh sửa ảnh tích hợp AI (ví dụ ứng dụng tạo hiệu ứng ảnh chân dung) yêu cầu cấp quyền truy cập “Danh bạ điện thoại” và “Vị trí GPS chính xác liên tục”. Em nên đánh giá yêu cầu này như thế nào?',
            options: [
              'Hợp lí vì mọi ứng dụng trên điện thoại đều cần danh bạ và vị trí để hoạt động ổn định, không bị thoát đột ngột',
              'Bất hợp lí vì chức năng chỉnh sửa ảnh chỉ cần quyền truy cập ảnh được chọn; đòi Danh bạ và Vị trí là thu thập dữ liệu vượt quá mục đích cần thiết',
              'Chỉ bất hợp lí nếu ứng dụng thu phí hằng tháng, còn với ứng dụng miễn phí thì việc cấp toàn bộ quyền là hoàn toàn bình thường',
              'Nên bấm Đồng ý hết lúc cài đặt để dùng thử cho nhanh rồi mấy tháng sau mới xem lại trong phần Cài đặt'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! Mỗi ứng dụng chỉ nên được cấp đúng quyền tối thiểu phục vụ chức năng chính của nó.',
              'Chính xác! Áp dụng Câu hỏi 2 trong Bộ 4 câu hỏi kiểm tra: Danh bạ và Vị trí GPS không liên quan đến chức năng chỉnh ảnh nên cần từ chối hoặc không cài đặt.',
              'Dù miễn phí hay trả phí, việc thu thập dữ liệu nhạy cảm vượt quá mục đích chức năng đều tiềm ẩn rủi ro mất an toàn.',
              'Nếu bấm Đồng ý ngay từ đầu, dữ liệu danh bạ và vị trí có thể đã bị ứng dụng thu thập ngay khi vừa mở.'
            ],
            explanation: 'Bài học kiểm định ứng dụng Meitu / chỉnh ảnh (SGK & KHBD Bài 5): Cảnh giác với mọi ứng dụng yêu cầu quyền truy cập không liên quan tới chức năng chính.'
          },
          {
            id: 'ai6-b5-q3',
            question: 'Câu 3: Trước khi tải một ứng dụng AI mới trên Google Play hoặc App Store, em nên kiểm tra mục nào ngay trên trang giới thiệu ứng dụng để biết ứng dụng đó thu thập và chia sẻ những dữ liệu gì?',
            options: [
              'Mục “An toàn dữ liệu” (Data Safety) hoặc “Quyền riêng tư của ứng dụng” (App Privacy)',
              'Mục “Dung lượng tệp tải xuống” và danh sách các màu chủ đề giao diện của ứng dụng',
              'Chỉ cần xem ảnh quảng cáo đầu trang và số lượt tải xuống nhiều nhất trong tuần',
              'Mục “Ứng dụng tương tự có thể bạn thích” ở phía cuối trang kho ứng dụng'
            ],
            correctAnswer: 0,
            optionFeedback: [
              'Chính xác! Mục “An toàn dữ liệu” / “Quyền riêng tư của ứng dụng” liệt kê cụ thể các loại dữ liệu ứng dụng thu thập, mục đích và khả năng xóa dữ liệu.',
              'Dung lượng tệp hay màu sắc giao diện không cho biết ứng dụng có thu thập dữ liệu cá nhân hay chia sẻ cho bên thứ ba hay không.',
              'Ảnh quảng cáo đẹp hay số lượt tải cao không đồng nghĩa với việc ứng dụng an toàn và ít thu thập dữ liệu.',
              'Danh sách ứng dụng tương tự chỉ là gợi ý quảng cáo của kho ứng dụng.'
            ],
            explanation: 'Kĩ năng thực hành Bài 5: Luôn đọc mục “An toàn dữ liệu” (Data Safety) / “Quyền riêng tư của ứng dụng” (App Privacy) trước khi quyết định cài đặt.'
          },
          {
            id: 'ai6-b5-q4',
            question: 'Câu 4: Trong Bộ 4 câu hỏi kiểm tra độ an toàn của công cụ AI, câu hỏi “Em có thể tắt tính năng này hoặc xóa lịch sử hoạt động không?” có ý nghĩa quan trọng nhất là gì?',
            options: [
              'Giúp kiểm tra xem thiết bị của em có đủ dung lượng bộ nhớ trống để lưu ảnh chụp màn hình hay không',
              'Giúp xác định xem người dùng có giữ được quyền chủ động kiểm soát dữ liệu và dừng chia sẻ lịch sử khi không muốn tiếp tục sử dụng hay không',
              'Giúp kiểm tra xem ứng dụng có hỗ trợ chế độ ban đêm để giảm mỏi mắt khi học buổi tối hay không',
              'Giúp so sánh tốc độ phản hồi của công cụ AI này nhanh hơn hay chậm hơn so với các ứng dụng khác'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Câu hỏi này tập trung vào quyền kiểm soát dữ liệu cá nhân của người dùng, không phải dung lượng lưu ảnh của máy.',
              'Chính xác! Một công cụ AI an toàn, tôn trọng người dùng luôn cho phép tắt cá nhân hóa/thu thập dữ liệu và xóa lịch sử hoạt động.',
              'Chế độ ban đêm là tiện ích hiển thị, khác với quyền kiểm soát dữ liệu và lịch sử tương tác.',
              'Khả năng tắt tính năng hoặc xóa lịch sử không đo lường tốc độ phản hồi của máy chủ.'
            ],
            explanation: 'Bộ 4 câu hỏi kiểm tra (SGK Bài 5): Câu hỏi 3 bảo đảm quyền chủ động kiểm soát (User Control) của người học đối với công cụ AI.'
          },
          {
            id: 'ai6-b5-q5',
            question: 'Câu 5: So sánh hai công cụ AI hỗ trợ luyện tiếng Anh cho học sinh lớp 6: Công cụ X công khai tổ chức giáo dục phát triển, chỉ xin quyền Micro khi bấm luyện nói, có nút xóa lịch sử; Công cụ Y không rõ nhà phát triển, bắt nhập số điện thoại phụ huynh và quyền Danh bạ mới cho học thử. Nhận xét nào ĐÚNG NHẤT?',
            options: [
              'Nên chọn Công cụ X (và hỏi ý kiến cha mẹ trước khi cài) vì đáp ứng tốt các tiêu chí an toàn, minh bạch và thu thập dữ liệu tối thiểu',
              'Nên chọn Công cụ Y vì yêu cầu càng nhiều thông tin thì ứng dụng càng bảo mật chặt chẽ hơn cho học sinh',
              'Cả hai công cụ đều có mức độ an toàn như nhau vì cùng phục vụ mục đích học môn Tiếng Anh lớp 6',
              'Nên cài đặt song song cả Công cụ X và Công cụ Y rồi cấp toàn bộ quyền để so sánh trực tiếp'
            ],
            correctAnswer: 0,
            optionFeedback: [
              'Xuất sắc! Công cụ X đáp ứng đầy đủ Bộ 4 câu hỏi kiểm tra: rõ nhà phát triển, phù hợp lứa tuổi, quyền truy cập tối thiểu và cho phép xóa lịch sử.',
              'Hoàn toàn ngược lại! Thu thập thông tin vượt quá chức năng (Danh bạ, SĐT phụ huynh) từ nguồn không rõ ràng là dấu hiệu rủi ro cao.',
              'Cùng mục đích học tiếng Anh nhưng mức độ an toàn và minh bạch dữ liệu giữa hai công cụ hoàn toàn khác nhau.',
              'Cài đặt và cấp toàn bộ quyền cho Công cụ Y sẽ khiến dữ liệu cá nhân của em và gia đình lập tức gặp rủi ro.'
            ],
            explanation: 'Vận dụng Bộ 4 câu hỏi kiểm tra Bài 5 để đối chiếu và lựa chọn công cụ AI an toàn, minh bạch, phù hợp lứa tuổi.'
          }
        ]
      },
      {
        id: 'ai6-b5-act-5',
        moduleId: 'module-lesson-5',
        title: 'Hoạt động 3 & 4B (Thực hành & Vận dụng): Phiếu kiểm duyệt ứng dụng AI theo Bộ 4 câu hỏi & Cầu nối Bài 6 (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Hoàn thành đánh giá 01 công cụ AI quen thuộc theo đủ 4 câu hỏi kiểm tra an toàn & minh bạch (4–5 dòng), nêu nhận xét mục Data Safety và trả lời câu hỏi cầu nối chuẩn bị Bài 6 (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 5 & CẦU NỐI BÀI 6 (SGK & KHBD BÀI 5)\n\nPhần 1 – Đánh giá 01 công cụ AI quen thuộc theo Bộ 4 câu hỏi (4–5 dòng):\nChọn 01 công cụ/ứng dụng có tích hợp AI mà em hoặc gia đình biết (VD: Google Dịch, Duolingo, YouTube, ứng dụng chỉnh ảnh AI...) và trả lời rõ đủ 4 câu hỏi kiểm tra:\n  1. Công cụ này có an toàn và phù hợp lứa tuổi học sinh lớp 6 không?\n  2. Qua mục “An toàn dữ liệu” / “Quyền riêng tư”, ứng dụng yêu cầu những dữ liệu hoặc quyền nào? Có quyền nào bất hợp lí không?\n  3. Người dùng có thể tắt tính năng gợi ý/theo dõi hoặc xóa lịch sử hoạt động không?\n  4. Nhà phát triển và chính sách quyền riêng tư có được công khai minh bạch không?\n→ Kết luận của em: Nên dùng / Cần cài đặt lại quyền hạn / Không nên dùng (nêu rõ lí do).\n\nPhần 2 – Nhiệm vụ cầu nối chuẩn bị Bài 6 (Dữ liệu cá nhân là tài sản của mỗi con người):\nTheo em, vì sao hình ảnh khuôn mặt, giọng nói, địa chỉ nhà hay lịch sử tìm kiếm của mỗi người lại cần được xem như “tài sản riêng” không ai được tự ý lấy khi chưa xin phép?\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 5):\n- Vận dụng đầy đủ và chính xác cả 4 câu hỏi kiểm tra vào 01 công cụ cụ thể (5,0đ)\n- Đưa ra kết luận đánh giá hợp lí, có căn cứ từ quyền truy cập / tính minh bạch (3,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 6, trình bày rõ ràng, đúng chính tả (2,0đ)'
      }
    ]
  };

  const bai6Module = {
    id: 'module-lesson-6',
    courseId: '6AIAB01',
    order: 6,
    title: 'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
    description: 'Thời lượng: 01 tiết – 45 phút (Dạy học trực tuyến trên hệ thống LMS – Mức Thông hiểu – Vận dụng, YCCĐ 6.A3.3).',
    learningObjectives: '• (6.A3.3) Giải thích được dữ liệu cá nhân (hình ảnh, giọng nói, họ tên, địa chỉ, thông tin học tập, thói quen sử dụng mạng,...) là tài sản quý giá của mỗi con người.\n• Phân biệt được Dữ liệu cá nhân cơ bản và Dữ liệu cá nhân nhạy cảm theo Điều 2 Nghị định số 13/2023/NĐ-CP của Chính phủ.\n• Trình bày được các quyền của chủ thể dữ liệu (Điều 9) và quy định “sự đồng ý kép” đối với trẻ em từ đủ 7 tuổi trở lên (Điều 20 Nghị định 13/2023/NĐ-CP & UNICEF 2021).',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b6-act-1',
        moduleId: 'module-lesson-6',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 6 – Dữ liệu cá nhân là tài sản của mỗi con người',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai6/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 6: Dữ liệu cá nhân là tài sản của mỗi con người (YCCĐ 6.A3.3 · 01 tiết Trực tuyến).'
      },
      {
        id: 'ai6-b6-act-2',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): “Tài sản số của em là gì?” – Tình huống trang web chuyển ảnh AI (Hình 6.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 CHẶNG (45 PHÚT TRỰC TUYẾN): (1) Khởi động 5p → (2) Video “Dấu chân kỹ thuật số” có 3 câu neo chặn, sơ đồ trực quan & Kiến thức trọng tâm, tự trả lời 3 tình huống pháp lí cùng bạn Minh (20p) → (3) Trắc nghiệm chốt chặn “Bảo vệ Kho báu dữ liệu” 5 câu đạt ≥ 8/10đ (10p) → (4) Xử lí tình huống “Lời mời hấp dẫn” & Cầu nối Bài 7 (10p).\n\nTÌNH HUỐNG KHỞI ĐỘNG (Hình 6.1 SGK Bài 6): Bạn Khoa tìm thấy một trang web AI miễn phí chuyển ảnh chân dung thành tranh vẽ, nhưng trang web đòi lưu trữ hình ảnh khuôn mặt, giọng nói và địa chỉ trường học.\n\nEm hãy trả lời 2 câu hỏi lên Diễn đàn:\n1. Trong tình huống của bạn Khoa, em sẽ chọn Đồng ý ngay, Từ chối cấp quyền không cần thiết hay Dừng lại hỏi ý kiến cha mẹ? Vì sao?\n2. Hãy kể tên 02 loại thông tin cá nhân của bản thân mà em cho rằng cần được giữ kín như tài sản riêng khi dùng Internet.'
      },
      {
        id: 'ai6-b6-act-video',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 2.1 (Video): Dấu chân kỹ thuật số – Dữ liệu cá nhân là gì? (02:34 · 3 câu neo chặn)',
        type: 'video',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        videoUrl: 'https://www.youtube.com/watch?v=RNac5ZDIN-g',
        videoDuration: 154,
        preventVideoSkip: true,
        description: 'Em xem video “Dấu chân kỹ thuật số” để biết những dấu vết em để lại khi hoạt động trên mạng. Video sẽ tự dừng ở 3 điểm để em trả lời câu hỏi; em cần trả lời đúng mới xem tiếp được. Xem xong, em đọc Mục 1 SGK Bài 6 để phân biệt dữ liệu cá nhân cơ bản và dữ liệu cá nhân nhạy cảm.',
        videoCheckpoints: [
          {
            id: 'b6-cp1',
            timeSeconds: 55,
            question: 'Dấu chân kỹ thuật số được hình thành từ những hoạt động nào của em trên mạng?',
            options: [
              'Từ toàn bộ hoạt động trực tuyến như xem video, tìm kiếm, thích, bình luận và chia sẻ.',
              'Chỉ hình thành khi em nhập số căn cước công dân hoặc số tài khoản ngân hàng.',
              'Là các tệp virus tự sinh ra khi tắt máy tính.',
              'Chỉ xuất hiện khi em bị mất mật khẩu.'
            ],
            correctAnswer: 0,
            explanation: 'Mọi hoạt động trên mạng đều để lại dấu vết. Lịch sử hoạt động trên không gian mạng là dữ liệu cá nhân cơ bản (Nghị định 13/2023/NĐ-CP).',
            requireCorrect: true
          },
          {
            id: 'b6-cp2',
            timeSeconds: 105,
            question: 'Các nền tảng số thu thập dấu vết hành vi của người dùng chủ yếu để làm gì?',
            options: [
              'Tự động xóa toàn bộ lịch sử người dùng sau mỗi 24 giờ.',
              'Chỉ lưu trong bộ nhớ mà không bao giờ sử dụng.',
              'Phân tích sở thích, huấn luyện thuật toán gợi ý nội dung và hiển thị quảng cáo nhắm đúng người dùng.'
            ],
            correctAnswer: 2,
            explanation: 'Dữ liệu hành vi giúp nền tảng đoán sở thích của em để gợi ý nội dung và quảng cáo, vì vậy đó là tài sản cần được bảo vệ.',
            requireCorrect: true
          },
          {
            id: 'b6-cp3',
            timeSeconds: 150,
            question: 'Để bảo vệ dấu chân số và hạn chế rủi ro cho bản thân, em cần ghi nhớ điều gì?',
            options: [
              'Công khai số điện thoại, địa chỉ nhà trên các hội nhóm mạng xã hội.',
              'Suy nghĩ kĩ trước khi đăng tải, cài đặt quyền riêng tư và chia sẻ thông tin có trách nhiệm.',
              'Cho phép mọi ứng dụng lạ truy cập danh bạ và vị trí.'
            ],
            correctAnswer: 1,
            explanation: 'Những gì đã đăng lên mạng rất khó xóa hết. Em cần nghĩ trước khi đăng, bật quyền riêng tư và chỉ chia sẻ thông tin cần thiết.',
            requireCorrect: true
          }
        ]
      },
      {
        id: 'ai6-b6-act-3',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Phân loại Dữ liệu cá nhân & 4 Quyền của chủ thể dữ liệu (Nghị định 13/2023/NĐ-CP)',
        type: 'document',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        description: '1. KHÁI NIỆM & PHÂN LOẠI DỮ LIỆU CÁ NHÂN (Điều 2 Nghị định 13/2023/NĐ-CP – Hình 6.2 SGK):\n• Dữ liệu cá nhân là thông tin dưới dạng kí hiệu, chữ viết, chữ số, hình ảnh, âm thanh... gắn liền hoặc giúp xác định một con người cụ thể (bao gồm cả “Dấu chân kỹ thuật số”).\n• Nhóm 1 – Dữ liệu cá nhân cơ bản (Khoản 3 Điều 2): Họ tên khai sinh, ngày sinh, giới tính, quê quán, địa chỉ liên hệ, hình ảnh cá nhân, giọng nói, số điện thoại, số định danh, thông tin học tập, tài khoản số và lịch sử hoạt động trên không gian mạng (điểm k).\n• Nhóm 2 – Dữ liệu cá nhân nhạy cảm (Khoản 4 Điều 2): Tình trạng sức khỏe và hồ sơ bệnh án, dữ liệu vị trí địa lí qua định vị GPS, thông tin tài khoản ngân hàng/tài chính, dữ liệu sinh trắc học đặc thù (vân tay, đặc điểm sinh học riêng), quan điểm tôn giáo và đời tư.\n\n2. DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN & QUYỀN CỦA CHỦ SỞ HỮU (Điều 9 & Điều 20 Nghị định 13/2023/NĐ-CP – Hình 6.3 SGK):\n• Dữ liệu cá nhân gắn liền với danh tính, sự an toàn cá nhân và có giá trị lớn với các hệ thống AI.\n• 4 quyền cơ bản của chủ thể dữ liệu (Điều 9): (1) Quyền được biết; (2) Quyền đồng ý hoặc không đồng ý; (3) Quyền rút lại sự đồng ý; (4) Quyền yêu cầu xóa dữ liệu.\n• Bảo vệ trẻ em (Khoản 2 Điều 20 NĐ 13/2023 & UNICEF 2021): Xử lí dữ liệu cá nhân của trẻ em từ đủ 7 tuổi trở lên BẮT BUỘC phải có sự đồng ý kép của cả trẻ em VÀ cha, mẹ hoặc người giám hộ.'
      },
      {
        id: 'ai6-b6-act-4',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 3 (Trắc nghiệm chốt chặn ≥ 8/10đ): Phân loại Dữ liệu cá nhân & Quyền chủ thể dữ liệu (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 6 (5 câu, thang 10 điểm, điều kiện đạt ≥ 8/10 điểm) căn cứ trực tiếp Nghị định số 13/2023/NĐ-CP, Video “Dấu chân kỹ thuật số” và 3 tình huống pháp lí cùng bạn Minh.',
        quizQuestions: [
          {
            id: 'ai6-b6-q1',
            question: 'Câu 1: Theo nội dung Video “Dấu chân kỹ thuật số” và Điểm k Khoản 3 Điều 2 Nghị định 13/2023/NĐ-CP, lịch sử tìm kiếm, xem video và hoạt động của em trên không gian mạng được xếp vào nhóm nào?',
            options: [
              'Thông tin kiến thức chung công cộng nên mọi nền tảng đều có quyền thu thập tự do',
              'Dữ liệu cá nhân cơ bản thuộc tài sản gắn liền với mỗi cá nhân trên không gian mạng',
              'Dữ liệu kĩ thuật tạm thời của trình duyệt, tự động biến mất hoàn toàn sau khi tắt máy',
              'Chỉ được xem là dữ liệu cá nhân nếu người dùng có nhập kèm số tài khoản ngân hàng'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! Thông tin kiến thức chung là công thức toán học hay tên hành tinh, còn lịch sử duyệt web gắn với hành vi riêng của từng người.',
              'Chính xác! Điểm k Khoản 3 Điều 2 Nghị định 13/2023/NĐ-CP quy định rõ lịch sử hoạt động trên không gian mạng là dữ liệu cá nhân cơ bản.',
              'Dấu chân kỹ thuật số vẫn được lưu trên máy chủ nền tảng ngay cả khi em đã tắt máy tính hoặc điện thoại.',
              'Lịch sử hoạt động mạng tự nó đã là dữ liệu cá nhân cơ bản, không phụ thuộc việc có nhập số ngân hàng hay không.'
            ],
            explanation: 'Căn cứ điểm k khoản 3 Điều 2 Nghị định 13/2023/NĐ-CP: Lịch sử hoạt động trên không gian mạng là dữ liệu cá nhân cơ bản.'
          },
          {
            id: 'ai6-b6-q2',
            question: 'Câu 2: Theo Khoản 4 Điều 2 Nghị định số 13/2023/NĐ-CP, nhóm thông tin nào sau đây gồm toàn bộ các DỮ LIỆU CÁ NHÂN NHẠY CẢM cần được bảo vệ đặc biệt chặt chẽ?',
            options: [
              'Họ tên khai sinh, ngày tháng năm sinh, hình ảnh chân dung và kết quả học tập ở trường',
              'Vị trí địa lí hiện tại qua định vị GPS, tình trạng sức khỏe – hồ sơ bệnh án và thông tin tài khoản ngân hàng gia đình',
              'Công thức tính diện tích hình tam giác, tên các hành tinh trong Hệ Mặt Trời và lịch thi học kì chung của trường',
              'Lịch sử tìm kiếm video học tập, tên tài khoản đăng nhập số và địa chỉ trường học'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Cẩn thận! Họ tên, ngày sinh, hình ảnh cá nhân và thông tin học tập thuộc nhóm Dữ liệu cá nhân CƠ BẢN (Khoản 3 Điều 2).',
              'Chính xác! Vị trí GPS, tình trạng sức khỏe/bệnh án và thông tin tài chính ngân hàng đều thuộc nhóm Dữ liệu cá nhân NHẠY CẢM (Khoản 4 Điều 2).',
              'Công thức toán học và tên hành tinh là thông tin kiến thức chung, không phải dữ liệu cá nhân.',
              'Lịch sử hoạt động mạng, tài khoản số và địa chỉ liên hệ thuộc nhóm Dữ liệu cá nhân cơ bản.'
            ],
            explanation: 'Phân loại theo Điều 2 Nghị định 13/2023/NĐ-CP (Hình 6.2 SGK Bài 6): Nhạy cảm gồm sức khỏe/bệnh án, vị trí GPS, tài chính ngân hàng, sinh trắc học đặc thù.'
          },
          {
            id: 'ai6-b6-q3',
            question: 'Câu 3 (Tình huống pháp lí 1 – Bạn Minh): Minh đăng kí tài khoản trên một ứng dụng chơi cờ vua trực tuyến. Theo Điều 9 Nghị định 13/2023/NĐ-CP, ai là chủ thể có quyền quyết định cho phép hoặc từ chối chia sẻ dữ liệu cá nhân của Minh?',
            options: [
              'Nhà phát triển trò chơi cờ vua vì họ là đơn vị cung cấp phần mềm miễn phí cho Minh sử dụng',
              'Chính bản thân Minh (chủ thể dữ liệu) cùng cha, mẹ hoặc người giám hộ hợp pháp',
              'Quản trị viên phòng chơi trực tuyến hoặc người chơi cùng bàn với Minh trên hệ thống',
              'Bất kì công ty quảng cáo nào có liên kết đối tác với ứng dụng cờ vua đó'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Nhà phát triển cung cấp ứng dụng nhưng không có quyền sở hữu dữ liệu cá nhân của người dùng nếu chưa được sự đồng ý hợp lệ.',
              'Chính xác! Chỉ chủ thể dữ liệu (và cha mẹ/người giám hộ đối với trẻ em) mới có quyền quyết định chia sẻ dữ liệu cá nhân.',
              'Người chơi cùng hay quản trị viên phòng game tuyệt đối không có quyền quyết định đối với dữ liệu của Minh.',
              'Bên quảng cáo thứ ba không được tự ý khai thác dữ liệu nếu không có sự đồng ý rõ ràng từ chủ thể dữ liệu.'
            ],
            explanation: 'Căn cứ Khoản 1 & 2 Điều 9 Nghị định 13/2023/NĐ-CP: Chủ thể dữ liệu có quyền được biết và quyền đồng ý/không đồng ý việc xử lí dữ liệu của mình.'
          },
          {
            id: 'ai6-b6-q4',
            question: 'Câu 4 (Tình huống pháp lí 2 – Bạn Minh): Sau 2 tuần cài ứng dụng “Đèn pin”, Minh phát hiện ứng dụng âm thầm truy cập vị trí GPS và danh bạ. Theo Khoản 4, 5 Điều 9 Nghị định 13/2023/NĐ-CP, Minh có quyền gì?',
            options: [
              'Phải tiếp tục chấp nhận vô điều kiện vì lúc cài đặt ban đầu Minh đã lỡ bấm nút Đồng ý',
              'Có quyền rút lại sự đồng ý, tắt ngay quyền truy cập trong Cài đặt, yêu cầu ngừng xử lí và xóa dữ liệu đã thu thập',
              'Chỉ được quyền thu hồi quyền truy cập sau khi sử dụng đủ 1 năm hoặc trả phí nâng cấp tài khoản',
              'Chỉ có thể tắt định vị GPS tạm thời khi đi ngủ, không có quyền yêu cầu xóa dữ liệu cá nhân'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! Việc từng đồng ý trước đó không làm mất quyền thu hồi của chủ thể dữ liệu.',
              'Chính xác! Khoản 4 và 5 Điều 9 Nghị định 13/2023/NĐ-CP bảo đảm quyền rút lại sự đồng ý và quyền yêu cầu xóa dữ liệu bất kì lúc nào.',
              'Pháp luật không đặt điều kiện thời hạn hay thu phí khi chủ thể dữ liệu thực hiện quyền rút lại sự đồng ý.',
              'Chủ thể dữ liệu hoàn toàn có quyền thu hồi hẳn quyền truy cập, gỡ ứng dụng và yêu cầu xóa dữ liệu.'
            ],
            explanation: 'Điều 9 Nghị định 13/2023/NĐ-CP: Chủ sở hữu có quyền rút lại sự đồng ý và quyền yêu cầu xóa dữ liệu cá nhân của mình.'
          },
          {
            id: 'ai6-b6-q5',
            question: 'Câu 5 (Tình huống pháp lí 3 – Bạn Minh 12 tuổi): Một trang web muốn thu thập họ tên, số điện thoại và địa chỉ nhà của Minh (học sinh lớp 6, 12 tuổi). Theo Khoản 2 Điều 20 Nghị định 13/2023/NĐ-CP, điều kiện pháp lí BẮT BUỘC là gì?',
            options: [
              'Chỉ cần Minh tự bấm nút Đồng ý trên màn hình là đã đầy đủ giá trị pháp lí vì Minh đã đủ 7 tuổi',
              'Chỉ cần trang web tặng điểm thưởng học tập và hiển thị điều khoản bằng chữ nhỏ ở cuối trang',
              'Bắt buộc phải có sự đồng ý kép của CẢ bản thân Minh VÀ cha, mẹ hoặc người giám hộ hợp pháp',
              'Chỉ cần một người bạn cùng lớp trên 12 tuổi xác nhận đồng ý thay cho Minh'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Rất dễ nhầm! Với trẻ em từ đủ 7 tuổi trở lên, chỉ riêng trẻ em đồng ý là CHƯA ĐỦ — cần thêm sự đồng ý của cha mẹ hoặc người giám hộ.',
              'Quà tặng hay điều khoản chữ nhỏ không thể thay thế sự đồng ý hợp lệ theo quy định pháp luật bảo vệ trẻ em.',
              'Xuất sắc! Khoản 2 Điều 20 Nghị định 13/2023/NĐ-CP quy định xử lí dữ liệu trẻ em từ đủ 7 tuổi trở lên bắt buộc phải có sự đồng ý của cả trẻ em VÀ cha, mẹ/người giám hộ.',
              'Bạn cùng lớp không phải là người giám hộ hợp pháp nên không có quyền quyết định thay.'
            ],
            explanation: 'Điều 20 Khoản 2 Nghị định 13/2023/NĐ-CP & UNICEF (2021): Bảo vệ trẻ em bằng nguyên tắc sự đồng ý kép (trẻ em từ đủ 7 tuổi + cha mẹ/người giám hộ).'
          }
        ]
      },
      {
        id: 'ai6-b6-act-5',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 4 (Vận dụng & Cầu nối Bài 7): Xử lí tình huống “Lời mời hấp dẫn” & Kiểm tra quyền ứng dụng cùng gia đình (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Giải quyết tình huống “Lời mời hấp dẫn” (ứng dụng học Toán miễn phí đòi quyền Danh bạ), trả lời câu hỏi cầu nối chuẩn bị Bài 7 và ghi nhận xét kiểm tra mục Permissions cùng cha mẹ (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 6 & CẦU NỐI BÀI 7 (KHBD BÀI 6)\n\nPhần 1 – Giải quyết tình huống “Lời mời hấp dẫn”:\nMột ứng dụng học Toán miễn phí yêu cầu em cấp quyền truy cập Danh bạ điện thoại mới cho dùng thử.\n  (a) Em sẽ quyết định Đồng ý hay Từ chối? Hãy giải thích dựa trên kiến thức về Dữ liệu cá nhân và Quyền của chủ thể dữ liệu.\n  (b) Nếu trước đó em đã lỡ bấm Đồng ý, theo Nghị định 13/2023/NĐ-CP em có quyền gì và sẽ thực hiện những thao tác nào để sửa sai?\n\nPhần 2 – Nhiệm vụ cầu nối chuẩn bị Bài 7 (Quyền riêng tư và kỹ năng tự vệ số):\nNếu một tài khoản lạ tự ý lấy ảnh chân dung và số điện thoại của em đăng lên mạng để trêu chọc hoặc giả mạo bằng AI, theo em việc đầu tiên em cần làm là gì?\n\nPhần 3 (Mở rộng cùng gia đình – Mục Vận dụng SGK Bài 6):\nCùng cha mẹ kiểm tra mục “Quyền truy cập ứng dụng” (Permissions) của 2 ứng dụng trên điện thoại/máy tính bảng gia đình và ghi ngắn gọn nhận xét xem các quyền đang bật đã hợp lí chưa.\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 6):\n- Giải quyết chính xác cả hai vế tình huống (từ chối & thao tác rút lại sự đồng ý) (5,0đ)\n- Lập luận sử dụng chính xác thuật ngữ & cơ sở pháp lí (Chủ thể dữ liệu, Quyền đồng ý/rút lại sự đồng ý, vai trò cha mẹ) (3,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 7, trình bày mạch lạc, đúng chính tả (2,0đ)'
      }
    ]
  };

  const bai7Module = {
    id: 'module-lesson-7',
    courseId: '6AIAB01',
    order: 7,
    title: 'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
    description: 'Thời lượng: 01 tiết – 45 phút (Dạy học trực tuyến trên hệ thống LMS – Mức Nhận biết – Thông hiểu – Vận dụng, YCCĐ 6.A3.4).',
    learningObjectives: '• (6.A3.4) Trình bày được khái niệm quyền riêng tư ở mức đơn giản và ý nghĩa đối với sự an toàn, danh dự và tự do của con người trong môi trường số.\n• Nêu được các tác hại nghiêm trọng khi dữ liệu cá nhân bị AI xấu lạm dụng: Doxing, Deepfake, bắt nạt/quấy rối tự động, lừa đảo giả mạo (Spoofing/Scams – DP-REG 2023, UNICEF 2021).\n• Vận dụng đúng Quy tắc 3 Không, Quy trình 3 Bước tự vệ số (Dừng chia sẻ → Báo cha mẹ, thầy cô / Tổng đài 111 → Chặn và Báo cáo trên nền tảng) vào các tình huống thực tế.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b7-act-1',
        moduleId: 'module-lesson-7',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 7 – Quyền riêng tư và kỹ năng tự vệ số',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai7/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 7: Quyền riêng tư và kỹ năng tự vệ số (YCCĐ 6.A3.4 · 01 tiết Trực tuyến).'
      },
      {
        id: 'ai6-b7-act-2',
        moduleId: 'module-lesson-7',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): “Cảnh giác trước yêu cầu thu thập dữ liệu” (Hình 7.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 CHẶNG (45 PHÚT TRỰC TUYẾN): (1) Khởi động 5p → (2) Sơ đồ trực quan 1–2 & Kiến thức trọng tâm, tự luyện 3 câu đọc hiểu và sắp xếp 3 bước tự vệ (20p) → (3) Trắc nghiệm chốt chặn tình huống 5 câu đạt ≥ 8/10đ (10p) → (4) Tư vấn “Hỗ trợ bạn bè” & Cầu nối Bài 8 (10p).\n\nTÌNH HUỐNG KHỞI ĐỘNG (SGK & KHBD Bài 7): Một ứng dụng AI biến ảnh thành nhân vật hoạt hình (hoặc tài khoản lạ báo trúng thưởng như tình huống của An – Hình 7.1) yêu cầu em cung cấp họ tên thật, ngày sinh, số điện thoại, tên trường và toàn bộ thư viện ảnh/giọng nói.\n\nEm hãy chia sẻ lên Diễn đàn:\n1. Em cảm thấy thế nào và quyết định ra sao trước yêu cầu thu thập thông tin quá mức như vậy?\n2. Viết 01 câu ngắn gọn giải thích lí do cho lựa chọn của mình.'
      },
      {
        id: 'ai6-b7-act-3',
        moduleId: 'module-lesson-7',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Quyền riêng tư, 4 Hiểm họa từ AI xấu, Quy tắc 3 Không, 3 Bước tự vệ số & Tổng đài 111',
        type: 'document',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        description: '1. QUYỀN RIÊNG TƯ & Ý NGHĨA (Hình 7.2 SGK Bài 7):\n• Quyền riêng tư trong môi trường số là quyền mỗi cá nhân được giữ kín, bảo vệ và tự quyết định việc chia sẻ thông tin, hình ảnh, dữ liệu cá nhân của mình.\n• Ý nghĩa đối với 3 phương diện cốt lõi: Bảo vệ SỰ AN TOÀN – Giữ gìn DANH DỰ, UY TÍN – Bảo đảm SỰ TỰ DO.\n\n2. BỐN HIỂM HỌA KHI DỮ LIỆU BỊ AI XẤU LẠM DỤNG (DP-REG 2023, UNICEF 2021, eSafety 2023):\n• Deepfake: Dùng AI ghép khuôn mặt hoặc bắt chước giọng nói vào video, cuộc gọi giả mạo để bôi nhọ danh dự hoặc lừa đảo người thân.\n• Doxing: Thu thập và tung công khai trái phép tên thật, địa chỉ nhà, số điện thoại để quấy rối, đe dọa.\n• Bắt nạt, quấy rối tự động: Tài khoản tự động gửi tin nhắn đe dọa, lan truyền tin giả.\n• Lừa đảo & giả mạo (Scams / Spoofing): Chatbot hoặc tài khoản giả danh dụ nhập mật khẩu, chiếm đoạt tài khoản.\n\n3. QUY TẮC 3 KHÔNG & QUY TRÌNH 3 BƯỚC TỰ VỆ SỐ (Hình 7.3 SGK Bài 7):\n• Phòng ngừa (3 Không): Không nhập thông tin định danh – Không tải ảnh riêng tư/thẻ học sinh – Không tự ý dùng công cụ AI khi chưa đủ tuổi hoặc chưa được cha mẹ cho phép.\n• Ứng phó ban đầu theo đúng thứ tự 3 Bước:\n  + Bước 1 – Dừng chia sẻ ngay: Ngừng tương tác (tuyệt đối không đôi co), đóng ứng dụng, đổi mật khẩu nếu lỡ lộ, chụp màn hình làm bằng chứng.\n  + Bước 2 – Báo cho người lớn tin cậy: Kể ngay sự việc và đưa bằng chứng cho cha mẹ, thầy cô giáo; ghi nhớ Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 111 hoạt động 24/7.\n  + Bước 3 – Chặn và Báo cáo trên nền tảng: Nhấn Chặn (Block) và Báo cáo vi phạm (Report) để gỡ nội dung và khóa tài khoản xấu.'
      },
      {
        id: 'ai6-b7-act-4',
        moduleId: 'module-lesson-7',
        title: 'Hoạt động 3 (Trắc nghiệm chốt chặn ≥ 8/10đ): Quyền riêng tư, Hiểm họa AI xấu & 3 Bước tự vệ số (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 7 (5 câu, thang 10 điểm, điều kiện đạt ≥ 8/10 điểm) tích hợp kiến thức sơ đồ trực quan 1–2 và 3 tình huống xử lí sự cố an toàn dữ liệu.',
        quizQuestions: [
          {
            id: 'ai6-b7-q1',
            question: 'Câu 1: Việc bảo vệ quyền riêng tư trong môi trường số có ý nghĩa trực tiếp đối với ba phương diện cốt lõi nào của mỗi con người?',
            options: [
              'Tốc độ đường truyền Internet, dung lượng bộ nhớ máy tính và thời lượng pin của thiết bị',
              'Sự an toàn thân thể – tài sản, danh dự – uy tín và sự tự do học tập, giao tiếp lành mạnh',
              'Số lượng bạn bè kết nối trên mạng xã hội, lượt thích bài viết và tốc độ tải ứng dụng',
              'Khả năng truy cập miễn phí các trang web giải trí và không phải cập nhật mật khẩu định kì'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Tốc độ mạng, bộ nhớ hay pin là thông số kĩ thuật phần cứng, không phải ý nghĩa xã hội của quyền riêng tư.',
              'Chính xác! Bảo vệ quyền riêng tư giữ vững sự an toàn, danh dự – uy tín và sự tự do của con người trên môi trường số (Mục 1 SGK Bài 7).',
              'Lượt thích hay số bạn bè trên mạng không phải là giá trị cốt lõi mà quyền riêng tư bảo vệ.',
              'Bảo vệ quyền riêng tư đòi hỏi luôn đặt mật khẩu mạnh và cẩn trọng trước các trang web miễn phí không rõ nguồn gốc.'
            ],
            explanation: 'SGK Bài 7 (Hình 7.2): Bảo vệ quyền riêng tư có ý nghĩa đặc biệt đối với sự an toàn, danh dự và tự do của mỗi con người.'
          },
          {
            id: 'ai6-b7-q2',
            question: 'Câu 2: Hành vi kẻ xấu thu thập trái phép họ tên thật, địa chỉ nhà, số điện thoại của một cá nhân rồi tung công khai lên mạng nhằm quấy rối, đe dọa được gọi bằng thuật ngữ nào?',
            options: [
              'Deepfake (Giả mạo hình ảnh, giọng nói bằng AI)',
              'Doxing (Thu thập và phơi bày trái phép thông tin bí mật cá nhân)',
              'Filter Bubble (Bong bóng thông tin từ thuật toán gợi ý)',
              'Hallucination (Hiện tượng ảo giác thông tin của AI)'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Rất dễ nhầm! Deepfake là ghép khuôn mặt/giả giọng nói bằng AI, còn tung công khai địa chỉ/SĐT bí mật là Doxing.',
              'Chính xác! Doxing (DP-REG 2023) là hành vi thu thập và phát tán công khai thông tin cá nhân bí mật để quấy rối hoặc đe dọa.',
              'Filter Bubble là hiện tượng thuật toán gợi ý nội dung lặp lại một chiều (Bài 4).',
              'Hallucination là hiện tượng AI tự bịa đặt kiến thức sai sự thật (Bài 3).'
            ],
            explanation: 'Thuật ngữ Bài 7 (DP-REG 2023): Phân biệt rõ Doxing (phơi bày dữ liệu bí mật) và Deepfake (giả mạo khuôn mặt, giọng nói).'
          },
          {
            id: 'ai6-b7-q3',
            question: 'Câu 3: Khi phát hiện hình ảnh cá nhân bị tài khoản lạ tự ý đăng tải lên mạng xã hội kèm lời trêu chọc, thứ tự ĐÚNG NHẤT của Quy trình 3 bước ứng phó ban đầu là gì?',
            options: [
              'Nhắn tin tranh cãi yêu cầu xóa bài → Xóa hết lịch sử trò chuyện → Chờ vài ngày xem sao',
              '(1) Dừng chia sẻ, chụp màn hình làm bằng chứng → (2) Báo ngay cho cha mẹ, thầy cô giáo (hoặc Tổng đài 111) → (3) Chặn (Block) và Báo cáo (Report) trên nền tảng',
              '(1) Tự tạo tài khoản khác đăng bài nói xấu lại → (2) Gửi mật khẩu cho bạn nhờ báo cáo hộ → (3) Tắt nguồn điện thoại',
              '(1) Xóa ứng dụng ngay mà không lưu bằng chứng → (2) Giấu kín không kể với cha mẹ vì sợ bị mắng → (3) Bỏ qua sự việc'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Tuyệt đối không đôi co với kẻ xấu và không xóa mất bằng chứng cần thiết để người lớn xử lí.',
              'Chính xác! Đúng trình tự 3 bước tự vệ số chuẩn theo Hình 7.3 SGK Bài 7.',
              'Trả đũa trên mạng hoặc chia sẻ mật khẩu cho người khác chỉ khiến rủi ro mất an toàn nghiêm trọng hơn.',
              'Cần chụp màn hình lưu bằng chứng và báo ngay cho cha mẹ, thầy cô thay vì âm thầm giấu kín.'
            ],
            explanation: 'Quy trình 3 Bước tự vệ số (SGK Bài 7): Bước 1 Dừng chia sẻ & lưu bằng chứng → Bước 2 Báo người lớn tin cậy / Tổng đài 111 → Bước 3 Chặn & Báo cáo.'
          },
          {
            id: 'ai6-b7-q4',
            question: 'Câu 4 (Tình huống 1 & 2): Một ứng dụng AI yêu cầu bật GPS và chụp ảnh góc bàn học có đặt thẻ học sinh; ngay sau đó một chatbot lạ nhắn tin báo trúng quà trò chơi đòi mật khẩu trong 3 phút. Em chọn cách ứng xử nào AN TOÀN NHẤT?',
            options: [
              'Chỉ chụp góc bàn học có thẻ học sinh (không bật GPS) và gửi tên đăng nhập game nhưng không gửi số điện thoại',
              'Từ chối cấp quyền ứng dụng soi phòng, dừng trả lời chatbot giả mạo, chụp màn hình bằng chứng, báo cha mẹ và Chặn/Báo cáo tài khoản lừa đảo',
              'Bật GPS một phút cho ứng dụng chụp nhanh rồi tắt ngay, còn với chatbot thì nhắn tin hỏi lại xem có đúng nhà phát hành thật không',
              'Cung cấp thông tin giả nhưng vẫn bấm vào đường link nhận quà của chatbot để kiểm tra thử'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Công nghệ thị giác máy tính vẫn đọc được họ tên, trường lớp trên thẻ học sinh, còn gửi tên đăng nhập cho chatbot lạ tạo nguy cơ chiếm đoạt tài khoản.',
              'Xuất sắc! Em vừa bảo vệ dữ liệu vị trí/thẻ học sinh, vừa ngăn chặn hoàn toàn chiêu trò giả mạo (Spoofing – UNICEF 2021).',
              'Bật GPS dù ngắn vẫn làm lộ dữ liệu vị trí nhạy cảm, và tiếp tục nhắn tin với chatbot lừa đảo là vi phạm bước 1 (Dừng chia sẻ).',
              'Bấm vào đường link lạ từ chatbot giả mạo có thể dẫn tới trang đánh cắp tài khoản hoặc mã độc.'
            ],
            explanation: 'Kết hợp Quy tắc 3 Không và 3 Bước tự vệ số để phòng tránh lộ dữ liệu sinh trắc/định danh và lừa đảo giả mạo (Spoofing).'
          },
          {
            id: 'ai6-b7-q5',
            question: 'Câu 5 (Tình huống 3 – Deepfake & Tổng đài khẩn cấp): Em nhận cuộc gọi video mờ giật 5 giây có khuôn mặt giống giáo viên chủ nhiệm rồi tắt máy, kèm tin nhắn giục chụp hai mặt thẻ ngân hàng của bố mẹ gửi gấp. Cách xử lí nào ĐÚNG NHẤT, và số Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 24/7 tại Việt Nam là số nào?',
            options: [
              'Gửi trước mặt trước thẻ ngân hàng để xác nhận rồi hỏi bố mẹ sau; Tổng đài là 115',
              'Nhắn tin mắng lại tài khoản lừa đảo để cảnh cáo rồi chặn sau; Tổng đài là 114',
              'Dừng ngay giao dịch, không gửi bất kì ảnh nào, gọi trực tiếp số điện thoại của cha mẹ/giáo viên để xác minh và báo cáo tài khoản giả mạo; Tổng đài là 111',
              'Gọi video lại cho tài khoản lạ đó để xem rõ khuôn mặt thêm lần nữa trước khi quyết định; Tổng đài là 113'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Tuyệt đối không bao giờ chụp gửi thông tin thẻ ngân hàng; ngoài ra 115 là số cấp cứu y tế, không phải Tổng đài Bảo vệ Trẻ em.',
              'Không tự đôi co với kẻ lừa đảo; ngoài ra 114 là số cứu hỏa, không phải Tổng đài Bảo vệ Trẻ em.',
              'Xuất sắc! Nhận diện đúng thủ đoạn lừa đảo Deepfake, xác minh qua kênh trực tiếp đáng tin cậy và ghi nhớ chính xác Tổng đài Quốc gia Bảo vệ Trẻ em 111.',
              'Không tương tác tiếp với tài khoản giả mạo; số Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 24/7 là 111 (113 là cảnh sát phản ứng nhanh).'
            ],
            explanation: 'Cảnh giác Deepfake (Mục 1–2 SGK Bài 7) và ghi nhớ số Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 24/7 tại Việt Nam: 111.'
          }
        ]
      },
      {
        id: 'ai6-b7-act-5',
        moduleId: 'module-lesson-7',
        title: 'Hoạt động 4 (Vận dụng & Cầu nối Bài 8): Tư vấn “Hỗ trợ bạn bè” xử lí lộ mật khẩu & Cầu nối Bài 8 (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Viết tin nhắn an ủi và hướng dẫn bạn thân thực hiện đúng thứ tự 3 bước tự vệ số khi lỡ lộ mật khẩu vào trang AI giả mạo, đồng thời trả lời câu hỏi cầu nối chuẩn bị Bài 8 (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 7 & CẦU NỐI BÀI 8 (KHBD BÀI 7)\n\nPhần 1 – Tin nhắn tư vấn “Hỗ trợ bạn bè”:\nTình huống: Một người bạn thân của em rất lo lắng vì vừa lỡ nhập họ tên thật, số điện thoại và mật khẩu tài khoản mạng xã hội vào một trang web AI giải trí không rõ nguồn gốc (dự đoán điểm thi tương lai). Hiện tài khoản của bạn đang tự động nhắn tin vay tiền khắp danh sách bạn bè.\n→ Em hãy viết một tin nhắn ngắn gọn với lời lẽ an ủi, động viên (không trách móc) và hướng dẫn bạn thực hiện đầy đủ, ĐÚNG THỨ TỰ 3 BƯỚC ứng phó ngay lập tức (có nhắc số Tổng đài Quốc gia Bảo vệ Trẻ em 111 khi cần hỗ trợ khẩn cấp).\n\nPhần 2 – Nhiệm vụ cầu nối chuẩn bị Bài 8 (Con người làm chủ Trí tuệ nhân tạo):\nTrong đời sống hằng ngày (ví dụ khi đi đường có bản đồ AI gợi ý hoặc khi đi khám bệnh có AI hỗ trợ bác sĩ), em hãy nêu 01 tình huống cụ thể mà AI đưa ra gợi ý nhưng con người phải tự cân nhắc điều kiện thực tế để ra quyết định cuối cùng.\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 7):\n- Đề xuất đầy đủ và đúng thứ tự Quy trình 3 bước tự vệ số (6,0đ)\n- Văn phong an ủi, nhân ái, mạch lạc và đúng chính tả (2,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 8 và nộp bài đúng quy cách (2,0đ)'
      }
    ]
  };

  const bai8Module = {
    id: 'module-lesson-8',
    courseId: '6AIAB01',
    order: 8,
    title: 'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO',
    description: 'Thời lượng: 01 tiết – 45 phút (Trực tiếp tại lớp kết hợp hỗ trợ trên LMS – Mức Vận dụng tổng hợp toàn chuyên đề, YCCĐ 6.A3.1).',
    learningObjectives: '• (6.A3.1) Nêu được ví dụ thực tiễn về tình huống con người ra quyết định với sự hỗ trợ của AI trong y tế, giao thông, học tập và đời sống.\n• Giải thích được giới hạn phán đoán theo ngữ cảnh của AI (U.S. Dept. of Education 2023) và quyền không sử dụng, bỏ qua hoặc điều chỉnh đầu ra AI (Điều 14 Khoản 4(d) EU AI Act 2024).\n• Thực hành thành thạo Quy trình 3 bước ra quyết định khi có gợi ý của AI (Nêu lại gợi ý AI → Cân nhắc điều kiện thực tế → Đưa ra lựa chọn kèm lí do) và viết Cam kết tổng kết 8 bài học.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b8-act-1',
        moduleId: 'module-lesson-8',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 8 – Con người làm chủ Trí tuệ nhân tạo',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai8/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 8: Con người làm chủ Trí tuệ nhân tạo (YCCĐ 6.A3.1 · 01 tiết Blended).'
      },
      {
        id: 'ai6-b8-act-2',
        moduleId: 'module-lesson-8',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): “Lộ trình nào an toàn?” – Tình huống gia đình bạn An (Hình 8.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'KIẾN THỨC NỀN TỔNG HỢP (BÀI 1–7): AI là công cụ do con người tạo ra (Bài 1), sử dụng hiệu quả bằng Prompt rõ ràng (Bài 2), luôn thực chứng thông tin (Bài 3), nhận diện hai mặt thuật toán và kiểm định an toàn (Bài 4–5), bảo vệ tài sản dữ liệu và tự vệ số (Bài 6–7).\n\nTÌNH HUỐNG KHỞI ĐỘNG (Hình 8.1 SGK Bài 8): Cuối tuần gia đình bạn An đi ngoại thành. Ứng dụng bản đồ AI gợi ý 2 lộ trình: Tuyến đường A qua quốc lộ mất 50 phút; Tuyến đường B đi tắt qua đường đê ven sông chỉ mất 35 phút. Tuy nhiên, đêm qua trời vừa mưa rất lớn khiến đường đê nhỏ dễ trơn trượt và ngập nước.\n\nEm hãy trả lời trên Diễn đàn:\n1. Theo em, bố của bạn An nên chọn đi Tuyến đường A hay Tuyến đường B? Vì sao?\n2. Điều kiện thực tế nào mà ứng dụng bản đồ AI chưa thể phán đoán toàn diện như người lái xe?'
      },
      {
        id: 'ai6-b8-act-3',
        moduleId: 'module-lesson-8',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Vai trò AI – Con người, Điều 14 EU AI Act (2024) & Quy trình 3 bước ra quyết định',
        type: 'document',
        durationMinutes: 12,
        isCompleted: false,
        isRequired: true,
        description: '1. CON NGƯỜI RA QUYẾT ĐỊNH VỚI SỰ HỖ TRỢ CỦA AI (Hình 8.2 SGK Bài 8):\n• Trong y tế: AI phân tích ảnh X-quang và khoanh vùng điểm bất thường giúp sàng lọc nhanh; bác sĩ trực tiếp thăm khám tổng thể, xem xét tiền sử bệnh để quyết định phác đồ điều trị cuối cùng.\n• Trong giao thông: Bản đồ AI tính toán tuyến đường ngắn nhất; người lái xe quan sát thời tiết, biển báo sửa đường và mặt đường thực tế để quyết định lộ trình an toàn.\n• Cơ sở khoa học & pháp lí: Theo Bộ Giáo dục Hoa Kỳ (2023), AI không có khả năng phán đoán theo ngữ cảnh rộng về đạo đức, cảm xúc và thực tế biến đổi như con người. Theo Điều 14 Khoản 4(d) Đạo luật AI châu Âu (EU AI Act, 2024), con người luôn có quyền không sử dụng, bỏ qua, điều chỉnh hoặc đảo ngược đầu ra của AI.\n\n2. QUY TRÌNH 3 BƯỚC RA QUYẾT ĐỊNH KHI CÓ GỢI Ý CỦA AI (Hình 8.3 SGK Bài 8):\n• Bước 1 – Nêu lại gợi ý của AI: Xác định rõ phương án hoặc lời khuyên mà công cụ AI đề xuất.\n• Bước 2 – Cân nhắc điều kiện thực tế (Phán đoán ngữ cảnh): Đối chiếu với quy định an toàn, sức khỏe, thời gian, môi trường xung quanh và quyền riêng tư.\n• Bước 3 – Đưa ra lựa chọn của bản thân kèm lí do: Chủ động chọn ĐỒNG Ý, ĐIỀU CHỈNH hoặc TỪ CHỐI gợi ý của AI và giải thích rõ lí do.'
      },
      {
        id: 'ai6-b8-act-4',
        moduleId: 'module-lesson-8',
        title: 'Hoạt động 4A (Trắc nghiệm chốt chặn tổng kết ≥ 8/10đ): Con người làm chủ Trí tuệ nhân tạo (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 8 – Tổng kết Chuyên đề AI lớp 6 (5 câu, thang 10 điểm, điều kiện đạt ≥ 8/10 điểm theo KHBD & Học liệu số Bài 8).',
        quizQuestions: [
          {
            id: 'ai6-b8-q1',
            question: 'Câu 1: Trong tình huống bác sĩ sử dụng hệ thống AI phân tích ảnh chụp X-quang phổi, vai trò của hệ thống AI và vai trò của bác sĩ được phân định ĐÚNG NHẤT như thế nào?',
            options: [
              'Hệ thống AI tự động kết luận bệnh và kê đơn thuốc, còn bác sĩ chỉ có nhiệm vụ in đơn thuốc giao cho người bệnh',
              'Hệ thống AI hỗ trợ phân tích ảnh và gợi ý vùng nghi vấn; bác sĩ thăm khám tổng thể người bệnh và đưa ra quyết định điều trị cuối cùng',
              'Bác sĩ không được phép điều chỉnh gợi ý của hệ thống AI vì phần mềm đã phân tích hàng nghìn ảnh chụp trước đó',
              'Hệ thống AI chịu hoàn toàn trách nhiệm pháp lí và y khoa nếu phương án điều trị xảy ra sai sót'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! AI không được tự ý kê đơn thay bác sĩ vì không thể khám trực tiếp và nắm toàn bộ bối cảnh lâm sàng của từng bệnh nhân.',
              'Chính xác! AI đóng vai trò công cụ sàng lọc và gợi ý; bác sĩ luôn là người tổng hợp bối cảnh thực tế và quyết định phương án điều trị cuối cùng.',
              'Theo Điều 14 EU AI Act (2024), con người luôn có quyền kiểm tra, điều chỉnh hoặc bỏ qua đầu ra của AI.',
              'Công cụ AI không có tư cách pháp lí; trách nhiệm chuyên môn luôn thuộc về con người vận hành và ra quyết định.'
            ],
            explanation: 'Mục 1 SGK Bài 8 (Hình 8.2): Trong y tế, AI hỗ trợ sàng lọc nhanh còn bác sĩ thăm khám và chịu trách nhiệm quyết định phác đồ điều trị.'
          },
          {
            id: 'ai6-b8-q2',
            question: 'Câu 2: Theo Bộ Giáo dục Hoa Kỳ (U.S. Department of Education, 2023), lí do CỐT LÕI khiến con người luôn phải giữ vai trò quyết định cuối cùng thay vì phó mặc cho AI là gì?',
            options: [
              'Vì hệ thống AI không thể xử lí các phép tính số học hay tìm kiếm dữ liệu nhanh bằng con người',
              'Vì AI không có khả năng phán đoán theo ngữ cảnh rộng về điều kiện thực tế biến đổi, đạo đức, cảm xúc và sự an toàn như con người',
              'Vì các hệ thống AI chỉ hoạt động ổn định trong môi trường phòng thí nghiệm và không thể đưa ra bất kì gợi ý nào',
              'Vì việc tự ra quyết định giúp tiết kiệm dung lượng điện năng tiêu thụ của các trung tâm dữ liệu'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Thực tế máy tính và AI tính toán số học, sàng lọc dữ liệu nhanh hơn con người rất nhiều; điểm yếu của AI nằm ở phán đoán ngữ cảnh.',
              'Chính xác! Phán đoán theo ngữ cảnh rộng (an toàn, đạo đức, cảm xúc, tình huống bất ngờ) là năng lực đặc trưng của con người mà AI không thể thay thế.',
              'AI đã và đang đưa ra nhiều gợi ý hữu ích trong y tế, giao thông, học tập — nhưng vẫn cần con người giám sát.',
              'Tiết kiệm điện năng không phải lí do cốt lõi của nguyên tắc “Human in the Loop” (Con người trong vòng lặp).'
            ],
            explanation: 'U.S. Dept. of Education (2023, tr. 17): Con người giữ quyền quyết định cuối cùng vì AI thiếu khả năng phán đoán theo ngữ cảnh rộng.'
          },
          {
            id: 'ai6-b8-q3',
            question: 'Câu 3: Thứ tự ĐÚNG của Quy trình 3 bước ra quyết định khi nhận được gợi ý từ một công cụ AI (Hình 8.3 SGK Bài 8) là gì?',
            options: [
              'Bước 1: Làm theo ngay gợi ý của AI → Bước 2: Chờ kết quả xảy ra → Bước 3: Điều chỉnh lại nếu thấy sai',
              'Bước 1: Nêu lại gợi ý của AI → Bước 2: Cân nhắc điều kiện thực tế → Bước 3: Đưa ra lựa chọn của bản thân (Đồng ý/Điều chỉnh/Từ chối) kèm lí do',
              'Bước 1: Từ chối ngay mọi gợi ý của AI → Bước 2: Không cần xem xét dữ kiện → Bước 3: Tự đoán ngẫu nhiên phương án khác',
              'Bước 1: Hỏi ý kiến nhiều bạn bè → Bước 2: Bỏ qua điều kiện sức khỏe, thời gian → Bước 3: Chép nguyên văn đề xuất của AI'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Làm theo ngay rồi mới chờ sai để sửa có thể gây hậu quả nguy hiểm về an toàn giao thông, sức khỏe hoặc bảo mật.',
              'Chính xác! Đủ và đúng trình tự 3 bước chuẩn theo Hình 8.3 SGK Bài 8.',
              'Không nên từ chối cực đoan mà cần xem xét gợi ý của AI rồi đối chiếu với điều kiện thực tế.',
              'Bỏ qua điều kiện sức khỏe, thời gian hay quy định thực tế là đi ngược lại bước quan trọng nhất của quy trình.'
            ],
            explanation: 'Quy trình 3 bước (SGK Bài 8): (1) Nêu lại gợi ý của AI → (2) Cân nhắc điều kiện thực tế → (3) Đưa ra lựa chọn kèm lí do.'
          },
          {
            id: 'ai6-b8-q4',
            question: 'Câu 4: Theo tinh thần Điều 14 Khoản 4(d) Đạo luật AI của Liên minh châu Âu (EU AI Act, 2024), khi nhận thấy gợi ý của hệ thống AI không phù hợp hoặc tiềm ẩn rủi ro trong tình huống thực tế, con người có quyền gì?',
            options: [
              'Bắt buộc phải tuân theo đúng đầu ra của AI để bảo đảm tính thống nhất của thuật toán',
              'Có quyền quyết định không sử dụng, bỏ qua, điều chỉnh hoặc đảo ngược đầu ra của hệ thống AI nhằm bảo đảm an toàn',
              'Chỉ được phép điều chỉnh gợi ý của AI sau khi gửi đơn xin phép nhà phát triển phần mềm',
              'Phải chờ hệ thống AI tự phát hiện lỗi và cập nhật phiên bản mới rồi mới được ra quyết định'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! Mục đích của giám sát con người (Human Oversight) là tránh lệ thuộc mù quáng vào đầu ra của thuật toán.',
              'Chính xác! Điều 14 Khoản 4(d) EU AI Act (2024) khẳng định quyền chủ động không sử dụng, bỏ qua, điều chỉnh hoặc đảo ngược đầu ra của AI.',
              'Người sử dụng (như bác sĩ, phi công, lái xe, học sinh) cần hành động kịp thời ngay tại thời điểm ra quyết định chứ không chờ nhà phát triển.',
              'Chờ hệ thống tự sửa lỗi trong tình huống khẩn cấp có thể gây mất an toàn nghiêm trọng.'
            ],
            explanation: 'Điều 14 Khoản 4(d) EU AI Act (2024): Con người luôn nắm quyền giám sát và quyền từ chối, bỏ qua hoặc điều chỉnh đầu ra của AI.'
          },
          {
            id: 'ai6-b8-q5',
            question: 'Câu 5 (Tổng kết Chuyên đề 8 bài): Nguyên tắc cốt lõi nào sau đây thể hiện ĐÚNG NHẤT tinh thần “Con người làm chủ Trí tuệ nhân tạo” sau toàn bộ 8 bài học (Chủ đề A & B)?',
            options: [
              'Tin tưởng hoàn toàn mọi câu trả lời của AI để tiết kiệm thời gian và nhờ AI làm thay toàn bộ bài tập',
              'Sử dụng AI có mục đích rõ ràng, luôn thực chứng thông tin, kiểm định độ an toàn, bảo vệ dữ liệu cá nhân – quyền riêng tư và tự chịu trách nhiệm với quyết định cuối cùng',
              'Chia sẻ đầy đủ họ tên, địa chỉ, lịch trình cá nhân cho mọi ứng dụng AI miễn phí để nhận được gợi ý chính xác hơn',
              'Tuyệt đối không bao giờ sử dụng bất kì ứng dụng công nghệ hay công cụ AI nào trong học tập và đời sống'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Tin tuyệt đối và để AI làm thay bài tập vừa có nguy cơ dính ảo giác AI, vừa vi phạm tính trung thực và làm giảm năng lực tư duy.',
              'Xuất sắc! Em đã tổng hợp trọn vẹn tinh thần của cả 8 bài học Chuyên đề Trí tuệ nhân tạo lớp 6 (Chủ đề A & Chủ đề B).',
              'Chia sẻ thông tin định danh bừa bãi cho ứng dụng miễn phí vi phạm nguyên tắc bảo vệ tài sản dữ liệu cá nhân và quyền riêng tư.',
              'Mục tiêu của chuyên đề không phải né tránh công nghệ, mà là làm chủ AI một cách an toàn, thông minh và có trách nhiệm.'
            ],
            explanation: 'Thông điệp tổng kết Chuyên đề AI lớp 6: AI hỗ trợ gợi ý – Con người kiểm chứng, bảo vệ dữ liệu, phán đoán ngữ cảnh và làm chủ quyết định cuối cùng.'
          }
        ]
      },
      {
        id: 'ai6-b8-act-5',
        moduleId: 'module-lesson-8',
        title: 'Hoạt động 4B (Vận dụng & Tổng kết chuyên đề 8 bài): Ra quyết định chuyến tham quan lớp 6A & Cam kết làm chủ AI (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Thực hành Quy trình 3 bước ra quyết định cho tình huống chuyến tham quan lớp 6A (SGK Bài 8) và viết Cam kết cá nhân tổng kết Chuyên đề AI lớp 6 (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 8 & TỔNG KẾT CHUYÊN ĐỀ 8 BÀI (SGK & KHBD BÀI 8)\n\nPhần 1 – Thực hành Quy trình 3 bước (Tình huống chuyến tham quan lớp 6A):\nLớp 6A dự định tổ chức chuyến tham quan học tập. An nhờ công cụ AI gợi ý và AI đề xuất: “Tổ chức cắm trại qua đêm tại khu rừng cách trường 70 km”. Tuy nhiên, theo quy định của nhà trường, học sinh lớp 6 chỉ được tham quan trong ngày và nhiều bạn trong lớp dễ bị say xe khi đi đường dài.\n\nEm hãy trình bày đầy đủ theo đúng 3 bước:\n• Bước 1 – Nêu lại gợi ý của công cụ AI.\n• Bước 2 – Cân nhắc đầy đủ các điều kiện thực tế của lớp 6A.\n• Bước 3 – Đưa ra lựa chọn của em (Đồng ý / Điều chỉnh / Từ chối), đề xuất địa điểm tham quan cụ thể phù hợp và nêu rõ lí do thuyết phục.\n\nPhần 2 – Phản tư & Cam kết tổng kết Chuyên đề 8 bài (Chủ đề A & Chủ đề B):\nViết 01 cam kết cá nhân ngắn gọn (2–3 câu) về điều em tâm đắc nhất và cách em sẽ sử dụng, làm chủ công cụ AI an toàn, trung thực, có trách nhiệm trong học tập sắp tới.\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 8):\n- Cấu trúc đủ 3 bước tình huống lớp 6A, chỉ rõ cả 2 điều kiện thực tế (4,0đ)\n- Phương án thay thế hợp lí, an toàn và lí do thuyết phục (4,0đ)\n- Cam kết tổng kết chuyên đề sâu sắc, đúng chính tả và nộp đúng hạn (2,0đ)'
      }
    ]
  };

  const officialFiles = [
    ...OFFICIAL_AI_GRADE6_LESSONS.map((lessonTitle, idx) => ({
      id: `file-ai6-b${idx + 1}-tongquan`,
      name: `0.GioiThieuTongQuan_Bai${idx + 1}.html`,
      filename: '0.GioiThieuTongQuan.html',
      url: `/hoc-lieu/6aiab01/bai${idx + 1}/0.GioiThieuTongQuan.html`,
      size: idx === 2 ? '25 KB' : '26 KB',
      mimetype: 'text/html',
      fileType: 'code',
      folder: lessonTitle,
      moduleId: `module-lesson-${idx + 1}`,
      description: `Tài liệu đọc Giới thiệu tổng quan kèm sơ đồ 4 mạch nội dung chuẩn mẫu M9 cho ${lessonTitle}.`,
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    })),
    {
      id: 'file-ai6-b1-sgk',
      name: '0.SGK_Bai1_NguonGocAI_QuyenQuyetDinh.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai1/0.SGK.docx',
      size: '70 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
      moduleId: 'module-lesson-1',
      description: 'Giáo trình / Sách giáo khoa Bài 1: Nguồn gốc của AI và quyền quyết định (Tin học 6 – Chuyên đề AI).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b1-khbd',
      name: '1.KHBD_Bai1_NguonGocAI_QuyenQuyetDinh.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai1/1.KHBD.docx',
      size: '72 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
      moduleId: 'module-lesson-1',
      description: 'Kế hoạch bài dạy (2 tiết: Tiết 1 Trực tuyến LMS, Tiết 2 Trực tiếp tại lớp) – Bài 1.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b1-hoclieuso',
      name: '2.HocLieuSo_Bai1_NguonGocAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai1/2.HocLieuSo.docx',
      size: '51 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
      moduleId: 'module-lesson-1',
      description: 'Trọn bộ kịch bản Học liệu số Bài 1 (Study Guide, Infographic 1 & 2, Quiz 5 câu, 7 Slide, Game & Rubric 10đ).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b2-sgk',
      name: '0.SGK_Bai2_LoiIch_CachSuDungAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai2/0.SGK.docx',
      size: '65 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
      moduleId: 'module-lesson-2',
      description: 'Giáo trình / Sách giáo khoa Bài 2: Lợi ích và cách sử dụng công cụ AI phù hợp (Tin học 6 – Chuyên đề AI).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b2-khbd',
      name: '1.KHBD_Bai2_LoiIch_CachSuDungAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai2/1.KHBD.docx',
      size: '49 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
      moduleId: 'module-lesson-2',
      description: 'Kế hoạch bài dạy trực tuyến 45 phút trên LMS theo chu trình 5 thành phần + 2 bảng Rubric 10đ – Bài 2.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b2-hoclieuso',
      name: '2.HocLieuSo_Bai2_LoiIch_CachSuDungAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai2/2.HocLieuSo.docx',
      size: '418 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
      moduleId: 'module-lesson-2',
      description: 'Bộ Học liệu số Bài 2 (Study Guide, Diễn đàn, Infographic Bí kíp Prompt, 3 mốc Video tương tác, Poster 4 KHÔNG & Trạm luyện Prompt).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b3-sgk',
      name: '0.SGK_Bai3_ThucChungThongTin_LamChuAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai3/0.SGK.docx',
      size: '19 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
      moduleId: 'module-lesson-3',
      description: 'Sách giáo khoa Bài 3: Thực chứng thông tin – Làm chủ AI (Tin học 6 – Chuyên đề AI).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b3-khbd',
      name: '1.KHBD_Bai3_ThucChungThongTin_LamChuAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai3/1.KHBD.docx',
      size: '73 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
      moduleId: 'module-lesson-3',
      description: 'Kế hoạch bài dạy chuẩn CV 5512 (01 tiết trực tiếp kết hợp LMS) – Bài 3.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b3-hoclieuso',
      name: '2.HocLieuSo_Bai3_ThucChungThongTin.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai3/2.HocLieuSo.docx',
      size: '390 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
      moduleId: 'module-lesson-3',
      description: 'Trọn bộ kịch bản Học liệu số Bài 3 (8 Slide, Infographic 3 kênh kiểm chứng, Game Phòng thí nghiệm, Phiếu Bạch Đằng 938, Quiz 5 câu & Rubric).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b4-sgk',
      name: '0.SGK_Bai4_MatTichCuc_TieuCuc_TinhNangAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai4/0.SGK.docx',
      size: '18 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
      moduleId: 'module-lesson-4',
      description: 'Sách giáo khoa Bài 4: Khám phá mặt tích cực và tiêu cực của một số tính năng AI.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b4-khbd',
      name: '1.KHBD_Bai4_MatTichCuc_TieuCuc_TinhNangAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai4/1.KHBD.docx',
      size: '80 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
      moduleId: 'module-lesson-4',
      description: 'Kế hoạch bài dạy trực tuyến 45 phút trên LMS (YCCĐ 6.B1.1, DP-REG 2023) – Bài 4.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b4-hoclieuso',
      name: '2.HocLieuSo_Bai4_HaiMatTinhNangAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai4/2.HocLieuSo.docx',
      size: '263 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
      moduleId: 'module-lesson-4',
      description: 'Trọn bộ kịch bản Học liệu số Bài 4 (Mô phỏng Thuật toán gợi ý, Infographic Hai mặt AI, Game kéo – thả 10 thẻ & Rubric 10đ).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b5-sgk',
      name: '0.SGK_Bai5_DanhGiaDoAnToanAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai5/0.SGK.docx',
      size: '18 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-5',
      description: 'Sách giáo khoa Bài 5: Đánh giá độ an toàn của Trí tuệ nhân tạo (Tin học 6 – Chuyên đề AI).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b5-khbd',
      name: '1.KHBD_Bai5_DanhGiaDoAnToanAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai5/1.KHBD.docx',
      size: '84 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-5',
      description: 'Kế hoạch bài dạy chuẩn CV 5512 (01 tiết trực tiếp kết hợp LMS, YCCĐ 6.B2.1) – Bài 5.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b5-hoclieuso',
      name: '2.HocLieuSo_Bai5_DanhGiaDoAnToanAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai5/2.HocLieuSo.docx',
      size: '256 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-5',
      description: 'Trọn bộ kịch bản Học liệu số Bài 5 (8 Slide, Data Safety Meitu, Infographic 4 Tiêu chí – 4 Câu hỏi, Game Trạm kiểm định & Quiz 5 câu).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b6-sgk',
      name: '0.SGK_Bai6_DuLieuCaNhanLaTaiSan.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai6/0.SGK.docx',
      size: '18 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
      moduleId: 'module-lesson-6',
      description: 'Sách giáo khoa Bài 6: Dữ liệu cá nhân là tài sản của mỗi con người (Nghị định 13/2023/NĐ-CP).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b6-khbd',
      name: '1.KHBD_Bai6_DuLieuCaNhanLaTaiSan.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai6/1.KHBD.docx',
      size: '83 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
      moduleId: 'module-lesson-6',
      description: 'Kế hoạch bài dạy trực tuyến 45 phút trên LMS (YCCĐ 6.A3.3, Nghị định 13/2023/NĐ-CP) – Bài 6.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b6-hoclieuso',
      name: '2.HocLieuSo_Bai6_DuLieuCaNhanLaTaiSan.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai6/2.HocLieuSo.docx',
      size: '264 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
      moduleId: 'module-lesson-6',
      description: 'Trọn bộ kịch bản Học liệu số Bài 6 (Video Dấu chân số, Infographic Hình 6.2 & 6.3, Module 3 tình huống bạn Minh & Game Kho báu dữ liệu).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b7-sgk',
      name: '0.SGK_Bai7_QuyenRiengTu_KyNangTuVeSo.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai7/0.SGK.docx',
      size: '19 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
      moduleId: 'module-lesson-7',
      description: 'Sách giáo khoa Bài 7: Quyền riêng tư và kỹ năng tự vệ số (Deepfake, Doxing, 3 bước tự vệ số & Tổng đài 111).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b7-khbd',
      name: '1.KHBD_Bai7_QuyenRiengTu_KyNangTuVeSo.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai7/1.KHBD.docx',
      size: '88 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
      moduleId: 'module-lesson-7',
      description: 'Kế hoạch bài dạy trực tuyến 45 phút trên LMS (YCCĐ 6.A3.4, Trắc nghiệm chốt chặn tình huống) – Bài 7.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b7-hoclieuso',
      name: '2.HocLieuSo_Bai7_QuyenRiengTu_TuVeSo.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai7/2.HocLieuSo.docx',
      size: '250 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
      moduleId: 'module-lesson-7',
      description: 'Trọn bộ kịch bản Học liệu số Bài 7 (Infographic 1 & 2, Quiz 3 câu, Kéo thả 6 thẻ, Game phân nhánh 3 màn & Rubric 10đ).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b8-sgk',
      name: '0.SGK_Bai8_ConNguoiLamChuAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai8/0.SGK.docx',
      size: '21 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-8',
      description: 'Sách giáo khoa Bài 8: Con người làm chủ Trí tuệ nhân tạo (Quy trình 3 bước ra quyết định & Điều 14 EU AI Act 2024).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b8-khbd',
      name: '1.KHBD_Bai8_ConNguoiLamChuAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai8/1.KHBD.docx',
      size: '82 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-8',
      description: 'Kế hoạch bài dạy chuẩn CV 5512 (01 tiết trực tiếp kết hợp LMS, YCCĐ 6.A3.1, tổng kết chuyên đề 8 bài) – Bài 8.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b8-hoclieuso',
      name: '2.HocLieuSo_Bai8_ConNguoiLamChuAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai8/2.HocLieuSo.docx',
      size: '245 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-8',
      description: 'Trọn bộ kịch bản Học liệu số Bài 8 (8 Slide, Infographic 3 bước, Game Ngã rẽ thông minh, 4 Thẻ tình huống, Quiz 5 câu & Phiếu Vận dụng 6A).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
  ];

  const officialSyllabus = [
    'Bài 1 – Nguồn gốc của AI và quyền quyết định (2 tiết Blended – 6.A1.1 & 6.A1.2): AI do con người tạo ra (Dữ liệu – Thuật toán – Điều khiển), con người giám sát và giữ quyền quyết định cuối cùng.',
    'Bài 2 – Lợi ích và cách sử dụng công cụ AI phù hợp (1 tiết Trực tuyến – 6.A3.2): 3 lợi ích của AI trong học tập, công thức câu lệnh (Prompt) 3 thành phần và Cẩm nang 4 KHÔNG.',
    'Bài 3 – Thực chứng thông tin – Làm chủ AI (1 tiết Blended – 6.A1.3): Ảo giác AI (Hallucination), nguyên lý Con vẹt ngẫu nhiên (UNESCO 2023) và 3 kênh kiểm chứng thông tin.',
    'Bài 4 – Khám phá mặt tích cực và tiêu cực của một số tính năng AI (1 tiết Trực tuyến – 6.B1.1): Hệ thống gợi ý, Bong bóng thông tin (Filter Bubbles), hai mặt của 3 tính năng AI và thao tác kiểm soát thuật toán.',
    'Bài 5 – Đánh giá độ an toàn của Trí tuệ nhân tạo (1 tiết Blended – 6.B2.1): Tính an toàn, Tính minh bạch (UNICEF 2021), Bộ 4 câu hỏi kiểm tra và đọc mục An toàn dữ liệu (Data Safety).',
    'Bài 6 – Dữ liệu cá nhân là tài sản của mỗi con người (1 tiết Trực tuyến – 6.A3.3): Phân loại dữ liệu cơ bản vs nhạy cảm, 4 quyền của chủ thể dữ liệu và sự đồng ý kép cho trẻ em (Nghị định 13/2023/NĐ-CP).',
    'Bài 7 – Quyền riêng tư và kỹ năng tự vệ số (1 tiết Trực tuyến – 6.A3.4): Ý nghĩa quyền riêng tư, 4 hiểm họa (Deepfake, Doxing, Quấy rối, Scams), Quy tắc 3 Không, 3 bước tự vệ số và Tổng đài 111.',
    'Bài 8 – Con người làm chủ Trí tuệ nhân tạo (1 tiết Blended – 6.A3.1): Phán đoán ngữ cảnh (U.S. Dept. of Education 2023), Điều 14 EU AI Act (2024), Quy trình 3 bước ra quyết định và Cam kết tổng kết chuyên đề.'
  ];

  return {
    lessonModules: [bai1Module, bai2Module, bai3Module, bai4Module, bai5Module, bai6Module, bai7Module, bai8Module],
    officialFiles,
    officialSyllabus
  };
}

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
    const extraTeacherActs = existingActs.filter(a => !seedIds.has(a.id));
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

  // Học liệu 3.LMS.html đã bỏ khỏi khóa học: xóa cả các mục cũ còn lưu trong cơ sở dữ liệu
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

// Bỏ trạng thái "hoàn thành" của video có neo chặn nếu học sinh chưa vượt qua đủ neo chặn
// (ví dụ: đã xem 80% video Bài 1 từ trước khi video được gắn neo chặn). Giữ nguyên số giây đã xem.
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

// Đồng bộ 1 lần toàn bộ học liệu Bài 1 & Bài 2 (từ thư mục BAI1 & BAI2) vào khóa 6AIAB01 mà không làm mất dữ liệu giáo viên hay học sinh
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
// Xây dựng chuẩn theo 2 tài liệu:
// 1) Ý tưởng học liệu tương tác A2.3 – Phòng thí nghiệm Biểu mẫu: Đoán – Chạy – Giải thích (Phan Phi Phú)
// 2) Kế hoạch bài dạy (KHBD) Tin học 12 KNTT – Chủ đề 4 – Bài 12: Tạo biểu mẫu (2 tiết)
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

// Cập nhật nâng cấp 1 lần nội dung 2 bài quiz & tiêu đề tinh gọn cho TIN12-B12, giữ nguyên danh sách học sinh & điểm cũ
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

// Khởi tạo 1 lần khóa học thực tế TIN12-B12 (nếu chưa từng seed và chưa tồn tại) và tự nâng cấp 1 lần lên bản v2-distractors-timer.
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
  const visibleActs = (course.modules || [])
    .filter(m => !m.isHidden)
    .flatMap(m => (m.activities || []).filter(a => !a.isHidden));
  const ids = new Set(visibleActs.map(a => a.id));
  const records = await listProgress({ courseId: course.id, userId });
  const completed = records.filter(p => p.isCompleted && ids.has(p.activityId)).length;
  return ids.size > 0 ? Math.round((completed / ids.size) * 100) : 0;
}

// Tự động cấp Chứng chỉ số khi học sinh hoàn thành 100% hoạt động công bố của khóa học
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

  // Tính điểm trung bình của học sinh trong khóa học
  const scores = [...byAct.values()]
    .map(p => p.score)
    .filter(s => s !== null && s !== undefined && Number.isFinite(Number(s)))
    .map(Number);
  const avg = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 10;
  const gradeClassification = avg >= 8.5 ? 'Xuất sắc' : avg >= 7.5 ? 'Giỏi' : avg >= 6.0 ? 'Khá' : 'Đạt';

  const existingCert = isMongoConnected
    ? await CertModel.findOne({ courseId: course.id, studentId: user.id }).lean()
    : (readDb().certificates || []).find(c => c.courseId === course.id && c.studentId === user.id);

  if (existingCert) return existingCert;

  const certNumber = `LMS2-${course.code || 'CERT'}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const cert = {
    id: `cert-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    certificateNumber: certNumber,
    courseId: course.id,
    courseName: course.name,
    studentId: user.id,
    studentName: user.name || 'Học viên',
    studentCode: user.code || (user.email ? user.email.split('@')[0].toUpperCase() : 'HV'),
    issueDate: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    scoreAverage: avg,
    gradeClassification,
    qrVerificationUrl: `/api/certificates/verify/${certNumber}`,
    signatureName: course.instructor?.name || 'Phan Phi Phú',
    signatureTitle: 'Giáo viên phụ trách • LMS Nhóm 2'
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

// 6. Activities: Mark Completed (ghi nhận cho đúng học sinh đang đăng nhập; chống bỏ qua neo chặn video)
app.post('/api/courses/:id/activities/:actId/complete', requireAuth, async (req, res) => {
  const ctx = await learningContext(req, res);
  if (!ctx) return;
  const existing = await getOneProgress(ctx.course.id, req.user.id, ctx.activity.id);
  const now = nowVN();
  // Bài trắc nghiệm chỉ được tính hoàn thành khi nộp bài và đạt điểm (xử lý ở quiz-submit)
  if (ctx.activity.type === 'quiz') {
    return res.status(400).json({ message: 'Bài trắc nghiệm chỉ được tính hoàn thành khi nộp bài và đạt điểm sàn.' });
  }
  // Học liệu HTML có bài trắc nghiệm bên trong: chỉ hoàn thành khi nộp bài trong học liệu và đạt điểm sàn
  if (Array.isArray(ctx.activity.quizQuestions) && ctx.activity.quizQuestions.length > 0 && !isStaff(req.user)) {
    return res.status(400).json({ message: `Em cần làm bài trắc nghiệm trong học liệu và đạt từ ${Number(ctx.activity.passScore) || 8}/10 điểm để hoàn thành.` });
  }
  // Chống học sinh bỏ qua neo chặn / chống tua của video bằng cách bấm hoàn thành thủ công
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
  const rawCpResults = (req.body.checkpointResults && typeof req.body.checkpointResults === 'object') ? req.body.checkpointResults : {};
  // Máy chủ tự chấm đúng/sai theo đáp án của neo chặn, không tin giá trị isCorrect do trình duyệt gửi lên
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

  // Bảo toàn mốc tiến độ cao nhất (high-water mark) để học sinh tua lại xem không bị mất % đã đạt
  const maxWatchedSeconds = Math.max(prevVp.watchedSeconds || 0, currentPos);
  const maxProgressPercent = Math.min(100, Math.max(prevVp.progressPercent || 0, incomingPercent));
  const allCheckpointsCleared = checkpointsTotal === 0 || checkpointsPassed >= checkpointsTotal;
  // Video có neo chặn chỉ được tính hoàn thành khi đã vượt qua đủ neo chặn; trạng thái hoàn thành cũ (trước khi gắn neo chặn) không được giữ lại
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

// 7. Activities: Submit Assignment (mỗi học sinh một bài nộp riêng, giữ đầy đủ lịch sử các lần nộp & điểm cũ)
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

  // Lưu lại lịch sử các phiên bản bài nộp trước (không bao giờ mất tệp cũ, điểm cũ hay nhận xét cũ của giáo viên)
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

// 9.025 Giáo viên ghi danh hàng loạt học sinh theo danh sách CSV / Email
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

// 9.026 Sắp xếp lại thứ tự các mô-đun & các hoạt động trong mô-đun
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

// ====================== 9.3 TẬP TIN HỌC LIỆU & TẢI TỆP TÙY Ý (FILE UPLOAD ENGINE + MONGODB PERSISTENCE) ======================
// 1. Upload tệp tùy ý (yêu cầu đăng nhập; lưu bền vững trên MongoDB Atlas <=12MB để không mất khi Render restart)
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

// 2. Lấy danh sách tập tin học liệu của khóa học
app.get('/api/courses/:id/files', async (req, res) => {
  const course = await loadCourseObj(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json(course.files || []);
});

// 3. Thêm tập tin vào khóa học (Chỉ giáo viên / quản trị viên; lưu bền vững trên MongoDB Atlas)
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

// 4. Xóa tập tin khỏi khóa học (Chỉ giáo viên / quản trị viên; xóa đồng bộ cả ổ đĩa & MongoDB)
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

// 5. Tải tệp xuống trực tiếp với tên gốc UTF-8 (tự phục hồi từ MongoDB nếu ổ đĩa Render bị xóa)
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

// 10. Certificates (Học sinh xem chứng chỉ của chính mình; giáo viên xem tất cả + xác thực công khai theo mã)
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
  res.json(certs || []);
});

app.get('/api/certificates/verify/:certNumber', async (req, res) => {
  const certNumber = String(req.params.certNumber || '').trim();
  const cert = isMongoConnected
    ? await CertModel.findOne({ certificateNumber: certNumber }).lean()
    : (readDb().certificates || []).find(c => c.certificateNumber === certNumber);
  if (!cert) return res.status(404).json({ message: 'Không tìm thấy chứng chỉ hợp lệ với mã này.' });
  res.json(cert);
});

// 10.5 System Settings (Admin lưu cấu hình hệ thống thật vào MongoDB / Local JSON)
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

// 10.6 Trợ lý AI đọc ngữ cảnh thật của khóa học/tiến độ & tự kết nối Gemini API nếu có GEMINI_API_KEY
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

  // Bộ trợ lý ngữ cảnh thực tế (đọc đúng bài học, tiến độ, hoạt động & hạn nộp thật trên LMS)
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

// 13.1 Thêm người dùng mới (Quyền Quản trị viên — hỗ trợ cấp Tài khoản + Mật khẩu băm scrypt cho GV chấm bài / HS)
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

// 13.12 Cấp / Đặt lại mật khẩu cho người dùng (băm scrypt an toàn, bảo vệ Quản trị viên gốc)
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

// 13.15 Đổi vai trò người dùng (Học viên <-> Giáo viên, bảo vệ tài khoản Quản trị viên gốc)
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
} else {
  // Chế độ tách riêng Backend Node API (Frontend chạy trên Render Static Site Global CDN)
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
// Render recommended timeouts to prevent intermittent 502 / proxy & port-scan drops
httpServer.keepAliveTimeout = 120000;
httpServer.headersTimeout = 120000;
