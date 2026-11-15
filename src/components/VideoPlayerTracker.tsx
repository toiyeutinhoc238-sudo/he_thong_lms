import React, { useState, useEffect, useRef } from 'react';
import { Activity } from '../types';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  RotateCcw, 
  Clock, 
  Check, 
  ExternalLink,
  Sparkles,
  Volume2
} from 'lucide-react';

interface VideoPlayerTrackerProps {
  activity: Activity;
  courseId: string;
  onCompleted?: () => void;
}

export const VideoPlayerTracker: React.FC<VideoPlayerTrackerProps> = ({ 
  activity, 
  courseId,
  onCompleted 
}) => {
  const { markActivityCompleted } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);

  const initialWatched = activity.watchedSeconds || 0;
  const initialDuration = activity.videoDuration || 0;
  const initialPercent = initialDuration > 0 ? Math.round((initialWatched / initialDuration) * 100) : (activity.isCompleted ? 100 : 0);

  const [currentTime, setCurrentTime] = useState<number>(initialWatched);
  const [duration, setDuration] = useState<number>(initialDuration || 300); // mặc định 5 phút nếu chưa có metadata
  const [progressPercent, setProgressPercent] = useState<number>(initialPercent);
  const [isCompleted, setIsCompleted] = useState<boolean>(activity.isCompleted || initialPercent >= 80);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncText, setLastSyncText] = useState<string>('');

  const lastSyncTimeRef = useRef<number>(0);
  const isCompletedRef = useRef<boolean>(isCompleted);
  isCompletedRef.current = isCompleted;

  // Format giây thành mm:ss
  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isYouTube = (url?: string) => {
    return !!url && (url.includes('youtube.com') || url.includes('youtu.be'));
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

  // Đồng bộ tiến độ xem video lên máy chủ LMS
  const syncProgressToServer = async (watchedSecs: number, totalSecs: number, percent: number) => {
    try {
      setIsSyncing(true);
      const res = await api.activities.updateVideoProgress(courseId, activity.id, {
        watchedSeconds: Math.floor(watchedSecs),
        totalSeconds: Math.floor(totalSecs),
        progressPercent: percent
      });

      if (res && res.isCompleted && !isCompletedRef.current) {
        setIsCompleted(true);
        markActivityCompleted(courseId, activity.id);
        if (onCompleted) onCompleted();
      }

      setLastSyncText(new Date().toLocaleTimeString('vi-VN'));
    } catch (e) {
      console.warn('Lỗi đồng bộ tiến độ video:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Xử lý sự kiện video HTML5
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration || 1;
    const pct = Math.min(100, Math.round((cur / dur) * 100));

    setCurrentTime(cur);
    if (dur && Number.isFinite(dur)) setDuration(dur);
    setProgressPercent(pct);

    if (pct >= 80 && !isCompletedRef.current) {
      setIsCompleted(true);
      markActivityCompleted(courseId, activity.id);
      syncProgressToServer(cur, dur, pct);
      if (onCompleted) onCompleted();
      return;
    }

    // Throttle gửi lên máy chủ mỗi 5 giây
    const now = Date.now();
    if (now - lastSyncTimeRef.current > 5000) {
      lastSyncTimeRef.current = now;
      syncProgressToServer(cur, dur, pct);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setProgressPercent(100);
    setIsCompleted(true);
    markActivityCompleted(courseId, activity.id);
    syncProgressToServer(duration, duration, 100);
    if (onCompleted) onCompleted();
  };

  // Nút thủ công: điều chỉnh tiến độ hoặc bấm đã xem xong
  const handleManualSetPercent = (pct: number) => {
    const targetTime = Math.round((pct / 100) * duration);
    setCurrentTime(targetTime);
    setProgressPercent(pct);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
    if (pct >= 80 && !isCompletedRef.current) {
      setIsCompleted(true);
      markActivityCompleted(courseId, activity.id);
      if (onCompleted) onCompleted();
    }
    syncProgressToServer(targetTime, duration, pct);
  };

  const handleMarkCompleteNow = () => {
    handleManualSetPercent(100);
  };

  return (
    <div className="space-y-6">
      {/* Khung phát Video chính */}
      <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
        <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
          {activity.videoUrl && isYouTube(activity.videoUrl) ? (
            <iframe 
              className="w-full h-full"
              src={getYouTubeEmbedUrl(activity.videoUrl)} 
              title={activity.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          ) : activity.videoUrl ? (
            <video 
              ref={videoRef}
              controls 
              src={activity.videoUrl} 
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
              onPause={() => syncProgressToServer(currentTime, duration, progressPercent)}
            />
          ) : (
            <div className="text-center p-8 text-slate-400 space-y-2">
              <Play className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm">Chưa có đường dẫn video. Giáo viên có thể bấm Sửa ở ngoài để chèn link YouTube hoặc MP4.</p>
            </div>
          )}
        </div>

        {/* Thanh giám sát tiến độ xem video trực tiếp */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              <span className="text-xs font-bold text-slate-200">
                Tiến độ học sinh xem: <span className="text-[#38bdf8] font-mono text-sm">{progressPercent}%</span>
                <span className="text-slate-400 font-normal ml-1">
                  ({formatTime(currentTime)} / {formatTime(duration)})
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đạt yêu cầu hoàn thành (≥80%)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xem tối thiểu 80% để ghi nhận</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleMarkCompleteNow}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Xem lại (100%)' : 'Đã xem xong'}</span>
              </button>
            </div>
          </div>

          {/* Progress bar trực quan */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : 'bg-gradient-to-r from-sky-500 to-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Điều khiển tiến độ tương tác (cho cả YouTube lẫn MP4) */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>Điều chỉnh nhanh:</span>
              <button 
                type="button" 
                onClick={() => handleManualSetPercent(25)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                25%
              </button>
              <button 
                type="button" 
                onClick={() => handleManualSetPercent(50)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                50%
              </button>
              <button 
                type="button" 
                onClick={() => handleManualSetPercent(80)}
                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
              >
                80% (Đạt)
              </button>
              <button 
                type="button" 
                onClick={() => handleManualSetPercent(100)}
                className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              >
                100%
              </button>
            </div>

            <div className="text-slate-400 text-[10px]">
              {isSyncing ? (
                <span className="text-[#38bdf8]">Đang đồng bộ lên sổ điểm...</span>
              ) : lastSyncText ? (
                <span>LMS ghi nhận: {lastSyncText}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin mô tả bài giảng */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800">
            {activity.title}
          </h2>
          <span className="px-3 py-1 bg-sky-50 text-[#0374b5] text-xs font-bold rounded-full">
            Video bài giảng tương tác
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {activity.description || 'Bài giảng video trực tuyến cung cấp kiến thức trọng tâm của bài học.'}
        </p>

        {activity.videoUrl && (
          <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100">
            <span>Đường dẫn bài giảng:</span>
            <a 
              href={activity.videoUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-[#0374b5] hover:underline font-mono truncate max-w-md flex items-center gap-1"
            >
              <span>{activity.videoUrl}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
