import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  Circle, 
  Link2, 
  FileText, 
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
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { CourseModule, Activity, QuizQuestion } from '../types';

interface CanvasModulesViewProps {
  onSelectActivity: (activityId: string) => void;
}

export const CanvasModulesView: React.FC<CanvasModulesViewProps> = ({ onSelectActivity }) => {
  const { 
    activeCourse, 
    addCourseModule, 
    updateCourseModule, 
    deleteCourseModule,
    addCourseActivity, 
    updateCourseActivity, 
    deleteCourseActivity 
  } = useApp();

  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Modal Thêm Mô-đun
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [modulePrereq, setModulePrereq] = useState('');

  // Modal Sửa Mô-đun
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editModTitle, setEditModTitle] = useState('');
  const [editModPrereq, setEditModPrereq] = useState('');

  // Modal Thêm Hoạt Động / Học Liệu
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [actType, setActType] = useState<Activity['type']>('video');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actVideoUrl, setActVideoUrl] = useState('');
  const [actFileUrl, setActFileUrl] = useState('');
  const [actDueDate, setActDueDate] = useState('');
  const [actMaxScore, setActMaxScore] = useState(10);
  const [actPrompt, setActPrompt] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      question: 'Câu hỏi kiểm tra nhận thức 1?',
      options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
      correctAnswer: 0
    }
  ]);

  // Modal Sửa Hoạt Động
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  if (!activeCourse) {
    return (
      <div className="p-8 text-center text-slate-500">
        Vui lòng chọn một khóa học để xem nội dung học tập.
      </div>
    );
  }

  const modules = activeCourse.modules || [];

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

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4 text-blue-600 fill-blue-600/10" />;
      case 'document':
        return <Link2 className="w-4 h-4 text-emerald-600" />;
      case 'assignment':
        return <Upload className="w-4 h-4 text-purple-600" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-amber-600" />;
      case 'forum':
        return <MessageSquare className="w-4 h-4 text-teal-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  // 1. Submit Tạo Mô-đun
  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    addCourseModule(activeCourse.id, moduleTitle.trim(), modulePrereq.trim());
    setModuleTitle('');
    setModulePrereq('');
    setIsAddModuleOpen(false);
  };

  // 2. Submit Sửa Mô-đun
  const handleSaveEditModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !editModTitle.trim()) return;

    updateCourseModule(activeCourse.id, editingModule.id, {
      title: editModTitle.trim(),
      description: editModPrereq.trim()
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
      description: actDesc.trim() || (actType === 'video' ? 'Video bài giảng' : actType === 'document' ? 'Xem trang' : actType === 'assignment' ? 'Nộp bài tập' : 'Kiểm tra trắc nghiệm'),
      videoUrl: actVideoUrl.trim(),
      fileUrl: actFileUrl.trim(),
      dueDate: actDueDate.trim(),
      maxScore: Number(actMaxScore) || 10,
      assignmentPrompt: actPrompt.trim(),
      quizQuestions: actType === 'quiz' ? quizQuestions : undefined,
      isRequired: true,
      durationMinutes: 15
    };

    addCourseActivity(activeCourse.id, targetModuleId, newActivityData);

    // Reset Form
    setActTitle('');
    setActDesc('');
    setActVideoUrl('');
    setActFileUrl('');
    setActDueDate('');
    setActPrompt('');
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
      fileUrl: editingActivity.fileUrl,
      dueDate: editingActivity.dueDate,
      maxScore: editingActivity.maxScore,
      assignmentPrompt: editingActivity.assignmentPrompt
    });

    setEditingActivity(null);
  };

  return (
    <div className="flex-1 min-w-0 py-5 px-4 sm:px-6 lg:px-8 space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Nội dung học tập & Kho học liệu
          </h2>
          <p className="text-xs text-slate-500">
            Quản lý các mô-đun, bài giảng video, bài tập, link tài liệu và bài kiểm tra
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Thu gọn / Mở rộng tất cả */}
          <button
            onClick={toggleAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
          >
            {allCollapsed ? 'Mở Rộng Tất Cả' : 'Thu Gọn Tất Cả'}
          </button>

          {/* Nút + Thêm Mô-đun */}
          <button
            onClick={() => setIsAddModuleOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-md text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Mô-đun</span>
          </button>
        </div>
      </div>

      {/* Modules List Container */}
      {modules.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3 bg-white my-6 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Khóa học chưa có mô-đun hoặc học liệu nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Bạn có thể tự do thêm bài giảng video YouTube/MP4, chèn link tài liệu, giao bài tập hoặc câu hỏi trắc nghiệm ngay bây giờ.
            </p>
          </div>
          <button
            onClick={() => setIsAddModuleOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mô-đun Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => {
            const isCollapsed = collapsedModules[mod.id] ?? false;
            const activities = mod.activities || [];

            return (
              <div 
                key={mod.id} 
                className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-2xs"
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
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight truncate">
                        {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 font-normal">
                          {mod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full border border-slate-300 bg-white text-[11px] font-medium text-slate-700 shadow-2xs">
                      Hoàn thành tất cả các mục
                    </span>
                    <Lock className="w-4 h-4 text-slate-600" />

                    {/* Sửa Mô-đun */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModule(mod);
                        setEditModTitle(mod.title);
                        setEditModPrereq(mod.description || '');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-300/80 transition-colors"
                      title="Sửa tên mô-đun"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Xóa Mô-đun */}
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

                    {/* Thêm bài học vào mô-đun */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetModuleId(mod.id);
                        setIsAddActivityOpen(true);
                      }}
                      className="p-1 rounded bg-[#0374b5] text-white hover:bg-[#025a8c] text-xs font-bold flex items-center gap-1 shadow-xs ml-1"
                      title="Thêm bài học / học liệu vào mô-đun"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[11px] pr-1">Thêm mục</span>
                    </button>
                  </div>
                </div>

                {/* Module Items Body */}
                {!isCollapsed && (
                  <div>
                    {activities.length === 0 ? (
                      <div className="py-6 px-4 text-center text-xs text-slate-400 bg-slate-50/30">
                        Chưa có học liệu nào trong mô-đun này.{' '}
                        <button
                          onClick={() => {
                            setTargetModuleId(mod.id);
                            setIsAddActivityOpen(true);
                          }}
                          className="text-[#0374b5] font-bold hover:underline"
                        >
                          + Thêm bài học, video, bài tập ngay
                        </button>
                      </div>
                    ) : (
                      activities.map((act) => {
                        return (
                          <div
                            key={act.id}
                            className="px-4 py-3 flex items-center justify-between border-b border-slate-200 last:border-b-0 hover:bg-slate-50/80 transition-colors group select-none"
                          >
                            {/* Left: Icon & Info (Click to view activity) */}
                            <div 
                              onClick={() => onSelectActivity(act.id)}
                              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            >
                              <span className="shrink-0 p-1.5 rounded-md bg-slate-100 group-hover:bg-sky-50 transition-colors">
                                {getActivityIcon(act.type)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs sm:text-sm font-medium text-slate-800 group-hover:text-[#0374b5] group-hover:underline truncate">
                                    {act.title}
                                  </p>
                                  {act.type === 'video' && act.videoUrl && (
                                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                                      Video
                                    </span>
                                  )}
                                  {act.type === 'assignment' && (
                                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">
                                      Bài tập
                                    </span>
                                  )}
                                  {act.type === 'quiz' && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                      Trắc nghiệm
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-2">
                                  <span>{act.description || (act.type === 'document' ? 'Xem trang' : act.type === 'video' ? 'Video bài giảng' : 'Làm bài tập')}</span>
                                  {act.dueDate && (
                                    <>
                                      <span>•</span>
                                      <span className="text-rose-500 font-semibold flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Hạn nộp: {act.dueDate}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Right: Actions (Edit, Delete, Check) */}
                            <div className="flex items-center gap-2 shrink-0 pl-3">
                              {/* Edit Activity Button */}
                              <button
                                onClick={() => setEditingActivity(act)}
                                className="p-1 rounded text-slate-400 hover:text-[#0374b5] hover:bg-slate-200 transition-colors opacity-70 group-hover:opacity-100"
                                title="Chỉnh sửa học liệu"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Activity Button */}
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn xóa bài học "${act.title}"?`)) {
                                    deleteCourseActivity(activeCourse.id, act.id);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-70 group-hover:opacity-100"
                                title="Xóa học liệu này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Status circle */}
                              <div 
                                onClick={() => onSelectActivity(act.id)}
                                className="cursor-pointer pl-1"
                              >
                                {act.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
                  placeholder="Ví dụ: BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điều kiện tiên quyết (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàn thành Bài trước đó"
                  value={modulePrereq}
                  onChange={(e) => setModulePrereq(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
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

      {/* MODAL 3: THÊM HỌC LIỆU / HOẠT ĐỘNG (ĐẦY ĐỦ TÍNH NĂNG LMS NHÓM 2) */}
      {isAddActivityOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 my-8">
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
                  actType === 'video'
                    ? 'bg-white text-[#0374b5] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>Video</span>
              </button>

              <button
                type="button"
                onClick={() => setActType('document')}
                className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  actType === 'document'
                    ? 'bg-white text-[#0374b5] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Link/Tài liệu</span>
              </button>

              <button
                type="button"
                onClick={() => setActType('assignment')}
                className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  actType === 'assignment'
                    ? 'bg-white text-[#0374b5] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Bài tập</span>
              </button>

              <button
                type="button"
                onClick={() => setActType('quiz')}
                className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  actType === 'quiz'
                    ? 'bg-white text-[#0374b5] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Trắc nghiệm</span>
              </button>

              <button
                type="button"
                onClick={() => setActType('forum')}
                className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  actType === 'forum'
                    ? 'bg-white text-[#0374b5] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Thảo luận</span>
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5">
              {/* Tiêu đề */}
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

              {/* Mô tả phụ */}
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

              {/* Trường riêng cho VIDEO */}
              {actType === 'video' && (
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
                    Hỗ trợ nhúng trực tiếp video YouTube hoặc file MP4 trên cloud.
                  </p>
                </div>
              )}

              {/* Trường riêng cho LINK / DOCUMENT */}
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

              {/* Trường riêng cho BÀI TẬP */}
              {actType === 'assignment' && (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/60 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">
                      Yêu cầu / Đề bài bài tập
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Hướng dẫn học viên thực hiện và nộp bài..."
                      value={actPrompt}
                      onChange={(e) => setActPrompt(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">
                        Hạn nộp (Deadline)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 31/12 lúc 23:59"
                        value={actDueDate}
                        onChange={(e) => setActDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                      />
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
                </div>
              )}

              {/* Trường riêng cho TRẮC NGHIỆM */}
              {actType === 'quiz' && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      Câu hỏi trắc nghiệm ({quizQuestions.length} câu)
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuizQuestions(prev => [
                        ...prev, 
                        {
                          id: `q${prev.length + 1}`,
                          question: `Câu hỏi ${prev.length + 1}?`,
                          options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
                          correctAnswer: 0
                        }
                      ])}
                      className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded text-[11px] font-bold"
                    >
                      + Thêm câu hỏi
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Bộ làm bài trắc nghiệm tự động chấm điểm cho học viên theo chuẩn Canvas.
                  </p>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 my-8">
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

              {/* Sửa Video URL */}
              {editingActivity.type === 'video' && (
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
              )}

              {/* Sửa Link / File URL */}
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
                </div>
              )}

              {/* Sửa Hạn nộp & Đề bài */}
              {editingActivity.type === 'assignment' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">
                      Yêu cầu / Đề bài
                    </label>
                    <textarea
                      rows={3}
                      value={editingActivity.assignmentPrompt || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, assignmentPrompt: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">
                      Hạn nộp
                    </label>
                    <input
                      type="text"
                      value={editingActivity.dueDate || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0374b5]"
                    />
                  </div>
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
    </div>
  );
};
