import React, { useState } from 'react';
import { Sparkles, ShieldAlert, ShieldCheck, Cpu, Sliders, Plus, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TrainItem {
  id: string;
  text: string;
  label: 'safe' | 'spam';
}

const DEFAULT_TRAINING: TrainItem[] = [
  { id: 't1', text: 'Nhắc lịch học bài 1 Trí tuệ nhân tạo lớp 6 ngày mai', label: 'safe' },
  { id: 't2', text: 'Cô gửi tài liệu ôn tập môn Tin học tuần này nhé', label: 'safe' },
  { id: 't3', text: 'Chúc mừng bạn trúng thưởng 50 triệu bấm link nhận quà ngay', label: 'spam' },
  { id: 't4', text: 'Gửi mật khẩu và mã OTP gấp để mở khóa tài khoản ngân hàng', label: 'spam' },
  { id: 't5', text: 'Nhóm mình họp thảo luận bài tập AI lúc 19h tối nay', label: 'safe' },
  { id: 't6', text: 'Nhấn vào đường link lạ miễn phí nạp thẻ trúng iPhone 100%', label: 'spam' }
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);
}

// Bộ phân loại Naive Bayes đơn giản chạy trực tiếp trên trình duyệt cho học sinh Lớp 6 thí nghiệm
function predictNaiveBayes(input: string, dataset: TrainItem[]) {
  const safeDocs = dataset.filter(d => d.label === 'safe');
  const spamDocs = dataset.filter(d => d.label === 'spam');
  const words = tokenize(input);
  if (words.length === 0 || dataset.length === 0) return { label: 'safe' as const, spamProb: 50, matchedWords: [] as string[] };

  const countMap = (docs: TrainItem[]) => {
    const m = new Map<string, number>();
    let total = 0;
    docs.forEach(d => {
      tokenize(d.text).forEach(w => {
        m.set(w, (m.get(w) || 0) + 1);
        total++;
      });
    });
    return { m, total };
  };

  const safeStats = countMap(safeDocs);
  const spamStats = countMap(spamDocs);
  const vocab = new Set([...safeStats.m.keys(), ...spamStats.m.keys()]);
  const V = Math.max(1, vocab.size);

  let logSafe = Math.log((safeDocs.length + 1) / (dataset.length + 2));
  let logSpam = Math.log((spamDocs.length + 1) / (dataset.length + 2));
  const matchedWords: string[] = [];

  words.forEach(w => {
    const sc = safeStats.m.get(w) || 0;
    const sp = spamStats.m.get(w) || 0;
    if (sc > 0 || sp > 0) matchedWords.push(w);
    logSafe += Math.log((sc + 1) / (safeStats.total + V));
    logSpam += Math.log((sp + 1) / (spamStats.total + V));
  });

  const maxLog = Math.max(logSafe, logSpam);
  const pSafe = Math.exp(logSafe - maxLog);
  const pSpam = Math.exp(logSpam - maxLog);
  const spamProb = Math.round((pSpam / (pSafe + pSpam)) * 100);

  return {
    label: spamProb >= 50 ? ('spam' as const) : ('safe' as const),
    spamProb,
    matchedWords: [...new Set(matchedWords)]
  };
}

export const AIVirtualLab: React.FC = () => {
  const [labTab, setLabTab] = useState<'classifier' | 'neuron' | 'privacy'>('classifier');

  // Lab 1: Huấn luyện AI phân loại tin nhắn an toàn / lừa đảo
  const [dataset, setDataset] = useState<TrainItem[]>(DEFAULT_TRAINING);
  const [newSampleText, setNewSampleText] = useState('');
  const [newSampleLabel, setNewSampleLabel] = useState<'safe' | 'spam'>('safe');
  const [testInput, setTestInput] = useState('Chúc mừng bạn trúng thưởng quà miễn phí bấm link gửi mã OTP');

  const prediction = predictNaiveBayes(testInput, dataset);

  // Lab 2: Mô phỏng Mạng nơ-ron nhân tạo tương tác trực quan
  const [x1, setX1] = useState(0.8); // Chất lượng dữ liệu
  const [x2, setX2] = useState(0.6); // Số lượng mẫu học
  const [w1, setW1] = useState(0.7);
  const [w2, setW2] = useState(0.5);
  const [bias, setBias] = useState(-0.4);
  const z = x1 * w1 + x2 * w2 + bias;
  const sigmoid = Math.round((1 / (1 + Math.exp(-z * 3))) * 100);

  // Lab 3: Máy quét bảo vệ dữ liệu cá nhân trước khi nhập vào AI (Bài 6 & Bài 7)
  const [promptInput, setPromptInput] = useState(
    'Chào AI, tôi tên là Minh An, SĐT 0912345678, email minhan@gmail.com, số CCCD 079214001234. Hãy giúp tôi tóm tắt bài học về trí tuệ nhân tạo!'
  );

  const detectedRisks: { type: string; value: string; advice: string }[] = [];
  const phoneMatches = promptInput.match(/(?:0|\+84)\d{9,10}/g) || [];
  phoneMatches.forEach(v => detectedRisks.push({ type: 'Số điện thoại', value: v, advice: 'Xóa số điện thoại trước khi gửi cho AI công cộng.' }));
  const emailMatches = promptInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];
  emailMatches.forEach(v => detectedRisks.push({ type: 'Địa chỉ Email', value: v, advice: 'Không nên cung cấp email thật trong câu lệnh AI.' }));
  const idMatches = promptInput.match(/\b\d{12}\b/g) || [];
  idMatches.forEach(v => detectedRisks.push({ type: 'Số CCCD (12 chữ số)', value: v, advice: 'Tuyệt đối KHÔNG chia sẻ số CCCD / giấy tờ định danh!' }));
  if (/mật\s*khẩu|password|otp/i.test(promptInput)) {
    detectedRisks.push({ type: 'Từ khóa nhạy cảm (Mật khẩu / OTP)', value: 'Mật khẩu / OTP', advice: 'Không bao giờ nhập mật khẩu hoặc mã xác thực OTP vào công cụ AI.' });
  }

  return (
    <div className="p-5 sm:p-6 max-w-5xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Phòng thí nghiệm Ảo & Mô phỏng Tương tác AI
            </h2>
            <p className="text-xs text-slate-500">
              Học sinh tự tay huấn luyện mô hình AI, tinh chỉnh nơ-ron và thực hành bảo vệ dữ liệu cá nhân ngay trên trình duyệt
            </p>
          </div>
        </div>
      </div>

      {/* Chọn phòng thí nghiệm */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setLabTab('classifier')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
            labTab === 'classifier' ? 'bg-[#0374b5] text-white border-[#0374b5] shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:border-[#0374b5]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>1. Tự huấn luyện AI (Bài 1 & 3)</span>
        </button>
        <button
          type="button"
          onClick={() => setLabTab('neuron')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
            labTab === 'neuron' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-500'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. Mô phỏng Mạng nơ-ron (Bài 4)</span>
        </button>
        <button
          type="button"
          onClick={() => setLabTab('privacy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
            labTab === 'privacy' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. Lá chắn Dữ liệu cá nhân (Bài 6 & 7)</span>
        </button>
      </div>

      {/* LAB 1: CLASSIFIER */}
      {labTab === 'classifier' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Bước 1: Tập dữ liệu huấn luyện ({dataset.length} mẫu)</h3>
              <button
                type="button"
                onClick={() => setDataset(DEFAULT_TRAINING)}
                className="text-[11px] font-bold text-slate-500 hover:text-[#0374b5] inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Đặt lại mẫu gốc
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSampleText}
                onChange={(e) => setNewSampleText(e.target.value)}
                placeholder="Thêm câu mẫu để dạy AI..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0374b5] focus:bg-white"
              />
              <select
                value={newSampleLabel}
                onChange={(e) => setNewSampleLabel(e.target.value as 'safe' | 'spam')}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="safe">An toàn</option>
                <option value="spam">Lừa đảo / Rác</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!newSampleText.trim()) return;
                  setDataset(prev => [{ id: `t-${Date.now()}`, text: newSampleText.trim(), label: newSampleLabel }, ...prev]);
                  setNewSampleText('');
                }}
                className="px-3 py-2 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Dạy AI
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {dataset.map(item => (
                <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700 flex-1">{item.text}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${item.label === 'safe' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {item.label === 'safe' ? 'An toàn' : 'Lừa đảo'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sky-50/60 rounded-2xl border border-sky-200 p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-sky-950">Bước 2: Kiểm thử dự đoán của AI</h3>
            <textarea
              rows={3}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Gõ 1 tin nhắn bất kỳ để xem AI đoán là An toàn hay Lừa đảo..."
              className="w-full p-3 bg-white border border-sky-200 rounded-xl text-xs focus:outline-none focus:border-[#0374b5]"
            />
            <div className={`p-4 rounded-2xl border-2 space-y-2 ${prediction.label === 'spam' ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Kết quả AI dự đoán:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${prediction.label === 'spam' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {prediction.label === 'spam' ? '⚠️ Tin nhắn Lừa đảo / Rác' : '✅ Tin nhắn An toàn'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-emerald-700">An toàn: {100 - prediction.spamProb}%</span>
                  <span className="text-rose-700">Rủi ro lừa đảo: {prediction.spamProb}%</span>
                </div>
                <div className="w-full h-3 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${prediction.spamProb}%` }} />
                </div>
              </div>
              {prediction.matchedWords.length > 0 && (
                <p className="text-[11px] text-slate-600">
                  Từ khóa AI học được từ tập dữ liệu: <strong>{prediction.matchedWords.slice(0, 8).join(', ')}</strong>
                </p>
              )}
            </div>
            <p className="text-[11px] text-sky-900 bg-white/80 p-3 rounded-xl border border-sky-200/70">
              💡 <strong>Bài học rút ra:</strong> AI không tự "thông minh" — độ chính xác của AI phụ thuộc hoàn toàn vào <strong>dữ liệu huấn luyện</strong> mà con người cung cấp!
            </p>
          </div>
        </div>
      )}

      {/* LAB 2: NEURAL NETWORK SIMULATOR */}
      {labTab === 'neuron' && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3.5 text-xs">
              <h3 className="text-sm font-extrabold text-indigo-950">Tinh chỉnh Đầu vào (Input) & Trọng số (Weight)</h3>
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Đầu vào x₁ (Độ sạch dữ liệu)</span><span className="font-mono text-indigo-700">{x1.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.1} value={x1} onChange={e => setX1(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Trọng số w₁</span><span className="font-mono text-indigo-700">{w1.toFixed(1)}</span>
                </div>
                <input type="range" min={-1} max={1} step={0.1} value={w1} onChange={e => setW1(Number(e.target.value))} className="w-full accent-sky-600" />
              </div>
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Đầu vào x₂ (Số lượng bài mẫu)</span><span className="font-mono text-indigo-700">{x2.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.1} value={x2} onChange={e => setX2(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Trọng số w₂</span><span className="font-mono text-indigo-700">{w2.toFixed(1)}</span>
                </div>
                <input type="range" min={-1} max={1} step={0.1} value={w2} onChange={e => setW2(Number(e.target.value))} className="w-full accent-sky-600" />
              </div>
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Ngưỡng dịch chuyển (Bias b)</span><span className="font-mono text-amber-700">{bias.toFixed(1)}</span>
                </div>
                <input type="range" min={-1} max={1} step={0.1} value={bias} onChange={e => setBias(Number(e.target.value))} className="w-full accent-amber-500" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 text-white space-y-4">
              <div className="text-center text-[11px] font-bold uppercase tracking-wider text-sky-300">
                Sơ đồ lan truyền xuôi (Forward Propagation)
              </div>
              <svg viewBox="0 0 360 170" className="w-full h-40">
                <line x1="70" y1="45" x2="180" y2="85" stroke={w1 >= 0 ? '#38bdf8' : '#fb7185'} strokeWidth={Math.max(1.5, Math.abs(w1) * 5)} />
                <line x1="70" y1="125" x2="180" y2="85" stroke={w2 >= 0 ? '#38bdf8' : '#fb7185'} strokeWidth={Math.max(1.5, Math.abs(w2) * 5)} />
                <line x1="180" y1="85" x2="295" y2="85" stroke="#34d399" strokeWidth={Math.max(2, (sigmoid / 100) * 6)} />
                <circle cx="70" cy="45" r="24" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="2" />
                <text x="70" y="49" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">x₁={x1.toFixed(1)}</text>
                <circle cx="70" cy="125" r="24" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="2" />
                <text x="70" y="129" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">x₂={x2.toFixed(1)}</text>
                <circle cx="180" cy="85" r="30" fill="#4f46e5" stroke="#a5b4fc" strokeWidth="2.5" />
                <text x="180" y="82" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">Nơ-ron</text>
                <text x="180" y="96" textAnchor="middle" fill="#fde047" fontSize="10" fontWeight="bold">z={z.toFixed(2)}</text>
                <circle cx="295" cy="85" r="28" fill={sigmoid >= 50 ? '#059669' : '#e11d48'} stroke="#fff" strokeWidth="2" />
                <text x="295" y="89" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{sigmoid}%</text>
              </svg>
              <div className="text-center text-xs text-slate-300">
                Công thức: <code className="text-amber-300">z = x₁·w₁ + x₂·w₂ + b = {z.toFixed(2)}</code> → Xác suất kích hoạt: <strong className="text-emerald-400">{sigmoid}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAB 3: PRIVACY SCANNER */}
      {labTab === 'privacy' && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div>
            <h3 className="text-sm font-extrabold text-emerald-950">Thực hành kiểm tra câu lệnh (Prompt) trước khi gửi cho AI</h3>
            <p className="text-xs text-slate-500 mt-0.5">Hãy thử gõ hoặc xóa bớt thông tin cá nhân trong câu lệnh dưới đây để xem Lá chắn AI phát hiện rủi ro gì:</p>
          </div>
          <textarea
            rows={4}
            value={promptInput}
            onChange={e => setPromptInput(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
          {detectedRisks.length === 0 ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>An toàn! Không phát hiện thông tin cá nhân nhạy cảm (SĐT, Email, CCCD, Mật khẩu) trong câu lệnh của bạn.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-black text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cảnh báo! Phát hiện {detectedRisks.length} thông tin cá nhân nhạy cảm không nên gửi lên AI công cộng:</span>
              </div>
              {detectedRisks.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{r.type}: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 text-rose-700">{r.value}</code></p>
                    <p className="text-slate-600 mt-0.5">{r.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
