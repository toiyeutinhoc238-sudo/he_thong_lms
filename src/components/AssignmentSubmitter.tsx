import React, { useState } from 'react';
import { Activity } from '../types';
import { useApp } from '../context/AppContext';
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
  Trash2
} from 'lucide-react';

interface AssignmentSubmitterProps {
  activity: Activity;
  courseId: string;
}

export const AssignmentSubmitter: React.FC<AssignmentSubmitterProps> = ({ activity, courseId }) => {
  const { submitAssignment, gradeAssignment, activeRole } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Lecturer grading states
  const [gradeScore, setGradeScore] = useState<number>(activity.submission?.grade || 9.0);
  const [feedbackText, setFeedbackText] = useState<string>(activity.submission?.feedback || 'Bài làm tốt, cấu trúc rõ ràng.');
  const [isGradingSaved, setIsGradingSaved] = useState(false);

  const submission = activity.submission;
  const isSubmitted = submission && submission.status !== 'not_submitted';
  const isGraded = submission && submission.status === 'graded';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !submission?.fileName) return;

    setIsUploading(true);
    setTimeout(() => {
      const fileName = selectedFile ? selectedFile.name : (submission?.fileName || 'BaiTap_Nop.pdf');
      submitAssignment(courseId, activity.id, fileName, commentText);
      setIsUploading(false);
      setSelectedFile(null);
    }, 800);
  };

  const handleLecturerGrade = (e: React.FormEvent) => {
    e.preventDefault();
    gradeAssignment(courseId, activity.id, Number(gradeScore), feedbackText);
    setIsGradingSaved(true);
    setTimeout(() => setIsGradingSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
              Bài tập nộp trực tuyến
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-1">
              {activity.title}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Hạn chót: <strong>{activity.dueDate || '15/11/2026 - 23:59'}</strong></span>
            </div>
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Yêu cầu bài tập (Đề bài)
          </h4>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>{activity.assignmentPrompt || 'Vui lòng thực hiện bài làm theo đúng hướng dẫn của giảng viên và tải lên tệp PDF hoặc DOCX.'}</p>
            <p className="text-slate-500 text-xs">
              Định dạng cho phép: <strong>.pdf, .docx, .zip</strong> • Dung lượng tối đa: <strong>25 MB</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Submission Status Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
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
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã nộp bài để chấm điểm
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
                      <Award className="w-3.5 h-3.5" /> Đã chấm điểm: {submission?.grade} / 10
                    </span>
                  ) : isSubmitted ? (
                    <span className="text-amber-600 font-medium">Đang chờ giảng viên chấm</span>
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
                    <div className="flex items-center gap-2 text-hcmue-700 font-medium hover:underline cursor-pointer">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>{submission.fileName}</span>
                      <span className="text-slate-400 text-[11px]">({submission.fileSize || '1.5 MB'})</span>
                    </div>
                  </td>
                </tr>
              )}

              {isGraded && submission?.feedback && (
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">
                    Nhận xét của Giảng viên
                  </td>
                  <td className="py-3 px-4 text-slate-700 bg-emerald-50/30 font-medium leading-relaxed">
                    "{submission.feedback}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Upload Section (Student Mode) */}
      {activeRole === 'student' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            {isSubmitted ? 'Cập nhật lại tệp nộp bài' : 'Tải lên bài nộp'}
          </h4>

          {/* Drag & Drop Zone */}
          <div className="border-2 border-dashed border-slate-200 hover:border-hcmue-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 group cursor-pointer relative">
            <input 
              type="file" 
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.zip,.rar"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-hcmue-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-700">
                {selectedFile ? selectedFile.name : 'Nhấp để chọn tệp hoặc kéo thả tệp vào đây'}
              </p>
              <p className="text-[11px] text-slate-400">
                Hỗ trợ PDF, Microsoft Word, Tệp nén ZIP
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
              <div className="flex items-center gap-2 text-hcmue-900 font-medium">
                <FileCheck className="w-4 h-4 text-hcmue-700" />
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

          {/* Optional Comment */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Ghi chú gửi giảng viên (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ghi chú thêm về bài làm nếu có..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-hcmue-500 focus:bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-6 py-2.5 rounded-xl bg-hcmue-700 hover:bg-hcmue-800 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-hcmue-900/10 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Đang tải lên hệ thống...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{isSubmitted ? 'Lưu thay đổi bài nộp' : 'Lưu và Nộp bài'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Lecturer Quick Grading Box (Lecturer/Admin Mode) */}
      {(activeRole === 'lecturer' || activeRole === 'admin') && (
        <form onSubmit={handleLecturerGrade} className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h4 className="font-extrabold text-sm text-slate-800">
              Bảng Chấm Điểm của Giảng viên (Lecturer Grading Studio)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm số (Thang điểm 10)
              </label>
              <input 
                type="number" 
                step="0.5" 
                min="0" 
                max="10" 
                value={gradeScore}
                onChange={(e) => setGradeScore(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:border-hcmue-600"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nhận xét & Phản hồi bài làm
              </label>
              <input 
                type="text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Nhập nhận xét chi tiết cho sinh viên..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-hcmue-600"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isGradingSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đã cập nhật điểm vào sổ điểm hệ thống!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all"
            >
              Lưu điểm & Công bố cho sinh viên
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

