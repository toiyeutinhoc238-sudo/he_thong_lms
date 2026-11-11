import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  GraduationCap, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, switchRole, setCurrentUser, refreshData } = useApp();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '976502172307-q6lsed0gssm2udppc8cda0ai8u5e4alg.apps.googleusercontent.com';

  const handleGoogleCallback = async (response: any) => {
    if (!response || !response.credential) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await api.auth.googleLogin(response.credential);
      if (res && res.token) {
        localStorage.setItem('lms2_token', res.token);
      }
      if (res && res.user) {
        localStorage.setItem('lms2_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
        switchRole(res.user.role || 'student');
      }
      await refreshData();
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi đăng nhập Google:', err);
      setLoginError(err.message || 'Không thể xác thực với tài khoản Google. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!isLoginModalOpen) return;

    const initGoogleBtn = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && googleClientId) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCallback,
            auto_select: false,
          });

          const btnContainer = document.getElementById('google-btn-container');
          if (btnContainer) {
            btnContainer.innerHTML = '';
            (window as any).google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'continue_with',
              logo_alignment: 'left',
              width: 320
            });
          }
        } catch (e) {
          console.warn('Lỗi khởi tạo Google Identity Services:', e);
        }
      }
    };

    const timer = setTimeout(initGoogleBtn, 300);
    return () => clearTimeout(timer);
  }, [isLoginModalOpen, googleClientId]);

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0374b5] text-white flex items-center justify-center shadow-md shadow-sky-900/20">
              <GraduationCap className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Đăng nhập LMS Nhóm 2
              </h2>
              <p className="text-xs text-slate-500">
                Hệ thống Quản lý Học tập Trực tuyến
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

        {/* Google OAuth Section */}
        <div className="space-y-4 py-2">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-700">
              Xác thực tài khoản qua Google:
            </span>
          </div>

          <div className="flex justify-center w-full min-h-[44px]" id="google-btn-container">
            {/* Fallback button when GIS is loading or rendered */}
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
                  (window as any).google.accounts.id.prompt();
                } else {
                  alert('Đang tải tiện ích Google Sign-In, vui lòng thử lại sau giây lát...');
                }
              }}
              className="w-full max-w-[320px] py-2.5 px-4 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-xs text-xs sm:text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLoggingIn ? 'Đang xác thực Google...' : 'Đăng nhập bằng tài khoản Google'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Xác thực an toàn qua giao thức Google OAuth 2.0</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Hệ thống sẽ tự động đồng bộ họ tên, email và ảnh đại diện từ tài khoản Google của bạn.
        </p>
      </div>
    </div>
  );
};
