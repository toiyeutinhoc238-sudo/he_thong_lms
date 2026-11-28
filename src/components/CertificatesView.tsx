import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, ArrowRight, ShieldCheck, Eye } from 'lucide-react';

export const CertificatesView: React.FC = () => {
  const { certificates, setActiveCertificate, courses, currentUser, activeRole } = useApp();

  const canManage = Boolean(
    currentUser?.role === 'admin' ||
    currentUser?.role === 'lecturer' ||
    activeRole === 'admin' ||
    activeRole === 'lecturer'
  );

  const handlePreviewTemplate = () => {
    const sampleCourse = courses[0];
    setActiveCertificate({
      id: 'cert-preview',
      certificateNumber: `LMS2-${sampleCourse?.code || '6AIAB01'}-${new Date().getFullYear()}-MAU`,
      courseId: sampleCourse?.id || '6AIAB01',
      courseName: sampleCourse?.name || 'Chuyên đề trí tuệ nhân tạo lớp 6: Chủ đề A và B',
      studentId: currentUser?.id || 'preview',
      studentName: currentUser?.name || 'Học viên mẫu',
      studentCode: currentUser?.code || 'HV001',
      studentClass: currentUser?.className || currentUser?.classOrPosition || 'Lớp 6A1',
      studentSchool: currentUser?.school || '',
      issueDate: new Date().toLocaleDateString('vi-VN'),
      scoreAverage: 9.5,
      gradeClassification: 'Xuất sắc',
      qrVerificationUrl: '',
      signatureName: sampleCourse?.instructor?.name || 'Phan Phi Phú',
      signatureTitle: 'Giáo viên phụ trách'
    });
  };

  return (
    <div className="flex-1 min-w-0 w-full p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Chứng chỉ & Văn bằng Điện tử Xác thực</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Chứng Chỉ Hoàn Thành Khóa Học (LMS Nhóm 2)
          </h1>
          <p className="text-xs text-slate-500">
            Chứng chỉ được cấp tự động khi học viên đạt 100% tiến độ học tập và vượt qua các bài kiểm tra đánh giá theo quy chuẩn của Trường ĐH Sư phạm TP.HCM.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {canManage && (
            <button
              type="button"
              onClick={handlePreviewTemplate}
              className="px-4 py-2.5 rounded-2xl bg-[#39394B] hover:bg-[#2d2d3c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-[#D5B263]" />
              <span>Xem mẫu chứng chỉ</span>
            </button>
          )}
          <div className="px-5 py-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-center">
            <div className="text-2xl font-black text-amber-600">{certificates.length}</div>
            <div className="text-xs font-bold text-amber-800">Chứng chỉ đã đạt</div>
          </div>
        </div>
      </div>

      {/* Grid of Certificates */}
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map(cert => (
            <div 
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg hover:border-amber-400 transition-all space-y-4 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                    Chứng nhận hoàn thành
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {cert.certificateNumber}
                  </span>
                </div>

                <h3 className="font-extrabold text-base sm:text-lg text-slate-800 group-hover:text-hcmue-700 transition-colors">
                  {cert.courseName}
                </h3>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400">Học viên:</span>
                    <strong className="text-slate-800">{cert.studentName}</strong>
                    {cert.studentClass && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {/^(lớp|lop|khối|khoi)/i.test(cert.studentClass) ? cert.studentClass : `Lớp ${cert.studentClass}`}
                      </span>
                    )}
                    <span className="font-mono text-slate-500">({cert.studentCode})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Ngày cấp:</span>
                    <span>{cert.issueDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Kết quả:</span>
                    <strong className="text-emerald-600">{cert.scoreAverage}/10 ({cert.gradeClassification})</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác thực bởi LMS Nhóm 2</span>
                </div>

                <button
                  onClick={() => setActiveCertificate(cert)}
                  className="px-4 py-2 bg-hcmue-700 hover:bg-hcmue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>Xem & In chứng chỉ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
          <Award className="w-16 h-16 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700">
            Chưa có chứng chỉ nào được cấp
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy hoàn thành 100% các bài học, xem video bài giảng và đạt bài kiểm tra trắc nghiệm trong khóa học để nhận chứng chỉ chính thức.
          </p>
        </div>
      )}
    </div>
  );
};

