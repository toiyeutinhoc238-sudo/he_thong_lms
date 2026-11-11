import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Mail, 
  Send, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  User as UserIcon,
  Reply,
  X,
  Filter
} from 'lucide-react';

interface MessageThread {
  id: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  subject: string;
  snippet: string;
  content: string;
  time: string;
  isRead: boolean;
  courseTag?: string;
  replies?: {
    senderName: string;
    content: string;
    time: string;
    isMe: boolean;
  }[];
}

export const CanvasInbox: React.FC = () => {
  const { currentUser } = useApp();

  const [threads, setThreads] = useState<MessageThread[]>([
    {
      id: 'thread-1',
      sender: {
        name: 'TS. Nguyễn Văn Hùng',
        email: 'gv.hung@lms2.edu.vn',
        role: 'Giảng viên',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      subject: 'Nhắc nhở: Hạn chót nộp bài tập khảo sát tuần 1',
      snippet: 'Chào các bạn, thầy nhắc nhở các bạn nhớ hoàn thiện bài tập trắc nghiệm...',
      content: 'Chào các bạn học viên,\n\nThầy nhắc nhở các bạn nhớ hoàn thiện bài tập khảo sát tuần 1 trước 23:59 Chủ Nhật tuần này để hệ thống kịp thời tổng hợp điểm chuyên cần.\n\nNếu gặp bất kỳ khó khăn kỹ thuật nào, các bạn có thể phản hồi trực tiếp qua hộp thư này.\n\nThân mến,\nThầy Hùng.',
      time: '10:30 Hôm nay',
      isRead: false,
      courseTag: 'Trí tuệ Nhân tạo',
      replies: []
    },
    {
      id: 'thread-2',
      sender: {
        name: 'Ban Quản trị LMS Nhóm 2',
        email: 'admin@lms2.edu.vn',
        role: 'Quản trị viên'
      },
      subject: 'Chào mừng bạn tham gia hệ thống LMS Nhóm 2!',
      snippet: 'Tài khoản của bạn đã được xác thực an toàn qua Google OAuth 2.0...',
      content: 'Chào bạn,\n\nChúc mừng bạn đã kết nối thành công tài khoản Google với hệ thống Quản lý Học tập LMS Nhóm 2. Toàn bộ tiến trình bài học, kết quả bài thi và chứng chỉ sẽ được đồng bộ và lưu trữ an toàn trong suốt khóa đào tạo.\n\nChúc bạn có những trải nghiệm học tập hiệu quả!',
      time: '08:15 Hôm qua',
      isRead: true,
      courseTag: 'Hệ thống',
      replies: []
    }
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // New message form
  const [composeData, setComposeData] = useState({
    recipient: 'Giảng viên phụ trách',
    subject: '',
    content: ''
  });

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const filteredThreads = threads.filter(t => {
    const matchFilter = filter === 'all' || (filter === 'unread' && !t.isRead);
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || 
                        t.sender.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setThreads(prev => prev.map(t => t.id === id ? { ...t, isRead: true } : t));
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    const newReply = {
      senderName: currentUser.name || 'Tôi',
      content: replyText.trim(),
      time: 'Vừa xong',
      isMe: true
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          replies: [...(t.replies || []), newReply]
        };
      }
      return t;
    }));

    setReplyText('');
  };

  const handleSendNewMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.subject.trim() || !composeData.content.trim()) return;

    const newThread: MessageThread = {
      id: `thread-${Date.now()}`,
      sender: {
        name: currentUser.name || 'Tôi',
        email: currentUser.email || 'me@lms2.edu.vn',
        role: 'Tôi',
        avatar: currentUser.avatar
      },
      subject: composeData.subject.trim(),
      snippet: composeData.content.trim().slice(0, 70) + '...',
      content: composeData.content.trim(),
      time: 'Vừa xong',
      isRead: true,
      courseTag: 'Tin nhắn gửi',
      replies: []
    };

    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setIsComposeOpen(false);
    setComposeData({ recipient: 'Giảng viên phụ trách', subject: '', content: '' });
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Hộp Thư LMS Nhóm 2
            </h1>
            <p className="text-xs text-slate-500">
              Trao đổi học tập với Giảng viên & Ban Quản trị
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tin nhắn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0374b5] focus:bg-white"
            />
          </div>

          <button
            onClick={() => setIsComposeOpen(true)}
            className="px-4 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Soạn tin nhắn</span>
          </button>
        </div>
      </div>

      {/* Main 2-column Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Left Column: Threads list (5 cols) */}
        <div className="md:col-span-5 border-r border-slate-200/80 flex flex-col h-full min-h-0">
          {/* Filter Bar */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
            <span className="font-bold text-slate-500">Tất cả cuộc trò chuyện</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  filter === 'all' ? 'bg-[#0374b5] text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  filter === 'unread' ? 'bg-[#0374b5] text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Chưa đọc
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Không tìm thấy tin nhắn nào.
              </div>
            ) : (
              filteredThreads.map(t => {
                const isSelected = activeThread?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectThread(t.id)}
                    className={`p-4 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-sky-50/70 border-l-4 border-[#0374b5]'
                        : 'hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {t.sender.avatar ? (
                        <img src={t.sender.avatar} alt={t.sender.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm">
                          {t.sender.name.charAt(0)}
                        </div>
                      )}
                      {!t.isRead && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#0374b5] rounded-full ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs truncate ${!t.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                          {t.sender.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 pl-1">{t.time}</span>
                      </div>

                      <h4 className={`text-xs truncate ${!t.isRead ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {t.subject}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                        {t.snippet}
                      </p>

                      {t.courseTag && (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {t.courseTag}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Thread View (7 cols) */}
        <div className="md:col-span-7 flex flex-col h-full min-h-0 bg-white">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {activeThread.subject}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Từ: <strong className="text-slate-800">{activeThread.sender.name}</strong> ({activeThread.sender.role})</span>
                    <span>•</span>
                    <span>{activeThread.time}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setThreads(prev => prev.filter(t => t.id !== activeThread.id));
                    if (threads.length > 1) {
                      setActiveThreadId(threads[0].id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Xóa tin nhắn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Message Content & Replies */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {/* Main message */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {activeThread.content}
                </div>

                {/* Replies list */}
                {activeThread.replies && activeThread.replies.map((rep, idx) => (
                  <div key={idx} className="flex flex-col items-end space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold">{rep.senderName} • {rep.time}</span>
                    <div className="p-3.5 rounded-2xl bg-[#0374b5] text-white text-xs sm:text-sm max-w-[85%] whitespace-pre-line shadow-xs">
                      {rep.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập nội dung phản hồi nhanh..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5]"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2.5 bg-[#0374b5] hover:bg-[#02629b] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">
              Chọn một tin nhắn bên trái để xem nội dung
            </div>
          )}
        </div>
      </div>

      {/* Modal Soạn Tin Nhắn Mới */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Soạn Tin Nhắn Mới
              </h3>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNewMessage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Người nhận
                </label>
                <select
                  value={composeData.recipient}
                  onChange={(e) => setComposeData({ ...composeData, recipient: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0374b5] focus:bg-white"
                >
                  <option value="Giảng viên phụ trách">Giảng viên phụ trách môn học</option>
                  <option value="Ban Quản trị LMS Nhóm 2">Ban Quản trị LMS Nhóm 2</option>
                  <option value="Cố vấn học tập">Cố vấn học tập & Giáo vụ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề tin nhắn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xin giải đáp câu hỏi bài tập 2"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung tin nhắn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập nội dung trao đổi..."
                  value={composeData.content}
                  onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi tin nhắn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
