import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Search, 
  User as UserIcon, 
  BookOpen, 
  Award, 
  Settings, 
  LogOut, 
  Globe, 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle,
  Clock,
  Menu,
  ChevronDown
} from 'lucide-react';
import { Role } from '../types';

export const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { 
    currentUser, 
    activeRole, 
    switchRole, 
    notifications, 
    markNotificationRead,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    setIsLoginModalOpen,
    navigateToCourse
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner / Micro bar */}
      <div className="bg-gradient-to-r from-hcmue-900 via-hcmue-800 to-hcmue-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide text-amber-300 flex items-center gap-1.5">
              <span>★</span> BỘ GIÁO DỤC VÀ ĐÀO TẠO
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-200 hidden sm:inline">Trường Đại học Sư phạm TP. Hồ Chí Minh (HCMUE)</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Role quick switcher */}
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5 border border-white/15 text-[11px]">
              <span className="text-slate-300 mr-1">Chế độ xem:</span>
              <button
                onClick={() => switchRole('student')}
                className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                  activeRole === 'student' 
                    ? 'bg-amber-400 text-slate-900 font-bold shadow-xs' 
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Sinh viên
              </button>
              <button
                onClick={() => switchRole('lecturer')}
                className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                  activeRole === 'lecturer' 
                    ? 'bg-amber-400 text-slate-900 font-bold shadow-xs' 
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Giảng viên
              </button>
              <button
                onClick={() => switchRole('admin')}
                className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                  activeRole === 'admin' 
                    ? 'bg-amber-400 text-slate-900 font-bold shadow-xs' 
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Quản trị viên
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-slate-200 hover:text-white cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <span>Tiếng Việt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo and Brand Title */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Emblem Logo */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-hcmue-700 to-hcmue-900 border-2 border-amber-400/80 flex items-center justify-center text-white shadow-md shadow-hcmue-900/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-extrabold text-hcmue-900 tracking-tight leading-none group-hover:text-hcmue-700 transition-colors">
                  VLE HCMUE
                </span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-hcmue-800 text-[10px] font-bold rounded uppercase tracking-wider">
                  Loop LMS 2.0
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium leading-tight mt-0.5 hidden sm:block">
                Hệ thống Quản lý Học tập Trực tuyến - ĐH Sư phạm TP.HCM
              </span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm môn học, bài giảng, giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-hcmue-500 focus:ring-2 focus:ring-hcmue-100 transition-all text-slate-700 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsUserMenuOpen(false);
              }}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 relative transition-colors focus:outline-none"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">Thông báo hệ thống</span>
                    {unreadNotifs.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        {unreadNotifs.length} mới
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-hcmue-600 hover:underline cursor-pointer">
                    Đánh dấu đã đọc tất cả
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.linkCourseId) {
                          navigateToCourse(notif.linkCourseId);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${
                        !notif.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        notif.type === 'deadline' 
                          ? 'bg-amber-100 text-amber-700' 
                          : notif.type === 'grade'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-hcmue-700'
                      }`}>
                        {notif.type === 'deadline' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-800">{notif.title}</p>
                          <span className="text-[10px] text-slate-400">{notif.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-xl hover:bg-slate-100 transition-all border border-slate-200/80 focus:outline-none"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {currentUser.code}
                </div>
              </div>
              
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-9 h-9 rounded-lg object-cover ring-2 ring-hcmue-600/20"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                  <p className="text-xs text-slate-500 font-medium">Đang đăng nhập với vai trò</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-hcmue-100 text-hcmue-800">
                      {activeRole === 'student' ? 'Sinh viên chính quy' : activeRole === 'lecturer' ? 'Giảng viên' : 'Quản trị viên VLE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 truncate">{currentUser.department}</p>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setCurrentView('profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    Hồ sơ cá nhân & Tài khoản
                  </button>

                  {activeRole === 'student' && (
                    <>
                      <button
                        onClick={() => {
                          setCurrentView('gradebook');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-slate-500" />
                        Sổ điểm & Kết quả học tập
                      </button>

                      <button
                        onClick={() => {
                          setCurrentView('certificates');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Award className="w-4 h-4 text-slate-500" />
                        Chứng chỉ & Giấy xác nhận
                      </button>
                    </>
                  )}

                  {activeRole === 'lecturer' && (
                    <button
                      onClick={() => {
                        setCurrentView('teacher-studio');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      Studio Quản lý Giảng dạy
                    </button>
                  )}

                  {activeRole === 'admin' && (
                    <button
                      onClick={() => {
                        setCurrentView('admin-panel');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      Trung tâm Quản trị VLE
                    </button>
                  )}

                  <hr className="my-1.5 border-slate-100" />

                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Đăng xuất / Chuyển tài khoản
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

