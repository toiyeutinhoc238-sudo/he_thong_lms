import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity } from '../types';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import {
  Play,
  CheckCircle2,
  Clock,
  Check,
  ExternalLink,
  RotateCcw,
  Radio
} from 'lucide-react';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
    __lmsYTReadyQueue?: Array<() => void>;
  }
}

function loadYouTubeIframeAPI(): Promise<any> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    window.__lmsYTReadyQueue = window.__lmsYTReadyQueue || [];
    window.__lmsYTReadyQueue.push(() => resolve(window.YT));

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        const q = window.__lmsYTReadyQueue || [];
        window.__lmsYTReadyQueue = [];
        q.forEach(fn => fn());
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
}

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

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
  const { updateLocalVideoProgress, currentUser } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  const savedVp = activity.videoProgress;
  const initialMaxWatched = savedVp?.watchedSeconds ?? activity.watchedSeconds ?? 0;
  const initialLastPos = savedVp?.lastPositionSeconds ?? initialMaxWatched;
  const initialDuration = savedVp?.totalSeconds || activity.videoDuration || 0;
  const initialMaxPercent = savedVp?.progressPercent ?? (
    initialDuration > 0 ? Math.min(100, Math.round((initialMaxWatched / initialDuration) * 100)) : (activity.isCompleted ? 100 : 0)
  );

  const [currentTime, setCurrentTime] = useState<number>(initialLastPos);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [maxWatchedSeconds, setMaxWatchedSeconds] = useState<number>(initialMaxWatched);
  const [progressPercent, setProgressPercent] = useState<number>(initialMaxPercent);
  const [isCompleted, setIsCompleted] = useState<boolean>(activity.isCompleted || initialMaxPercent >= 80);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [ytApiActive, setYtApiActive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncText, setLastSyncText] = useState<string>('');
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(initialLastPos > 10 && initialLastPos < (initialDuration - 10));

  const lastSyncMsRef = useRef<number>(0);
  const unsyncedDeltaRef = useRef<number>(0);
  const maxPctRef = useRef<number>(initialMaxPercent);
  const maxWatchedRef = useRef<number>(initialMaxWatched);
  const isCompletedRef = useRef<boolean>(isCompleted);
  const latestPosRef = useRef<number>(initialLastPos);
  const latestDurRef = useRef<number>(initialDuration);

  isCompletedRef.current = isCompleted;
  maxPctRef.current = progressPercent;
  maxWatchedRef.current = maxWatchedSeconds;
  latestPosRef.current = currentTime;
  latestDurRef.current = duration;

  const ytVideoId = extractYouTubeId(activity.videoUrl);

  // Reset state if switching between different video activities
  useEffect(() => {
    const vp = activity.videoProgress;
    const maxW = vp?.watchedSeconds ?? activity.watchedSeconds ?? 0;
    const lastP = vp?.lastPositionSeconds ?? maxW;
    const dur = vp?.totalSeconds || activity.videoDuration || 0;
    const pct = vp?.progressPercent ?? (dur > 0 ? Math.min(100, Math.round((maxW / dur) * 100)) : (activity.isCompleted ? 100 : 0));

    setCurrentTime(lastP);
    setDuration(dur);
    setMaxWatchedSeconds(maxW);
    setProgressPercent(pct);
    setIsCompleted(activity.isCompleted || pct >= 80);
    setShowResumeBanner(lastP > 10 && dur > 0 && lastP < dur - 10);
    unsyncedDeltaRef.current = 0;
  }, [activity.id]);

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Đồng bộ tiến độ xem video lên máy chủ LMS (kèm bảo toàn % cao nhất & đồng bộ AppContext)
  const syncProgressToServer = useCallback(async (posSecs: number, totalSecs: number, pct: number, force = false) => {
    if (!currentUser?.id) return;
    const now = Date.now();
    if (!force && now - lastSyncMsRef.current < 4500) return;
    lastSyncMsRef.current = now;

    const delta = Math.round(unsyncedDeltaRef.current);
    unsyncedDeltaRef.current = 0;

    const highWatched = Math.max(maxWatchedRef.current, Math.floor(posSecs));
    const highPct = Math.min(100, Math.max(maxPctRef.current, Math.round(pct)));

    try {
      setIsSyncing(true);
      const res = await api.activities.updateVideoProgress(courseId, activity.id, {
        watchedSeconds: Math.floor(posSecs),
        totalSeconds: Math.floor(totalSecs),
        progressPercent: highPct,
        deltaSeconds: delta
      });

      const serverVp = res?.videoProgress || {
        watchedSeconds: highWatched,
        lastPositionSeconds: Math.floor(posSecs),
        totalSeconds: Math.floor(totalSecs),
        progressPercent: highPct
      };
      const done = Boolean(res?.isCompleted || isCompletedRef.current || highPct >= 80);

      setProgressPercent(serverVp.progressPercent);
      setMaxWatchedSeconds(serverVp.watchedSeconds);
      if (done && !isCompletedRef.current) {
        setIsCompleted(true);
        if (onCompleted) onCompleted();
      }
      updateLocalVideoProgress(courseId, activity.id, serverVp, done);
      setLastSyncText(new Date().toLocaleTimeString('vi-VN'));
    } catch (e) {
      // Khôi phục delta nếu gửi lỗi tạm thời
      unsyncedDeltaRef.current += delta;
    } finally {
      setIsSyncing(false);
    }
  }, [courseId, activity.id, currentUser?.id, onCompleted, updateLocalVideoProgress]);

  // Đồng bộ lần cuối khi rời trang / đóng hoạt động
  useEffect(() => {
    return () => {
      if (unsyncedDeltaRef.current > 0 || latestPosRef.current > 0) {
        syncProgressToServer(latestPosRef.current, latestDurRef.current, maxPctRef.current, true);
      }
    };
  }, [syncProgressToServer]);

  // Khởi tạo YouTube IFrame Player API thật để đo chính xác % và từng giây xem YouTube!
  useEffect(() => {
    if (!ytVideoId || !ytContainerRef.current) return;
    let destroyed = false;
    let pollTimer: number | null = null;

    loadYouTubeIframeAPI().then((YT) => {
      if (destroyed || !ytContainerRef.current || !YT?.Player) return;

      // Xóa node con cũ trước khi mount player mới
      ytContainerRef.current.innerHTML = '';
      const mountEl = document.createElement('div');
      mountEl.className = 'w-full h-full';
      ytContainerRef.current.appendChild(mountEl);

      ytPlayerRef.current = new YT.Player(mountEl, {
        videoId: ytVideoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (ev: any) => {
            if (destroyed) return;
            setYtApiActive(true);
            const dur = Math.floor(ev.target.getDuration?.() || 0);
            if (dur > 0) setDuration(dur);
          },
          onStateChange: (ev: any) => {
            if (destroyed) return;
            const state = ev.data;
            const cur = Math.floor(ev.target.getCurrentTime?.() || 0);
            const dur = Math.floor(ev.target.getDuration?.() || latestDurRef.current || 0);
            if (dur > 0) setDuration(dur);

            if (state === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setShowResumeBanner(false);
              if (pollTimer) window.clearInterval(pollTimer);
              pollTimer = window.setInterval(() => {
                const p = ytPlayerRef.current;
                if (!p || typeof p.getCurrentTime !== 'function') return;
                const c = Math.floor(p.getCurrentTime() || 0);
                const d = Math.floor(p.getDuration() || latestDurRef.current || 0);
                if (d > 0) {
                  const currentPct = Math.min(100, Math.round((c / d) * 100));
                  const nextHighPct = Math.max(maxPctRef.current, currentPct);
                  const nextHighSecs = Math.max(maxWatchedRef.current, c);
                  unsyncedDeltaRef.current += 1;

                  setCurrentTime(c);
                  setDuration(d);
                  setMaxWatchedSeconds(nextHighSecs);
                  setProgressPercent(nextHighPct);

                  const crossed80 = nextHighPct >= 80 && !isCompletedRef.current;
                  if (crossed80) {
                    setIsCompleted(true);
                    syncProgressToServer(c, d, nextHighPct, true);
                  } else {
                    syncProgressToServer(c, d, nextHighPct, false);
                  }
                }
              }, 1000);
            } else {
              setIsPlaying(false);
              if (pollTimer) {
                window.clearInterval(pollTimer);
                pollTimer = null;
              }
              if (state === YT.PlayerState.ENDED) {
                const finalDur = dur || latestDurRef.current || 1;
                setCurrentTime(finalDur);
                setMaxWatchedSeconds(finalDur);
                setProgressPercent(100);
                setIsCompleted(true);
                syncProgressToServer(finalDur, finalDur, 100, true);
              } else if (state === YT.PlayerState.PAUSED && dur > 0) {
                const pct = Math.max(maxPctRef.current, Math.min(100, Math.round((cur / dur) * 100)));
                setCurrentTime(cur);
                setProgressPercent(pct);
                syncProgressToServer(cur, dur, pct, true);
              }
            }
          }
        }
      });
    });

    return () => {
      destroyed = true;
      if (pollTimer) window.clearInterval(pollTimer);
      try { ytPlayerRef.current?.destroy?.(); } catch {}
      ytPlayerRef.current = null;
    };
  }, [ytVideoId, syncProgressToServer]);

  // Xử lý sự kiện video HTML5 (MP4 / WebM)
  const lastHtml5TickRef = useRef<number>(0);
  const handleHtml5TimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    const cur = el.currentTime;
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : duration;
    if (!dur) return;

    const nowMs = Date.now();
    if (!el.paused && lastHtml5TickRef.current > 0) {
      const diff = (nowMs - lastHtml5TickRef.current) / 1000;
      if (diff > 0 && diff < 3) unsyncedDeltaRef.current += diff;
    }
    lastHtml5TickRef.current = nowMs;

    const currentPct = Math.min(100, Math.round((cur / dur) * 100));
    const nextHighPct = Math.max(maxPctRef.current, currentPct);
    const nextHighSecs = Math.max(maxWatchedRef.current, Math.floor(cur));

    setCurrentTime(cur);
    setDuration(dur);
    setMaxWatchedSeconds(nextHighSecs);
    setProgressPercent(nextHighPct);

    const crossed80 = nextHighPct >= 80 && !isCompletedRef.current;
    if (crossed80) {
      setIsCompleted(true);
      syncProgressToServer(cur, dur, nextHighPct, true);
    } else {
      syncProgressToServer(cur, dur, nextHighPct, false);
    }
  };

  const handleResume = () => {
    setShowResumeBanner(false);
    if (videoRef.current) {
      videoRef.current.currentTime = initialLastPos;
      videoRef.current.play().catch(() => {});
    } else if (ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(initialLastPos, true);
      ytPlayerRef.current.playVideo?.();
    }
  };

  const handleMarkCompleteNow = () => {
    const finalDur = duration > 0 ? duration : (activity.durationMinutes || 5) * 60;
    setCurrentTime(finalDur);
    setDuration(finalDur);
    setMaxWatchedSeconds(finalDur);
    setProgressPercent(100);
    setIsCompleted(true);
    syncProgressToServer(finalDur, finalDur, 100, true);
  };

  return (
    <div className="space-y-5">
      {/* Khung phát Video chính */}
      <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
        {/* Banner tiếp tục xem từ vị trí cũ */}
        {showResumeBanner && (
          <div className="px-4 py-2.5 bg-sky-950/90 border-b border-sky-800/70 flex items-center justify-between gap-3 text-xs text-sky-100">
            <span className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Lần trước bạn đã xem đến <strong>{formatTime(initialLastPos)}</strong> ({initialMaxPercent}%).</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResume}
                className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors"
              >
                Tiếp tục xem
              </button>
              <button
                type="button"
                onClick={() => setShowResumeBanner(false)}
                className="px-2 py-1 text-sky-300 hover:text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
          {ytVideoId ? (
            <div ref={ytContainerRef} className="w-full h-full" />
          ) : activity.videoUrl ? (
            <video
              ref={videoRef}
              controls
              src={activity.videoUrl}
              className="w-full h-full object-contain"
              onLoadedMetadata={() => {
                if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
                  setDuration(videoRef.current.duration);
                }
              }}
              onPlay={() => {
                setIsPlaying(true);
                setShowResumeBanner(false);
                lastHtml5TickRef.current = Date.now();
              }}
              onPause={() => {
                setIsPlaying(false);
                lastHtml5TickRef.current = 0;
                syncProgressToServer(currentTime, duration, progressPercent, true);
              }}
              onTimeUpdate={handleHtml5TimeUpdate}
              onEnded={() => {
                setIsPlaying(false);
                const dur = videoRef.current?.duration || duration || 1;
                setCurrentTime(dur);
                setMaxWatchedSeconds(Math.floor(dur));
                setProgressPercent(100);
                setIsCompleted(true);
                syncProgressToServer(dur, dur, 100, true);
              }}
            />
          ) : (
            <div className="text-center p-8 text-slate-400 space-y-2">
              <Play className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm">Chưa có đường dẫn video. Giáo viên có thể bấm Sửa ở ngoài để chèn link YouTube hoặc MP4.</p>
            </div>
          )}
        </div>

        {/* Thanh giám sát tiến độ xem video tự động theo thời gian thực */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isCompleted ? 'bg-emerald-400' : isPlaying ? 'bg-sky-400 animate-ping' : 'bg-amber-400'
              }`} />
              <span className="text-xs font-bold text-slate-200">
                Tiến độ đã xem: <span className="text-[#38bdf8] font-mono text-sm">{progressPercent}%</span>
                <span className="text-slate-400 font-normal ml-1.5 font-mono">
                  ({formatTime(maxWatchedSeconds)}{duration > 0 ? ` / ${formatTime(duration)}` : ''})
                </span>
              </span>
              {ytVideoId && ytApiActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-semibold">
                  <Radio className="w-3 h-3" />
                  Đo tự động YouTube
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đã hoàn thành (≥80%)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xem từ 80% để hoàn thành</span>
                </span>
              )}

              {!isCompleted && (
                <button
                  type="button"
                  onClick={handleMarkCompleteNow}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Đánh dấu đã xem xong</span>
                </button>
              )}
            </div>
          </div>

          {/* Thanh tiến độ có vạch mốc 80% */}
          <div className="relative w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-sky-500 to-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-300/80"
              style={{ left: '80%' }}
              title="Mốc hoàn thành 80%"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Vị trí đang phát: <strong className="text-slate-200 font-mono">{formatTime(currentTime)}</strong> • Mốc hoàn thành: <strong className="text-amber-300">80%</strong>
            </span>
            <div className="text-[10px]">
              {isSyncing ? (
                <span className="text-[#38bdf8]">Đang lưu tiến độ lên sổ điểm...</span>
              ) : lastSyncText ? (
                <span className="text-emerald-400">✓ Đã lưu lên hệ thống lúc {lastSyncText}</span>
              ) : (
                <span>Tự động lưu mỗi 5 giây khi phát video</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin mô tả bài giảng */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
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
            <span>Nguồn video:</span>
            <a
              href={activity.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#0374b5] hover:underline font-mono truncate max-w-md flex items-center gap-1"
            >
              <span>{activity.videoUrl}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
