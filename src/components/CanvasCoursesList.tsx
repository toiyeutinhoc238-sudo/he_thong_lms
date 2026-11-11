import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Course, TrainingType } from '../types';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Clock, 
  Users, 
  Award, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  GraduationCap,
  Sparkles,
  X
} from 'lucide-react';
import { EditCourseModal } from './EditCourseModal';

export const CanvasCoursesList: React.FC = () => {
  const { courses, setCourses, navigateToCourse, currentUser, activeRole, deleteCourse, updateCourse } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const canManage = Boolean(
    currentUser?.role === 'admin' || 
    currentUser?.role === 'lecturer' || 
    activeRole === 'admin' || 
    activeRole === 'lecturer' || 
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com'
  );

  // Form tạo khóa học mới chuẩn phổ thông Lớp 1 - 12
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    category: 'Chuyên đề AI' | 'Khoa học máy tính' | 'Tin học ứng dụng';
    gradeLevel: string;
    instructorName: string;
    semester: string;
    description: string;
    thumbnail: string;
  }>({
    name: '',
    code: '',
    category: 'Chuyên đề AI',
    gradeLevel: 'Lớp 10',
    instructorName: currentUser?.name || 'Giáo viên phụ trách',
    semester: 'Học kỳ 1',
    description: '',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCourses = courses.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (c.code || '').toLowerCase().includes(search.toLowerCase());
    
    // Khớp chuyên đề (hỗ trợ cả slug cũ lẫn tên tiếng Việt mới)
    const matchCat = selectedCategory === 'all' || 
                     c.category === selectedCategory ||
                     (selectedCategory === 'Chuyên đề AI' && (c.category === 'ai_topics' || c.category === 'AI')) ||
                     (selectedCategory === 'Khoa học máy tính' && (c.category === 'computer_science' || c.category === 'CS')) ||
                     (selectedCategory === 'Tin học ứng dụng' && (c.category === 'applied_informatics' || c.category === 'ICT'));
    
    const matchGrade = selectedGrade === 'all' || c.gradeLevel === selectedGrade;
    return matchSearch && matchCat && matchGrade;
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    setIsSubmitting(true);
    try {
      const courseId = `course-${Date.now()}`;

      const newCourse: Course = {
        id: courseId,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        category: formData.category,
        gradeLevel: formData.gradeLevel,
        semester: formData.semester,
        academicYear: '2026-2027',
        instructor: {
          id: currentUser?.id || 'admin',
          name: formData.instructorName || currentUser?.name || 'Giáo viên phụ trách',
          email: currentUser?.email || 'admin@lms2.edu.vn',
          avatar: currentUser?.avatar || '',
          title: 'Giáo viên Tin học'
        },
        thumbnail: formData.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        progress: 0,
        totalActivities: 0,
        completedActivities: 0,
        description: formData.description || `Chương trình học tập môn ${formData.category} dành cho học sinh ${formData.gradeLevel}.`,
        targetAudience: `Học sinh ${formData.gradeLevel}`,
        syllabus: [],
        modules: [],
        announcements: [],
        enrolledStudentsCount: 0,
        certificateEligible: true
      };

      setCourses(prev => [newCourse, ...prev]);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        code: '',
        category: 'Chuyên đề AI',
        gradeLevel: 'Lớp 10',
        instructorName: currentUser?.name || 'Giáo viên phụ trách',
        semester: 'Học kỳ 1',
        description: '',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0374b5] via-[#02629b] to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tất cả Khóa học</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Kho Khóa Học LMS Nhóm 2
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Khám phá các học phần đào tạo, theo dõi lộ trình bài giảng và thực hiện bài tập trực tuyến.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-sky-50 text-[#0374b5] font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 text-[#0374b5]" />
            <span>Tạo khóa học mới</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả chuyên đề' },
            { id: 'Chuyên đề AI', label: '🤖 Chuyên đề AI' },
            { id: 'Khoa học máy tính', label: '💻 Khoa học máy tính' },
            { id: 'Tin học ứng dụng', label: '📱 Tin học ứng dụng' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#0374b5] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Bộ lọc khối lớp Lớp 1 -> Lớp 12 */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 focus:outline-none focus:border-[#0374b5] shrink-0 cursor-pointer"
          >
            <option value="all">Tất cả Khối lớp (1 - 12)</option>
            {Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`).map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center mx-auto text-2xl">
            📚
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800">Chưa có khóa học nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hệ thống hiện tại chưa có khóa học trong chuyên đề hoặc khối lớp này.
              {canManage ? ' Bấm nút bên dưới để tạo khóa học mới!' : ''}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm khóa học ngay</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#0374b5] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
              onClick={() => navigateToCourse(course.id)}
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnail}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[#0374b5] text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {course.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold shadow-xs">
                      {course.gradeLevel || 'Lớp 1 - 12'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-semibold">
                      {course.category}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] font-semibold opacity-90 block">
                      GV: {course.instructor?.name || 'Giáo viên phụ trách'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#0374b5] transition-colors line-clamp-2">
                    {course.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description || 'Chương trình đào tạo chất lượng cao trên LMS Nhóm 2.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      {(course.modules || []).length} Chương học
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {course.enrolledStudentsCount || 1} Học viên
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-[#0374b5] group-hover:underline flex items-center gap-1">
                  Vào học ngay →
                </span>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCourse(course);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0374b5] hover:bg-sky-50 transition-colors"
                      title="Sửa thông tin khóa học"
                    >
                      <Edit3 className="w-4 h-4 text-[#0374b5]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Bạn có chắc muốn xóa khóa học "${course.name}"?`)) {
                          deleteCourse(course.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa khóa học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals Quản lý Khóa học (Chỉ dành cho Giáo viên / Admin) */}
      {canManage && (
        <>
          {/* Modal Tạo Khóa Học */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0374b5] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Thêm Khóa Học Mới
                </h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên khóa học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình Python & Trí tuệ Nhân tạo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã khóa học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: AI-10"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp học (Lớp 1 - 12) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white font-bold"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chuyên đề Tin học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#0374b5] focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  >
                    <option value="Chuyên đề AI">🤖 Chuyên đề AI</option>
                    <option value="Khoa học máy tính">💻 Khoa học máy tính</option>
                    <option value="Tin học ứng dụng">📱 Tin học ứng dụng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Học kỳ
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  >
                    <option value="Học kỳ 1">Học kỳ 1</option>
                    <option value="Học kỳ 2">Học kỳ 2</option>
                    <option value="Cả năm học">Cả năm học</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giáo viên phụ trách
                </label>
                <input
                  type="text"
                  placeholder="Họ và tên giáo viên"
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả khóa học
                </label>
                <textarea
                  rows={3}
                  placeholder="Giới thiệu mục tiêu và nội dung chính của khóa học..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link ảnh bìa (Thumbnail)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Lưu khóa học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Chỉnh Sửa Khóa Học */}
      <EditCourseModal
        isOpen={!!editingCourse}
        course={editingCourse}
        onClose={() => setEditingCourse(null)}
        onSave={async (courseId, data) => {
          await updateCourse(courseId, data);
        }}
      />
        </>
      )}
    </div>
  );
};
