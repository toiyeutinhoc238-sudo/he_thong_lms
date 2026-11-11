import React from 'react';
import { Certificate } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Printer, 
  Download, 
  Award, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

export const CertificateModal: React.FC = () => {
  const { activeCertificate, setActiveCertificate, certificates } = useApp();

  if (!activeCertificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95">
        {/* Action Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Chứng chỉ Điện tử Xác thực • HCMUE VLE
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>In chứng chỉ / Lưu PDF</span>
            </button>

            <button
              onClick={() => setActiveCertificate(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE CANVAS */}
        <div 
          id="certificate-print-area"
          className="relative bg-gradient-to-br from-amber-50/20 via-white to-amber-50/30 border-8 border-double border-amber-600/40 rounded-2xl p-6 sm:p-10 shadow-inner text-center space-y-6 overflow-hidden"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-amber-600" />
          <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-amber-600" />
          <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-amber-600" />
          <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-amber-600" />

          {/* National Header */}
          <div className="space-y-1">
            <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-widest">
              BỘ GIÁO DỤC VÀ ĐÀO TẠO
            </h4>
            <h3 className="text-sm sm:text-base font-extrabold text-hcmue-900 uppercase tracking-wider">
              TRƯỜNG ĐẠI HỌC SƯ PHẠM THÀNH PHỐ HỒ CHÍ MINH
            </h3>
            <div className="w-24 h-0.5 bg-amber-500 mx-auto mt-1" />
          </div>

          {/* Certificate Main Title */}
          <div className="py-2 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hệ thống Đào tạo Trực tuyến VLE</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-slate-900 tracking-wide uppercase">
              GIẤY CHỨNG NHẬN
            </h1>
            <p className="text-xs sm:text-sm font-serif italic text-slate-500">
              Certificate of Course Completion
            </p>
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-slate-600 font-serif">
              Chứng nhận Học viên / Sinh viên:
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-hcmue-800 tracking-wider uppercase font-serif">
              {activeCertificate.studentName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-mono">
              Mã định danh: <strong>{activeCertificate.studentCode}</strong>
            </p>
          </div>

          {/* Achievement Description */}
          <div className="max-w-xl mx-auto space-y-2">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
              Đã hoàn thành xuất sắc 100% thời lượng và các bài kiểm tra đánh giá của học phần:
            </p>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 uppercase font-serif px-4 py-2 bg-amber-100/40 rounded-xl border border-amber-200">
              {activeCertificate.courseName}
            </h3>
            <div className="flex items-center justify-center gap-6 pt-1 text-xs sm:text-sm text-slate-700">
              <span>Điểm tổng kết: <strong className="text-hcmue-900 font-bold">{activeCertificate.scoreAverage}/10</strong></span>
              <span>•</span>
              <span>Xếp loại: <strong className="text-emerald-700 font-bold">{activeCertificate.gradeClassification}</strong></span>
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div className="pt-6 grid grid-cols-2 gap-4 items-end max-w-2xl mx-auto text-left">
            {/* Left: QR Code Verification */}
            <div className="space-y-2 flex flex-col items-center sm:items-start">
              <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs inline-block">
                <QrCode className="w-16 h-16 sm:w-20 sm:h-20 text-slate-800" />
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 space-y-0.5">
                <div className="font-mono font-bold text-slate-700">Số: {activeCertificate.certificateNumber}</div>
                <div>Quét QR để tra cứu trực tuyến</div>
                <div className="text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Chữ ký số đã được xác thực
                </div>
              </div>
            </div>

            {/* Right: Signature & Stamp */}
            <div className="text-center space-y-1">
              <p className="text-[11px] sm:text-xs text-slate-500 italic">
                TP. Hồ Chí Minh, ngày {activeCertificate.issueDate}
              </p>
              <p className="text-xs font-bold text-slate-800 uppercase">
                {activeCertificate.signatureTitle}
              </p>

              {/* Red Stamp Emblem */}
              <div className="py-2 relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-red-600 border-dashed flex flex-col items-center justify-center text-red-600 font-bold text-[9px] uppercase leading-tight rotate-[-12deg] bg-red-50/50 shadow-xs">
                  <span>★ HCMUE ★</span>
                  <span className="font-extrabold text-[10px]">ĐÃ KÝ SỐ</span>
                  <span>XÁC THỰC</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-serif font-bold text-slate-900">
                {activeCertificate.signatureName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

