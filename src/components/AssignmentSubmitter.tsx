import React, { useState, useEffect, useCallback } from 'react';
import { Activity } from '../types';
import { useApp } from '../context/AppContext';
import api, { StudentSubmission, resolveBackendUrl } from '../services/api';
import { FormattedContent } from './FormattedContent';
import { 
  UploadCloud, 
  FileCheck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  MessageSquare,
  Award,
  Trash2,
  Code2,
  Edit3,
  Check
} from 'lucide-react';

interface AssignmentSubmitterProps {
  activity: Activity;
  courseId: string;
}

export const AssignmentSubmitter: React.FC<AssignmentSubmitterProps> = ({ activity, courseId }) => {
  const { submitAssignment, activeRole, currentUser } = useApp();

  const isTeacherOrAdmin = activeRole === 'lecturer' || activeRole === 'admin' || currentUser?.role === 'admin' || currentUser?.email === 'phanphiphu04@gmail.com';

  const [submissionTab, setSubmissionTab] = useState<'file' | 'online_text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [onlineText, setOnlineText] = useState(activity.submission?.textSubmission || activity.starterCode || '');
  const [commentText, setCommentText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const submission = activity.submission;
  const isSubmitted = submission && submission.status !== 'not_submitted';
  const isGraded = submission && submission.status === 'graded';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !onlineText.trim() && !submission?.fileName) return;

    setIsUploading(true);
    try {
      let fileName = selectedFile 
        ? selectedFile.name 
        : (submission?.fileName || (submissionTab === 'online_text' ? 'bai_lam_truc_tuyen.txt' : 'BaiTap_Nop.pdf'));
      
      let fileSize = selectedFile
        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
        : (submission?.fileSize || '');

      let fileUrl = submission?.fileUrl || '';

      if (selectedFile) {
        const uploaded = await api.files.upload(selectedFile);
        fileName = uploaded.name;
        fileSize = uploaded.size;
        fileUrl = uploaded.url;
      }

      submitAssignment(
        courseId, 
        activity.id, 
        fileName, 
        onlineText.trim() ? onlineText.trim() : commentText, 
        fileSize,
        fileUrl
      );
      setSelectedFile(null);
    } catch (err: any) {
      alert('Lỗi nộp bài: ' + (err?.message || 'Không thể tải tệp lên máy chủ.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                Bài tập thực hành & Đánh giá
              </span>
              {activity.programmingLanguage && (
                <span className="text-[11px] font-bold uppercase text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                  {activity.programmingLanguage}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-1.5">
              {activity.title}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Hạn nộp: <strong>{activity.dueDate || 'Chưa đặt hạn nộp'}</strong></span>
            </div>
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Yêu cầu bài tập (Đề bài)
          </h4>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
            <FormattedContent
              text={activity.assignmentPrompt}
              fallback="Vui lòng thực hiện bài làm theo đúng yêu cầu của giáo viên và nộp tệp hoặc nhập bài làm trực tiếp."
            />
            <div className="text-xs text-slate-500 pt-3 border-t border-slate-200/70 flex items-center gap-2 flex-wrap">
              <span>Định dạng hỗ trợ: <strong className="text-slate-700">.html, .txt, .py, .sb3 (Scratch), .ipynb, .pdf, .docx, .zip</strong></span>
              <span>•</span>
              <span>Thang điểm: <strong className="text-slate-700">{activity.maxScore || 10} điểm</strong></span>
            </div>
          </div>
        </div>

        {/* Starter Code box if available */}
        {activity.starterCode && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              <span>Mã nguồn mẫu / Khung chương trình gợi ý:</span>
            </h4>
            <pre className="p-3.5 bg-slate-900 text-sky-300 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
              {activity.starterCode}
            </pre>
          </div>
        )}
      </div>

      {!isTeacherOrAdmin && (<>
      {/* Submission Status Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
          Trạng thái nộp bài
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50 w-1/3">
                  Tình trạng nộp
                </td>
                <td className="py-3 px-4">
                  {isSubmitted ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã nộp bài thành công
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                      Chưa nộp bài
                    </span>
                  )}
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">
                  Tình trạng chấm điểm
                </td>
                <td className="py-3 px-4">
                  {isGraded ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold">
                      <Award className="w-3.5 h-3.5" /> Đã chấm điểm: {submission?.grade} / {activity.maxScore || 10}
                    </span>
                  ) : isSubmitted ? (
                    <span className="text-amber-600 font-medium">Đang chờ giáo viên chấm</span>
                  ) : (
                    <span className="text-slate-400">Chưa chấm điểm</span>
                  )}
                </td>
              </tr>

              {isSubmitted && submission?.submittedAt && (
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">
                    Thời gian nộp
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {submission.submittedAt}
                  </td>
                </tr>
              )}

              {isSubmitted && submission?.fileName && (
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">
                    Tệp bài làm đã nộp
                  </td>
                  <td className="py-3 px-4">
                    {submission.fileUrl ? (
                      <a 
                        href={resolveBackendUrl(submission.fileUrl)}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#0374b5] font-bold hover:underline"
                        title="Bấm để tải về hoặc mở tệp bài làm"
                      >
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>{submission.fileName}</span>
                        <span className="text-slate-400 text-[11px] font-normal">({submission.fileSize || 'Tệp đính kèm'})</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-[#0374b5] font-medium">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>{submission.fileName}</span>
                        <span className="text-slate-400 text-[11px]">({submission.fileSize || 'Tệp đính kèm'})</span>
                      </div>
                    )}
                  </td>
                </tr>
              )}

              {isSubmitted && submission?.textSubmission && (
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">
                    Nội dung / Code nộp trực tuyến
                  </td>
                  <td className="py-3 px-4">
                    <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {submission.textSubmission}
                    </pre>
                  </td>
                </tr>
              )}

              {isGraded && submission?.feedback && (
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">
                    Nhận xét của Giáo viên
                  </td>
                  <td className="py-3 px-4 text-slate-800 bg-emerald-50/40 font-medium leading-relaxed">
                    "{submission.feedback}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Workspace (Student & Teacher preview) */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            {isSubmitted ? 'Cập nhật lại bài nộp' : 'Khu vực làm bài & Nộp bài'}
          </h4>

          {/* Tab selector: File vs Online text/code */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setSubmissionTab('file')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                submissionTab === 'file' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Nộp tệp tin (.py, .sb3, .pdf)</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmissionTab('online_text')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                submissionTab === 'online_text' ? 'bg-white text-[#0374b5] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Soạn thảo / Nhập code trực tiếp</span>
            </button>
          </div>
        </div>

        {submissionTab === 'file' ? (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-200 hover:border-[#0374b5] rounded-2xl p-8 text-center transition-colors bg-slate-50/50 group cursor-pointer relative">
              <input 
                type="file" 
                onChange={handleFileChange}
                accept=".py,.sb3,.ipynb,.pdf,.docx,.doc,.zip,.rar,.html,.css,.js,.cpp"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Nhấp để chọn tệp hoặc kéo thả tệp bài làm vào đây'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Hỗ trợ tệp Python (.py), Scratch (.sb3), C++, Jupyter (.ipynb), PDF, Word, ZIP
                </p>
              </div>
            </div>

            <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 leading-relaxed">
              <strong>Lưu trữ an toàn:</strong> Tệp bài làm (≤ 12 MB) được tải lên và <strong>lưu trữ bền vững trên MongoDB Atlas</strong> (không bị mất khi máy chủ khởi động lại). Nếu nộp lại bài, hệ thống vẫn tự động giữ đầy đủ lịch sử các lần nộp trước để giáo viên đối chiếu.
            </p>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs">
                <div className="flex items-center gap-2 text-sky-950 font-bold">
                  <FileCheck className="w-4 h-4 text-[#0374b5]" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Ghi chú thêm gửi giáo viên (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ghi chú thêm về phương pháp giải, thuật toán..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0374b5] focus:bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Mã nguồn chương trình / Lời giải chi tiết:</span>
              <span className="text-[11px] text-slate-400 font-normal">Học sinh có thể gõ hoặc dán code tại đây</span>
            </label>
            <textarea
              rows={8}
              value={onlineText}
              onChange={(e) => setOnlineText(e.target.value)}
              placeholder="# Viết mã nguồn Python, HTML hoặc câu trả lời tại đây..."
              className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0374b5] leading-relaxed"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={(!selectedFile && !onlineText.trim() && !submission?.fileName) || isUploading}
            className="px-6 py-2.5 rounded-xl bg-[#0374b5] hover:bg-[#025a8c] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            {isUploading ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Đang ghi nhận bài nộp...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>{isSubmitted ? 'Cập nhật bài nộp' : 'Lưu và Nộp bài'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      </>)}

      {/* Giáo viên: bài nộp của từng học sinh */}
      {isTeacherOrAdmin && <TeacherSubmissions activity={activity} courseId={courseId} />}
    </div>
  );
};

// ====================== GIÁO VIÊN: DANH SÁCH BÀI NỘP THEO TỪNG HỌC SINH ======================
const TeacherSubmissions: React.FC<AssignmentSubmitterProps> = ({ activity, courseId }) => {
  const [rows, setRows] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.activities.getSubmissions(courseId, activity.id)
      .then(res => {
        setRows(Array.isArray(res) ? res : []);
        setError(null);
      })
      .catch((err: any) => setError(err?.message || 'Không tải được danh sách bài nộp.'))
      .finally(() => setLoading(false));
  }, [courseId, activity.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submittedCount = rows.filter(r => r.submission).length;
  const gradedCount = rows.filter(r => r.submission?.status === 'graded').length;

  return (
    <div className="bg-amber-50/60 rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <h4 className="font-extrabold text-sm text-slate-800">
            Bài nộp của học sinh & Chấm điểm
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-slate-700">
            Đã nộp {submittedCount}/{rows.length} • Đã chấm {gradedCount}
          </span>
          <button
            type="button"
            onClick={load}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
          >
            Tải lại
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-6 text-center text-xs text-slate-500">Đang tải bài nộp...</p>
      ) : error ? (
        <p className="py-4 px-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">Chưa có học sinh nào đăng ký khóa học này.</p>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <SubmissionRow
              key={row.student.id}
              row={row}
              courseId={courseId}
              activityId={activity.id}
              maxScore={activity.maxScore || 10}
              onGraded={load}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SubmissionRow: React.FC<{
  row: StudentSubmission;
  courseId: string;
  activityId: string;
  maxScore: number;
  onGraded: () => void;
}> = ({ row, courseId, activityId, maxScore, onGraded }) => {
  const { gradeAssignment } = useApp();
  const sub = row.submission;
  const [grade, setGrade] = useState<string>(sub?.grade !== undefined ? String(sub.grade) : '');
  const [feedback, setFeedback] = useState<string>(sub?.feedback || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await gradeAssignment(courseId, activityId, row.student.id, Number(grade), feedback);
      setMessage({ ok: true, text: 'Đã lưu điểm.' });
      onGraded();
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || 'Không lưu được điểm.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-slate-800 text-sm">{row.student.name}</span>
          {row.student.className && <span className="text-slate-500"> • {row.student.className}</span>}
          {row.student.email && <span className="text-slate-400"> • {row.student.email}</span>}
        </div>
        {!sub ? (
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">Chưa nộp bài</span>
        ) : sub.status === 'graded' ? (
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold">
            Đã chấm: {sub.grade} / {maxScore}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">Đã nộp, chờ chấm</span>
        )}
      </div>

      {sub && (
        <>
          <div className="text-slate-600 space-y-1">
            {sub.submittedAt && <p>Thời gian nộp: <span className="font-mono">{sub.submittedAt}</span></p>}
            {sub.fileName && (
              <p className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Tên tệp: </span>
                {sub.fileUrl ? (
                  <a
                    href={resolveBackendUrl(sub.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#0374b5] hover:underline"
                    title="Bấm để tải tệp hoặc xem bài làm của học sinh"
                  >
                    {sub.fileName}
                  </a>
                ) : (
                  <strong>{sub.fileName}</strong>
                )}
                {sub.fileSize ? ` (${sub.fileSize})` : ''}
              </p>
            )}
          </div>

          {sub.textSubmission && (
            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {sub.textSubmission}
            </pre>
          )}

          <form onSubmit={handleGrade} className="flex flex-wrap items-end gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Điểm (0 - {maxScore})</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max={maxScore}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#0374b5]"
                required
              />
            </div>
            <div className="flex-1 min-w-[12rem]">
              <label className="block font-bold text-slate-700 mb-1">Nhận xét</label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhận xét cho học sinh..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0374b5]"
              />
            </div>
            <button
              type="submit"
              disabled={saving || grade === ''}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Lưu điểm'}</span>
            </button>
            {message && (
              <span className={`font-bold ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</span>
            )}
          </form>
        </>
      )}
    </div>
  );
};
