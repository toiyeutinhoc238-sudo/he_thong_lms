import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Plus, 
  Users, 
  CheckSquare, 
  BookOpen, 
  Sparkles, 
  Award, 
  FileText, 
  UploadCloud, 
  Play, 
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Activity } from '../types';
import api from '../services/api';

export const TeacherDashboard: React.FC = () => {
  const { 
    currentUser, 
    courses, 
    addCourseActivity, 
    addAnnouncement,
    gradeAssignment,
    navigateToCourse
  } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedTab, setSelectedTab] = useState<'modules' | 'students' | 'announcements'>('modules');
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

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

  // Load real students enrolled in selected course from API
  useEffect(() => {
    if (selectedCourse?.id) {
      setLoadingStudents(true);
      api.users.getStudentsByCourse(selectedCourse.id)
        .then(res => {
          if (Array.isArray(res)) setEnrolledStudents(res);
        })
        .catch(() => {
          setEnrolledStudents([]);
        })
        .finally(() => {
          setLoadingStudents(false);
        });
    }
  }, [selectedCourse?.id]);

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !targetModuleId || !selectedCourse) return;

    addCourseActivity(selectedCourse.id, targetModuleId, {
      title: newTitle,
      type: newType,
      durationMinutes: Number(newDuration),
      description: newDescription,
      isRequired: true
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddActivityOpen(false);
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim() || !selectedCourse) return;

    addAnnouncement(selectedCourse.id, ancTitle, ancContent, ancImportant);
    setAncTitle('');
    setAncContent('');
    setIsAncSuccess(true);
    setTimeout(() => setIsAncSuccess(false), 3000);
  };

  if (!selectedCourse && courses.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Chưa có khóa học nào để quản lý</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Danh sách khóa học giảng dạy sẽ xuất hiện khi bạn gọi API hoặc tạo khóa học mới từ backend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
              Studio Giảng Viên • LMS Nhóm 2
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Không Gian Quản Lý & Điều Phối Học Phần
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm">
              Giảng viên: <strong>{currentUser.name}</strong> • {currentUser.department}
            </p>
          </div>

          {/* Select Course dropdown */}
          {courses.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 space-y-1 shrink-0">
              <label className="text-xs text-amber-200 block font-semibold">
                Chọn học phần giảng dạy:
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-white text-slate-900 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl focus:outline-none w-full sm:w-64"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Selected Course Quick Stats */}
      {selectedCourse && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Học sinh ghi danh</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{selectedCourse.enrolledStudentsCount || enrolledStudents.length || 0}</h3>
            <span className="text-[11px] text-hcmue-700 font-medium">Lớp học</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Số lượng chương học</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{selectedCourse.modules?.length || 0}</h3>
            <span className="text-[11px] text-slate-500 font-medium">{selectedCourse.totalActivities || 0} bài học</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Khối lớp & Phân môn</p>
            <h3 className="text-xl font-black text-purple-600 mt-1">{selectedCourse.gradeLevel || 'Lớp 1 - 12'}</h3>
            <span className="text-[11px] text-purple-700 font-medium">{selectedCourse.category}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Tiến độ khóa học</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{selectedCourse.progress || 0}%</h3>
            <span className="text-[11px] text-emerald-700 font-medium">Trung bình lớp</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      {selectedCourse && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
            <button
              onClick={() => setSelectedTab('modules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedTab === 'modules'
                  ? 'bg-hcmue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Quản lý Nội dung & Bài học
            </button>

            <button
              onClick={() => setSelectedTab('students')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedTab === 'students'
                  ? 'bg-hcmue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Danh sách Sinh viên & Tiến độ
            </button>

            <button
              onClick={() => setSelectedTab('announcements')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedTab === 'announcements'
                  ? 'bg-hcmue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Phát Thông báo Lớp học
            </button>
          </div>

          {/* Tab 1: Module Management */}
          {selectedTab === 'modules' && (
            <div className="pt-4 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Cấu trúc Chuyên đề & Hoạt động
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thêm video bài giảng, tài liệu, đề kiểm tra trắc nghiệm hoặc bài tập nộp
                  </p>
                </div>

                {selectedCourse.modules && selectedCourse.modules.length > 0 && (
                  <button
                    onClick={() => {
                      setTargetModuleId(selectedCourse.modules[0]?.id || '');
                      setIsAddActivityOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm hoạt động mới</span>
                  </button>
                )}
              </div>

              {/* Form to add activity */}
              {isAddActivityOpen && (
                <form onSubmit={handleCreateActivity} className="p-5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                    Tạo hoạt động giảng dạy mới (Đẩy lên API)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Thuộc Chuyên đề nào?
                      </label>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Loại hình hoạt động
                      </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề hoạt động
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ví dụ: Bài giảng Video: Phương pháp Dạy học..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Thời lượng dự kiến (phút)
                      </label>
                      <input
                        type="number"
                        value={newDuration}
                        onChange={(e) => setNewDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mô tả ngắn
                      </label>
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
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm"
                    >
                      Lưu hoạt động vào khóa học
                    </button>
                  </div>
                </form>
              )}

              {/* Modules display */}
              <div className="space-y-4">
                {(selectedCourse.modules || []).map((m) => (
                  <div key={m.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {m.title}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {m.activities?.length || 0} hoạt động
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(m.activities || []).map(act => (
                        <div key={act.id} className="p-3 bg-white rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="font-semibold text-slate-800">{act.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              {act.type}
                            </span>
                          </div>
                          <span className="text-slate-400">{act.durationMinutes} phút</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {(!selectedCourse.modules || selectedCourse.modules.length === 0) && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Chưa có chuyên đề nào trong học phần này.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Students List */}
          {selectedTab === 'students' && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-base">
                  Danh Sách Học Sinh Ghi Danh
                </h3>
                <span className="text-xs text-slate-500">
                  {enrolledStudents.length} học sinh
                </span>
              </div>

              {loadingStudents ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Đang tải danh sách học sinh từ API...
                </div>
              ) : enrolledStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Mã số</th>
                        <th className="py-3 px-4">Họ và Tên</th>
                        <th className="py-3 px-4">Lớp học</th>
                        <th className="py-3 px-4 text-center">Tiến độ</th>
                        <th className="py-3 px-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrolledStudents.map((st, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/20">
                          <td className="py-3 px-4 font-mono font-bold text-hcmue-700">{st.code}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{st.name}</td>
                          <td className="py-3 px-4 text-slate-500">{st.class}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold">{st.progress || 0}%</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-hcmue-800">
                              {st.status || 'Đang học'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Chưa có học sinh nào trong danh sách. Dữ liệu sẽ hiển thị khi học sinh tham gia khóa học.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Announcements Post */}
          {selectedTab === 'announcements' && (
            <div className="pt-4 space-y-4 max-w-2xl">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu đề thông báo
                  </label>
                  <input
                    type="text"
                    value={ancTitle}
                    onChange={(e) => setAncTitle(e.target.value)}
                    placeholder="Ví dụ: Nhắc nhở hạn nộp bài tập..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội dung thông báo
                  </label>
                  <textarea
                    rows={4}
                    value={ancContent}
                    onChange={(e) => setAncContent(e.target.value)}
                    placeholder="Nhập nội dung chi tiết thông báo..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-600 focus:bg-white"
                    required
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={ancImportant}
                    onChange={(e) => setAncImportant(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span className="font-semibold">Đánh dấu là thông báo quan trọng (Ghim đầu trang)</span>
                </label>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-md"
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
