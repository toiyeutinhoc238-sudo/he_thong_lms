import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Course } from '../types';
import { 
  BookOpen, 
  Plus, 
  MessageSquare, 
  Bell, 
  FileCheck, 
  Folder, 
  MoreVertical,
  GraduationCap,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { EditCourseModal } from './EditCourseModal';

export const CanvasDashboard: React.FC = () => {
  const { courses, setCourses, navigateToCourse, activeRole, deleteCourse, updateCourse } = useApp();

  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [dropdownCourseId, setDropdownCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCategory, setCourseCategory] = useState<'Chuyên đề AI' | 'Khoa học máy tính' | 'Tin học ứng dụng'>('Chuyên đề AI');
  const [courseGradeLevel, setCourseGradeLevel] = useState<string>('Lớp 10');
  const [courseDesc, setCourseDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleGlobalClick = () => setDropdownCourseId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const colors = [
    'from-sky-600 to-blue-700',
    'from-emerald-600 to-teal-700',
    'from-indigo-600 to-purple-700',
    'from-amber-500 to-orange-600',
    'from-rose-600 to-pink-700',
    'from-cyan-600 to-blue-600'
  ];

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    setIsSubmitting(true);

    try {
      const code = courseCode.trim() || `TIN-${courseGradeLevel.replace('Lớp ', '')}-${Date.now().toString().slice(-3)}`;
      const newCourseData = {
        code,
        name: courseName.trim(),
        description: courseDesc.trim() || `Khóa học môn ${courseCategory} dành cho ${courseGradeLevel}.`,
        category: courseCategory,
        gradeLevel: courseGradeLevel,
        semester: 'Học kỳ 1',
        academicYear: '2026 - 2027',
        modules: []
      };

      const created = await api.courses.create(newCourseData);
      setCourses(prev => [created, ...prev]);
      setCourseCode('');
      setCourseName('');
      setCourseDesc('');
      setIsCreateCourseOpen(false);
      navigateToCourse(created.id);
    } catch (err: any) {
      console.error('Lỗi tạo khóa học:', err);
      // Fallback local
      const localCourse: any = {
        id: `course-${Date.now()}`,
        code: courseCode.trim() || `TIN-${Date.now().toString().slice(-4)}`,
        name: courseName.trim(),
        description: courseDesc.trim(),
        category: courseCategory,
        gradeLevel: courseGradeLevel,
        semester: 'Học kỳ 1',
        academicYear: '2026 - 2027',
        modules: []
      };
      setCourses(prev => [localCourse, ...prev]);
      setIsCreateCourseOpen(false);
      navigateToCourse(localCourse.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 py-6 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Bảng điều khiển
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Các khóa học của bạn trên hệ thống LMS Nhóm 2
          </p>
        </div>

        <button
          onClick={() => setIsCreateCourseOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-lg text-xs sm:text-sm font-bold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Khóa Học</span>
        </button>
      </div>

      {/* Courses Cards Grid */}
      {courses.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-4 bg-white/70 shadow-2xs max-w-lg mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Chưa có khóa học nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Dữ liệu đang hoàn toàn trống. Bạn có thể bấm nút bên dưới để tạo khóa học thật đầu tiên hoặc nạp dữ liệu qua API.
            </p>
          </div>
          <button
            onClick={() => setIsCreateCourseOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Khóa Học Mới Ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course, idx) => {
            const gradientColor = colors[idx % colors.length];
            return (
              <div
                key={course.id}
                onClick={() => navigateToCourse(course.id)}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
              >
                {/* Canvas Colored Card Header Banner */}
                <div className={`h-28 bg-gradient-to-r ${gradientColor} p-3 flex justify-between items-start relative`}>
                  <span className="px-2 py-0.5 rounded bg-black/25 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-2xs">
                    {course.code || 'LMS'}
                  </span>
                  
                  {/* 3-dots Action Menu */}
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownCourseId(prev => prev === course.id ? null : course.id);
                      }}
                      className="p-1 rounded-full text-white/80 hover:text-white hover:bg-black/20 transition-colors"
                      title="Tùy chọn khóa học"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {dropdownCourseId === course.id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-7 z-30 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCourse(course);
                            setDropdownCourseId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-sky-50 hover:text-[#0374b5] flex items-center gap-2 font-bold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#0374b5]" />
                          <span>Chỉnh sửa khóa học</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownCourseId(null);
                            if (window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${course.name}" (${course.code}) cùng toàn bộ bài học bên trong?`)) {
                              deleteCourse(course.id);
                            }
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa khóa học</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0374b5] group-hover:underline line-clamp-2 leading-snug">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {course.description || course.code}
                    </p>
                  </div>

                  {/* Canvas Bottom Action Icons */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-3">
                      <span title="Thông báo" className="hover:text-slate-700">
                        <Bell className="w-4 h-4" />
                      </span>
                      <span title="Thảo luận" className="hover:text-slate-700">
                        <MessageSquare className="w-4 h-4" />
                      </span>
                      <span title="Bài tập" className="hover:text-slate-700">
                        <FileCheck className="w-4 h-4" />
                      </span>
                      <span title="Tập tin" className="hover:text-slate-700">
                        <Folder className="w-4 h-4" />
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500">
                      {course.modules?.length || 0} bài
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Course Modal */}
      {isCreateCourseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0374b5]" />
              <span>Tạo Khóa Học Mới (LMS Nhóm 2)</span>
            </h3>

            <form onSubmit={handleCreateCourse} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã khóa học *
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: AI-10"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5] uppercase"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp học *
                  </label>
                  <select
                    value={courseGradeLevel}
                    onChange={(e) => setCourseGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold focus:outline-none focus:border-[#0374b5]"
                  >
                    <optgroup label="Khối Tiểu học">
                      <option value="Lớp 1">Lớp 1</option>
                      <option value="Lớp 2">Lớp 2</option>
                      <option value="Lớp 3">Lớp 3</option>
                      <option value="Lớp 4">Lớp 4</option>
                      <option value="Lớp 5">Lớp 5</option>
                    </optgroup>
                    <optgroup label="Khối THCS">
                      <option value="Lớp 6">Lớp 6</option>
                      <option value="Lớp 7">Lớp 7</option>
                      <option value="Lớp 8">Lớp 8</option>
                      <option value="Lớp 9">Lớp 9</option>
                    </optgroup>
                    <optgroup label="Khối THPT">
                      <option value="Lớp 10">Lớp 10</option>
                      <option value="Lớp 11">Lớp 11</option>
                      <option value="Lớp 12">Lớp 12</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chuyên đề Tin học *
                </label>
                <select
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-[#0374b5] focus:outline-none focus:border-[#0374b5]"
                >
                  <option value="Chuyên đề AI">🤖 Chuyên đề AI</option>
                  <option value="Khoa học máy tính">💻 Khoa học máy tính</option>
                  <option value="Tin học ứng dụng">📱 Tin học ứng dụng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên khóa học *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lập trình Python cơ bản"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả khóa học
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả nội dung, mục tiêu của khóa học..."
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateCourseOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Khóa Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Course Modal */}
      <EditCourseModal
        isOpen={!!editingCourse}
        course={editingCourse}
        onClose={() => setEditingCourse(null)}
        onSave={async (courseId, data) => {
          await updateCourse(courseId, data);
        }}
      />
    </div>
  );
};
