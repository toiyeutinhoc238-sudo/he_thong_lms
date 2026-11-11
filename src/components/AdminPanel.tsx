import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  Database, 
  Layers, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Activity as ActivityIcon,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import api from '../services/api';

export const AdminPanel: React.FC = () => {
  const { currentUser, courses, switchRole } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'system'>('overview');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    api.users.getAll()
      .then(res => {
        if (Array.isArray(res)) setUsersList(res);
      })
      .catch(() => {
        setUsersList([]);
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold uppercase tracking-wider">
              Trung tâm Quản trị Hệ thống • Loop LMS / VLE
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bảng Điều Phối Kỹ Thuật & Người Dùng
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Hệ thống Quản trị Đào tạo Trực tuyến • LMS Nhóm 2
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/10">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-xs font-bold text-emerald-300">Máy chủ sẵn sàng kết nối API</span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Người dùng đã tải</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{usersList.length}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Tài khoản từ API</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Khóa học trong hệ thống</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{courses.length}</h3>
            <span className="text-[11px] text-hcmue-700 font-medium">Học phần trực tuyến</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-hcmue-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">API Endpoint</p>
            <h3 className="text-base font-black text-slate-800 mt-1 truncate max-w-[140px]">
              {import.meta.env.VITE_API_BASE_URL || '/api'}
            </h3>
            <span className="text-[11px] text-amber-600 font-medium">Cấu hình .env</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Kiến trúc VLE</p>
            <h3 className="text-lg font-black text-emerald-600 mt-1">REST API</h3>
            <span className="text-[11px] text-slate-400 font-mono">Loop LMS Compatible</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ActivityIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Quản lý Tài khoản & Phân quyền
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'system'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cấu hình Nền tảng Loop LMS & API
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base">
                Danh sách Tài khoản Người dùng từ API
              </h3>
              <span className="text-xs text-slate-500">
                {usersList.length} tài khoản
              </span>
            </div>

            {loadingUsers ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Đang tải dữ liệu người dùng từ API...
              </div>
            ) : usersList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã số</th>
                      <th className="py-3 px-4">Họ và tên</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Đơn vị / Khoa</th>
                      <th className="py-3 px-4">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/20">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{u.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{u.name}</td>
                        <td className="py-3 px-4 text-slate-500">{u.email}</td>
                        <td className="py-3 px-4 text-slate-600">{u.department || u.dept}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chưa có dữ liệu người dùng từ API backend. Hãy kết nối endpoint <code>/users</code> hoặc đăng nhập tài khoản.
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4 max-w-2xl text-xs sm:text-sm text-slate-600">
            <h3 className="font-extrabold text-slate-800 text-base">
              Thông số Kỹ thuật & Cấu hình API VLE
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-medium text-slate-500">API Base URL:</span>
                <strong className="text-slate-800 font-mono">{import.meta.env.VITE_API_BASE_URL || '/api'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-medium text-slate-500">Tệp service API:</span>
                <strong className="text-slate-800 font-mono">src/services/api.ts</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-medium text-slate-500">Cơ chế xác thực (Auth):</span>
                <strong className="text-slate-800">Bearer Token (Header Authorization)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-slate-500">Hỗ trợ định dạng:</span>
                <strong className="text-slate-800 font-mono">application/json</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
