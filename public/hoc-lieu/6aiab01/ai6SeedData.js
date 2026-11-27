import { bai1Module } from './bai1/data.js';
import { bai2Module } from './bai2/data.js';
import { bai3Module } from './bai3/data.js';
import { bai4Module } from './bai4/data.js';
import { bai5Module } from './bai5/data.js';
import { bai6Module } from './bai6/data.js';
import { bai7Module } from './bai7/data.js';
import { bai8Module } from './bai8/data.js';

export const OFFICIAL_AI_GRADE6_LESSONS = [
  'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
  'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
  'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
  'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
  'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
  'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
  'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
  'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO'
];

// Mỗi lần sửa bất kỳ file data.js nào, đổi số phiên bản này rồi restart server
export const AI6_BAI12_REVISION = 'v17-split-by-lesson';

export function buildAi6Bai12SeedData() {
  const lessonModules = [
    bai1Module,
    bai2Module,
    bai3Module,
    bai4Module,
    bai5Module,
    bai6Module,
    bai7Module,
    bai8Module
  ];

  const officialFiles = [
    ...OFFICIAL_AI_GRADE6_LESSONS.map((lessonTitle, idx) => ({
      id: `file-ai6-b${idx + 1}-tongquan`,
      name: `0.GioiThieuTongQuan_Bai${idx + 1}.html`,
      filename: '0.GioiThieuTongQuan.html',
      url: `/hoc-lieu/6aiab01/bai${idx + 1}/0.GioiThieuTongQuan.html`,
      size: idx === 2 ? '25 KB' : '26 KB',
      mimetype: 'text/html',
      fileType: 'code',
      folder: lessonTitle,
      moduleId: `module-lesson-${idx + 1}`,
      description: `Tài liệu đọc Giới thiệu tổng quan kèm sơ đồ 4 mạch nội dung chuẩn mẫu M9 cho ${lessonTitle}.`,
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    })),
    ...lessonModules.flatMap(m => m.officialFiles || [])
  ];

  const officialSyllabus = lessonModules.map(m => m.syllabusLine).filter(Boolean);

  return {
    lessonModules,
    officialFiles,
    officialSyllabus
  };
}
