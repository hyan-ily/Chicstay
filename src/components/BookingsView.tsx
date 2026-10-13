import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Search,
  Plus,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  LogOut as CheckOutIcon,
  LogIn as CheckInIcon,
  CreditCard,
  QrCode,
  AlertTriangle,
  User,
  BedDouble,
  DollarSign,
  FileText,
  Trash2,
  Edit2,
  Calendar,
  X,
  Phone,
  Printer,
  RotateCcw
} from 'lucide-react';
import { useHomestay } from '../context/HomestayContext';
import { useToast } from '../context/ToastContext';
import { DonDatPhong, TrangThaiDon, PhuongThucThanhToan } from '../types';
import {
  formatVND,
  formatDate,
  formatDateTime,
  calculateNights,
  calculateDeposit,
  isBookingOverdue12Hours,
  isEligibleForRefund48Hours,
  generateVietQRUrl,
  canEditBookingServices,
  getServiceLockReason,
  isServiceAllowedAtStatus,
  getServiceMaxQuantity,
  getServiceLimitLabel,
  getUsedServiceQuantity,
  getMinDepositAmount,
  validateSettlementAmount,
  validateStayDates,
} from '../utils/helpers';

interface BookingsViewProps {
  initialStatusFilter?: string;
  onOpenCreateBookingModal: () => void;
  onOpenBookingDetail: (maDon: string) => void;
  onPrintInvoice: (maDon: string) => void;
  /** Mã đơn cần mở sẵn modal chi tiết (điều hướng từ tab Khách hàng / Thanh toán) */
  openMaDon?: string | null;
  onOpenedMaDon?: () => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  initialStatusFilter,
  onOpenCreateBookingModal,
  onOpenBookingDetail,
  onPrintInvoice,
  openMaDon,
  onOpenedMaDon,
}) => {
  const {
    bookings,
    rooms,
    customers,
    services,
    serviceItems,
    bankConfig,
    confirmDeposit,
    cancelBooking,
    processRefund,
    checkInBooking,
    noShowBooking,
    checkOutBooking,
    addServiceToBooking,
    updateServiceItemQuantity,
    removeServiceFromBooking,
    updateBooking,
    checkRoomAvailability,
  } = useHomestay();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');

  // Active Modals
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  // Luôn lấy bản mới nhất từ context để Tiền dịch vụ / Tổng tiền / Còn lại cập nhật ngay sau khi thêm, sửa, xóa dịch vụ
  const activeBookingForDetail: DonDatPhong | null = activeBookingId
    ? bookings.find((b) => b.MaDon === activeBookingId) ?? null
    : null;
  const setActiveBookingForDetail = (b: DonDatPhong | null) => setActiveBookingId(b ? b.MaDon : null);

  const [depositModalBooking, setDepositModalBooking] = useState<DonDatPhong | null>(null);
  const [depositMethod, setDepositMethod] = useState<PhuongThucThanhToan>('VietQR');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositTxnCode, setDepositTxnCode] = useState('');

  // Check-in modal
  const [checkInModalBooking, setCheckInModalBooking] = useState<DonDatPhong | null>(null);
  const [applyEarlyCheckInFee, setApplyEarlyCheckInFee] = useState(false);

  // Check-out modal
  const [checkOutModalBooking, setCheckOutModalBooking] = useState<DonDatPhong | null>(null);
  const [applyLateCheckOutFee, setApplyLateCheckOutFee] = useState(false);
  const [checkOutMethod, setCheckOutMethod] = useState<PhuongThucThanhToan>('VietQR');
  const [checkOutTxnCode, setCheckOutTxnCode] = useState('');

  // Cancel modal
  const [cancelModalBooking, setCancelModalBooking] = useState<DonDatPhong | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Refund modal
  const [refundModalBooking, setRefundModalBooking] = useState<DonDatPhong | null>(null);
  const [refundTxnCode, setRefundTxnCode] = useState('');

  // Add Service Modal
  const [addServiceModalBooking, setAddServiceModalBooking] = useState<DonDatPhong | null>(null);
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>('');
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);
  const [serviceNote, setServiceNote] = useState('');

  // Thông báo dùng Toast toàn cục (z-[100]) => luôn hiển thị TRÊN modal, không bị che như banner cũ
  const showAlert = (type: 'success' | 'error', message: string) => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  // ===== Mở sẵn chi tiết đơn khi được điều hướng từ tab khác =====
  useEffect(() => {
    if (openMaDon && bookings.some((b) => b.MaDon === openMaDon)) {
      setStatusFilter('ALL');
      setActiveBookingId(openMaDon);
      onOpenedMaDon?.();
    } else if (openMaDon) {
      toast.error(`Không tìm thấy đơn ${openMaDon}.`);
      onOpenedMaDon?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMaDon]);

  // ===== D008/D009 đã được thêm thủ công trong đơn? -> không hỏi phụ thu lần nữa =====
  const hasServiceInBooking = (maDon: string, maDV: string) =>
    serviceItems.some((x) => x.MaDon === maDon && x.MaDV === maDV);

  useEffect(() => {
    if (checkInModalBooking) setApplyEarlyCheckInFee(false);
  }, [checkInModalBooking?.MaDon]);

  // ===== Check-out: số tiền phải thu & số tiền thực nhận (>= 30%) =====
  const [checkOutAmount, setCheckOutAmount] = useState<number>(0);
  const coBooking = checkOutModalBooking
    ? bookings.find((x) => x.MaDon === checkOutModalBooking.MaDon) ?? checkOutModalBooking
    : null;
  const lateFeeApplies = !!coBooking && applyLateCheckOutFee && !hasServiceInBooking(coBooking.MaDon, 'D009');
  const checkOutDue = coBooking
    ? Math.max(0, coBooking.TongTien + (lateFeeApplies ? 150000 : 0) - coBooking.DaThu)
    : 0;
  useEffect(() => {
    setCheckOutAmount(checkOutDue);
  }, [checkOutDue, checkOutModalBooking?.MaDon]);
  useEffect(() => {
    if (checkOutModalBooking) setApplyLateCheckOutFee(false);
  }, [checkOutModalBooking?.MaDon]);
  const checkOutAmountErr = coBooking
    ? validateSettlementAmount({
        amount: checkOutAmount,
        tienPhong: coBooking.TienPhong,
        daThu: coBooking.DaThu,
        conLai: checkOutDue,
      })
    : null;

  // ===== Thêm dịch vụ: giới hạn số lượng =====
  const [qtyCapped, setQtyCapped] = useState(false);
  const svcBooking = addServiceModalBooking
    ? bookings.find((x) => x.MaDon === addServiceModalBooking.MaDon) ?? addServiceModalBooking
    : null;
  const svcCapacity = svcBooking
    ? rooms.find((r) => r.MaPhong === svcBooking.MaPhong)?.SucChua ?? svcBooking.SoKhach
    : 1;
  const svcMax = svcBooking && selectedServiceCode ? getServiceMaxQuantity(selectedServiceCode, svcCapacity, svcBooking.SoDem) : 0;
  const svcUsed = svcBooking && selectedServiceCode ? getUsedServiceQuantity(serviceItems, svcBooking.MaDon, selectedServiceCode) : 0;
  const svcRemaining = Math.max(0, svcMax - svcUsed);

  // ===== UC-1.3: Cập nhật đơn đặt phòng =====
  const [editBooking, setEditBooking] = useState<DonDatPhong | null>(null);
  const [editIn, setEditIn] = useState('');
  const [editOut, setEditOut] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editGuests, setEditGuests] = useState(1);
  const [editNote, setEditNote] = useState('');

  const openEditModal = (b: DonDatPhong) => {
    setEditBooking(b);
    setEditIn(b.NgayNhanPhong);
    setEditOut(b.NgayTraPhong);
    setEditRoom(b.MaPhong);
    setEditGuests(b.SoKhach);
    setEditNote(b.YeuCauDacBiet ?? '');
  };

  const editDateErr = editBooking ? validateStayDates(editIn, editOut, editIn === editBooking.NgayNhanPhong) : null;
  const editNights = editBooking && !editDateErr ? calculateNights(editIn, editOut) : 0;
  const editRoomObj = rooms.find((r) => r.MaPhong === editRoom);
  const roomOkForEdit = (r: { MaPhong: string; SucChua: number }) =>
    !!editBooking && !editDateErr && r.SucChua >= editGuests && checkRoomAvailability(r.MaPhong, editIn, editOut, editBooking.MaDon);
  const editNewRoomCost = editRoomObj ? editRoomObj.GiaPhong * editNights : 0;
  const editNewDeposit = calculateDeposit(editNewRoomCost, 0.3);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBooking) return;
    const FAIL = 'Không đủ điều kiện thay đổi';
    if (editDateErr) return toast.error(`${FAIL}: ${editDateErr}`);
    if (!editRoomObj) return toast.error(`${FAIL}: vui lòng chọn phòng.`);
    if (!Number.isInteger(editGuests) || editGuests < 1) return toast.error(`${FAIL}: số khách phải ≥ 1.`);
    if (editGuests > editRoomObj.SucChua) {
      return toast.error(`${FAIL}: phòng ${editRoomObj.MaPhong} chỉ chứa tối đa ${editRoomObj.SucChua} khách.`);
    }
    // Kiểm tra phòng + thời gian (loại trừ chính đơn đang sửa)
    if (!checkRoomAvailability(editRoom, editIn, editOut, editBooking.MaDon)) {
      return toast.error(`${FAIL}: phòng ${editRoom} đã có đơn khác trong khoảng ${formatDate(editIn)} → ${formatDate(editOut)}.`);
    }
    const res = updateBooking(editBooking.MaDon, {
      maPhong: editRoom,
      ngayNhanPhong: editIn,
      ngayTraPhong: editOut,
      soKhach: editGuests,
      yeuCauDacBiet: editNote.trim(),
    });
    if (res.success) {
      toast.success(`${res.message} Tiền phòng, tiền cọc yêu cầu và tổng tiền đã được tính lại.`);
      setEditBooking(null);
    } else {
      toast.error(res.message.startsWith(FAIL) ? res.message : `${FAIL}: ${res.message}`);
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.TrangThaiDon !== statusFilter) return false;
    if (selectedRoomFilter !== 'ALL' && b.MaPhong !== selectedRoomFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const customer = customers.find((c) => c.MaKH === b.MaKH);
      const matchId = b.MaDon.toLowerCase().includes(q);
      const matchRoom = b.MaPhong.toLowerCase().includes(q);
      const matchName = customer?.HoTen.toLowerCase().includes(q);
      const matchPhone = customer?.SoDienThoai.includes(q);
      if (!matchId && !matchRoom && !matchName && !matchPhone) return false;
    }

    return true;
  });

  // Open Deposit Modal with proper defaults
  const handleOpenDepositModal = (booking: DonDatPhong) => {
    setDepositModalBooking(booking);
    setDepositAmount(booking.TienCocYeuCau);
    setDepositMethod('VietQR');
    setDepositTxnCode('');
  };

  const handleConfirmDeposit = () => {
    if (!depositModalBooking) return;
    const minDep = getMinDepositAmount(depositModalBooking.TienPhong);
    const maxDep = depositModalBooking.TongTien - depositModalBooking.DaThu;
    if (!Number.isFinite(depositAmount) || depositAmount < minDep) {
      showAlert('error', `Số tiền thực nhận phải ≥ 30% tiền phòng (${formatVND(minDep)}).`);
      return;
    }
    if (depositAmount > maxDep) {
      showAlert('error', `Số tiền cọc không được vượt quá tổng tiền đơn (${formatVND(maxDep)}).`);
      return;
    }
    const res = confirmDeposit(
      depositModalBooking.MaDon,
      depositMethod,
      depositAmount,
      depositTxnCode
    );
    if (res.success) {
      showAlert('success', res.message);
      setDepositModalBooking(null);
      if (activeBookingForDetail?.MaDon === depositModalBooking.MaDon) {
        setActiveBookingForDetail(null);
      }
    } else {
      showAlert('error', res.message);
    }
  };

  // Check-in
  const handleConfirmCheckIn = () => {
    if (!checkInModalBooking) return;
    const res = checkInBooking(checkInModalBooking.MaDon, applyEarlyCheckInFee);
    if (res.success) {
      showAlert('success', res.message);
      setCheckInModalBooking(null);
      setActiveBookingForDetail(null);
    } else {
      showAlert('error', res.message);
    }
  };

  const handleConfirmNoShow = (maDon: string) => {
    if (!window.confirm('Xác nhận khách không đến nhận phòng (No-show)? Tiền cọc sẽ được giữ lại theo chính sách homestay.')) {
      return;
    }
    const res = noShowBooking(maDon);
    if (res.success) {
      showAlert('success', res.message);
      setCheckInModalBooking(null);
      setActiveBookingForDetail(null);
    } else {
      showAlert('error', res.message);
    }
  };

  // Check-out
  const handleConfirmCheckOut = () => {
    if (!checkOutModalBooking) return;
    if (checkOutAmountErr) {
      showAlert('error', checkOutAmountErr);
      return;
    }
    const res = checkOutBooking(
      checkOutModalBooking.MaDon,
      checkOutMethod,
      checkOutTxnCode,
      applyLateCheckOutFee,
      undefined,
      checkOutAmount
    );
    if (res.success) {
      showAlert('success', res.message);
      setCheckOutModalBooking(null);
      setActiveBookingForDetail(null);
      if (res.invoice) {
        onPrintInvoice(res.invoice.MaDon);
      }
    } else {
      showAlert('error', res.message);
    }
  };

  // Cancel
  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    const res = cancelBooking(cancelModalBooking.MaDon, cancelReason);
    if (res.success) {
      showAlert('success', res.message);
      setCancelModalBooking(null);
      setActiveBookingForDetail(null);
    } else {
      showAlert('error', res.message);
    }
  };

  // Refund
  const handleConfirmRefund = () => {
    if (!refundModalBooking) return;
    const res = processRefund(refundModalBooking.MaDon, refundTxnCode);
    if (res.success) {
      showAlert('success', res.message);
      setRefundModalBooking(null);
      setActiveBookingForDetail(null);
    } else {
      showAlert('error', res.message);
    }
  };

  // Xóa dòng dịch vụ khỏi đơn
  const handleRemoveService = (itemId: string, tenDichVu: string) => {
    if (!window.confirm(`Xóa dịch vụ "${tenDichVu}" khỏi đơn? Tổng tiền đơn sẽ được tính lại.`)) return;
    const res = removeServiceFromBooking(itemId);
    showAlert(res.success ? 'success' : 'error', res.message);
  };

  // Điều chỉnh số lượng dịch vụ
  const handleChangeServiceQty = (itemId: string, qty: number) => {
    const res = updateServiceItemQuantity(itemId, qty);
    if (!res.success) showAlert('error', res.message);
  };

  // Add Service
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addServiceModalBooking || !selectedServiceCode) return;
    const res = addServiceToBooking(
      addServiceModalBooking.MaDon,
      selectedServiceCode,
      serviceQuantity,
      serviceNote
    );
    if (res.success) {
      showAlert('success', res.message);
      setAddServiceModalBooking(null);
      setSelectedServiceCode('');
      setServiceQuantity(1);
      setServiceNote('');
    } else {
      showAlert('error', res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5 leading-tight">
            <CalendarCheck2 className="w-7 h-7 text-blue-600" />
            QUẢN LÝ ĐƠN ĐẶT PHÒNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi vòng đời đơn lưu trú: Chờ đặt cọc → Đã xác nhận → Đã check-in → Đã hoàn thành / Hủy
          </p>
        </div>

        <button
          onClick={onOpenCreateBookingModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>TẠO ĐƠN ĐẶT PHÒNG MỚI</span>
        </button>
      </div>

      {/* Filter Tabs matching business workflow */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
        {[
          { key: 'ALL', label: 'Tất cả đơn', count: bookings.length },
          { key: 'Chờ đặt cọc', label: 'Chờ đặt cọc', count: bookings.filter((b) => b.TrangThaiDon === 'Chờ đặt cọc').length },
          { key: 'Đã xác nhận', label: 'Đã xác nhận', count: bookings.filter((b) => b.TrangThaiDon === 'Đã xác nhận').length },
          { key: 'Đã check-in', label: 'Đang lưu trú', count: bookings.filter((b) => b.TrangThaiDon === 'Đã check-in').length },
          { key: 'Đã hoàn thành', label: 'Đã hoàn thành', count: bookings.filter((b) => b.TrangThaiDon === 'Đã hoàn thành').length },
          { key: 'Đã hủy', label: 'Đã hủy', count: bookings.filter((b) => b.TrangThaiDon === 'Đã hủy').length },
          { key: 'No-show', label: 'No-show', count: bookings.filter((b) => b.TrangThaiDon === 'No-show').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === tab.key ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar & Room Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn (DP...), Tên khách, Số điện thoại hoặc Số phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-xs outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white focus:border-blue-500 outline-hidden cursor-pointer"
          >
            <option value="ALL">Lọc theo tất cả các phòng</option>
            {rooms.map((r) => (
              <option key={r.MaPhong} value={r.MaPhong}>
                {r.MaPhong} - {r.TenPhong}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">MÃ ĐƠN</th>
                <th className="py-3 px-4">KHÁCH HÀNG</th>
                <th className="py-3 px-4">PHÒNG</th>
                <th className="py-3 px-4">LƯU TRÚ</th>
                <th className="py-3 px-4 text-right">TIỀN PHÒNG</th>
                <th className="py-3 px-4 text-right">DỊCH VỤ</th>
                <th className="py-3 px-4 text-right">TỔNG TIỀN</th>
                <th className="py-3 px-4 text-right">ĐÃ THU / CÒN LẠI</th>
                <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CalendarCheck2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy đơn đặt phòng nào phù hợp điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const customer = customers.find((c) => c.MaKH === b.MaKH);
                  const room = rooms.find((r) => r.MaPhong === b.MaPhong);
                  const isOverdue = b.TrangThaiDon === 'Chờ đặt cọc' && isBookingOverdue12Hours(b.ThoiGianTaoDon);
                  const refundEligible = b.TrangThaiDon === 'Đã hủy' && isEligibleForRefund48Hours(b.NgayNhanPhong) && b.DaThu > 0;

                  // Status badge style
                  let statusBadge = 'bg-slate-100 text-slate-700';
                  if (b.TrangThaiDon === 'Chờ đặt cọc') {
                    statusBadge = isOverdue
                      ? 'bg-rose-100 text-rose-800 font-bold'
                      : 'bg-amber-100 text-amber-800 font-bold';
                  } else if (b.TrangThaiDon === 'Đã xác nhận') {
                    statusBadge = 'bg-blue-100 text-blue-800 font-bold';
                  } else if (b.TrangThaiDon === 'Đã check-in') {
                    statusBadge = 'bg-purple-100 text-purple-800 font-bold';
                  } else if (b.TrangThaiDon === 'Đã hoàn thành') {
                    statusBadge = 'bg-emerald-100 text-emerald-800 font-bold';
                  } else if (b.TrangThaiDon === 'Đã hủy') {
                    statusBadge = 'bg-rose-100 text-rose-800 font-bold';
                  } else if (b.TrangThaiDon === 'No-show') {
                    statusBadge = 'bg-slate-200 text-slate-800 font-bold';
                  }

                  return (
                    <tr
                      key={b.MaDon}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setActiveBookingForDetail(b)}
                    >
                      {/* Mã Đơn */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {b.MaDon}
                        {isOverdue && (
                          <span className="block text-[10px] text-red-600 font-sans font-bold">
                            ⚠ Quá hạn cọc 12h
                          </span>
                        )}
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{customer?.HoTen || 'Khách lẻ'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 inline" /> {customer?.SoDienThoai || '--'}
                        </div>
                      </td>

                      {/* Phòng */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-sm">
                          {b.MaPhong}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[140px]">
                          {room?.LoaiPhong}
                        </div>
                      </td>

                      {/* Lưu trú */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {formatDate(b.NgayNhanPhong)} → {formatDate(b.NgayTraPhong)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {b.SoDem} đêm · {b.SoKhach} khách
                        </div>
                      </td>

                      {/* Tiền phòng */}
                      <td className="py-3 px-4 text-right tabular-nums text-slate-700 font-medium">
                        {formatVND(b.TienPhong)}
                      </td>

                      {/* Dịch vụ */}
                      <td className="py-3 px-4 text-right tabular-nums text-slate-700 font-medium">
                        {formatVND(b.TienDichVu)}
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">
                        {formatVND(b.TongTien)}
                      </td>

                      {/* Đã thu / Còn lại */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        <div className="text-emerald-700 font-bold">{formatVND(b.DaThu)}</div>
                        <div className="text-[11px] text-slate-400">
                          Còn lại: <strong className="text-rose-600">{formatVND(b.ConLai)}</strong>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] ${statusBadge}`}>
                          {b.TrangThaiDon}
                        </span>
                        {b.TrangThaiThanhToan && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {b.TrangThaiThanhToan}
                          </div>
                        )}
                      </td>

                      {/* Contextual Action Buttons */}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {b.TrangThaiDon === 'Chờ đặt cọc' && (
                            <button
                              onClick={() => handleOpenDepositModal(b)}
                              className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Ghi nhận đặt cọc 30%"
                            >
                              <CreditCard className="w-3 h-3" /> Thu cọc
                            </button>
                          )}

                          {b.TrangThaiDon === 'Đã xác nhận' && (
                            <button
                              onClick={() => setCheckInModalBooking(b)}
                              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Nhận phòng cho khách"
                            >
                              <CheckInIcon className="w-3 h-3" /> Check-in
                            </button>
                          )}

                          {b.TrangThaiDon === 'Đã check-in' && (
                            <button
                              onClick={() => setCheckOutModalBooking(b)}
                              className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Tất toán và trả phòng"
                            >
                              <CheckOutIcon className="w-3 h-3" /> Check-out
                            </button>
                          )}

                          {refundEligible && b.TrangThaiThanhToan !== 'Đã hoàn tiền' && (
                            <button
                              onClick={() => setRefundModalBooking(b)}
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Xử lý hoàn cọc theo chính sách"
                            >
                              <RotateCcw className="w-3 h-3" /> Hoàn cọc
                            </button>
                          )}

                          {b.TrangThaiDon === 'Đã hoàn thành' && (
                            <button
                              onClick={() => onPrintInvoice(b.MaDon)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Xem và in hóa đơn"
                            >
                              <Printer className="w-3 h-3" /> Hóa đơn
                            </button>
                          )}

                          {(b.TrangThaiDon === 'Chờ đặt cọc' || b.TrangThaiDon === 'Đã xác nhận') && (
                            <button
                              onClick={() => openEditModal(b)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Cập nhật đơn"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setActiveBookingForDetail(b)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: CHI TIẾT ĐƠN ĐẶT PHÒNG */}
      {/* ============================================================== */}
      {activeBookingForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">
                    CHI TIẾT ĐƠN {activeBookingForDetail.MaDon}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {activeBookingForDetail.TrangThaiDon}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tạo lúc: {formatDateTime(activeBookingForDetail.ThoiGianTaoDon)}
                </p>
              </div>
              <button
                onClick={() => setActiveBookingForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Khách hàng lưu trú</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {customers.find((c) => c.MaKH === activeBookingForDetail.MaKH)?.HoTen || 'Khách lẻ'}
                </div>
                <div className="text-slate-600 mt-0.5">
                  SĐT: {customers.find((c) => c.MaKH === activeBookingForDetail.MaKH)?.SoDienThoai} · CCCD: {customers.find((c) => c.MaKH === activeBookingForDetail.MaKH)?.CCCD || '--'}
                </div>
                <div className="text-slate-500 mt-0.5">
                  Địa chỉ: {customers.find((c) => c.MaKH === activeBookingForDetail.MaKH)?.DiaChi || 'Chưa cập nhật'}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Thông tin phòng & thời gian</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  Phòng {activeBookingForDetail.MaPhong} - {rooms.find((r) => r.MaPhong === activeBookingForDetail.MaPhong)?.TenPhong}
                </div>
                <div className="text-slate-600 mt-0.5">
                  {formatDate(activeBookingForDetail.NgayNhanPhong)} → {formatDate(activeBookingForDetail.NgayTraPhong)} ({activeBookingForDetail.SoDem} đêm, {activeBookingForDetail.SoKhach} khách)
                </div>
                {activeBookingForDetail.ThoiGianCheckInThucTe && (
                  <div className="text-purple-700 font-medium mt-0.5">
                    Check-in thực tế: {formatDateTime(activeBookingForDetail.ThoiGianCheckInThucTe)}
                  </div>
                )}
                {activeBookingForDetail.ThoiGianCheckOutThucTe && (
                  <div className="text-emerald-700 font-medium mt-0.5">
                    Check-out thực tế: {formatDateTime(activeBookingForDetail.ThoiGianCheckOutThucTe)}
                  </div>
                )}
              </div>
            </div>

            {activeBookingForDetail.YeuCauDacBiet && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                <strong>Ghi chú & Yêu cầu:</strong> {activeBookingForDetail.YeuCauDacBiet}
              </div>
            )}

            {/* Quản lý dịch vụ trong đơn */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Quản lý dịch vụ
                </h3>
                {canEditBookingServices(activeBookingForDetail.TrangThaiDon) && (
                  <button
                    onClick={() => setAddServiceModalBooking(activeBookingForDetail)}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm dịch vụ
                  </button>
                )}
              </div>

              {getServiceLockReason(activeBookingForDetail.TrangThaiDon) && (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                  {getServiceLockReason(activeBookingForDetail.TrangThaiDon)}
                </div>
              )}

              {/* Service list table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">TÊN DỊCH VỤ</th>
                      <th className="py-2.5 px-3">GIAI ĐOẠN</th>
                      <th className="py-2.5 px-3 text-center">SỐ LƯỢNG</th>
                      <th className="py-2.5 px-3 text-right">ĐƠN GIÁ CHỐT</th>
                      <th className="py-2.5 px-3 text-right">THÀNH TIỀN</th>
                      {canEditBookingServices(activeBookingForDetail.TrangThaiDon) && (
                        <th className="py-2.5 px-3 text-center">XÓA</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceItems.filter((s) => s.MaDon === activeBookingForDetail.MaDon).length === 0 ? (
                      <tr>
                        <td colSpan={canEditBookingServices(activeBookingForDetail.TrangThaiDon) ? 6 : 5} className="py-4 text-center text-slate-400">
                          Chưa có dịch vụ phát sinh nào trong đơn.
                        </td>
                      </tr>
                    ) : (
                      serviceItems
                        .filter((s) => s.MaDon === activeBookingForDetail.MaDon)
                        .map((item) => {
                          const maxQ = getServiceMaxQuantity(
                            item.MaDV,
                            rooms.find((r) => r.MaPhong === activeBookingForDetail.MaPhong)?.SucChua ?? activeBookingForDetail.SoKhach,
                            activeBookingForDetail.SoDem
                          );
                          const atMax = getUsedServiceQuantity(serviceItems, activeBookingForDetail.MaDon, item.MaDV) >= maxQ;
                          return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {item.TenDichVu}
                              {item.GhiChu && <span className="block text-[10px] text-slate-400">{item.GhiChu}</span>}
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                {item.GiaiDoan}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {!canEditBookingServices(activeBookingForDetail.TrangThaiDon) ? (
                                item.SoLuong
                              ) : (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleChangeServiceQty(item.id, item.SoLuong - 1)}
                                    disabled={item.SoLuong <= 1}
                                    className="w-5 h-5 rounded-sm bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold px-2">{item.SoLuong}</span>
                                  <button
                                    onClick={() => handleChangeServiceQty(item.id, item.SoLuong + 1)}
                                    disabled={atMax}
                                    title={atMax ? `Đã đạt giới hạn tối đa ${maxQ}` : undefined}
                                    className="w-5 h-5 rounded-sm bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums">{formatVND(item.DonGiaTaiThoiDiem)}</td>
                            <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900">{formatVND(item.ThanhTien)}</td>
                            {canEditBookingServices(activeBookingForDetail.TrangThaiDon) && (
                              <td className="py-2 px-3 text-center">
                                <button
                                  onClick={() => handleRemoveService(item.id, item.TenDichVu)}
                                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Xóa dịch vụ này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Tiền phòng ({activeBookingForDetail.SoDem} đêm):</span>
                <span className="font-semibold tabular-nums">{formatVND(activeBookingForDetail.TienPhong)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tiền dịch vụ phát sinh:</span>
                <span className="font-semibold tabular-nums">{formatVND(activeBookingForDetail.TienDichVu)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                <span>Tổng chi phí đơn hàng:</span>
                <span className="tabular-nums">{formatVND(activeBookingForDetail.TongTien)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                <span>Tiền cọc đã thu trước:</span>
                <span className="tabular-nums">{formatVND(activeBookingForDetail.DaThu)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold text-sm pt-1 border-t border-slate-200">
                <span>Số tiền còn lại cần thanh toán:</span>
                <span className="tabular-nums">{formatVND(activeBookingForDetail.ConLai)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                {activeBookingForDetail.TrangThaiDon === 'Đã hoàn thành' && (
                  <button
                    onClick={() => onPrintInvoice(activeBookingForDetail.MaDon)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Xuất & In hóa đơn
                  </button>
                )}

                {(activeBookingForDetail.TrangThaiDon === 'Chờ đặt cọc' || activeBookingForDetail.TrangThaiDon === 'Đã xác nhận') && (
                  <button
                    onClick={() => openEditModal(activeBookingForDetail)}
                    className="px-3.5 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" /> Cập nhật đơn
                  </button>
                )}

                {(activeBookingForDetail.TrangThaiDon === 'Chờ đặt cọc' || activeBookingForDetail.TrangThaiDon === 'Đã xác nhận') && (
                  <button
                    onClick={() => setCancelModalBooking(activeBookingForDetail)}
                    className="px-3.5 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Hủy đơn này
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeBookingForDetail.TrangThaiDon === 'Chờ đặt cọc' && (
                  <button
                    onClick={() => handleOpenDepositModal(activeBookingForDetail)}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" /> Thu tiền cọc (30%)
                  </button>
                )}

                {activeBookingForDetail.TrangThaiDon === 'Đã xác nhận' && (
                  <button
                    onClick={() => setCheckInModalBooking(activeBookingForDetail)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckInIcon className="w-4 h-4" /> Thực hiện Check-in
                  </button>
                )}

                {activeBookingForDetail.TrangThaiDon === 'Đã check-in' && (
                  <button
                    onClick={() => setCheckOutModalBooking(activeBookingForDetail)}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckOutIcon className="w-4 h-4" /> Check-out & Tất toán
                  </button>
                )}

                <button
                  onClick={() => setActiveBookingForDetail(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: GHI NHẬN ĐẶT CỌC & VIETQR */}
      {/* ============================================================== */}
      {depositModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">
                  XÁC NHẬN ĐẶT CỌC ({depositModalBooking.MaDon})
                </h3>
              </div>
              <button
                onClick={() => setDepositModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Tiền phòng ({depositModalBooking.SoDem} đêm):</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {formatVND(depositModalBooking.TienPhong)}
                </span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Tiền cọc yêu cầu (30% làm tròn):</span>
                <span className="tabular-nums">
                  {formatVND(depositModalBooking.TienCocYeuCau)}
                </span>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Phương thức nhận tiền cọc:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDepositMethod('VietQR')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    depositMethod === 'VietQR'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Chuyển khoản VietQR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDepositMethod('Tiền mặt')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    depositMethod === 'Tiền mặt'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Tiền mặt trực tiếp</span>
                </button>
              </div>
            </div>

            {/* Live VietQR Code Generation */}
            {depositMethod === 'VietQR' && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-center space-y-2">
                <span className="text-[11px] font-bold text-blue-900 block">
                  MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG
                </span>
                <div className="flex justify-center">
                  <img
                    src={generateVietQRUrl(
                      bankConfig.bankCode,
                      bankConfig.accountNo,
                      bankConfig.accountName,
                      depositAmount,
                      `${depositModalBooking.MaDon} COC 30PT`
                    )}
                    alt="VietQR Code"
                    className="w-44 h-44 object-contain rounded-lg border border-white shadow-xs bg-white p-1"
                  />
                </div>
                <div className="text-[11px] text-slate-600">
                  <strong>{bankConfig.bankName}</strong> <br />
                  Số TK: <strong className="text-blue-700 font-mono">{bankConfig.accountNo}</strong> · Chủ TK: <strong>{bankConfig.accountName}</strong>
                </div>
              </div>
            )}

            {/* Input số tiền & mã giao dịch */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Số tiền thực nhận (≥ 30%):
                </label>
                <input
                  type="number"
                  min={getMinDepositAmount(depositModalBooking.TienPhong)}
                  max={depositModalBooking.TongTien - depositModalBooking.DaThu}
                  step={1000}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-bold text-slate-800 ${
                    depositAmount < getMinDepositAmount(depositModalBooking.TienPhong) ||
                    depositAmount > depositModalBooking.TongTien - depositModalBooking.DaThu
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-slate-300'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tối thiểu {formatVND(getMinDepositAmount(depositModalBooking.TienPhong))} (30% tiền phòng) · tối đa {formatVND(depositModalBooking.TongTien - depositModalBooking.DaThu)}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mã giao dịch ngân hàng / biên nhận (nếu có):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: FT2610110091..."
                  value={depositTxnCode}
                  onChange={(e) => setDepositTxnCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDepositModalBooking(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeposit}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Xác nhận đã nhận đủ cọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: CHECK-IN & PHỤ THU D008 */}
      {/* ============================================================== */}
      {checkInModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CheckInIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  CHECK-IN ({checkInModalBooking.MaDon})
                </h3>
              </div>
              <button
                onClick={() => setCheckInModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Xác nhận khách đã có mặt tại homestay và nhận phòng{' '}
                <strong className="text-slate-900">
                  {checkInModalBooking.MaPhong}
                </strong>
                .
              </p>

              {/* Phụ thu D008 nếu check-in sớm */}
              {hasServiceInBooking(checkInModalBooking.MaDon, 'D008') ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                  Đơn này đã có phụ thu Check-in sớm (D008) do quản lý thêm trước đó — không áp dụng lại.
                </div>
              ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyEarlyCheckInFee}
                    onChange={(e) => setApplyEarlyCheckInFee(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <div className="text-xs">
                    <strong className="text-amber-950 block">
                      Áp dụng phụ thu Check-in sớm (D008)
                    </strong>
                    <span className="text-amber-800 text-[11px]">
                      Khách nhận phòng trước 14:00 (+150.000 ₫ cộng vào chi phí đơn)
                    </span>
                  </div>
                </label>
              </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleConfirmNoShow(checkInModalBooking.MaDon)}
                className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Khách không đến (No-show)?
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckInModalBooking(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCheckIn}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Xác nhận Check-in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: CHECK-OUT, TẤT TOÁN & PHỤ THU D009 */}
      {/* ============================================================== */}
      {checkOutModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CheckOutIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  TẤT TOÁN & CHECK-OUT ({checkOutModalBooking.MaDon})
                </h3>
              </div>
              <button
                onClick={() => setCheckOutModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Phụ thu D009 check-out muộn (ẩn nếu đơn đã có D009 thêm thủ công) */}
            {hasServiceInBooking(checkOutModalBooking.MaDon, 'D009') ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                Đơn này đã có phụ thu Trả phòng muộn (D009) do quản lý thêm trước đó — không áp dụng lại.
              </div>
            ) : (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyLateCheckOutFee}
                  onChange={(e) => setApplyLateCheckOutFee(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600"
                />
                <div className="text-xs">
                  <strong className="text-purple-950 block">
                    Áp dụng phụ thu Trả phòng muộn (D009)
                  </strong>
                  <span className="text-purple-800 text-[11px]">
                    Khách trả phòng sau 12:00 (+150.000 ₫ cộng vào hóa đơn tất toán)
                  </span>
                </div>
              </label>
            </div>
            )}

            {/* Chi tiết tài chính */}
            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Tiền phòng:</span>
                <span className="font-semibold tabular-nums">{formatVND(checkOutModalBooking.TienPhong)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tiền dịch vụ hiện tại:</span>
                <span className="font-semibold tabular-nums">{formatVND(checkOutModalBooking.TienDichVu)}</span>
              </div>
              {lateFeeApplies && (
                <div className="flex justify-between text-purple-700 font-semibold">
                  <span>Phụ thu trả muộn D009:</span>
                  <span className="tabular-nums">+150.000 ₫</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                <span>Tổng chi phí cần thanh toán:</span>
                <span className="tabular-nums">
                  {formatVND(
                    checkOutModalBooking.TienPhong +
                      checkOutModalBooking.TienDichVu +
                      (lateFeeApplies ? 150000 : 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Đã thanh toán trước (Tiền cọc):</span>
                <span className="tabular-nums">-{formatVND(checkOutModalBooking.DaThu)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-extrabold text-sm border-t border-slate-200 pt-1">
                <span>Số tiền còn lại phải thu:</span>
                <span className="tabular-nums">
                  {formatVND(checkOutDue)}
                </span>
              </div>
            </div>

            {/* Phương thức thanh toán khi checkout */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Hình thức thanh toán nốt:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCheckOutMethod('VietQR')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    checkOutMethod === 'VietQR'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>VietQR QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckOutMethod('Tiền mặt')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    checkOutMethod === 'Tiền mặt'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Tiền mặt</span>
                </button>
              </div>
            </div>

            {checkOutMethod === 'VietQR' && (
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-center space-y-2">
                <span className="text-[11px] font-bold text-purple-900 block">
                  QUÉT QR ĐỂ TẤT TOÁN CHECK-OUT
                </span>
                <div className="flex justify-center">
                  <img
                    src={generateVietQRUrl(
                      bankConfig.bankCode,
                      bankConfig.accountNo,
                      bankConfig.accountName,
                      checkOutDue,
                      `${checkOutModalBooking.MaDon} TAT TOAN`
                    )}
                    alt="VietQR Check-out"
                    className="w-44 h-44 object-contain rounded-lg border border-white shadow-xs bg-white p-1"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Số tiền thực nhận (≥ 30%):
              </label>
              <input
                type="number"
                min={checkOutDue}
                max={checkOutDue}
                step={1000}
                value={checkOutAmount}
                onChange={(e) => setCheckOutAmount(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-bold text-slate-800 ${
                  checkOutAmountErr ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                }`}
              />
              {checkOutAmountErr ? (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{checkOutAmountErr}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  Phải thu đủ {formatVND(checkOutDue)}; tổng đã thu luôn ≥ 30% tiền phòng ({formatVND(getMinDepositAmount(coBooking?.TienPhong ?? 0))}).
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mã giao dịch ngân hàng (nếu có):
              </label>
              <input
                type="text"
                placeholder="Ví dụ: MB2610091..."
                value={checkOutTxnCode}
                onChange={(e) => setCheckOutTxnCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCheckOutModalBooking(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckOut}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Xác nhận đã thu đủ & Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: HỦY ĐƠN ĐẶT PHÒNG & KIỂM TRA CHÍNH SÁCH 48H */}
      {/* ============================================================== */}
      {cancelModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  HỦY ĐƠN {cancelModalBooking.MaDon}
                </h3>
              </div>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2.5">
              {/* Kiểm tra điều kiện 48h */}
              {cancelModalBooking.DaThu > 0 ? (
                isEligibleForRefund48Hours(cancelModalBooking.NgayNhanPhong) ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                    <strong className="block mb-0.5">✓ ĐỦ ĐIỀU KIỆN HOÀN 100% CỌC</strong>
                    Yêu cầu hủy trước 14:00 ngày check-in ít nhất 48 giờ. Số tiền cần hoàn cho khách: <strong>{formatVND(cancelModalBooking.DaThu)}</strong>.
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                    <strong className="block mb-0.5">✕ KHÔNG HOÀN CỌC THEO CHÍNH SÁCH</strong>
                    Hủy dưới 48 giờ so với mốc check-in 14:00. Homestay giữ lại khoản cọc <strong>{formatVND(cancelModalBooking.DaThu)}</strong>.
                  </div>
                )
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                  Đơn chưa thu cọc. Hủy đơn sẽ giải phóng phòng về trạng thái &quot;Sẵn sàng&quot; ngay lập tức.
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Lý do hủy đơn:
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Khách thay đổi lịch trình, quá hạn cọc 12h..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Không hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Xác nhận Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: XỬ LÝ HOÀN CỌC */}
      {/* ============================================================== */}
      {refundModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  XỬ LÝ HOÀN CỌC ({refundModalBooking.MaDon})
                </h3>
              </div>
              <button
                onClick={() => setRefundModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                <p>
                  Đơn đã hủy trước ít nhất 48 giờ. Quản lý thực hiện chuyển khoản hoàn tiền thủ công cho khách ngoài hệ thống:
                </p>
                <div className="text-base font-extrabold text-emerald-900 mt-1">
                  Số tiền hoàn: {formatVND(refundModalBooking.DaThu)}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mã giao dịch hoàn tiền (nếu có):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: REF26101100..."
                  value={refundTxnCode}
                  onChange={(e) => setRefundTxnCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRefundModalBooking(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Xác nhận &quot;Đã hoàn&quot;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6B: CẬP NHẬT ĐƠN ĐẶT PHÒNG (UC-1.3)                       */}
      {/* ============================================================== */}
      {editBooking && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                CẬP NHẬT ĐƠN ({editBooking.MaDon})
              </h3>
              <button onClick={() => setEditBooking(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày nhận phòng:</label>
                  <input
                    type="date"
                    required
                    min={editBooking.NgayNhanPhong < new Date().toISOString().split('T')[0] ? editBooking.NgayNhanPhong : new Date().toISOString().split('T')[0]}
                    value={editIn}
                    onChange={(e) => {
                      setEditIn(e.target.value);
                      if (editOut && e.target.value >= editOut) toast.warning('Ngày nhận phòng phải trước ngày trả phòng.');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày trả phòng:</label>
                  <input
                    type="date"
                    required
                    min={editIn}
                    value={editOut}
                    onChange={(e) => {
                      setEditOut(e.target.value);
                      if (editIn && e.target.value <= editIn) toast.warning('Ngày trả phòng phải sau ngày nhận phòng.');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              {editDateErr && <p className="text-[11px] font-semibold text-rose-600">{editDateErr}</p>}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số khách:</label>
                <input
                  type="number"
                  min={1}
                  max={editRoomObj?.SucChua ?? 20}
                  value={editGuests}
                  onChange={(e) => setEditGuests(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phòng (chỉ phòng đủ chỗ & còn trống mới chọn được):</label>
                <select
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer"
                >
                  {rooms.map((r) => {
                    const ok = r.MaPhong === editRoom || roomOkForEdit(r);
                    return (
                      <option key={r.MaPhong} value={r.MaPhong} disabled={!ok}>
                        {r.MaPhong} - {r.TenPhong} ({r.SucChua} khách · {formatVND(r.GiaPhong)}/đêm){ok ? '' : ' — không khả dụng'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Yêu cầu đặc biệt:</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {editRoomObj && editNights > 0 && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1 text-[11px] text-blue-900">
                  <div className="flex justify-between"><span>Tiền phòng mới ({editNights} đêm):</span><strong>{formatVND(editNewRoomCost)}</strong></div>
                  <div className="flex justify-between"><span>Cọc yêu cầu mới (30%):</span><strong>{formatVND(editNewDeposit)}</strong></div>
                  <div className="flex justify-between"><span>Tổng tiền mới (+ dịch vụ):</span><strong>{formatVND(editNewRoomCost + editBooking.TienDichVu)}</strong></div>
                  <div className="flex justify-between text-slate-600"><span>Tiền phòng hiện tại:</span><span>{formatVND(editBooking.TienPhong)}</span></div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setEditBooking(null)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 7: THÊM DỊCH VỤ VÀO ĐƠN */}
      {/* ============================================================== */}
      {addServiceModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                THÊM DỊCH VỤ VÀO ĐƠN ({addServiceModalBooking.MaDon})
              </h3>
              <button
                onClick={() => setAddServiceModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Chọn dịch vụ đang hoạt động:
                </label>
                <select
                  value={selectedServiceCode}
                  onChange={(e) => {
                    setSelectedServiceCode(e.target.value);
                    setServiceQuantity(1);
                    setQtyCapped(false);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white cursor-pointer"
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {services
                    .filter((s) => s.TrangThai === 'Đang hoạt động' && isServiceAllowedAtStatus(s.ThoiDiemApDung, addServiceModalBooking.TrangThaiDon))
                    .map((s) => (
                      <option key={s.MaDV} value={s.MaDV}>
                        {s.TenDichVu} ({formatVND(s.DonGia)} / {s.DonViTinh}) [{s.ThoiDiemApDung}]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Số lượng (nguyên &gt; 0):
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedServiceCode ? Math.max(1, svcRemaining) : undefined}
                  step={1}
                  value={serviceQuantity}
                  disabled={!!selectedServiceCode && svcRemaining <= 0}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value, 10) || 1;
                    // Tự động cap ở mức tối đa còn lại + báo đỏ
                    if (selectedServiceCode && svcRemaining > 0 && raw > svcRemaining) {
                      setServiceQuantity(svcRemaining);
                      setQtyCapped(true);
                    } else {
                      setServiceQuantity(Math.max(1, raw));
                      setQtyCapped(false);
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-bold disabled:bg-slate-100 ${
                    qtyCapped || (!!selectedServiceCode && svcRemaining <= 0) ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {selectedServiceCode && svcBooking && (
                  <p className={`text-[11px] mt-1 font-semibold ${qtyCapped || svcRemaining <= 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {svcRemaining <= 0
                      ? `Đã đạt giới hạn tối đa ${svcMax} cho dịch vụ này trong đơn — không thể thêm.`
                      : qtyCapped
                      ? `Vượt giới hạn! Đã tự động đặt về mức tối đa còn lại: ${svcRemaining}.`
                      : `Giới hạn: ${getServiceLimitLabel(selectedServiceCode, svcCapacity, svcBooking.SoDem)} · đã có ${svcUsed} · còn thêm được ${svcRemaining}.`}
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ghi chú yêu cầu dịch vụ (nếu có):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giặt đồ tối, xe giao lúc 8h..."
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="p-2.5 bg-blue-50 rounded-lg text-[11px] text-blue-800">
                ℹ Đơn giá chốt cứng tại thời điểm thêm. Tiền dịch vụ không tính vào khoản cọc 30% và được cộng vào tổng tiền khi check-out.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddServiceModalBooking(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedServiceCode || svcRemaining <= 0}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Lưu Dịch Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
