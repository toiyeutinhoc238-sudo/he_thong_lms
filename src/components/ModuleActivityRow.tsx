import React from 'react';
import {
  CheckCircle2,
  Circle,
  Users,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Share2,
  Pencil,
  Trash2
} from 'lucide-react';
import { Activity } from '../types';

interface ModuleActivityRowProps {
  act: Activity;
  actIdx: number;
  totalActivities: number;
  canManage: boolean;
  isEmbedMode: boolean;
  activityStats?: any;
  classStudentCount: number;
  onPreview: () => void;
  onMove: (delta: number) => void;
  onToggleHidden: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ModuleActivityRow: React.FC<ModuleActivityRowProps> = ({
  act,
  actIdx,
  totalActivities,
  canManage,
  isEmbedMode,
  activityStats,
  classStudentCount,
  onPreview,
  onMove,
  onToggleHidden,
  onShare,
  onEdit,
  onDelete
}) => {
  return (
    <div
      className={`px-4 py-3 flex items-center justify-between border-b border-slate-200 last:border-b-0 hover:bg-slate-50/80 transition-colors group select-none ${
        act.isHidden ? 'bg-amber-50/40' : ''
      }`}
    >
      {/* Tiêu đề hoạt động (Nhấn vào mở Popup) */}
      <div
        onClick={onPreview}
        className="flex items-center min-w-0 flex-1 cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs sm:text-sm font-medium text-slate-800 group-hover:text-[#0374b5] group-hover:underline truncate">
              {act.title}
            </p>
            {act.isHidden && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black rounded">
                Đang ẩn (Nháp)
              </span>
            )}
          </div>

          {/* Thống kê cho GV/Admin hoặc tiến độ xem video cho HS */}
          {canManage && activityStats ? (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-bold">
                <Users className="w-3 h-3" />
                {activityStats.completedCount}/{classStudentCount} HS xong ({activityStats.completionRate}%)
              </span>
              {act.type === 'video' && (
                <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0374b5] text-[10px] font-bold">
                  TB xem: {activityStats.avgVideoPercent}%
                </span>
              )}
              {activityStats.avgScore !== null && activityStats.avgScore !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                  TB điểm: {activityStats.avgScore}/10
                </span>
              )}
              {(activityStats.pendingGradingCount || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                  {activityStats.pendingGradingCount} bài chờ chấm
                </span>
              )}
            </div>
          ) : !canManage && act.type === 'video' && (act.videoProgress?.progressPercent || 0) > 0 && !act.isCompleted ? (
            <div className="mt-1 flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: `${act.videoProgress?.progressPercent || 0}%` }} />
              </div>
              <span className="text-[10px] font-bold text-amber-700">
                Đã xem {act.videoProgress?.progressPercent}%
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Nút thao tác & vòng tròn trạng thái */}
      <div className="flex items-center gap-1.5 shrink-0 pl-3">
        {canManage && !isEmbedMode && (
          <>
            {totalActivities > 1 && (
              <div className="hidden sm:flex items-center">
                <button
                  type="button"
                  disabled={actIdx === 0}
                  onClick={() => onMove(-1)}
                  className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-25 opacity-70 group-hover:opacity-100"
                  title="Di chuyển lên trên"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={actIdx === totalActivities - 1}
                  onClick={() => onMove(1)}
                  className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-25 opacity-70 group-hover:opacity-100"
                  title="Di chuyển xuống dưới"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onToggleHidden}
              className={`p-1 rounded transition-colors ${
                act.isHidden
                  ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200 opacity-70 group-hover:opacity-100'
              }`}
              title={act.isHidden ? 'Đang ẩn với học sinh — Bấm để Công bố' : 'Đang hiện với học sinh — Bấm để Ẩn (Nháp)'}
            >
              {act.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onShare}
              className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors opacity-75 group-hover:opacity-100"
              title="Chia sẻ link, mã nhúng iframe hoặc xuất SCORM/Quiz sang LMS khác"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onEdit}
              className="p-1 rounded text-slate-400 hover:text-[#0374b5] hover:bg-slate-200 transition-colors opacity-70 group-hover:opacity-100"
              title="Chỉnh sửa học liệu"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDelete}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-70 group-hover:opacity-100"
              title="Xóa học liệu này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        <div onClick={onPreview} className="cursor-pointer pl-1">
          {act.isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
};