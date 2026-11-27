import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CanvasCourseNav, CourseNavTab } from './CanvasCourseNav';
import { CanvasModulesView } from './CanvasModulesView';
import { CanvasRightSidebar } from './CanvasRightSidebar';
import { CourseGradebookTracker } from './CourseGradebookTracker';
import { AIVirtualLab } from './AIVirtualLab';
import { defaultGrade6Course } from '../data/mockData';
import { API_BASE_URL, resolveBackendUrl } from '../services/api';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Award, 
  Layers, 
  Plus, 
  Send, 
  Folder, 
  Box, 
  CheckCircle2,
  UserCheck,
  Search,
  School,
  GraduationCap,
  Sparkles,
  BookOpen,
  UploadCloud,
  Download,
  Trash2,
  ExternalLink,
  File,
  FileCode,
  FileArchive,
  Film,
  Image as ImageIcon,
  Music,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Target
} from 'lucide-react';

interface CourseDetailProps {
  isCourseNavOpen?: boolean;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ isCourseNavOpen = true }) => {
  const { 
    activeCourse: contextActiveCourse, 
    activeModuleId,
    setActiveModuleId,
    activeCourseTab,
    setActiveCourseTab,
    isEmbedMode,
    courses,
    setCurrentView, 
    navigateToActivity, 
    forumTopics, 
    createForumTopic,
    addForumReply,
    currentUser, 
    certificates, 
    activeRole,
    enrollCourse,
    uploadCourseFile,
    deleteCourseFile,
    setIsLoginModalOpen
  } = useApp();

  const activeCourse = contextActiveCourse || 
    courses.find(c => c.code === '6AIAB01' || c.id === '6AIAB01' || (c.name && c.name.toLowerCase().includes('lớp 6'))) || 
    courses[0] || 
    defaultGrade6Course;

  const activeTab = (activeCourseTab as CourseNavTab) || 'modules';
  const setActiveTab = (tab: CourseNavTab) => {
    // Luôn thoát chế độ lọc 1 bài lẻ khi chuyển tab để Breadcrumb & nội dung luôn khớp chính xác 100%
    setActiveModuleId(null);
    setActiveCourseTab(tab);
  };
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [searchStudent, setSearchStudent] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  // File Manager States (Quản lý và tải lên tệp theo Thư mục Bài học chuẩn M9)
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [fileUploadSuccess, setFileUploadSuccess] = useState<string | null>(null);
  const [fileSearch, setFileSearch] = useState('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState('all');
  const [fileFolderFilter, setFileFolderFilter] = useState('all');
  const [uploadTargetFolder, setUploadTargetFolder] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const canManage = Boolean(
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'lecturer' ||
    activeRole === 'admin' ||
    activeRole === 'lecturer'
  );

  const isEnrolled = Boolean(
    currentUser?.role === 'admin' ||
    currentUser?.role === 'lecturer' ||
    activeRole === 'admin' ||
    activeRole === 'lecturer' ||
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' ||
    (currentUser?.enrolledCourses && currentUser.enrolledCourses.includes(activeCourse.id)) ||
    (activeCourse.enrolledStudents && activeCourse.enrolledStudents.some((s: any) => s.id === currentUser?.id || (currentUser?.email && s.email === currentUser.email)))
  );

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      await enrollCourse(activeCourse.id);
    } finally {
      setIsEnrolling(false);
    }
  };

  const courseTopics = forumTopics.filter(t => t.courseId === activeCourse.id);

  const enrolledStudents = activeCourse.enrolledStudents || [];
  const filteredEnrolledStudents = enrolledStudents.filter(st => {
    const q = searchStudent.toLowerCase();
    return (st.name || '').toLowerCase().includes(q) ||
           (st.email || '').toLowerCase().includes(q) ||
           (st.className || '').toLowerCase().includes(q) ||
           (st.school || '').toLowerCase().includes(q);
  });

  // Xác định thông tin Giáo viên phụ trách / Người tạo khóa học (ưu tiên Avatar & Tên tài khoản Google thật)
  const isCreatorCurrent = Boolean(
    currentUser?.email && (
      (activeCourse.instructor?.email && activeCourse.instructor.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
      (currentUser.email.toLowerCase().trim() === 'phanphiphu04@gmail.com')
    )
  );

  const isStockAvatar = (url?: string) => Boolean(
    url && (
      url.includes('unsplash.com') ||
      url.includes('photo-1507003211169') ||
      url.includes('photo-') ||
      url.includes('images.unsplash')
    )
  );

  const instructorAvatar = 
    (currentUser?.avatar && isCreatorCurrent && !isStockAvatar(currentUser.avatar))
      ? currentUser.avatar
      : (activeCourse.instructor?.avatar && !isStockAvatar(activeCourse.instructor.avatar))
        ? activeCourse.instructor.avatar
        : (currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' && currentUser?.avatar && !isStockAvatar(currentUser.avatar))
          ? currentUser.avatar
          : '';

  const instructorName = 
    (currentUser?.name && isCreatorCurrent && (!activeCourse.instructor?.name || activeCourse.instructor.name === 'Giáo viên' || activeCourse.instructor.name === 'Giáo viên phụ trách'))
      ? currentUser.name
      : (activeCourse.instructor?.name && activeCourse.instructor.name !== 'Giáo viên' && activeCourse.instructor.name !== 'Giáo viên phụ trách')
        ? activeCourse.instructor.name
        : (currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' && currentUser?.name ? currentUser.name : 'Phan Phi Phú');

  return (
    <div className="flex-1 flex min-w-0 bg-white">
      {/* 1. Left Secondary Course Navigation (Trang chủ, Thảo luận, Số điểm,...) */}
      <CanvasCourseNav 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        isOpen={isCourseNavOpen} 
      />

      {/* 2. Center Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Thanh chuyển Tab cho màn hình điện thoại / tablet (vì cột menu trái ẩn trên mobile) */}
        {!isEmbedMode && (
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
            {([
              { id: 'home', label: 'Trang chủ' },
              { id: 'modules', label: 'Nội dung học tập' },
              { id: 'grades', label: 'Tiến độ & Điểm' },
              { id: 'people', label: 'Thành viên' },
              { id: 'discussions', label: 'Thảo luận' },
              { id: 'files', label: 'Tập tin' },
              { id: 'syllabus', label: 'Lịch trình' },
              { id: 'resources3d', label: 'AI Lab' }
            ] as { id: CourseNavTab; label: string }[]).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === item.id
                    ? 'bg-[#0374b5] text-white border-[#0374b5] shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Banner Đăng Ký Khóa Học (Dành riêng cho học viên chưa ghi danh, ẩn khi nhúng iframe) */}
        {!isEnrolled && !isEmbedMode && (
          <div className="mx-4 sm:mx-8 mt-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border-2 border-[#0374b5]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#0374b5] text-white flex items-center justify-center shrink-0 shadow-md">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Bạn chưa đăng ký tham gia khóa học này!
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                  Bấm <strong>"Đăng Ký Khóa Học Ngay"</strong> để được ghi danh vào lớp, học tập cùng bạn bè và nộp bài tập cho giáo viên.
                </p>
              </div>
            </div>
            <button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className="px-5 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{isEnrolling ? 'Đang ghi danh...' : 'Đăng Ký Khóa Học Ngay'}</span>
            </button>
          </div>
        )}

        {/* Thanh Thông Tin Người Tạo Khóa Học & Lớp Học (ẩn khi nhúng iframe embed=1) */}
        {!isEmbedMode && (
        <div className="mx-4 sm:mx-8 mt-4 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {instructorAvatar ? (
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0374b5] text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-xs">
                  {instructorName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#0374b5] text-white text-[9px] font-black rounded-full shadow-2xs">
                GV
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {instructorName}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-[#0374b5] font-bold shrink-0">
                  Người tạo khóa học
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold shrink-0">
                  {activeCourse.gradeLevel || 'Lớp 6'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Email: {activeCourse.instructor?.email || 'phanphiphu04@gmail.com'} • {activeCourse.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
            {canManage && (
              <button
                onClick={() => setActiveTab('grades')}
                className="px-3 py-1 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Mở bảng theo dõi tiến độ, tỷ lệ xem video và sổ điểm của học sinh"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Tiến độ & Sổ điểm HS</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('people')}
              className="px-3 py-1 bg-white hover:bg-sky-50 border border-slate-200 hover:border-[#0374b5] rounded-xl font-bold text-slate-700 hover:text-[#0374b5] transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Xem danh sách các bạn cùng lớp khóa học này"
            >
              <Users className="w-3.5 h-3.5 text-[#0374b5]" />
              <span>{activeCourse.enrolledStudentsCount || enrolledStudents.length} học viên</span>
            </button>
            {isEnrolled ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đã ghi danh
              </span>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="px-3.5 py-1 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-xl font-bold transition-all shadow-xs"
              >
                Đăng ký học +
              </button>
            )}
          </div>
        </div>
        )}

        {/* Trang chủ khóa học (home): Tổng quan mục tiêu, tiến độ & Thông báo lớp học */}
        {activeTab === 'home' && !activeModuleId && !isEmbedMode && (() => {
          const allCourseActs = (activeCourse.modules || []).flatMap(m => m.activities || []);
          const allHtmlLabActs = allCourseActs.filter(a => a.type === 'document' && /\.html?(\?.*)?$/i.test(a.fileUrl || ''));
          const htmlLabActs = allHtmlLabActs.slice(0, 2);
          const featuredQuizActs = allCourseActs.filter(a => a.type === 'quiz').slice(0, 2);
          return (
          <div className="mx-4 sm:mx-8 mt-4 space-y-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0b2f52] via-[#035d94] to-[#0374b5] text-white shadow-md space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-2xs text-white text-[11px] font-bold tracking-wide">
                      <BookOpen className="w-3.5 h-3.5" /> {activeCourse.code} · {activeCourse.gradeLevel || 'Phổ thông'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-400/20 border border-sky-200/30 text-sky-100 text-[11px] font-semibold">
                      {activeCourse.category}
                    </span>
                    {allHtmlLabActs.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/25 border border-emerald-200/40 text-emerald-100 text-[11px] font-bold">
                        {allHtmlLabActs.length} học liệu tương tác HTML5
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                    {activeCourse.name}
                  </h2>
                  <p className="text-xs sm:text-[13px] text-sky-100/95 leading-relaxed">
                    {activeCourse.description || 'Khóa học trực tuyến tương tác theo lộ trình chuẩn trên LMS Nhóm 2.'}
                  </p>
                </div>
                <div className="shrink-0 bg-white/12 backdrop-blur-xs px-5 py-3.5 rounded-2xl border border-white/20 text-center min-w-[155px]">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-100">Tiến độ hoàn thành</div>
                  <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-0.5">{activeCourse.progress || 0}%</div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden my-1.5">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, activeCourse.progress || 0)}%` }} />
                  </div>
                  <div className="text-[11px] text-sky-100 font-medium">
                    {activeCourse.completedActivities || 0}/{activeCourse.totalActivities || 0} hoạt động xong
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => setActiveTab('modules')}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 text-[#0b3b64] text-xs font-bold shadow-xs transition-all"
                >
                  Vào Nội dung học tập ({(activeCourse.modules || []).length} bài)
                </button>
                {htmlLabActs.map(lab => (
                  <button
                    key={lab.id}
                    type="button"
                    onClick={() => navigateToActivity(activeCourse.id, lab.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    {lab.title.length > 42 ? lab.title.slice(0, 42) + '…' : lab.title}
                  </button>
                ))}
                {featuredQuizActs.map((qz) => (
                  <button
                    key={qz.id}
                    type="button"
                    onClick={() => navigateToActivity(activeCourse.id, qz.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-400/95 hover:bg-amber-300 text-slate-900 text-xs font-bold shadow-xs transition-all"
                  >
                    {qz.title.length > 36 ? qz.title.slice(0, 36) + '…' : qz.title}
                    {qz.timeLimitMinutes ? ` (${qz.timeLimitMinutes}p)` : ''}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setActiveTab('syllabus')}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-semibold transition-colors"
                >
                  Xem Lịch trình & Mục tiêu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('files')}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-semibold transition-colors"
                >
                  Thư mục Học liệu ({(activeCourse.files || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('resources3d')}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-semibold transition-colors"
                >
                  Phòng Lab AI & HTML5
                </button>
              </div>
            </div>

            {(activeCourse.announcements || []).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Thông báo lớp học</h3>
                {(activeCourse.announcements || []).slice(0, 3).map(anc => (
                  <div
                    key={anc.id}
                    className={`p-3.5 rounded-2xl border text-xs ${anc.isImportant ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {anc.isImportant && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px]">QUAN TRỌNG</span>
                      )}
                      <h4 className="font-extrabold text-slate-900 text-sm">{anc.title}</h4>
                    </div>
                    <p className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">{anc.content}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">{anc.author} • {anc.createdAt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })()}

        {/* Tab 1: Nội dung học tập (Modules View - EXACTLY LIKE SCREENSHOT) */}
        {(activeTab === 'modules' || activeTab === 'home') && (
          <CanvasModulesView 
            onSelectActivity={(actId) => navigateToActivity(activeCourse.id, actId)} 
            onOpenGradebook={() => setActiveTab('grades')}
          />
        )}

        {/* Tab 2: Thảo luận (Discussions) */}
        {activeTab === 'discussions' && (
          <div className="p-6 max-w-4xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Diễn đàn thảo luận khóa học</h2>
                <p className="text-xs text-slate-500">Trao đổi học tập giữa học sinh và giáo viên</p>
              </div>
              <button
                onClick={() => setIsCreatingTopic(!isCreatingTopic)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thảo luận mới</span>
              </button>
            </div>

            {isCreatingTopic && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newTopicTitle.trim()) {
                    createForumTopic(activeCourse.id, newTopicTitle.trim(), newTopicContent.trim()).then(ok => {
                      if (!ok) return; // giữ nguyên nội dung để người dùng thử lại
                      setNewTopicTitle('');
                      setNewTopicContent('');
                      setIsCreatingTopic(false);
                    });
                  }
                }}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
              >
                <input
                  type="text"
                  placeholder="Tiêu đề câu hỏi / thảo luận..."
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                  required
                />
                <textarea
                  rows={3}
                  placeholder="Nội dung chi tiết..."
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTopic(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-md"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-[#0374b5] text-white rounded-md"
                  >
                    Đăng chủ đề
                  </button>
                </div>
              </form>
            )}

            {courseTopics.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400 italic">
                Chưa có chủ đề thảo luận nào. Hãy là người đầu tiên đặt câu hỏi!
              </p>
            ) : (
              <div className="space-y-3">
                {courseTopics.map(topic => {
                  const isOpen = expandedTopicId === topic.id;
                  const replies = topic.replies || [];
                  const draft = replyDrafts[topic.id] || '';
                  return (
                    <div key={topic.id} className="bg-white border border-slate-200 rounded-2xl hover:border-sky-300 transition-colors shadow-2xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedTopicId(isOpen ? null : topic.id)}
                        className="w-full text-left p-4 space-y-2 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#0374b5] shrink-0" />
                            <span>{topic.title}</span>
                          </h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0374b5] border border-sky-200 text-[11px] font-bold">
                              {replies.length} phản hồi
                            </span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>
                        <p className={`text-xs text-slate-600 whitespace-pre-line leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                          {topic.content}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>Đăng bởi: <strong className="text-slate-600">{topic.author?.name || 'Thành viên'}</strong></span>
                          <span>•</span>
                          <span>{topic.createdAt}</span>
                          <span className="ml-auto text-[#0374b5] font-bold">
                            {isOpen ? 'Thu gọn' : 'Mở xem & Trả lời →'}
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-3 bg-slate-50/70 border-t border-slate-200 space-y-3">
                          {replies.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Chưa có phản hồi nào cho chủ đề này.</p>
                          ) : (
                            <div className="space-y-2">
                              {replies.map((rep: any, rIdx: number) => (
                                <div
                                  key={rep.id || rIdx}
                                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                                    rep.isInstructorAnswer
                                      ? 'bg-sky-50 border-sky-200'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <strong className="text-slate-900">{rep.author?.name || 'Thành viên'}</strong>
                                      {rep.isInstructorAnswer && (
                                        <span className="px-1.5 py-0.2 rounded bg-[#0374b5] text-white text-[9px] font-black">
                                          GV / QTV
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400">{rep.createdAt}</span>
                                  </div>
                                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">{rep.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Form gửi phản hồi trực tiếp */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!draft.trim()) return;
                              if (!currentUser?.id) {
                                setIsLoginModalOpen(true);
                                return;
                              }
                              addForumReply(topic.id, draft.trim());
                              setReplyDrafts(prev => ({ ...prev, [topic.id]: '' }));
                            }}
                            className="flex items-center gap-2 pt-1"
                          >
                            <input
                              type="text"
                              value={draft}
                              onChange={(e) => setReplyDrafts(prev => ({ ...prev, [topic.id]: e.target.value }))}
                              placeholder="Viết câu trả lời hoặc bình luận của bạn..."
                              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#0374b5]"
                            />
                            <button
                              type="submit"
                              disabled={!draft.trim()}
                              className="px-3.5 py-2 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Gửi</span>
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Số điểm & Theo dõi tiến độ học sinh (Gradebook & Progress Tracker) */}
        {activeTab === 'grades' && (
          <CourseGradebookTracker
            course={activeCourse}
            canManage={canManage}
            currentUser={currentUser}
            onNavigateToModules={() => setActiveTab('modules')}
          />
        )}

        {/* Tab 4: Thành viên (People - Giảng viên & Học viên cùng lớp) */}
        {activeTab === 'people' && (
          <div className="p-6 max-w-5xl space-y-6">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Thành viên lớp học: {activeCourse.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Danh sách giáo viên phụ trách và các bạn học viên cùng lớp đã đăng ký khóa học này
                </p>
              </div>
              <span className="px-3 py-1 bg-[#0374b5]/10 text-[#0374b5] text-xs font-black rounded-full self-start sm:self-auto">
                {(enrolledStudents.length) + 1} thành viên
              </span>
            </div>

            {/* Section 1: Giáo viên phụ trách / Người tạo khóa học */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Giáo viên phụ trách & Người tạo khóa học
              </h3>
              <div className="p-4 bg-gradient-to-r from-sky-50 via-blue-50/50 to-indigo-50/50 rounded-2xl border border-sky-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {instructorAvatar ? (
                      <img 
                        src={instructorAvatar} 
                        alt={instructorName} 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#0374b5] text-white flex items-center justify-center font-bold text-base border-2 border-white shadow-xs">
                        {instructorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#0374b5] text-white text-[9px] font-black rounded-full shadow-2xs">
                      GV
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {instructorName}
                      </h4>
                      <span className="px-2 py-0.5 bg-[#0374b5] text-white text-[10px] font-black rounded-full">
                        Giáo viên
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Email: <strong>{activeCourse.instructor?.email || 'phanphiphu04@gmail.com'}</strong> • Chức danh: {activeCourse.instructor?.title || 'Giáo viên Tin học'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
                  Người tạo khóa học
                </span>
              </div>
            </div>

            {/* Section 2: Danh sách các học viên cùng lớp đã đăng ký */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Danh sách học viên cùng lớp ({enrolledStudents.length} bạn đã đăng ký)
                  </h3>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('grades')}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] text-[11px] font-bold transition-colors"
                    >
                      Xem tiến độ chi tiết →
                    </button>
                  )}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tên, lớp, trường..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  />
                </div>
              </div>

              {enrolledStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 bg-sky-100 text-[#0374b5] rounded-2xl flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Chưa có học viên nào ghi danh</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Hiện tại lớp học này chưa có học viên nào đăng ký.
                    </p>
                  </div>
                  {!isEnrolled && (
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Đăng ký tham gia ngay</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3.5 w-12 text-center">STT</th>
                          <th className="py-2.5 px-4">Học viên</th>
                          <th className="py-2.5 px-4">Lớp học</th>
                          <th className="py-2.5 px-4">Trường học</th>
                          <th className="py-2.5 px-4">Ngày đăng ký</th>
                          <th className="py-2.5 px-4 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEnrolledStudents.map((st, idx) => {
                          const isMe = st.id === currentUser.id || (currentUser.email && st.email === currentUser.email);
                          return (
                            <tr key={st.id || idx} className={`hover:bg-slate-50/80 transition-colors ${isMe ? 'bg-sky-50/30' : ''}`}>
                              <td className="py-2.5 px-3.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  {st.avatar ? (
                                    <img src={st.avatar} alt={st.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#0374b5] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                      {st.name?.charAt(0)?.toUpperCase() || 'H'}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{st.name}</span>
                                      {isMe && (
                                        <span className="px-1.5 py-0.2 bg-[#0374b5] text-white text-[9px] font-black rounded-full">
                                          Bạn
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[11px] text-slate-400">{st.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-bold text-slate-800">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                                  {st.className || 'Chưa cập nhật'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-600 font-medium">
                                {st.school || 'LMS Nhóm 2'}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500 font-medium">
                                {st.enrolledAt || 'Gần đây'}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {st.status || 'Đang học'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Các tập tin (Files) - Bộ máy Quản lý & Tải lên tệp tùy ý */}
        {activeTab === 'files' && (
          <div className="p-4 sm:p-6 max-w-5xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-[#0374b5]" />
                  <span>Tập tin học liệu khóa học</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý và tải lên các tệp học liệu tùy ý (PDF, Word, Excel, PowerPoint, Ảnh, Video, ZIP, Mã nguồn...) cho lớp học.
                </p>
              </div>
              <div className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                {(activeCourse.files || []).length} tệp tài liệu
              </div>
            </div>

            {/* Khu vực Tải lên tệp theo Thư mục Bài học (Chỉ GV / Quản trị viên) */}
            {canManage && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files) {
                    const files = e.dataTransfer.files;
                    const uploadMultiple = async () => {
                      if (!files || files.length === 0) return;
                      setIsUploadingFile(true);
                      setFileUploadError(null);
                      setFileUploadSuccess(null);
                      try {
                        const matchedMod = (activeCourse.modules || []).find(m => m.title === uploadTargetFolder);
                        let count = 0;
                        for (let i = 0; i < files.length; i++) {
                          const f = files[i];
                          if (f.size > 100 * 1024 * 1024) throw new Error(`Tệp "${f.name}" vượt quá 100MB.`);
                          await uploadCourseFile(activeCourse.id, f, fileDescription, uploadTargetFolder, matchedMod?.id || '');
                          count++;
                        }
                        setFileUploadSuccess(`Đã tải lên thành công ${count} tệp vào "${uploadTargetFolder || 'Tài liệu chung'}".`);
                        setFileDescription('');
                        setTimeout(() => setFileUploadSuccess(null), 4000);
                      } catch (err: any) {
                        setFileUploadError(err.message || 'Lỗi tải tệp lên');
                      } finally {
                        setIsUploadingFile(false);
                      }
                    };
                    uploadMultiple();
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  isDragOver 
                    ? 'border-[#0374b5] bg-sky-50/70 scale-[0.99]' 
                    : 'border-slate-300 hover:border-[#0374b5] bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  id="course-file-upload-input"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const uploadMultiple = async () => {
                      setIsUploadingFile(true);
                      setFileUploadError(null);
                      setFileUploadSuccess(null);
                      try {
                        const matchedMod = (activeCourse.modules || []).find(m => m.title === uploadTargetFolder);
                        let count = 0;
                        for (let i = 0; i < files.length; i++) {
                          const f = files[i];
                          if (f.size > 100 * 1024 * 1024) throw new Error(`Tệp "${f.name}" vượt quá 100MB.`);
                          await uploadCourseFile(activeCourse.id, f, fileDescription, uploadTargetFolder, matchedMod?.id || '');
                          count++;
                        }
                        setFileUploadSuccess(`Đã tải lên thành công ${count} tệp vào "${uploadTargetFolder || 'Tài liệu chung'}".`);
                        setFileDescription('');
                        setTimeout(() => setFileUploadSuccess(null), 4000);
                      } catch (err: any) {
                        setFileUploadError(err.message || 'Lỗi tải tệp lên');
                      } finally {
                        setIsUploadingFile(false);
                        e.target.value = '';
                      }
                    };
                    uploadMultiple();
                  }}
                />

                <div className="max-w-xl mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-[#0374b5] flex items-center justify-center mx-auto shadow-2xs">
                    {isUploadingFile ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#0374b5]" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-[#0374b5]" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {isUploadingFile ? 'Đang tải tệp lên hệ thống...' : 'Tải học liệu vào đúng Thư mục Bài học (Chuẩn tổ chức M9)'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Chọn thư mục bài học bên dưới rồi kéo thả hoặc chọn tệp (PDF, Word, PowerPoint, Video, ZIP, Mã nguồn... tối đa 100MB).
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <select
                      value={uploadTargetFolder}
                      onChange={(e) => setUploadTargetFolder(e.target.value)}
                      disabled={isUploadingFile}
                      className="px-3 py-1.5 bg-white border border-sky-300 rounded-xl text-xs font-bold text-slate-800 w-full sm:w-56 focus:outline-none focus:border-[#0374b5]"
                      title="Chọn thư mục bài học chứa tệp"
                    >
                      <option value="">📁 Tài liệu chung khóa học</option>
                      {(activeCourse.modules || []).map((m, i) => (
                        <option key={m.id} value={m.title}>
                          📂 Bài {i + 1}: {m.title.replace(/^BÀI\s*\d+\s*[:.\-]\s*/i, '').slice(0, 42)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ghi chú hoạt động / thứ tự sử dụng..."
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      disabled={isUploadingFile}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 w-full sm:w-56 focus:outline-none focus:border-[#0374b5]"
                    />
                    <label
                      htmlFor="course-file-upload-input"
                      className={`px-4 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
                        isUploadingFile ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Chọn tệp</span>
                    </label>
                  </div>

                  {fileUploadSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{fileUploadSuccess}</span>
                    </div>
                  )}

                  {fileUploadError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{fileUploadError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Thanh Tìm kiếm & Lọc phân loại tệp */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên tệp học liệu..."
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0374b5]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-bold">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'pdf', label: 'PDF' },
                  { id: 'word', label: 'Word' },
                  { id: 'excel', label: 'Excel' },
                  { id: 'powerpoint', label: 'PowerPoint' },
                  { id: 'image', label: 'Ảnh' },
                  { id: 'video', label: 'Video/Audio' },
                  { id: 'archive', label: 'Nén (ZIP)' },
                  { id: 'code', label: 'Code' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFileCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-xl transition-all shrink-0 ${
                      fileCategoryFilter === cat.id
                        ? 'bg-[#0374b5] text-white shadow-xs'
                        : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cây lọc & hiển thị tập tin theo từng Thư mục Bài học (Chuẩn tổ chức M9) */}
            {(() => {
              const allFiles = activeCourse.files || [];
              const moduleFolders = (activeCourse.modules || []).map(m => m.title);
              const extraFolders = Array.from(new Set(allFiles.map(f => (f.folder || '').trim()).filter(fn => fn && !moduleFolders.includes(fn))));
              const orderedFolders = [...moduleFolders, ...extraFolders, 'Tài liệu chung'];
              const getFileFolder = (f: any) => (f.folder && f.folder.trim()) ? f.folder.trim() : 'Tài liệu chung';

              const filtered = allFiles.filter(f => {
                const folderName = getFileFolder(f);
                if (fileFolderFilter !== 'all' && folderName !== fileFolderFilter) return false;
                const matchSearch = !fileSearch || f.name.toLowerCase().includes(fileSearch.toLowerCase()) || (f.description || '').toLowerCase().includes(fileSearch.toLowerCase()) || folderName.toLowerCase().includes(fileSearch.toLowerCase());
                if (!matchSearch) return false;
                if (fileCategoryFilter === 'all') return true;
                if (fileCategoryFilter === 'video') return f.fileType === 'video' || f.fileType === 'audio';
                return f.fileType === fileCategoryFilter;
              });

              const groupedFolders = orderedFolders
                .map(folderName => ({
                  folderName,
                  files: filtered.filter(f => getFileFolder(f) === folderName)
                }))
                .filter(g => g.files.length > 0);

              return (
                <div className="space-y-4">
                  {/* Thanh chọn nhanh thư mục bài học */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setFileFolderFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 transition-all ${
                        fileFolderFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#0374b5]'
                      }`}
                    >
                      📁 Tất cả thư mục ({allFiles.length})
                    </button>
                    {orderedFolders.map((fn, idx) => {
                      const cnt = allFiles.filter(f => getFileFolder(f) === fn).length;
                      const isMod = idx < moduleFolders.length;
                      const shortLabel = fn === 'Tài liệu chung'
                        ? 'Tài liệu chung'
                        : isMod
                          ? `Bài ${idx + 1}`
                          : fn.slice(0, 24);
                      return (
                        <button
                          key={fn}
                          type="button"
                          onClick={() => setFileFolderFilter(fn)}
                          title={fn}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 transition-all flex items-center gap-1.5 ${
                            fileFolderFilter === fn
                              ? 'bg-[#0374b5] text-white border-[#0374b5]'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#0374b5]'
                          }`}
                        >
                          <span>📂 {shortLabel}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            fileFolderFilter === fn ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>{cnt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {groupedFolders.length === 0 ? (
                    <div className="border border-slate-200 rounded-2xl p-10 text-center space-y-2 bg-white">
                      <Folder className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-700">
                        {allFiles.length === 0 ? 'Chưa có tập tin nào được tải lên khóa học' : 'Không tìm thấy tập tin trong thư mục này'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {allFiles.length === 0 
                          ? 'Chọn thư mục bài học ở trên rồi kéo thả hoặc tải tệp lên để sắp xếp kho học liệu theo kịch bản sư phạm.'
                          : 'Thử chọn "Tất cả thư mục" hoặc đổi từ khóa tìm kiếm.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedFolders.map(({ folderName, files: folderFiles }) => (
                        <div key={folderName} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                          <div className="px-4 py-2.5 bg-sky-50/70 border-b border-slate-200 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Folder className="w-4 h-4 text-[#0374b5] shrink-0" />
                              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                                {folderName}
                              </h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-white border border-sky-200 text-[10px] font-bold text-[#0374b5] shrink-0">
                              {folderFiles.length} học liệu
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                                <tr>
                                  <th className="py-2.5 px-4">Tên tệp & Mô tả</th>
                                  <th className="py-2.5 px-4">Dung lượng</th>
                                  <th className="py-2.5 px-4">Người tải lên</th>
                                  <th className="py-2.5 px-4">Thời gian</th>
                                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {folderFiles.map(file => {
                                  const isStaffUser = Boolean(
                                    currentUser && (
                                      currentUser.role === 'admin' ||
                                      currentUser.role === 'lecturer' ||
                                      currentUser.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' ||
                                      file.uploadedBy?.email === currentUser.email
                                    )
                                  );

                                  let typeIcon = <File className="w-5 h-5 text-slate-500" />;
                                  let badgeBg = 'bg-slate-100 text-slate-700';

                                  if (file.fileType === 'pdf') {
                                    typeIcon = <FileText className="w-5 h-5 text-rose-600" />;
                                    badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
                                  } else if (file.fileType === 'word') {
                                    typeIcon = <FileText className="w-5 h-5 text-blue-600" />;
                                    badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                                  } else if (file.fileType === 'excel') {
                                    typeIcon = <FileText className="w-5 h-5 text-emerald-600" />;
                                    badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                  } else if (file.fileType === 'powerpoint') {
                                    typeIcon = <FileText className="w-5 h-5 text-amber-600" />;
                                    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                                  } else if (file.fileType === 'image') {
                                    typeIcon = <ImageIcon className="w-5 h-5 text-purple-600" />;
                                    badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                                  } else if (file.fileType === 'video') {
                                    typeIcon = <Film className="w-5 h-5 text-pink-600" />;
                                    badgeBg = 'bg-pink-50 text-pink-700 border-pink-200';
                                  } else if (file.fileType === 'audio') {
                                    typeIcon = <Music className="w-5 h-5 text-cyan-600" />;
                                    badgeBg = 'bg-cyan-50 text-cyan-700 border-cyan-200';
                                  } else if (file.fileType === 'archive') {
                                    typeIcon = <FileArchive className="w-5 h-5 text-orange-600" />;
                                    badgeBg = 'bg-orange-50 text-orange-700 border-orange-200';
                                  } else if (file.fileType === 'code') {
                                    typeIcon = <FileCode className="w-5 h-5 text-teal-600" />;
                                    badgeBg = 'bg-teal-50 text-teal-700 border-teal-200';
                                  }

                                  const resolvedFileUrl = resolveBackendUrl(file.url);
                                  const downloadUrl = file.filename
                                    ? `${API_BASE_URL}/files/download/${encodeURIComponent(file.filename)}?name=${encodeURIComponent(file.name)}`
                                    : resolvedFileUrl;

                                  return (
                                    <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                                            {typeIcon}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <a
                                                href={resolvedFileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-slate-900 hover:text-[#0374b5] transition-colors truncate block max-w-xs sm:max-w-md"
                                                title={file.name}
                                              >
                                                {file.name}
                                              </a>
                                              <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${badgeBg}`}>
                                                {file.fileType || 'tệp'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-slate-600 font-bold whitespace-nowrap">
                                        {file.size}
                                      </td>
                                      <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                          {file.uploadedBy?.avatar ? (
                                            <img 
                                              src={file.uploadedBy.avatar} 
                                              alt="" 
                                              referrerPolicy="no-referrer"
                                              className="w-6 h-6 rounded-full object-cover border border-slate-200" 
                                            />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-[#0374b5] text-white flex items-center justify-center font-bold text-[10px]">
                                              {(file.uploadedBy?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <span className="text-slate-700 font-semibold truncate max-w-[120px]">
                                            {file.uploadedBy?.name || 'Thành viên'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                        {file.uploadedAt || 'Gần đây'}
                                      </td>
                                      <td className="py-3 px-4 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1.5">
                                          <a
                                            href={resolvedFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#0374b5] hover:text-white text-slate-600 transition-colors"
                                            title="Xem tệp trong tab mới"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                          <a
                                            href={downloadUrl}
                                            download={file.name}
                                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-[#0374b5] hover:text-white text-[#0374b5] transition-colors"
                                            title="Tải tệp xuống máy tính"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                          {isStaffUser && (
                                            <button
                                              onClick={async () => {
                                                if (window.confirm(`Bạn có chắc muốn xóa tệp "${file.name}" khỏi khóa học?`)) {
                                                  setDeletingFileId(file.id);
                                                  try {
                                                    await deleteCourseFile(activeCourse.id, file.id);
                                                  } finally {
                                                    setDeletingFileId(null);
                                                  }
                                                }
                                              }}
                                              disabled={deletingFileId === file.id}
                                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors disabled:opacity-50"
                                              title="Xóa tệp"
                                            >
                                              {deletingFileId === file.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 6: Lịch trình khóa học & Đề cương (Syllabus chuẩn BT4) */}
        {activeTab === 'syllabus' && (() => {
          const courseMods = activeCourse.modules || [];
          const deadlineActs = courseMods.flatMap(m =>
            (m.activities || [])
              .filter(a => a.dueDate || a.dueDateIso)
              .map(a => ({ ...a, moduleTitle: m.title }))
          );
          return (
            <div className="p-6 max-w-5xl space-y-6">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#0374b5]" />
                    <span>Lịch trình & Đề cương khóa học (Syllabus)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tổng quan mục tiêu, phân công bài học, trình tự học tập và các mốc hạn nộp bài
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0374b5] text-xs font-bold self-start sm:self-auto">
                  {activeCourse.semester || 'Học kỳ 1'} • {activeCourse.academicYear || '2026-2027'}
                </span>
              </div>

              {/* Khung thông tin đề cương tổng quát */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="space-y-1.5">
                  <p><strong className="text-slate-900">Khóa học:</strong> {activeCourse.name} ({activeCourse.code})</p>
                  <p><strong className="text-slate-900">Khối lớp:</strong> {activeCourse.gradeLevel || 'Lớp 6'}</p>
                  <p><strong className="text-slate-900">Chuyên đề:</strong> {activeCourse.category || 'Chuyên đề AI'}</p>
                </div>
                <div className="space-y-1.5">
                  <p><strong className="text-slate-900">Giáo viên phụ trách:</strong> {instructorName}</p>
                  <p><strong className="text-slate-900">Mục tiêu tổng quát:</strong> {activeCourse.description || 'Cung cấp kiến thức và kỹ năng thực hành toàn diện về chuyên đề.'}</p>
                </div>
              </div>

              {/* Lộ trình chi tiết từng Bài học */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0374b5]" />
                  <span>Lộ trình {courseMods.length} Bài học & Mục tiêu sư phạm</span>
                </h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="divide-y divide-slate-100">
                    {courseMods.map((m, idx) => {
                      const acts = m.activities || [];
                      return (
                        <div key={m.id} className="p-4 hover:bg-sky-50/40 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-sky-100 text-[#0374b5] text-[10px] font-black">
                                Bài {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveModuleId(m.id);
                                  setActiveCourseTab('modules');
                                }}
                                className="text-sm font-extrabold text-slate-900 hover:text-[#0374b5] hover:underline text-left"
                              >
                                {m.title}
                              </button>
                              {m.ownerName && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                                  Phụ trách: {m.ownerName}
                                </span>
                              )}
                            </div>
                            {m.learningObjectives ? (
                              <div className="text-xs text-slate-700 leading-relaxed bg-sky-50/60 p-3 rounded-xl border border-sky-100 space-y-1">
                                <div className="font-extrabold text-[#0374b5] text-[11px] uppercase tracking-wider">Mục tiêu bài học</div>
                                <p className="whitespace-pre-line">{m.learningObjectives}</p>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 self-start">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                              {acts.length} học liệu
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModuleId(m.id);
                                setActiveCourseTab('modules');
                              }}
                              className="px-3 py-1 rounded-lg bg-[#0374b5] hover:bg-[#025a8c] text-white text-[11px] font-bold transition-colors"
                            >
                              Mở bài →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lịch Hạn nộp bài tập & Kiểm tra */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Lịch Hạn nộp bài tập & Kiểm tra ({deadlineActs.length})</span>
                </h3>
                {deadlineActs.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-500 text-center">
                    Hiện chưa có bài tập hoặc bài kiểm tra nào đặt hạn nộp cụ thể.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                    {deadlineActs.map(act => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => navigateToActivity(activeCourse.id, act.id)}
                        className="w-full text-left p-3.5 hover:bg-amber-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{act.title}</div>
                          <div className="text-[11px] text-slate-400">{act.moduleTitle}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px] self-start sm:self-auto shrink-0">
                          ⏰ Hạn: {act.dueDate || act.dueDateIso}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Tab 7: Kho học liệu số & Phòng thí nghiệm Tương tác AI */}
        {activeTab === 'resources3d' && <AIVirtualLab />}
      </div>

      {/* 3. Right Action Sidebar (Xem luồng khóa học, Xem lịch, Cần làm) — ẩn khi đang nhúng iframe embed=1 */}
      {!isEmbedMode && <CanvasRightSidebar onNavigateTab={setActiveTab} />}
    </div>
  );
};
