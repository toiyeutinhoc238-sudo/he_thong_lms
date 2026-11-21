import React, { useState } from 'react';
import { Activity, Course, CourseModule } from '../types';
import {
  buildShareLink,
  buildEmbedIframeCode,
  exportScorm12Zip,
  exportImsccPackage,
  exportQuizAiken,
  exportQuizGift,
  exportJsonPackage
} from '../utils/lmsExporter';
import {
  X,
  Link2,
  Code2,
  Package,
  Check,
  Copy,
  ExternalLink,
  Download,
  FileText,
  FileJson,
  GraduationCap,
  Share2
} from 'lucide-react';

interface ShareExportModalProps {
  course: Course;
  module?: CourseModule | null;
  activity?: Activity | null;
  onClose: () => void;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  course,
  module,
  activity,
  onClose
}) => {
  const [tab, setTab] = useState<'link' | 'export'>('link');
  const [iframeHeight, setIframeHeight] = useState<number>(680);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const scopeLabel = activity
    ? `Hoạt động: ${activity.title}`
    : module
      ? `Bài học: ${module.title}`
      : `Toàn bộ khóa học: ${course.name}`;

  const directUrl = buildShareLink({
    courseId: course.id,
    moduleId: module?.id || activity?.moduleId || null,
    activityId: activity?.id || null,
    embed: false
  });

  const embedUrl = buildShareLink({
    courseId: course.id,
    moduleId: module?.id || activity?.moduleId || null,
    activityId: activity?.id || null,
    embed: true
  });

  const iframeCode = buildEmbedIframeCode(embedUrl, activity?.title || module?.title || course.name, iframeHeight);

  const scopedActivities: Activity[] = activity
    ? [activity]
    : module
      ? (module.activities || [])
      : (course.modules || []).flatMap(m => m.activities || []);

  const quizActivities = scopedActivities.filter(a => a.type === 'quiz' && (a.quizQuestions?.length || 0) > 0);
  const exportBaseName = activity?.title || module?.title || course.code || course.name;

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#0374b5] flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900">
                Chia sẻ Link & Xuất học liệu sang LMS khác
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">{scopeLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Switch 2 Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setTab('link')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'link' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Cách 1: Lấy Link & Mã nhúng iframe</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('export')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'export' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Cách 2: Xuất gói File (SCORM / IMSCC / Quiz)</span>
          </button>
        </div>

        {/* TAB 1: LINK TRỰC TIẾP & MÃ NHÚNG IFRAME */}
        {tab === 'link' && (
          <div className="space-y-4">
            {/* Direct Link */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-sky-950 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-[#0374b5]" />
                  <span>Đường dẫn trực tiếp (Dán vào Canvas, Moodle, Google Classroom, Zalo...)</span>
                </label>
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[#0374b5] hover:underline inline-flex items-center gap-1"
                >
                  <span>Mở thử</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={directUrl}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyText(directUrl, 'direct')}
                  className="px-3.5 py-2 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                >
                  {copiedKey === 'direct' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'direct' ? 'Đã chép!' : 'Sao chép'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                Học sinh bấm link này sẽ mở thẳng đúng {activity ? 'hoạt động' : module ? 'bài học' : 'khóa học'} này, giữ nguyên Video neo chặn & Quiz đếm giờ, tiến độ vẫn lưu về Sổ điểm của bạn.
              </p>
            </div>

            {/* Embed Iframe Code */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  <span>Mã nhúng HTML &lt;iframe&gt; (Nhúng gọn không thanh menu vào LMS khác)</span>
                </label>
                <select
                  value={iframeHeight}
                  onChange={(e) => setIframeHeight(Number(e.target.value))}
                  className="text-[11px] font-bold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700"
                >
                  <option value={560}>Cao 560px</option>
                  <option value={680}>Cao 680px (Khuyên dùng)</option>
                  <option value={820}>Cao 820px</option>
                </select>
              </div>

              <textarea
                readOnly
                rows={3}
                value={iframeCode}
                className="w-full p-3 bg-slate-900 text-sky-300 font-mono text-[11px] rounded-xl border border-slate-800 select-all"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Xem trước chế độ nhúng gọn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => copyText(iframeCode, 'iframe')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  {copiedKey === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'iframe' ? 'Đã chép mã!' : 'Sao chép mã nhúng'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: XUẤT GÓI FILE CHUẨN QUỐC TẾ SANG LMS KHÁC */}
        {tab === 'export' && (
          <div className="space-y-3">
            {/* 1. SCORM 1.2 (.zip) */}
            <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">KHUYÊN DÙNG</span>
                  <h4 className="text-sm font-extrabold text-slate-900">Gói chuẩn SCORM 1.2 (.zip)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Import trực tiếp vào <strong>Moodle, Canvas, Blackboard, K12Online, Schoology...</strong> Đóng gói đầy đủ <strong>Video YouTube có neo chặn</strong>, <strong>Quiz đếm giờ</strong> và tự động gửi điểm + % hoàn thành về Sổ điểm của LMS đích.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportScorm12Zip(course, module, activity)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Tải SCORM (.zip)</span>
              </button>
            </div>

            {/* 2. IMS Common Cartridge (.imscc) */}
            {!activity && (
              <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#0374b5]" />
                    <span>Gói khóa học IMS Common Cartridge (.imscc)</span>
                  </h4>
                  <p className="text-xs text-slate-600">
                    Chuẩn nhập nguyên cấu trúc bài học/mô-đun dùng riêng cho <strong>Canvas LMS</strong>, <strong>Moodle</strong> và <strong>Brightspace</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportImsccPackage(course, module)}
                  className="px-4 py-2 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải (.imscc)</span>
                </button>
              </div>
            )}

            {/* 3. Quiz Bank Formats (Aiken & GIFT) */}
            {quizActivities.length > 0 && (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2.5">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Xuất ngân hàng câu hỏi Trắc nghiệm ({quizActivities.length} đề)</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Nhập trực tiếp toàn bộ câu hỏi A/B/C/D + đáp án đúng vào <strong>Moodle, Azota, Canvas</strong>.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => exportQuizAiken(scopedActivities, exportBaseName)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Chuẩn Aiken (.txt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportQuizGift(scopedActivities, exportBaseName)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Chuẩn Moodle GIFT (.txt)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Full JSON Package */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-slate-600" />
                  <span>Gói sao lưu dữ liệu đầy đủ (.json)</span>
                </h4>
                <p className="text-xs text-slate-600">
                  Giữ 100% cấu trúc mô-đun, neo chặn video, code mẫu, câu hỏi — dùng để sao lưu hoặc bấm <strong>"Nhập gói (.json)"</strong> vào khóa học khác.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportJsonPackage(course, module, activity)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Tải (.json)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
