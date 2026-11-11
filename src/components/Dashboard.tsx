import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from './CourseCard';
import { 
  BookOpen, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  Clock, 
  Calendar, 
  PlayCircle, 
  AlertCircle, 
  ChevronRight, 
  GraduationCap, 
  Sparkles,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    currentUser, 
    courses, 
    trainingProgramFilter, 
    setTrainingProgramFilter, 
    searchQuery,
    certificates,
    setCurrentView,
    navigateToCourse,
    isLoading,
    refreshData,
    notifications
  } = useApp();

  const [courseTab, setCourseTab] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Filter courses by category, status, and search query
  const filteredCourses = courses.filter(c => {
    // Category filter
    if (trainingProgramFilter !== 'all' && c.category !== trainingProgramFilter) {
      return false;
    }
    // Tab filter
    if (courseTab === 'in_progress' && (c.progress === 100 || c.progress === 0)) {
      return false;
    }
    if (courseTab === 'completed' && c.progress < 100) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCode = c.code?.toLowerCase().includes(q);
      const matchLecturer = c.instructor?.name?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchLecturer) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.progress === 100).length;
  const inProgressCourses = courses.filter(c => c.progress > 0 && c.progress < 100).length;

  // Find the primary course to resume
  const resumeCourse = courses.find(c => c.progress > 0 && c.progress < 100) || (courses.length > 0 ? courses[0] : null);

  // Extract real upcoming deadlines from courses
  const upcomingDeadlines: { courseId: string; courseName: string; activityTitle: string; dueDate: string }[] = [];
  courses.forEach(c => {
    (c.modules || []).forEach(m => {
      (m.activities || []).forEach(a => {
        if (!a.isCompleted && a.dueDate) {
          upcomingDeadlines.push({
            courseId: c.id,
            courseName: c.name,
            activityTitle: a.title,
            dueDate: a.dueDate
          });
        }
      });
    });
  });

  // Extract all announcements from courses
  const allAnnouncements = courses.flatMap(c => (c.announcements || []).map(anc => ({ ...anc, courseCode: c.code })));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-hcmue-900 via-hcmue-800 to-hcmue-700 text-white p-6 sm:p-8 shadow-lg shadow-hcmue-950/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cổng học tập trực tuyến VLE - ĐH Sư phạm TP.HCM</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {currentUser.name || 'Học viên'}! 👋
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
            Chúc bạn một ngày học tập hiệu quả. Bạn hiện có <strong>{courses.length} học phần</strong> trong hệ thống đào tạo.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            {currentUser.code && (
              <span className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs font-mono">
                Mã số: {currentUser.code}
              </span>
            )}
            {currentUser.department && (
              <span className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                {currentUser.department}
              </span>
            )}
            {currentUser.classOrPosition && (
              <span className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                {currentUser.classOrPosition}
              </span>
            )}
            <button
              onClick={() => refreshData()}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl backdrop-blur-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Đồng bộ lại từ API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới dữ liệu API</span>
            </button>
          </div>
        </div>

        {/* Decorative background logo */}
        <div className="absolute right-4 -bottom-10 opacity-10 pointer-events-none hidden md:block">
          <GraduationCap className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Stats Counter Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Khóa học của tôi</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalCourses}</h3>
            <span className="text-[11px] text-hcmue-600 font-medium">Học phần trực tuyến</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-hcmue-700 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Đang thực hiện</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{inProgressCourses}</h3>
            <span className="text-[11px] text-amber-700 font-medium">Cần hoàn thành</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Đã hoàn thành</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedCourses}</h3>
            <span className="text-[11px] text-emerald-700 font-medium">Đạt yêu cầu 100%</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => setCurrentView('certificates')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div>
            <p className="text-xs font-medium text-slate-500">Chứng chỉ VLE</p>
            <h3 className="text-2xl font-black text-amber-500 mt-1">{certificates.length}</h3>
            <span className="text-[11px] text-amber-600 font-medium group-hover:underline flex items-center gap-0.5">
              Xem chứng nhận <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Courses, Right Deadlines & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Courses list) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resume Learning Callout Card */}
          {resumeCourse && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-hcmue-700 text-white text-[10px] font-bold uppercase tracking-wider">
                  Tiếp tục bài học gần nhất
                </span>
                <h4 className="font-bold text-slate-800 text-base">
                  {resumeCourse.name}
                </h4>
                <p className="text-xs text-slate-600">
                  Tiến độ: <strong>{resumeCourse.progress}%</strong> ({resumeCourse.completedActivities}/{resumeCourse.totalActivities} hoạt động)
                </p>
              </div>

              <button
                onClick={() => navigateToCourse(resumeCourse.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-hcmue-700 hover:bg-hcmue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-hcmue-900/10 shrink-0"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Tiếp tục học ngay</span>
              </button>
            </div>
          )}

          {/* Courses Tabs and Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-extrabold text-slate-800 text-base">
                  Khóa học của tôi
                </h2>
                <p className="text-xs text-slate-400">
                  Danh sách học phần từ hệ thống
                </p>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setCourseTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    courseTab === 'all'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({courses.length})
                </button>
                <button
                  onClick={() => setCourseTab('in_progress')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    courseTab === 'in_progress'
                      ? 'bg-white text-amber-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đang học ({inProgressCourses})
                </button>
                <button
                  onClick={() => setCourseTab('completed')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    courseTab === 'completed'
                      ? 'bg-white text-emerald-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hoàn thành ({completedCourses})
                </button>
              </div>
            </div>

            {/* Courses Cards Grid */}
            {isLoading ? (
              <div className="text-center py-16 space-y-3">
                <RefreshCw className="w-8 h-8 text-hcmue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Đang tải danh sách khóa học từ API...</p>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-medium text-sm">
                  {courses.length === 0 
                    ? 'Chưa có khóa học nào được nạp. Sẵn sàng nhận dữ liệu từ API của bạn.'
                    : 'Không tìm thấy khóa học nào phù hợp với bộ lọc hiện tại.'}
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => refreshData()}
                    className="px-3.5 py-1.5 rounded-xl bg-hcmue-50 text-hcmue-700 text-xs font-bold hover:bg-hcmue-100 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tải lại từ API</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines, Announcements & Study Tips */}
        <div className="space-y-6">
          {/* Upcoming Deadlines Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Hạn chót học tập</h3>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {upcomingDeadlines.length} hạn chót
              </span>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((dl, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="truncate">{dl.activityTitle}</span>
                      <span className="text-amber-700 font-mono text-[11px]">{dl.dueDate}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      {dl.courseName}
                    </p>
                    <div className="pt-1 flex justify-end">
                      <button 
                        onClick={() => navigateToCourse(dl.courseId)}
                        className="text-hcmue-700 font-bold text-[11px] hover:underline"
                      >
                        Vào làm bài →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Hiện không có hạn chót bài tập nào cần hoàn thành.
                </div>
              )}
            </div>
          </div>

          {/* Announcements Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-hcmue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Thông báo môn học</h3>
              </div>
              <span className="text-xs text-slate-400">
                {allAnnouncements.length} tin
              </span>
            </div>

            <div className="space-y-3">
              {allAnnouncements.length > 0 ? (
                allAnnouncements.slice(0, 3).map((anc, idx) => (
                  <div key={anc.id || idx} className="space-y-1 text-xs">
                    {anc.isImportant && (
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded">
                        Quan trọng
                      </span>
                    )}
                    <h4 className="font-bold text-slate-800 mt-1">
                      {anc.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {anc.content}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>{anc.author}</span>
                      <span className="font-mono">{anc.createdAt}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Chưa có thông báo nào từ các học phần.
                </div>
              )}
            </div>
          </div>

          {/* VLE Study Guidelines */}
          <div className="bg-gradient-to-br from-hcmue-900 to-hcmue-800 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
                ✓
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300">
                Quy định đào tạo trực tuyến
              </h4>
            </div>
            <ul className="text-[11px] text-slate-200 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>Sinh viên hoàn thành các bài học và bài kiểm tra trên hệ thống theo đúng tiến độ đào tạo.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>Mọi thắc mắc kỹ thuật liên hệ: <strong>hotrovle@hcmue.edu.vn</strong>.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
