import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Edit2,
  FileText,
  UserCheck,
  AlertCircle,
  X,
  History
} from 'lucide-react';
import { useHomestay } from '../context/HomestayContext';
import { useToast } from '../context/ToastContext';
import { KhachHang } from '../types';
import { formatVND, formatDate } from '../utils/helpers';

interface CustomersViewProps {
  /** Điều hướng sang tab Bookings và mở chi tiết đơn */
  onOpenBooking?: (maDon: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onOpenBooking }) => {
  const toast = useToast();
  const { customers, bookings, createCustomer, updateCustomer } = useHomestay();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<KhachHang | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<KhachHang | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCccd, setFormCccd] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNote, setFormNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fail = (msg: string) => {
    setErrorMessage(msg);
    toast.error(msg);
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.HoTen.toLowerCase().includes(q) ||
      c.MaKH.toLowerCase().includes(q) ||
      c.SoDienThoai.includes(q) ||
      (c.CCCD ?? '').includes(q)
    );
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormPhone('');
    setFormCccd('');
    setFormEmail('');
    setFormAddress('');
    setFormNote('');
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: KhachHang) => {
    setEditingCustomer(c);
    setFormName(c.HoTen);
    setFormPhone(c.SoDienThoai);
    setFormCccd(c.CCCD ?? '');
    setFormEmail(c.Email || '');
    setFormAddress(c.DiaChi || '');
    setFormNote(c.GhiChu || '');
    setErrorMessage('');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formName.trim() || !formPhone.trim()) {
      fail('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    const res = createCustomer({
      HoTen: formName.trim(),
      SoDienThoai: formPhone.trim(),
      CCCD: formCccd.trim() || undefined,
      Email: formEmail.trim() || undefined,
      DiaChi: formAddress.trim() || undefined,
      GhiChu: formNote.trim() || undefined,
    });

    if (res.success) {
      toast.success(res.message || 'Đã thêm khách hàng mới.');
      setIsAddModalOpen(false);
    } else {
      fail(res.message);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setErrorMessage('');
    if (!formName.trim() || !formPhone.trim()) {
      fail('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    const res = updateCustomer(editingCustomer.MaKH, {
      HoTen: formName.trim(),
      SoDienThoai: formPhone.trim(),
      CCCD: formCccd.trim() || undefined,
      Email: formEmail.trim() || undefined,
      DiaChi: formAddress.trim() || undefined,
      GhiChu: formNote.trim() || undefined,
    });

    if (res.success) {
      toast.success(res.message || 'Đã cập nhật hồ sơ khách hàng.');
      setEditingCustomer(null);
    } else {
      fail(res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5 leading-tight">
            <Users className="w-7 h-7 text-blue-600" />
            QUẢN LÝ HỒ SƠ KHÁCH HÀNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ thông tin liên hệ, CCCD, sở thích và lịch sử lưu trú của khách hàng Chicstay
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>TẠO HỒ SƠ KHÁCH HÀNG MỚI</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Tra cứu khách hàng theo Họ tên, Mã KH (KH...), Số điện thoại hoặc CCCD..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white shadow-xs outline-hidden focus:border-blue-500"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            Không tìm thấy hồ sơ khách hàng nào phù hợp với từ khóa.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const customerBookings = bookings.filter((b) => b.MaKH === cust.MaKH);
            const totalSpent = customerBookings
              .filter((b) => b.TrangThaiDon === 'Đã hoàn thành')
              .reduce((sum, b) => sum + b.TongTien, 0);

            return (
              <div
                key={cust.MaKH}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded-sm">
                      {cust.MaKH}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(cust)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-md cursor-pointer"
                      title="Chỉnh sửa hồ sơ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">{cust.HoTen}</h3>

                  <div className="text-xs text-slate-600 space-y-1 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.SoDienThoai}</span>
                    </div>
                    {cust.CCCD && (
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>CCCD: <strong>{cust.CCCD}</strong></span>
                      </div>
                    )}
                    {cust.DiaChi && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.DiaChi}</span>
                      </div>
                    )}
                  </div>

                  {cust.GhiChu && (
                    <div className="mt-2.5 p-2 bg-amber-50 rounded-lg border border-amber-100 text-[11px] text-amber-900">
                      <strong>Lưu ý:</strong> {cust.GhiChu}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Số lần đặt phòng</span>
                    <strong className="text-slate-900">{customerBookings.length} lần</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Tổng chi tiêu</span>
                    <strong className="text-emerald-700 tabular-nums">{formatVND(totalSpent)}</strong>
                  </div>
                  <button
                    onClick={() => setSelectedCustomerDetail(cust)}
                    className="ml-2 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                  >
                    Xem lịch sử
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: THÊM KHÁCH HÀNG */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                TẠO MỚI HỒ SƠ KHÁCH HÀNG
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ và tên (*):</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại (*):</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CCCD / Định danh:</label>
                  <input
                    type="text"
                    placeholder="001201004567"
                    value={formCccd}
                    onChange={(e) => setFormCccd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email:</label>
                  <input
                    type="email"
                    placeholder="khach@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ thường trú:</label>
                <input
                  type="text"
                  placeholder="Hà Nội, TP.HCM..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú đặc biệt / Sở thích:</label>
                <textarea
                  rows={2}
                  placeholder="Thói quen, yêu cầu nệm êm, trà thơm..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Lưu Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SỬA THÔNG TIN KHÁCH HÀNG */}
      {/* ============================================================== */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                CẬP NHẬT HỒ SƠ ({editingCustomer.MaKH})
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ và tên (*):</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại (*):</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CCCD:</label>
                  <input
                    type="text"
                    value={formCccd}
                    onChange={(e) => setFormCccd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email:</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ:</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú đặc biệt / Sở thích:</label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Cập Nhật Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHI TIẾT LỊCH SỬ KHÁCH HÀNG */}
      {/* ============================================================== */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  LỊCH SỬ LƯU TRÚ - {selectedCustomerDetail.HoTen}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Mã KH: {selectedCustomerDetail.MaKH} · SĐT: {selectedCustomerDetail.SoDienThoai}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {bookings.filter((b) => b.MaKH === selectedCustomerDetail.MaKH).length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Khách hàng chưa có lịch sử đặt phòng nào.
                </div>
              ) : (
                bookings
                  .filter((b) => b.MaKH === selectedCustomerDetail.MaKH)
                  .map((b) => (
                    <div
                      key={b.MaDon}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerDetail(null);
                              onOpenBooking?.(b.MaDon);
                            }}
                            className="text-blue-700 font-mono font-bold underline decoration-dotted hover:text-blue-900 cursor-pointer"
                            title="Mở chi tiết đơn trong tab Đơn đặt phòng"
                          >
                            {b.MaDon}
                          </button>
                          <span className="font-semibold text-slate-800">Phòng {b.MaPhong}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatDate(b.NgayNhanPhong)} → {formatDate(b.NgayTraPhong)} ({b.SoDem} đêm)
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          {b.TrangThaiDon}
                        </span>
                        <div className="font-bold text-slate-900 mt-1 tabular-nums">
                          {formatVND(b.TongTien)}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
