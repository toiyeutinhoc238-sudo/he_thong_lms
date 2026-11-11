import React from 'react';

export type CourseNavTab = 
  | 'home'
  | 'discussions'
  | 'grades'
  | 'people'
  | 'files'
  | 'syllabus'
  | 'modules'
  | 'resources3d';

interface CanvasCourseNavProps {
  activeTab: CourseNavTab;
  onChangeTab: (tab: CourseNavTab) => void;
  isOpen: boolean;
}

export const CanvasCourseNav: React.FC<CanvasCourseNavProps> = ({
  activeTab,
  onChangeTab,
  isOpen
}) => {
  if (!isOpen) return null;

  const navItems: { id: CourseNavTab; label: string }[] = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'discussions', label: 'Thảo luận' },
    { id: 'grades', label: 'Số điểm' },
    { id: 'people', label: 'Thành viên' },
    { id: 'files', label: 'Các tập tin' },
    { id: 'syllabus', label: 'Lịch trình khóa học' },
    { id: 'modules', label: 'Nội dung học tập' },
    { id: 'resources3d', label: 'Kho học liệu 3D Noraclass' },
  ];

  return (
    <aside className="w-52 shrink-0 py-5 px-3 border-r border-slate-200 bg-white select-none hidden md:block">
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full text-left py-1.5 px-3 text-sm transition-colors rounded-r-md ${
                isActive
                  ? 'border-l-[3px] border-slate-900 font-bold text-slate-950 bg-slate-50/80 pl-2.5'
                  : 'text-[#0374b5] hover:underline hover:text-[#025686] pl-3 font-normal'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
