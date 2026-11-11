import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, School, BookOpen, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { currentUser, updateProfile } = useApp();

  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  const [school, setSchool] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      setFullName(currentUser.name || '');
      setClassName(currentUser.className || currentUser.classOrPosition || '');
      setSchool(currentUser.school || currentUser.department || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  // Chỉ hiển thị với học viên đăng nhập lần đầu hoặc chưa điền Lớp & Trường
  const isStudent = currentUser?.id && currentUser?.role !== 'admin';
  const isProfileIncomplete = !currentUser?.isProfileCompleted || !currentUser?.school || (!currentUser?.className && !currentUser?.classOrPosition);

  if (!isStudent || !isProfileIncomplete) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!className.trim()) {
      setError('Vui lòng nhập tên lớp học.');
      return;
    }
    if (!school.trim()) {
      setError('Vui lòng nhập tên trường học.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (updateProfile) {
        await updateProfile({
          name: fullName.trim(),
          className: className.trim(),
          classOrPosition: className.trim(),
          school: school.trim(),
          department: school.trim(),
          phone: phone.trim(),
          isProfileCompleted: true
        });
      }
    } catch (err: any) {
      console.error('Lỗi lưu thông tin học viên:', err);
      setError(err.message || 'Không thể lưu thông tin. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0374b5] to-sky-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-sky-600/25">
            <GraduationCap className="w-9 h-9 text-amber-300" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Thông tin học viên
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Chào mừng bạn đến với <strong>LMS Nhóm 2</strong>. Vui lòng nhập đầy đủ thông tin để ghi danh vào lớp học.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0374b5]" />
              <span>Họ và tên học viên <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0374b5] focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Lớp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#0374b5]" />
                <span>Lớp học <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 12A1 hoặc K48 Tin"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0374b5] focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
              />
            </div>

            {/* Trường */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-[#0374b5]" />
                <span>Trường học <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: THPT Lê Quý Đôn"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0374b5] focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Số điện thoại liên hệ <span className="text-slate-400 font-normal">(tùy chọn)</span></span>
            </label>
            <input
              type="tel"
              placeholder="Ví dụ: 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0374b5] focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-5 rounded-xl bg-[#0374b5] hover:bg-[#02629b] active:scale-[0.99] text-white font-extrabold text-sm transition-all shadow-md shadow-sky-900/15 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Đang lưu thông tin...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Xác nhận & Bắt đầu học tập</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-[11px] text-slate-400 text-center">
          Thông tin này sẽ được lưu trữ an toàn trong hồ sơ học tập của bạn trên hệ thống.
        </p>
      </div>
    </div>
  );
};
