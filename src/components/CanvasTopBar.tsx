import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Sparkles, LogIn, Plus } from 'lucide-react';

interface CanvasTopBarProps {
  onToggleCourseNav?: () => void;
  onOpenAIAssistant: () => void;
  activeCourseTab?: string;
}

export const CanvasTopBar: React.FC<CanvasTopBarProps> = ({ 
  onToggleCourseNav, 
  onOpenAIAssistant,
  activeCourseTab = 'Nội dung học tập'
}) => {
  const { activeCourse, currentView, setCurrentView, currentUser, setIsLoginModalOpen } = useApp();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleCourseNav}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          title="Thu gọn / Mở rộng menu khóa học"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {currentView === 'dashboard' ? (
            <span className="text-slate-900 font-bold">Bảng điều khiển</span>
          ) : (
            <>
              <button 
                onClick={() => setCurrentView('course-detail')}
                className="text-[#0374b5] hover:underline font-bold truncate max-w-[200px] sm:max-w-[320px]"
              >
                {activeCourse ? (activeCourse.code || activeCourse.name) : 'Khóa học'}
              </button>
              <span className="text-slate-400 font-normal">›</span>
              <span className="text-slate-700 font-medium truncate">{activeCourseTab}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right: AI Assistant & User Auth Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* ✨ Trợ lý AI (Canvas AI Helper Button) */}
        <button
          onClick={onOpenAIAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-[#0374b5] bg-white hover:bg-sky-50/60 text-slate-800 hover:text-[#0374b5] text-xs font-bold transition-all shadow-2xs active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>Trợ lý AI</span>
        </button>

        {(!currentUser.id || currentUser.code === 'Chưa đăng nhập') ? (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-bold transition-all shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-xs text-slate-600 hidden md:inline">
              Xin chào, <strong className="text-slate-900">{currentUser.name.split(' ').pop()}</strong>
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

