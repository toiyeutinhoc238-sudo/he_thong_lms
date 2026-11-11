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
  CheckCircle2
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
    activeRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<CourseNavTab>('modules');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

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

  const courseTopics = forumTopics.filter(t => t.courseId === activeCourse.id);

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
                <p className="text-xs text-slate-500">Trao đổi học thuật giữa sinh viên và giảng viên</p>
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

        {/* Tab 4: Thành viên (People) */}
        {activeTab === 'people' && (
          <div className="p-6 max-w-4xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
              Danh sách thành viên lớp học
            </h2>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#0374b5] text-white font-bold flex items-center justify-center text-sm">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{currentUser.name}</h4>
                  <p className="text-xs text-slate-500">{currentUser.email} • {currentUser.code || currentUser.email?.split('@')[0]?.toUpperCase()}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-[#0374b5]/10 text-[#0374b5] text-xs font-bold rounded-full capitalize">
                {currentUser.role}
              </span>
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
              <p><strong>Số tín chỉ:</strong> {activeCourse.credits || 3} tín chỉ</p>
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
