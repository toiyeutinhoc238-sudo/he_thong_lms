import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QuizEngine } from './QuizEngine';
import { AssignmentSubmitter } from './AssignmentSubmitter';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Download, 
  FileText, 
  Check, 
  ExternalLink, 
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export const ActivityViewer: React.FC = () => {
  const { 
    activeCourse, 
    activeActivity, 
    setCurrentView, 
    markActivityCompleted, 
    navigateToActivity 
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(60); // %
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  if (!activeCourse || !activeActivity) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-600">Không tìm thấy hoạt động học tập.</p>
        <button 
          onClick={() => setCurrentView('course-detail')}
          className="px-4 py-2 bg-hcmue-700 text-white rounded-xl text-xs font-bold"
        >
          Quay lại khóa học
        </button>
      </div>
    );
  }

  // Find next activity in course
  let nextAct: { courseId: string; activityId: string; title: string } | null = null;
  let allActivities: any[] = [];
  activeCourse.modules.forEach(m => {
    m.activities.forEach(a => {
      allActivities.push(a);
    });
  });
  const currentIdx = allActivities.findIndex(a => a.id === activeActivity.id);
  if (currentIdx !== -1 && currentIdx < allActivities.length - 1) {
    nextAct = {
      courseId: activeCourse.id,
      activityId: allActivities[currentIdx + 1].id,
      title: allActivities[currentIdx + 1].title
    };
  }

  const handleMarkDone = () => {
    markActivityCompleted(activeCourse.id, activeActivity.id);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => setCurrentView('course-detail')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-hcmue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trở về: {activeCourse.name}</span>
        </button>

        <div className="flex items-center gap-3">
          {activeActivity.isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã hoàn thành hoạt động</span>
            </span>
          ) : (
            <button
              onClick={handleMarkDone}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-hcmue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Đánh dấu hoàn thành</span>
            </button>
          )}

          {nextAct && (
            <button
              onClick={() => navigateToActivity(nextAct!.courseId, nextAct!.activityId)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-hcmue-50 hover:bg-hcmue-100 text-hcmue-800 text-xs font-bold transition-all"
            >
              <span>Bài kế tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* RENDER BY ACTIVITY TYPE */}

      {/* 1. QUIZ TYPE */}
      {activeActivity.type === 'quiz' && (
        <QuizEngine 
          activity={activeActivity} 
          courseId={activeCourse.id} 
        />
      )}

      {/* 2. ASSIGNMENT TYPE */}
      {activeActivity.type === 'assignment' && (
        <AssignmentSubmitter 
          activity={activeActivity} 
          courseId={activeCourse.id} 
        />
      )}

      {/* 3. VIDEO TYPE */}
      {activeActivity.type === 'video' && (
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            {/* Video Player Box */}
            <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&enablejsapi=1" 
                title={activeActivity.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>

            {/* Video Action Toolbar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs text-slate-300">
                  Hệ thống đang tự động theo dõi thời lượng xem bài giảng
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleMarkDone}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeActivity.isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{activeActivity.isCompleted ? 'Đã ghi nhận hoàn thành' : 'Xác nhận hoàn thành bài xem'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Video Description and Notes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              {activeActivity.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeActivity.description || 'Bài giảng trực tuyến cung cấp các kiến thức trọng tâm của chuyên đề, đi kèm các ví dụ thực tiễn trong giảng dạy.'}
            </p>

            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 text-xs text-hcmue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-hcmue-700" />
                <span>Ghi chú học tập cho sinh viên:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Xem kỹ phần phân tích tình huống thực tế ở nửa sau video.</li>
                <li>Ghi chép lại 3 từ khóa chính để chuẩn bị cho bài kiểm tra trắc nghiệm tiếp theo.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. DOCUMENT TYPE */}
      {activeActivity.type === 'document' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    {activeActivity.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Dung lượng: {activeActivity.fileSize || '3.5 MB'} • {activeActivity.totalPages || 32} trang
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleMarkDone}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeActivity.isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-hcmue-700 text-white hover:bg-hcmue-800'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{activeActivity.isCompleted ? 'Đã hoàn thành đọc' : 'Đánh dấu đã đọc tài liệu'}</span>
                </button>

                <a
                  href={activeActivity.fileUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp PDF</span>
                </a>
              </div>
            </div>

            {/* Document Reader Simulator */}
            <div className="bg-slate-100 rounded-2xl p-6 sm:p-12 border border-slate-200 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-emerald-600">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-bold text-slate-800 text-base">
                  Bản xem trước tài liệu học tập
                </h3>
                <p className="text-xs text-slate-500">
                  Tài liệu giảng dạy chính thức của Trường Đại học Sư phạm TP.HCM. Bạn có thể xem trực tuyến hoặc tải bản PDF đầy đủ về thiết bị.
                </p>
              </div>
              <button 
                onClick={handleMarkDone}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                Xác nhận đã đọc & Hoàn thành tài liệu này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FORUM TYPE */}
      {activeActivity.type === 'forum' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            {activeActivity.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {activeActivity.description || 'Tham gia trao đổi cùng các bạn trong chuyên đề này.'}
          </p>
          <button 
            onClick={handleMarkDone}
            className="px-4 py-2 bg-hcmue-700 text-white rounded-xl text-xs font-bold"
          >
            Đánh dấu hoàn thành diễn đàn
          </button>
        </div>
      )}
    </div>
  );
};

