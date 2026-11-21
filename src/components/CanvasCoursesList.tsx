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
  X,
  UserCheck,
  CheckCircle2,
  Layers,
  Loader2
} from 'lucide-react';
import { EditCourseModal } from './EditCourseModal';
import { defaultGrade6Course } from '../data/mockData';

export const CanvasCoursesList: React.FC = () => {
  const { 
    courses, 
    setCourses, 
    navigateToCourse, 
    currentUser, 
    activeRole, 
    deleteCourse, 
    updateCourse, 
    enrollCourse,
    addCourseModule,
    updateCourseModule,
    deleteCourseModule
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Quản lý Khung Bài học (Bài 1, Bài 2, Bài 3... theo yêu cầu)
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [editingLesson, setEditingLesson] = useState<{ courseId: string; moduleId: string; title: string } | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  const canManage = Boolean(
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' ||
    currentUser?.role === 'admin' || 
    currentUser?.role === 'lecturer' || 
    activeRole === 'admin' || 
    activeRole === 'lecturer'
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
    
    const matchGrade = true;
    return matchSearch && matchCat && matchGrade;
  });

  const mainCourse = courses.find(c => c.code === '6AIAB01' || (c.name && (c.name.toLowerCase().includes('lớp 6') || c.name.toLowerCase().includes('ai')))) || courses[0];

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
            Chuyên đề trí tuệ nhân tạo lớp 6: Chủ đề A và B
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

      {/* Filter & Search Bar - Tinh gọn, dễ nhìn, bỏ hết râu ria */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm bài học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
          />
        </div>

        {canManage && (
          <button
            onClick={() => {
              const currentModCount = (mainCourse?.modules || []).length;
              setNewLessonTitle(`Bài ${currentModCount + 1}: `);
              setIsAddLessonModalOpen(true);
            }}
            className="px-4 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-end sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm bài học mới</span>
          </button>
        )}
      </div>

      {/* Hiển thị Danh sách Khung Bài Học (Bài 1, Bài 2, Bài 3... theo yêu cầu) */}
      {(() => {
        const OFFICIAL_8_LESSONS = [
          'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
          'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
          'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
          'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
          'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
          'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
          'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
          'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO'
        ];

        const isStockAvatar = (url?: string) => Boolean(
          url && (
            url.includes('unsplash.com') ||
            url.includes('photo-1507003211169') ||
            url.includes('photo-') ||
            url.includes('images.unsplash')
          )
        );

        const foundCourse = courses.find(c => c.code === '6AIAB01' || c.id === '6AIAB01' || (c.name && (c.name.toLowerCase().includes('lớp 6') || c.name.toLowerCase().includes('ai')))) || courses[0];

        // Khóa học chuẩn luôn sẵn sàng để hiển thị đầy đủ 8 bài học
        const mainCourse: Course = foundCourse ? {
          ...foundCourse,
          name: 'Chuyên đề trí tuệ nhân tạo lớp 6: Chủ đề A và B',
          category: 'Chuyên đề AI',
          gradeLevel: 'Lớp 6'
        } : defaultGrade6Course;

        const isMainEnrolled = Boolean(
          canManage ||
          (currentUser?.enrolledCourses && currentUser.enrolledCourses.includes(mainCourse.id)) ||
          (mainCourse.enrolledStudents && mainCourse.enrolledStudents.some((s: any) => s.id === currentUser?.id || (currentUser?.email && s.email === currentUser.email)))
        );

        const instructorAvatar = 
          (currentUser?.avatar && !isStockAvatar(currentUser.avatar) && (currentUser.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' || mainCourse.instructor?.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()))
            ? currentUser.avatar
            : (mainCourse.instructor?.avatar && !isStockAvatar(mainCourse.instructor.avatar))
              ? mainCourse.instructor.avatar
              : (currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' && currentUser?.avatar && !isStockAvatar(currentUser.avatar))
                ? currentUser.avatar
                : '';

        const instructorName = 
          (currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' && currentUser.name)
            ? currentUser.name
            : (mainCourse.instructor?.name && mainCourse.instructor.name !== 'Giáo viên' && mainCourse.instructor.name !== 'Giáo viên phụ trách')
              ? mainCourse.instructor.name
              : 'Phan Phi Phú';

        // Xây dựng danh sách chuẩn đảm bảo luôn có ít nhất 8 bài học
        const baseModules = Array.isArray(mainCourse.modules) ? [...mainCourse.modules] : [];
        for (let i = 0; i < OFFICIAL_8_LESSONS.length; i++) {
          const expectedTitle = OFFICIAL_8_LESSONS[i];
          if (!baseModules[i]) {
            baseModules.push({
              id: `module-lesson-${i + 1}`,
              courseId: mainCourse.id,
              order: i + 1,
              title: expectedTitle,
              description: `Nội dung học tập và bài thực hành cho ${expectedTitle}`,
              activities: []
            });
          } else if (!baseModules[i].title.startsWith('BÀI ')) {
            baseModules[i].title = expectedTitle;
          }
        }

        const modules = baseModules.filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()));

        return (
          <div className="space-y-6">
            {/* Thanh Giáo viên phụ trách & Trạng thái ghi danh */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {instructorAvatar ? (
                    <img
                      src={instructorAvatar}
                      alt={instructorName}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#0374b5] text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {instructorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#0374b5] text-white text-[9px] font-black rounded-full shadow-2xs">
                    GV
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900">
                      {instructorName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0374b5] text-[10px] font-bold">
                      Người tạo khóa học
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      Lớp 6
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Email: <strong>phanphiphu04@gmail.com</strong> • {mainCourse.category || 'Chuyên đề AI'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateToCourse(mainCourse.id, null)}
                  className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#0374b5] rounded-xl text-xs font-bold transition-all border border-sky-200 flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Toàn bộ học phần</span>
                </button>

                {isMainEnrolled ? (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã ghi danh
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await enrollCourse(mainCourse.id);
                    }}
                    className="px-4 py-1.5 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Đăng ký học ngay</span>
                  </button>
                )}
              </div>
            </div>

            {/* Các khung bài học: Bài 1, Bài 2, Bài 3,... */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0374b5]" />
                  <span>Khung Bài học Khóa học ({modules.length} bài)</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">Bấm vào bài để mở học liệu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {modules.map((mod, idx) => {
                  const lessonNum = idx + 1;
                  const lessonTitle = mod.title.replace(/^BÀI\s*\d+\s*:\s*/i, '');
                  const actCount = (mod.activities || []).length;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => navigateToCourse(mainCourse.id, mod.id)}
                      className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#0374b5] p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 min-h-[170px]"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-[#0374b5] font-black text-xs uppercase tracking-wider">
                            Bài {lessonNum}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold">
                            {actCount > 0 ? `${actCount} mục` : 'Bài học'}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-[#0374b5] transition-colors line-clamp-3">
                          {lessonTitle || mod.title}
                        </h4>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                        <span className="text-xs font-bold text-[#0374b5] group-hover:underline flex items-center gap-1">
                          Vào học ngay →
                        </span>
                        {canManage && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingLesson({ courseId: mainCourse.id, moduleId: mod.id, title: mod.title });
                                setEditLessonTitle(mod.title);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-[#0374b5] hover:bg-slate-100 transition-colors"
                              title="Sửa tên bài học"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Xác nhận xóa bài "${mod.title}"?`)) {
                                  await deleteCourseModule(mainCourse.id, mod.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Xóa bài học"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Khung thêm bài mới cho giáo viên / quản trị viên */}
                {canManage && (
                  <button
                    onClick={() => {
                      setNewLessonTitle(`Bài ${(mainCourse.modules || []).length + 1}: `);
                      setIsAddLessonModalOpen(true);
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-[#0374b5] bg-slate-50/60 hover:bg-sky-50/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-2 transition-all min-h-[170px] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 group-hover:border-[#0374b5] text-[#0374b5] flex items-center justify-center shadow-2xs">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#0374b5]">
                      + Thêm Bài Mới (Bài {(mainCourse.modules || []).length + 1}...)
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Thêm Bài Học Mới (Cho giáo viên) */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Thêm Bài Học Mới</h3>
              <button onClick={() => setIsAddLessonModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newLessonTitle.trim()) return;
              const mainCourse = courses.find(c => c.code === '6AIAB01' || (c.name && (c.name.toLowerCase().includes('lớp 6') || c.name.toLowerCase().includes('ai')))) || courses[0];
              if (!mainCourse) return;
              setIsSavingLesson(true);
              try {
                await addCourseModule(mainCourse.id, newLessonTitle.trim());
                setNewLessonTitle('');
                setIsAddLessonModalOpen(false);
              } finally {
                setIsSavingLesson(false);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài học *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 4: Khám phá ứng dụng AI trong đời sống"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddLessonModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold">
                  Hủy
                </button>
                <button type="submit" disabled={isSavingLesson} className="px-5 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl font-bold shadow-xs">
                  {isSavingLesson ? 'Đang tạo...' : 'Tạo bài học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Tên Bài Học */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Sửa Tên Bài Học</h3>
              <button onClick={() => setEditingLesson(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editLessonTitle.trim()) return;
              setIsSavingLesson(true);
              try {
                await updateCourseModule(editingLesson.courseId, editingLesson.moduleId, { title: editLessonTitle.trim() });
                setEditingLesson(null);
              } finally {
                setIsSavingLesson(false);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài học *</label>
                <input
                  type="text"
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditingLesson(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold">
                  Hủy
                </button>
                <button type="submit" disabled={isSavingLesson} className="px-5 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl font-bold shadow-xs">
                  {isSavingLesson ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
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
