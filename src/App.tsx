import React, { useState } from 'react';
import { HomestayProvider, useHomestay } from './context/HomestayContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Sidebar, TabKey } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BookingsView } from './components/BookingsView';
import { RoomsView } from './components/RoomsView';
import { ServicesView } from './components/ServicesView';
import { PaymentsView } from './components/PaymentsView';
import { CustomersView } from './components/CustomersView';
import { ReportsView } from './components/ReportsView';
import { DatabaseView } from './components/DatabaseView';
import { CreateBookingModal } from './components/CreateBookingModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { AuthModal } from './components/AuthModal';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { Settings, Shield, User } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser } = useHomestay();

  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Booking modals
  const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);
  const [createBookingInitialData, setCreateBookingInitialData] = useState<{
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    roomCode?: string;
  } | undefined>(undefined);

  const [printInvoiceMaDon, setPrintInvoiceMaDon] = useState<string | null>(null);

  // Filter pass-through for Bookings tab
  const [bookingsInitialFilter, setBookingsInitialFilter] = useState<string>('ALL');

  // Mã đơn cần mở sẵn modal chi tiết khi chuyển sang tab Bookings (liên kết dữ liệu từ Khách hàng / Thanh toán / Dashboard / Rooms)
  const [bookingToOpen, setBookingToOpen] = useState<string | null>(null);

  const openBookingDetail = (maDon: string) => {
    setBookingsInitialFilter('ALL'); // tránh bộ lọc trạng thái làm ẩn đơn cần xem
    setBookingToOpen(maDon);
    setCurrentTab('bookings');
  };

  const handleNavigateToBookings = (statusFilter = 'ALL') => {
    setBookingsInitialFilter(statusFilter);
    setCurrentTab('bookings');
  };

  const handleOpenCreateBookingModal = (initialData?: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    roomCode?: string;
  }) => {
    setCreateBookingInitialData(initialData);
    setIsCreateBookingModalOpen(true);
  };

  const handleDownloadSQL = () => {
    setCurrentTab('database');
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans text-slate-800 overflow-hidden bg-[#f8fafc]">
      {/* Top Header */}
      <Header
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Fixed vertical sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full h-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateToBookings={handleNavigateToBookings}
              onOpenCreateBookingModal={handleOpenCreateBookingModal}
              onOpenChatbot={() => setIsChatbotOpen(true)}
              onDownloadSQL={handleDownloadSQL}
              onOpenBookingDetail={openBookingDetail}
            />
          )}

          {currentTab === 'bookings' && (
            <BookingsView
              initialStatusFilter={bookingsInitialFilter}
              onOpenCreateBookingModal={() => handleOpenCreateBookingModal()}
              onOpenBookingDetail={() => {}}
              openMaDon={bookingToOpen}
              onOpenedMaDon={() => setBookingToOpen(null)}
              onPrintInvoice={(maDon) => setPrintInvoiceMaDon(maDon)}
            />
          )}

          {currentTab === 'rooms' && (
            <RoomsView
              onOpenCreateBookingModal={(init) => handleOpenCreateBookingModal(init)}
              onOpenBookingDetail={openBookingDetail}
            />
          )}

          {currentTab === 'services' && <ServicesView />}

          {currentTab === 'payments' && (
            <PaymentsView
              onPrintInvoice={(maDon) => setPrintInvoiceMaDon(maDon)}
              onOpenBooking={openBookingDetail}
            />
          )}

          {currentTab === 'customers' && <CustomersView onOpenBooking={openBookingDetail} />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'database' && <DatabaseView />}

          {currentTab === 'settings' && (
            <div className="max-w-2xl bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  CÀI ĐẶT HỆ THỐNG HOMESTAY CHICSTAY
                </h2>
              </div>

              {/* User Account */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-500" />
                  Tài khoản người dùng hiện tại
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Họ và tên:</span>
                    <strong className="text-slate-900">{currentUser?.HoTen}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono text-slate-700">{currentUser?.Email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vai trò phân quyền:</span>
                    <span className="font-bold text-blue-700">{currentUser?.VaiTro} Homestay</span>
                  </div>
                </div>
              </div>

              {/* Business Policy Summary */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-500" />
                  Chính sách nghiệp vụ cốt lõi
                </h3>
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-2 text-slate-700">
                  <div>
                    <strong>• Tỷ lệ tiền cọc yêu cầu:</strong> 30% tiền phòng (làm tròn đến hàng nghìn đồng, không tính tiền dịch vụ).
                  </div>
                  <div>
                    <strong>• Thời hạn giữ cọc:</strong> Tối đa 12 giờ kể từ thời điểm tạo đơn.
                  </div>
                  <div>
                    <strong>• Hoàn tiền cọc khi hủy:</strong> Hủy trước mốc 14:00 ngày check-in ít nhất 48 giờ được hoàn 100% tiền cọc.
                  </div>
                  <div>
                    <strong>• Phụ thu giờ check-in / check-out:</strong> D008 (Check-in sớm: 150.000 ₫), D009 (Check-out muộn: 150.000 ₫).
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isCreateBookingModalOpen && (
        <CreateBookingModal
          initialCheckIn={createBookingInitialData?.checkIn}
          initialCheckOut={createBookingInitialData?.checkOut}
          initialGuests={createBookingInitialData?.guests}
          initialRoomCode={createBookingInitialData?.roomCode}
          onClose={() => setIsCreateBookingModalOpen(false)}
          onSuccess={() => {
            setCurrentTab('bookings');
          }}
        />
      )}

      {printInvoiceMaDon && (
        <InvoicePrintModal
          maDon={printInvoiceMaDon}
          onClose={() => setPrintInvoiceMaDon(null)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ChatbotDrawer
        isOpen={isChatbotOpen}
        onOpen={() => setIsChatbotOpen(true)}
        onClose={() => setIsChatbotOpen(false)}
        onNavigateToTab={(tab) => {
          setCurrentTab(tab);
          setIsChatbotOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <HomestayProvider>
        <MainLayout />
      </HomestayProvider>
    </ToastProvider>
  );
}
