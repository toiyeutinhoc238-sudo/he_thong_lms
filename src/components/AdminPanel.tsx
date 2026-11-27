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
  MessageSquare,
  KeyRound,
  Copy,
  Check
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

  // Modal Thêm Người Dùng (Quyền Quản trị viên — hỗ trợ cấp Tài khoản + Mật khẩu cho Giảng viên chấm bài BT4)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'lecturer'>('student');
  const [newUserCode, setNewUserCode] = useState('');
  const [newUserClass, setNewUserClass] = useState('');
  const [newUserSchool, setNewUserSchool] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [userModalSuccess, setUserModalSuccess] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ name: string; username: string; email: string; password: string; role: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Modal Đặt / Đổi mật khẩu cho tài khoản hiện có
  const [pwdTargetUser, setPwdTargetUser] = useState<any | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
    let out = 'LMS@';
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const applyBT4Preset = (preset: 'lecturer' | 'student') => {
    setCreatedCreds(null);
    setUserModalError(null);
    const pwd = generateStrongPassword();
    if (preset === 'lecturer') {
      setNewUserName('Giảng viên Kiểm tra BT4');
      setNewUserUsername('giangvien_bt4');
      setNewUserEmail('giangvien.bt4@lms-nhom2.edu.vn');
      setNewUserRole('lecturer');
      setNewUserCode('GV_BT4');
      setNewUserClass('Hội đồng Đánh giá');
      setNewUserSchool('Khoa CNTT / Sư phạm Tin học');
      setNewUserPassword(pwd);
    } else {
      setNewUserName('Học sinh Kiểm thử BT4');
      setNewUserUsername('hocsinh_bt4');
      setNewUserEmail('hocsinh.bt4@lms-nhom2.edu.vn');
      setNewUserRole('student');
      setNewUserCode('HS_BT4');
      setNewUserClass('Lớp 6A1');
      setNewUserSchool('THCS LMS Nhóm 2');
      setNewUserPassword(pwd);
    }
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdTargetUser || resetPwdValue.trim().length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    setIsSavingPwd(true);
    try {
      await api.users.setPassword(pwdTargetUser.id, resetPwdValue.trim());
      setUsersList(prev => prev.map(u => u.id === pwdTargetUser.id ? { ...u, hasPassword: true } : u));
      setCreatedCreds({
        name: pwdTargetUser.name,
        username: pwdTargetUser.username || pwdTargetUser.email,
        email: pwdTargetUser.email,
        password: resetPwdValue.trim(),
        role: pwdTargetUser.role === 'lecturer' ? 'Giáo viên' : 'Học viên'
      });
      setPwdTargetUser(null);
      setResetPwdValue('');
    } catch (err: any) {
      alert(err?.message || 'Không thể đặt mật khẩu.');
    } finally {
      setIsSavingPwd(false);
    }
  };

  // Cài đặt hệ thống lưu bền vững lên MongoDB / Local JSON
  const [sysSettings, setSysSettings] = useState<Record<string, any>>({
    allowCustomFileUploads: true,
    allowAssignmentResubmit: true,
    autoGradeQuiz: true,
    showQuizReviewAfterSubmit: true,
    lockQuizAnswersBeforeSubmit: true,
    allowStudentForum: true,
    enableAIAssistant: true,
    autoUpdateProgress: true,
    autoIssueCertificate: true
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  useEffect(() => {
    api.settings.get().then(s => { if (s) setSysSettings(prev => ({ ...prev, ...s })); }).catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.settings.save(sysSettings);
      if (res?.settings) setSysSettings(res.settings);
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Không thể lưu cấu hình hệ thống.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangeUserRole = async (userId: string, nextRole: 'student' | 'lecturer') => {
    try {
      const res = await api.users.updateRole(userId, nextRole);
      if (res?.user) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: res.user.role, classOrPosition: res.user.classOrPosition } : u));
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể đổi vai trò người dùng.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setUserModalError('Vui lòng nhập đầy đủ Họ tên và Email.');
      return;
    }
    if (newUserPassword.trim() && newUserPassword.trim().length < 6) {
      setUserModalError('Mật khẩu đăng nhập phải có ít nhất 6 ký tự.');
      return;
    }
    setIsCreatingUser(true);
    setUserModalError(null);
    const plainPwd = newUserPassword.trim();
    try {
      const created = await api.users.create({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        username: newUserUsername.trim() || undefined,
        password: plainPwd || undefined,
        role: newUserRole,
        code: newUserCode.trim() || undefined,
        className: newUserClass.trim() || undefined,
        school: newUserSchool.trim() || undefined
      });
      setUsersList(prev => [created, ...prev]);
      setUserModalSuccess(`Đã thêm thành công người dùng "${created.name}"!`);
      if (plainPwd) {
        setCreatedCreds({
          name: created.name,
          username: created.username || created.email,
          email: created.email,
          password: plainPwd,
          role: created.role === 'lecturer' ? 'Giáo viên / Giảng viên kiểm tra' : 'Học viên'
        });
      }
      setNewUserName('');
      setNewUserEmail('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserCode('');
      setNewUserClass('');
      setNewUserSchool('');
      if (!plainPwd) {
        setTimeout(() => {
          setIsAddUserModalOpen(false);
          setUserModalSuccess(null);
        }, 1200);
      }
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
            <p className="text-xs font-semibold text-slate-500">Học viên & Giảng viên</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{usersList.length}</h3>
            <span className="text-[11px] text-emerald-600 font-bold">Google & Mật khẩu</span>
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
                Hỗ trợ Google OAuth 2.0 và Tài khoản / Mật khẩu băm scrypt lưu trữ tại MongoDB Atlas
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
                        <div>{u.email}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {u.username && (
                            <span className="text-[10px] text-slate-400">@{u.username}</span>
                          )}
                          {u.hasPassword ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-sans font-bold">
                              <KeyRound className="w-2.5 h-2.5" /> Có mật khẩu
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px] font-sans font-semibold">
                              Chỉ Google
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.className || u.classOrPosition || 'Chưa cập nhật'}
                      </td>
                      <td className="py-3 px-4">
                        {u.school || u.department || 'Chưa cập nhật'}
                      </td>
                      <td className="py-3 px-4">
                        {u.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' || u.role === 'admin' ? (
                          <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                            Quản trị viên
                          </span>
                        ) : (
                          <select
                            value={u.role === 'lecturer' ? 'lecturer' : 'student'}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value as 'student' | 'lecturer')}
                            className={`px-2 py-1 rounded-lg font-bold text-[11px] border cursor-pointer focus:outline-none ${
                              u.role === 'lecturer'
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : 'bg-blue-50 text-[#0374b5] border-blue-200'
                            }`}
                            title="Đổi vai trò giữa Học viên và Giáo viên"
                          >
                            <option value="student">Học viên</option>
                            <option value="lecturer">Giáo viên</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.email?.toLowerCase().trim() !== 'phanphiphu04@gmail.com' && (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setPwdTargetUser(u);
                                setResetPwdValue(generateStrongPassword());
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Cấp / Đổi mật khẩu đăng nhập"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Xóa người dùng khỏi hệ thống"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {settingsSavedMsg && (
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu vào máy chủ
                  </span>
                )}
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handleSaveSettings}
                  className="px-4 py-1.5 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] disabled:opacity-50 text-white text-xs font-bold shadow-xs"
                >
                  {savingSettings ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
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
                    <input type="checkbox" checked={Boolean(sysSettings.allowCustomFileUploads)} onChange={e => setSysSettings({ ...sysSettings, allowCustomFileUploads: e.target.checked })} className="rounded accent-[#0374b5] w-4 h-4" />
                    <span>Cho phép tải lên tệp tùy ý & lưu bền vững trên MongoDB Atlas (≤ 12 MB)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(sysSettings.allowAssignmentResubmit)} onChange={e => setSysSettings({ ...sysSettings, allowAssignmentResubmit: e.target.checked })} className="rounded accent-[#0374b5] w-4 h-4" />
                    <span>Cho phép học sinh nộp lại bài và tự động lưu lịch sử phiên bản cũ</span>
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
                    <input type="checkbox" checked={Boolean(sysSettings.autoGradeQuiz)} onChange={e => setSysSettings({ ...sysSettings, autoGradeQuiz: e.target.checked })} className="rounded accent-emerald-600 w-4 h-4" />
                    <span>Tự động chấm điểm trắc nghiệm tức thì & lưu đầy đủ lịch sử các lần làm</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(sysSettings.showQuizReviewAfterSubmit)} onChange={e => setSysSettings({ ...sysSettings, showQuizReviewAfterSubmit: e.target.checked })} className="rounded accent-emerald-600 w-4 h-4" />
                    <span>Hiển thị đáp án chính xác và phần giải thích chi tiết sau khi nộp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(sysSettings.lockQuizAnswersBeforeSubmit)} onChange={e => setSysSettings({ ...sysSettings, lockQuizAnswersBeforeSubmit: e.target.checked })} className="rounded accent-emerald-600 w-4 h-4" />
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
                    <input type="checkbox" checked={Boolean(sysSettings.allowStudentForum)} onChange={e => setSysSettings({ ...sysSettings, allowStudentForum: e.target.checked })} className="rounded accent-amber-600 w-4 h-4" />
                    <span>Cho phép học sinh đặt câu hỏi và bình luận thảo luận trong từng bài học</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(sysSettings.enableAIAssistant)} onChange={e => setSysSettings({ ...sysSettings, enableAIAssistant: e.target.checked })} className="rounded accent-amber-600 w-4 h-4" />
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
                    <input type="checkbox" checked={Boolean(sysSettings.autoUpdateProgress)} onChange={e => setSysSettings({ ...sysSettings, autoUpdateProgress: e.target.checked })} className="rounded accent-indigo-600 w-4 h-4" />
                    <span>Tự động cập nhật thanh tiến độ % học tập cho học sinh sau mỗi bài nộp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(sysSettings.autoIssueCertificate)} onChange={e => setSysSettings({ ...sysSettings, autoIssueCertificate: e.target.checked })} className="rounded accent-indigo-600 w-4 h-4" />
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
                <strong className="text-slate-800 text-sm">MongoDB Atlas Cloud (Mã hóa TLS & Lưu tệp bền vững)</strong>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Động cơ Tải Tệp & Nén dữ liệu</span>
                <strong className="text-slate-800 text-sm">Multer Multi-format + HTTP Gzip Compression</strong>
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

            {/* Nút điền nhanh tài khoản chấm bài BT4 */}
            <div className="p-2.5 bg-sky-50/70 rounded-xl border border-sky-200/80 space-y-1.5 text-[11px]">
              <span className="font-bold text-sky-900 block">Tạo nhanh tài khoản có mật khẩu nộp Giảng viên (BT4):</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyBT4Preset('lecturer')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 font-bold transition-colors"
                >
                  👨‍🏫 Mẫu Giảng viên chấm bài
                </button>
                <button
                  type="button"
                  onClick={() => applyBT4Preset('student')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold transition-colors"
                >
                  🎓 Mẫu Học sinh kiểm thử
                </button>
              </div>
            </div>

            {createdCreds && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Thông tin đăng nhập sẵn sàng gửi lên Teams:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = `Đường dẫn LMS: ${window.location.origin}\nVai trò: ${createdCreds.role}\nTài khoản: ${createdCreds.username}\nEmail: ${createdCreds.email}\nMật khẩu: ${createdCreds.password}`;
                      navigator.clipboard?.writeText(txt).then(() => {
                        setCopiedCreds(true);
                        setTimeout(() => setCopiedCreds(false), 2500);
                      }).catch(() => {});
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    {copiedCreds ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCreds ? 'Đã sao chép' : 'Sao chép gửi Teams'}</span>
                  </button>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-emerald-200 font-mono text-[11px] text-slate-800 space-y-0.5">
                  <div>Link: <strong>{window.location.origin}</strong></div>
                  <div>Tài khoản: <strong>{createdCreds.username}</strong> ({createdCreds.role})</div>
                  <div>Mật khẩu: <strong className="text-emerald-700">{createdCreds.password}</strong></div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa chỉ Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="vanan@lms.edu.vn"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên đăng nhập (Username)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: giangvien_bt4"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Mật khẩu đăng nhập (≥ 6 ký tự — bỏ trống nếu chỉ dùng Google)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewUserPassword(generateStrongPassword())}
                    className="text-[11px] font-bold text-[#0374b5] hover:underline"
                  >
                    Tạo mật khẩu ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Nhập mật khẩu cấp cho Giảng viên / Học sinh..."
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0374b5] focus:bg-white"
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
      {/* Modal Cấp / Đổi Mật Khẩu Người Dùng */}
      {pwdTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Cấp / Đổi Mật Khẩu</h3>
                  <p className="text-[11px] text-slate-500">{pwdTargetUser.name} ({pwdTargetUser.email})</p>
                </div>
              </div>
              <button type="button" onClick={() => setPwdTargetUser(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveResetPassword} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Mật khẩu mới (≥ 6 ký tự)</label>
                  <button
                    type="button"
                    onClick={() => setResetPwdValue(generateStrongPassword())}
                    className="text-[11px] font-bold text-[#0374b5] hover:underline"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  value={resetPwdValue}
                  onChange={(e) => setResetPwdValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0374b5]"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setPwdTargetUser(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingPwd}
                  className="px-5 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingPwd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>Lưu mật khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner hiện thông tin đăng nhập sau khi vừa đặt lại mật khẩu */}
      {createdCreds && !isAddUserModalOpen && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 p-4 text-xs space-y-2 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã cấp mật khẩu mới
            </span>
            <button type="button" onClick={() => setCreatedCreds(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2.5 bg-emerald-50/70 rounded-xl font-mono text-[11px] space-y-0.5 text-slate-800">
            <div>Tài khoản: <strong>{createdCreds.username}</strong></div>
            <div>Mật khẩu: <strong className="text-emerald-700">{createdCreds.password}</strong></div>
          </div>
          <button
            type="button"
            onClick={() => {
              const txt = `Đường dẫn LMS: ${window.location.origin}\nTài khoản: ${createdCreds.username}\nMật khẩu: ${createdCreds.password}`;
              navigator.clipboard?.writeText(txt).then(() => {
                setCopiedCreds(true);
                setTimeout(() => setCopiedCreds(false), 2000);
              }).catch(() => {});
            }}
            className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1"
          >
            {copiedCreds ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCreds ? 'Đã sao chép!' : 'Sao chép thông tin gửi Teams'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
