import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Gauge, 
  BookOpen, 
  CalendarDays, 
  Mail, 
  History, 
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { AppView } from '../types';

export const CanvasGlobalNav: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    currentUser, 
    setIsLoginModalOpen, 
    notifications,
    activeCourse
  } = useApp();

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const isNavActive = (key: string) => {
    if (key === 'account') return currentView === 'profile';
    if (key === 'dashboard') return currentView === 'dashboard';
    if (key === 'courses') return currentView === 'course-detail' || currentView === 'activity';
    return false;
  };

  return (
    <aside className="w-[78px] shrink-0 min-h-screen bg-[#0374b5] flex flex-col items-center py-2 text-white select-none z-30 shadow-md">
      {/* Brand Logo / Institution Top Icon */}
      <div 
        onClick={() => setCurrentView('dashboard')}
        className="w-12 h-12 flex flex-col items-center justify-center cursor-pointer mb-2 group transition-transform active:scale-95"
        title="LMS Nhóm 2 - Bảng điều khiển"
      >
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="text-[10px] font-black tracking-wider uppercase opacity-90 mt-0.5">Nhóm 2</span>
      </div>

      {/* Nav Items List */}
      <nav className="w-full flex-1 flex flex-col items-center space-y-1">
        {/* 1. Account / Tài khoản */}
        <button
          onClick={() => {
            if (!currentUser.id || currentUser.code === 'Chưa đăng nhập') {
              setIsLoginModalOpen(true);
            } else {
              setCurrentView('profile');
            }
          }}
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
                className="w-7 h-7 rounded-full object-cover border border-white/60 shadow-xs" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-bold">{currentUser.name ? currentUser.name.charAt(0) : 'U'}</span>
              </div>
            )}
            {(!currentUser.id || currentUser.code === 'Chưa đăng nhập') && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#0374b5]" />
            )}
          </div>
          <span className="text-[11px] font-medium mt-1 leading-tight">Tài khoản</span>
        </button>

        {/* 2. Dashboard / Bảng điều khiển */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center group ${
            isNavActive('dashboard')
              ? 'bg-white text-[#0374b5] shadow-xs'
              : 'text-white/90 hover:bg-[#02629b] hover:text-white'
          }`}
          title="Bảng điều khiển khóa học"
        >
          <Gauge className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[11px] font-medium mt-1 leading-tight">Bảng điều khiển</span>
        </button>

        {/* 3. Courses / Khóa học */}
        <button
          onClick={() => {
            if (activeCourse) {
              setCurrentView('course-detail');
            } else {
              setCurrentView('dashboard');
            }
          }}
          className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center group ${
            isNavActive('courses')
              ? 'bg-white text-[#0374b5] shadow-xs'
              : 'text-white/90 hover:bg-[#02629b] hover:text-white'
          }`}
          title="Khóa học đang học"
        >
          <BookOpen className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[11px] font-medium mt-1 leading-tight">Khóa học</span>
        </button>

        {/* 4. Calendar / Lịch */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center group ${
            isNavActive('calendar')
              ? 'bg-white text-[#0374b5] shadow-xs'
              : 'text-white/90 hover:bg-[#02629b] hover:text-white'
          }`}
          title="Lịch học tập & Hạn nộp"
        >
          <CalendarDays className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[11px] font-medium mt-1 leading-tight">Lịch</span>
        </button>

        {/* 5. Inbox / Hộp thư */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-center relative group ${
            isNavActive('inbox')
              ? 'bg-white text-[#0374b5] shadow-xs'
              : 'text-white/90 hover:bg-[#02629b] hover:text-white'
          }`}
          title="Hộp thư & Thông báo"
        >
          <div className="relative">
            <Mail className="w-6 h-6 stroke-[1.8]" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full ring-2 ring-[#0374b5]">
                {unreadNotifs}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium mt-1 leading-tight">Hộp thư</span>
        </button>

        {/* 6. History / Lịch sử */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className="w-[72px] py-2 flex flex-col items-center justify-center rounded-lg transition-all text-white/90 hover:bg-[#02629b] hover:text-white text-center"
          title="Lịch sử xem gần đây"
        >
          <History className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[11px] font-medium mt-1 leading-tight">Lịch sử</span>
        </button>
      </nav>

      {/* 7. Help / Trợ giúp Bottom */}
      <div className="w-full flex flex-col items-center pt-2 border-t border-white/10">
        <button
          onClick={() => alert('Trung tâm hỗ trợ LMS Nhóm 2:\n- Hệ thống Quản lý Học tập LMS Nhóm 2\n- Chức năng: Thêm, xóa, sửa khóa học, mô-đun, bài tập, video, tài liệu\n- Hỗ trợ kỹ thuật: support@lms2.edu.vn')}
          className="w-[72px] py-2 flex flex-col items-center justify-center rounded-lg text-white/90 hover:bg-[#02629b] hover:text-white transition-all text-center"
          title="Trợ giúp & Hướng dẫn"
        >
          <HelpCircle className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[11px] font-medium mt-1 leading-tight">Trợ giúp</span>
        </button>
      </div>
    </aside>
  );
};
