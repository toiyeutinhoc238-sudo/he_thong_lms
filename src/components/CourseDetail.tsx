import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Play, 
  FileText, 
  CheckCircle, 
  Circle, 
  Clock, 
  HelpCircle, 
  Upload, 
  MessageSquare, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Mail, 
  BookOpen, 
  Calendar, 
  Sparkles,
  Send,
  Plus
} from 'lucide-react';
import { Activity } from '../types';

export const CourseDetail: React.FC = () => {
  const { 
    activeCourse, 
    setCurrentView, 
    navigateToActivity, 
    forumTopics, 
    createForumTopic,
    setActiveCertificate,
    certificates,
    activeRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'content' | 'announcements' | 'forum' | 'syllabus'>('content');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'mod-1': true,
    'mod-2': true,
    'mod-3': true,
    'mod-cntt-1': true,
    'mod-shcd-1': true,
    'mod-stem-1': true
  });

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  if (!activeCourse) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-600">Không tìm thấy thông tin khóa học.</p>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 bg-hcmue-700 text-white rounded-xl text-xs font-bold"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  const toggleModule = (modId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4 text-blue-600 fill-blue-600/20" />;
      case 'document':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'assignment':
        return <Upload className="w-4 h-4 text-purple-600" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-amber-600" />;
      case 'forum':
        return <MessageSquare className="w-4 h-4 text-teal-600" />;
    }
  };

  const getActivityTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'video': return 'Video bài giảng';
      case 'document': return 'Tài liệu / Slide';
      case 'assignment': return 'Bài tập nộp';
      case 'quiz': return 'Kiểm tra trắc nghiệm';
      case 'forum': return 'Thảo luận chuyên đề';
    }
  };

  // Check if course certificate is issued
  const courseCertificate = certificates.find(c => c.courseId === activeCourse.id);

  const handlePostTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;
    createForumTopic(activeCourse.id, newTopicTitle, newTopicContent);
    setNewTopicTitle('');
    setNewTopicContent('');
    setIsCreatingTopic(false);
  };

  const courseForums = forumTopics.filter(t => t.courseId === activeCourse.id);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => setCurrentView('dashboard')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-hcmue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh sách khóa học</span>
      </button>

      {/* Course Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="relative bg-gradient-to-r from-hcmue-900 via-hcmue-800 to-hcmue-700 text-white p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-900 font-extrabold text-[11px] uppercase tracking-wider">
                  {activeCourse.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-xs text-slate-200 text-xs">
                  {activeCourse.credits > 0 ? `${activeCourse.credits} Tín chỉ` : 'Học phần bắt buộc'}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-xs text-slate-200 text-xs">
                  {activeCourse.semester} ({activeCourse.academicYear})
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                {activeCourse.name}
              </h1>

              <div className="flex items-center gap-3 pt-1">
                <img 
                  src={activeCourse.instructor.avatar} 
                  alt={activeCourse.instructor.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30" 
                />
                <div className="text-xs">
                  <div className="font-bold text-white">{activeCourse.instructor.name}</div>
                  <div className="text-slate-300 text-[11px]">{activeCourse.instructor.title}</div>
                </div>
              </div>
            </div>

            {/* Course Progress Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[260px] space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-200">Tiến độ hoàn thành</span>
                <span className={`text-base font-black ${activeCourse.progress === 100 ? 'text-amber-300' : 'text-white'}`}>
                  {activeCourse.progress}%
                </span>
              </div>

              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    activeCourse.progress === 100 ? 'bg-amber-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${activeCourse.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>{activeCourse.completedActivities} / {activeCourse.totalActivities} hoạt động hoàn thành</span>
                {activeCourse.progress === 100 && (
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Đạt 100%
                  </span>
                )}
              </div>

              {/* Certificate Button if 100% completed */}
              {activeCourse.progress === 100 && (
                <button
                  onClick={() => {
                    if (courseCertificate) {
                      setActiveCertificate(courseCertificate);
                    } else {
                      setCurrentView('certificates');
                    }
                  }}
                  className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Xem Chứng chỉ Khóa học</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-4 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'content'
                ? 'border-hcmue-700 text-hcmue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Nội dung bài học ({activeCourse.modules.length} chuyên đề)
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-4 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'border-hcmue-700 text-hcmue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Thông báo môn học</span>
            {activeCourse.announcements.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-hcmue-700 text-[10px] font-bold">
                {activeCourse.announcements.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('forum')}
            className={`py-4 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'forum'
                ? 'border-hcmue-700 text-hcmue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Diễn đàn thảo luận</span>
            {courseForums.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {courseForums.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`py-4 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'syllabus'
                ? 'border-hcmue-700 text-hcmue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Đề cương & Chuẩn đầu ra
          </button>
        </div>
      </div>

      {/* Tab 1: Modules and Activities List */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {activeCourse.modules.map((module, mIdx) => {
            const isExpanded = expandedModules[module.id] ?? true;
            const completedCount = module.activities.filter(a => a.isCompleted).length;
            const totalCount = module.activities.length;
            const isModuleDone = totalCount > 0 && completedCount === totalCount;

            return (
              <div 
                key={module.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
              >
                {/* Module Header Bar */}
                <div 
                  onClick={() => toggleModule(module.id)}
                  className="p-5 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between border-b border-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isModuleDone 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-hcmue-100 text-hcmue-800'
                    }`}>
                      {mIdx + 1}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                        {module.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                      {completedCount}/{totalCount} hoạt động
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Activities List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {module.activities.map((activity) => (
                      <div
                        key={activity.id}
                        onClick={() => navigateToActivity(activeCourse.id, activity.id)}
                        className="p-4 sm:px-6 hover:bg-blue-50/40 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          {/* Completion indicator */}
                          <div className="shrink-0">
                            {activity.isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                            )}
                          </div>

                          {/* Activity Type Icon badge */}
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {getActivityIcon(activity.type)}
                          </div>

                          {/* Activity Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-hcmue-700 transition-colors truncate">
                                {activity.title}
                              </span>
                              {activity.isRequired && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                  Bắt buộc
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span>{getActivityTypeLabel(activity.type)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {activity.durationMinutes} phút
                              </span>

                              {/* If quiz score is available */}
                              {activity.score !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-bold">
                                    Điểm: {activity.score}/{activity.maxScore || 10}
                                  </span>
                                </>
                              )}

                              {/* If assignment status */}
                              {activity.submission && (
                                <>
                                  <span>•</span>
                                  <span className={`font-semibold ${
                                    activity.submission.status === 'graded' 
                                      ? 'text-emerald-600' 
                                      : 'text-purple-600'
                                  }`}>
                                    {activity.submission.status === 'graded' 
                                      ? `Đã chấm: ${activity.submission.grade}/10` 
                                      : 'Đã nộp bài'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action CTA */}
                        <div className="shrink-0">
                          <button className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-700 group-hover:bg-hcmue-700 group-hover:text-white shadow-xs">
                            {activity.isCompleted ? 'Xem lại' : 'Bắt đầu'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Announcements */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-800 text-base">
              Bảng tin & Thông báo môn học
            </h3>
            <span className="text-xs text-slate-500">
              {activeCourse.announcements.length} thông báo
            </span>
          </div>

          <div className="space-y-4">
            {activeCourse.announcements.map((anc) => (
              <div 
                key={anc.id}
                className={`p-5 rounded-2xl border space-y-2.5 ${
                  anc.isImportant 
                    ? 'bg-amber-50/40 border-amber-200' 
                    : 'bg-slate-50/60 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {anc.isImportant && (
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px] uppercase">
                        Quan trọng
                      </span>
                    )}
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                      {anc.title}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{anc.createdAt}</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {anc.content}
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  <span>{anc.author} ({anc.authorRole})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Forum Discussions */}
      {activeTab === 'forum' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Diễn đàn thảo luận môn học
              </h3>
              <p className="text-xs text-slate-400">
                Nơi đặt câu hỏi, chia sẻ quan điểm và thảo luận cùng Giảng viên & Bạn học
              </p>
            </div>

            <button
              onClick={() => setIsCreatingTopic(!isCreatingTopic)}
              className="px-3.5 py-2 bg-hcmue-700 hover:bg-hcmue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo chủ đề thảo luận</span>
            </button>
          </div>

          {/* Create Topic Form Modal / Box */}
          {isCreatingTopic && (
            <form onSubmit={handlePostTopic} className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Đăng câu hỏi hoặc chủ đề mới
              </h4>
              <input
                type="text"
                placeholder="Tiêu đề câu hỏi hoặc chủ đề..."
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-hcmue-500"
                required
              />
              <textarea
                placeholder="Nội dung chi tiết câu hỏi của bạn..."
                rows={3}
                value={newTopicContent}
                onChange={(e) => setNewTopicContent(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-hcmue-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTopic(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-hcmue-700 text-white hover:bg-hcmue-800"
                >
                  Đăng chủ đề
                </button>
              </div>
            </form>
          )}

          {/* Topics List */}
          <div className="space-y-4">
            {courseForums.length > 0 ? (
              courseForums.map(topic => (
                <div key={topic.id} className="p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={topic.author.avatar} 
                        alt={topic.author.name}
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                          {topic.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{topic.author.name}</span>
                          <span>•</span>
                          <span className="font-mono">{topic.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {topic.replies.length} phản hồi
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                    {topic.content}
                  </p>

                  {/* Replies */}
                  {topic.replies.length > 0 && (
                    <div className="pl-6 border-l-2 border-hcmue-200 space-y-3 pt-2">
                      {topic.replies.map(rep => (
                        <div key={rep.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{rep.author.name}</span>
                            {rep.isInstructorAnswer && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                Giảng viên
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">{rep.createdAt}</span>
                          </div>
                          <p className="text-xs text-slate-600 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/50">
                            {rep.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                Chưa có chủ đề thảo luận nào cho học phần này. Hãy là người đầu tiên đặt câu hỏi!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Syllabus */}
      {activeTab === 'syllabus' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-800 text-base">
              Đề cương chi tiết học phần & Chuẩn đầu ra (CLO)
            </h3>
            <p className="text-xs text-slate-500">
              Học phần thuộc khung chương trình đào tạo chuẩn của Trường Đại học Sư phạm TP.HCM
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-hcmue-800 mb-2">
                Mục tiêu học phần (Course Objectives)
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activeCourse.description}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-hcmue-800 mb-2">
                Kế hoạch giảng dạy theo tuần
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                {activeCourse.syllabus.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                    <span className="w-5 h-5 rounded-full bg-hcmue-100 text-hcmue-800 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

