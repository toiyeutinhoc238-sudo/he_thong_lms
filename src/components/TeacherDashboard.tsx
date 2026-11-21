import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CourseGradebookTracker } from './CourseGradebookTracker';
import {
  Plus,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  Layers,
  Bell
} from 'lucide-react';
import { Activity } from '../types';

export const TeacherDashboard: React.FC = () => {
  const {
    currentUser,
    courses,
    addCourseActivity,
    addAnnouncement,
    navigateToCourse
  } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedTab, setSelectedTab] = useState<'progress' | 'modules' | 'announcements'>('progress');

  // Form states for adding new activity
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<Activity['type']>('video');
  const [newDuration, setNewDuration] = useState(20);
  const [newDescription, setNewDescription] = useState('');

  // Form states for announcement
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancImportant, setAncImportant] = useState(false);
  const [isAncSuccess, setIsAncSuccess] = useState(false);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0] || null;

  useEffect(() => {
    if (!selectedCourseId && courses[0]?.id) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !targetModuleId || !selectedCourse) return;

    addCourseActivity(selectedCourse.id, targetModuleId, {
      title: newTitle.trim(),
      type: newType,
      durationMinutes: Number(newDuration) || 15,
      description: newDescription.trim(),
      isRequired: true
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddActivityOpen(false);
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim() || !selectedCourse) return;

    const ok = await addAnnouncement(selectedCourse.id, ancTitle.trim(), ancContent.trim(), ancImportant);
    if (!ok) return;
    setAncTitle('');
    setAncContent('');
    setIsAncSuccess(true);
    setTimeout(() => setIsAncSuccess(false), 3000);
  };

  if (!selectedCourse && courses.length === 0) {
    return (
      <div className="flex-1 m-6 self-start bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Chưa có khóa học nào để quản lý</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Hãy tạo khóa học mới trong mục "Khóa học" để bắt đầu giảng dạy và theo dõi tiến độ học sinh.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 w-full p-5 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-[#0374b5] via-sky-700 to-indigo-900 rounded-3xl p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
              Trung tâm Giảng dạy & Giám sát • LMS Nhóm 2
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              Quản Lý Giảng Dạy & Theo Dõi Tiến Độ Học Sinh
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm">
              Giáo viên: <strong>{currentUser.name || 'Giáo viên'}</strong> • {currentUser.email}
            </p>
          </div>

          {courses.length > 0 && selectedCourse && (
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 space-y-2 shrink-0">
              <label className="text-xs text-sky-100 block font-semibold">
                Chọn khóa học đang theo dõi:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCourse.id}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="bg-white text-slate-900 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl focus:outline-none w-full sm:w-64"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => navigateToCourse(selectedCourse.id)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0"
                  title="Mở trang chi tiết khóa học"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs Workspace */}
      {selectedCourse && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-3 border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTab('progress')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTab === 'progress'
                    ? 'bg-[#0374b5] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Theo dõi Tiến độ & Sổ điểm Học sinh</span>
              </button>

              <button
                onClick={() => setSelectedTab('modules')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTab === 'modules'
                    ? 'bg-[#0374b5] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Quản lý Bài học ({selectedCourse.modules?.length || 0})</span>
              </button>

              <button
                onClick={() => setSelectedTab('announcements')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTab === 'announcements'
                    ? 'bg-[#0374b5] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Phát Thông báo Lớp học</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigateToCourse(selectedCourse.id)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-sky-50 text-[#0374b5] text-xs font-bold shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Vào trang khóa học</span>
            </button>
          </div>

          {/* Tab 1: Full Student Progress & Gradebook Center */}
          {selectedTab === 'progress' && (
            <CourseGradebookTracker
              course={selectedCourse}
              canManage={true}
              currentUser={currentUser}
              onNavigateToModules={() => navigateToCourse(selectedCourse.id)}
            />
          )}

          {/* Tab 2: Quick Module & Activity Management */}
          {selectedTab === 'modules' && (
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Cấu trúc Chuyên đề & Hoạt động học tập
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thêm nhanh video bài giảng, tài liệu, đề trắc nghiệm hoặc bài tập nộp trực tuyến
                  </p>
                </div>

                {selectedCourse.modules && selectedCourse.modules.length > 0 && (
                  <button
                    onClick={() => {
                      setTargetModuleId(selectedCourse.modules[0]?.id || '');
                      setIsAddActivityOpen(true);
                    }}
                    className="px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm hoạt động mới</span>
                  </button>
                )}
              </div>

              {isAddActivityOpen && (
                <form onSubmit={handleCreateActivity} className="p-5 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Tạo hoạt động giảng dạy mới
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Thuộc Bài học nào?</label>
                      <select
                        value={targetModuleId}
                        onChange={(e) => setTargetModuleId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                        required
                      >
                        {(selectedCourse.modules || []).map(m => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Loại hình hoạt động</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                      >
                        <option value="video">Video bài giảng</option>
                        <option value="document">Tài liệu / Slide giáo trình</option>
                        <option value="assignment">Bài tập nộp trực tuyến</option>
                        <option value="quiz">Bài kiểm tra trắc nghiệm</option>
                        <option value="forum">Chủ đề thảo luận</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề hoạt động</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ví dụ: Video bài giảng: Khám phá AI..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#0374b5]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Thời lượng dự kiến (phút)</label>
                      <input
                        type="number"
                        value={newDuration}
                        onChange={(e) => setNewDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Mục tiêu hoặc tóm tắt..."
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddActivityOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0374b5] hover:bg-[#025a8c] text-white shadow-sm"
                    >
                      Lưu hoạt động vào khóa học
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {(selectedCourse.modules || []).map((m) => (
                  <div key={m.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{m.title}</h4>
                      <span className="text-xs text-slate-500 shrink-0">{m.activities?.length || 0} hoạt động</span>
                    </div>

                    {(m.activities || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Chưa có học liệu trong bài học này.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {(m.activities || []).map(act => (
                          <div key={act.id} className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-[#0374b5] shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">{act.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                                {act.type}
                              </span>
                            </div>
                            <span className="text-slate-400 shrink-0">{act.durationMinutes} phút</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Announcements Post */}
          {selectedTab === 'announcements' && (
            <div className="p-5 sm:p-6 space-y-4 max-w-2xl">
              <h3 className="font-extrabold text-slate-800 text-base">
                Gửi Thông báo Mới đến Toàn thể Học sinh Lớp học
              </h3>

              {isAncSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Thông báo đã được gửi thành công đến bảng tin học sinh!</span>
                </div>
              )}

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề thông báo</label>
                  <input
                    type="text"
                    value={ancTitle}
                    onChange={(e) => setAncTitle(e.target.value)}
                    placeholder="Ví dụ: Nhắc nhở hoàn thành bài trắc nghiệm Bài 1..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#0374b5] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung thông báo</label>
                  <textarea
                    rows={4}
                    value={ancContent}
                    onChange={(e) => setAncContent(e.target.value)}
                    placeholder="Nhập nội dung chi tiết thông báo..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#0374b5] focus:bg-white"
                    required
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={ancImportant}
                    onChange={(e) => setAncImportant(e.target.checked)}
                    className="rounded text-[#0374b5]"
                  />
                  <span className="font-semibold">Đánh dấu là thông báo quan trọng (Ghim đầu trang)</span>
                </label>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Phát hành thông báo
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
