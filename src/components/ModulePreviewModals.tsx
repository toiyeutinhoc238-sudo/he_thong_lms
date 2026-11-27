import React from 'react';
import { CheckCircle2, Circle, Clock, ChevronRight, Target, X } from 'lucide-react';
import { CourseModule, Activity } from '../types';

interface ModulePreviewModalsProps {
  objectivesModalModule: CourseModule | null;
  onCloseObjectives: () => void;
  previewActivity: { moduleTitle: string; activity: Activity } | null;
  onClosePreview: () => void;
  onOpenActivity: (activityId: string) => void;
}

export const ModulePreviewModals: React.FC<ModulePreviewModalsProps> = ({
  objectivesModalModule,
  onCloseObjectives,
  previewActivity,
  onClosePreview,
  onOpenActivity
}) => {
  return (
    <>
      {/* POPUP XEM CHI TIẾT MỤC TIÊU BÀI HỌC */}
      {objectivesModalModule && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={onCloseObjectives}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0374b5] flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0374b5] block">
                    Mục tiêu bài học
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {objectivesModalModule.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseObjectives}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {objectivesModalModule.learningObjectives}
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onCloseObjectives}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP XEM CHI TIẾT HOẠT ĐỘNG / HỌC LIỆU */}
      {previewActivity && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={onClosePreview}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  {previewActivity.moduleTitle}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mt-0.5">
                  {previewActivity.activity.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClosePreview}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              {previewActivity.activity.isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Circle className="w-3.5 h-3.5" /> Chưa hoàn thành
                </span>
              )}

              {previewActivity.activity.type === 'video' && (previewActivity.activity.videoCheckpoints?.length || 0) > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {previewActivity.activity.videoCheckpoints?.length} câu neo chặn
                </span>
              )}
              {previewActivity.activity.type === 'quiz' && (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {previewActivity.activity.timeLimitMinutes || 15} phút
                </span>
              )}
              {previewActivity.activity.dueDate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <Clock className="w-3.5 h-3.5" /> Hạn nộp: {previewActivity.activity.dueDate}
                </span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[50vh] overflow-y-auto space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Mô tả chi tiết
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {previewActivity.activity.description || 'Nhấn nút bên dưới để mở và bắt đầu thực hiện học liệu này.'}
              </p>
              {previewActivity.activity.assignmentPrompt && (
                <div className="pt-2 mt-2 border-t border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block mb-1">
                    Yêu cầu bài tập
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {previewActivity.activity.assignmentPrompt}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClosePreview}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = previewActivity.activity.id;
                  onClosePreview();
                  onOpenActivity(id);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>Mở học liệu / Bắt đầu học</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};