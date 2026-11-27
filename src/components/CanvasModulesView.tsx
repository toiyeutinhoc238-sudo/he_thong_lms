import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Link2, 
  Play, 
  Upload, 
  HelpCircle, 
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Layers,
  ExternalLink,
  Video,
  UploadCloud,
  Paperclip,
  Loader2,
  BarChart3,
  ArrowLeft,
  Share2,
  FolderInput,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Shuffle,
  Target,
  UserCheck
} from 'lucide-react';
import { CourseModule, Activity, QuizQuestion, VideoCheckpoint } from '../types';
import { VideoCheckpointEditor } from './VideoCheckpointEditor';
import { ShareExportModal } from './ShareExportModal';
import { ModuleActivityRow } from './ModuleActivityRow';
import { ModulePreviewModals } from './ModulePreviewModals';
import { parseBulkQuizText } from '../utils/aikenParser';

function formatDueDateFromIso(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface CanvasModulesViewProps {
  onSelectActivity: (activityId: string) => void;
  onOpenGradebook?: () => void;
}

export const CanvasModulesView: React.FC<CanvasModulesViewProps> = ({ onSelectActivity, onOpenGradebook }) => {
  const { 
    activeCourse, 
    activeModuleId,
    setActiveModuleId,
    setCurrentView,
    addCourseModule, 
    updateCourseModule, 
    deleteCourseModule,
    reorderCourseModules,
    reorderModuleActivities,
    addCourseActivity, 
    updateCourseActivity, 
    deleteCourseActivity,
    currentUser,
    activeRole,
    uploadCourseFile,
    importCoursePackage,
    isEmbedMode
  } = useApp();

  const [isUploadingActFile, setIsUploadingActFile] = useState(false);
  const [uploadedActFileName, setUploadedActFileName] = useState('');
  const [shareTarget, setShareTarget] = useState<{ module?: CourseModule | null; activity?: Activity | null } | null>(null);
  const [isImportingPkg, setIsImportingPkg] = useState(false);

  // Phân quyền: Học viên tuyệt đối KHÔNG được thêm/sửa/xóa học liệu hoặc mô-đun
  const canManage = Boolean(
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' ||
    currentUser?.role === 'admin' || 
    currentUser?.role === 'lecturer' || 
    activeRole === 'admin' || 
    activeRole === 'lecturer'
  );

  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Popup xem chi tiết Mục tiêu bài học & Popup xem chi tiết từng mục hoạt động
  const [objectivesModalModule, setObjectivesModalModule] = useState<CourseModule | null>(null);
  const [previewActivity, setPreviewActivity] = useState<{ moduleTitle: string; activity: Activity } | null>(null);

  // Modal Thêm Mô-đun
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [modulePrereq, setModulePrereq] = useState('');
  const [moduleObjectives, setModuleObjectives] = useState('');
  const [moduleOwner, setModuleOwner] = useState('');

  // Modal Sửa Mô-đun
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editModTitle, setEditModTitle] = useState('');
  const [editModPrereq, setEditModPrereq] = useState('');
  const [editModObjectives, setEditModObjectives] = useState('');
  const [editModOwner, setEditModOwner] = useState('');

  // Modal Thêm Hoạt Động / Học Liệu
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [actType, setActType] = useState<Activity['type']>('video');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actVideoUrl, setActVideoUrl] = useState('');
  const [actFileUrl, setActFileUrl] = useState('');
  const [actDueDate, setActDueDate] = useState('');
  const [actDueDateIso, setActDueDateIso] = useState('');
  const [actMaxScore, setActMaxScore] = useState(10);
  const [actTimeLimit, setActTimeLimit] = useState(15);
  const [actPassScore, setActPassScore] = useState(5);
  const [actShuffleQuestions, setActShuffleQuestions] = useState(false);
  const [actMaxAttempts, setActMaxAttempts] = useState(0);
  const [isBulkQuizOpen, setIsBulkQuizOpen] = useState(false);
  const [bulkQuizText, setBulkQuizText] = useState('');
  const [isEditBulkQuizOpen, setIsEditBulkQuizOpen] = useState(false);
  const [editBulkQuizText, setEditBulkQuizText] = useState('');
  const [actVideoCheckpoints, setActVideoCheckpoints] = useState<VideoCheckpoint[]>([]);
  const [actPreventVideoSkip, setActPreventVideoSkip] = useState(true);
  const [actPrompt, setActPrompt] = useState('');
  const [actStarterCode, setActStarterCode] = useState('');
  const [actProgLang, setActProgLang] = useState('Python');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      question: 'Trí tuệ nhân tạo (AI) học hỏi từ yếu tố nào để đưa ra dự đoán?',
      options: ['Dữ liệu huấn luyện', 'Bộ nhớ USB', 'Màn hình máy tính', 'Bàn phím'],
      correctAnswer: 0
    }
  ]);

  // Modal Sửa Hoạt Động
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Dữ liệu thống kê tiến độ lớp trực tiếp trên từng mô-đun & hoạt động (chỉ cho Giáo viên/Admin)
  const [activityStatsMap, setActivityStatsMap] = useState<Record<string, any>>({});
  const [moduleStatsMap, setModuleStatsMap] = useState<Record<string, any>>({});
  const [classStudentCount, setClassStudentCount] = useState<number>(0);

  useEffect(() => {
    if (!canManage || !activeCourse?.id) return;
    let cancelled = false;
    api.courses.getGradebook(activeCourse.id)
      .then(res => {
        if (cancelled || !res) return;
        const aMap: Record<string, any> = {};
        (res.activities || []).forEach((a: any) => { if (a.stats) aMap[a.id] = a.stats; });
        const mMap: Record<string, any> = {};
        (res.modules || []).forEach((m: any) => { mMap[m.id] = m; });
        setActivityStatsMap(aMap);
        setModuleStatsMap(mMap);
        setClassStudentCount(res.summary?.totalStudents || (res.students || []).length || 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canManage, activeCourse?.id, activeCourse?.modules?.length]);

  if (!activeCourse) {
    return (
      <div className="p-8 text-center text-slate-500">
        Vui lòng chọn một khóa học để xem nội dung học tập.
      </div>
    );
  }

  const modules = activeCourse.modules || [];
  const focusedModule = activeModuleId
    ? (modules.find(m => m.id === activeModuleId)
      || modules.find((m, idx) => `module-lesson-${idx + 1}` === activeModuleId || String(m.order) === activeModuleId)
      || null)
    : null;
  const displayedModules = focusedModule ? [focusedModule] : modules;

  const toggleModule = (id: string) => {
    setCollapsedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const nextState = !allCollapsed;
    setAllCollapsed(nextState);
    const newCollapsedMap: Record<string, boolean> = {};
    modules.forEach(m => {
      newCollapsedMap[m.id] = nextState;
    });
    setCollapsedModules(newCollapsedMap);
  };

  // 1. Submit Tạo Mô-đun
  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    addCourseModule(activeCourse.id, moduleTitle.trim(), modulePrereq.trim(), {
      learningObjectives: moduleObjectives.trim(),
      ownerName: moduleOwner.trim()
    });
    setModuleTitle('');
    setModulePrereq('');
    setModuleObjectives('');
    setModuleOwner('');
    setIsAddModuleOpen(false);
  };

  // 2. Submit Sửa Mô-đun
  const handleSaveEditModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !editModTitle.trim()) return;

    updateCourseModule(activeCourse.id, editingModule.id, {
      title: editModTitle.trim(),
      description: editModPrereq.trim(),
      learningObjectives: editModObjectives.trim(),
      ownerName: editModOwner.trim()
    });
    setEditingModule(null);
  };

  // 3. Submit Thêm Hoạt Động / Học Liệu
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim() || !targetModuleId) return;

    const newActivityData: Partial<Activity> = {
      title: actTitle.trim(),
      type: actType,
      description: actDesc.trim() || (
        actType === 'video' ? 'Video bài giảng' : 
        actType === 'document' ? 'Xem trang' : 
        actType === 'assignment' ? (actProgLang ? `Bài tập lập trình ${actProgLang}` : 'Bài tập thực hành') : 
        'Kiểm tra trắc nghiệm'
      ),
      videoUrl: actVideoUrl.trim(),
      videoCheckpoints: actType === 'video'
        ? [...actVideoCheckpoints].sort((a, b) => (a.timeSeconds || 0) - (b.timeSeconds || 0))
        : undefined,
      preventVideoSkip: actType === 'video' ? actPreventVideoSkip : undefined,
      fileUrl: actFileUrl.trim(),
      dueDate: actDueDate.trim() || (actDueDateIso ? formatDueDateFromIso(actDueDateIso) : ''),
      dueDateIso: actDueDateIso || undefined,
      maxScore: Number(actMaxScore) || 10,
      timeLimitMinutes: actType === 'quiz' ? Math.max(1, Number(actTimeLimit) || 15) : undefined,
      passScore: actType === 'quiz' ? Math.min(10, Math.max(0, Number(actPassScore) || 5)) : undefined,
      shuffleQuestions: actType === 'quiz' ? actShuffleQuestions : undefined,
      maxAttempts: actType === 'quiz' ? Math.max(0, Number(actMaxAttempts) || 0) : undefined,
      assignmentPrompt: actPrompt.trim(),
      starterCode: actStarterCode.trim() || undefined,
      programmingLanguage: actType === 'assignment' ? actProgLang : undefined,
      quizQuestions: actType === 'quiz' ? quizQuestions : undefined,
      isRequired: true,
      durationMinutes: actType === 'quiz' ? Math.max(1, Number(actTimeLimit) || 15) : 15
    };

    addCourseActivity(activeCourse.id, targetModuleId, newActivityData);

    // Reset Form
    setActTitle('');
    setActDesc('');
    setActVideoUrl('');
    setActVideoCheckpoints([]);
    setActPreventVideoSkip(true);
    setActTimeLimit(15);
    setActPassScore(5);
    setActShuffleQuestions(false);
    setActMaxAttempts(0);
    setIsBulkQuizOpen(false);
    setBulkQuizText('');
    setActFileUrl('');
    setActDueDate('');
    setActDueDateIso('');
    setActPrompt('');
    setActStarterCode('');
    setIsAddActivityOpen(false);
  };

  // 4. Submit Sửa Hoạt Động
  const handleSaveEditActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    updateCourseActivity(activeCourse.id, editingActivity.id, {
      title: editingActivity.title,
      description: editingActivity.description,
      videoUrl: editingActivity.videoUrl,
      videoCheckpoints: editingActivity.type === 'video'
        ? [...(editingActivity.videoCheckpoints || [])].sort((a, b) => (a.timeSeconds || 0) - (b.timeSeconds || 0))
        : editingActivity.videoCheckpoints,
      preventVideoSkip: editingActivity.preventVideoSkip,
      fileUrl: editingActivity.fileUrl,
      dueDate: editingActivity.dueDate || (editingActivity.dueDateIso ? formatDueDateFromIso(editingActivity.dueDateIso) : ''),
      dueDateIso: editingActivity.dueDateIso,
      maxScore: editingActivity.maxScore,
      timeLimitMinutes: editingActivity.type === 'quiz' ? Math.max(1, Number(editingActivity.timeLimitMinutes) || 15) : editingActivity.timeLimitMinutes,
      passScore: editingActivity.type === 'quiz' ? Math.min(10, Math.max(0, Number(editingActivity.passScore) || 5)) : editingActivity.passScore,
      shuffleQuestions: editingActivity.type === 'quiz' ? Boolean(editingActivity.shuffleQuestions) : editingActivity.shuffleQuestions,
      maxAttempts: editingActivity.type === 'quiz' ? Math.max(0, Number(editingActivity.maxAttempts) || 0) : editingActivity.maxAttempts,
      assignmentPrompt: editingActivity.assignmentPrompt,
      starterCode: editingActivity.starterCode,
      programmingLanguage: editingActivity.programmingLanguage,
      quizQuestions: editingActivity.quizQuestions
    });

    setEditingActivity(null);
  };

  // 5. Nhập gói học liệu (.json) đã xuất từ khóa học / LMS khác
  const handleImportJsonPackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeCourse) return;

    setIsImportingPkg(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const pkgModules = Array.isArray(parsed?.modules)
        ? parsed.modules
        : Array.isArray(parsed?.activities)
          ? [{ title: parsed.title || 'Học liệu nhập vào', description: parsed.description || '', activities: parsed.activities }]
          : null;

      if (!pkgModules || pkgModules.length === 0) {
        alert('Tệp JSON không đúng định dạng gói học liệu LMS (không tìm thấy danh sách mô-đun/hoạt động).');
        return;
      }

      const res = await importCoursePackage(activeCourse.id, {
        modules: pkgModules,
        targetModuleId: focusedModule?.id || null
      });
      if (res) {
        alert(`✅ Nhập học liệu thành công!\n• Mô-đun mới: ${res.addedModules}\n• Hoạt động/Học liệu đã thêm: ${res.addedActivities}`);
      }
    } catch (err: any) {
      alert('Không thể đọc tệp JSON học liệu: ' + (err?.message || 'Lỗi định dạng'));
    } finally {
      setIsImportingPkg(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 py-5 px-4 sm:px-6 lg:px-8 space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="min-w-0">
          {focusedModule ? (
            <div className="space-y-1">
              {!isEmbedMode && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCurrentView('courses-list')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Danh sách bài học</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModuleId(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] text-xs font-bold transition-colors border border-sky-200"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Xem tất cả {modules.length} bài</span>
                  </button>
                </div>
              )}
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight pt-1">
                {focusedModule.title}
              </h2>
            </div>
          ) : (
            <>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Nội dung học tập & Kho học liệu ({modules.length} bài học)
              </h2>
              <p className="text-xs text-slate-500">
                Quản lý các mô-đun, bài giảng video, bài tập, link tài liệu và bài kiểm tra
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canManage && !isEmbedMode && (
            <button
              type="button"
              onClick={() => setShareTarget({ module: focusedModule || null, activity: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-bold transition-colors shadow-2xs"
              title="Lấy link trực tiếp, mã nhúng iframe hoặc xuất SCORM/IMSCC/Quiz/JSON sang LMS khác"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ / Xuất LMS</span>
            </button>
          )}

          {canManage && !isEmbedMode && (
            <label
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-bold transition-colors shadow-2xs cursor-pointer ${isImportingPkg ? 'opacity-60 pointer-events-none' : ''}`}
              title={focusedModule ? `Nhập học liệu JSON vào thẳng "${focusedModule.title}"` : 'Nhập gói mô-đun & học liệu (.json) vào khóa học'}
            >
              {isImportingPkg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderInput className="w-3.5 h-3.5 text-[#0374b5]" />}
              <span>{isImportingPkg ? 'Đang nhập...' : 'Nhập gói (.json)'}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportJsonPackage}
                className="hidden"
              />
            </label>
          )}

          {!focusedModule && (
            <button
              onClick={toggleAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
            >
              {allCollapsed ? 'Mở Rộng Tất Cả' : 'Thu Gọn Tất Cả'}
            </button>
          )}

          {canManage && !focusedModule && !isEmbedMode && (
            <button
              onClick={() => setIsAddModuleOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-md text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mô-đun</span>
            </button>
          )}
        </div>
      </div>

      {/* Thanh chuyển nhanh giữa các bài học khi đang xem riêng 1 bài */}
      {focusedModule && modules.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {modules.map((m, i) => {
            const isActive = m.id === focusedModule.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModuleId(m.id)}
                title={m.title}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-[#0374b5] text-white border-[#0374b5] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#0374b5] hover:text-[#0374b5]'
                }`}
              >
                Bài {i + 1}
                {(m.activities || []).length > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {(m.activities || []).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Thống kê chuẩn BT4: Tỷ lệ học liệu Video & Tương tác >= 30% (chỉ hiển thị cho Giáo viên / Quản trị viên) */}
      {canManage && !isEmbedMode && (() => {
        const allActs = modules.flatMap(m => m.activities || []);
        const total = allActs.length;
        const videoCnt = allActs.filter(a => a.type === 'video').length;
        const videoCpCnt = allActs.filter(a => a.type === 'video' && (a.videoCheckpoints?.length || 0) > 0).length;
        const htmlLabCnt = allActs.filter(a => a.type === 'document' && /\.html?(\?.*)?$/i.test(a.fileUrl || '')).length;
        const quizCnt = allActs.filter(a => a.type === 'quiz').length;
        const forumCnt = allActs.filter(a => a.type === 'forum').length;
        const interactiveTotal = videoCnt + htmlLabCnt + quizCnt + forumCnt;
        const ratio = total > 0 ? Math.round((interactiveTotal / total) * 100) : 0;
        const passed = total > 0 && ratio >= 30;
        return (
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            passed
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-sky-50/70 border-sky-200 text-slate-800'
          }`}>
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold flex items-center gap-1.5">
                  <Target className={`w-4 h-4 ${passed ? 'text-emerald-600' : 'text-[#0374b5]'}`} />
                  <span>Chỉ số Học liệu Video & Tương tác (Chuẩn BT4 ≥ 30%):</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${
                  passed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {ratio}% ({interactiveTotal}/{total} học liệu) • {passed ? '✓ Đạt chuẩn BT4' : total === 0 ? 'Chưa có học liệu' : 'Cần thêm Video/Tương tác'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Video bài giảng: <strong>{videoCnt}</strong> ({videoCpCnt} video có neo chặn) • Học liệu HTML5 tương tác: <strong>{htmlLabCnt}</strong> • Trắc nghiệm tương tác: <strong>{quizCnt}</strong> • Thảo luận: <strong>{forumCnt}</strong> • Tài liệu/Bài tập khác: <strong>{Math.max(0, total - interactiveTotal)}</strong>
              </p>
            </div>
            <div className="w-full sm:w-36 shrink-0">
              <div className="w-full h-2.5 bg-white/90 rounded-full border border-slate-200 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all ${passed ? 'bg-emerald-500' : 'bg-[#0374b5]'}`}
                  style={{ width: `${Math.min(100, ratio)}%` }}
                />
                <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80" style={{ left: '30%' }} title="Mốc tối thiểu 30% theo yêu cầu BT4" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                <span>0%</span>
                <span className="text-rose-500 font-bold">30%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modules List Container */}
      {displayedModules.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3 bg-white my-6 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Khóa học chưa có mô-đun hoặc học liệu nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {canManage 
                ? 'Bước 1: tạo một mô-đun (chương). Bước 2: bấm "Thêm bài học" ở mô-đun đó để chèn video YouTube/MP4, link tài liệu, bài tập hoặc câu hỏi trắc nghiệm.'
                : 'Nội dung bài học và học liệu đang được giáo viên chuẩn bị.'}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setIsAddModuleOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Mô-đun Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedModules.map((mod, modIdx) => {
            const isCollapsed = focusedModule ? false : (collapsedModules[mod.id] ?? false);
            const activities = mod.activities || [];
            const moveModule = (delta: number) => {
              const ids = modules.map(m => m.id);
              const idx = ids.indexOf(mod.id);
              const target = idx + delta;
              if (idx < 0 || target < 0 || target >= ids.length) return;
              [ids[idx], ids[target]] = [ids[target], ids[idx]];
              reorderCourseModules(activeCourse.id, ids);
            };
            const moveActivity = (actId: string, delta: number) => {
              const ids = activities.map(a => a.id);
              const idx = ids.indexOf(actId);
              const target = idx + delta;
              if (idx < 0 || target < 0 || target >= ids.length) return;
              [ids[idx], ids[target]] = [ids[target], ids[idx]];
              reorderModuleActivities(activeCourse.id, mod.id, ids);
            };

            return (
              <div 
                key={mod.id} 
                className={`border rounded-md overflow-hidden bg-white shadow-2xs ${mod.isHidden ? 'border-amber-300 opacity-85' : 'border-slate-300'}`}
              >
                {/* Module Header Bar */}
                <div 
                  onClick={() => toggleModule(mod.id)}
                  className="bg-[#f5f5f5] px-4 py-2.5 flex items-center justify-between cursor-pointer border-b border-slate-300 hover:bg-slate-200/70 transition-colors select-none group/mod"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-slate-600">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight truncate">
                          {mod.title}
                        </h3>
                        {mod.ownerName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold shrink-0">
                            <UserCheck className="w-3 h-3" />
                            <span>Phụ trách: {mod.ownerName}</span>
                          </span>
                        )}
                        {mod.isHidden && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black shrink-0">
                            Đang ẩn (Nháp)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!focusedModule && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModuleId(mod.id);
                        }}
                        className="px-2.5 py-0.5 rounded-full border border-sky-200 bg-white hover:bg-sky-50 text-[11px] font-bold text-[#0374b5] shadow-2xs transition-colors"
                        title="Chỉ mở riêng bài học này"
                      >
                        Mở riêng
                      </button>
                    )}
                    {canManage && moduleStatsMap[mod.id] && activities.length > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenGradebook) onOpenGradebook();
                        }}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[11px] font-bold text-[#0374b5] shadow-2xs transition-colors"
                        title="Xem chi tiết tiến độ học sinh cho bài học này"
                      >
                        <BarChart3 className="w-3 h-3" />
                        <span>TB lớp: {moduleStatsMap[mod.id].avgCompletionPercent}%</span>
                      </button>
                    ) : (
                      <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full border border-slate-300 bg-white text-[11px] font-medium text-slate-700 shadow-2xs">
                        {activities.length > 0 ? `${activities.filter(a => a.isCompleted).length}/${activities.length} hoàn thành` : 'Hoàn thành tất cả các mục'}
                      </span>
                    )}
                    <Lock className="w-4 h-4 text-slate-600" />

                    {/* Hành động quản trị Mô-đun */}
                    {canManage && !isEmbedMode && (
                      <>
                        {!focusedModule && modules.length > 1 && (
                          <div className="hidden sm:flex items-center">
                            <button
                              type="button"
                              disabled={modIdx === 0}
                              onClick={(e) => { e.stopPropagation(); moveModule(-1); }}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-300/80 disabled:opacity-30"
                              title="Chuyển bài học lên trên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={modIdx === displayedModules.length - 1}
                              onClick={(e) => { e.stopPropagation(); moveModule(1); }}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-300/80 disabled:opacity-30"
                              title="Chuyển bài học xuống dưới"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCourseModule(activeCourse.id, mod.id, { isHidden: !mod.isHidden });
                          }}
                          className={`p-1 rounded transition-colors ${mod.isHidden ? 'text-amber-700 bg-amber-100 hover:bg-amber-200' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-300/80'}`}
                          title={mod.isHidden ? 'Đang ẩn với học sinh — Bấm để Công bố' : 'Đang hiển thị với học sinh — Bấm để Ẩn (Nháp)'}
                        >
                          {mod.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareTarget({ module: mod, activity: null });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Chia sẻ link & Xuất mô-đun này sang LMS khác (SCORM/IMSCC/JSON)"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingModule(mod);
                            setEditModTitle(mod.title);
                            setEditModPrereq(mod.description || '');
                            setEditModObjectives(mod.learningObjectives || '');
                            setEditModOwner(mod.ownerName || '');
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-300/80 transition-colors"
                          title="Sửa tên, mục tiêu & người phụ trách mô-đun"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Bạn có chắc chắn muốn xóa mô-đun "${mod.title}" cùng toàn bộ bài học bên trong?`)) {
                              deleteCourseModule(activeCourse.id, mod.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa mô-đun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetModuleId(mod.id);
                            setIsAddActivityOpen(true);
                          }}
                          className="px-2 py-1 rounded-md bg-[#0374b5] text-white hover:bg-[#025a8c] text-xs font-bold flex items-center gap-1 shadow-xs ml-1"
                          title="Thêm bài học / học liệu vào mô-đun"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="text-[11px] pr-1">Thêm bài học</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Module Items Body */}
                {!isCollapsed && (
                  <div>
                    {/* Khung Mục tiêu học tập (Nhấn vào để mở Popup xem chi tiết) */}
                    {mod.learningObjectives && (
                      <div className="bg-sky-50/70 border-b border-sky-100 text-xs">
                        <button
                          type="button"
                          onClick={() => setObjectivesModalModule(mod)}
                          className="w-full px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-sky-100/70 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Target className="w-4 h-4 text-[#0374b5] shrink-0" />
                            <span className="font-extrabold text-[#0374b5] uppercase text-[10px] tracking-wider">
                              Mục tiêu bài học
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              (Nhấn để xem chi tiết)
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#0374b5] shrink-0" />
                        </button>
                      </div>
                    )}

                    {activities.length === 0 ? (
                      <div className="py-6 px-4 text-center text-xs text-slate-400 bg-slate-50/30">
                        Chưa có học liệu nào trong mô-đun này.
                        {canManage && (
                          <>
                            {' '}
                            <button
                              onClick={() => {
                                setTargetModuleId(mod.id);
                                setIsAddActivityOpen(true);
                              }}
                              className="text-[#0374b5] font-bold hover:underline"
                            >
                              + Thêm bài học, video, bài tập ngay
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      activities.map((act, actIdx) => (
                        <ModuleActivityRow
                          key={act.id}
                          act={act}
                          actIdx={actIdx}
                          totalActivities={activities.length}
                          canManage={canManage}
                          isEmbedMode={isEmbedMode}
                          activityStats={activityStatsMap[act.id]}
                          classStudentCount={classStudentCount}
                          onPreview={() => setPreviewActivity({ moduleTitle: mod.title, activity: act })}
                          onMove={(delta) => moveActivity(act.id, delta)}
                          onToggleHidden={() => updateCourseActivity(activeCourse.id, act.id, { isHidden: !act.isHidden })}
                          onShare={() => setShareTarget({ module: mod, activity: act })}
                          onEdit={() => setEditingActivity(act)}
                          onDelete={() => {
                            if (confirm(`Bạn có chắc chắn muốn xóa bài học "${act.title}"?`)) {
                              deleteCourseActivity(activeCourse.id, act.id);
                            }
                          }}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2 POPUP XEM CHI TIẾT MỤC TIÊU BÀI HỌC & HOẠT ĐỘNG */}
      <ModulePreviewModals
        objectivesModalModule={objectivesModalModule}
        onCloseObjectives={() => setObjectivesModalModule(null)}
        previewActivity={previewActivity}
        onClosePreview={() => setPreviewActivity(null)}
        onOpenActivity={onSelectActivity}
      />

      {/* CÁC MODAL QUẢN TRỊ HỌC LIỆU (CHỈ DÀNH CHO GIÁO VIÊN / ADMIN) */}
      {canManage && (
        <>
          {/* MODAL 1: THÊM MÔ-ĐUN */}
          {isAddModuleOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                  Thêm Mô-đun mới
                </h3>
                <form onSubmit={handleSaveModule} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Mô-đun *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: BÀI 1: TỔNG QUAN HỌC PHẦN"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mô tả / Điều kiện tiên quyết (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Hoàn thành Bài trước đó"
                      value={modulePrereq}
                      onChange={(e) => setModulePrereq(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Thành viên phụ trách bài học (BT4 — Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A (Phụ trách Bài 1)"
                      value={moduleOwner}
                      onChange={(e) => setModuleOwner(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mục tiêu bài học (Hiển thị đầu mô-đun để đối chiếu sư phạm)
                    </label>
                    <textarea
                      rows={3}
                      placeholder={"• Hiểu được khái niệm và vai trò của...\n• Vận dụng kiến thức để giải quyết bài tập..."}
                      value={moduleObjectives}
                      onChange={(e) => setModuleObjectives(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddModuleOpen(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-sm"
                    >
                      Tạo Mô-đun
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: SỬA MÔ-ĐUN */}
          {editingModule && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                  Chỉnh sửa Mô-đun
                </h3>
                <form onSubmit={handleSaveEditModule} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Mô-đun *
                    </label>
                    <input
                      type="text"
                      value={editModTitle}
                      onChange={(e) => setEditModTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mô tả / Điều kiện tiên quyết
                    </label>
                    <input
                      type="text"
                      value={editModPrereq}
                      onChange={(e) => setEditModPrereq(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Thành viên phụ trách bài học (BT4)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={editModOwner}
                      onChange={(e) => setEditModOwner(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mục tiêu bài học (Hiển thị ngay đầu bài)
                    </label>
                    <textarea
                      rows={3}
                      placeholder={"• Nêu được...\n• Thực hành được..."}
                      value={editModObjectives}
                      onChange={(e) => setEditModObjectives(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingModule(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-sm"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 3: THÊM HỌC LIỆU / HOẠT ĐỘNG */}
          {isAddActivityOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#0374b5]" />
                  <span>Thêm Học Liệu Mới Vào Mô-đun (LMS Nhóm 2)</span>
                </h3>

                {/* Chọn loại học liệu */}
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActType('video')}
                    className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                      actType === 'video' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActType('document')}
                    className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                      actType === 'document' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    <span>Link/Tài liệu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActType('assignment')}
                    className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                      actType === 'assignment' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Bài tập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActType('quiz')}
                    className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                      actType === 'quiz' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Trắc nghiệm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActType('forum')}
                    className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                      actType === 'forum' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Thảo luận</span>
                  </button>
                </div>

                <form onSubmit={handleSaveActivity} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề bài học / học liệu *
                    </label>
                    <input
                      type="text"
                      placeholder={
                        actType === 'video' ? 'Ví dụ: Video tương tác: Bản chất của AI' :
                        actType === 'assignment' ? 'Ví dụ: Bài tập thu hoạch số 1' :
                        actType === 'quiz' ? 'Ví dụ: Trắc nghiệm đánh giá kiến thức' :
                        'Ví dụ: Khảo sát nhận thức ban đầu: Trí tuệ nhân tạo (AI)'
                      }
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phụ đề / Ghi chú hiển thị
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Xem trang, Video 10 phút, Điểm tối đa 10..."
                      value={actDesc}
                      onChange={(e) => setActDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>

                  {actType === 'video' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60 space-y-2">
                        <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-blue-600" />
                          <span>Đường dẫn Video (YouTube URL hoặc Direct MP4 Link) *</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=... hoặc https://.../video.mp4"
                          value={actVideoUrl}
                          onChange={(e) => setActVideoUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                        />
                        <p className="text-[11px] text-slate-500">
                          Hỗ trợ nhúng trực tiếp video YouTube hoặc file MP4, tự động đo % xem và tạm dừng tại các neo chặn bên dưới.
                        </p>
                      </div>

                      <VideoCheckpointEditor
                        checkpoints={actVideoCheckpoints}
                        onChange={setActVideoCheckpoints}
                        preventSkip={actPreventVideoSkip}
                        onPreventSkipChange={setActPreventVideoSkip}
                        idPrefix="add"
                      />
                    </div>
                  )}

                  {actType === 'document' && (
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-2">
                      <label className="block text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <ExternalLink className="w-4 h-4 text-emerald-600" />
                        <span>Đường dẫn liên kết / Tài liệu trực tuyến (URL)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://docs.google.com/... hoặc link website ngoài"
                        value={actFileUrl}
                        onChange={(e) => setActFileUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                      />
                    </div>
                  )}

                  {(actType === 'document' || actType === 'video' || actType === 'assignment') && (
                    <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                          <UploadCloud className="w-4 h-4 text-[#0374b5]" />
                          <span>Hoặc tải tệp trực tiếp từ máy tính lên hệ thống (Tùy ý mọi tệp)</span>
                        </label>
                        {isUploadingActFile && (
                          <span className="text-[11px] text-[#0374b5] font-bold flex items-center gap-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Hỗ trợ tệp PDF, Word, PowerPoint, Excel, Video MP4, Audio MP3, ZIP, Code... (Tối đa 100MB)
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-white hover:bg-sky-50 text-[#0374b5] border border-[#0374b5] rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{uploadedActFileName ? 'Đổi tệp khác' : 'Chọn tệp từ máy tính...'}</span>
                          <input
                            type="file"
                            className="hidden"
                            disabled={isUploadingActFile}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingActFile(true);
                              try {
                                const targetMod = modules.find(m => m.id === targetModuleId);
                                const saved = await uploadCourseFile(activeCourse.id, file, '', targetMod?.title || '', targetMod?.id || '');
                                if (saved) {
                                  setUploadedActFileName(file.name);
                                  setActFileUrl(saved.url);
                                  if (!actTitle) setActTitle(file.name.replace(/\.[^/.]+$/, ''));
                                  if (saved.fileType === 'video') {
                                    setActVideoUrl(saved.url);
                                  }
                                }
                              } catch (err: any) {
                                alert('Lỗi tải tệp: ' + (err.message || 'Không thể tải'));
                              } finally {
                                setIsUploadingActFile(false);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                        {uploadedActFileName && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 truncate max-w-xs">
                            ✓ {uploadedActFileName}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {actType === 'assignment' && (
                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/60 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-purple-900 mb-1">
                            Dạng bài / Ngôn ngữ
                          </label>
                          <select
                            value={actProgLang}
                            onChange={(e) => setActProgLang(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0374b5]"
                          >
                            <option value="Python">🐍 Lập trình Python (AI & Thuật toán)</option>
                            <option value="Scratch">🐱 Lập trình Scratch (Khối 3-9)</option>
                            <option value="Web HTML/CSS">🌐 Lập trình Web (HTML / CSS / JS)</option>
                            <option value="C++">⚡ Lập trình C++ / Pascal</option>
                            <option value="Tài liệu & Dự án">📄 Nộp file Báo cáo / Dự án (.pdf, .docx, .zip)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-purple-900 mb-1">
                            Thang điểm
                          </label>
                          <input
                            type="number"
                            value={actMaxScore}
                            onChange={(e) => setActMaxScore(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">
                          Yêu cầu / Đề bài bài tập *
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Nhập đề bài, các yêu cầu cần học sinh hoàn thành và nộp..."
                          value={actPrompt}
                          onChange={(e) => setActPrompt(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">
                          Khung mã nguồn mẫu / Starter Code (Tùy chọn)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="# Gõ khung code mẫu hoặc gợi ý khởi tạo cho học sinh..."
                          value={actStarterCode}
                          onChange={(e) => setActStarterCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 text-sky-300 font-mono text-xs rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0374b5]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">
                          Hạn nộp bài (Deadline — tự động gắn nhãn "Nộp trễ" nếu quá hạn)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="datetime-local"
                            value={actDueDateIso}
                            onChange={(e) => {
                              setActDueDateIso(e.target.value);
                              if (e.target.value) setActDueDate(formatDueDateFromIso(e.target.value));
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                          />
                          <input
                            type="text"
                            placeholder="Hoặc ghi chú hạn nộp (VD: 30/11 23:59)"
                            value={actDueDate}
                            onChange={(e) => setActDueDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {actType === 'quiz' && (
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-3 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-white rounded-xl border border-amber-200">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                            Thời gian (phút) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={actTimeLimit}
                            onChange={(e) => setActTimeLimit(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0374b5]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                            Điểm đạt (0-10)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={10}
                            value={actPassScore}
                            onChange={(e) => setActPassScore(Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0374b5]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1" title="0 = Không giới hạn số lượt làm lại">
                            Số lượt tối đa
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={actMaxAttempts}
                            onChange={(e) => setActMaxAttempts(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0374b5]"
                            placeholder="0 = không giới hạn"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                            Hạn làm bài
                          </label>
                          <input
                            type="datetime-local"
                            value={actDueDateIso}
                            onChange={(e) => {
                              setActDueDateIso(e.target.value);
                              if (e.target.value) setActDueDate(formatDueDateFromIso(e.target.value));
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-900 focus:outline-none focus:border-[#0374b5]"
                          />
                        </div>
                        <label className="col-span-2 sm:col-span-4 flex items-center gap-2 text-[11px] font-bold text-amber-950 cursor-pointer pt-1 border-t border-amber-100">
                          <input
                            type="checkbox"
                            checked={actShuffleQuestions}
                            onChange={(e) => setActShuffleQuestions(e.target.checked)}
                            className="accent-amber-600 w-3.5 h-3.5"
                          />
                          <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tự động xáo trộn thứ tự câu hỏi cho mỗi học sinh (chống nhìn bài nhau) • Số lượt = 0 là không giới hạn</span>
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 sticky top-0 bg-amber-50/95 py-1 backdrop-blur-xs z-10">
                        <span className="text-xs font-bold text-amber-900">
                          Soạn câu hỏi trắc nghiệm ({quizQuestions.length} câu)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsBulkQuizOpen(v => !v)}
                            className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold"
                          >
                            ⚡ Nhập nhanh (Aiken / Dán đề)
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizQuestions(prev => [
                              ...prev, 
                              {
                                id: `q${Date.now()}`,
                                question: `Câu hỏi ${prev.length + 1}?`,
                                options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
                                correctAnswer: 0
                              }
                            ])}
                            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-[11px] font-bold shadow-2xs"
                          >
                            + Thêm câu hỏi
                          </button>
                        </div>
                      </div>

                      {isBulkQuizOpen && (
                        <div className="p-3 bg-white rounded-xl border-2 border-amber-300 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-amber-950">Dán hàng loạt câu hỏi hoặc chọn file Aiken (.txt):</span>
                            <label className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold cursor-pointer">
                              📂 Chọn file .txt
                              <input
                                type="file"
                                accept=".txt,text/plain"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = '';
                                  if (f) setBulkQuizText(await f.text());
                                }}
                              />
                            </label>
                          </div>
                          <textarea
                            rows={5}
                            value={bulkQuizText}
                            onChange={(e) => setBulkQuizText(e.target.value)}
                            placeholder={"Câu 1: AI học từ yếu tố nào?\nA. Dữ liệu huấn luyện\nB. Màn hình\nC. Bàn phím\nD. Chuột\nANSWER: A\n\nCâu 2: Đâu là ứng dụng AI?\n*A. Dịch ngôn ngữ tự động\nB. Quạt máy cơ"}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsBulkQuizOpen(false)} className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold">Đóng</button>
                            <button
                              type="button"
                              onClick={() => {
                                const parsed = parseBulkQuizText(bulkQuizText);
                                if (parsed.length === 0) {
                                  alert('Không nhận diện được câu hỏi nào. Hãy đảm bảo mỗi câu có các phương án A. B. C. D. và dòng ANSWER: A (hoặc Đáp án: A hoặc *A.).');
                                  return;
                                }
                                setQuizQuestions(prev => [...prev, ...parsed]);
                                setBulkQuizText('');
                                setIsBulkQuizOpen(false);
                                alert(`✅ Đã nhập nhanh thành công ${parsed.length} câu hỏi!`);
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            >
                              Phân tích & Thêm vào đề
                            </button>
                          </div>
                        </div>
                      )}

                      {quizQuestions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-3 bg-white rounded-xl border border-amber-200 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-amber-950">
                              Câu {qIdx + 1}
                            </span>
                            {quizQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setQuizQuestions(prev => prev.filter((_, idx) => idx !== qIdx))}
                                className="text-rose-500 hover:text-rose-700 p-1"
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder="Nội dung câu hỏi..."
                            value={q.question}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuizQuestions(prev => prev.map((item, idx) => idx === qIdx ? { ...item, question: val } : item));
                            }}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0374b5]"
                            required
                          />

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                              4 Phương án (Tích chọn vào nút tròn đáp án ĐÚNG):
                            </label>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct_add_${q.id || qIdx}`}
                                  checked={q.correctAnswer === oIdx}
                                  onChange={() => {
                                    setQuizQuestions(prev => prev.map((item, idx) => idx === qIdx ? { ...item, correctAnswer: oIdx } : item));
                                  }}
                                  className="accent-emerald-600 cursor-pointer w-4 h-4 shrink-0"
                                  title="Đánh dấu đáp án ĐÚNG"
                                />
                                <span className="font-bold text-xs text-slate-600 w-3 shrink-0">
                                  {['A', 'B', 'C', 'D'][oIdx]}
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuizQuestions(prev => prev.map((item, idx) => {
                                      if (idx !== qIdx) return item;
                                      const newOpts = [...item.options];
                                      newOpts[oIdx] = val;
                                      return { ...item, options: newOpts };
                                    }));
                                  }}
                                  className={`flex-1 px-2.5 py-1 text-xs border rounded-lg focus:outline-none ${
                                    q.correctAnswer === oIdx 
                                      ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-950 ring-1 ring-emerald-500/30' 
                                      : 'border-slate-300 bg-white text-slate-700'
                                  }`}
                                  placeholder={`Phương án ${['A', 'B', 'C', 'D'][oIdx]}`}
                                />
                              </div>
                            ))}
                          </div>

                          <input
                            type="text"
                            placeholder="💡 Giải thích / Phản hồi sư phạm sau khi học sinh nộp bài (Tùy chọn)..."
                            value={q.explanation || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuizQuestions(prev => prev.map((item, idx) => idx === qIdx ? { ...item, explanation: val } : item));
                            }}
                            className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddActivityOpen(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-sm"
                    >
                      Thêm Vào Mô-đun
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 4: SỬA HỌC LIỆU / HOẠT ĐỘNG */}
          {editingActivity && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#0374b5]" />
                  <span>Chỉnh sửa học liệu: {editingActivity.title}</span>
                </h3>

                <form onSubmit={handleSaveEditActivity} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      value={editingActivity.title}
                      onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phụ đề / Mô tả
                    </label>
                    <input
                      type="text"
                      value={editingActivity.description || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>

                  {editingActivity.type === 'video' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1">
                          Link Video (YouTube hoặc MP4)
                        </label>
                        <input
                          type="url"
                          value={editingActivity.videoUrl || ''}
                          onChange={(e) => setEditingActivity({ ...editingActivity, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <VideoCheckpointEditor
                        checkpoints={editingActivity.videoCheckpoints || []}
                        onChange={(next) => setEditingActivity({ ...editingActivity, videoCheckpoints: next })}
                        preventSkip={editingActivity.preventVideoSkip ?? true}
                        onPreventSkipChange={(val) => setEditingActivity({ ...editingActivity, preventVideoSkip: val })}
                        idPrefix="edit"
                      />
                    </div>
                  )}

                  {editingActivity.type === 'document' && (
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 mb-1">
                        Đường dẫn liên kết / Tài liệu (URL)
                      </label>
                      <input
                        type="url"
                        value={editingActivity.fileUrl || ''}
                        onChange={(e) => setEditingActivity({ ...editingActivity, fileUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                      />
                      <div className="pt-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-[#0374b5] hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{isUploadingActFile ? 'Đang tải tệp lên...' : 'Tải tệp mới từ máy tính'}</span>
                          <input
                            type="file"
                            className="hidden"
                            disabled={isUploadingActFile}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingActFile(true);
                              try {
                                const targetMod = modules.find(m => m.id === (editingActivity?.moduleId || targetModuleId));
                                const saved = await uploadCourseFile(activeCourse.id, file, '', targetMod?.title || '', targetMod?.id || '');
                                if (saved) {
                                  setEditingActivity({ ...editingActivity, fileUrl: saved.url });
                                }
                              } catch (err: any) {
                                alert('Lỗi tải tệp: ' + (err.message || 'Không thể tải'));
                              } finally {
                                setIsUploadingActFile(false);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {editingActivity.type === 'assignment' && (
                    <div className="space-y-3 p-3 bg-purple-50/50 rounded-xl border border-purple-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-purple-900 mb-1">
                            Dạng bài / Ngôn ngữ
                          </label>
                          <select
                            value={editingActivity.programmingLanguage || 'Python'}
                            onChange={(e) => setEditingActivity({ ...editingActivity, programmingLanguage: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0374b5]"
                          >
                            <option value="Python">🐍 Lập trình Python (AI & Thuật toán)</option>
                            <option value="Scratch">🐱 Lập trình Scratch (Khối 3-9)</option>
                            <option value="Web HTML/CSS">🌐 Lập trình Web (HTML / CSS / JS)</option>
                            <option value="C++">⚡ Lập trình C++ / Pascal</option>
                            <option value="Tài liệu & Dự án">📄 Nộp file Báo cáo / Dự án</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-purple-900 mb-1">
                            Thang điểm
                          </label>
                          <input
                            type="number"
                            value={editingActivity.maxScore || 10}
                            onChange={(e) => setEditingActivity({ ...editingActivity, maxScore: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">
                          Yêu cầu / Đề bài
                        </label>
                        <textarea
                          rows={3}
                          value={editingActivity.assignmentPrompt || ''}
                          onChange={(e) => setEditingActivity({ ...editingActivity, assignmentPrompt: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">
                          Khung mã nguồn gợi ý / Starter Code (Tùy chọn)
                        </label>
                        <textarea
                          rows={3}
                          value={editingActivity.starterCode || ''}
                          onChange={(e) => setEditingActivity({ ...editingActivity, starterCode: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 text-sky-300 font-mono text-xs rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0374b5]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">
                          Hạn nộp (Deadline)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="datetime-local"
                            value={editingActivity.dueDateIso || ''}
                            onChange={(e) => setEditingActivity({
                              ...editingActivity,
                              dueDateIso: e.target.value,
                              dueDate: e.target.value ? formatDueDateFromIso(e.target.value) : editingActivity.dueDate
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                          />
                          <input
                            type="text"
                            value={editingActivity.dueDate || ''}
                            onChange={(e) => setEditingActivity({ ...editingActivity, dueDate: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {editingActivity.type === 'quiz' && (
                    <div className="space-y-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-white rounded-xl border border-amber-200">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                            Thời gian (phút) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={editingActivity.timeLimitMinutes || 15}
                            onChange={(e) => setEditingActivity({ ...editingActivity, timeLimitMinutes: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                            Điểm đạt (0-10)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={10}
                            value={editingActivity.passScore ?? 5}
                            onChange={(e) => setEditingActivity({ ...editingActivity, passScore: Math.min(10, Math.max(0, Number(e.target.value) || 0)) })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                            Số lượt tối đa
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={editingActivity.maxAttempts ?? 0}
                            onChange={(e) => setEditingActivity({ ...editingActivity, maxAttempts: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                            Hạn làm bài
                          </label>
                          <input
                            type="datetime-local"
                            value={editingActivity.dueDateIso || ''}
                            onChange={(e) => setEditingActivity({
                              ...editingActivity,
                              dueDateIso: e.target.value,
                              dueDate: e.target.value ? formatDueDateFromIso(e.target.value) : editingActivity.dueDate
                            })}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-900"
                          />
                        </div>
                        <label className="col-span-2 sm:col-span-4 flex items-center gap-2 text-[11px] font-bold text-amber-950 cursor-pointer pt-1 border-t border-amber-100">
                          <input
                            type="checkbox"
                            checked={Boolean(editingActivity.shuffleQuestions)}
                            onChange={(e) => setEditingActivity({ ...editingActivity, shuffleQuestions: e.target.checked })}
                            className="accent-amber-600 w-3.5 h-3.5"
                          />
                          <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tự động xáo trộn thứ tự câu hỏi cho mỗi học sinh</span>
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 sticky top-0 bg-amber-50/95 py-1 z-10">
                        <span className="text-xs font-bold text-amber-900">
                          Soạn câu hỏi trắc nghiệm ({(editingActivity.quizQuestions || []).length} câu)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditBulkQuizOpen(v => !v)}
                            className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold"
                          >
                            ⚡ Nhập nhanh Aiken
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const current = editingActivity.quizQuestions || [];
                              setEditingActivity({
                                ...editingActivity,
                                quizQuestions: [
                                  ...current,
                                  {
                                    id: `q${Date.now()}`,
                                    question: `Câu hỏi ${current.length + 1}?`,
                                    options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
                                    correctAnswer: 0
                                  }
                                ]
                              });
                            }}
                            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-[11px] font-bold shadow-2xs"
                          >
                            + Thêm câu hỏi
                          </button>
                        </div>
                      </div>

                      {isEditBulkQuizOpen && (
                        <div className="p-3 bg-white rounded-xl border-2 border-amber-300 space-y-2 text-xs">
                          <textarea
                            rows={4}
                            value={editBulkQuizText}
                            onChange={(e) => setEditBulkQuizText(e.target.value)}
                            placeholder={"Dán câu hỏi chuẩn Aiken / Word...\nCâu 1: ...\nA. ...\nB. ...\nANSWER: A"}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsEditBulkQuizOpen(false)} className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-100">Đóng</button>
                            <button
                              type="button"
                              onClick={() => {
                                const parsed = parseBulkQuizText(editBulkQuizText);
                                if (parsed.length === 0) {
                                  alert('Không nhận diện được câu hỏi nào từ văn bản đã dán.');
                                  return;
                                }
                                setEditingActivity({
                                  ...editingActivity,
                                  quizQuestions: [...(editingActivity.quizQuestions || []), ...parsed]
                                });
                                setEditBulkQuizText('');
                                setIsEditBulkQuizOpen(false);
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold"
                            >
                              Thêm {parseBulkQuizText(editBulkQuizText).length || ''} câu vào đề
                            </button>
                          </div>
                        </div>
                      )}

                      {(editingActivity.quizQuestions || []).map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-3 bg-white rounded-xl border border-amber-200 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-amber-950">
                              Câu {qIdx + 1}
                            </span>
                            {(editingActivity.quizQuestions || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (editingActivity.quizQuestions || []).filter((_, idx) => idx !== qIdx);
                                  setEditingActivity({ ...editingActivity, quizQuestions: updated });
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1"
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder="Nội dung câu hỏi..."
                            value={q.question}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = (editingActivity.quizQuestions || []).map((item, idx) => 
                                idx === qIdx ? { ...item, question: val } : item
                              );
                              setEditingActivity({ ...editingActivity, quizQuestions: updated });
                            }}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0374b5]"
                            required
                          />

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                              4 Phương án (Tích chọn vào nút tròn đáp án ĐÚNG):
                            </label>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct_edit_${q.id || qIdx}`}
                                  checked={q.correctAnswer === oIdx}
                                  onChange={() => {
                                    const updated = (editingActivity.quizQuestions || []).map((item, idx) => 
                                      idx === qIdx ? { ...item, correctAnswer: oIdx } : item
                                    );
                                    setEditingActivity({ ...editingActivity, quizQuestions: updated });
                                  }}
                                  className="accent-emerald-600 cursor-pointer w-4 h-4 shrink-0"
                                  title="Đánh dấu đáp án ĐÚNG"
                                />
                                <span className="font-bold text-xs text-slate-600 w-3 shrink-0">
                                  {['A', 'B', 'C', 'D'][oIdx]}
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = (editingActivity.quizQuestions || []).map((item, idx) => {
                                      if (idx !== qIdx) return item;
                                      const newOpts = [...item.options];
                                      newOpts[oIdx] = val;
                                      return { ...item, options: newOpts };
                                    });
                                    setEditingActivity({ ...editingActivity, quizQuestions: updated });
                                  }}
                                  className={`flex-1 px-2.5 py-1 text-xs border rounded-lg focus:outline-none ${
                                    q.correctAnswer === oIdx 
                                      ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-950 ring-1 ring-emerald-500/30' 
                                      : 'border-slate-300 bg-white text-slate-700'
                                  }`}
                                  placeholder={`Phương án ${['A', 'B', 'C', 'D'][oIdx]}`}
                                />
                              </div>
                            ))}
                          </div>

                          <input
                            type="text"
                            placeholder="💡 Giải thích / Phản hồi sư phạm sau khi học sinh nộp bài (Tùy chọn)..."
                            value={q.explanation || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = (editingActivity.quizQuestions || []).map((item, idx) =>
                                idx === qIdx ? { ...item, explanation: val } : item
                              );
                              setEditingActivity({ ...editingActivity, quizQuestions: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingActivity(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-sm"
                    >
                      Lưu cập nhật
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL CHIA SẺ LINK / MÃ NHÚNG IFRAME / XUẤT GÓI SCORM-IMSCC-QUIZ-JSON */}
      {shareTarget && (
        <ShareExportModal
          course={activeCourse}
          module={shareTarget.module}
          activity={shareTarget.activity}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  );
};