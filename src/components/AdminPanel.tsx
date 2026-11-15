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
  Edit3, 
  Search, 
  ExternalLink, 
  Sparkles, 
  School, 
  GraduationCap, 
  UserPlus, 
  X, 
  Loader2,
  Sliders,
  UploadCloud,
  FileCheck2,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { EditCourseModal } from './EditCourseModal';

export const AdminPanel: React.FC = () => {
  const { currentUser, courses, setCourses, navigateToCourse, setCurrentView, deleteCourse, updateCourse } = useApp();

  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'settings'>('courses');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  // Modal Thêm Người Dùng (Quyền Quản trị viên)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'lecturer'>('student');
  const [newUserCode, setNewUserCode] = useState('');
  const [newUserClass, setNewUserClass] = useState('');
  const [newUserSchool, setNewUserSchool] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [userModalSuccess, setUserModalSuccess] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setUserModalError('Vui lòng nhập đầy đủ Họ tên và Email.');
      return;
    }
    setIsCreatingUser(true);
    setUserModalError(null);
    try {
      const created = await api.users.create({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        code: newUserCode.trim() || undefined,
        className: newUserClass.trim() || undefined,
        school: newUserSchool.trim() || undefined
      });
      setUsersList(prev => [created, ...prev]);
      setUserModalSuccess(`Đã thêm thành công người dùng "${created.name}"!`);
      setTimeout(() => {
        setIsAddUserModalOpen(false);
        setUserModalSuccess(null);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserCode('');
        setNewUserClass('');
        setNewUserSchool('');
      }, 1500);
    } catch (err: any) {
      setUserModalError(err.message || 'Lỗi khi thêm người dùng mới.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${userName}" khỏi hệ thống?`)) return;
    try {
      await api.users.delete(userId);
      setUsersList(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || 'Không thể xóa người dùng này.');
    }
  };

  // Fetch users from API (Chỉ lấy tài khoản thật từ hệ thống)
  useEffect(() => {
    setLoadingUsers(true);
    api.users.getAll()
      .then(res => {
        if (Array.isArray(res)) setUsersList(res);
      })
      .catch(() => {
        if (currentUser?.id && currentUser?.email) {
          setUsersList([currentUser]);
        } else {
          setUsersList([]);
        }
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, [currentUser]);

  const filteredUsers = usersList.filter(u => {
    const q = searchUser.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || 
           (u.email || '').toLowerCase().includes(q) || 
           (u.code || '').toLowerCase().includes(q) ||
           (u.school || u.department || '').toLowerCase().includes(q);
  });

  const totalModulesCount = courses.reduce((acc, c) => acc + (c.modules || []).length, 0);

  const canManage = Boolean(
    currentUser?.role === 'admin' || 
    currentUser?.role === 'lecturer' || 
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com'
  );

  if (!canManage) {
    return (
      <div className="flex-1 p-8 text-center space-y-4 max-w-md mx-auto my-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">Truy cập bị giới hạn</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Chỉ Quản trị viên và Giáo viên mới có quyền truy cập vào Trung tâm Quản trị hệ thống.
        </p>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-5 py-2.5 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

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
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-sky-50 text-[#0374b5] font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Khóa Học Mới</span>
          </button>
        </div>
      </div>

      {/* 3 Trụ Cột Quyền Quản Trị Hệ Thống (Theo Đúng Yêu Cầu Chuyên Đề: Tạo khóa học, Thêm người dùng, Cấu hình hoạt động) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0374b5] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
              Yêu cầu Chuyên đề LMS
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Xác định và Trình bày 3 Quyền Quản Trị Hệ Thống
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Tài khoản: <strong>{currentUser?.email}</strong> (Quản trị viên)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quyền 1: Tạo khóa học */}
          <div 
            onClick={() => { setActiveTab('courses'); setCurrentView('courses-list'); }}
            className="p-4 rounded-2xl border-2 border-sky-100 bg-sky-50/40 hover:bg-sky-50 hover:border-[#0374b5] transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-[#0374b5] text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 bg-[#0374b5]/10 text-[#0374b5] text-[10px] font-black rounded-lg">
                  Quyền 1
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-[#0374b5] transition-colors">
                Tạo khóa học
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khởi tạo môn học mới, thiết lập mã môn, khối lớp (Lớp 1 - 12), phân công giáo viên phụ trách và xây dựng cấu trúc các chương, bài học.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#0374b5] flex items-center gap-1 group-hover:underline">
              <span>Thực hiện: Tạo khóa học mới</span>
              <span>→</span>
            </div>
          </div>

          {/* Quyền 2: Thêm người dùng */}
          <div 
            onClick={() => { setActiveTab('users'); setIsAddUserModalOpen(true); }}
            className="p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-600 transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 bg-emerald-600/10 text-emerald-700 text-[10px] font-black rounded-lg">
                  Quyền 2
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                Thêm người dùng
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cấp tài khoản mới vào hệ thống, phân quyền vai trò (Admin / Giáo viên / Học viên), cấu hình mã số, trường học và danh sách lớp.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:underline">
              <span>Thực hiện: Thêm người dùng ngay</span>
              <span>→</span>
            </div>
          </div>

          {/* Quyền 3: Cấu hình hoạt động */}
          <div 
            onClick={() => setActiveTab('settings')}
            className="p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-600 transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sliders className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 bg-indigo-600/10 text-indigo-700 text-[10px] font-black rounded-lg">
                  Quyền 3
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                Cấu hình hoạt động
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thiết lập quy chế nộp bài tập (tải tệp tùy ý 100MB), cấu hình làm bài trắc nghiệm Quiz chấm điểm tự động, diễn đàn và cấp chứng chỉ.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-indigo-700 flex items-center gap-1 group-hover:underline">
              <span>Thực hiện: Cấu hình hoạt động</span>
              <span>→</span>
            </div>
          </div>
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
          <Sliders className="w-4 h-4" />
          <span>Cấu hình Hoạt động & Hệ thống</span>
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
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center mx-auto text-2xl">
                🎓
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800">Chưa có khóa học nào trên hệ thống</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hiện chưa có khóa học nào. Quản trị viên có thể bấm nút bên dưới để tạo khóa học và xây dựng các bài học, bài tập.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setCurrentView('courses-list')}
                  className="px-6 py-2.5 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Khóa Học Mới</span>
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
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-[#0374b5] font-black text-[10px] uppercase shadow-xs">
                          {course.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px] shadow-xs">
                          {course.gradeLevel || 'Lớp 1 - 12'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/70 text-white font-semibold text-[10px] backdrop-blur-xs">
                          {course.category}
                        </span>
                      </div>
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingCourse(course)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0374b5] hover:bg-sky-50"
                        title="Chỉnh sửa khóa học"
                      >
                        <Edit3 className="w-4 h-4 text-[#0374b5]" />
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

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, lớp..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-4 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 w-full sm:w-auto justify-center"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Người Dùng</span>
              </button>
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
                  <th className="py-3 px-4">VAI TRÒ</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
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
                            : u.role === 'lecturer'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-blue-100 text-[#0374b5] border border-blue-200'
                        }`}>
                          {u.role === 'admin' ? 'Quản trị viên' : u.role === 'lecturer' ? 'Giáo viên' : 'Học viên'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.email?.toLowerCase().trim() !== 'phanphiphu04@gmail.com' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa người dùng khỏi hệ thống"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cấu hình Hoạt động & Hệ thống */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Nhóm 1: Cấu hình Hoạt động Đào tạo & Học tập (Quyền Quản trị 3) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Quyền Quản Trị: Cấu hình hoạt động
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Cấu hình Hoạt Động Đào Tạo & Kiểm Tra Trực Tuyến
                </h2>
              </div>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đang áp dụng toàn hệ thống
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cấu hình 1: Tải lên tệp tùy ý & nộp bài tập */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0374b5] flex items-center justify-center shrink-0">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Cấu hình Tải Tệp Lên & Nộp Bài Tập (Assignment)
                    </h3>
                    <p className="text-[11px] text-slate-500">Quy tắc nộp tài liệu bài học và bài làm của học sinh</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs border-t border-slate-200/80 pt-2.5 text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-[#0374b5] w-4 h-4" />
                    <span>Cho phép tải lên tệp tùy ý (PDF, Word, Excel, PowerPoint, Ảnh, Video, ZIP, Mã nguồn...)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-[#0374b5] w-4 h-4" />
                    <span>Dung lượng tối đa mỗi tệp: <strong>100 MB</strong> (Động cơ Multer Streaming)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-[#0374b5] w-4 h-4" />
                    <span>Cho phép học sinh nộp lại bài trước thời hạn chót của giáo viên</span>
                  </label>
                </div>
              </div>

              {/* Cấu hình 2: Trắc nghiệm Quiz */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Cấu hình Hoạt Động Kiểm Tra Trắc Nghiệm (Quiz)
                    </h3>
                    <p className="text-[11px] text-slate-500">Đánh giá và chấm điểm tự động bài làm</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs border-t border-slate-200/80 pt-2.5 text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-emerald-600 w-4 h-4" />
                    <span>Tự động chấm điểm trắc nghiệm tức thì ngay khi học sinh bấm nộp bài</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-emerald-600 w-4 h-4" />
                    <span>Hiển thị đáp án chính xác và phần giải thích chi tiết sau khi nộp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-emerald-600 w-4 h-4" />
                    <span>Tự động khóa đáp án đối với học sinh chưa hoàn thành bài làm</span>
                  </label>
                </div>
              </div>

              {/* Cấu hình 3: Diễn đàn & Trợ lý AI */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Cấu hình Diễn Đàn & Tương Tác Học Tập
                    </h3>
                    <p className="text-[11px] text-slate-500">Trao đổi bài học giữa học sinh, giáo viên và AI</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs border-t border-slate-200/80 pt-2.5 text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-amber-600 w-4 h-4" />
                    <span>Cho phép học sinh đặt câu hỏi và bình luận thảo luận trong từng bài học</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-amber-600 w-4 h-4" />
                    <span>Kích hoạt Trợ lý Trí tuệ Nhân tạo AI LMS hỗ trợ học tập trực tuyến 24/7</span>
                  </label>
                </div>
              </div>

              {/* Cấu hình 4: Cấp chứng chỉ & Đánh giá tiến độ */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Cấu hình Đánh Giá Tiến Độ & Cấp Chứng Chỉ
                    </h3>
                    <p className="text-[11px] text-slate-500">Điều kiện hoàn thành khóa học và cấp giấy chứng nhận</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs border-t border-slate-200/80 pt-2.5 text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-indigo-600 w-4 h-4" />
                    <span>Tự động cập nhật thanh tiến độ % học tập cho học sinh sau mỗi bài nộp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-indigo-600 w-4 h-4" />
                    <span>Tự động cấp Giấy chứng nhận số khi học sinh đạt 100% tiến độ bài học</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Nhóm 2: Thông số Kỹ thuật & Cấu hình Nền tảng Cloud */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Thông số Kỹ thuật & Hạ tầng Nền tảng
              </h2>
              <p className="text-xs text-slate-500">
                Thông tin cấu hình hạ tầng hệ thống LMS Nhóm 2
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
                <span className="text-slate-400 font-bold block">Động cơ Tải Tệp Lên</span>
                <strong className="text-slate-800 text-sm">Multer 100MB Multi-format Engine</strong>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Chỉnh Sửa Khóa Học */}
      <EditCourseModal
        isOpen={!!editingCourse}
        course={editingCourse}
        onClose={() => setEditingCourse(null)}
        onSave={async (courseId, data) => {
          await updateCourse(courseId, data);
        }}
      />

      {/* Modal Thêm Người Dùng Mới (Quyền Quản trị viên) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0374b5] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Thêm Người Dùng Mới</h3>
                  <p className="text-[11px] text-slate-500">Cấp quyền và tạo tài khoản vào hệ thống LMS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Địa chỉ Email (Định danh đăng nhập) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Ví dụ: vanan.nguyen@gmail.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vai trò trên hệ thống
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#0374b5]"
                  >
                    <option value="student">🎓 Học viên (Học sinh)</option>
                    <option value="lecturer">👨‍🏫 Giáo viên phụ trách</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã số học viên / GV
                  </label>
                  <input
                    type="text"
                    placeholder="HV001"
                    value={newUserCode}
                    onChange={(e) => setNewUserCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0374b5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lớp học
                  </label>
                  <input
                    type="text"
                    placeholder="Lớp 6A1"
                    value={newUserClass}
                    onChange={(e) => setNewUserClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0374b5]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trường / Đơn vị
                  </label>
                  <input
                    type="text"
                    placeholder="THCS LMS Nhóm 2"
                    value={newUserSchool}
                    onChange={(e) => setNewUserSchool(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0374b5]"
                  />
                </div>
              </div>

              {userModalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{userModalError}</span>
                </div>
              )}

              {userModalSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{userModalSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  disabled={isCreatingUser}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tạo Người Dùng</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
