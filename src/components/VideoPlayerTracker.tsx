import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, VideoCheckpoint, VideoCheckpointResult } from '../types';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import {
  Play,
  CheckCircle2,
  Clock,
  Check,
  ExternalLink,
  RotateCcw,
  Radio,
  ShieldAlert,
  Lock,
  AlertTriangle
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
  const { updateLocalVideoProgress, currentUser, activeRole } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  const canManage = Boolean(
    currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'lecturer' ||
    activeRole === 'admin' ||
    activeRole === 'lecturer'
  );

  // Sắp xếp danh sách neo chặn tăng dần theo mốc giây
  const checkpoints: VideoCheckpoint[] = useMemo(() => {
    return [...(activity.videoCheckpoints || [])].sort((a, b) => (a.timeSeconds || 0) - (b.timeSeconds || 0));
  }, [activity.videoCheckpoints]);

  const preventSkip = Boolean(activity.preventVideoSkip && checkpoints.length > 0) || Boolean(activity.preventVideoSkip);

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
  const [isCompleted, setIsCompleted] = useState<boolean>(activity.isCompleted || (initialMaxPercent >= 80 && checkpoints.length === 0));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [ytApiActive, setYtApiActive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncText, setLastSyncText] = useState<string>('');
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(initialLastPos > 10 && initialDuration > 0 && initialLastPos < (initialDuration - 10));

  // Trạng thái Neo Chặn tương tác (Interactive Checkpoints)
  const [checkpointResults, setCheckpointResults] = useState<Record<string, VideoCheckpointResult>>(
    () => (savedVp?.checkpointResults || {})
  );
  const [activeCheckpoint, setActiveCheckpoint] = useState<VideoCheckpoint | null>(null);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [cpFeedback, setCpFeedback] = useState<{ isCorrect: boolean; canContinue: boolean } | null>(null);
  const [skipWarning, setSkipWarning] = useState<string | null>(null);
  const [teacherBypass, setTeacherBypass] = useState<boolean>(false);

  const lastSyncMsRef = useRef<number>(0);
  const unsyncedDeltaRef = useRef<number>(0);
  const maxPctRef = useRef<number>(initialMaxPercent);
  const maxWatchedRef = useRef<number>(initialMaxWatched);
  const isCompletedRef = useRef<boolean>(isCompleted);
  const latestPosRef = useRef<number>(initialLastPos);
  const latestDurRef = useRef<number>(initialDuration);
  const cpResultsRef = useRef<Record<string, VideoCheckpointResult>>(checkpointResults);
  const activeCpRef = useRef<VideoCheckpoint | null>(activeCheckpoint);
  const teacherBypassRef = useRef<boolean>(teacherBypass);

  isCompletedRef.current = isCompleted;
  maxPctRef.current = progressPercent;
  maxWatchedRef.current = maxWatchedSeconds;
  latestPosRef.current = currentTime;
  latestDurRef.current = duration;
  cpResultsRef.current = checkpointResults;
  activeCpRef.current = activeCheckpoint;
  teacherBypassRef.current = teacherBypass;

  const ytVideoId = extractYouTubeId(activity.videoUrl);

  const isCheckpointCleared = useCallback((cp: VideoCheckpoint, results: Record<string, VideoCheckpointResult>) => {
    const r = results[cp.id];
    if (!r) return false;
    return cp.requireCorrect !== false ? r.isCorrect : true;
  }, []);

  const checkpointsPassedCount = useMemo(
    () => checkpoints.filter(cp => isCheckpointCleared(cp, checkpointResults)).length,
    [checkpoints, checkpointResults, isCheckpointCleared]
  );

  // Reset khi chuyển sang video khác
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
    setCheckpointResults(vp?.checkpointResults || {});
    setActiveCheckpoint(null);
    setPickedOption(null);
    setCpFeedback(null);
    setIsCompleted(activity.isCompleted || (pct >= 80 && checkpoints.length === 0));
    setShowResumeBanner(lastP > 10 && dur > 0 && lastP < dur - 10);
    unsyncedDeltaRef.current = 0;
  }, [activity.id, checkpoints.length]);

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pausePlayer = useCallback(() => {
    try { videoRef.current?.pause(); } catch {}
    try { ytPlayerRef.current?.pauseVideo?.(); } catch {}
  }, []);

  const playPlayer = useCallback(() => {
    try { videoRef.current?.play().catch(() => {}); } catch {}
    try { ytPlayerRef.current?.playVideo?.(); } catch {}
  }, []);

  const seekPlayer = useCallback((sec: number) => {
    const target = Math.max(0, Math.floor(sec));
    try {
      if (videoRef.current) videoRef.current.currentTime = target;
    } catch {}
    try {
      if (ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(target, true);
    } catch {}
  }, []);

  // Kiểm tra neo chặn & chống tua nhanh tại mốc thời gian `pos`
  const checkCheckpointsAndAntiSkip = useCallback((pos: number): boolean => {
    if (teacherBypassRef.current) return false;
    if (activeCpRef.current) {
      pausePlayer();
      return true;
    }

    // 1. Tìm neo chặn sớm nhất chưa vượt qua mà vị trí phát đã chạm hoặc vượt qua
    const blockingCp = checkpoints.find(cp => {
      if (isCheckpointCleared(cp, cpResultsRef.current)) return false;
      if (preventSkip) {
        return pos >= cp.timeSeconds;
      }
      return pos >= cp.timeSeconds && pos <= cp.timeSeconds + 3;
    });

    if (blockingCp) {
      pausePlayer();
      if (pos > blockingCp.timeSeconds + 2) {
        seekPlayer(blockingCp.timeSeconds);
        setCurrentTime(blockingCp.timeSeconds);
      }
      setActiveCheckpoint(blockingCp);
      setPickedOption(null);
      setCpFeedback(null);
      return true;
    }

    // 2. Chống tua nhanh vượt quá mốc đã xem (chỉ khi giáo viên bật preventVideoSkip)
    if (preventSkip && pos > maxWatchedRef.current + 6) {
      const snapTo = maxWatchedRef.current;
      seekPlayer(snapTo);
      setCurrentTime(snapTo);
      setSkipWarning('Giáo viên đã bật chống tua nhanh — vui lòng xem lần lượt video và vượt qua các neo chặn!');
      window.setTimeout(() => setSkipWarning(null), 4000);
      return true;
    }

    return false;
  }, [checkpoints, isCheckpointCleared, pausePlayer, preventSkip, seekPlayer]);

  // Đồng bộ tiến độ video + kết quả neo chặn lên server LMS
  const syncProgressToServer = useCallback(async (
    posSecs: number,
    totalSecs: number,
    pct: number,
    force = false,
    overrideCpResults?: Record<string, VideoCheckpointResult>
  ) => {
    if (!currentUser?.id) return;
    const now = Date.now();
    if (!force && now - lastSyncMsRef.current < 4500) return;
    lastSyncMsRef.current = now;

    const delta = Math.round(unsyncedDeltaRef.current);
    unsyncedDeltaRef.current = 0;

    const resultsToSave = overrideCpResults || cpResultsRef.current;
    const highWatched = Math.max(maxWatchedRef.current, Math.floor(posSecs));
    const highPct = Math.min(100, Math.max(maxPctRef.current, Math.round(pct)));

    try {
      setIsSyncing(true);
      const res = await api.activities.updateVideoProgress(courseId, activity.id, {
        watchedSeconds: Math.floor(posSecs),
        totalSeconds: Math.floor(totalSecs),
        progressPercent: highPct,
        deltaSeconds: delta,
        checkpointResults: resultsToSave
      });

      const serverVp = res?.videoProgress || {
        watchedSeconds: highWatched,
        lastPositionSeconds: Math.floor(posSecs),
        totalSeconds: Math.floor(totalSecs),
        progressPercent: highPct,
        checkpointResults: resultsToSave
      };
      const passedCount = checkpoints.filter(cp => isCheckpointCleared(cp, resultsToSave)).length;
      const done = Boolean(res?.isCompleted || isCompletedRef.current || (highPct >= 80 && passedCount >= checkpoints.length));

      setProgressPercent(serverVp.progressPercent);
      setMaxWatchedSeconds(serverVp.watchedSeconds);
      if (done && !isCompletedRef.current) {
        setIsCompleted(true);
        if (onCompleted) onCompleted();
      }
      updateLocalVideoProgress(courseId, activity.id, serverVp, done);
      setLastSyncText(new Date().toLocaleTimeString('vi-VN'));
    } catch {
      unsyncedDeltaRef.current += delta;
    } finally {
      setIsSyncing(false);
    }
  }, [courseId, activity.id, currentUser?.id, checkpoints, isCheckpointCleared, onCompleted, updateLocalVideoProgress]);

  // Giữ ref cho các hàm callback để YouTube Player KHÔNG bị hủy & tạo lại giữa chừng khi state cập nhật
  const checkCpRef = useRef(checkCheckpointsAndAntiSkip);
  checkCpRef.current = checkCheckpointsAndAntiSkip;
  const syncProgressRef = useRef(syncProgressToServer);
  syncProgressRef.current = syncProgressToServer;
  const checkpointsListRef = useRef(checkpoints);
  checkpointsListRef.current = checkpoints;
  const isCpClearedRef = useRef(isCheckpointCleared);
  isCpClearedRef.current = isCheckpointCleared;

  useEffect(() => {
    return () => {
      if (unsyncedDeltaRef.current > 0 || latestPosRef.current > 0) {
        syncProgressRef.current(latestPosRef.current, latestDurRef.current, maxPctRef.current, true);
      }
    };
  }, [activity.id]);

  // YouTube IFrame Player API thật (đo % + tạm dừng & chặn tua tại neo chặn)
  useEffect(() => {
    if (!ytVideoId || !ytContainerRef.current) return;
    let destroyed = false;
    let pollTimer: number | null = null;

    loadYouTubeIframeAPI().then((YT) => {
      if (destroyed || !ytContainerRef.current || !YT?.Player) return;

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

            if (state === YT.PlayerState.BUFFERING) {
              checkCpRef.current(cur);
              return;
            }

            if (state === YT.PlayerState.PLAYING) {
              if (activeCpRef.current) {
                ev.target.pauseVideo?.();
                return;
              }
              setIsPlaying(true);
              setShowResumeBanner(false);
              if (pollTimer) window.clearInterval(pollTimer);
              pollTimer = window.setInterval(() => {
                const p = ytPlayerRef.current;
                if (!p || typeof p.getCurrentTime !== 'function') return;
                const c = Math.floor(p.getCurrentTime() || 0);
                const d = Math.floor(p.getDuration() || latestDurRef.current || 0);

                // Kiểm tra neo chặn & chống tua trước khi cập nhật maxWatched!
                if (checkCpRef.current(c)) return;

                if (d > 0) {
                  const currentPct = Math.min(100, Math.round((c / d) * 100));
                  const nextHighPct = Math.max(maxPctRef.current, currentPct);
                  const nextHighSecs = Math.max(maxWatchedRef.current, c);
                  unsyncedDeltaRef.current += 0.8;

                  setCurrentTime(c);
                  setDuration(d);
                  setMaxWatchedSeconds(nextHighSecs);
                  setProgressPercent(nextHighPct);

                  const passedAll = checkpointsListRef.current.every(cp => isCpClearedRef.current(cp, cpResultsRef.current));
                  const crossed80 = nextHighPct >= 80 && passedAll && !isCompletedRef.current;
                  if (crossed80) {
                    setIsCompleted(true);
                    syncProgressRef.current(c, d, nextHighPct, true);
                  } else {
                    syncProgressRef.current(c, d, nextHighPct, false);
                  }
                }
              }, 800);
            } else {
              setIsPlaying(false);
              if (pollTimer) {
                window.clearInterval(pollTimer);
                pollTimer = null;
              }
              if (state === YT.PlayerState.ENDED) {
                const finalDur = dur || latestDurRef.current || 1;
                if (checkCpRef.current(finalDur)) return;
                setCurrentTime(finalDur);
                setMaxWatchedSeconds(finalDur);
                setProgressPercent(100);
                const passedAll = checkpointsListRef.current.every(cp => isCpClearedRef.current(cp, cpResultsRef.current));
                if (passedAll) setIsCompleted(true);
                syncProgressRef.current(finalDur, finalDur, 100, true);
              } else if (state === YT.PlayerState.PAUSED && dur > 0) {
                if (checkCpRef.current(cur)) return;
                const pct = Math.max(maxPctRef.current, Math.min(100, Math.round((cur / dur) * 100)));
                setCurrentTime(cur);
                setProgressPercent(pct);
                syncProgressRef.current(cur, dur, pct, true);
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
  }, [ytVideoId]);

  // Xử lý sự kiện video HTML5 (MP4 / WebM)
  const lastHtml5TickRef = useRef<number>(0);
  const handleHtml5TimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    const cur = el.currentTime;
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : duration;
    if (!dur) return;

    if (checkCheckpointsAndAntiSkip(cur)) return;

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

    const passedAll = checkpoints.every(cp => isCheckpointCleared(cp, cpResultsRef.current));
    const crossed80 = nextHighPct >= 80 && passedAll && !isCompletedRef.current;
    if (crossed80) {
      setIsCompleted(true);
      syncProgressToServer(cur, dur, nextHighPct, true);
    } else {
      syncProgressToServer(cur, dur, nextHighPct, false);
    }
  };

  // Xử lý học sinh chọn đáp án tại Neo chặn
  const handleAnswerCheckpoint = (optIdx: number) => {
    if (!activeCheckpoint) return;
    const isCorrect = optIdx === activeCheckpoint.correctAnswer;
    const prev = checkpointResults[activeCheckpoint.id];
    const nextResult: VideoCheckpointResult = {
      selectedAnswer: optIdx,
      isCorrect,
      attempts: (prev?.attempts || 0) + 1,
      answeredAt: new Date().toLocaleString('vi-VN')
    };
    const nextMap = { ...checkpointResults, [activeCheckpoint.id]: nextResult };

    setPickedOption(optIdx);
    setCheckpointResults(nextMap);
    cpResultsRef.current = nextMap;

    const requireRight = activeCheckpoint.requireCorrect !== false;
    setCpFeedback({
      isCorrect,
      canContinue: !requireRight || isCorrect
    });

    // Lưu ngay kết quả neo chặn lên máy chủ
    syncProgressToServer(latestPosRef.current, latestDurRef.current, maxPctRef.current, true, nextMap);
  };

  const handleContinueAfterCheckpoint = () => {
    const cp = activeCheckpoint;
    setActiveCheckpoint(null);
    setPickedOption(null);
    setCpFeedback(null);
    if (cp) {
      // Đẩy qua mốc neo 1 giây để không bị bật lại ngay
      const nextSec = Math.max(latestPosRef.current, cp.timeSeconds + 1);
      if (nextSec > maxWatchedRef.current) {
        setMaxWatchedSeconds(nextSec);
        maxWatchedRef.current = nextSec;
      }
      seekPlayer(nextSec);
    }
    playPlayer();
  };

  const handleResume = () => {
    setShowResumeBanner(false);
    seekPlayer(initialLastPos);
    playPlayer();
  };

  const handleMarkCompleteNow = () => {
    if (checkpoints.length > 0 && checkpointsPassedCount < checkpoints.length && !canManage) {
      const nextUnpassed = checkpoints.find(cp => !isCheckpointCleared(cp, checkpointResults));
      if (nextUnpassed) {
        setActiveCheckpoint(nextUnpassed);
        setPickedOption(null);
        setCpFeedback(null);
        pausePlayer();
        return;
      }
    }
    const finalDur = duration > 0 ? duration : (activity.durationMinutes || 5) * 60;
    setCurrentTime(finalDur);
    setDuration(finalDur);
    setMaxWatchedSeconds(finalDur);
    setProgressPercent(100);
    setIsCompleted(true);
    syncProgressToServer(finalDur, finalDur, 100, true);
  };

  const activeCpIndex = activeCheckpoint ? checkpoints.findIndex(c => c.id === activeCheckpoint.id) : -1;

  return (
    <div className="space-y-5">
      {/* Khung phát Video chính */}
      <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
        {/* Banner tiếp tục xem */}
        {showResumeBanner && (
          <div className="px-4 py-2.5 bg-sky-950/90 border-b border-sky-800/70 flex items-center justify-between gap-3 text-xs text-sky-100">
            <span className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Lần trước bạn đã xem đến <strong>{formatTime(initialLastPos)}</strong> ({initialMaxPercent}%).</span>
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleResume} className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold">
                Tiếp tục xem
              </button>
              <button type="button" onClick={() => setShowResumeBanner(false)} className="px-2 py-1 text-sky-300 hover:text-white">
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Cảnh báo chống tua nhanh */}
        {skipWarning && (
          <div className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{skipWarning}</span>
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
                if (activeCpRef.current) {
                  videoRef.current?.pause();
                  return;
                }
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
                if (checkCheckpointsAndAntiSkip(dur)) return;
                setCurrentTime(dur);
                setMaxWatchedSeconds(Math.floor(dur));
                setProgressPercent(100);
                if (checkpoints.every(cp => isCheckpointCleared(cp, cpResultsRef.current))) {
                  setIsCompleted(true);
                }
                syncProgressToServer(dur, dur, 100, true);
              }}
            />
          ) : (
            <div className="text-center p-8 text-slate-400 space-y-2">
              <Play className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm">Chưa có đường dẫn video. Giáo viên có thể bấm Sửa ở ngoài để chèn link YouTube hoặc MP4.</p>
            </div>
          )}

          {/* LỚP PHỦ NEO CHẶN CÂU HỎI TƯƠNG TÁC (CHECKPOINT OVERLAY) */}
          {activeCheckpoint && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-indigo-500 space-y-4 text-slate-900 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Neo chặn {activeCpIndex + 1}/{checkpoints.length} • {formatTime(activeCheckpoint.timeSeconds)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {activeCheckpoint.requireCorrect !== false ? 'Trả lời đúng để xem tiếp' : 'Trả lời để xem tiếp'}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                  {activeCheckpoint.question}
                </h3>

                <div className="space-y-2">
                  {activeCheckpoint.options.map((opt, idx) => {
                    const isPicked = pickedOption === idx;
                    const showResult = cpFeedback !== null;
                    const isRightOpt = idx === activeCheckpoint.correctAnswer;

                    let style = 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-800';
                    if (showResult && isPicked && cpFeedback.isCorrect) {
                      style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20';
                    } else if (showResult && isPicked && !cpFeedback.isCorrect) {
                      style = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                    } else if (showResult && cpFeedback.canContinue && isRightOpt) {
                      style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={Boolean(cpFeedback?.canContinue)}
                        onClick={() => handleAnswerCheckpoint(idx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 transition-all ${style}`}
                      >
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center font-black text-xs shrink-0">
                          {['A', 'B', 'C', 'D'][idx]}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {cpFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-3 ${
                    cpFeedback.isCorrect
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    <span>
                      {cpFeedback.isCorrect
                        ? '✓ Chính xác! Bạn đã vượt qua neo chặn này.'
                        : cpFeedback.canContinue
                          ? '✗ Chưa chính xác — hệ thống đã ghi nhận câu trả lời của bạn.'
                          : '✗ Chưa đúng rồi! Hãy chọn lại đáp án chính xác để tiếp tục xem video.'}
                    </span>

                    {cpFeedback.canContinue && (
                      <button
                        type="button"
                        onClick={handleContinueAfterCheckpoint}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm shrink-0 flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tiếp tục xem</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Thanh giám sát tiến độ + vạch Neo chặn */}
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
                  <Radio className="w-3 h-3" /> Đo tự động YouTube
                </span>
              )}
              {checkpoints.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 text-[10px] font-bold">
                  <ShieldAlert className="w-3 h-3 text-amber-300" />
                  Neo chặn: {checkpointsPassedCount}/{checkpoints.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {canManage && checkpoints.length > 0 && (
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teacherBypass}
                    onChange={(e) => setTeacherBypass(e.target.checked)}
                    className="accent-sky-400"
                  />
                  <span>GV xem thử không bị chặn</span>
                </label>
              )}

              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đã hoàn thành</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {checkpoints.length > 0
                      ? `Xem ≥80% & qua ${checkpoints.length} neo`
                      : 'Xem từ 80% để hoàn thành'}
                  </span>
                </span>
              )}

              {!isCompleted && (canManage || (!preventSkip && checkpoints.length === 0)) && (
                <button
                  type="button"
                  onClick={handleMarkCompleteNow}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Đánh dấu xem xong</span>
                </button>
              )}
            </div>
          </div>

          {/* Thanh tiến độ có vạch 80% và chốt Neo chặn */}
          <div className="relative w-full bg-slate-800 rounded-full h-3 overflow-visible">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-sky-500 to-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute top-0 bottom-0 w-0.5 bg-amber-300/70" style={{ left: '80%' }} title="Mốc hoàn thành 80%" />

            {duration > 0 && checkpoints.map((cp, idx) => {
              const leftPct = Math.min(98, Math.max(2, (cp.timeSeconds / duration) * 100));
              const cleared = isCheckpointCleared(cp, checkpointResults);
              return (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => {
                    if (canManage || cleared) {
                      setActiveCheckpoint(cp);
                      setPickedOption(checkpointResults[cp.id]?.selectedAnswer ?? null);
                      setCpFeedback(cleared ? { isCorrect: Boolean(checkpointResults[cp.id]?.isCorrect), canContinue: true } : null);
                      pausePlayer();
                    }
                  }}
                  style={{ left: `${leftPct}%` }}
                  title={`Neo chặn #${idx + 1} (${formatTime(cp.timeSeconds)}): ${cp.question}`}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm transition-transform hover:scale-125 ${
                    cleared ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              );
            })}
          </div>

          {/* Danh sách mốc Neo chặn */}
          {checkpoints.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Các mốc neo chặn:</span>
              {checkpoints.map((cp, idx) => {
                const cleared = isCheckpointCleared(cp, checkpointResults);
                return (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => {
                      if (canManage || cleared) {
                        setActiveCheckpoint(cp);
                        setPickedOption(checkpointResults[cp.id]?.selectedAnswer ?? null);
                        setCpFeedback(cleared ? { isCorrect: Boolean(checkpointResults[cp.id]?.isCorrect), canContinue: true } : null);
                        pausePlayer();
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      cleared
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {cleared ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>Neo {idx + 1} ({formatTime(cp.timeSeconds)})</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Vị trí đang phát: <strong className="text-slate-200 font-mono">{formatTime(currentTime)}</strong>
              {preventSkip ? ' • Chống tua nhanh: Đang bật' : ''}
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
          <h2 className="text-lg font-bold text-slate-800">{activity.title}</h2>
          <div className="flex items-center gap-2">
            {checkpoints.length > 0 && (
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                🚧 {checkpoints.length} neo chặn tương tác
              </span>
            )}
            <span className="px-3 py-1 bg-sky-50 text-[#0374b5] text-xs font-bold rounded-full">
              Video bài giảng
            </span>
          </div>
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
