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
          className="px-4 py-2 bg-[#0374b5] text-white rounded-lg text-xs font-bold"
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
    (m.activities || []).forEach(a => {
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

  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=0&enablejsapi=1`;
    }
    return url;
  };

  const isYouTube = (url?: string) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => setCurrentView('course-detail')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0374b5] transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Đánh dấu hoàn thành</span>
            </button>
          )}

          {nextAct && (
            <button
              onClick={() => navigateToActivity(nextAct!.courseId, nextAct!.activityId)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0374b5] text-xs font-bold transition-all"
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
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
            {/* Video Player Box */}
            <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
              {activeActivity.videoUrl && isYouTube(activeActivity.videoUrl) ? (
                <iframe 
                  className="w-full h-full"
                  src={getYouTubeEmbedUrl(activeActivity.videoUrl)} 
                  title={activeActivity.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              ) : activeActivity.videoUrl ? (
                <video 
                  controls 
                  src={activeActivity.videoUrl} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8 text-slate-400 space-y-2">
                  <Play className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm">Chưa có đường dẫn video. Bạn có thể bấm Sửa ở ngoài để chèn link YouTube hoặc MP4.</p>
                </div>
              )}
            </div>

            {/* Video Action Toolbar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs text-slate-300">
                  Hệ thống LMS Nhóm 2 ghi nhận tiến độ học tập
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
                  <span>{activeActivity.isCompleted ? 'Đã hoàn thành' : 'Đánh dấu đã xem xong'}</span>
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
              {activeActivity.description || 'Bài giảng video trực tuyến cung cấp kiến thức trọng tâm của bài học.'}
            </p>

            {activeActivity.videoUrl && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Nguồn video:</span>
                <a 
                  href={activeActivity.videoUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[#0374b5] hover:underline font-mono truncate max-w-md"
                >
                  {activeActivity.videoUrl}
                </a>
              </div>
            )}
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
                      : 'bg-[#0374b5] text-white hover:bg-[#025a8c]'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{activeActivity.isCompleted ? 'Đã hoàn thành đọc' : 'Đánh dấu đã đọc tài liệu'}</span>
                </button>

                {activeActivity.fileUrl && (
                  <a
                    href={activeActivity.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở Liên Kết / Trang Gốc</span>
                  </a>
                )}
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
            className="px-4 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-lg text-xs font-bold"
          >
            Đánh dấu hoàn thành diễn đàn
          </button>
        </div>
      )}
    </div>
  );
};

