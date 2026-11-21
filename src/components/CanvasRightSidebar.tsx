import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import {
  BarChart2,
  Calendar,
  Bell,
  Clock,
  FileCheck,
  Users,
  AlertTriangle,
  Award,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { CourseNavTab } from './CanvasCourseNav';

interface CanvasRightSidebarProps {
  onNavigateTab: (tab: CourseNavTab) => void;
}

export const CanvasRightSidebar: React.FC<CanvasRightSidebarProps> = ({ onNavigateTab }) => {
  const { activeCourse, navigateToActivity, currentUser, activeRole } = useApp();
  const [summary, setSummary] = useState<any>(null);

  const canManage = Boolean(
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'lecturer' ||
    activeRole === 'admin' ||
    activeRole === 'lecturer'
  );

  useEffect(() => {
    if (!canManage || !activeCourse?.id) return;
    let cancelled = false;
    api.courses.getGradebook(activeCourse.id)
      .then(res => {
        if (!cancelled && res?.summary) setSummary(res.summary);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canManage, activeCourse?.id]);

  const allActs = activeCourse?.modules?.flatMap(m => m.activities || []) || [];
  const pendingActivities = allActs.filter(a => !a.isCompleted && a.isRequired);
  const recentFeedback = allActs.filter(a => a.submission?.feedback || a.submission?.grade !== undefined || a.quizResult);

  return (
    <aside className="w-64 shrink-0 py-5 px-4 bg-white border-l border-slate-200 hidden lg:block space-y-6">
      {/* Các nút truy cập nhanh */}
      <div className="space-y-2">
        <button
          onClick={() => onNavigateTab('grades')}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-lg text-xs font-bold transition-colors text-left shadow-xs"
        >
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{canManage ? 'Theo dõi Tiến độ & Sổ điểm' : 'Xem Tiến độ & Điểm số'}</span>
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
          <span className="truncate">Xem Thảo Luận Lớp Học</span>
        </button>
      </div>

      {/* GIÁO VIÊN: Tiện ích giám sát tiến độ lớp học nhanh */}
      {canManage ? (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Giám sát lớp học</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đang hoạt động" />
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0374b5]" /> Sĩ số lớp
              </span>
              <strong className="text-slate-900">{summary?.totalStudents ?? (activeCourse?.enrolledStudentsCount || 0)} HS</strong>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Tiến độ TB
                </span>
                <strong className="text-[#0374b5] font-mono">{summary?.avgProgress ?? 0}%</strong>
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-sky-200/60">
                <div className="h-full bg-[#0374b5]" style={{ width: `${summary?.avgProgress ?? 0}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-sky-200/60">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ chấm bài
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                (summary?.pendingGrading || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-500'
              }`}>
                {summary?.pendingGrading ?? 0} bài
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> HS cần chú ý
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                (summary?.atRiskStudentsCount || 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {summary?.atRiskStudentsCount ?? 0} HS
              </span>
            </div>

            {summary?.classAvgScore !== null && summary?.classAvgScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" /> Điểm TB lớp
                </span>
                <strong className="text-emerald-700 font-mono">{summary.classAvgScore}/10</strong>
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('grades')}
              className="w-full mt-1 py-1.5 rounded-xl bg-white hover:bg-sky-100 border border-sky-200 text-[#0374b5] text-[11px] font-bold transition-colors"
            >
              Mở Bảng Tiến Độ Chi Tiết →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* HỌC SINH: Cần làm (To Do) */}
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
              <p className="text-xs text-slate-500 italic flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Đã hoàn thành hết mục cần làm!</span>
              </p>
            ) : (
              <div className="space-y-2">
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
                          <span>{act.dueDate || 'Không giới hạn'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HỌC SINH: Điểm & Phản hồi gần đây */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Điểm & Phản hồi gần đây</h3>
            {recentFeedback.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Chưa có kết quả hoặc phản hồi mới</p>
            ) : (
              <div className="space-y-2">
                {recentFeedback.slice(0, 4).map(act => (
                  <div
                    key={act.id}
                    onClick={() => activeCourse && navigateToActivity(activeCourse.id, act.id)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/50 border border-slate-100 cursor-pointer space-y-0.5"
                  >
                    <p className="text-xs font-bold text-slate-800 truncate">{act.title}</p>
                    <p className="text-[11px] font-mono font-black text-emerald-700">
                      Điểm: {act.submission?.grade ?? act.quizResult?.score ?? act.score}/{act.maxScore || 10}
                    </p>
                    {act.submission?.feedback && (
                      <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{act.submission.feedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
