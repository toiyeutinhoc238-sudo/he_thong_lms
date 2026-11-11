import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Award, 
  Calendar, 
  Layers, 
  FileText, 
  HelpCircle, 
  Settings, 
  ShieldCheck, 
  Users, 
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { TrainingType } from '../types';

export const Sidebar: React.FC<{ isOpen: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  const { 
    currentView, 
    setCurrentView, 
    activeRole, 
    trainingProgramFilter, 
    setTrainingProgramFilter,
    certificates
  } = useApp();

  const handleNav = (view: any) => {
    setCurrentView(view);
    if (onClose) onClose();
  };

  const programs: { id: TrainingType | 'all'; label: string; count?: string }[] = [
    { id: 'all', label: 'Tất cả chuyên đề' },
    { id: 'Chuyên đề AI', label: 'Chuyên đề AI', count: 'AI' },
    { id: 'Khoa học máy tính', label: 'Khoa học máy tính', count: 'CS' },
    { id: 'Tin học ứng dụng', label: 'Tin học ứng dụng', count: 'ICT' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside className={`fixed lg:sticky top-[93px] left-0 h-[calc(100vh-93px)] w-64 bg-white border-r border-slate-200/90 z-30 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Điều hướng chính
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => handleNav('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-hcmue-700 text-white shadow-md shadow-hcmue-700/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Trang tổng quan</span>
              </button>

              <button
                onClick={() => handleNav('gradebook')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'gradebook'
                    ? 'bg-hcmue-700 text-white shadow-md shadow-hcmue-700/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  <span>Sổ điểm & Đánh giá</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  GPA
                </span>
              </button>

              <button
                onClick={() => handleNav('certificates')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'certificates'
                    ? 'bg-hcmue-700 text-white shadow-md shadow-hcmue-700/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4" />
                  <span>Chứng chỉ hoàn thành</span>
                </div>
                {certificates.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    {certificates.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Role specific section */}
          {(activeRole === 'lecturer' || activeRole === 'admin') && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Khu vực Chuyên môn</span>
              </div>
              <nav className="space-y-1">
                {activeRole === 'lecturer' && (
                  <button
                    onClick={() => handleNav('teacher-studio')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'teacher-studio'
                        ? 'bg-amber-500 text-slate-900 font-bold shadow-md'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Studio Quản lý Giảng dạy</span>
                  </button>
                )}

                {activeRole === 'admin' && (
                  <button
                    onClick={() => handleNav('admin-panel')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'admin-panel'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Trung tâm Quản trị LMS Nhóm 2</span>
                  </button>
                )}
              </nav>
            </div>
          )}

          {/* Filter By Training Program */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
              <span>Chuyên đề Tin học (Lớp 1 - 12)</span>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
              {programs.map(prog => (
                <button
                  key={prog.id}
                  onClick={() => {
                    setTrainingProgramFilter(prog.id);
                    if (currentView !== 'dashboard') setCurrentView('dashboard');
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                    trainingProgramFilter === prog.id
                      ? 'bg-blue-50 text-hcmue-700 font-bold border-l-4 border-hcmue-600 pl-2.5'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{prog.label}</span>
                  {prog.count && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {prog.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Support Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-3.5 border border-blue-100/80">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#0374b5] text-white flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Trợ giúp LMS Nhóm 2</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
              Cần hỗ trợ về tài khoản đăng nhập hoặc học phần trực tuyến?
            </p>
            <div className="space-y-1 text-[11px]">
              <a 
                href="mailto:support@lms2.edu.vn" 
                className="text-[#0374b5] font-medium hover:underline block truncate"
              >
                ✉ support@lms2.edu.vn
              </a>
              <div className="text-slate-600 flex items-center gap-1 font-mono">
                <PhoneCall className="w-3 h-3 text-slate-400" /> (028) 3835 2020
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

