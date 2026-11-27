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
  onOpenAIAssistant
}) => {
  const { activeCourse, activeModuleId, setActiveModuleId, activeActivity, activeCourseTab, setActiveCourseTab, currentView, setCurrentView, currentUser, setIsLoginModalOpen } = useApp();
  const activeModule = activeCourse && activeModuleId
    ? (activeCourse.modules || []).find(m => m.id === activeModuleId)
    : null;

  const tabLabels: Record<string, string> = {
    home: 'Trang chủ khóa học',
    modules: 'Nội dung học tập',
    grades: 'Tiến độ & Sổ điểm',
    people: 'Thành viên',
    discussions: 'Thảo luận',
    files: 'Các tập tin',
    syllabus: 'Lịch trình khóa học',
    resources3d: 'Kho học liệu 3D & AI Lab'
  };
  const resolvedTabLabel = tabLabels[activeCourseTab] || 'Nội dung học tập';
  const isModuleScopedTab = activeCourseTab === 'home' || activeCourseTab === 'modules';

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left: Hamburger (chỉ hiện ở trang khóa học nơi có menu phụ) & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {currentView === 'course-detail' && (
          <button
            onClick={onToggleCourseNav}
            className="hidden md:inline-flex p-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors shrink-0"
            title="Thu gọn / Mở rộng menu khóa học"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav className="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-0">
          <button 
            onClick={() => setCurrentView('courses-list')}
            className="text-slate-900 font-extrabold hover:text-[#0374b5] transition-colors shrink-0"
          >
            LMS Nhóm 2
          </button>
          <span className="text-slate-400 font-normal shrink-0">›</span>

          {currentView === 'dashboard' && <span className="text-slate-600 font-medium">Bảng điều khiển</span>}
          {currentView === 'admin-panel' && <span className="text-slate-600 font-medium">Quản trị Hệ thống</span>}
          {currentView === 'teacher-studio' && <span className="text-slate-600 font-medium">Giảng dạy & Tiến độ học sinh</span>}
          {currentView === 'courses-list' && <span className="text-slate-600 font-medium">Tất cả Khóa học</span>}
          {currentView === 'calendar' && <span className="text-slate-600 font-medium">Lịch học tập</span>}
          {currentView === 'inbox' && <span className="text-slate-600 font-medium">Hộp thư</span>}
          {currentView === 'history' && <span className="text-slate-600 font-medium">Lịch sử hoạt động</span>}
          {currentView === 'help' && <span className="text-slate-600 font-medium">Trợ giúp & Hướng dẫn</span>}
          {currentView === 'profile' && <span className="text-slate-600 font-medium">Hồ sơ cá nhân</span>}
          {currentView === 'gradebook' && <span className="text-slate-600 font-medium">Bảng điểm cá nhân</span>}
          {currentView === 'certificates' && <span className="text-slate-600 font-medium">Chứng chỉ số</span>}
          {(currentView === 'course-detail' || currentView === 'activity') && (
            <>
              <button 
                onClick={() => {
                  setActiveModuleId(null);
                  setActiveCourseTab('home');
                  setCurrentView('course-detail');
                }}
                className="text-[#0374b5] hover:underline font-bold truncate max-w-[140px] sm:max-w-[200px]"
                title="Xem tổng quan toàn bộ khóa học (tất cả bài học)"
              >
                {activeCourse ? (activeCourse.code || activeCourse.name) : 'Khóa học'}
              </button>
              <span className="text-slate-400 font-normal shrink-0">›</span>
              {currentView === 'activity' ? (
                <>
                  {activeModule && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCourseTab('modules');
                          setCurrentView('course-detail');
                        }}
                        className="hidden sm:inline text-[#0374b5] hover:underline font-semibold truncate max-w-[180px]"
                        title={activeModule.title}
                      >
                        {activeModule.title}
                      </button>
                      <span className="hidden sm:inline text-slate-400 font-normal shrink-0">›</span>
                    </>
                  )}
                  <span className="text-slate-700 font-medium truncate max-w-[160px] sm:max-w-[260px]" title={activeActivity?.title}>
                    {activeActivity?.title || 'Hoạt động học tập'}
                  </span>
                </>
              ) : (
                <span className="text-slate-700 font-medium truncate max-w-[180px] sm:max-w-[340px]">
                  {isModuleScopedTab && activeModule ? activeModule.title : resolvedTabLabel}
                </span>
              )}
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

        {(!currentUser.id || !currentUser.email) ? (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-bold transition-all shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>
        ) : (
          <button 
            onClick={() => setCurrentView('profile')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-85 transition-opacity text-left"
            title="Xem hồ sơ cá nhân"
          >
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-slate-300"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#0374b5] text-white flex items-center justify-center text-xs font-bold">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="text-xs text-slate-700 font-bold hidden md:inline truncate max-w-[160px]">
              {currentUser.name}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

