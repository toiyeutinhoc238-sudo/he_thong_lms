import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  X,
  Calendar as CalendarIcon
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  courseName?: string;
  type: 'assignment' | 'lecture' | 'quiz' | 'general';
}

export const CanvasCalendar: React.FC = () => {
  const { courses } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Lưu và nạp sự kiện người dùng tạo từ localStorage (Tuyệt đối không dùng dữ liệu ảo)
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('lms2_calendar_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Tự động đồng bộ các hạn bài tập thật từ các khóa học hiện có
  const courseEvents: CalendarEvent[] = [];
  courses.forEach(c => {
    (c.modules || []).forEach(m => {
      (m.activities || []).forEach(a => {
        if (a.dueDate) {
          courseEvents.push({
            id: `act-${a.id}`,
            title: a.title,
            date: a.dueDate.includes('T') ? a.dueDate.split('T')[0] : a.dueDate,
            time: '23:59',
            courseName: c.name,
            type: a.type === 'assignment' ? 'assignment' : a.type === 'quiz' ? 'quiz' : 'general'
          });
        }
      });
    });
  });

  const events = [...courseEvents, ...customEvents];

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: todayStr,
    time: '23:59',
    courseName: courses[0]?.name || 'Hệ thống LMS Nhóm 2',
    type: 'assignment' as const
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Thứ 2 = 0

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const item: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEvent.title.trim(),
      date: newEvent.date,
      time: newEvent.time,
      courseName: newEvent.courseName,
      type: newEvent.type
    };

    const updated = [...customEvents, item];
    setCustomEvents(updated);
    try {
      localStorage.setItem('lms2_calendar_events', JSON.stringify(updated));
    } catch {}

    setIsAddEventOpen(false);
    setNewEvent({
      title: '',
      date: todayStr,
      time: '23:59',
      courseName: courses[0]?.name || 'Hệ thống LMS Nhóm 2',
      type: 'assignment'
    });
  };

  const getEventsForDay = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === formattedDate);
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
      {/* Calendar Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0374b5] flex items-center justify-center shadow-xs">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {monthNames[month]}, Năm {year}
            </h1>
            <p className="text-xs text-slate-500">
              Lịch trình khóa học, hạn nộp bài tập & sự kiện học tập
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(2026, 10, 11))}
              className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors"
            >
              Hôm nay
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddEventOpen(true)}
            className="px-4 py-2 bg-[#0374b5] hover:bg-[#02629b] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sự kiện</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar + Events Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 pb-3 border-b border-slate-100">
            <div>T2</div>
            <div>T3</div>
            <div>T4</div>
            <div>T5</div>
            <div>T6</div>
            <div className="text-sky-600">T7</div>
            <div className="text-rose-500">CN</div>
          </div>

          {/* Days cells */}
          <div className="grid grid-cols-7 gap-1.5 pt-3">
            {/* Empty slots before month start */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-2xl bg-slate-50/50 p-2 opacity-30" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = day === 11 && month === 10 && year === 2026;
              const isSelected = selectedDate === dateKey;
              const dayEvents = getEventsForDay(day);

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`h-20 sm:h-24 rounded-2xl p-2 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#0374b5] bg-sky-50/40 ring-2 ring-sky-100'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-[#0374b5] text-white shadow-xs'
                        : isSelected
                        ? 'text-[#0374b5]'
                        : 'text-slate-700'
                    }`}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>

                  {/* Small event previews */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${
                          ev.type === 'assignment'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : ev.type === 'lecture'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Events Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card: Sự kiện ngày đã chọn */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0374b5]" />
                <span>Ngày: {selectedDate}</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {events.filter(e => e.date === selectedDate).length} sự kiện
              </span>
            </div>

            <div className="space-y-3">
              {events.filter(e => e.date === selectedDate).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Không có sự kiện hoặc hạn nộp nào trong ngày này.
                </div>
              ) : (
                events.filter(e => e.date === selectedDate).map(ev => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        ev.type === 'assignment' ? 'bg-rose-100 text-rose-800' :
                        ev.type === 'lecture' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ev.type === 'assignment' ? 'Bài tập' : ev.type === 'lecture' ? 'Lớp trực tuyến' : 'Kiểm tra'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {ev.time || 'Cả ngày'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {ev.title}
                    </h4>

                    {ev.courseName && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        {ev.courseName}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Tất cả sự kiện sắp tới */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Sự kiện sắp diễn ra</span>
            </h3>

            <div className="space-y-2.5">
              {events.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedDate(ev.date)}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-[#0374b5] hover:bg-sky-50/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 text-xs line-clamp-1">{ev.title}</div>
                    <div className="text-[10px] text-slate-500">{ev.courseName}</div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[11px] font-mono font-bold text-[#0374b5] block">{ev.date.split('-').slice(1).join('/')}</span>
                    <span className="text-[10px] text-slate-400">{ev.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thêm Sự Kiện */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Thêm Sự Kiện / Lịch Học Mới
              </h3>
              <button onClick={() => setIsAddEventOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề sự kiện / bài tập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nộp đồ án giữa kỳ"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày diễn ra
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giờ / Hạn chót
                  </label>
                  <input
                    type="text"
                    placeholder="23:59"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khóa học liên quan
                </label>
                <input
                  type="text"
                  placeholder="Tên môn học"
                  value={newEvent.courseName}
                  onChange={(e) => setNewEvent({ ...newEvent, courseName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Loại sự kiện
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                >
                  <option value="assignment">Hạn nộp bài tập</option>
                  <option value="lecture">Buổi học trực tuyến</option>
                  <option value="quiz">Bài thi / Kiểm tra trắc nghiệm</option>
                  <option value="general">Thông báo chung</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-bold shadow-xs"
                >
                  Lưu sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

