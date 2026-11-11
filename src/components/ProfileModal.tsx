import React from 'react';
import { useApp } from '../context/AppContext';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { currentUser, activeRole, setCurrentView } = useApp();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-hcmue-100 shadow-md" 
        />

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hcmue-50 text-hcmue-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-hcmue-600" />
            <span>{activeRole === 'student' ? 'Sinh viên chính quy' : activeRole === 'lecturer' ? 'Cán bộ Giảng viên' : 'Quản trị viên VLE'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            {currentUser.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-mono">
            Mã số: <strong>{currentUser.code}</strong> • {currentUser.department}
          </p>

          <p className="text-xs text-slate-600 font-medium">
            {currentUser.classOrPosition}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
            Thông tin cá nhân & Liên hệ
          </h3>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Email: <strong className="text-slate-800 font-mono">{currentUser.email}</strong></span>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Điện thoại: <strong className="text-slate-800 font-mono">{currentUser.phone || '0903 123 456'}</strong></span>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Ngày sinh: <strong className="text-slate-800">{currentUser.dateOfBirth || '15/08/2004'}</strong></span>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Địa chỉ: <strong className="text-slate-800">{currentUser.address || '280 An Dương Vương, Q.5, TP.HCM'}</strong></span>
            </div>
          </div>
        </div>

        {/* Academic Linked Services */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
            Tài khoản liên kết trường học
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-bold text-slate-800">Microsoft Office 365 HCMUE</div>
                <div className="text-slate-500 font-mono text-[11px]">{currentUser.email}</div>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-bold text-slate-800">Google Workspace for Education</div>
                <div className="text-slate-500 text-[11px]">Đồng bộ Google Classroom & Drive</div>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

