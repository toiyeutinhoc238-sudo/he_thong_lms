import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, VideoCheckpoint, VideoCheckpointResult } from '../types';
import { useApp } from '../context/AppContext';
import api, { API_BASE_URL, resolveBackendUrl } from '../services/api';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw,
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
  const { updateLocalVideoProgress, resetActivityProgress, currentUser, activeRole } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);

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

  const preventSkip = Boolean(activity.preventVideoSkip);
  const hasAntiSkipFeature = preventSkip || checkpoints.length > 0;

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
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
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

  const enforceAntiSkip = hasAntiSkipFeature && !teacherBypass;

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
  const hasAntiSkipRef = useRef<boolean>(hasAntiSkipFeature);
  const enforceAntiSkipRef = useRef<boolean>(enforceAntiSkip);
  const preventSkipRef = useRef<boolean>(preventSkip);

  isCompletedRef.current = isCompleted;
  maxPctRef.current = progressPercent;
  maxWatchedRef.current = maxWatchedSeconds;
  latestPosRef.current = currentTime;
  latestDurRef.current = duration;
  cpResultsRef.current = checkpointResults;
  activeCpRef.current = activeCheckpoint;
  teacherBypassRef.current = teacherBypass;
  hasAntiSkipRef.current = hasAntiSkipFeature;
  enforceAntiSkipRef.current = enforceAntiSkip;
  preventSkipRef.current = preventSkip;

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
    setHasStarted(false);
    setTeacherBypass(false);
    setPlaybackRate(1);
    setShowResumeBanner(lastP > 10 && dur > 0 && lastP < dur - 10);
    maxWatchedRef.current = maxW;
    maxPctRef.current = pct;
    latestPosRef.current = lastP;
    latestDurRef.current = dur;
    cpResultsRef.current = vp?.checkpointResults || {};
    activeCpRef.current = null;
    unsyncedDeltaRef.current = 0;
  }, [activity.id, checkpoints.length]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement && playerWrapperRef.current && document.fullscreenElement === playerWrapperRef.current));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const skipWarningTimerRef = useRef<number | null>(null);
  const flashSkipWarning = useCallback((msg: string) => {
    setSkipWarning(msg);
    if (skipWarningTimerRef.current !== null) {
      window.clearTimeout(skipWarningTimerRef.current);
    }
    skipWarningTimerRef.current = window.setTimeout(() => {
      setSkipWarning(null);
      skipWarningTimerRef.current = null;
    }, 3800);
  }, []);

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimeMs = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00.000';
    const totalMs = Math.round(secs * 1000);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    const msStr = ms.toString().padStart(3, '0');
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msStr}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msStr}`;
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
    // Giữ chính xác từng mili giây (0.001s) thay vì làm tròn xuống giây nguyên
    const target = Math.max(0, Math.round((Number(sec) || 0) * 1000) / 1000);
    try {
      if (videoRef.current) videoRef.current.currentTime = target;
    } catch {}
    try {
      if (ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(target, true);
    } catch {}
  }, []);

  // Kiểm tra neo chặn & chống tua nhanh chính xác từng mili giây tại mốc `pos`
  const checkCheckpointsAndAntiSkip = useCallback((pos: number): boolean => {
    if (teacherBypassRef.current) return false;
    if (activeCpRef.current) {
      pausePlayer();
      return true;
    }

    const exactPos = Math.max(0, Math.round((Number(pos) || 0) * 1000) / 1000);

    // 1. Tìm neo chặn sớm nhất chưa vượt qua mà vị trí phát đã chạm hoặc vượt qua (so sánh chính xác đến từng ms).
    //    Áp dụng cả khi tắt chống tua: kéo thanh thời gian vượt qua mốc vẫn bị đưa về mốc để trả lời câu hỏi.
    const blockingCp = checkpoints.find(cp => {
      if (isCheckpointCleared(cp, cpResultsRef.current)) return false;
      const cpTime = Math.max(0, Math.round((Number(cp.timeSeconds) || 0) * 1000) / 1000);
      return exactPos >= cpTime;
    });

    if (blockingCp) {
      const cpTime = Math.max(0, Math.round((Number(blockingCp.timeSeconds) || 0) * 1000) / 1000);
      activeCpRef.current = blockingCp;
      pausePlayer();
      if (Math.abs(exactPos - cpTime) > 0.12) {
        seekPlayer(cpTime);
      }
      latestPosRef.current = cpTime;
      setCurrentTime(cpTime);
      setActiveCheckpoint(blockingCp);
      setPickedOption(null);
      setCpFeedback(null);
      return true;
    }

    // 2. Chống tua nhanh vượt quá mốc đã xem (chặt chẽ 1.5s, áp dụng khi preventSkip hoặc có neo chặn)
    if ((preventSkipRef.current || checkpoints.length > 0) && exactPos > maxWatchedRef.current + 1.5) {
      const snapTo = Math.max(0, Math.round(maxWatchedRef.current * 1000) / 1000);
      seekPlayer(snapTo);
      latestPosRef.current = snapTo;
      setCurrentTime(snapTo);
      flashSkipWarning('Video đang khóa tua nhanh — vui lòng xem lần lượt và vượt qua các neo chặn!');
      return true;
    }

    return false;
  }, [checkpoints, flashSkipWarning, isCheckpointCleared, pausePlayer, seekPlayer]);

  // Nếu GV tắt chế độ "GV xem thử không bị chặn", ép tốc độ về 1x và kéo lại vị trí hợp lệ nếu đang vượt mốc
  useEffect(() => {
    if (!teacherBypass && hasAntiSkipFeature) {
      try {
        if (videoRef.current && videoRef.current.playbackRate !== 1) videoRef.current.playbackRate = 1;
        if (ytPlayerRef.current?.setPlaybackRate && ytPlayerRef.current.getPlaybackRate?.() !== 1) {
          ytPlayerRef.current.setPlaybackRate(1);
        }
      } catch {}
      setPlaybackRate(1);
      checkCheckpointsAndAntiSkip(latestPosRef.current);
    }
  }, [teacherBypass, hasAntiSkipFeature, checkCheckpointsAndAntiSkip]);

  // Đồng bộ tiến độ video + kết quả neo chặn lên server LMS
  const syncProgressToServer = useCallback(async (
    posSecs: number,
    totalSecs: number,
    pct: number,
    force = false,
    overrideCpResults?: Record<string, VideoCheckpointResult>,
    staffForceComplete = false
  ) => {
    if (!currentUser?.id) return;
    // Khi GV bật "xem thử không bị chặn", không tự động lưu vị trí tua thử làm sai lệch tiến độ học
    if (teacherBypassRef.current && !staffForceComplete) return;
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
        checkpointResults: resultsToSave,
        ...(staffForceComplete ? { staffForceComplete: true } : {})
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

      // Giữ mốc cao nhất giữa máy học sinh và server. KHÔNG hạ mốc xuống theo phản hồi server,
      // vì phản hồi về trễ 1–3 giây (lúc đó video đã chạy tiếp) — hạ mốc sẽ khiến bộ chống tua kéo video lùi lại.
      const nextPct = Math.max(maxPctRef.current, Number(serverVp.progressPercent) || 0);
      const nextWatched = Math.max(maxWatchedRef.current, Number(serverVp.watchedSeconds) || 0);
      setProgressPercent(nextPct);
      setMaxWatchedSeconds(nextWatched);
      maxPctRef.current = nextPct;
      maxWatchedRef.current = nextWatched;
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
    const flushOnLeave = () => {
      if (!currentUser?.id || teacherBypassRef.current) return;
      if (unsyncedDeltaRef.current <= 0 && latestPosRef.current <= 0) return;
      const delta = Math.round(unsyncedDeltaRef.current);
      unsyncedDeltaRef.current = 0;
      let token = '';
      try { token = localStorage.getItem('lms2_token') || ''; } catch {}
      if (!token) return;
      // Dùng fetch keepalive để đảm bảo trình duyệt vẫn gửi xong tiến độ ngay cả khi học sinh đóng tab đột ngột
      fetch(`${API_BASE_URL}/courses/${encodeURIComponent(courseId)}/activities/${encodeURIComponent(activity.id)}/video-progress`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          watchedSeconds: Math.floor(latestPosRef.current),
          totalSeconds: Math.floor(latestDurRef.current),
          progressPercent: maxPctRef.current,
          deltaSeconds: delta,
          checkpointResults: cpResultsRef.current
        })
      }).catch(() => {});
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushOnLeave();
    };
    window.addEventListener('pagehide', flushOnLeave);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pagehide', flushOnLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (unsyncedDeltaRef.current > 0 || latestPosRef.current > 0) {
        syncProgressRef.current(latestPosRef.current, latestDurRef.current, maxPctRef.current, true);
      }
    };
  }, [activity.id, courseId, currentUser?.id]);

  // YouTube IFrame Player API thật (đo % + tạm dừng & chặn tua chính xác từng mili giây tại neo chặn)
  useEffect(() => {
    if (!ytVideoId || !ytContainerRef.current) return;
    let destroyed = false;
    let pollTimer: number | null = null;
    let rafId: number | null = null;
    let lastPerfMs = 0;
    let lastUiUpdateMs = 0;

    const stopYtLoops = () => {
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastPerfMs = 0;
    };

    const sampleYouTube = () => {
      if (destroyed) return;
      const p = ytPlayerRef.current;
      if (!p || typeof p.getCurrentTime !== 'function') return;

      // Ép giữ tốc độ 1x khi đang bật khóa tua (tránh tăng tốc độ phát để lách thời gian xem)
      if (enforceAntiSkipRef.current) {
        try {
          const rate = Number(p.getPlaybackRate?.() || 1);
          if (rate !== 1) {
            p.setPlaybackRate?.(1);
            setPlaybackRate(1);
          }
        } catch {}
      }

      const rawCur = Number(p.getCurrentTime() || 0);
      const exactCur = Math.max(0, Math.round(rawCur * 1000) / 1000);
      const rawDur = Number(p.getDuration?.() || latestDurRef.current || 0);
      const exactDur = Math.max(0, Math.round(rawDur * 1000) / 1000);

      // Kiểm tra neo chặn & chống tua ngay lập tức trước khi cập nhật maxWatched!
      if (checkCpRef.current(exactCur)) {
        stopYtLoops();
        return;
      }

      const nowPerf = performance.now();

      // Khi GV bật chế độ xem thử không bị chặn, chỉ cập nhật đồng hồ phát tại chỗ, KHÔNG ghi nhận tiến độ
      if (teacherBypassRef.current) {
        latestPosRef.current = exactCur;
        if (exactDur > 0) latestDurRef.current = exactDur;
        if (nowPerf - lastUiUpdateMs >= 66) {
          lastUiUpdateMs = nowPerf;
          setCurrentTime(exactCur);
          if (exactDur > 0) setDuration(exactDur);
        }
        return;
      }

      if (lastPerfMs > 0) {
        const dt = (nowPerf - lastPerfMs) / 1000;
        if (dt > 0 && dt < 2) unsyncedDeltaRef.current += dt;
      }
      lastPerfMs = nowPerf;

      if (exactDur > 0) {
        const currentPct = Math.min(100, Math.round((exactCur / exactDur) * 100));
        const nextHighPct = Math.max(maxPctRef.current, currentPct);
        const nextHighSecs = Math.max(maxWatchedRef.current, exactCur);
        maxWatchedRef.current = nextHighSecs;
        latestPosRef.current = exactCur;
        latestDurRef.current = exactDur;

        // Cập nhật UI ~15fps (66ms) để mượt đồng hồ mili giây mà không gây giật
        if (nowPerf - lastUiUpdateMs >= 66) {
          lastUiUpdateMs = nowPerf;
          setCurrentTime(exactCur);
          setDuration(exactDur);
          setMaxWatchedSeconds(nextHighSecs);
          setProgressPercent(nextHighPct);
        }

        const passedAll = checkpointsListRef.current.every(cp => isCpClearedRef.current(cp, cpResultsRef.current));
        const crossed80 = nextHighPct >= 80 && passedAll && !isCompletedRef.current;
        if (crossed80) {
          setIsCompleted(true);
          syncProgressRef.current(exactCur, exactDur, nextHighPct, true);
        } else {
          syncProgressRef.current(exactCur, exactDur, nextHighPct, false);
        }
      }
    };

    const startYtLoops = () => {
      stopYtLoops();
      lastPerfMs = performance.now();
      const rafStep = () => {
        if (destroyed) return;
        sampleYouTube();
        if (pollTimer !== null) {
          rafId = window.requestAnimationFrame(rafStep);
        }
      };
      // Backup interval 50ms đảm bảo luôn kiểm tra sát mốc ms ngay cả khi trình duyệt giảm tốc rAF
      pollTimer = window.setInterval(sampleYouTube, 50);
      rafId = window.requestAnimationFrame(rafStep);
    };

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
          playsinline: 1,
          controls: hasAntiSkipFeature ? 0 : 1,
          disablekb: hasAntiSkipFeature ? 1 : 0,
          fs: hasAntiSkipFeature ? 0 : 1,
          iv_load_policy: 3,
          cc_load_policy: 1,
          cc_lang_pref: 'vi',
          origin: window.location.origin
        },
        events: {
          onReady: (ev: any) => {
            if (destroyed) return;
            setYtApiActive(true);
            const dur = Math.max(0, Math.round((Number(ev.target.getDuration?.() || 0)) * 1000) / 1000);
            if (dur > 0) setDuration(dur);
            try {
              setIsMuted(Boolean(ev.target.isMuted?.()));
              if (enforceAntiSkipRef.current && ev.target.getPlaybackRate?.() !== 1) {
                ev.target.setPlaybackRate?.(1);
              }
            } catch {}
          },
          onStateChange: (ev: any) => {
            if (destroyed) return;
            const state = ev.data;
            const cur = Math.max(0, Math.round((Number(ev.target.getCurrentTime?.() || 0)) * 1000) / 1000);
            const dur = Math.max(0, Math.round((Number(ev.target.getDuration?.() || latestDurRef.current || 0)) * 1000) / 1000);
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
              if (checkCpRef.current(cur)) return;
              setHasStarted(true);
              setIsPlaying(true);
              setShowResumeBanner(false);
              startYtLoops();
            } else {
              setIsPlaying(false);
              stopYtLoops();
              if (teacherBypassRef.current) {
                setCurrentTime(cur);
                return;
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
      stopYtLoops();
      try { ytPlayerRef.current?.destroy?.(); } catch {}
      ytPlayerRef.current = null;
    };
  }, [ytVideoId, hasAntiSkipFeature]);

  // Theo dõi HTML5 <video> bằng requestAnimationFrame (~16ms/khung hình) để dừng chính xác từng mili giây tại neo chặn
  useEffect(() => {
    if (ytVideoId || !isPlaying) return;
    let rafId = 0;
    let lastUiMs = 0;
    const tick = () => {
      const el = videoRef.current;
      if (!el || el.paused || el.ended) return;
      const exactCur = Math.max(0, Math.round(el.currentTime * 1000) / 1000);
      if (checkCpRef.current(exactCur)) return;
      // Video phát bình thường: nâng mốc đã xem ngay để bộ chống tua không hiểu nhầm là tua nhanh
      if (!teacherBypassRef.current && exactCur > maxWatchedRef.current) {
        maxWatchedRef.current = exactCur;
      }

      const nowPerf = performance.now();
      if (nowPerf - lastUiMs >= 50) {
        lastUiMs = nowPerf;
        setCurrentTime(exactCur);
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [ytVideoId, isPlaying]);

  // Xử lý sự kiện video HTML5 (MP4 / WebM)
  const lastHtml5TickRef = useRef<number>(0);
  const handleHtml5TimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    if (enforceAntiSkipRef.current && el.playbackRate !== 1) {
      el.playbackRate = 1;
      setPlaybackRate(1);
    }
    const cur = Math.max(0, Math.round(el.currentTime * 1000) / 1000);
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? Math.round(el.duration * 1000) / 1000 : duration;
    if (!dur) return;

    if (checkCheckpointsAndAntiSkip(cur)) return;

    if (teacherBypassRef.current) {
      setCurrentTime(cur);
      setDuration(dur);
      latestPosRef.current = cur;
      latestDurRef.current = dur;
      return;
    }

    const nowMs = Date.now();
    if (!el.paused && lastHtml5TickRef.current > 0) {
      const diff = (nowMs - lastHtml5TickRef.current) / 1000;
      if (diff > 0 && diff < 3) unsyncedDeltaRef.current += diff;
    }
    lastHtml5TickRef.current = nowMs;

    const currentPct = Math.min(100, Math.round((cur / dur) * 100));
    const nextHighPct = Math.max(maxPctRef.current, currentPct);
    const nextHighSecs = Math.max(maxWatchedRef.current, cur);
    maxWatchedRef.current = nextHighSecs;
    maxPctRef.current = nextHighPct;

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
    activeCpRef.current = null;
    setActiveCheckpoint(null);
    setPickedOption(null);
    setCpFeedback(null);
    if (cp) {
      const cpTime = Math.max(0, Math.round((Number(cp.timeSeconds) || 0) * 1000) / 1000);
      const nextSec = Math.max(latestPosRef.current, cpTime);
      if (nextSec > maxWatchedRef.current) {
        setMaxWatchedSeconds(nextSec);
        maxWatchedRef.current = nextSec;
      }
      // Chỉ seek nếu lệch xa mốc neo (> 250ms), còn không thì phát tiếp liền mạch từ đúng mili giây đã dừng
      if (Math.abs(latestPosRef.current - cpTime) > 0.25) {
        seekPlayer(cpTime);
      }
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
      return;
    }
    const finalDur = duration > 0 ? duration : (activity.durationMinutes || 5) * 60;
    setCurrentTime(finalDur);
    setDuration(finalDur);
    setMaxWatchedSeconds(finalDur);
    setProgressPercent(100);
    setIsCompleted(true);
    maxWatchedRef.current = finalDur;
    maxPctRef.current = 100;
    isCompletedRef.current = true;
    syncProgressToServer(finalDur, finalDur, 100, true, undefined, canManage);
  };

  const handleTogglePlay = () => {
    if (activeCpRef.current) {
      pausePlayer();
      return;
    }
    if (isPlaying) {
      pausePlayer();
    } else {
      if (!checkCheckpointsAndAntiSkip(latestPosRef.current)) {
        playPlayer();
      }
    }
  };

  const handleRewind10 = () => {
    const target = Math.max(0, Math.round(Math.max(0, latestPosRef.current - 10) * 1000) / 1000);
    seekPlayer(target);
    latestPosRef.current = target;
    setCurrentTime(target);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      if (videoRef.current) videoRef.current.muted = nextMuted;
      if (ytPlayerRef.current) {
        if (nextMuted) ytPlayerRef.current.mute?.();
        else ytPlayerRef.current.unMute?.();
      }
    } catch {}
  };

  const handleSpeedChange = (rate: number) => {
    if (enforceAntiSkipRef.current) {
      flashSkipWarning('Đang bật khóa tua nhanh — tốc độ phát được cố định ở 1x!');
      return;
    }
    setPlaybackRate(rate);
    try {
      if (videoRef.current) videoRef.current.playbackRate = rate;
      ytPlayerRef.current?.setPlaybackRate?.(rate);
    } catch {}
  };

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (playerWrapperRef.current?.requestFullscreen) {
        await playerWrapperRef.current.requestFullscreen();
      }
    } catch {}
  };

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeCpRef.current) {
      flashSkipWarning('Vui lòng trả lời câu hỏi neo chặn trước khi tiếp tục xem!');
      return;
    }
    const dur = duration || latestDurRef.current;
    if (!dur || dur <= 0 || !seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSec = Math.round(ratio * dur * 1000) / 1000;

    if (enforceAntiSkipRef.current) {
      const firstBlockingCp = checkpoints.find(cp => !isCheckpointCleared(cp, cpResultsRef.current));
      const cpLimit = firstBlockingCp ? Math.max(0, (Number(firstBlockingCp.timeSeconds) || 0) - 0.5) : dur;
      const allowedMax = Math.min(maxWatchedRef.current, cpLimit);
      if (targetSec > allowedMax + 0.25) {
        flashSkipWarning('Video đang khóa tua vượt mốc đã xem — bạn chỉ có thể tua lại đoạn đã xem!');
        return;
      }
    }

    seekPlayer(targetSec);
    latestPosRef.current = targetSec;
    setCurrentTime(targetSec);
  };

  const handleResetProgress = async () => {
    if (isResetting) return;
    setIsResetting(true);
    pausePlayer();
    try {
      await resetActivityProgress(courseId, activity.id);
      seekPlayer(0);
      setCurrentTime(0);
      setMaxWatchedSeconds(0);
      setProgressPercent(0);
      setCheckpointResults({});
      setActiveCheckpoint(null);
      setPickedOption(null);
      setCpFeedback(null);
      setIsCompleted(false);
      setHasStarted(false);
      setShowResumeBanner(false);
      setIsPlaying(false);
      maxWatchedRef.current = 0;
      maxPctRef.current = 0;
      latestPosRef.current = 0;
      cpResultsRef.current = {};
      activeCpRef.current = null;
      isCompletedRef.current = false;
      unsyncedDeltaRef.current = 0;
      setLastSyncText(`Đã reset trắng về 0% lúc ${new Date().toLocaleTimeString('vi-VN')}`);
    } catch {
      flashSkipWarning('Không thể reset tiến độ lúc này — vui lòng thử lại!');
    } finally {
      setIsResetting(false);
    }
  };

  const handlePlayerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enforceAntiSkipRef.current) return;
    const blockedKeys = ['ArrowRight', 'ArrowLeft', 'l', 'L', 'j', 'J', 'k', 'K', '>', '<', 'MediaTrackNext', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      if (['ArrowRight', 'l', 'L', '>'].includes(e.key)) {
        flashSkipWarning('Video đang khóa phím tua nhanh!');
      }
    }
  };

  const activeCpIndex = activeCheckpoint ? checkpoints.findIndex(c => c.id === activeCheckpoint.id) : -1;
  const playheadPct = duration > 0 ? Math.min(100, Math.max(0, Math.round((currentTime / duration) * 1000) / 10)) : 0;

  return (
    <div className="space-y-5">
      {/* Khung phát Video chính */}
      <div
        ref={playerWrapperRef}
        tabIndex={hasAntiSkipFeature ? 0 : undefined}
        onKeyDown={handlePlayerKeyDown}
        className={`bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col focus:outline-none ${isFullscreen ? 'w-screen h-screen rounded-none' : ''}`}
      >
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

        <div className={`relative w-full bg-slate-900 flex items-center justify-center ${isFullscreen ? 'flex-1 min-h-0' : 'aspect-video'}`}>
          {ytVideoId ? (
            <>
              <div ref={ytContainerRef} className="w-full h-full" />
              {/* Lớp chắn chặn tua / chặn thẻ gợi ý / chặn nhấn đúp trên YouTube IFrame khi bật khóa tua hoặc có neo chặn */}
              {hasAntiSkipFeature && !activeCheckpoint && (
                <>
                  {/* Chặn thanh tiêu đề & nút chia sẻ phía trên từ lúc mới tải */}
                  <div
                    className="absolute inset-x-0 top-0 h-14 z-20"
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  {!hasStarted ? (
                    /* Trước khi bấm Play lần đầu: giữ nguyên nút Play giữa màn hình cho iOS Safari, nhưng che phần dưới (link / logo YouTube) */
                    <div
                      className="absolute inset-x-0 bottom-0 h-14 z-20"
                      onClick={(e) => e.stopPropagation()}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ) : (
                    /* Sau khi đã bắt đầu phát: che toàn khung phát để chỉ Play/Pause qua LMS, chặn tua ±10s, chặn card video gợi ý khi Pause */
                    <div
                      role="button"
                      tabIndex={-1}
                      aria-label={isPlaying ? 'Tạm dừng video' : 'Tiếp tục phát video'}
                      onClick={handleTogglePlay}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (enforceAntiSkip) flashSkipWarning('Đã khóa thao tác nhấn đúp tua nhanh!');
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`absolute inset-0 z-20 cursor-pointer flex items-center justify-center transition-colors ${
                        !isPlaying ? 'bg-slate-950/55 backdrop-blur-[1px]' : 'bg-transparent'
                      }`}
                    >
                      {!isPlaying && (
                        <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-sky-500/95 hover:bg-sky-400 text-slate-950 font-extrabold text-sm shadow-2xl border border-white/30">
                          <Play className="w-5 h-5 fill-current" />
                          <span>Tiếp tục phát</span>
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : activity.videoUrl ? (
            <>
              <video
                ref={videoRef}
                controls={!hasAntiSkipFeature}
                controlsList={hasAntiSkipFeature ? 'nodownload noplaybackrate' : undefined}
                disablePictureInPicture={hasAntiSkipFeature}
                tabIndex={hasAntiSkipFeature ? -1 : 0}
                src={resolveBackendUrl(activity.videoUrl)}
                className="w-full h-full object-contain"
                onLoadedMetadata={() => {
                  if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
                    setDuration(videoRef.current.duration);
                  }
                }}
                onRateChange={() => {
                  if (enforceAntiSkipRef.current && videoRef.current && videoRef.current.playbackRate !== 1) {
                    videoRef.current.playbackRate = 1;
                    setPlaybackRate(1);
                  }
                }}
                onPlay={() => {
                  if (activeCpRef.current) {
                    videoRef.current?.pause();
                    return;
                  }
                  setHasStarted(true);
                  setIsPlaying(true);
                  setShowResumeBanner(false);
                  lastHtml5TickRef.current = Date.now();
                }}
                onPause={() => {
                  setIsPlaying(false);
                  lastHtml5TickRef.current = 0;
                  if (!teacherBypassRef.current) {
                    syncProgressToServer(currentTime, duration, progressPercent, true);
                  }
                }}
                onTimeUpdate={handleHtml5TimeUpdate}
                onSeeking={() => {
                  if (videoRef.current) checkCheckpointsAndAntiSkip(videoRef.current.currentTime);
                }}
                onSeeked={() => {
                  if (videoRef.current) checkCheckpointsAndAntiSkip(videoRef.current.currentTime);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  if (teacherBypassRef.current) return;
                  const dur = videoRef.current?.duration || duration || 1;
                  if (checkCheckpointsAndAntiSkip(dur)) return;
                  setCurrentTime(dur);
                  setMaxWatchedSeconds(dur);
                  setProgressPercent(100);
                  if (checkpoints.every(cp => isCheckpointCleared(cp, cpResultsRef.current))) {
                    setIsCompleted(true);
                  }
                  syncProgressToServer(dur, dur, 100, true);
                }}
              />
              {hasAntiSkipFeature && !activeCheckpoint && (
                <div
                  role="button"
                  tabIndex={-1}
                  aria-label={isPlaying ? 'Tạm dừng video' : 'Phát video'}
                  onClick={handleTogglePlay}
                  onContextMenu={(e) => e.preventDefault()}
                  className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center"
                >
                  {!isPlaying && (
                    <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-sky-500/95 hover:bg-sky-400 text-slate-950 font-extrabold text-sm shadow-2xl border border-white/30">
                      <Play className="w-5 h-5 fill-current" />
                      <span>{hasStarted ? 'Tiếp tục phát' : 'Phát video'}</span>
                    </span>
                  )}
                </div>
              )}
            </>
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
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Neo chặn {activeCpIndex + 1}/{checkpoints.length} • {formatTimeMs(activeCheckpoint.timeSeconds)}
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
                  <div className="space-y-2">
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

                    {cpFeedback.canContinue && activeCheckpoint.explanation && (
                      <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 leading-relaxed">
                        <span className="font-extrabold text-[#0374b5]">💡 Giải thích / Phản hồi sư phạm: </span>
                        <span>{activeCheckpoint.explanation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Thanh điều khiển LMS thay thế điều khiển gốc (ẩn thanh tua đỏ YouTube khi bật khóa tua / neo chặn) */}
        {hasAntiSkipFeature && (ytVideoId || activity.videoUrl) && (
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap text-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                disabled={Boolean(activeCheckpoint)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold transition-colors"
                title={isPlaying ? 'Tạm dừng' : 'Phát video'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Tạm dừng' : 'Phát'}</span>
              </button>

              <button
                type="button"
                onClick={handleRewind10}
                disabled={Boolean(activeCheckpoint)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
                title="Tua lùi 10 giây (chỉ cho phép xem lại)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>-10s</span>
              </button>

              <span className="text-xs font-mono text-slate-300 px-1.5">
                {formatTime(currentTime)}{duration > 0 ? ` / ${formatTime(duration)}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
                title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {enforceAntiSkip ? (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-amber-300 select-none"
                  title="Tốc độ phát bị khóa ở 1x khi đang bật chống tua"
                >
                  <Lock className="w-3 h-3" />
                  <span>1x Khóa tua</span>
                </span>
              ) : (
                <div className="inline-flex items-center gap-0.5 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                  {[1, 1.25, 1.5, 2].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleSpeedChange(r)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                        playbackRate === r ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
                title={isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình (giữ nguyên neo chặn)'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

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
              {canManage && hasAntiSkipFeature && (
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

              {canManage && (
                <button
                  type="button"
                  onClick={handleResetProgress}
                  disabled={isResetting || (progressPercent === 0 && maxWatchedSeconds === 0 && checkpointsPassedCount === 0 && !isCompleted)}
                  title="Xóa trắng tiến độ video hiện tại về 0%"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>Reset 0%</span>
                </button>
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

          {/* Thanh tiến độ tương tác: tua trong vùng đã mở khóa, hiển thị vạch 80% & chốt Neo chặn */}
          <div
            ref={seekBarRef}
            onClick={handleSeekBarClick}
            title={
              enforceAntiSkip
                ? 'Nhấp để tua lại trong đoạn đã xem (bị chặn tua vượt mốc)'
                : 'Nhấp để chọn vị trí phát video'
            }
            className="relative w-full bg-slate-800 rounded-full h-3.5 overflow-visible cursor-pointer select-none group"
          >
            {/* Vùng đã xem (high-water mark) */}
            <div
              className="h-full rounded-full transition-all duration-150 bg-sky-500/35"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Vị trí phát hiện tại */}
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-75 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-sky-500 to-blue-500'
              }`}
              style={{ width: `${playheadPct}%` }}
            />
            {duration > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow border-2 border-sky-400 pointer-events-none transition-transform group-hover:scale-125"
                style={{ left: `${playheadPct}%` }}
              />
            )}
            <div className="absolute top-0 bottom-0 w-0.5 bg-amber-300/70 pointer-events-none" style={{ left: '80%' }} title="Mốc hoàn thành 80%" />

            {duration > 0 && checkpoints.map((cp, idx) => {
              const leftPct = Math.min(98, Math.max(2, (cp.timeSeconds / duration) * 100));
              const cleared = isCheckpointCleared(cp, checkpointResults);
              return (
                <div
                  key={cp.id}
                  style={{ left: `${leftPct}%` }}
                  aria-hidden="true"
                  title={`Neo chặn #${idx + 1} (${formatTimeMs(cp.timeSeconds)}) — ${cleared ? 'Đã vượt qua' : 'Tự mở khi xem đến đúng mốc'}`}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm pointer-events-none select-none ${
                    cleared ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              );
            })}
          </div>

          {/* Danh sách mốc Neo chặn (chỉ hiển thị trạng thái — không cho nhấp mở trước câu hỏi) */}
          {checkpoints.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">
                Các mốc neo chặn (tự mở khi xem đến đúng mốc):
              </span>
              {checkpoints.map((cp, idx) => {
                const cleared = isCheckpointCleared(cp, checkpointResults);
                return (
                  <span
                    key={cp.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border select-none cursor-default ${
                      cleared
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {cleared ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>Neo {idx + 1} ({formatTimeMs(cp.timeSeconds)})</span>
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Vị trí đang phát: <strong className="text-slate-200 font-mono">{formatTimeMs(currentTime)}</strong>
              {enforceAntiSkip ? ' • Đã khóa thanh tua & tốc độ 1x' : teacherBypass ? ' • GV xem thử: tự do tua (không lưu tiến độ)' : ''}
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

      {/* Thông tin bài giảng */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{activity.title}</h2>
          <div className="flex items-center gap-2">
            {checkpoints.length > 0 && (
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                {checkpoints.length} câu hỏi neo chặn
              </span>
            )}
            <span className="px-3 py-1 bg-sky-50 text-[#0374b5] text-xs font-bold rounded-full">
              Video bài giảng
            </span>
          </div>
        </div>

        {activity.videoUrl && (
          <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100">
            <span>Nguồn video:</span>
            <a
              href={resolveBackendUrl(activity.videoUrl)}
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
