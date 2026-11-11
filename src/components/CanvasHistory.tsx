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

  const historyItems = [
    {
      id: 'h-1',
      action: 'Đăng nhập Google OAuth 2.0 thành công',
      desc: `Xác thực danh tính tài khoản ${currentUser?.email || 'người dùng'} an toàn.`,
      time: '10 phút trước',
      type: 'auth',
      icon: LogIn,
      badge: 'Bảo mật',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'h-2',
      action: 'Cập nhật hồ sơ học viên',
      desc: `Đồng bộ thông tin: ${currentUser?.name} • Trường: ${currentUser?.school || 'LMS Nhóm 2'} • Lớp: ${currentUser?.className || 'Chính quy'}.`,
      time: '25 phút trước',
      type: 'profile',
      icon: ShieldCheck,
      badge: 'Hồ sơ',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'h-3',
      action: 'Xem nội dung Khóa học trực tuyến',
      desc: 'Truy cập chương trình học tập và xem danh mục tài nguyên số.',
      time: '1 giờ trước',
      type: 'course',
      icon: BookOpen,
      badge: 'Khóa học',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      actionLabel: 'Xem khóa học',
      onClick: () => {
        if (courses.length > 0) {
          navigateToCourse(courses[0].id);
        } else {
          setCurrentView('courses-list');
        }
      }
    },
    {
      id: 'h-4',
      action: 'Tham gia không gian học tập trực quan',
      desc: 'Kích hoạt môi trường thực hành Bài 1 - Bài 8 trên hệ thống LMS Nhóm 2.',
      time: 'Hôm nay',
      type: 'activity',
      icon: Award,
      badge: 'Học liệu',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  ];

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
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {historyItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-[#0374b5] text-[#0374b5] flex items-center justify-center shadow-xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-sky-50/40 border border-slate-200/80 hover:border-[#0374b5]/40 transition-all space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${item.color}`}>
                      {item.badge}
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

                  {item.onClick && (
                    <div className="pt-2">
                      <button
                        onClick={item.onClick}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0374b5] hover:underline"
                      >
                        <span>{item.actionLabel || 'Tiếp tục'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
