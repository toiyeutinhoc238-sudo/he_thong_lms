import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { BookOpen, X, Sparkles, Image, Check } from 'lucide-react';

interface EditCourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseId: string, data: Partial<Course>) => Promise<void>;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  course,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Lớp 10');
  const [category, setCategory] = useState<'Chuyên đề AI' | 'Khoa học máy tính' | 'Tin học ứng dụng'>('Chuyên đề AI');
  const [semester, setSemester] = useState('Học kỳ 1');
  const [academicYear, setAcademicYear] = useState('2026 - 2027');
  const [instructorName, setInstructorName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (course) {
      setName(course.name || '');
      setCode(course.code || '');
      setGradeLevel(course.gradeLevel || 'Lớp 10');
      
      const cat = course.category;
      if (cat === 'Chuyên đề AI' || cat === 'Khoa học máy tính' || cat === 'Tin học ứng dụng') {
        setCategory(cat);
      } else if (cat === 'ai_topics' || cat === 'AI') {
        setCategory('Chuyên đề AI');
      } else if (cat === 'computer_science' || cat === 'CS') {
        setCategory('Khoa học máy tính');
      } else {
        setCategory('Tin học ứng dụng');
      }

      setSemester(course.semester || 'Học kỳ 1');
      setAcademicYear(course.academicYear || '2026 - 2027');
      setInstructorName(course.instructor?.name || 'Giáo viên phụ trách');
      setDescription(course.description || '');
      setThumbnail(course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80');
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      const updatedData: Partial<Course> = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        gradeLevel,
        category,
        semester,
        academicYear,
        description: description.trim(),
        thumbnail: thumbnail.trim(),
        targetAudience: `Học sinh ${gradeLevel}`,
        instructor: {
          id: course.instructor?.id || 'admin',
          name: instructorName.trim() || course.instructor?.name || 'Giáo viên phụ trách',
          title: 'Giáo viên Tin học',
          avatar: course.instructor?.avatar || '',
          email: course.instructor?.email || 'admin@lms2.edu.vn'
        }
      };

      await onSave(course.id, updatedData);
      onClose();
    } catch (err) {
      console.error('Lỗi khi cập nhật khóa học:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetImages = [
    {
      label: 'Chuyên đề AI',
      url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80'
    },
    {
      label: 'Khoa học máy tính',
      url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
    },
    {
      label: 'Tin học ứng dụng',
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0374b5] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Chỉnh sửa thông tin khóa học
              </h3>
              <p className="text-[11px] text-slate-400">
                Cập nhật mã, tên môn, khối lớp và học liệu khóa học
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Mã khóa học & Khối lớp */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mã khóa học *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: 6AIAB01"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase focus:outline-none focus:border-[#0374b5] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Khối lớp học (Chuẩn K-12) *
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
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

          {/* Chuyên đề Tin học */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chuyên đề môn Tin học (3 Định hướng) *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-sky-50/60 border border-sky-300 rounded-xl font-bold text-[#0374b5] focus:outline-none focus:border-[#0374b5]"
            >
              <option value="Chuyên đề AI">🤖 Chuyên đề AI</option>
              <option value="Khoa học máy tính">💻 Khoa học máy tính</option>
              <option value="Tin học ứng dụng">📱 Tin học ứng dụng</option>
            </select>
          </div>

          {/* Tên khóa học */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tên khóa học *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Chuyên đề AI lớp 6: Chủ đề A và B"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:border-[#0374b5] focus:bg-white"
              required
            />
          </div>

          {/* Học kỳ & Giáo viên */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Học kỳ
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:border-[#0374b5] focus:bg-white"
              >
                <option value="Học kỳ 1">Học kỳ 1</option>
                <option value="Học kỳ 2">Học kỳ 2</option>
                <option value="Cả năm học">Cả năm học</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Giáo viên phụ trách
              </label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Tên giáo viên"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:border-[#0374b5] focus:bg-white"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mô tả chi tiết khóa học
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục tiêu bài học, kiến thức trọng tâm..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#0374b5] focus:bg-white leading-relaxed"
            />
          </div>

          {/* Ảnh bìa */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">
              Ảnh bìa khóa học (Thumbnail URL)
            </label>
            <input
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#0374b5] focus:bg-white"
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400">Gợi ý ảnh:</span>
              {presetImages.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setThumbnail(p.url)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-[#0374b5] text-[11px] font-semibold text-slate-600 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Lưu thay đổi khóa học</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
