import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Circle, 
  Link2, 
  FileText, 
  Play, 
  Upload, 
  HelpCircle, 
  MessageSquare,
  Plus,
  Sparkles,
  Layers
} from 'lucide-react';
import { CourseModule, Activity } from '../types';

interface CanvasModulesViewProps {
  onSelectActivity: (activityId: string) => void;
}

export const CanvasModulesView: React.FC<CanvasModulesViewProps> = ({ onSelectActivity }) => {
  const { activeCourse, addCourseActivity, activeRole } = useApp();

  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModulePrereq, setNewModulePrereq] = useState('');

  // Add Item to Module Modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<Activity['type']>('document');
  const [newItemSubtitle, setNewItemSubtitle] = useState('Xem trang');

  if (!activeCourse) {
    return (
      <div className="p-8 text-center text-slate-500">
        Vui lòng chọn một khóa học để xem nội dung học tập.
      </div>
    );
  }

  const modules = activeCourse.modules || [];

  const toggleModule = (id: string) => {
    setCollapsedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAll = () => {
    const nextState = !allCollapsed;
    setAllCollapsed(nextState);
    const newCollapsedMap: Record<string, boolean> = {};
    modules.forEach(m => {
      newCollapsedMap[m.id] = nextState;
    });
    setCollapsedModules(newCollapsedMap);
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4 text-slate-500 group-hover:text-[#0374b5]" />;
      case 'document':
        return <Link2 className="w-4 h-4 text-slate-500 group-hover:text-[#0374b5]" />;
      case 'assignment':
        return <Upload className="w-4 h-4 text-slate-500 group-hover:text-[#0374b5]" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-slate-500 group-hover:text-[#0374b5]" />;
      case 'forum':
        return <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-[#0374b5]" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500 group-hover:text-[#0374b5]" />;
    }
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    const newMod: CourseModule = {
      id: `mod-${Date.now()}`,
      courseId: activeCourse.id,
      title: newModuleTitle.trim(),
      order: modules.length + 1,
      description: newModulePrereq ? `Điều kiện đầu vào: ${newModulePrereq}` : '',
      activities: []
    };

    activeCourse.modules = [...modules, newMod];
    setNewModuleTitle('');
    setNewModulePrereq('');
    setIsAddModuleModalOpen(false);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !targetModuleId) return;

    addCourseActivity(activeCourse.id, targetModuleId, {
      title: newItemTitle.trim(),
      type: newItemType,
      isRequired: true,
      description: newItemSubtitle || 'Xem trang',
      durationMinutes: 15
    });

    setNewItemTitle('');
    setIsAddItemModalOpen(false);
  };

  return (
    <div className="flex-1 min-w-0 py-5 px-4 sm:px-6 lg:px-8 space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">
            Tổng cộng: <strong className="text-slate-900">{modules.length} mô-đun</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse/Expand All Button */}
          <button
            onClick={toggleAll}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
          >
            {allCollapsed ? 'Mở Rộng Tất Cả' : 'Thu Gọn Tất Cả'}
          </button>

          {/* Add Module Button */}
          <button
            onClick={() => setIsAddModuleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0374b5] hover:bg-[#025a8c] text-white rounded-md text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mô-đun</span>
          </button>
        </div>
      </div>

      {/* Modules List Container */}
      {modules.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center space-y-3 bg-slate-50/50 my-6">
          <div className="w-12 h-12 rounded-full bg-sky-100 text-[#0374b5] flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Khóa học chưa có mô-đun nội dung</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Bạn có thể bắt đầu thiết kế chương trình học bằng cách thêm mô-đun hoặc tải dữ liệu từ API.
            </p>
          </div>
          <button
            onClick={() => setIsAddModuleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0374b5] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#02629b] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mô-đun Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, index) => {
            const isCollapsed = collapsedModules[mod.id] ?? false;
            const activities = mod.activities || [];

            return (
              <div 
                key={mod.id} 
                className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-2xs"
              >
                {/* Module Header Bar (Canvas light grey style) */}
                <div 
                  onClick={() => toggleModule(mod.id)}
                  className="bg-[#f5f5f5] px-4 py-2.5 flex items-center justify-between cursor-pointer border-b border-slate-300 hover:bg-slate-200/70 transition-colors select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-600">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight truncate">
                        {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 font-normal">
                          {mod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full border border-slate-300 bg-white text-[11px] font-medium text-slate-700 shadow-2xs">
                      Hoàn thành tất cả các mục
                    </span>
                    <Lock className="w-4 h-4 text-slate-600" />
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetModuleId(mod.id);
                        setIsAddItemModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-slate-300/80 text-slate-600 text-xs font-bold flex items-center gap-1"
                      title="Thêm mục vào mô-đun"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Module Items Body */}
                {!isCollapsed && (
                  <div>
                    {/* Optional Section Subheader like in screenshot */}
                    <div className="bg-slate-50/70 px-4 py-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Tiết học & Hoạt động
                    </div>

                    {activities.length === 0 ? (
                      <div className="py-6 px-4 text-center text-xs text-slate-400">
                        Chưa có bài học nào trong mô-đun này.{' '}
                        <button
                          onClick={() => {
                            setTargetModuleId(mod.id);
                            setIsAddItemModalOpen(true);
                          }}
                          className="text-[#0374b5] font-bold hover:underline"
                        >
                          + Thêm mục ngay
                        </button>
                      </div>
                    ) : (
                      activities.map((act) => {
                        return (
                          <div
                            key={act.id}
                            onClick={() => onSelectActivity(act.id)}
                            className="px-4 py-3 flex items-center justify-between border-b border-slate-200 last:border-b-0 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="shrink-0">
                                {getActivityIcon(act.type)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-normal text-slate-800 group-hover:text-[#0374b5] group-hover:underline truncate">
                                  {act.title}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {act.description || (act.type === 'document' ? 'Xem trang' : act.type === 'video' ? 'Xem video' : 'Làm bài tập')}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 pl-3">
                              {act.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Footer unlock condition */}
                    <div className="bg-slate-50/40 px-4 py-2 border-t border-slate-100 text-right text-[11px] text-slate-400">
                      Sẽ mở khóa khi hoàn thành điều kiện
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Module Modal */}
      {isAddModuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
              Thêm Mô-đun mới
            </h3>
            <form onSubmit={handleCreateModule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Mô-đun *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điều kiện tiên quyết (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàn thành Bài 0"
                  value={newModulePrereq}
                  onChange={(e) => setNewModulePrereq(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModuleModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-sm"
                >
                  Thêm Mô-đun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item into Module Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
              Thêm bài học vào mô-đun
            </h3>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Loại hoạt động
                </label>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                >
                  <option value="document">Trang bài giảng / Tài liệu (Page)</option>
                  <option value="video">Video bài giảng tương tác</option>
                  <option value="assignment">Bài tập nộp (Assignment)</option>
                  <option value="quiz">Trắc nghiệm đánh giá (Quiz)</option>
                  <option value="forum">Chủ đề thảo luận (Discussion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên mục / Tiêu đề bài học *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khảo sát nhận thức ban đầu: Trí tuệ nhân tạo (AI)"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả phụ (Phụ đề hiển thị bên dưới)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xem trang, Video 10 phút, Điểm 10..."
                  value={newItemSubtitle}
                  onChange={(e) => setNewItemSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0374b5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0374b5] hover:bg-[#025a8c] rounded-lg shadow-sm"
                >
                  Thêm mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
