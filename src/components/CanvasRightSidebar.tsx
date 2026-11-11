import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart2, 
  Calendar, 
  Bell, 
  CheckCircle2, 
  Clock, 
  FileCheck
} from 'lucide-react';
import { CourseNavTab } from './CanvasCourseNav';

interface CanvasRightSidebarProps {
  onNavigateTab: (tab: CourseNavTab) => void;
}

export const CanvasRightSidebar: React.FC<CanvasRightSidebarProps> = ({ onNavigateTab }) => {
  const { activeCourse, navigateToActivity } = useApp();

  // Find any upcoming required activities / assignments
  const pendingActivities = activeCourse?.modules?.flatMap(m => m.activities || []).filter(a => !a.isCompleted && a.isRequired) || [];

  return (
    <aside className="w-64 shrink-0 py-5 px-4 bg-white border-l border-slate-200 hidden lg:block space-y-6">
      {/* 3 Action Buttons like in Canvas screenshot */}
      <div className="space-y-2">
        <button
          onClick={() => onNavigateTab('modules')}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors text-left"
        >
          <BarChart2 className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="truncate">Xem Luồng Khóa Học</span>
        </button>

        <button
          onClick={() => onNavigateTab('syllabus')}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors text-left"
        >
          <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="truncate">Xem Lịch Khóa Học</span>
        </button>

        <button
          onClick={() => onNavigateTab('discussions')}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors text-left"
        >
          <Bell className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="truncate">Xem Thông Báo Khóa Học</span>
        </button>
      </div>

      {/* Section: Cần làm (To Do) */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Cần làm</h3>
          {pendingActivities.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#0374b5] text-white">
              {pendingActivities.length}
            </span>
          )}
        </div>

        {pendingActivities.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Hiện không có gì</p>
        ) : (
          <div className="space-y-2.5">
            {pendingActivities.slice(0, 4).map((act) => (
              <div 
                key={act.id} 
                onClick={() => activeCourse && navigateToActivity(activeCourse.id, act.id)}
                className="group cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-all"
              >
                <div className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-slate-500 group-hover:text-[#0374b5] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-[#0374b5] group-hover:underline line-clamp-2">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{act.dueDate || 'Chưa có hạn nộp'}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Phản hồi gần đây (Recent feedback) */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-900">Phản hồi gần đây</h3>
        <p className="text-xs text-slate-500 italic">Chưa có phản hồi mới từ giáo viên</p>
      </div>
    </aside>
  );
};

