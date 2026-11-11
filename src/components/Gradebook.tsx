import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  Printer, 
  Download, 
  BookOpen,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

export const Gradebook: React.FC = () => {
  const { currentUser, courses } = useApp();
  const [apiGrades, setApiGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt to load from API if endpoint exists
    api.grades.getMyGrades()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setApiGrades(res);
        }
      })
      .catch(() => {});
  }, []);

  // Compute student grades dynamically from real courses in state
  const computedGradeRows = courses.map(course => {
    let quizTotal = 0;
    let quizCount = 0;
    let assignmentTotal = 0;
    let assignmentCount = 0;
    let completedActs = 0;
    let totalActs = 0;

    (course.modules || []).forEach(m => {
      (m.activities || []).forEach(a => {
        totalActs++;
        if (a.isCompleted) completedActs++;

        if (a.type === 'quiz' && a.score !== undefined) {
          quizTotal += a.score;
          quizCount++;
        }

        if (a.type === 'assignment' && a.submission?.grade !== undefined) {
          assignmentTotal += a.submission.grade;
          assignmentCount++;
        }
      });
    });

    const attendanceScore = totalActs > 0 ? Number(((completedActs / totalActs) * 10).toFixed(1)) : 10.0;
    const assignmentScore = assignmentCount > 0 ? Number((assignmentTotal / assignmentCount).toFixed(1)) : null;
    const quizScore = quizCount > 0 ? Number((quizTotal / quizCount).toFixed(1)) : null;
    
    // Overall weighted score
    let totalScore = 0;
    let weightSum = 0;
    
    // Attendance 20%
    totalScore += attendanceScore * 0.2;
    weightSum += 0.2;

    if (quizScore !== null) {
      totalScore += quizScore * 0.3;
      weightSum += 0.3;
    }

    if (assignmentScore !== null) {
      totalScore += assignmentScore * 0.5;
      weightSum += 0.5;
    }

    const finalAvg = weightSum > 0 ? Number((totalScore / weightSum).toFixed(1)) : null;

    let letter = 'Chưa có';
    let scale4: number | string = '-';
    let status = 'Đang học';

    if (finalAvg !== null) {
      if (finalAvg >= 9.0) { letter = 'A+'; scale4 = 4.0; status = 'Đạt'; }
      else if (finalAvg >= 8.5) { letter = 'A'; scale4 = 3.7; status = 'Đạt'; }
      else if (finalAvg >= 8.0) { letter = 'B+'; scale4 = 3.5; status = 'Đạt'; }
      else if (finalAvg >= 7.0) { letter = 'B'; scale4 = 3.0; status = 'Đạt'; }
      else if (finalAvg >= 6.5) { letter = 'C+'; scale4 = 2.5; status = 'Đạt'; }
      else if (finalAvg >= 5.0) { letter = 'C'; scale4 = 2.0; status = 'Đạt'; }
      else if (finalAvg >= 4.0) { letter = 'D'; scale4 = 1.0; status = 'Đạt'; }
      else { letter = 'F'; scale4 = 0.0; status = 'Chưa đạt'; }
    }

    return {
      code: course.code,
      name: course.name,
      credits: course.credits,
      attendance: attendanceScore,
      assignment: assignmentScore !== null ? assignmentScore : '-',
      quiz: quizScore !== null ? quizScore : '-',
      total: finalAvg !== null ? finalAvg : '-',
      letter,
      scale4,
      status
    };
  });

  const totalCredits = courses.reduce((acc, c) => acc + (c.credits || 0), 0);

  return (
    <div className="space-y-6">
      {/* Gradebook Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-hcmue-700 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Sổ điểm & Bảng đánh giá quá trình học tập</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Kết Quả Học Tập Học Phần
          </h1>
          <p className="text-xs text-slate-500">
            Học viên: <strong>{currentUser.name}</strong> • Mã số: <strong className="font-mono">{currentUser.code}</strong>
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>In bảng điểm PDF</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-400">Số lượng học phần</p>
          <h3 className="text-2xl sm:text-3xl font-black text-hcmue-800 mt-1">{courses.length}</h3>
          <span className="text-[11px] text-slate-500 font-medium">Học phần đã đăng ký</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-400">Tổng tín chỉ</p>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{totalCredits}</h3>
          <span className="text-[11px] text-slate-500 font-medium">Tín chỉ tích lũy</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-400">Trạng thái hồ sơ</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">Đang hoạt động</h3>
          <span className="text-[11px] text-emerald-700 font-medium">Đồng bộ từ hệ thống VLE</span>
        </div>
      </div>

      {/* Detailed Grades Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-base">
            Chi tiết điểm các môn học
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {computedGradeRows.length} môn học
          </span>
        </div>

        {computedGradeRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Mã HP</th>
                  <th className="py-3.5 px-4">Tên học phần</th>
                  <th className="py-3.5 px-3 text-center">Tín chỉ</th>
                  <th className="py-3.5 px-3 text-center">Chuyên cần</th>
                  <th className="py-3.5 px-3 text-center">Bài tập</th>
                  <th className="py-3.5 px-3 text-center">Trắc nghiệm</th>
                  <th className="py-3.5 px-3 text-center font-black text-slate-800">Tổng kết</th>
                  <th className="py-3.5 px-3 text-center">Điểm chữ</th>
                  <th className="py-3.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {computedGradeRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-hcmue-700">{row.code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs">{row.name}</td>
                    <td className="py-3.5 px-3 text-center font-semibold">{row.credits}</td>
                    <td className="py-3.5 px-3 text-center">{row.attendance}</td>
                    <td className="py-3.5 px-3 text-center">{row.assignment}</td>
                    <td className="py-3.5 px-3 text-center">{row.quiz}</td>
                    <td className="py-3.5 px-3 text-center font-black text-sm text-hcmue-900">{row.total}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-700">{row.letter}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        row.status === 'Đạt' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có môn học nào để hiển thị điểm. Dữ liệu sẽ xuất hiện khi API trả về danh sách môn học.
          </div>
        )}
      </div>
    </div>
  );
};
