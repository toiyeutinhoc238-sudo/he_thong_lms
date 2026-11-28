import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Printer, Download, Award } from 'lucide-react';

function formatClassLabel(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^(lớp|lop|khối|khoi|gv|quản trị)/i.test(trimmed)) return trimmed;
  return `Lớp ${trimmed}`;
}

const CornerOrnament: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 pointer-events-none select-none ${className}`}
    aria-hidden="true"
  >
    {/* Nhánh trên (vàng sáng hơn) */}
    <polygon points="0,0 100,0 74,26 26,26" fill="#D5B263" />
    {/* Nhánh trái (vàng đậm hơn tạo hiệu ứng gấp mép) */}
    <polygon points="0,0 26,26 26,74 0,100" fill="#C49B45" />
    {/* Đường chéo ghép góc */}
    <line x1="0" y1="0" x2="26" y2="26" stroke="#B58B37" strokeWidth="1.2" opacity="0.55" />
  </svg>
);

const GoldLaurelSeal: React.FC = () => (
  <svg
    viewBox="0 0 120 120"
    className="w-12 h-12 sm:w-16 sm:h-16 md:w-[74px] md:h-[74px] mx-auto select-none"
    aria-hidden="true"
  >
    {/* Huy hiệu viền lượn sóng màu vàng đồng */}
    <path
      d="M60 4 C68 4, 73 10, 81 12 C89 14, 96 13, 102 19 C108 25, 107 32, 109 40 C111 48, 117 53, 117 60 C117 67, 111 72, 109 80 C107 88, 108 95, 102 101 C96 107, 89 106, 81 108 C73 110, 68 116, 60 116 C52 116, 47 110, 39 108 C31 106, 24 107, 18 101 C12 95, 13 88, 11 80 C9 72, 3 67, 3 60 C3 53, 9 48, 11 40 C13 32, 12 25, 18 19 C24 13, 31 14, 39 12 C47 10, 52 4, 60 4 Z"
      fill="#C9A255"
    />
    {/* Vòng tròn trắng mảnh bên trong */}
    <circle cx="60" cy="60" r="44" fill="none" stroke="#FFFFFF" strokeWidth="2.4" opacity="0.95" />
    {/* Vòng nguyệt quế đối xứng */}
    <g fill="#FFFFFF">
      {/* Cành trái */}
      <path d="M56 89 C37 83, 27 65, 31 44 C33 36, 37 29, 43 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="42" cy="31" rx="6" ry="2.6" transform="rotate(-48 42 31)" />
      <ellipse cx="35" cy="39" rx="6.2" ry="2.7" transform="rotate(-32 35 39)" />
      <ellipse cx="31" cy="49" rx="6.4" ry="2.7" transform="rotate(-14 31 49)" />
      <ellipse cx="30" cy="60" rx="6.4" ry="2.7" transform="rotate(6 30 60)" />
      <ellipse cx="34" cy="70" rx="6.2" ry="2.7" transform="rotate(26 34 70)" />
      <ellipse cx="41" cy="79" rx="6" ry="2.6" transform="rotate(44 41 79)" />
      <ellipse cx="50" cy="86" rx="5.6" ry="2.5" transform="rotate(62 50 86)" />

      {/* Cành phải (đối xứng) */}
      <path d="M64 89 C83 83, 93 65, 89 44 C87 36, 83 29, 77 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="78" cy="31" rx="6" ry="2.6" transform="rotate(48 78 31)" />
      <ellipse cx="85" cy="39" rx="6.2" ry="2.7" transform="rotate(32 85 39)" />
      <ellipse cx="89" cy="49" rx="6.4" ry="2.7" transform="rotate(14 89 49)" />
      <ellipse cx="90" cy="60" rx="6.4" ry="2.7" transform="rotate(-6 90 60)" />
      <ellipse cx="86" cy="70" rx="6.2" ry="2.7" transform="rotate(-26 86 70)" />
      <ellipse cx="79" cy="79" rx="6" ry="2.6" transform="rotate(-44 79 79)" />
      <ellipse cx="70" cy="86" rx="5.6" ry="2.5" transform="rotate(-62 70 86)" />

      {/* Đế giao nhau */}
      <circle cx="60" cy="91" r="2.6" />
    </g>
  </svg>
);

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const CertificateModal: React.FC = () => {
  const { activeCertificate, setActiveCertificate, currentUser } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  if (!activeCertificate) return null;

  const isOwnCert = Boolean(currentUser && activeCertificate.studentId === currentUser.id);
  const displayName = (isOwnCert ? (currentUser?.name || activeCertificate.studentName) : activeCertificate.studentName) || 'Học viên';
  const rawClass = isOwnCert
    ? (currentUser?.className || currentUser?.classOrPosition || activeCertificate.studentClass || '')
    : (activeCertificate.studentClass || '');
  const displayClass = formatClassLabel(rawClass);
  const displaySchool = (isOwnCert ? (currentUser?.school || activeCertificate.studentSchool) : activeCertificate.studentSchool) || '';
  const issuerLine = displaySchool ? `${displaySchool} trân trọng chứng nhận` : 'Hệ thống LMS Nhóm 2 trân trọng chứng nhận';
  const sigName = (activeCertificate.signatureName || 'Phan Phi Phú').toUpperCase();
  const sigTitle = activeCertificate.signatureTitle || 'Giáo viên phụ trách';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      const W = 1600;
      const H = 1131;
      const pad = 92;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Nền khung xám xanh đậm (#39394B)
      ctx.fillStyle = '#39394B';
      ctx.fillRect(0, 0, W, H);

      // 2. Tờ giấy trắng trung tâm
      const ix = pad;
      const iy = pad;
      const iw = W - pad * 2;
      const ih = H - pad * 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ix, iy, iw, ih);

      // 3. 4 góc vàng gấp mép
      const drawCorner = (cx: number, cy: number, sx: number, sy: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sx, sy);
        const s = 116;
        const b = 30;
        ctx.fillStyle = '#D5B263';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(s, 0);
        ctx.lineTo(s - b, b);
        ctx.lineTo(b, b);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#C49B45';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(b, b);
        ctx.lineTo(b, s - b);
        ctx.lineTo(0, s);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      const inset = 22;
      drawCorner(ix + inset, iy + inset, 1, 1);
      drawCorner(ix + iw - inset, iy + inset, -1, 1);
      drawCorner(ix + inset, iy + ih - inset, 1, -1);
      drawCorner(ix + iw - inset, iy + ih - inset, -1, -1);

      // 4. Huy hiệu vòng nguyệt quế vàng phía trên giữa
      const sealCx = W / 2;
      const sealCy = iy + 150;
      ctx.save();
      ctx.translate(sealCx, sealCy);
      ctx.fillStyle = '#C9A255';
      ctx.beginPath();
      const lobes = 12;
      for (let i = 0; i <= 360; i++) {
        const rad = (i * Math.PI) / 180;
        const r = 60 + 3.5 * Math.cos(lobes * rad);
        const px = r * Math.cos(rad);
        const py = r * Math.sin(rad);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 46, 0, Math.PI * 2);
      ctx.stroke();

      // Vòng nguyệt quế đơn giản sắc nét
      ctx.fillStyle = '#FFFFFF';
      const drawBranch = (dir: number) => {
        ctx.save();
        ctx.scale(dir, 1);
        ctx.beginPath();
        ctx.moveTo(-4, 30);
        ctx.bezierCurveTo(-28, 22, -34, -4, -20, -32);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        const pts: [number, number, number][] = [
          [-18, -28, -0.8],
          [-26, -18, -0.55],
          [-30, -6, -0.2],
          [-30, 6, 0.15],
          [-26, 17, 0.45],
          [-18, 25, 0.8]
        ];
        pts.forEach(([lx, ly, rot]) => {
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        ctx.restore();
      };
      drawBranch(1);
      drawBranch(-1);
      ctx.restore();

      // 5. Tiêu đề chính (vàng đồng serif)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#C29B48';
      ctx.font = '600 44px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('CHỨNG NHẬN HOÀN THÀNH', W / 2, iy + 278);

      // 6. Đơn vị trao tặng
      ctx.fillStyle = '#2D2E3A';
      ctx.font = '500 28px "Be Vietnam Pro", "Segoe UI", sans-serif';
      ctx.fillText(issuerLine, W / 2, iy + 344);

      // 7. Họ và tên học sinh (lớn, serif vàng đồng)
      ctx.fillStyle = '#C29B48';
      const upperName = displayName.toUpperCase();
      let nameFontSize = 78;
      ctx.font = `600 ${nameFontSize}px "Cormorant Garamond", Georgia, serif`;
      while (ctx.measureText(upperName).width > iw - 220 && nameFontSize > 42) {
        nameFontSize -= 4;
        ctx.font = `600 ${nameFontSize}px "Cormorant Garamond", Georgia, serif`;
      }
      ctx.fillText(upperName, W / 2, iy + 458);

      // 8. Lớp học (đồng bộ theo hồ sơ)
      let cursorY = iy + 510;
      if (displayClass) {
        ctx.fillStyle = '#4A4D5E';
        ctx.font = '600 26px "Be Vietnam Pro", "Segoe UI", sans-serif';
        ctx.fillText(displayClass, W / 2, cursorY);
        cursorY += 52;
      } else {
        cursorY += 16;
      }

      // 9. Nội dung hoàn thành khóa học
      ctx.fillStyle = '#3A3D4D';
      ctx.font = '400 25px "Be Vietnam Pro", "Segoe UI", sans-serif';
      ctx.fillText('đã hoàn thành xuất sắc khóa học', W / 2, cursorY);
      cursorY += 44;

      ctx.fillStyle = '#222431';
      ctx.font = '600 28px "Be Vietnam Pro", "Segoe UI", sans-serif';
      const courseLines = wrapCanvasText(ctx, activeCertificate.courseName, iw - 260);
      courseLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, W / 2, cursorY);
        cursorY += 38;
      });

      // Thông tin ngày cấp / xếp loại / mã số tinh gọn
      ctx.fillStyle = '#73778A';
      ctx.font = '400 18px "Be Vietnam Pro", "Segoe UI", sans-serif';
      const metaText = `Ngày cấp: ${activeCertificate.issueDate}  •  Xếp loại: ${activeCertificate.gradeClassification} (${activeCertificate.scoreAverage}/10)  •  Mã: ${activeCertificate.certificateNumber}`;
      ctx.fillText(metaText, W / 2, cursorY + 14);

      // 10. Hai cột chữ ký phía dưới (giống mẫu)
      const sigY = iy + ih - 135;
      const leftX = ix + iw * 0.27;
      const rightX = ix + iw * 0.73;

      const drawSig = (x: number, nameText: string, roleText: string) => {
        ctx.fillStyle = '#C9A255';
        ctx.fillRect(x - 24, sigY - 38, 48, 3);
        ctx.fillStyle = '#C29B48';
        ctx.font = '600 22px "Be Vietnam Pro", "Segoe UI", sans-serif';
        ctx.fillText(nameText, x, sigY);
        ctx.fillStyle = '#4A4D5E';
        ctx.font = '400 19px "Be Vietnam Pro", "Segoe UI", sans-serif';
        ctx.fillText(roleText, x, sigY + 34);
      };

      drawSig(leftX, sigName, sigTitle);
      drawSig(rightX, 'LMS NHÓM 2', 'Hệ thống Đào tạo Trực tuyến');

      const safeSlug = displayName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'hoc-vien';

      const link = document.createElement('a');
      link.download = `chung-nhan-${safeSlug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={() => setActiveCertificate(null)}
    >
      <div
        className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C29B48]" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Chứng nhận hoàn thành khóa học
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-[#C29B48] hover:bg-[#ad8739] disabled:opacity-60 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Đang xuất ảnh...' : 'Tải ảnh PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCertificate(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE CANVAS (Thiết kế theo Mẫu chứng chỉ.png) */}
        <div
          id="certificate-print-area"
          className="w-full aspect-[1.414/1] bg-[#39394B] p-4 sm:p-7 md:p-10 rounded-xl shadow-lg flex items-center justify-center overflow-hidden"
        >
          <div className="relative bg-white w-full h-full flex flex-col justify-between px-6 py-6 sm:px-12 sm:py-9 md:px-16 md:py-11 text-center overflow-hidden">
            {/* 4 góc vàng gấp mép */}
            <CornerOrnament className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5" />
            <CornerOrnament className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 -scale-x-100" />
            <CornerOrnament className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 -scale-y-100" />
            <CornerOrnament className="absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 -scale-x-100 -scale-y-100" />

            {/* Huy hiệu vòng nguyệt quế phía trên */}
            <div className="pt-1 sm:pt-2">
              <GoldLaurelSeal />
            </div>

            {/* Khối nội dung trung tâm */}
            <div className="space-y-1.5 sm:space-y-2.5 md:space-y-3 px-2 sm:px-8 my-auto">
              <h1
                className="text-base sm:text-2xl md:text-[30px] font-semibold uppercase tracking-[0.14em] text-[#C29B48]"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                CHỨNG NHẬN HOÀN THÀNH
              </h1>

              <p className="text-[11px] sm:text-sm md:text-base font-medium text-[#2D2E3A]">
                {issuerLine}
              </p>

              {/* Họ và tên học sinh đồng bộ */}
              <div className="pt-1 sm:pt-2">
                <h2
                  className="text-2xl sm:text-4xl md:text-[52px] font-semibold uppercase tracking-[0.12em] text-[#C29B48] leading-tight break-words"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  {displayName}
                </h2>
                {displayClass && (
                  <p className="text-xs sm:text-sm md:text-base font-semibold text-[#4A4D5E] mt-1 tracking-wide">
                    {displayClass}
                  </p>
                )}
              </div>

              {/* Nội dung khóa học đã hoàn thành */}
              <div className="pt-1 sm:pt-2 max-w-xl mx-auto space-y-1">
                <p className="text-[11px] sm:text-sm md:text-[15px] text-[#3A3D4D] leading-relaxed">
                  đã hoàn thành xuất sắc khóa học
                </p>
                <p className="text-xs sm:text-base md:text-lg font-semibold text-[#222431] leading-snug">
                  {activeCertificate.courseName}
                </p>
                <p className="text-[10px] sm:text-xs text-[#73778A] pt-1">
                  Ngày cấp: {activeCertificate.issueDate}
                  {' • '}Xếp loại: <strong className="font-semibold text-[#4A4D5E]">{activeCertificate.gradeClassification}</strong> ({activeCertificate.scoreAverage}/10)
                  {' • '}Mã: <span className="font-mono">{activeCertificate.certificateNumber}</span>
                </p>
              </div>
            </div>

            {/* 2 cột chữ ký phía dưới theo đúng bố cục mẫu */}
            <div className="grid grid-cols-2 gap-4 sm:gap-10 max-w-2xl w-full mx-auto pb-1 sm:pb-3 pt-2">
              <div className="text-center space-y-1">
                <div className="w-7 sm:w-9 h-[2px] bg-[#C9A255] mx-auto mb-1.5 sm:mb-2" />
                <p className="text-[10px] sm:text-xs md:text-sm font-semibold uppercase tracking-[0.1em] text-[#C29B48]">
                  {sigName}
                </p>
                <p className="text-[10px] sm:text-xs text-[#4A4D5E]">
                  {sigTitle}
                </p>
              </div>

              <div className="text-center space-y-1">
                <div className="w-7 sm:w-9 h-[2px] bg-[#C9A255] mx-auto mb-1.5 sm:mb-2" />
                <p className="text-[10px] sm:text-xs md:text-sm font-semibold uppercase tracking-[0.1em] text-[#C29B48]">
                  LMS NHÓM 2
                </p>
                <p className="text-[10px] sm:text-xs text-[#4A4D5E]">
                  Hệ thống Đào tạo Trực tuyến
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
