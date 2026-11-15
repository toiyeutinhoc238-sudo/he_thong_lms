import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Course, Activity, QuizQuestion, User } from '../types';
import api from '../services/api';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
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
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';

interface CourseGradebookTrackerProps {
  course: Course;
  canManage: boolean;
  currentUser: User | null;
  onNavigateToModules: () => void;
}

export const CourseGradebookTracker: React.FC<CourseGradebookTrackerProps> = ({
  course,
  canManage,
  currentUser,
  onNavigateToModules
}) => {
  const [gradebook, setGradebook] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  // Modals
  const [quizReviewModal, setQuizReviewModal] = useState<{
    student: any;
    activity: any;
    quizResult: any;
    questions: QuizQuestion[];
  } | null>(null);

  const [assignmentGradeModal, setAssignmentGradeModal] = useState<{
    student: any;
    activity: any;
    submission: any;
  } | null>(null);

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [enrollForm, setEnrollForm] = useState({
    name: '',
    email: '',
    code: '',
    className: 'Lớp 6A'
  });
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);

  // Load Gradebook data from API
  const loadGradebook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.courses.getGradebook(course.id);
      if (res && res.students) {
        setGradebook(res);
      } else {
        // Fallback locally
        setGradebook({
          courseId: course.id,
          courseName: course.name,
          activities: course.modules?.flatMap(m => m.activities || []) || [],
          students: (course.enrolledStudents || []).map(s => ({
            student: s,
            overallProgress: 0,
            completedCount: 0,
            totalActivities: 0,
            averageScore: null,
            activities: []
          }))
        });
      }
    } catch (e: any) {
      console.warn('Lỗi tải sổ điểm từ máy chủ, nạp dữ liệu cục bộ:', e);
      setGradebook({
        courseId: course.id,
        courseName: course.name,
        activities: course.modules?.flatMap(m => m.activities || []) || [],
        students: (course.enrolledStudents || []).map(s => ({
          student: s,
          overallProgress: 0,
          completedCount: 0,
          totalActivities: 0,
          averageScore: null,
          activities: []
        }))
      });
    } finally {
      setLoading(false);
    }
  }, [course.id, course.name, course.modules, course.enrolledStudents]);

  useEffect(() => {
    loadGradebook();
  }, [loadGradebook]);

  // Format giây thành mm:ss
  const formatTime = (secs?: number) => {
    if (!secs || !Number.isFinite(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!gradebook?.students) return [];
    return gradebook.students.filter((stRow: any) => {
      const s = stRow.student || {};
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.className || '').toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (statusFilter === 'completed') return stRow.overallProgress === 100;
      if (statusFilter === 'in_progress') return stRow.overallProgress > 0 && stRow.overallProgress < 100;
      if (statusFilter === 'not_started') return stRow.overallProgress === 0;

      return true;
    });
  }, [gradebook?.students, searchQuery, statusFilter]);

  // Thống kê tổng hợp cả lớp
  const stats = useMemo(() => {
    const list = gradebook?.students || [];
    const totalStudents = list.length;
    if (totalStudents === 0) {
      return { totalStudents: 0, avgProgress: 0, pendingGrading: 0, classAvgScore: null };
    }

    const totalProgress = list.reduce((acc: number, curr: any) => acc + (curr.overallProgress || 0), 0);
    const avgProgress = Math.round(totalProgress / totalStudents);

    let pendingGrading = 0;
    let sumScore = 0;
    let scoreCount = 0;

    list.forEach((st: any) => {
      (st.activities || []).forEach((act: any) => {
        if (act.type === 'assignment' && act.submission && act.submission.status !== 'graded') {
          pendingGrading++;
        }
      });
      if (st.averageScore !== null && Number.isFinite(st.averageScore)) {
        sumScore += st.averageScore;
        scoreCount++;
      }
    });

    const classAvgScore = scoreCount > 0 ? Number((sumScore / scoreCount).toFixed(1)) : null;

    return {
      totalStudents,
      avgProgress,
      pendingGrading,
      classAvgScore
    };
  }, [gradebook]);

  // Xử lý ghi danh học sinh mới
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.name.trim() || !enrollForm.email.trim()) {
      alert('Vui lòng nhập họ tên và email học sinh.');
      return;
    }

    try {
      setIsEnrolling(true);
      await api.courses.enrollStudent(course.id, {
        name: enrollForm.name.trim(),
        email: enrollForm.email.trim(),
        code: enrollForm.code.trim() || `HS${Math.floor(100 + Math.random() * 900)}`,
        className: enrollForm.className.trim() || 'Lớp 6A'
      });
      setIsEnrollModalOpen(false);
      setEnrollForm({ name: '', email: '', code: '', className: 'Lớp 6A' });
      await loadGradebook();
      alert('Đã ghi danh học viên thành công vào lớp!');
    } catch (err: any) {
      alert(err?.message || 'Không thể ghi danh học viên.');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Xuất file CSV bảng điểm
  const handleExportCSV = () => {
    if (!gradebook || !gradebook.students || gradebook.students.length === 0) {
      alert('Chưa có dữ liệu học viên để xuất file.');
      return;
    }

    const activitiesList = gradebook.activities || [];
    let csv = '\uFEFF'; // BOM UTF-8 để Excel hiển thị tiếng Việt có dấu
    csv += 'STT,Họ và tên,Mã học sinh,Lớp,Email,Tiến độ hoàn thành (%),Điểm trung bình (GPA)';

    activitiesList.forEach((a: any) => {
      const typeLabel = a.type === 'video' ? 'Video' : a.type === 'quiz' ? 'Trắc nghiệm' : a.type === 'assignment' ? 'Bài tập' : 'Tài liệu';
      csv += `,"[${typeLabel}] ${a.title.replace(/"/g, '""')}"`;
    });
    csv += '\n';

    gradebook.students.forEach((row: any, idx: number) => {
      const s = row.student || {};
      const avg = row.averageScore !== null ? row.averageScore : '-';
      csv += `${idx + 1},"${(s.name || '').replace(/"/g, '""')}","${s.code || ''}","${s.className || ''}","${s.email || ''}",${row.overallProgress || 0},${avg}`;

      const recByAct = new Map((row.activities || []).map((a: any) => [a.activityId, a]));
      activitiesList.forEach((a: any) => {
        const actProgress: any = recByAct.get(a.id);
        if (!actProgress) {
          csv += ',"-"';
        } else if (actProgress.type === 'video') {
          const vp = actProgress.videoProgress;
          const pct = vp?.progressPercent ?? (actProgress.isCompleted ? 100 : 0);
          csv += `,"Đã xem ${pct}%"`;
        } else if (actProgress.type === 'quiz') {
          const score = actProgress.score !== null ? `${actProgress.score}/${actProgress.maxScore || 10}` : 'Chưa làm';
          csv += `,"${score}"`;
        } else if (actProgress.type === 'assignment') {
          const score = actProgress.score !== null ? `${actProgress.score}/${actProgress.maxScore || 10}` : (actProgress.submission ? 'Đã nộp (Chờ chấm)' : 'Chưa nộp');
          csv += `,"${score}"`;
        } else {
          csv += `,"${actProgress.isCompleted ? 'Đã hoàn thành' : 'Chưa'}"`;
        }
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_diem_${course.code || 'LMS'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activities = gradebook?.activities || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {canManage ? 'Sổ điểm & Theo dõi tiến độ học sinh' : 'Sổ điểm & Tiến độ học tập cá nhân'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0374b5]/10 text-[#0374b5] text-xs font-bold">
              {course.code || '6AIAB01'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canManage 
              ? 'Giám sát chi tiết tỷ lệ xem video (%), kết quả trắc nghiệm đúng/sai và chấm điểm bài tập của học sinh'
              : 'Theo dõi điểm số chi tiết, tỷ lệ xem video bài giảng và nhận xét đánh giá từ giáo viên'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadGradebook}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          {canManage && (
            <>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất file CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold transition-all shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Thêm học viên vào lớp</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Thẻ KPI Thống kê (Dành cho Giáo viên / Quản trị viên) */}
      {canManage && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0374b5] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sĩ số lớp học</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.totalStudents} học viên</h3>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiến độ cả lớp</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.avgProgress}%</h3>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bài chờ chấm điểm</p>
              <h3 className="text-xl font-black text-amber-600 mt-0.5">{stats.pendingGrading} bài</h3>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm TB cả lớp</p>
              <h3 className="text-xl font-black text-emerald-600 mt-0.5">
                {stats.classAvgScore !== null ? `${stats.classAvgScore}/10` : 'Chưa có'}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo hướng dẫn nếu chưa có học liệu nào được tạo */}
      {activities.length === 0 && (
        <div className="p-6 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Các bài học hiện tại chưa có hoạt động học liệu
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Quản trị viên / Giáo viên hãy chuyển sang tab <strong>"Nội dung học tập"</strong> để bấm <strong>"+ Thêm bài học"</strong> (Video bài giảng, Tài liệu đọc, Bài tập thực hành, Bài kiểm tra trắc nghiệm). Khi học sinh học tập, hệ thống sẽ tự động cập nhật tiến độ, tỷ lệ xem video và điểm số tại đây.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToModules}
            className="px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold rounded-xl shadow-xs transition-all whitespace-nowrap flex-shrink-0"
          >
            Đi đến Nội dung học tập
          </button>
        </div>
      )}

      {/* Thanh Tìm kiếm & Lọc học viên */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã HS, email, lớp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0374b5] text-slate-700 font-medium shadow-2xs"
          >
            <option value="all">Tất cả tiến độ học tập</option>
            <option value="completed">Đã hoàn thành 100%</option>
            <option value="in_progress">Đang tham gia học tập</option>
            <option value="not_started">Chưa bắt đầu học (0%)</option>
          </select>
        </div>
      </div>

      {/* BẢNG SỔ ĐIỂM & MA TRẬN TIẾN ĐỘ HỌC TẬP TOÀN KHÓA */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto max-h-[650px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 w-12 text-center border-r border-slate-200 bg-slate-50">STT</th>
                <th className="py-3 px-4 min-w-[200px] border-r border-slate-200 bg-slate-50">Học viên</th>
                <th className="py-3 px-4 min-w-[150px] border-r border-slate-200 bg-slate-50">Tiến độ chung</th>
                <th className="py-3 px-3 w-24 text-center border-r border-slate-200 bg-slate-50">Điểm TB (GPA)</th>
                
                {/* Các cột tương ứng từng học liệu trong khóa */}
                {activities.map((act: any, idx: number) => {
                  return (
                    <th 
                      key={act.id} 
                      className="py-2.5 px-3.5 min-w-[170px] border-r border-slate-200 bg-slate-50 last:border-r-0"
                    >
                      <div className="flex items-center gap-1.5 text-slate-800">
                        {act.type === 'video' && <Play className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />}
                        {act.type === 'quiz' && <CheckSquare className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        {act.type === 'assignment' && <Award className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                        {act.type === 'document' && <FileText className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                        <span className="truncate font-bold" title={act.title}>
                          {act.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center justify-between">
                        <span>
                          {act.type === 'video' ? 'Video' : act.type === 'quiz' ? 'Trắc nghiệm' : act.type === 'assignment' ? 'Bài tập' : 'Tài liệu'}
                        </span>
                        <span>Thang {act.maxScore || 10}đ</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4 + activities.length} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Không tìm thấy dữ liệu học viên phù hợp.</p>
                    <p className="text-xs mt-1">Hãy bấm "+ Thêm học viên vào lớp" hoặc điều chỉnh bộ lọc tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stRow: any, stIdx: number) => {
                  const s = stRow.student || {};
                  const actMap = new Map<string, any>((stRow.activities || []).map((a: any) => [a.activityId, a]));

                  return (
                    <tr key={s.id || stIdx} className="hover:bg-slate-50/80 transition-colors">
                      {/* STT */}
                      <td className="py-3 px-3 text-center text-slate-400 border-r border-slate-100 font-mono">
                        {stIdx + 1}
                      </td>

                      {/* Thông tin học viên */}
                      <td className="py-3 px-4 border-r border-slate-100">
                        <div className="flex items-center gap-2.5">
                          {s.avatar ? (
                            <img 
                              src={s.avatar} 
                              alt={s.name} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0374b5] to-sky-400 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                              {(s.name || 'H').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">
                              {s.name || 'Học sinh'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">
                              {s.code ? `${s.code} • ` : ''}{s.className || 'Lớp 6A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tiến độ chung */}
                      <td className="py-3 px-4 border-r border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700">
                              {stRow.overallProgress || 0}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {stRow.completedCount || 0}/{stRow.totalActivities || activities.length} bài
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                (stRow.overallProgress || 0) === 100 
                                  ? 'bg-emerald-500' 
                                  : 'bg-[#0374b5]'
                              }`}
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

                      {/* Từng hoạt động học liệu */}
                      {activities.map((act: any) => {
                        const actProg: any = actMap.get(act.id);
                        if (!actProg) {
                          return (
                            <td key={act.id} className="py-3 px-3 text-center text-slate-300 border-r border-slate-100 last:border-r-0">
                              -
                            </td>
                          );
                        }

                        // 1. Dạng VIDEO BÀI GIẢNG: Theo dõi % và thời lượng đã xem
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
                                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {vp?.watchedSeconds ? `${formatTime(vp.watchedSeconds)} xem` : isDone ? 'Hoàn thành' : 'Đang xem'}
                                  </p>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-medium">
                                  Chưa xem (0%)
                                </span>
                              )}
                            </td>
                          );
                        }

                        // 2. Dạng TRẮC NGHIỆM: Xem điểm, số câu đúng/sai & chi tiết bài làm
                        if (act.type === 'quiz') {
                          const qr = actProg.quizResult;
                          const hasTaken = !!qr || actProg.score !== null;
                          const score = actProg.score ?? qr?.score;
                          const isPassed = qr?.passed ?? (score !== undefined && score >= 5);

                          return (
                            <td key={act.id} className="py-2.5 px-3 border-r border-slate-100 last:border-r-0">
                              {hasTaken ? (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`font-mono font-black text-xs ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {score}/10đ
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                      {isPassed ? 'Đạt' : 'Chưa đạt'}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setQuizReviewModal({
                                      student: s,
                                      activity: act,
                                      quizResult: qr || { score, maxScore: 10, passed: isPassed, answers: {} },
                                      questions: act.quizQuestions || []
                                    })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Xem đúng/sai</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-medium">
                                  Chưa làm bài
                                </span>
                              )}
                            </td>
                          );
                        }

                        // 3. Dạng BÀI TẬP: Nộp file / tự luận & Chấm điểm
                        if (act.type === 'assignment') {
                          const sub = actProg.submission;
                          const isSubmitted = !!sub;
                          const isGraded = sub?.status === 'graded' || actProg.score !== null;
                          const score = actProg.score ?? sub?.grade;

                          return (
                            <td key={act.id} className="py-2.5 px-3 border-r border-slate-100 last:border-r-0">
                              {isSubmitted ? (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    {isGraded ? (
                                      <span className="font-mono font-black text-xs text-indigo-600">
                                        {score}/10đ
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                                        Chờ chấm
                                      </span>
                                    )}
                                  </div>

                                  {canManage && (
                                    <button
                                      type="button"
                                      onClick={() => setAssignmentGradeModal({
                                        student: s,
                                        activity: act,
                                        submission: sub
                                      })}
                                      className="w-full mt-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>{isGraded ? 'Sửa điểm' : 'Chấm điểm'}</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-medium">
                                  Chưa nộp
                                </span>
                              )}
                            </td>
                          );
                        }

                        // 4. Dạng TÀI LIỆU HOẶC DIỄN ĐÀN
                        return (
                          <td key={act.id} className="py-3 px-3 text-center border-r border-slate-100 last:border-r-0">
                            {actProg.isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <Check className="w-3 h-3" />
                                <span>Đã đọc</span>
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">Chưa đọc</span>
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

      {/* MODAL 1: XEM CHI TIẾT ĐÚNG/SAI BÀI THI TRẮC NGHIỆM */}
      {quizReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  Chi tiết kết quả bài trắc nghiệm
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {quizReviewModal.activity.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Học sinh: <strong>{quizReviewModal.student.name}</strong> • Lớp: {quizReviewModal.student.className || 'Lớp 6A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuizReviewModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thẻ tóm tắt kết quả */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Điểm số</p>
                <p className="text-lg font-black text-[#0374b5] mt-0.5">
                  {quizReviewModal.quizResult.score}/10đ
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Kết quả</p>
                <p className={`text-xs font-black mt-1.5 ${quizReviewModal.quizResult.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {quizReviewModal.quizResult.passed ? '✓ Đạt yêu cầu' : '✗ Chưa đạt'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Thời gian nộp</p>
                <p className="text-xs font-medium text-slate-600 mt-1.5">
                  {quizReviewModal.quizResult.submittedAt || 'Mới nộp'}
                </p>
              </div>
            </div>

            {/* Chi tiết từng câu hỏi đúng/sai */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Quá trình trả lời từng câu hỏi:
              </h4>

              {quizReviewModal.questions.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Đề kiểm tra này chưa cấu hình danh sách câu hỏi chi tiết.
                </p>
              ) : (
                quizReviewModal.questions.map((q, qIdx) => {
                  const studentAns = quizReviewModal.quizResult.answers?.[q.id];
                  const isCorrect = studentAns === q.correctAnswer;
                  const hasAnswered = studentAns !== undefined;

                  return (
                    <div 
                      key={q.id || qIdx}
                      className={`p-4 rounded-2xl border ${
                        isCorrect 
                          ? 'border-emerald-200 bg-emerald-50/40' 
                          : 'border-rose-200 bg-rose-50/40'
                      } space-y-2.5`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-xs text-slate-800">
                          Câu {qIdx + 1}: {q.question}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 flex-shrink-0 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isCorrect ? '✓ Đúng' : '✗ Sai'}
                        </span>
                      </div>

                      {/* Các lựa chọn A, B, C, D */}
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isStudentPick = studentAns === optIdx;
                          const isKey = q.correctAnswer === optIdx;

                          let style = 'bg-white border-slate-200 text-slate-700';
                          if (isKey) {
                            style = 'bg-emerald-100/80 border-emerald-400 text-emerald-900 font-bold';
                          } else if (isStudentPick && !isCorrect) {
                            style = 'bg-rose-100/80 border-rose-400 text-rose-900 font-bold';
                          }

                          return (
                            <div 
                              key={optIdx} 
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${style}`}
                            >
                              <span>
                                <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                              </span>
                              <div className="flex items-center gap-1">
                                {isStudentPick && (
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                  }`}>
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

                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 italic pt-1">
                          Giải thích: {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setQuizReviewModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHẤM ĐIỂM & NHẬN XÉT BÀI TẬP THỰC HÀNH */}
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

      {/* MODAL 3: GHI DANH HỌC VIÊN MỚI VÀO LỚP */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Ghi danh học viên vào lớp
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khóa học: {course.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Tuấn Anh"
                  value={enrollForm.name}
                  onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: anh.hoang6a@lms2.edu.vn"
                  value={enrollForm.email}
                  onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã học sinh
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: HS605"
                    value={enrollForm.code}
                    onChange={(e) => setEnrollForm({ ...enrollForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp học
                  </label>
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
          </div>
        </div>
      )}
    </div>
  );
};

// Component con: Chấm điểm bài nộp Assignment
const AssignmentGradingInlineModal: React.FC<{
  courseId: string;
  data: { student: any; activity: any; submission: any };
  onClose: () => void;
  onSuccess: () => void;
}> = ({ courseId, data, onClose, onSuccess }) => {
  const { student, activity, submission } = data;
  const maxScore = activity.maxScore || 10;
  const [grade, setGrade] = useState<string>(submission?.grade !== undefined ? String(submission.grade) : '');
  const [feedback, setFeedback] = useState<string>(submission?.feedback || '');
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
      alert('Đã chấm điểm và lưu nhận xét thành công!');
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
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {activity.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Học sinh: <strong>{student.name}</strong> • Mã: {student.code || 'HS'}
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

        {/* Nội dung bài nộp của học sinh */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Nội dung bài học sinh đã nộp:
          </p>
          {submission?.fileName ? (
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">{submission.fileName}</span>
                {submission.fileSize && <span className="text-[10px] text-slate-400">({submission.fileSize})</span>}
              </div>
              {submission.fileUrl && (
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Mở xem tệp</span>
                </a>
              )}
            </div>
          ) : null}

          {submission?.textSubmission ? (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {submission.textSubmission}
            </div>
          ) : null}

          <p className="text-[10px] text-slate-400 pt-1">
            Thời gian nộp: {submission?.submittedAt || 'Mới nộp'}
          </p>
        </div>

        {/* Form chấm điểm */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Điểm số (Thang 0 - {maxScore}) <span className="text-rose-500">*</span>
            </label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nhận xét / Góp ý của giáo viên
            </label>
            <textarea
              rows={3}
              placeholder="Nhập lời phê, đánh giá chi tiết bài làm của học sinh..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {saving ? 'Đang lưu...' : 'Lưu điểm & Nhận xét'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
