import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  GraduationCap, 
  Lock, 
  User, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Role, TrainingType } from '../types';
import api from '../services/api';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, switchRole, activeRole, setCurrentUser, refreshData } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<TrainingType>('student_regular');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleQuickLogin = (role: Role) => {
    switchRole(role);
    setIsLoginModalOpen(false);
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      // 1. Call real API login endpoint: POST /api/auth/login
      const res = await api.auth.login({
        username,
        password,
        program: selectedProgram
      });

      if (res && res.token) {
        localStorage.setItem('hcmue_vle_token', res.token);
      }
      if (res && res.user) {
        setCurrentUser(res.user);
        switchRole(res.user.role || 'student');
      }

      await refreshData();
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.log('Login API notice:', err.message);
      // If backend API isn't online yet, fall back gracefully
      setLoginError(`Chưa kết nối được API backend (/api/auth/login). Đã đăng nhập tạm với tài khoản: ${username}`);
      setTimeout(() => {
        if (username.toLowerCase().includes('admin')) {
          switchRole('admin');
        } else if (username.toLowerCase().includes('gv') || username.toLowerCase().includes('teacher')) {
          switchRole('lecturer');
        } else {
          switchRole('student');
        }
        setIsLoginModalOpen(false);
      }, 1200);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-hcmue-800 text-white flex items-center justify-center shadow-md shadow-hcmue-900/20">
              <GraduationCap className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-hcmue-900">
                Đăng nhập VLE HCMUE
              </h2>
              <p className="text-xs text-slate-500">
                Xác thực tài khoản qua API Backend
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loginError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Quick Demo Switcher Accounts */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/60 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-hcmue-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Chuyển nhanh vai trò giao diện:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('student')}
              className={`p-2 rounded-xl text-xs font-bold transition-all text-center border ${
                activeRole === 'student'
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-100'
              }`}
            >
              Sinh viên
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('lecturer')}
              className={`p-2 rounded-xl text-xs font-bold transition-all text-center border ${
                activeRole === 'lecturer'
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100'
              }`}
            >
              Giảng viên
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className={`p-2 rounded-xl text-xs font-bold transition-all text-center border ${
                activeRole === 'admin'
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-100'
              }`}
            >
              Quản trị viên
            </button>
          </div>
        </div>

        {/* Official VLE Form */}
        <form onSubmit={handleFormLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hệ đào tạo (Training Program)
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-hcmue-600 focus:bg-white"
            >
              <option value="student_regular">Student Training (Đại học & Sau đại học)</option>
              <option value="teacher_training">Teacher Training (Bồi dưỡng Giáo viên)</option>
              <option value="community">Community / Sinh hoạt Công dân</option>
              <option value="internal">Internal Training (Bồi dưỡng nội bộ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên đăng nhập (Username / MSSV / Email)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nhập tên đăng nhập hoặc MSSV"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-hcmue-600 focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Mật khẩu (Password)
              </label>
              <a href="#" className="text-[11px] text-hcmue-700 hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-hcmue-600 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-hcmue-700"
              />
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>

            <span className="text-slate-400 text-[11px]">Bảo mật SSL 256-bit</span>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 bg-hcmue-800 hover:bg-hcmue-900 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-hcmue-950/20 flex items-center justify-center gap-2"
          >
            <span>{isLoggingIn ? 'Đang gọi API đăng nhập...' : 'Đăng nhập hệ thống (Call API)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Support Notice */}
        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
          <p>
            Cần cấp lại mật khẩu hoặc hỗ trợ tài khoản?
          </p>
          <a href="mailto:hotrovle@hcmue.edu.vn" className="text-hcmue-700 font-bold hover:underline">
            Email: hotrovle@hcmue.edu.vn | Hotline: (028) 3835 2020
          </a>
        </div>
      </div>
    </div>
  );
};
