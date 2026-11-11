import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  Mail, 
  Send, 
  CheckCircle2, 
  BookOpen, 
  ShieldCheck, 
  FileText,
  LifeBuoy
} from 'lucide-react';

export const CanvasHelp: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [supportMessage, setSupportMessage] = useState({
    title: '',
    category: 'Sử dụng bài học & nộp bài',
    message: ''
  });
  const [isSent, setIsSent] = useState(false);

  const faqs = [
    {
      q: '1. Làm thế nào để tham gia và nộp bài tập trên hệ thống LMS Nhóm 2?',
      a: 'Bạn vào mục "Khóa học" từ thanh menu bên trái, chọn khóa học bạn đang tham gia. Tại mỗi chương/bài học, nhấp vào bài tập để xem đề bài, sau đó tải file bài làm (PDF, Word, ZIP) hoặc nhập nội dung trực tuyến và nhấn nút "Nộp bài tập".'
    },
    {
      q: '2. Cách làm bài kiểm tra trắc nghiệm và xem điểm số tự động?',
      a: 'Khi đến bài kiểm tra trắc nghiệm, bấm "Bắt đầu làm bài". Sau khi chọn đáp án và bấm "Nộp bài thi", hệ thống sẽ chấm điểm tự động ngay lập tức, hiển thị điểm số, tỷ lệ đúng và lời giải chi tiết cho từng câu hỏi.'
    },
    {
      q: '3. Quản trị viên thêm khóa học, bài giảng và tài liệu mới như thế nào?',
      a: 'Tài khoản Quản trị viên (phanphiphu04@gmail.com) có toàn quyền tạo khóa học tại mục "Khóa học" hoặc "Bảng điều phối". Trong từng khóa học, bạn có thể bấm "+ Thêm mô-đun" hoặc "+ Thêm hoạt động" để nhúng video YouTube, chèn tài liệu PDF, tạo bài tập nộp file và tạo đề thi trắc nghiệm.'
    },
    {
      q: '4. Đăng nhập bằng Google gặp thông báo lỗi ủy quyền thì xử lý ra sao?',
      a: 'Nếu gặp lỗi "no registered origin" (Lỗi 401), hãy đảm bảo bạn đã thêm đúng tên miền trang web (https://he-thong-lms.onrender.com) vào mục "Authorized JavaScript origins" trên Google Cloud Console theo hướng dẫn của hệ thống.'
    }
  ];

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.title.trim() || !supportMessage.message.trim()) return;

    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setSupportMessage({
        title: '',
        category: 'Sử dụng bài học & nộp bài',
        message: ''
      });
      alert('Yêu cầu trợ giúp của bạn đã được gửi thành công đến Ban Quản trị LMS Nhóm 2!');
    }, 1200);
  };

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0374b5] via-[#02629b] to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-xs">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Trung tâm Hỗ trợ & Trợ giúp</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Bạn Cần Trợ Giúp Về Điều Gì?
        </h1>
        <p className="text-sky-100 text-xs sm:text-sm max-w-xl leading-relaxed">
          Tìm kiếm câu trả lời nhanh cho các vấn đề thường gặp hoặc gửi câu hỏi trực tiếp đến đội ngũ hỗ trợ kỹ thuật LMS Nhóm 2.
        </p>
      </div>

      {/* FAQs List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#0374b5]" />
          <span>Câu hỏi thường gặp (FAQ)</span>
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left font-extrabold text-xs sm:text-sm text-slate-800 hover:text-[#0374b5] flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-sky-50/30 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#0374b5] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Ticket Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#0374b5]" />
            <span>Gửi yêu cầu trợ giúp kỹ thuật</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">Phản hồi trong vòng 24h</span>
        </div>

        <form onSubmit={handleSendSupport} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phân loại vấn đề
            </label>
            <select
              value={supportMessage.category}
              onChange={(e) => setSupportMessage({ ...supportMessage, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
            >
              <option value="Sử dụng bài học & nộp bài">Sử dụng bài học & nộp bài tập</option>
              <option value="Bài thi trắc nghiệm & điểm số">Bài thi trắc nghiệm & điểm số</option>
              <option value="Tài khoản Google & Đăng nhập">Tài khoản Google & Đăng nhập</option>
              <option value="Góp ý nâng cấp giao diện">Góp ý nâng cấp giao diện & chức năng</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề yêu cầu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Tóm tắt ngắn gọn vấn đề bạn đang gặp phải..."
              value={supportMessage.title}
              onChange={(e) => setSupportMessage({ ...supportMessage, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Hãy mô tả rõ các bước bạn đã thực hiện hoặc lỗi bạn gặp phải..."
              value={supportMessage.message}
              onChange={(e) => setSupportMessage({ ...supportMessage, message: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSent}
              className="px-6 py-3 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{isSent ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu hỗ trợ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

