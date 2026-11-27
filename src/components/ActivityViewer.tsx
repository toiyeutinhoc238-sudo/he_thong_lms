import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { QuizEngine } from './QuizEngine';
import { AssignmentSubmitter } from './AssignmentSubmitter';
import { VideoPlayerTracker } from './VideoPlayerTracker';
import { ShareExportModal } from './ShareExportModal';
import { FormattedContent } from './FormattedContent';
import api, { StudentSubmission, resolveBackendUrl } from '../services/api';
import { Activity, QuizQuestion } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Check,
  ExternalLink,
  ChevronRight,
  Users,
  RefreshCw,
  Clock,
  Eye,
  BarChart3,
  X,
  Play,
  HelpCircle,
  Download,
  Share2,
  Loader2
} from 'lucide-react';

function formatDurationCompact(secs?: number) {
  if (!secs || secs <= 0) return '0 giây';
  if (secs < 60) return `${secs} giây`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return s > 0 ? `${m}p ${s}s` : `${m} phút`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}g ${rm}p`;
}

function formatClock(secs?: number) {
  if (!secs || !Number.isFinite(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ====================== GIÁO VIÊN: BẢNG THEO DÕI TIẾN ĐỘ HỌC SINH CHO HOẠT ĐỘNG ĐANG MỞ ======================
const TeacherActivityMonitor: React.FC<{ courseId: string; activity: Activity }> = ({ courseId, activity }) => {
  const [rows, setRows] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRow, setReviewRow] = useState<StudentSubmission | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.activities.getSubmissions(courseId, activity.id)
      .then(res => {
        setRows(Array.isArray(res) ? res : []);
        setError(null);
      })
      .catch((err: any) => setError(err?.message || 'Không tải được dữ liệu theo dõi học sinh.'))
      .finally(() => setLoading(false));
  }, [courseId, activity.id]);

  useEffect(() => {
    load();
  }, [load]);

  const completedCount = rows.filter(r => r.isCompleted).length;
  const activeCount = rows.filter(r => r.isCompleted || (r.viewCount || 0) > 0 || (r.videoProgress?.progressPercent || 0) > 0 || !!r.quizResult).length;
  const completionPct = rows.length > 0 ? Math.round((completedCount / rows.length) * 100) : 0;

  // Thống kê độ chính xác từng câu hỏi nếu là trắc nghiệm
  const questions: QuizQuestion[] = activity.quizQuestions || [];
  const questionStats = activity.type === 'quiz' && questions.length > 0
    ? questions.map((q, idx) => {
        let attempts = 0;
        let correct = 0;
        rows.forEach(r => {
          if (r.quizResult?.answers) {
            attempts++;
            if (r.quizResult.answers[q.id] === q.correctAnswer) correct++;
          }
        });
        return {
          id: q.id,
          index: idx + 1,
          question: q.question,
          attempts,
          correct,
          accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null
        };
      })
    : [];

  return (
    <div className="bg-sky-50/70 rounded-2xl p-5 border border-sky-200/80 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0374b5] text-white flex items-center justify-center shadow-xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Giám sát tiến độ học sinh (Chỉ Giáo viên / Quản trị viên thấy)
            </h3>
            <p className="text-[11px] text-slate-600">
              Hoàn thành: <strong>{completedCount}/{rows.length}</strong> ({completionPct}%) • Đã truy cập: <strong>{activeCount}/{rows.length}</strong> học sinh
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Phân tích tỷ lệ trả lời đúng theo từng câu hỏi (Quiz) */}
      {activity.type === 'quiz' && questionStats.length > 0 && questionStats.some(q => q.attempts > 0) && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>Tỷ lệ trả lời đúng theo từng câu hỏi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {questionStats.map(qs => (
              <div key={qs.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-800 truncate" title={qs.question}>
                    Câu {qs.index}: {qs.question}
                  </span>
                  <span className={`font-mono font-black shrink-0 ${
                    (qs.accuracy ?? 0) >= 70 ? 'text-emerald-600' : (qs.accuracy ?? 0) >= 40 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {qs.accuracy !== null ? `${qs.accuracy}% (${qs.correct}/${qs.attempts})` : 'Chưa có'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${(qs.accuracy ?? 0) >= 70 ? 'bg-emerald-500' : (qs.accuracy ?? 0) >= 40 ? 'bg-amber-400' : 'bg-rose-500'}`}
                    style={{ width: `${qs.accuracy ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-xs text-slate-500">Đang tải tiến độ từng học sinh...</p>
      ) : error ? (
        <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
          Chưa có học sinh nào ghi danh vào khóa học này. Khi học sinh đăng nhập Google và học bài, tiến độ sẽ tự động hiện tại đây.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5">Học sinh</th>
                <th className="py-2.5 px-3.5">Trạng thái</th>
                {activity.type === 'video' && <th className="py-2.5 px-3.5">Tiến độ xem video</th>}
                {activity.type === 'quiz' && <th className="py-2.5 px-3.5">Điểm & Chi tiết</th>}
                <th className="py-2.5 px-3.5">Thời lượng / Lượt xem</th>
                <th className="py-2.5 px-3.5">Truy cập gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => {
                const vp = r.videoProgress;
                const pct = vp?.progressPercent ?? (r.isCompleted ? 100 : 0);
                return (
                  <tr key={r.student.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-900">{r.student.name}</div>
                      <div className="text-[10px] text-slate-400">{r.student.email || r.student.className}</div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      {r.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                        </span>
                      ) : (r.viewCount || 0) > 0 || pct > 0 || r.quizResult ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> Đang học
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-medium">
                          Chưa bắt đầu
                        </span>
                      )}
                    </td>

                    {activity.type === 'video' && (
                      <td className="py-2.5 px-3.5 min-w-[160px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-bold ${pct >= 80 ? 'text-emerald-700' : pct > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                            {pct}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {vp?.watchedSeconds ? `${formatClock(vp.watchedSeconds)}${vp.totalSeconds ? '/' + formatClock(vp.totalSeconds) : ''}` : '00:00'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${pct >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        {(activity.videoCheckpoints?.length || 0) > 0 && (
                          <p className="text-[10px] text-indigo-700 font-bold mt-1">
                            Neo chặn: {vp?.checkpointsPassed || 0}/{activity.videoCheckpoints?.length} vượt qua
                          </p>
                        )}
                      </td>
                    )}

                    {activity.type === 'quiz' && (
                      <td className="py-2.5 px-3.5">
                        {r.quizResult || r.score !== null ? (
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black ${(r.score ?? 0) >= (activity.passScore || 5) ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {r.score ?? r.quizResult?.score}/10đ
                            </span>
                            <button
                              type="button"
                              onClick={() => setReviewRow(r)}
                              className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] text-[10px] font-bold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Xem đúng/sai
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">Chưa nộp</span>
                        )}
                      </td>
                    )}

                    <td className="py-2.5 px-3.5 text-slate-600">
                      {formatDurationCompact(r.timeSpentSeconds)} • {r.viewCount || 0} lượt
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-400 text-[11px]">
                      {r.lastAccessedAt || r.completedAt || 'Chưa mở'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal xem chi tiết bài làm trắc nghiệm của học sinh */}
      {reviewRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Bài làm của: {reviewRow.student.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Điểm: <strong>{reviewRow.score ?? reviewRow.quizResult?.score}/10</strong> • Nộp lúc: {reviewRow.quizResult?.submittedAt || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewRow(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const picked = reviewRow.quizResult?.answers?.[q.id];
                const isOk = picked === q.correctAnswer;
                return (
                  <div key={q.id || idx} className={`p-3.5 rounded-2xl border space-y-2 ${isOk ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'}`}>
                    <div className="flex items-start justify-between gap-2 text-xs font-bold text-slate-800">
                      <span>Câu {idx + 1}: {q.question}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isOk ? '✓ Đúng' : '✗ Sai'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => {
                        const isPick = picked === oi;
                        const isKey = q.correctAnswer === oi;
                        return (
                          <div
                            key={oi}
                            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between ${
                              isKey
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                                : isPick
                                  ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span><strong>{String.fromCharCode(65 + oi)}.</strong> {opt}</span>
                            <div className="flex gap-1">
                              {isPick && <span className={`px-1.5 rounded text-[9px] font-black text-white ${isOk ? 'bg-emerald-600' : 'bg-rose-600'}`}>HS chọn</span>}
                              {isKey && <span className="px-1.5 rounded text-[9px] font-black text-white bg-emerald-700">Đáp án</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ActivityViewer: React.FC = () => {
  const {
    activeCourse,
    activeActivity,
    isEmbedMode,
    isLoading,
    setCurrentView,
    setActiveCourseTab,
    setActiveModuleId,
    markActivityCompleted,
    navigateToActivity,
    forumTopics,
    createForumTopic,
    currentUser,
    activeRole,
    setIsLoginModalOpen
  } = useApp();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [quickForumText, setQuickForumText] = useState('');
  const [isPostingForum, setIsPostingForum] = useState(false);

  const isSingleActivityEmbed = Boolean(
    isEmbedMode &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('activity')
  );

  const canManage = Boolean(
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'lecturer' ||
    activeRole === 'admin' ||
    activeRole === 'lecturer'
  );

  // Tự động ghi nhận lượt truy cập & thời gian học thực tế (telemetry) khi học sinh mở hoạt động
  useEffect(() => {
    if (!activeCourse?.id || !activeActivity?.id || !currentUser?.id || canManage) return;

    const actionMap: Record<string, string> = {
      video: 'Đang xem video bài giảng',
      document: 'Đang đọc tài liệu',
      quiz: 'Đang làm bài trắc nghiệm',
      assignment: 'Đang xem bài tập',
      forum: 'Đang tham gia thảo luận'
    };

    // 1. Ghi nhận lượt mở hoạt động ngay lập tức
    api.activities.trackActivity(activeCourse.id, activeActivity.id, {
      event: 'view',
      deltaSeconds: 0,
      action: actionMap[activeActivity.type] || 'Đang học'
    }).catch(() => {});

    // 2. Heartbeat mỗi 20 giây khi tab đang mở (video tự tính delta riêng nên không cộng trùng)
    if (activeActivity.type === 'video') return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        api.activities.trackActivity(activeCourse.id, activeActivity.id, {
          event: 'heartbeat',
          deltaSeconds: 20,
          action: actionMap[activeActivity.type] || 'Đang học'
        }).catch(() => {});
      }
    }, 20000);

    return () => window.clearInterval(interval);
  }, [activeCourse?.id, activeActivity?.id, activeActivity?.type, currentUser?.id, canManage]);

  if (!activeCourse || !activeActivity) {
    if (isLoading) {
      return (
        <div className="flex-1 w-full flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
          <Loader2 className="w-7 h-7 animate-spin text-[#0374b5]" />
          <p className="text-xs font-semibold">Đang tải nội dung hoạt động học tập...</p>
        </div>
      );
    }
    return (
      <div className="flex-1 w-full text-center py-20 space-y-4">
        <p className="text-slate-600">Không tìm thấy hoạt động học tập.</p>
        {!isSingleActivityEmbed && (
          <button
            onClick={() => setCurrentView('course-detail')}
            className="px-4 py-2 bg-[#0374b5] text-white rounded-lg text-xs font-bold"
          >
            Quay lại khóa học
          </button>
        )}
      </div>
    );
  }

  const parentModule = (activeCourse.modules || []).find(m =>
    m.id === activeActivity.moduleId || (m.activities || []).some(a => a.id === activeActivity.id)
  ) || null;

  // Tìm bài học tiếp theo trong khóa học
  let nextAct: { courseId: string; activityId: string; title: string } | null = null;
  const allActivities: Activity[] = [];
  (activeCourse.modules || []).forEach(m => {
    (m.activities || []).forEach(a => allActivities.push(a));
  });
  const currentIdx = allActivities.findIndex(a => a.id === activeActivity.id);
  if (currentIdx !== -1 && currentIdx < allActivities.length - 1) {
    nextAct = {
      courseId: activeCourse.id,
      activityId: allActivities[currentIdx + 1].id,
      title: allActivities[currentIdx + 1].title
    };
  }

  const handleMarkDone = () => {
    markActivityCompleted(activeCourse.id, activeActivity.id);
  };

  const resolvedDocUrl = resolveBackendUrl(activeActivity.fileUrl);
  const fileUrlLower = (resolvedDocUrl || '').toLowerCase();
  const isPdfUrl = /\.pdf(\?.*)?$/.test(fileUrlLower);
  const isImageUrl = /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/.test(fileUrlLower);
  const isHtmlLabUrl = /\.html?(\?.*)?$/.test(fileUrlLower);

  const directNonEmbedUrl = typeof window !== 'undefined'
    ? (() => {
        const qs = new URLSearchParams(window.location.search);
        qs.delete('embed');
        qs.set('course', activeCourse.id);
        qs.set('activity', activeActivity.id);
        return `${window.location.origin}/?${qs.toString()}`;
      })()
    : '#';

  return (
    <div className="flex-1 min-w-0 w-full p-6 max-w-5xl mx-auto space-y-6">
      {/* Banner nhắc đăng nhập cho khách mở từ Link chia sẻ / iframe nhúng */}
      {!currentUser?.id && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-amber-900 font-semibold">
            Bạn đang xem ở chế độ khách — hãy <strong>Đăng nhập Google</strong> để lưu tiến độ xem video, nộp bài và ghi điểm về Sổ điểm giáo viên.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] text-white font-bold shadow-xs"
            >
              Đăng nhập Google
            </button>
            {isEmbedMode && (
              <a
                href={directNonEmbedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold inline-flex items-center gap-1"
              >
                <span>Mở trang đầy đủ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {!isSingleActivityEmbed ? (
          <button
            onClick={() => setCurrentView('course-detail')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0374b5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trở về: {activeCourse.name}</span>
          </button>
        ) : (
          <div className="text-xs font-bold text-slate-500">
            {activeCourse.code} • {activeActivity.title}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && !isEmbedMode && (
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
              title="Lấy link trực tiếp, mã nhúng iframe hoặc xuất gói SCORM / Quiz / JSON"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ / Xuất</span>
            </button>
          )}

          {activeActivity.type !== 'quiz' && (
            activeActivity.isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã hoàn thành hoạt động</span>
              </span>
            ) : (activeActivity.type !== 'video' || canManage) ? (
              <button
                onClick={handleMarkDone}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold transition-all shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Đánh dấu hoàn thành</span>
              </button>
            ) : null
          )}

          {nextAct && !isSingleActivityEmbed && (
            <button
              onClick={() => navigateToActivity(nextAct!.courseId, nextAct!.activityId)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] text-xs font-bold transition-all"
            >
              <span>Bài kế tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. QUIZ TYPE */}
      {activeActivity.type === 'quiz' && (
        <QuizEngine
          key={activeActivity.id}
          activity={activeActivity}
          courseId={activeCourse.id}
        />
      )}

      {/* 2. ASSIGNMENT TYPE */}
      {activeActivity.type === 'assignment' && (
        <AssignmentSubmitter
          key={activeActivity.id}
          activity={activeActivity}
          courseId={activeCourse.id}
        />
      )}

      {/* 3. VIDEO TYPE */}
      {activeActivity.type === 'video' && (
        <VideoPlayerTracker
          key={activeActivity.id}
          activity={activeActivity}
          courseId={activeCourse.id}
        />
      )}

      {/* 4. DOCUMENT TYPE */}
      {activeActivity.type === 'document' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {activeActivity.title}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleMarkDone}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeActivity.isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#0374b5] text-white hover:bg-[#025a8c]'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{activeActivity.isCompleted ? 'Đã hoàn thành đọc' : 'Đánh dấu đã đọc tài liệu'}</span>
                </button>

                {resolvedDocUrl && (
                  <a
                    href={resolvedDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở / Tải tệp gốc</span>
                  </a>
                )}
              </div>
            </div>

            {/* Trình xem trước trực tiếp Học liệu tương tác HTML5 / PDF / Ảnh hoặc văn bản tóm tắt */}
            {resolvedDocUrl && isHtmlLabUrl ? (
              <div className="rounded-2xl overflow-hidden border border-sky-200 bg-white shadow-xs">
                <div className="px-4 py-2.5 bg-gradient-to-r from-[#0f2942] to-[#0374b5] text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold flex items-center gap-2">
                    <span>Học liệu tương tác HTML5 (Chạy trực tiếp trên trình duyệt)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={resolvedDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở toàn màn hình</span>
                    </a>
                    <a
                      href={resolvedDocUrl}
                      download
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải bản offline (.html)</span>
                    </a>
                  </div>
                </div>
                <iframe
                  src={resolvedDocUrl}
                  title={activeActivity.title}
                  className="w-full h-[840px] border-0 bg-white"
                />
              </div>
            ) : resolvedDocUrl && isPdfUrl ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <iframe
                  src={resolvedDocUrl}
                  title={activeActivity.title}
                  className="w-full h-[600px]"
                />
              </div>
            ) : resolvedDocUrl && isImageUrl ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-4 flex justify-center">
                <img
                  src={resolvedDocUrl}
                  alt={activeActivity.title}
                  className="max-h-[600px] object-contain rounded-xl shadow-xs"
                />
              </div>
            ) : !resolvedDocUrl && activeActivity.description && activeActivity.description.length > 120 ? (
              <div className="bg-slate-50/70 rounded-2xl p-5 sm:p-6 border border-slate-200/90 space-y-4">
                <div className="flex items-center gap-2.5 text-[#0374b5] border-b border-slate-200 pb-3">
                  <FileText className="w-5 h-5 shrink-0" />
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Nội dung bài đọc &amp; Kiến thức trọng tâm
                  </h3>
                </div>
                <FormattedContent text={activeActivity.description} />
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 sm:p-10 border border-slate-200 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="font-bold text-slate-800 text-base">
                    {activeActivity.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {resolvedDocUrl
                      ? 'Bấm "Mở / Tải tệp gốc" để xem hoặc tải toàn bộ tài liệu học tập về thiết bị.'
                      : 'Tài liệu hướng dẫn học tập trên Hệ thống LMS Nhóm 2.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {resolvedDocUrl && (
                    <a
                      href={resolvedDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-4 h-4 text-[#0374b5]" />
                      <span>Mở tài liệu</span>
                    </a>
                  )}
                  <button
                    onClick={handleMarkDone}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                  >
                    {activeActivity.isCompleted ? '✓ Đã xác nhận đọc tài liệu' : 'Xác nhận đã đọc & Hoàn thành'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. FORUM TYPE */}
      {activeActivity.type === 'forum' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          {/* Header gọn gàng: Tiêu đề bên trái, nút thao tác bên phải — không ép nội dung mô tả */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-sky-50 text-[#0374b5] border border-sky-200/80 text-[11px] font-bold uppercase tracking-wider">
                  Diễn đàn thảo luận
                </span>
                {activeActivity.durationMinutes ? (
                  <span className="text-xs text-slate-500 font-medium">
                    Thời lượng gợi ý: {activeActivity.durationMinutes} phút
                  </span>
                ) : null}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {activeActivity.title}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveModuleId(null);
                  setActiveCourseTab('discussions');
                  setCurrentView('course-detail');
                }}
                className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-[#0374b5] border border-sky-200 rounded-xl text-xs font-bold transition-colors"
              >
                Mở toàn bộ Diễn đàn lớp học →
              </button>
              <button
                type="button"
                onClick={handleMarkDone}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeActivity.isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[#0374b5] hover:bg-[#025a8c] text-white'
                }`}
              >
                {activeActivity.isCompleted ? '✓ Đã hoàn thành thảo luận' : 'Đánh dấu hoàn thành'}
              </button>
            </div>
          </div>

          {/* Nội dung hướng dẫn & câu hỏi thảo luận trình bày tách khối rõ ràng, toàn chiều rộng */}
          <FormattedContent
            text={activeActivity.description}
            fallback="Tham gia trao đổi, chia sẻ ý kiến cùng bạn học và giáo viên trong chủ đề này."
          />

          {/* Gửi ý kiến thảo luận trực tiếp từ hoạt động */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!quickForumText.trim()) return;
              if (!currentUser?.id) {
                setIsLoginModalOpen(true);
                return;
              }
              setIsPostingForum(true);
              try {
                const ok = await createForumTopic(activeCourse.id, `[${activeActivity.title}] Ý kiến của ${currentUser.name || 'Học viên'}`, quickForumText.trim());
                if (ok) {
                  setQuickForumText('');
                  if (!activeActivity.isCompleted) handleMarkDone();
                }
              } finally {
                setIsPostingForum(false);
              }
            }}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
          >
            <label className="block text-xs font-bold text-slate-700">
              Đóng góp ý kiến / câu hỏi của bạn cho chủ đề này:
            </label>
            <textarea
              rows={3}
              value={quickForumText}
              onChange={(e) => setQuickForumText(e.target.value)}
              placeholder="Nhập chia sẻ, nhận xét hoặc câu hỏi thảo luận của bạn..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPostingForum || !quickForumText.trim()}
                className="px-4 py-2 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] disabled:opacity-50 text-white text-xs font-bold shadow-xs"
              >
                {isPostingForum ? 'Đang đăng...' : 'Đăng thảo luận & Hoàn thành'}
              </button>
            </div>
          </form>

          {/* Danh sách thảo luận gần đây của khóa học */}
          {forumTopics.filter(t => t.courseId === activeCourse.id).length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Các trao đổi gần đây trong lớp ({forumTopics.filter(t => t.courseId === activeCourse.id).length})
              </h3>
              {forumTopics.filter(t => t.courseId === activeCourse.id).slice(0, 5).map(topic => (
                <div key={topic.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{topic.title}</span>
                    <span className="text-[10px] text-slate-400">{(topic.replies || []).length} phản hồi</span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line">{topic.content}</p>
                  <p className="text-[10px] text-slate-400">{topic.author?.name || 'Thành viên'} • {topic.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GIÁO VIÊN: BẢNG GIÁM SÁT TIẾN ĐỘ HỌC SINH NGAY TRONG HOẠT ĐỘNG (Video, Quiz, Document, Forum) */}
      {canManage && !isEmbedMode && activeActivity.type !== 'assignment' && (
        <TeacherActivityMonitor courseId={activeCourse.id} activity={activeActivity} />
      )}

      {/* MODAL CHIA SẺ LINK / NHÚNG IFRAME / XUẤT GÓI SCORM-QUIZ-JSON */}
      {isShareOpen && (
        <ShareExportModal
          course={activeCourse}
          module={parentModule}
          activity={activeActivity}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
};
