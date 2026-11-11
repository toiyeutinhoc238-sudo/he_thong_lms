import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CanvasCourseNav, CourseNavTab } from './CanvasCourseNav';
import { CanvasModulesView } from './CanvasModulesView';
import { CanvasRightSidebar } from './CanvasRightSidebar';
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
  BookOpen
} from 'lucide-react';

interface CourseDetailProps {
  isCourseNavOpen?: boolean;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ isCourseNavOpen = true }) => {
  const { 
    activeCourse, 
    setCurrentView, 
    navigateToActivity, 
    forumTopics, 
    createForumTopic, 
    currentUser, 
    certificates, 
    activeRole,
    enrollCourse
  } = useApp();

  const [activeTab, setActiveTab] = useState<CourseNavTab>('modules');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  if (!activeCourse) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-600">Không tìm thấy thông tin khóa học.</p>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 bg-[#0374b5] text-white rounded-lg text-xs font-bold"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

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

  const instructorAvatar = 
    (currentUser?.avatar && isCreatorCurrent)
      ? currentUser.avatar
      : (activeCourse.instructor?.avatar && !activeCourse.instructor.avatar.includes('unsplash.com'))
        ? activeCourse.instructor.avatar
        : (currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' && currentUser?.avatar)
          ? currentUser.avatar
          : '';

  const instructorName = 
    (currentUser?.name && isCreatorCurrent && (!activeCourse.instructor?.name || activeCourse.instructor.name === 'Giáo viên' || activeCourse.instructor.name === 'Giáo viên phụ trách'))
      ? currentUser.name
      : (activeCourse.instructor?.name && activeCourse.instructor.name !== 'Giáo viên' && activeCourse.instructor.name !== 'Giáo viên phụ trách')
        ? activeCourse.instructor.name
        : (currentUser?.name || 'Phú Phan');

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
        {/* Banner Đăng Ký Khóa Học (Dành riêng cho học viên chưa ghi danh) */}
        {!isEnrolled && (
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

        {/* Thanh Thông Tin Người Tạo Khóa Học & Lớp Học */}
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

          <div className="flex items-center gap-2 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('people')}
              className="px-3 py-1 bg-white hover:bg-sky-50 border border-slate-200 hover:border-[#0374b5] rounded-xl font-bold text-slate-700 hover:text-[#0374b5] transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Xem danh sách các bạn cùng lớp khóa học này"
            >
              <Users className="w-3.5 h-3.5 text-[#0374b5]" />
              <span>{activeCourse.enrolledStudentsCount || enrolledStudents.length} bạn cùng lớp</span>
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

        {/* Tab 1: Nội dung học tập (Modules View - EXACTLY LIKE SCREENSHOT) */}
        {(activeTab === 'modules' || activeTab === 'home') && (
          <CanvasModulesView 
            onSelectActivity={(actId) => navigateToActivity(activeCourse.id, actId)} 
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
                <span>+ Thảo luận</span>
              </button>
            </div>

            {isCreatingTopic && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newTopicTitle.trim()) {
                    createForumTopic(activeCourse.id, newTopicTitle.trim(), newTopicContent.trim());
                    setNewTopicTitle('');
                    setNewTopicContent('');
                    setIsCreatingTopic(false);
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
                {courseTopics.map(topic => (
                  <div key={topic.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{topic.title}</h4>
                      <span className="text-[11px] text-slate-400">{(topic.replies || []).length} phản hồi</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{topic.content}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Đăng bởi: <strong>{topic.author?.name || 'Thành viên'}</strong></span>
                      <span>•</span>
                      <span>{topic.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Số điểm (Grades) */}
        {activeTab === 'grades' && (
          <div className="p-6 max-w-4xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
              Bảng điểm cá nhân: {activeCourse.name}
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Tên bài kiểm tra / Hoạt động</th>
                    <th className="py-2.5 px-4">Hạn nộp</th>
                    <th className="py-2.5 px-4">Điểm số</th>
                    <th className="py-2.5 px-4">Thang điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeCourse.modules?.flatMap(m => m.activities || []).map(act => (
                    <tr key={act.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-900">{act.title}</td>
                      <td className="py-2.5 px-4 text-slate-500">{act.dueDate || 'Không giới hạn'}</td>
                      <td className="py-2.5 px-4 font-bold text-[#0374b5]">{act.score !== undefined ? act.score : '-'}</td>
                      <td className="py-2.5 px-4 text-slate-500">{act.maxScore || 10}</td>
                    </tr>
                  ))}
                  {(!activeCourse.modules || activeCourse.modules.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                        Chưa có dữ liệu bài nộp nào để chấm điểm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Danh sách học viên cùng lớp ({enrolledStudents.length} bạn đã đăng ký)
                </h3>
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

        {/* Tab 5: Các tập tin (Files) */}
        {activeTab === 'files' && (
          <div className="p-6 max-w-4xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
              Tập tin học liệu khóa học
            </h2>
            <div className="border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 space-y-2">
              <Folder className="w-10 h-10 text-slate-300 mx-auto" />
              <p>Chưa có tài liệu đính kèm nào được tải lên thư mục này.</p>
            </div>
          </div>
        )}

        {/* Tab 6: Lịch trình khóa học (Syllabus) */}
        {activeTab === 'syllabus' && (
          <div className="p-6 max-w-4xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
              Lịch trình khóa học (Syllabus)
            </h2>
            <div className="prose prose-sm max-w-none text-slate-700 space-y-3">
              <p><strong>Mục tiêu:</strong> {activeCourse.description || 'Cung cấp kiến thức toàn diện về môn học.'}</p>
              <p><strong>Khối lớp:</strong> {activeCourse.gradeLevel || 'Lớp 1 - 12'}</p>
              <p><strong>Chuyên đề Tin học:</strong> {activeCourse.category || 'Tin học'}</p>
              <p><strong>Học kỳ:</strong> {activeCourse.semester || 'Học kỳ 1'} ({activeCourse.academicYear || '2026-2027'})</p>
            </div>
          </div>
        )}

        {/* Tab 7: Kho học liệu số & Mô phỏng 3D */}
        {activeTab === 'resources3d' && (
          <div className="p-6 max-w-4xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Box className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Kho học liệu số & Mô phỏng tương tác 3D
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-2xl space-y-2">
                <h4 className="text-sm font-bold text-indigo-950">Mô phỏng 3D: Mạng nơ-ron nhân tạo</h4>
                <p className="text-xs text-slate-600">Khám phá trực quan cơ chế truyền lan xuôi và lan truyền ngược trong mô hình AI.</p>
                <button 
                  onClick={() => alert('Đang mở mô hình 3D tương tác...')}
                  className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Mở Trải Nghiệm 3D
                </button>
              </div>
              <div className="p-5 border border-sky-100 bg-gradient-to-br from-sky-50/60 to-blue-50/60 rounded-2xl space-y-2">
                <h4 className="text-sm font-bold text-sky-950">Phòng thí nghiệm ảo AI Lab</h4>
                <p className="text-xs text-slate-600">Thực hành huấn luyện và tinh chỉnh tham số máy học trực tiếp trên trình duyệt.</p>
                <button 
                  onClick={() => alert('Đang kết nối Cloud Virtual Lab...')}
                  className="mt-2 px-3 py-1.5 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Khởi Chạy Virtual Lab
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Action Sidebar (Xem luồng khóa học, Xem lịch, Cần làm) */}
      <CanvasRightSidebar onNavigateTab={setActiveTab} />
    </div>
  );
};
