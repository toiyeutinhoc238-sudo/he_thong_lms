import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Course } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Layers, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  ExternalLink,
  Sparkles,
  School,
  GraduationCap
} from 'lucide-react';
import api from '../services/api';

export const AdminPanel: React.FC = () => {
  const { currentUser, courses, setCourses, navigateToCourse, setCurrentView, deleteCourse } = useApp();

  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'settings'>('courses');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  // Fetch users from API
  useEffect(() => {
    setLoadingUsers(true);
    api.users.getAll()
      .then(res => {
        if (Array.isArray(res)) setUsersList(res);
      })
      .catch(() => {
        setUsersList([
          {
            id: currentUser.id || 'admin',
            code: currentUser.code || 'PHANPHIPHU04',
            name: currentUser.name || 'Phú Phan',
            email: currentUser.email || 'phanphiphu04@gmail.com',
            department: currentUser.school || 'LMS Nhóm 2',
            classOrPosition: 'Quản trị viên',
            role: 'admin'
          }
        ]);
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, [currentUser]);

  // Tạo khóa học mẫu chuẩn với 1 click
  const handleSeedSampleCourse = () => {
    const courseId = `course-sample-${Date.now()}`;
    const mod1Id = `mod-1-${Date.now()}`;
    const mod2Id = `mod-2-${Date.now()}`;

    const sampleCourse: Course = {
      id: courseId,
      name: 'Nhập Môn Trí Tuệ Nhân Tạo & Học Máy',
      code: 'AI-101',
      category: 'student_regular',
      credits: 3,
      semester: 'Học kỳ 1 - 2026',
      academicYear: '2026-2027',
      instructor: {
        id: currentUser.id || 'admin',
        name: currentUser.name || 'Quản trị viên',
        email: currentUser.email || 'admin@lms2.edu.vn',
        avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        title: 'Giảng viên phụ trách'
      },
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      progress: 0,
      totalActivities: 5,
      completedActivities: 0,
      description: 'Chương trình đào tạo toàn diện về Trí tuệ Nhân tạo, Thị giác máy tính, Xử lý ngôn ngữ tự nhiên và thực hành ứng dụng thực tế.',
      targetAudience: 'Học viên',
      syllabus: ['Tổng quan AI', 'Xử lý hình ảnh', 'Mô hình học máy', 'Đồ án cuối kỳ'],
      modules: [
        {
          id: mod1Id,
          courseId: courseId,
          title: 'Bài 1: Nguồn gốc của AI và Quyền quyết định',
          description: 'Tìm hiểu lịch sử và các khái niệm cốt lõi của Trí tuệ Nhân tạo',
          order: 1,
          activities: [
            {
              id: `act-1-${Date.now()}`,
              moduleId: mod1Id,
              title: 'Khảo sát nhận thức ban đầu: Trí tuệ nhân tạo (AI)',
              type: 'document',
              durationMinutes: 15,
              isCompleted: false,
              isRequired: true,
              description: 'Tài liệu đọc hiểu và định hướng môn học'
            },
            {
              id: `act-2-${Date.now()}`,
              moduleId: mod1Id,
              title: 'Video tương tác: Bản chất của AI & Ứng dụng thực tế',
              type: 'video',
              videoUrl: 'https://www.youtube.com/watch?v=2ePf9rue1Ao',
              durationMinutes: 20,
              isCompleted: false,
              isRequired: true,
              description: 'Bài giảng video tương tác trực quan'
            },
            {
              id: `act-3-${Date.now()}`,
              moduleId: mod1Id,
              title: 'Bài tập 1: Phân tích các trường hợp ứng dụng AI quanh ta',
              type: 'assignment',
              durationMinutes: 45,
              isCompleted: false,
              isRequired: true,
              maxScore: 10,
              description: 'Nộp bài thu hoạch dạng văn bản hoặc tập tin'
            }
          ]
        },
        {
          id: mod2Id,
          courseId: courseId,
          title: 'Bài 2: Lợi ích và Cách sử dụng công cụ AI phù hợp',
          description: 'Kỹ năng khai thác Prompt Engineering và các mô hình ngôn ngữ lớn',
          order: 2,
          activities: [
            {
              id: `act-4-${Date.now()}`,
              moduleId: mod2Id,
              title: 'Tài liệu hướng dẫn: Nguyên tắc đạo đức khi ứng dụng AI',
              type: 'document',
              durationMinutes: 25,
              isCompleted: false,
              isRequired: true,
              description: 'Quy tắc liêm chính học thuật và bảo vệ dữ liệu'
            },
            {
              id: `act-5-${Date.now()}`,
              moduleId: mod2Id,
              title: 'Bài kiểm tra trắc nghiệm số 1: Kiến thức nền tảng AI',
              type: 'quiz',
              durationMinutes: 15,
              isCompleted: false,
              isRequired: true,
              maxScore: 10,
              description: 'Trắc nghiệm tự động chấm điểm'
            }
          ]
        }
      ],
      announcements: [],
      enrolledStudentsCount: 1,
      certificateEligible: true
    };

    setCourses(prev => [sampleCourse, ...prev]);
    alert('Đã khởi tạo thành công khóa học mẫu chuẩn "Nhập Môn Trí Tuệ Nhân Tạo & Học Máy" với đầy đủ 2 chương và 5 hoạt động bài tập, video, trắc nghiệm!');
  };

  const filteredUsers = usersList.filter(u => {
    const q = searchUser.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || 
           (u.email || '').toLowerCase().includes(q) || 
           (u.code || '').toLowerCase().includes(q) ||
           (u.school || u.department || '').toLowerCase().includes(q);
  });

  const totalModulesCount = courses.reduce((acc, c) => acc + (c.modules || []).length, 0);

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
      {/* Admin Hero Header */}
      <div className="bg-gradient-to-r from-[#0374b5] via-sky-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Trung tâm Quản trị LMS Nhóm 2</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Bảng Điều Khiển Quản Trị Hệ Thống
          </h1>

          <p className="text-sky-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Xin chào <strong>{currentUser.name}</strong>! Bạn có toàn quyền quản trị khóa học, điều phối học viên và cấu hình kho tài nguyên học tập số.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setCurrentView('courses-list')}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-sky-50 text-[#0374b5] font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Khóa Học</span>
          </button>

          <button
            onClick={handleSeedSampleCourse}
            className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>+ Khóa Học Mẫu</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Tổng số Khóa học</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{courses.length}</h3>
            <span className="text-[11px] text-[#0374b5] font-bold">Học phần trực tuyến</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Học viên Đã đăng ký</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{usersList.length}</h3>
            <span className="text-[11px] text-emerald-600 font-bold">Tài khoản Google</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Chương & Hoạt động</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{totalModulesCount}</h3>
            <span className="text-[11px] text-indigo-600 font-bold">Chương học tập</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Trạng thái Cơ sở Dữ liệu</p>
            <h3 className="text-base font-black text-emerald-600">Đã kết nối</h3>
            <span className="text-[11px] text-slate-400 font-medium">MongoDB Atlas Cloud</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'bg-[#0374b5] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Quản lý Khóa học ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-[#0374b5] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh sách Học viên ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-[#0374b5] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cấu hình Hệ thống</span>
        </button>
      </div>

      {/* Tab 1: Quản lý Khóa học */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">
              Danh sách Khóa học trên hệ thống
            </h2>
            <button
              onClick={() => setCurrentView('courses-list')}
              className="text-xs font-bold text-[#0374b5] hover:underline flex items-center gap-1"
            >
              <span>Xem trang Khóa học đầy đủ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                🎓
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800">Chưa có khóa học nào trên hệ thống</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Bạn có thể bấm nút tạo khóa học tùy chỉnh hoặc bấm nút bên dưới để tự động tạo một khóa học mẫu chuẩn Trí tuệ Nhân tạo với đầy đủ bài tập và video.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSeedSampleCourse}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-extrabold shadow-sm transition-all"
                >
                  ⚡ Khởi tạo Khóa học mẫu ngay
                </button>
                <button
                  onClick={() => setCurrentView('courses-list')}
                  className="px-5 py-2.5 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-extrabold shadow-sm transition-all"
                >
                  + Tự tạo Khóa học mới
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 relative">
                      <img src={course.thumbnail} alt={course.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/95 text-[#0374b5] font-black text-[10px] uppercase shadow-xs">
                        {course.code}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-1">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => navigateToCourse(course.id)}
                      className="text-xs font-bold text-[#0374b5] hover:underline flex items-center gap-1"
                    >
                      <span>Vào quản lý nội dung →</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xác nhận xóa khóa học "${course.name}"?`)) {
                          deleteCourse(course.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Xóa khóa học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Quản lý Học viên */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Danh sách Tài khoản Học viên & Quản trị
              </h2>
              <p className="text-xs text-slate-500">
                Dữ liệu được đồng bộ từ Google OAuth 2.0 và lưu trữ tại MongoDB Atlas
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, lớp..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0374b5] focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <th className="py-3 px-4 rounded-l-xl">MÃ SỐ</th>
                  <th className="py-3 px-4">HỌ VÀ TÊN</th>
                  <th className="py-3 px-4">EMAIL</th>
                  <th className="py-3 px-4">LỚP</th>
                  <th className="py-3 px-4">TRƯỜNG HỌC</th>
                  <th className="py-3 px-4 rounded-r-xl">VAI TRÒ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Chưa có học viên nào phù hợp với tìm kiếm
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0374b5]">
                        {u.code || u.email?.split('@')[0].toUpperCase()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        {u.className || u.classOrPosition || 'Chưa cập nhật'}
                      </td>
                      <td className="py-3 px-4">
                        {u.school || u.department || 'Chưa cập nhật'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-[#0374b5] border border-blue-200'
                        }`}>
                          {u.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cấu hình Hệ thống */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Thông số Kỹ thuật & Cấu hình Nền tảng
            </h2>
            <p className="text-xs text-slate-500">
              Thông tin cấu hình hệ thống LMS Nhóm 2
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold block">Tên Nền tảng Đào tạo</span>
              <strong className="text-slate-800 text-sm">Hệ thống LMS Nhóm 2</strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold block">Xác thực Danh tính</span>
              <strong className="text-slate-800 text-sm">Google OAuth 2.0 Identity Services</strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold block">Cơ sở dữ liệu Đám mây</span>
              <strong className="text-slate-800 text-sm">MongoDB Atlas Cloud Cluster (vjKs2Siuwi5Kpcfx)</strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold block">Giao thức Điều khiển Khóa học</span>
              <strong className="text-slate-800 text-sm">Tiêu chuẩn Kiến trúc LMS Nhóm 2</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
