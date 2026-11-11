import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  Edit3, 
  Save, 
  X,
  AlertCircle
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { currentUser, activeRole, setIsLoginModalOpen, logout, updateProfile } = useApp();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    phone: currentUser?.phone || '',
    dateOfBirth: currentUser?.dateOfBirth || '',
    address: currentUser?.address || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Người dùng chưa đăng nhập Google
  if (!currentUser.id || !currentUser.email) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-md space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 text-[#0374b5] flex items-center justify-center shadow-inner">
            <UserIcon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-800">
              Chưa đăng nhập tài khoản
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Hồ sơ cá nhân và quyền hạn trên hệ thống <strong>LMS Nhóm 2</strong> được thiết lập tự động trực tiếp từ tài khoản Google của bạn.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white font-bold text-sm transition-all shadow-md active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập bằng tài khoản Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle save edit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      if (updateProfile) {
        await updateProfile(formData);
      }
      setSaveMessage('Cập nhật hồ sơ thành công!');
      setTimeout(() => {
        setIsEditOpen(false);
        setSaveMessage(null);
      }, 1000);
    } catch (err: any) {
      setSaveMessage(err.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel = activeRole === 'admin' 
    ? 'Quản trị viên Hệ thống' 
    : activeRole === 'lecturer' 
    ? 'Giảng viên' 
    : 'Học viên';

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {currentUser.avatar ? (
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-sky-100 shadow-md" 
          />
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0374b5] text-white flex items-center justify-center text-3xl font-extrabold ring-4 ring-sky-100 shadow-md">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0374b5] text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-[#0374b5]" />
            <span>{roleLabel}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            {currentUser.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-mono">
            Mã định danh: <strong>{currentUser.code || currentUser.email.split('@')[0].toUpperCase()}</strong>
          </p>

          <p className="text-xs text-slate-600 font-medium">
            Đơn vị: <strong>{currentUser.department || 'LMS Nhóm 2'}</strong>
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0 sm:self-start">
          <button
            onClick={() => {
              setFormData({
                phone: currentUser.phone || '',
                dateOfBirth: currentUser.dateOfBirth || '',
                address: currentUser.address || ''
              });
              setIsEditOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:border-[#0374b5] text-slate-700 hover:text-[#0374b5] bg-white text-xs font-bold transition-all shadow-2xs hover:bg-sky-50/50"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa hồ sơ</span>
          </button>

          <button
            onClick={() => logout && logout()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-base">
              Thông tin cá nhân
            </h3>
            <span className="text-[11px] text-slate-400">Dữ liệu tài khoản</span>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-start gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 text-xs block">Email tài khoản:</span>
                <strong className="text-slate-800 font-mono">{currentUser.email}</strong>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 text-xs block">Số điện thoại:</span>
                <span className={currentUser.phone ? "text-slate-800 font-mono font-bold" : "text-slate-400 italic"}>
                  {currentUser.phone || 'Chưa cập nhật'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 text-xs block">Ngày sinh:</span>
                <span className={currentUser.dateOfBirth ? "text-slate-800 font-bold" : "text-slate-400 italic"}>
                  {currentUser.dateOfBirth || 'Chưa cập nhật'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 text-xs block">Địa chỉ liên hệ:</span>
                <span className={currentUser.address ? "text-slate-800 font-bold" : "text-slate-400 italic"}>
                  {currentUser.address || 'Chưa cập nhật'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Linked Services */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-base">
              Xác thực liên kết
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Đã xác thực</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-center justify-between">
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-slate-800">Tài khoản học tập LMS Nhóm 2</div>
                <div className="text-slate-500 font-mono text-[11px]">{currentUser.email}</div>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Hoạt động
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-slate-800">Google OAuth 2.0</div>
                <div className="text-slate-500 text-[11px]">Đồng bộ dữ liệu tài khoản Google</div>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đã kết nối
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">
                Cập nhật thông tin cá nhân
              </h3>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                saveMessage.includes('thành công') 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {saveMessage.includes('thành công') ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{saveMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0912345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 15/08/2004"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ liên hệ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: TP. Hồ Chí Minh"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0374b5] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#0374b5] hover:bg-[#02629b] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
