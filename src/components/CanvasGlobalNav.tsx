import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  HelpCircle,
  GraduationCap,
  ShieldCheck,
  Presentation
} from 'lucide-react';

export const CanvasGlobalNav: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    currentUser 
  } = useApp();

  const isNavActive = (key: string) => {
    if (key === 'account') return currentView === 'profile';
    if (key === 'courses') return currentView === 'courses-list' || currentView === 'course-detail' || currentView === 'activity';
    if (key === 'teaching') return currentView === 'teacher-studio';
    if (key === 'admin') return currentView === 'admin-panel';
    if (key === 'help') return currentView === 'help';
    return false;
  };

  const handleGoHome = () => setCurrentView('courses-list');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com';
  const isStaff = isAdmin || currentUser?.role === 'lecturer';

  return (
    <aside className="w-[78px] shrink-0 min-h-screen bg-[#0374b5] flex flex-col items-center py-2 text-white select-none z-30 shadow-md">
      {/* Brand Logo / Institution Top Icon */}
      <div 
        onClick={handleGoHome}
        className="w-12 h-12 flex flex-col items-center justify-center cursor-pointer mb-2 group transition-transform active:scale-95"
        title="LMS Nhóm 2 - Danh sách Khóa học"
      >
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="text-[10px] font-black tracking-wider uppercase opacity-90 mt-0.5">Nhóm 2</span>
      </div>

      {/* Nav Items List - Giữ lại Tài khoản và Khóa học gọn gàng, tránh xao nhãng */}
      <nav className="w-full flex-1 flex flex-col items-center space-y-1">
        {/* 1. Account / Tài khoản */}
        <button
          onClick={() => setCurrentView('profile')}
          className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center group ${
            isNavActive('account')
              ? 'bg-white text-[#0374b5] shadow-xs'
              : 'text-white/90 hover:bg-[#02629b] hover:text-white'
          }`}
          title="Tài khoản cá nhân"
        >
          <div className="relative">
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-white/60 shadow-xs" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-bold">{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
              </div>
            )}
            {(!currentUser.id || !currentUser.email) && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#0374b5]" />
            )}
          </div>
          <span className="text-[11px] font-medium mt-1 leading-tight">Tài khoản</span>
        </button>

        {/* 2. Courses / Khóa học */}
        <button
          onClick={() => setCurrentView('courses-list')}
          className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center group ${
            isNavActive('courses')
              ? 'bg-white text-[#0374b5] shadow-xs'
              : 'text-white/90 hover:bg-[#02629b] hover:text-white'
          }`}
          title="Khóa học & Học liệu"
        >
          <BookOpen className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[11px] font-medium mt-1 leading-tight">Khóa học</span>
        </button>

        {/* 3. Teaching / Giảng dạy — chỉ giáo viên & quản trị viên */}
        {isStaff && (
          <button
            onClick={() => setCurrentView('teacher-studio')}
            className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center group ${
              isNavActive('teaching')
                ? 'bg-white text-[#0374b5] shadow-xs'
                : 'text-white/90 hover:bg-[#02629b] hover:text-white'
            }`}
            title="Quản lý giảng dạy & Tiến độ học sinh"
          >
            <Presentation className="w-6 h-6 stroke-[1.8]" />
            <span className="text-[11px] font-medium mt-1 leading-tight">Giảng dạy</span>
          </button>
        )}

        {/* 4. Admin / Quản trị hệ thống — chỉ quản trị viên phanphiphu04@gmail.com */}
        {isAdmin && (
          <button
            onClick={() => setCurrentView('admin-panel')}
            className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center group ${
              isNavActive('admin')
                ? 'bg-white text-[#0374b5] shadow-xs'
                : 'text-white/90 hover:bg-[#02629b] hover:text-white'
            }`}
            title="Quản trị hệ thống"
          >
            <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
            <span className="text-[11px] font-medium mt-1 leading-tight">Quản trị</span>
          </button>
        )}
      </nav>

      {/* 5. Help / Trợ giúp Bottom */}
      <div className="w-full flex flex-col items-center pt-2 border-t border-white/10">
        <button
          onClick={() => setCurrentView('help')}
          className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center ${
            isNavActive('help')
              ? 'bg-white text-[#0374b5] shadow-xs'
              : 'text-white/90 hover:bg-[#02629b] hover:text-white'
          }`}
          title="Trợ giúp & Hướng dẫn sử dụng"
        >
          <HelpCircle className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[11px] font-medium mt-1 leading-tight">Trợ giúp</span>
        </button>
      </div>
    </aside>
  );
};
