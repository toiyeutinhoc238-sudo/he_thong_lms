import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  History as HistoryIcon, 
  LogIn, 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';

export const CanvasHistory: React.FC = () => {
  const { currentUser, navigateToCourse, courses, setCurrentView } = useApp();

  // Nạp lịch sử thao tác thực tế từ localStorage (Tuyệt đối không dùng dữ liệu ảo)
  const [historyItems, setHistoryItems] = React.useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('lms2_history_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    if (currentUser?.email) {
      return [
        {
          id: 'h-login',
          action: 'Đăng nhập Google OAuth 2.0 thành công',
          desc: `Đã xác thực tài khoản ${currentUser.email} (${currentUser.name || 'Người dùng'}).`,
          time: 'Phiên hiện tại',
          type: 'auth',
          badge: 'Bảo mật',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
      ];
    }
    return [];
  });

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Lịch Sử Hoạt Động & Thao Tác
            </h1>
            <p className="text-xs text-slate-500">
              Nhật ký các lượt truy cập, bài học và hoạt động học tập gần đây của bạn
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          {historyItems.length} sự kiện
        </span>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {historyItems.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Chưa có lịch sử hoạt động</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Khi bạn đăng nhập, xem khóa học hoặc nộp bài tập, tiến trình sẽ được ghi lại tại đây.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {historyItems.map((item) => (
              <div key={item.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-[#0374b5] text-[#0374b5] flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-sky-50/40 border border-slate-200/80 hover:border-[#0374b5]/40 transition-all space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${item.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {item.badge || 'Hoạt động'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {item.action}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

