/**
 * Reference REST API Server for VLE HCMUE
 * Chạy bằng Node.js thuần (Zero dependencies - không cần cài thêm npm package nào).
 * 
 * Lệnh chạy:
 *   node server.js
 * 
 * Server sẽ lắng nghe tại: http://localhost:5000/api
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

// Khởi tạo database mẫu nếu chưa tồn tại
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [
        {
          id: 'user-1',
          name: 'Nguyễn Văn An',
          username: '48.01.104.055',
          email: '4801104055@student.hcmue.edu.vn',
          role: 'student',
          code: '48.01.104.055',
          department: 'Khoa Công nghệ Thông tin',
          classOrPosition: 'K48 Sư phạm Tin học',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        },
        {
          id: 'user-2',
          name: 'TS. Trần Minh Khoa',
          username: 'khoatm@hcmue.edu.vn',
          email: 'khoatm@hcmue.edu.vn',
          role: 'lecturer',
          code: 'CB-HCMUE-2015',
          department: 'Khoa Tâm lý - Giáo dục',
          classOrPosition: 'Giảng viên chính',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        }
      ],
      courses: [],
      notifications: [],
      certificates: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

initDb();

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return { users: [], courses: [], notifications: [], certificates: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  console.log(`[API ${method}] ${pathname}`);

  try {
    // 1. Auth: Login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const db = readDb();
      const user = db.users.find(u => u.username === body.username) || {
        id: `user-${Date.now()}`,
        name: body.username || 'Người dùng VLE',
        username: body.username,
        email: `${body.username}@hcmue.edu.vn`,
        role: body.username?.includes('gv') ? 'lecturer' : body.username?.includes('admin') ? 'admin' : 'student',
        code: body.username,
        department: 'Trường ĐH Sư phạm TP.HCM',
        classOrPosition: 'Học viên trực tuyến',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };

      return sendJson(res, 200, {
        token: `vle_token_${Date.now()}_${Buffer.from(user.username || 'user').toString('base64')}`,
        user
      });
    }

    // 2. Auth: Get Current Profile
    if (pathname === '/api/auth/me' && method === 'GET') {
      const db = readDb();
      return sendJson(res, 200, db.users[0] || {});
    }

    // 3. Courses: Get All
    if (pathname === '/api/courses' && method === 'GET') {
      const db = readDb();
      return sendJson(res, 200, db.courses);
    }

    // 4. Courses: Create New Course
    if (pathname === '/api/courses' && method === 'POST') {
      const body = await parseBody(req);
      const db = readDb();
      const newCourse = {
        id: `course-${Date.now()}`,
        code: body.code || 'HP-NEW',
        name: body.name || 'Học phần mới',
        category: body.category || 'student_regular',
        credits: body.credits || 3,
        semester: body.semester || 'Học kỳ 1',
        academicYear: '2026 - 2027',
        instructor: body.instructor || {
          name: 'Giảng viên HCMUE',
          title: 'Khoa Sư phạm',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        },
        thumbnail: body.thumbnail || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
        progress: 0,
        totalActivities: 0,
        completedActivities: 0,
        description: body.description || '',
        modules: [],
        announcements: [],
        ...body
      };

      db.courses.push(newCourse);
      writeDb(db);
      return sendJson(res, 201, newCourse);
    }

    // 5. Courses: Get By ID
    const courseMatch = pathname.match(/^\/api\/courses\/([^\/]+)$/);
    if (courseMatch && method === 'GET') {
      const courseId = courseMatch[1];
      const db = readDb();
      const course = db.courses.find(c => c.id === courseId);
      if (!course) return sendJson(res, 404, { message: 'Không tìm thấy khóa học' });
      return sendJson(res, 200, course);
    }

    // 6. Notifications: Get All
    if (pathname === '/api/notifications' && method === 'GET') {
      const db = readDb();
      return sendJson(res, 200, db.notifications);
    }

    // 7. Certificates: Get My Certificates
    if (pathname === '/api/certificates' && method === 'GET') {
      const db = readDb();
      return sendJson(res, 200, db.certificates);
    }

    // 8. Users: Get All
    if (pathname === '/api/users' && method === 'GET') {
      const db = readDb();
      return sendJson(res, 200, db.users);
    }

    // Fallback 404
    return sendJson(res, 404, { message: `Endpoint ${method} ${pathname} chưa được hỗ trợ.` });
  } catch (error) {
    console.error('API Server Error:', error);
    return sendJson(res, 500, { message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 VLE HCMUE Backend API Server is running!`);
  console.log(`👉 http://localhost:${PORT}/api`);
  console.log(`Database storage: ${DB_FILE}`);
  console.log(`======================================================\n`);
});
