import React from 'react';
import { GraduationCap, ShieldCheck, Smartphone, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Institution */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-hcmue-700 text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-white font-extrabold text-sm tracking-tight">
                VLE HCMUE
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Cổng thông tin Đào tạo Trực tuyến (Virtual Learning Environment) của Trường Đại học Sư phạm Thành phố Hồ Chí Minh.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Chứng chỉ an toàn thông tin GDĐT</span>
            </div>
          </div>

          {/* Col 2: Liên hệ & Cơ sở */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              Thông tin liên hệ
            </h4>
            <div className="space-y-2 text-slate-400 text-[11px]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>280 An Dương Vương, Phường 4, Quận 5, TP.HCM</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>hotrovle@hcmue.edu.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>(028) 3835 2020 (Số máy lẻ 142)</span>
              </div>
            </div>
          </div>

          {/* Col 3: Cổng liên kết */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              Liên kết học thuật
            </h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>
                <a href="https://hcmue.edu.vn" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  Trang chủ HCMUE <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://online.hcmue.edu.vn" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  Cổng Thông tin Sinh viên <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://lib.hcmue.edu.vn" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  Thư viện điện tử HCMUE <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-amber-400 transition-colors">
                  Quy chế Đào tạo & Khung Chuẩn Đầu ra
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Tải ứng dụng VLE */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              Ứng dụng di động
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Tải ứng dụng <strong>HCMUE VLE</strong> để học tập mọi lúc, mọi nơi trên thiết bị di động của bạn.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 cursor-pointer transition-colors">
                <Smartphone className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Tải về trên</div>
                  <div className="text-xs font-bold text-white">Google Play & App Store</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © 2026 Trường Đại học Sư phạm Thành phố Hồ Chí Minh. Phát triển trên nền tảng Loop LMS.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Chính sách bảo mật</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Điều khoản sử dụng</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Hướng dẫn sinh viên</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

