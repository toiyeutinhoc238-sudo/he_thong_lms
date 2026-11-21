import React from 'react';
import { VideoCheckpoint } from '../types';
import { Plus, Trash2, ShieldAlert, Clock } from 'lucide-react';

interface VideoCheckpointEditorProps {
  checkpoints: VideoCheckpoint[];
  onChange: (next: VideoCheckpoint[]) => void;
  preventSkip: boolean;
  onPreventSkipChange: (val: boolean) => void;
  idPrefix?: string;
}

export const VideoCheckpointEditor: React.FC<VideoCheckpointEditorProps> = ({
  checkpoints,
  onChange,
  preventSkip,
  onPreventSkipChange,
  idPrefix = 'cp'
}) => {
  const handleAdd = () => {
    const lastSec = checkpoints.length > 0
      ? Math.max(...checkpoints.map(c => c.timeSeconds))
      : 0;
    const nextSec = lastSec + 60; // tự tăng thêm 1 phút so với neo trước
    onChange([
      ...checkpoints,
      {
        id: `cp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timeSeconds: nextSec,
        question: '',
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correctAnswer: 0,
        requireCorrect: true
      }
    ]);
  };

  const updateAt = (idx: number, patch: Partial<VideoCheckpoint>) => {
    onChange(checkpoints.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const formatMmSs = (sec: number) => {
    const safe = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-extrabold text-indigo-950">
            Neo chặn câu hỏi tương tác trên Video ({checkpoints.length} neo)
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Thêm neo chặn</span>
        </button>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer select-none bg-white/80 px-2.5 py-1.5 rounded-lg border border-indigo-100">
        <input
          type="checkbox"
          checked={preventSkip}
          onChange={(e) => onPreventSkipChange(e.target.checked)}
          className="accent-indigo-600 w-3.5 h-3.5 rounded"
        />
        <span className="font-semibold">
          Chống tua nhanh vượt qua neo chặn chưa trả lời (video tự dừng & kéo về đúng mốc neo)
        </span>
      </label>

      {checkpoints.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic">
          Chưa có neo chặn nào. Bấm <strong>"+ Thêm neo chặn"</strong> để đặt câu hỏi dừng video ở bất kỳ phút/giây nào (ví dụ 00:45, 02:15...).
        </p>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {checkpoints.map((cp, idx) => {
            const mins = Math.floor((cp.timeSeconds || 0) / 60);
            const secs = Math.floor((cp.timeSeconds || 0) % 60);

            return (
              <div key={cp.id || idx} className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black">
                      Neo #{idx + 1} • {formatMmSs(cp.timeSeconds)}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={mins}
                        onChange={(e) => {
                          const newM = Math.max(0, parseInt(e.target.value || '0', 10) || 0);
                          updateAt(idx, { timeSeconds: newM * 60 + secs });
                        }}
                        className="w-12 px-1.5 py-0.5 border border-slate-300 rounded text-center font-mono font-bold text-slate-900"
                        title="Phút"
                      />
                      <span className="font-bold">p</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={secs}
                        onChange={(e) => {
                          const newS = Math.min(59, Math.max(0, parseInt(e.target.value || '0', 10) || 0));
                          updateAt(idx, { timeSeconds: mins * 60 + newS });
                        }}
                        className="w-12 px-1.5 py-0.5 border border-slate-300 rounded text-center font-mono font-bold text-slate-900"
                        title="Giây"
                      />
                      <span className="font-bold">s</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onChange(checkpoints.filter((_, i) => i !== idx))}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                    title="Xóa neo chặn này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Nhập câu hỏi hiện lên khi video dừng ở mốc này..."
                  value={cp.question}
                  onChange={(e) => updateAt(idx, { question: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    4 đáp án (chọn nút tròn cho đáp án đúng):
                  </span>
                  {cp.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name={`${idPrefix}_cp_correct_${cp.id || idx}`}
                        checked={cp.correctAnswer === oIdx}
                        onChange={() => updateAt(idx, { correctAnswer: oIdx })}
                        className="accent-emerald-600 cursor-pointer w-3.5 h-3.5 shrink-0"
                      />
                      <span className="text-[11px] font-bold text-slate-500 w-3">{['A', 'B', 'C', 'D'][oIdx]}</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const nextOpts = [...cp.options];
                          nextOpts[oIdx] = e.target.value;
                          updateAt(idx, { options: nextOpts });
                        }}
                        className={`flex-1 px-2 py-1 text-xs border rounded-lg focus:outline-none ${
                          cp.correctAnswer === oIdx
                            ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                        placeholder={`Phương án ${['A', 'B', 'C', 'D'][oIdx]}`}
                      />
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={cp.requireCorrect !== false}
                    onChange={(e) => updateAt(idx, { requireCorrect: e.target.checked })}
                    className="accent-indigo-600 w-3.5 h-3.5 rounded"
                  />
                  <span>Bắt buộc trả lời đúng mới cho tiếp tục xem video</span>
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
