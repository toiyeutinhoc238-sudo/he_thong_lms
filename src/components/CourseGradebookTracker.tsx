import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Course, QuizQuestion, User } from '../types';
import api, { resolveBackendUrl } from '../services/api';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  UserPlus,
  Play,
  FileText,
  CheckSquare,
  Eye,
  Edit3,
  X,
  ExternalLink,
  FileSpreadsheet,
  BookOpen,
  Users,
  Check,
  TrendingUp,
  BarChart3,
  Table2,
  Timer,
  Trash2,
  ChevronRight,
  Layers,
  DatabaseBackup,
  History
} from 'lucide-react';

interface CourseGradebookTrackerProps {
  course: Course;
  canManage: boolean;
  currentUser: User | null;
  onNavigateToModules?: () => void;
}

function formatClock(secs?: number) {
  if (!secs || !Number.isFinite(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatStudyTime(secs?: number) {
  if (!secs || secs <= 0) return '0 phút';
  if (secs < 60) return `${secs} giây`;
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}g ${rm}p` : `${h} giờ`;
}

export const CourseGradebookTracker: React.FC<CourseGradebookTrackerProps> = ({
  course,
  canManage,
  currentUser,
  onNavigateToModules
}) => {
  const [gradebook, setGradebook] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subView, setSubView] = useState<'overview' | 'matrix'>('matrix');

  // Bộ lọc thông minh
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'on_track' | 'needs_attention' | 'inactive'>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'quiz' | 'assignment' | 'document'>('all');

  // Modals & Drawers
  const [selectedStudentRow, setSelectedStudentRow] = useState<any>(null);
  const [quizReviewModal, setQuizReviewModal] = useState<{
    student: any;
    activity: any;
    quizResult: any;
    quizHistory?: any[];
    questions: QuizQuestion[];
  } | null>(null);
  const [assignmentGradeModal, setAssignmentGradeModal] = useState<{
    student: any;
    activity: any;
    submission: any;
    submissionHistory?: any[];
  } | null>(null);

  // Enroll Modal (có cả chọn nhanh, nhập 1 em, và ghi danh hàng loạt CSV/danh sách lớp)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [enrollTab, setEnrollTab] = useState<'pick' | 'manual' | 'bulk'>('pick');
  const [enrollForm, setEnrollForm] = useState({ name: '', email: '', code: '', className: 'Lớp 6A' });
  const [bulkEnrollText, setBulkEnrollText] = useState('');
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);

  const loadGradebook = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.courses.getGradebook(course.id);
      if (res && Array.isArray(res.students)) {
        setGradebook(res);
        setSelectedStudentRow((prev: any) =>
          prev ? (res.students.find((s: any) => s.student?.id === prev.student?.id) || null) : null
        );
      } else {
        setGradebook({
          courseId: course.id,
          courseName: course.name,
          modules: (course.modules || []).map(m => ({
            id: m.id, title: m.title, order: m.order, activityCount: (m.activities || []).length, avgCompletionPercent: 0, completedStudentsCount: 0
          })),
          activities: (course.modules || []).flatMap(m => (m.activities || []).map(a => ({ ...a, moduleId: m.id, moduleTitle: m.title }))),
          students: [],
          summary: { totalStudents: 0, avgProgress: 0, classAvgScore: null, pendingGrading: 0, completedStudentsCount: 0, activeStudentsCount: 0, atRiskStudentsCount: 0, totalTimeSpentSeconds: 0 }
        });
      }
    } catch (e) {
      setGradebook({
        courseId: course.id,
        courseName: course.name,
        modules: (course.modules || []).map(m => ({
          id: m.id, title: m.title, order: m.order, activityCount: (m.activities || []).length, avgCompletionPercent: 0, completedStudentsCount: 0
        })),
        activities: (course.modules || []).flatMap(m => (m.activities || []).map(a => ({ ...a, moduleId: m.id, moduleTitle: m.title }))),
        students: [],
        summary: { totalStudents: 0, avgProgress: 0, classAvgScore: null, pendingGrading: 0, completedStudentsCount: 0, activeStudentsCount: 0, atRiskStudentsCount: 0, totalTimeSpentSeconds: 0 }
      });
    } finally {
      setLoading(false);
    }
  }, [course.id, course.name, course.modules]);

  useEffect(() => {
    loadGradebook();
  }, [loadGradebook]);

  // Nạp danh sách user thật khi mở modal ghi danh
  useEffect(() => {
    if (!isEnrollModalOpen || !canManage) return;
    api.users.getAll()
      .then(res => {
        if (Array.isArray(res)) {
          const enrolledEmails = new Set((gradebook?.students || []).map((r: any) => String(r.student?.email || '').toLowerCase()));
          const available = res.filter(u =>
            u.role !== 'admin' &&
            u.role !== 'lecturer' &&
            !enrolledEmails.has(String(u.email || '').toLowerCase())
          );
          setSystemUsers(available);
          if (available.length === 0) setEnrollTab('manual');
        }
      })
      .catch(() => setEnrollTab('manual'));
  }, [isEnrollModalOpen, canManage, gradebook?.students]);

  const allActivitiesList = gradebook?.activities || [];
  const modulesList = gradebook?.modules || [];
  const allStudents = gradebook?.students || [];

  // Lọc hoạt động hiển thị trong ma trận theo Bài học (Module) & Loại học liệu
  const visibleActivities = useMemo(() => {
    return allActivitiesList.filter((a: any) => {
      if (moduleFilter !== 'all' && a.moduleId !== moduleFilter) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      return true;
    });
  }, [allActivitiesList, moduleFilter, typeFilter]);

  // Lọc học sinh theo từ khóa & trạng thái học tập
  const filteredStudents = useMemo(() => {
    return allStudents.filter((stRow: any) => {
      const s = stRow.student || {};
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.className || '').toLowerCase().includes(q);
      if (!matchQuery) return false;
      if (statusFilter !== 'all' && stRow.engagementStatus !== statusFilter) return false;
      return true;
    });
  }, [allStudents, searchQuery, statusFilter]);

  const summary = gradebook?.summary || {
    totalStudents: allStudents.length,
    avgProgress: 0,
    classAvgScore: null,
    pendingGrading: 0,
    completedStudentsCount: 0,
    activeStudentsCount: 0,
    atRiskStudentsCount: 0,
    totalTimeSpentSeconds: 0
  };

  // Danh sách câu hỏi trắc nghiệm khó nhất trên toàn khóa
  const quizQuestionInsights = useMemo(() => {
    const out: Array<{ activityTitle: string; index: number; question: string; attempts: number; correct: number; accuracyPercent: number }> = [];
    allActivitiesList.forEach((act: any) => {
      if (act.type === 'quiz' && Array.isArray(act.questionStats)) {
        act.questionStats.forEach((qs: any) => {
          if (qs.attempts > 0 && qs.accuracyPercent !== null) {
            out.push({
              activityTitle: act.title,
              index: qs.index,
              question: qs.question,
              attempts: qs.attempts,
              correct: qs.correct,
              accuracyPercent: qs.accuracyPercent
            });
          }
        });
      }
    });
    return out.sort((a, b) => a.accuracyPercent - b.accuracyPercent);
  }, [allActivitiesList]);

  // Ghi danh học sinh mới (thủ công hoặc chọn nhanh từ hệ thống)
  const handleQuickEnrollUser = async (u: any) => {
    try {
      setIsEnrolling(true);
      await api.courses.enrollStudent(course.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        code: u.code,
        className: u.className || u.classOrPosition || 'Lớp 6A',
        school: u.school || u.department || '',
        avatar: u.avatar || ''
      });
      await loadGradebook();
      setSystemUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err: any) {
      alert(err?.message || 'Không thể ghi danh học viên.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEnrollManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.name.trim() || !enrollForm.email.trim()) return;
    try {
      setIsEnrolling(true);
      await api.courses.enrollStudent(course.id, {
        name: enrollForm.name.trim(),
        email: enrollForm.email.trim(),
        code: enrollForm.code.trim() || undefined,
        className: enrollForm.className.trim() || 'Lớp 6A'
      });
      setIsEnrollModalOpen(false);
      setEnrollForm({ name: '', email: '', code: '', className: 'Lớp 6A' });
      await loadGradebook();
    } catch (err: any) {
      alert(err?.message || 'Không thể ghi danh học viên.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn gỡ học sinh "${studentName}" khỏi danh sách lớp này?`)) return;
    try {
      await api.courses.removeStudent(course.id, studentId);
      setSelectedStudentRow(null);
      await loadGradebook();
    } catch (err: any) {
      alert(err?.message || 'Không thể gỡ học sinh khỏi lớp.');
    }
  };

  // Xuất file CSV bảng điểm chuẩn Excel tiếng Việt
  const handleExportCSV = () => {
    if (!allStudents.length) {
      alert('Chưa có dữ liệu học viên để xuất file.');
      return;
    }
    let csv = '\uFEFF';
    csv += 'STT,Họ và tên,Mã HS,Lớp,Email,Tiến độ (%),Hoàn thành,Thời gian học,Điểm TB (GPA),Trạng thái';
    allActivitiesList.forEach((a: any) => {
      const label = a.type === 'video' ? 'Video' : a.type === 'quiz' ? 'Trắc nghiệm' : a.type === 'assignment' ? 'Bài tập' : 'Tài liệu';
      csv += `,"[${label}] ${String(a.title || '').replace(/"/g, '""')}"`;
    });
    csv += '\n';

    allStudents.forEach((row: any, idx: number) => {
      const s = row.student || {};
      const statusText = row.engagementStatus === 'completed' ? 'Hoàn thành' : row.engagementStatus === 'on_track' ? 'Đúng tiến độ' : row.engagementStatus === 'needs_attention' ? 'Cần chú ý' : 'Chưa bắt đầu';
      csv += `${idx + 1},"${(s.name || '').replace(/"/g, '""')}","${s.code || ''}","${s.className || ''}","${s.email || ''}",${row.overallProgress || 0},"${row.completedCount || 0}/${row.totalActivities || 0}","${formatStudyTime(row.totalTimeSpentSeconds)}",${row.averageScore ?? '-'},"${statusText}"`;

      const recByAct = new Map<string, any>((row.activities || []).map((a: any) => [a.activityId, a]));
      allActivitiesList.forEach((a: any) => {
        const ap = recByAct.get(a.id);
        if (!ap) csv += ',"-"';
        else if (ap.type === 'video') {
          const pct = ap.videoProgress?.progressPercent ?? (ap.isCompleted ? 100 : 0);
          csv += `,"Đã xem ${pct}%"`;
        } else if (ap.type === 'quiz') {
          csv += `,"${ap.score !== null ? `${ap.score}/10` : 'Chưa làm'}"`;
        } else if (ap.type === 'assignment') {
          csv += `,"${ap.score !== null ? `${ap.score}/10` : ap.submission ? 'Chờ chấm' : 'Chưa nộp'}"`;
        } else {
          csv += `,"${ap.isCompleted ? 'Đã đọc' : ap.viewCount > 0 ? `Đang xem (${ap.viewCount} lượt)` : 'Chưa mở'}"`;
        }
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tien_do_va_Diem_${course.code || 'LMS'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sao lưu toàn bộ dữ liệu học sinh, sổ điểm, lịch sử bài làm & nhận xét ra tệp JSON chuẩn lưu trữ
  const handleBackupClassJson = () => {
    if (!gradebook) {
      alert('Chưa có dữ liệu sổ điểm để sao lưu.');
      return;
    }
    const backupPayload = {
      format: 'lms-nhom2-gradebook-backup',
      version: '1.0',
      backedUpAt: new Date().toISOString(),
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        gradeLevel: course.gradeLevel,
        category: course.category
      },
      summary: gradebook.summary,
      modules: gradebook.modules,
      activities: gradebook.activities,
      students: gradebook.students
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sao_luu_Du_lieu_Lop_${course.code || 'LMS'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ====================== CHẾ ĐỘ HỌC SINH (BẢNG TIẾN ĐỘ & ĐIỂM CÁ NHÂN GỌN ĐẸP) ======================
  if (!canManage) {
    const myRow = allStudents[0] || null;
    const myActs = myRow?.activities || [];
    const myModules = myRow?.moduleProgress || [];

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Tiến độ & Sổ điểm cá nhân</h2>
            <p className="text-xs text-slate-500 mt-0.5">{course.name} • {currentUser?.name}</p>
          </div>
          <button
            type="button"
            onClick={loadGradebook}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Thẻ tổng quan cá nhân */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-br from-[#0374b5] to-sky-700 text-white rounded-2xl shadow-sm space-y-2">
            <p className="text-xs text-sky-100 font-semibold">Tiến độ hoàn thành khóa học</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black">{myRow?.overallProgress || 0}%</span>
              <span className="text-xs text-sky-100">{myRow?.completedCount || 0}/{myRow?.totalActivities || allActivitiesList.length} bài</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-300" style={{ width: `${myRow?.overallProgress || 0}%` }} />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Điểm trung bình (GPA)</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {myRow?.averageScore !== null && myRow?.averageScore !== undefined ? `${myRow.averageScore}/10` : 'Chưa có'}
              </p>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Tổng thời gian học</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{formatStudyTime(myRow?.totalTimeSpentSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Tiến độ theo từng bài học */}
        {myModules.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Tiến độ theo từng bài học</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myModules.map((mp: any) => (
                <div key={mp.moduleId} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800 truncate">{mp.moduleTitle}</span>
                    <span className="font-mono font-bold text-[#0374b5] shrink-0">{mp.completed}/{mp.total} ({mp.percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${mp.percent === 100 && mp.total > 0 ? 'bg-emerald-500' : 'bg-[#0374b5]'}`} style={{ width: `${mp.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bảng chi tiết từng hoạt động cá nhân */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Hoạt động học tập</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Điểm / Tiến độ video</th>
                <th className="py-3 px-4">Nhận xét & Xem lại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myActs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Chưa có hoạt động học tập nào trong khóa học này.
                  </td>
                </tr>
              ) : (
                myActs.map((ap: any) => {
                  const vp = ap.videoProgress;
                  const pct = vp?.progressPercent ?? (ap.isCompleted ? 100 : 0);
                  return (
                    <tr key={ap.activityId} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{ap.title}</p>
                        <p className="text-[10px] text-slate-400">{ap.moduleTitle}</p>
                      </td>
                      <td className="py-3 px-4">
                        {ap.isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                          </span>
                        ) : ap.status === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                            <Clock className="w-3 h-3" /> Đang học
                          </span>
                        ) : (
                          <span className="text-slate-400">Chưa bắt đầu</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ap.type === 'video' ? (
                          <span className="font-mono font-bold text-[#0374b5]">Đã xem {pct}%</span>
                        ) : ap.score !== null ? (
                          <span className="font-mono font-black text-emerald-700 text-sm">{ap.score}/{ap.maxScore || 10}</span>
                        ) : ap.submission ? (
                          <span className="text-amber-700 font-semibold">Đã nộp (chờ chấm)</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ap.type === 'quiz' && ap.quizResult ? (
                          <button
                            type="button"
                            onClick={() => setQuizReviewModal({
                              student: myRow.student,
                              activity: { title: ap.title, maxScore: ap.maxScore },
                              quizResult: ap.quizResult,
                              quizHistory: ap.quizHistory || [ap.quizResult],
                              questions: ap.quizQuestions || []
                            })}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] font-bold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Xem đúng/sai
                          </button>
                        ) : ap.submission?.feedback ? (
                          <span className="text-slate-700 italic">"{ap.submission.feedback}"</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal xem lại bài trắc nghiệm cho học sinh */}
        {quizReviewModal && (
          <QuizReviewDetailModal data={quizReviewModal} onClose={() => setQuizReviewModal(null)} />
        )}
      </div>
    );
  }

  // ====================== CHẾ ĐỘ GIÁO VIÊN / QUẢN TRỊ VIÊN ======================
  return (
    <div className="p-5 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-900">
              Trung tâm Theo dõi Tiến độ & Sổ điểm Học sinh
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0374b5]/10 text-[#0374b5] text-xs font-bold">
              {course.code || '6AIAB01'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Giám sát tiến độ hoàn thành từng bài học, thời lượng xem video (%), kết quả trắc nghiệm đúng/sai và chấm bài tập theo thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadGradebook}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất CSV (Excel)</span>
          </button>

          <button
            type="button"
            onClick={handleBackupClassJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-all shadow-2xs"
            title="Tải tệp sao lưu JSON đầy đủ toàn bộ điểm số, bài nộp, lịch sử làm bài và nhận xét của cả lớp"
          >
            <DatabaseBackup className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sao lưu dữ liệu (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEnrollModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold transition-all shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Ghi danh học sinh</span>
          </button>
        </div>
      </div>

      {/* 5 Thẻ KPI Thống kê trực quan */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0374b5] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sĩ số lớp</p>
            <h3 className="text-lg font-black text-slate-900">{summary.totalStudents} HS</h3>
            <p className="text-[10px] text-emerald-600 font-semibold">{summary.activeStudentsCount} đang hoạt động</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiến độ TB</p>
            <h3 className="text-lg font-black text-slate-900">{summary.avgProgress}%</h3>
            <p className="text-[10px] text-teal-700 font-semibold">{summary.completedStudentsCount} hoàn thành 100%</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cần chú ý</p>
            <h3 className="text-lg font-black text-rose-600">{summary.atRiskStudentsCount} HS</h3>
            <p className="text-[10px] text-slate-500">Tiến độ thấp / chưa học</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chờ chấm bài</p>
            <h3 className="text-lg font-black text-amber-600">{summary.pendingGrading} bài</h3>
            <p className="text-[10px] text-slate-500">Bài tập đã nộp</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm TB lớp</p>
            <h3 className="text-lg font-black text-emerald-600">
              {summary.classAvgScore !== null ? `${summary.classAvgScore}/10` : 'Chưa có'}
            </h3>
            <p className="text-[10px] text-slate-500">Học: {formatStudyTime(summary.totalTimeSpentSeconds)}</p>
          </div>
        </div>
      </div>

      {/* Chuyển đổi giữa 2 góc nhìn: Ma trận chi tiết & Phân tích tổng quan */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSubView('matrix')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subView === 'matrix' ? 'bg-white text-[#0374b5] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Bảng Tiến độ & Sổ điểm chi tiết</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('overview')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subView === 'overview' ? 'bg-white text-[#0374b5] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Phân tích Bài học & Cảnh báo</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Mẹo: Bấm vào <strong>tên học sinh</strong> bất kỳ để xem hồ sơ tiến độ chi tiết theo cả 8 bài học.
        </p>
      </div>

      {/* Hướng dẫn nếu chưa có học liệu */}
      {allActivitiesList.length === 0 && (
        <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Các bài học chưa có hoạt động học liệu</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Hãy sang tab <strong>"Nội dung học tập"</strong> để thêm Video, Tài liệu, Bài tập hoặc Đề trắc nghiệm. Hệ thống sẽ tự động giám sát tiến độ của học sinh ngay khi các em bắt đầu học.
              </p>
            </div>
          </div>
          {onNavigateToModules && (
            <button
              type="button"
              onClick={onNavigateToModules}
              className="px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold rounded-xl shadow-xs shrink-0"
            >
              Đi đến Nội dung học tập
            </button>
          )}
        </div>
      )}

      {/* ==================== GÓC NHÌN 1: PHÂN TÍCH BÀI HỌC & CẢNH BÁO ==================== */}
      {subView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cột trái (2/3): Tiến độ hoàn thành theo từng Bài học (8 Mô-đun) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0374b5]" />
                <h3 className="text-sm font-extrabold text-slate-900">Tiến độ hoàn thành trung bình theo từng Bài học</h3>
              </div>
              <span className="text-xs text-slate-400">{modulesList.length} bài học</span>
            </div>

            {modulesList.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">Chưa có bài học nào.</p>
            ) : (
              <div className="space-y-3">
                {modulesList.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setModuleFilter(m.id);
                      setSubView('matrix');
                    }}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-[#0374b5]/40 bg-slate-50/60 hover:bg-sky-50/30 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-800 truncate">{m.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500">{m.activityCount} học liệu</span>
                        <span className="font-mono font-black text-[#0374b5]">{m.avgCompletionPercent}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${m.avgCompletionPercent >= 80 ? 'bg-emerald-500' : m.avgCompletionPercent >= 40 ? 'bg-[#0374b5]' : 'bg-amber-400'}`}
                        style={{ width: `${m.avgCompletionPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{m.completedStudentsCount}/{summary.totalStudents} học sinh hoàn thành trọn bài</span>
                      <span className="text-[#0374b5] font-semibold">Bấm để lọc bảng chi tiết →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Phân tích câu hỏi trắc nghiệm khó nhất */}
            {quizQuestionInsights.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Phân tích độ khó câu hỏi trắc nghiệm (Sắp xếp từ câu sai nhiều nhất)
                </h4>
                <div className="space-y-2">
                  {quizQuestionInsights.slice(0, 6).map((q, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">Câu {q.index}: {q.question}</p>
                        <p className="text-[10px] text-slate-400 truncate">{q.activityTitle}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs shrink-0 ${
                        q.accuracyPercent < 50 ? 'bg-rose-100 text-rose-700' : q.accuracyPercent < 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {q.accuracyPercent}% đúng ({q.correct}/{q.attempts})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải (1/3): Danh sách học sinh cần chú ý / nhắc nhở */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-extrabold text-slate-900">Học sinh cần quan tâm</h3>
            </div>

            {allStudents.filter((r: any) => r.engagementStatus === 'inactive' || r.engagementStatus === 'needs_attention').length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  {allStudents.length === 0 ? 'Chưa có học sinh trong lớp' : 'Tuyệt vời! Tất cả học sinh đều đang theo kịp tiến độ.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto">
                {allStudents
                  .filter((r: any) => r.engagementStatus === 'inactive' || r.engagementStatus === 'needs_attention')
                  .sort((a: any, b: any) => a.overallProgress - b.overallProgress)
                  .map((r: any) => (
                    <div
                      key={r.student.id}
                      onClick={() => setSelectedStudentRow(r)}
                      className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">{r.student.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{r.student.email}</p>
                        <p className="text-[10px] font-bold text-rose-600 mt-0.5">
                          {r.engagementStatus === 'inactive' ? 'Chưa bắt đầu học (0%)' : `Tiến độ chậm (${r.overallProgress}%)`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== GÓC NHÌN 2: MA TRẬN TIẾN ĐỘ & SỔ ĐIỂM CHI TIẾT ==================== */}
      {subView === 'matrix' && (
        <>
          {/* Thanh tìm kiếm & bộ lọc đa chiều */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên học sinh, mã HS, email, lớp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0374b5] text-slate-700 font-semibold shadow-2xs max-w-[210px]"
              >
                <option value="all">Tất cả bài học ({modulesList.length})</option>
                {modulesList.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0374b5] text-slate-700 font-semibold shadow-2xs"
            >
              <option value="all">Tất cả loại học liệu</option>
              <option value="video">🎬 Video bài giảng</option>
              <option value="quiz">❓ Trắc nghiệm</option>
              <option value="assignment">📝 Bài tập thực hành</option>
              <option value="document">📄 Tài liệu đọc</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0374b5] text-slate-700 font-semibold shadow-2xs"
            >
              <option value="all">Tất cả trạng thái HS</option>
              <option value="completed">✓ Hoàn thành 100%</option>
              <option value="on_track">📈 Đúng tiến độ</option>
              <option value="needs_attention">⚠ Cần chú ý</option>
              <option value="inactive">⏸ Chưa bắt đầu</option>
            </select>
          </div>

          {/* Bảng Ma trận Sổ điểm */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto max-h-[650px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20">
                  <tr>
                    <th className="py-3 px-3 w-11 text-center border-r border-slate-200 bg-slate-50 sticky left-0 z-30">STT</th>
                    <th className="py-3 px-4 min-w-[215px] border-r border-slate-200 bg-slate-50 sticky left-11 z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                      Học sinh (Bấm xem hồ sơ)
                    </th>
                    <th className="py-3 px-3.5 min-w-[145px] border-r border-slate-200 bg-slate-50">Tiến độ chung</th>
                    <th className="py-3 px-3 w-20 text-center border-r border-slate-200 bg-slate-50">Điểm TB</th>
                    <th className="py-3 px-3 min-w-[110px] border-r border-slate-200 bg-slate-50">Thời lượng học</th>

                    {visibleActivities.map((act: any) => (
                      <th
                        key={act.id}
                        className="py-2.5 px-3.5 min-w-[175px] border-r border-slate-200 bg-slate-50 last:border-r-0"
                      >
                        <div className="flex items-center gap-1.5 text-slate-800">
                          {act.type === 'video' && <Play className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                          {act.type === 'quiz' && <CheckSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          {act.type === 'assignment' && <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                          {act.type === 'document' && <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          <span className="truncate font-bold" title={act.title}>{act.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center justify-between gap-1">
                          <span>
                            {act.stats ? `${act.stats.completedCount}/${summary.totalStudents} xong` : ''}
                          </span>
                          <span>
                            {act.type === 'video'
                              ? `TB ${act.stats?.avgVideoPercent || 0}%`
                              : act.stats?.avgScore !== null && act.stats?.avgScore !== undefined
                                ? `TB ${act.stats.avgScore}đ`
                                : `Thang ${act.maxScore || 10}đ`}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5 + visibleActivities.length} className="py-12 text-center text-slate-400">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-600">
                          {allStudents.length === 0
                            ? 'Chưa có học sinh nào tham gia khóa học này.'
                            : 'Không tìm thấy học sinh phù hợp bộ lọc.'}
                        </p>
                        <p className="text-xs mt-1">
                          Khi học sinh đăng nhập bằng Google và vào học bài, hệ thống sẽ tự động ghi danh & hiện tiến độ tại đây. Bạn cũng có thể bấm <strong>"+ Ghi danh học sinh"</strong> ở góc trên.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stRow: any, stIdx: number) => {
                      const s = stRow.student || {};
                      const actMap = new Map<string, any>((stRow.activities || []).map((a: any) => [a.activityId, a]));

                      return (
                        <tr key={s.id || stIdx} className="hover:bg-sky-50/30 transition-colors group">
                          <td className="py-3 px-3 text-center text-slate-400 border-r border-slate-100 font-mono bg-white group-hover:bg-sky-50/30 sticky left-0 z-10">
                            {stIdx + 1}
                          </td>

                          {/* Thông tin học sinh (click mở Drawer chi tiết) */}
                          <td
                            onClick={() => setSelectedStudentRow(stRow)}
                            className="py-3 px-4 border-r border-slate-100 bg-white group-hover:bg-sky-50/30 sticky left-11 z-10 cursor-pointer shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                          >
                            <div className="flex items-center gap-2.5">
                              {s.avatar ? (
                                <img
                                  src={s.avatar}
                                  alt={s.name}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0374b5] to-sky-400 text-white font-black text-xs flex items-center justify-center shrink-0">
                                  {(s.name || 'H').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-slate-900 group-hover:text-[#0374b5] group-hover:underline truncate">
                                  {s.name || 'Học sinh'}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {s.className ? `${s.className} • ` : ''}{s.email || s.code}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Tiến độ chung */}
                          <td className="py-3 px-3.5 border-r border-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={`font-black ${
                                  stRow.overallProgress === 100 ? 'text-emerald-600' : stRow.overallProgress >= 50 ? 'text-[#0374b5]' : 'text-amber-600'
                                }`}>
                                  {stRow.overallProgress || 0}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {stRow.completedCount || 0}/{stRow.totalActivities || 0} bài
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full transition-all ${stRow.overallProgress === 100 ? 'bg-emerald-500' : stRow.overallProgress >= 50 ? 'bg-[#0374b5]' : 'bg-amber-400'}`}
                                  style={{ width: `${stRow.overallProgress || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Điểm TB */}
                          <td className="py-3 px-3 text-center border-r border-slate-100 font-mono font-black text-sm">
                            {stRow.averageScore !== null && Number.isFinite(stRow.averageScore) ? (
                              <span className={stRow.averageScore >= 8 ? 'text-emerald-600' : stRow.averageScore >= 5 ? 'text-[#0374b5]' : 'text-rose-600'}>
                                {stRow.averageScore}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Thời gian học & hoạt động gần nhất */}
                          <td className="py-3 px-3 border-r border-slate-100">
                            <p className="font-bold text-slate-700 text-[11px]">{formatStudyTime(stRow.totalTimeSpentSeconds)}</p>
                            <p className="text-[10px] text-slate-400">
                              {stRow.lastActivityAt ? new Date(stRow.lastActivityAt).toLocaleDateString('vi-VN') : 'Chưa vào học'}
                            </p>
                          </td>

                          {/* Từng ô học liệu */}
                          {visibleActivities.map((act: any) => {
                            const actProg = actMap.get(act.id);
                            if (!actProg) {
                              return <td key={act.id} className="py-3 px-3 text-center text-slate-300 border-r border-slate-100 last:border-r-0">-</td>;
                            }

                            // 1. VIDEO
                            if (act.type === 'video') {
                              const vp = actProg.videoProgress;
                              const pct = vp?.progressPercent ?? (actProg.isCompleted ? 100 : 0);
                              const isDone = actProg.isCompleted || pct >= 80;

                              return (
                                <td key={act.id} className="py-2.5 px-3 border-r border-slate-100 last:border-r-0">
                                  {pct > 0 ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-1 text-[11px]">
                                        <span className={`font-black ${isDone ? 'text-emerald-700' : 'text-amber-700'}`}>
                                          Đã xem {pct}%
                                        </span>
                                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        {vp?.watchedSeconds ? `${formatClock(vp.watchedSeconds)}${vp.totalSeconds ? '/' + formatClock(vp.totalSeconds) : ''}` : 'Hoàn thành'}
                                        {(act.videoCheckpointsCount > 0 || (vp?.checkpointsTotal || 0) > 0) && (
                                          <span className="ml-1 text-indigo-600 font-bold">
                                            • Neo {vp?.checkpointsPassed || 0}/{vp?.checkpointsTotal || act.videoCheckpointsCount}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  ) : actProg.viewCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-[#0374b5] text-[10px] font-semibold">
                                      Đã mở ({actProg.viewCount} lượt)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px]">
                                      Chưa xem (0%)
                                    </span>
                                  )}
                                </td>
                              );
                            }

                            // 2. QUIZ
                            if (act.type === 'quiz') {
                              const qr = actProg.quizResult;
                              const hasTaken = !!qr || actProg.score !== null;
                              const score = actProg.score ?? qr?.score;
                              const isPassed = qr?.passed ?? (score !== undefined && score >= (act.passScore || 5));

                              return (
                                <td key={act.id} className="py-2.5 px-3 border-r border-slate-100 last:border-r-0">
                                  {hasTaken ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`font-mono font-black text-xs ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {score}/10đ
                                        </span>
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                          {qr?.correctCount !== undefined && qr?.totalQuestions
                                            ? `${qr.correctCount}/${qr.totalQuestions} đúng`
                                            : isPassed ? 'Đạt' : 'Chưa đạt'}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setQuizReviewModal({
                                          student: s,
                                          activity: act,
                                          quizResult: qr || { score, maxScore: 10, passed: isPassed, answers: {} },
                                          quizHistory: actProg?.quizHistory || (qr ? [qr] : []),
                                          questions: act.quizQuestions || []
                                        })}
                                        className="w-full px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] text-[10px] font-bold flex items-center justify-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Xem đúng/sai</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px]">
                                      Chưa làm bài
                                    </span>
                                  )}
                                </td>
                              );
                            }

                            // 3. ASSIGNMENT
                            if (act.type === 'assignment') {
                              const sub = actProg.submission;
                              const isSubmitted = !!sub;
                              const isGraded = sub?.status === 'graded' || actProg.score !== null;
                              const score = actProg.score ?? sub?.grade;

                              return (
                                <td key={act.id} className="py-2.5 px-3 border-r border-slate-100 last:border-r-0">
                                  {isSubmitted ? (
                                    <div className="space-y-1">
                                      {sub?.status === 'graded' ? (
                                        <span className="font-mono font-black text-xs text-indigo-600 block">
                                          {score}/{act.maxScore || 10}đ {sub?.isLate ? '• Trễ' : ''}
                                        </span>
                                      ) : (
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                                          {score !== null && score !== undefined ? `Nộp lại (${score}đ) • Chờ chấm` : (sub?.isLate ? 'Nộp trễ • Chờ chấm' : 'Đã nộp • Chờ chấm')}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setAssignmentGradeModal({ student: s, activity: act, submission: sub, submissionHistory: actProg?.submissionHistory || [] })}
                                        className="w-full px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        <span>{sub?.status === 'graded' ? 'Xem / Sửa điểm' : 'Chấm điểm'}</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px]">
                                      Chưa nộp
                                    </span>
                                  )}
                                </td>
                              );
                            }

                            // 4. DOCUMENT / FORUM
                            return (
                              <td key={act.id} className="py-2.5 px-3 border-r border-slate-100 last:border-r-0">
                                {actProg.isCompleted ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                      <Check className="w-3 h-3" /> Đã hoàn thành
                                    </span>
                                    {actProg.timeSpentSeconds > 0 && (
                                      <p className="text-[10px] text-slate-400">{formatStudyTime(actProg.timeSpentSeconds)}</p>
                                    )}
                                  </div>
                                ) : actProg.viewCount > 0 ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                                      Đang xem ({actProg.viewCount} lượt)
                                    </span>
                                    {actProg.timeSpentSeconds > 0 && (
                                      <p className="text-[10px] text-slate-400">{formatStudyTime(actProg.timeSpentSeconds)}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-[10px]">Chưa mở</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================== DRAWER: HỒ SƠ TIẾN ĐỘ CHI TIẾT CỦA 1 HỌC SINH ==================== */}
      {selectedStudentRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 shadow-2xl space-y-5 animate-in slide-in-from-right">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                {selectedStudentRow.student.avatar ? (
                  <img
                    src={selectedStudentRow.student.avatar}
                    alt={selectedStudentRow.student.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#0374b5]/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0374b5] text-white font-black text-lg flex items-center justify-center">
                    {(selectedStudentRow.student.name || 'H').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedStudentRow.student.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStudentRow.student.email}</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedStudentRow.student.code ? `Mã: ${selectedStudentRow.student.code} • ` : ''}
                    {selectedStudentRow.student.className || 'Học viên'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentRow(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Chỉ số cá nhân */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Tiến độ</p>
                <p className="text-xl font-black text-[#0374b5] mt-0.5">{selectedStudentRow.overallProgress}%</p>
                <p className="text-[10px] text-slate-500">{selectedStudentRow.completedCount}/{selectedStudentRow.totalActivities} bài</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Điểm TB</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">
                  {selectedStudentRow.averageScore !== null ? `${selectedStudentRow.averageScore}/10` : '—'}
                </p>
                <p className="text-[10px] text-slate-500">Thang điểm 10</p>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Thời gian học</p>
                <p className="text-base font-black text-indigo-700 mt-1">{formatStudyTime(selectedStudentRow.totalTimeSpentSeconds)}</p>
                <p className="text-[10px] text-slate-500">{selectedStudentRow.totalViews || 0} lượt mở</p>
              </div>
            </div>

            {/* Tiến độ theo 8 Bài học */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Tiến độ theo từng Bài học</h4>
              <div className="space-y-2">
                {(selectedStudentRow.moduleProgress || []).map((mp: any) => (
                  <div key={mp.moduleId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-800 truncate">{mp.moduleTitle}</span>
                      <span className="font-mono font-bold text-[#0374b5] shrink-0">{mp.completed}/{mp.total} ({mp.percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${mp.percent === 100 && mp.total > 0 ? 'bg-emerald-500' : 'bg-[#0374b5]'}`} style={{ width: `${mp.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danh sách từng hoạt động */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Chi tiết từng hoạt động học tập</h4>
              {(selectedStudentRow.activities || []).length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có hoạt động nào.</p>
              ) : (
                <div className="space-y-2">
                  {(selectedStudentRow.activities || []).map((ap: any) => {
                    const fullAct = allActivitiesList.find((x: any) => x.id === ap.activityId) || ap;
                    const vp = ap.videoProgress;
                    const pct = vp?.progressPercent ?? (ap.isCompleted ? 100 : 0);
                    return (
                      <div key={ap.activityId} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${ap.isCompleted ? 'bg-emerald-500' : ap.status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                            <span className="font-bold text-slate-900 truncate">{ap.title}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {ap.type === 'video' ? `Video: Đã xem ${pct}%` : ap.type === 'quiz' ? `Trắc nghiệm: ${ap.score !== null ? `${ap.score}/10đ` : 'Chưa làm'}` : ap.type === 'assignment' ? `Bài tập: ${ap.score !== null ? `${ap.score}/10đ` : ap.submission ? 'Đã nộp (Chờ chấm)' : 'Chưa nộp'}` : ap.isCompleted ? 'Đã đọc xong' : 'Chưa hoàn thành'}
                            {ap.timeSpentSeconds > 0 ? ` • ${formatStudyTime(ap.timeSpentSeconds)}` : ''}
                            {ap.lastAccessedAt ? ` • ${ap.lastAccessedAt}` : ''}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {ap.type === 'quiz' && ap.quizResult && (
                            <button
                              type="button"
                              onClick={() => setQuizReviewModal({
                                student: selectedStudentRow.student,
                                activity: fullAct,
                                quizResult: ap.quizResult,
                                quizHistory: ap.quizHistory || [ap.quizResult],
                                questions: fullAct.quizQuestions || ap.quizQuestions || []
                              })}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] text-[10px] font-bold"
                            >
                              Xem đúng/sai
                            </button>
                          )}
                          {ap.type === 'assignment' && ap.submission && (
                            <button
                              type="button"
                              onClick={() => setAssignmentGradeModal({
                                student: selectedStudentRow.student,
                                activity: fullAct,
                                submission: ap.submission,
                                submissionHistory: ap.submissionHistory || []
                              })}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold"
                            >
                              {ap.submission.status === 'graded' ? 'Sửa điểm' : 'Chấm điểm'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRemoveStudent(selectedStudentRow.student.id, selectedStudentRow.student.name)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Gỡ học sinh khỏi lớp</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentRow(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: XEM CHI TIẾT ĐÚNG/SAI TRẮC NGHIỆM */}
      {quizReviewModal && (
        <QuizReviewDetailModal data={quizReviewModal} onClose={() => setQuizReviewModal(null)} />
      )}

      {/* MODAL 2: CHẤM ĐIỂM BÀI TẬP */}
      {assignmentGradeModal && (
        <AssignmentGradingInlineModal
          courseId={course.id}
          data={assignmentGradeModal}
          onClose={() => setAssignmentGradeModal(null)}
          onSuccess={() => {
            setAssignmentGradeModal(null);
            loadGradebook();
          }}
        />
      )}

      {/* MODAL 3: GHI DANH HỌC SINH VÀO LỚP (Chọn nhanh từ hệ thống hoặc nhập email) */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Ghi danh học sinh vào lớp</h3>
                <p className="text-xs text-slate-500 mt-0.5">{course.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setEnrollTab('pick')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold ${enrollTab === 'pick' ? 'bg-white text-[#0374b5] shadow-2xs' : 'text-slate-600'}`}
              >
                Tài khoản có sẵn ({systemUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setEnrollTab('manual')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold ${enrollTab === 'manual' ? 'bg-white text-[#0374b5] shadow-2xs' : 'text-slate-600'}`}
              >
                Nhập 1 học sinh
              </button>
              <button
                type="button"
                onClick={() => setEnrollTab('bulk')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold ${enrollTab === 'bulk' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'}`}
              >
                Ghi danh cả lớp
              </button>
            </div>

            {enrollTab === 'bulk' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">Mỗi dòng: <code className="bg-slate-100 px-1 rounded">Họ tên, email@gmail.com, Lớp 6A1</code> (hoặc chỉ email)</span>
                  <label className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold cursor-pointer shrink-0">
                    📂 Chọn CSV
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) setBulkEnrollText(await f.text());
                      }}
                    />
                  </label>
                </div>
                <textarea
                  rows={6}
                  value={bulkEnrollText}
                  onChange={(e) => setBulkEnrollText(e.target.value)}
                  placeholder={"Nguyễn Minh An, minhan@gmail.com, Lớp 6A1\nTrần Gia Bảo, giabao@gmail.com, Lớp 6A1\nhocsinh3@gmail.com"}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl">
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isEnrolling || !bulkEnrollText.trim()}
                    onClick={async () => {
                      const lines = bulkEnrollText.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                      const parsed = lines.map(line => {
                        const parts = line.split(/[,;\t]+/).map(p => p.trim());
                        const emailPart = parts.find(p => p.includes('@'));
                        if (!emailPart) return null;
                        const otherParts = parts.filter(p => p !== emailPart);
                        return {
                          name: otherParts[0] || emailPart.split('@')[0],
                          email: emailPart.toLowerCase(),
                          className: otherParts[1] || 'Lớp 6A',
                          code: otherParts[2] || ''
                        };
                      }).filter(Boolean) as Array<{ name: string; email: string; className: string; code: string }>;

                      if (parsed.length === 0) {
                        alert('Không tìm thấy địa chỉ email hợp lệ nào trong danh sách.');
                        return;
                      }
                      try {
                        setIsEnrolling(true);
                        const res = await api.courses.enrollBulk(course.id, parsed);
                        alert(`✅ Đã ghi danh thành công ${res.addedCount} học sinh${res.skippedCount > 0 ? ` (bỏ qua ${res.skippedCount} dòng trùng/không hợp lệ)` : ''}!`);
                        setBulkEnrollText('');
                        setIsEnrollModalOpen(false);
                        loadGradebook();
                      } catch (err: any) {
                        alert(err?.message || 'Lỗi khi ghi danh hàng loạt.');
                      } finally {
                        setIsEnrolling(false);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {isEnrolling ? 'Đang ghi danh...' : 'Ghi danh hàng loạt'}
                  </button>
                </div>
              </div>
            ) : enrollTab === 'pick' ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {systemUsers.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    Chưa có tài khoản học sinh mới nào chưa ghi danh. Bạn có thể chuyển sang tab <strong>"Nhập Email học sinh mới"</strong>.
                  </p>
                ) : (
                  systemUsers.map(u => (
                    <div key={u.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{u.email} • {u.className || 'Học viên'}</p>
                      </div>
                      <button
                        type="button"
                        disabled={isEnrolling}
                        onClick={() => handleQuickEnrollUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold shrink-0"
                      >
                        + Thêm
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleEnrollManual} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên học sinh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Minh Quân"
                    value={enrollForm.name}
                    onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Google của học sinh *</label>
                  <input
                    type="email"
                    required
                    placeholder="Nhập đúng Gmail học sinh sẽ dùng để đăng nhập..."
                    value={enrollForm.email}
                    onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Khi học sinh đăng nhập Google bằng Gmail này, hệ thống sẽ tự động khớp và đồng bộ mọi tiến độ học tập.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã học sinh</label>
                    <input
                      type="text"
                      placeholder="VD: HS601"
                      value={enrollForm.code}
                      onChange={(e) => setEnrollForm({ ...enrollForm, code: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lớp học</label>
                    <input
                      type="text"
                      placeholder="Lớp 6A"
                      value={enrollForm.className}
                      onChange={(e) => setEnrollForm({ ...enrollForm, className: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isEnrolling}
                    className="px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {isEnrolling ? 'Đang lưu...' : 'Ghi danh ngay'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Component con: Modal xem chi tiết đúng/sai trắc nghiệm (có chọn xem đầy đủ từng lần làm bài trong lịch sử)
const QuizReviewDetailModal: React.FC<{
  data: { student: any; activity: any; quizResult: any; quizHistory?: any[]; questions: QuizQuestion[] };
  onClose: () => void;
}> = ({ data, onClose }) => {
  const { student, activity, quizResult: defaultResult, quizHistory, questions } = data;
  const attemptsList = Array.isArray(quizHistory) && quizHistory.length > 0 ? quizHistory : [defaultResult];
  const [selectedAttemptIdx, setSelectedAttemptIdx] = useState<number>(attemptsList.length - 1);
  const quizResult = attemptsList[selectedAttemptIdx] || defaultResult;
  const bestScore = attemptsList.reduce((m, a) => Math.max(m, Number(a?.score) || 0), 0);
  const correctCount = questions.length > 0
    ? questions.filter(q => quizResult.answers?.[q.id] === q.correctAnswer).length
    : (quizResult.correctCount || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
              Chi tiết bài làm trắc nghiệm {attemptsList.length > 1 ? `(${attemptsList.length} lần làm)` : ''}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">{activity.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Học sinh: <strong>{student?.name}</strong> • {student?.className || 'Học viên'}
              {attemptsList.length > 1 && <span className="ml-2 text-emerald-700 font-bold">• Điểm cao nhất: {bestScore}/10</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bộ chuyển đổi lịch sử các lần làm bài nếu học sinh làm nhiều hơn 1 lần */}
        {attemptsList.length > 1 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0374b5]" />
              <span>Chọn lần làm bài để đối chiếu chi tiết:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {attemptsList.map((att, idx) => {
                const isBest = Number(att.score) === bestScore;
                const isSel = idx === selectedAttemptIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAttemptIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-[#0374b5] text-white border-[#0374b5] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#0374b5]'
                    }`}
                  >
                    <span>Lần {att.attempt || idx + 1}: {att.score}/10</span>
                    {isBest && <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${isSel ? 'bg-amber-300 text-slate-900' : 'bg-emerald-100 text-emerald-800'}`}>Cao nhất</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Điểm số</p>
            <p className="text-lg font-black text-[#0374b5] mt-0.5">{quizResult.score}/10đ</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Số câu đúng</p>
            <p className="text-sm font-black text-emerald-700 mt-1">
              {correctCount}/{questions.length || quizResult.totalQuestions || 0} câu
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Kết quả</p>
            <p className={`text-xs font-black mt-1.5 ${quizResult.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
              {quizResult.passed ? '✓ Đạt chuẩn' : '✗ Chưa đạt'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Thời gian làm</p>
            <p className="text-xs font-semibold text-slate-700 mt-1.5">
              {quizResult.durationSeconds ? formatStudyTime(quizResult.durationSeconds) : (quizResult.submittedAt || '—')}
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Quá trình trả lời từng câu hỏi:</h4>
          {questions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">Đề kiểm tra này chưa có danh sách câu hỏi chi tiết.</p>
          ) : (
            questions.map((q, qIdx) => {
              const studentAns = quizResult.answers?.[q.id];
              const isCorrect = studentAns === q.correctAnswer;
              return (
                <div
                  key={q.id || qIdx}
                  className={`p-4 rounded-2xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'} space-y-2`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-xs text-slate-800">Câu {qIdx + 1}: {q.question}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isStudentPick = studentAns === optIdx;
                      const isKey = q.correctAnswer === optIdx;
                      let style = 'bg-white border-slate-200 text-slate-700';
                      if (isKey) style = 'bg-emerald-100/80 border-emerald-400 text-emerald-900 font-bold';
                      else if (isStudentPick && !isCorrect) style = 'bg-rose-100/80 border-rose-400 text-rose-900 font-bold';
                      return (
                        <div key={optIdx} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${style}`}>
                          <span><strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {isStudentPick && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black text-white ${isCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                Học sinh chọn
                              </span>
                            )}
                            {isKey && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-700 text-white text-[9px] font-black">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && <p className="text-[11px] text-slate-500 italic pt-1">Giải thích: {q.explanation}</p>}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Component con: Chấm điểm bài nộp Assignment (kèm xem đầy đủ lịch sử các lần nộp trước)
const AssignmentGradingInlineModal: React.FC<{
  courseId: string;
  data: { student: any; activity: any; submission: any; submissionHistory?: any[] };
  onClose: () => void;
  onSuccess: () => void;
}> = ({ courseId, data, onClose, onSuccess }) => {
  const { student, activity, submission, submissionHistory = [] } = data;
  const maxScore = activity.maxScore || 10;
  const [grade, setGrade] = useState<string>(submission?.grade !== undefined ? String(submission.grade) : (submission?.previousGrade !== null && submission?.previousGrade !== undefined ? String(submission.previousGrade) : ''));
  const [feedback, setFeedback] = useState<string>(submission?.feedback || submission?.previousFeedback || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(grade);
    if (!Number.isFinite(num) || num < 0 || num > maxScore) {
      alert(`Vui lòng nhập điểm hợp lệ từ 0 đến ${maxScore}.`);
      return;
    }
    try {
      setSaving(true);
      await api.activities.gradeAssignment(courseId, activity.id, {
        studentId: student.id,
        grade: num,
        feedback: feedback.trim()
      });
      onSuccess();
    } catch (err: any) {
      alert(err?.message || 'Không thể lưu điểm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">
              Chấm điểm bài nộp thực hành
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">{activity.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Học sinh: <strong>{student.name}</strong> {student.code ? `• ${student.code}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nội dung bài học sinh đã nộp:</p>
          {submission?.fileName && (
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 gap-2">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">{submission.fileName}</span>
                {submission.fileSize && <span className="text-[10px] text-slate-400">({submission.fileSize})</span>}
              </div>
              {submission.fileUrl && (
                <a
                  href={resolveBackendUrl(submission.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3 h-3" /> Mở tệp
                </a>
              )}
            </div>
          )}
          {submission?.textSubmission && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {submission.textSubmission}
            </div>
          )}
          <p className="text-[10px] text-slate-400 pt-1">
            Thời gian nộp: {submission?.submittedAt || 'Mới nộp'}
            {submission?.version && submission.version > 1 ? ` • Phiên bản lần ${submission.version}` : ''}
          </p>
        </div>

        {/* Lịch sử các lần nộp trước (nếu học sinh có cập nhật/nộp lại) */}
        {submissionHistory.length > 0 && (
          <details className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 text-xs">
            <summary className="font-bold text-amber-900 cursor-pointer flex items-center gap-1.5 select-none">
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử {submissionHistory.length} lần nộp trước (bấm để xem)</span>
            </summary>
            <div className="mt-2.5 space-y-2 max-h-40 overflow-y-auto">
              {[...submissionHistory].reverse().map((oldSub: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200/70 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-slate-700">Lần {oldSub.version || submissionHistory.length - idx} • {oldSub.submittedAt || '—'}</span>
                    {oldSub.grade !== undefined && oldSub.grade !== null && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-black">Điểm cũ: {oldSub.grade}/{maxScore}</span>
                    )}
                  </div>
                  {oldSub.fileName && (
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate">📎 {oldSub.fileName}</span>
                      {oldSub.fileUrl && (
                        <a href={resolveBackendUrl(oldSub.fileUrl)} target="_blank" rel="noreferrer" className="text-[#0374b5] font-bold hover:underline shrink-0 ml-2">
                          Mở tệp cũ
                        </a>
                      )}
                    </div>
                  )}
                  {oldSub.textSubmission && (
                    <pre className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-700 whitespace-pre-wrap max-h-24 overflow-y-auto">{oldSub.textSubmission}</pre>
                  )}
                  {oldSub.feedback && <p className="text-[10px] text-emerald-700 italic">Nhận xét cũ: "{oldSub.feedback}"</p>}
                </div>
              ))}
            </div>
          </details>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số (Thang 0 - {maxScore}) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={maxScore}
              required
              placeholder={`Nhập điểm (0 - ${maxScore})`}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nhận xét / Góp ý của giáo viên</label>
            <textarea
              rows={3}
              placeholder="Nhập lời phê, đánh giá chi tiết bài làm của học sinh..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs">
              {saving ? 'Đang lưu...' : 'Lưu điểm & Nhận xét'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
