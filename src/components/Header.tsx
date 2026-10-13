import React from 'react';
import { 
  MessageSquare, 
  Bell, 
  User, 
  LogOut, 
  ShieldCheck, 
  Menu
} from 'lucide-react';
import { useHomestay } from '../context/HomestayContext';

interface HeaderProps {
  onOpenChatbot: () => void;
  onToggleSidebar?: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenChatbot,
  onToggleSidebar,
  onOpenAuthModal,
}) => {
  const { currentUser, logout, bookings, rooms } = useHomestay();

  // Pending alerts count
  const pendingDepositOverdue = bookings.filter(
    (b) => b.TrangThaiDon === 'Chờ đặt cọc'
  ).length;
  const roomsCleaning = rooms.filter((r) => r.TrangThaiPhong === 'Chờ dọn phòng').length;
  const totalAlerts = pendingDepositOverdue + roomsCleaning;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-6 h-16 flex items-center justify-between shrink-0 shadow-xs">
      {/* Left: Mobile hamburger + Brand Title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
            C
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-wider text-slate-900 uppercase">
              CHICSTAY
            </span>
          </div>
        </div>
      </div>

      {/* Chatbot hỗ trợ quản lý */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenChatbot}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-800 hover:bg-gray-50 shadow-xs transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Chatbot hỗ trợ quản lý</span>
        </button>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Alerts / Bell */}
        <div className="relative">
          <button
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
            title={`${totalAlerts} việc cần xử lý`}
          >
            <Bell className="w-5 h-5 text-slate-500" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalAlerts}
              </span>
            )}
          </button>
        </div>

        {/* User Card */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser.HoTen.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.HoTen}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600 inline" />
                {currentUser.VaiTro} · Gói Quản lý
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-1"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            <User className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};
