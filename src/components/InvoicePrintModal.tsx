import React from 'react';
import { Printer, X, CheckCircle, QrCode } from 'lucide-react';
import { useHomestay } from '../context/HomestayContext';
import { formatVND, formatDate, formatDateTime, generateVietQRUrl } from '../utils/helpers';

interface InvoicePrintModalProps {
  maDon: string;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  maDon,
  onClose,
}) => {
  const { bookings, customers, rooms, serviceItems, invoices, bankConfig } = useHomestay();

  const booking = bookings.find((b) => b.MaDon === maDon);
  const customer = customers.find((c) => c.MaKH === booking?.MaKH);
  const room = rooms.find((r) => r.MaPhong === booking?.MaPhong);
  const items = serviceItems.filter((s) => s.MaDon === maDon);
  const invoice = invoices.find((h) => h.MaDon === maDon);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-6 print:max-h-none print:overflow-visible print:shadow-none print:m-0 print:w-full print:max-w-none print:rounded-none">
        {/* Action bar (hidden in print) */}
        <div className="sticky top-0 z-10 bg-white -mx-8 -mt-8 px-8 pt-8 flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              HÓA ĐƠN TẤT TOÁN HOMESTAY CHICSTAY
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Hóa Đơn</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="space-y-6 text-slate-800 text-xs">
          {/* Brand header */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
            <div>
              <div className="text-2xl font-black tracking-tight text-blue-700 uppercase">
                CHICSTAY HOMESTAY
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Địa chỉ: Số 18 Đường Mây Ngàn, P.3, TP. Đà Lạt · Hotline: 0988.123.456
              </p>
              <p className="text-[11px] text-slate-500">
                Email: booking@chicstay.vn · Website: chicstay.vn
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-slate-900 block">
                HÓA ĐƠN TỔNG HỢP
              </span>
              <span className="font-mono text-xs font-bold text-blue-700 block mt-0.5">
                Mã: {invoice?.MaHoaDon || `HD2025-${booking.MaDon.slice(2)}`}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Ngày: {formatDate(new Date().toISOString())}
              </span>
            </div>
          </div>

          {/* Customer & Stay Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-500 uppercase text-[10px] block">
                KHÁCH HÀNG:
              </span>
              <strong className="text-sm text-slate-900 block mt-0.5">
                {customer?.HoTen || 'Khách vãng lai'}
              </strong>
              <div className="text-slate-600 text-[11px] mt-0.5">
                Số ĐT: {customer?.SoDienThoai} · CCCD: {customer?.CCCD || '--'}
              </div>
              <div className="text-slate-500 text-[11px]">
                Địa chỉ: {customer?.DiaChi || 'Việt Nam'}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase text-[10px] block">
                THÔNG TIN LƯU TRÚ:
              </span>
              <strong className="text-sm text-slate-900 block mt-0.5">
                Phòng {booking.MaPhong} ({room?.TenPhong})
              </strong>
              <div className="text-slate-600 text-[11px] mt-0.5">
                Nhận: {formatDate(booking.NgayNhanPhong)} → Trả: {formatDate(booking.NgayTraPhong)} ({booking.SoDem} đêm)
              </div>
              <div className="text-slate-500 text-[11px]">
                Số lượng: {booking.SoKhach} khách · Mã đơn: {booking.MaDon}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-2 px-3">NỘI DUNG THANH TOÁN</th>
                <th className="py-2 px-3 text-center">ĐVT</th>
                <th className="py-2 px-3 text-center">SL</th>
                <th className="py-2 px-3 text-right">ĐƠN GIÁ</th>
                <th className="py-2 px-3 text-right">THÀNH TIỀN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Room Cost line */}
              <tr>
                <td className="py-2.5 px-3">
                  <strong>Tiền phòng {booking.MaPhong}</strong>
                  <span className="block text-[11px] text-slate-500">
                    Từ {formatDate(booking.NgayNhanPhong)} đến {formatDate(booking.NgayTraPhong)} ({booking.SoDem} đêm)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">Đêm</td>
                <td className="py-2.5 px-3 text-center">{booking.SoDem}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {formatVND(room ? room.GiaPhong : booking.TienPhong / booking.SoDem)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                  {formatVND(booking.TienPhong)}
                </td>
              </tr>

              {/* Service lines */}
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3">
                    <strong>{it.TenDichVu}</strong>
                    {it.GhiChu && (
                      <span className="block text-[10px] text-slate-400">{it.GhiChu}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">{it.GiaiDoan}</td>
                  <td className="py-2.5 px-3 text-center">{it.SoLuong}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatVND(it.DonGiaTaiThoiDiem)}</td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums">{formatVND(it.ThanhTien)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Calculation */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span>Tiền phòng:</span>
                <span className="tabular-nums font-semibold">{formatVND(booking.TienPhong)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiền dịch vụ phát sinh:</span>
                <span className="tabular-nums font-semibold">{formatVND(booking.TienDichVu)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-1 text-slate-900">
                <span>Tổng giá trị đơn:</span>
                <span className="tabular-nums">{formatVND(booking.TongTien)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Tiền cọc đã trả trước (30%):</span>
                <span className="tabular-nums">-{formatVND(invoice ? invoice.TienCocDaTra : booking.DaThu)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                <span>Số tiền thanh toán khi check-out:</span>
                <span className="tabular-nums">
                  {formatVND(invoice ? invoice.TienThanhToanKhiCheckOut : booking.ConLai)}
                </span>
              </div>
              <div className="flex justify-between font-black text-base border-t-2 border-slate-900 pt-2 text-slate-950">
                <span>TỔNG ĐÃ TẤT TOÁN:</span>
                <span className="tabular-nums">{formatVND(booking.TongTien)}</span>
              </div>
            </div>
          </div>

          {/* Footer note & Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
            <div>
              <span className="font-bold text-slate-700 block">KHÁCH HÀNG</span>
              <span className="text-[10px] text-slate-400 italic block mt-0.5">(Ký và ghi rõ họ tên)</span>
              <div className="h-16 flex items-end justify-center font-semibold text-slate-900">
                {customer?.HoTen}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block">ĐẠI DIỆN HOMESTAY CHICSTAY</span>
              <span className="text-[10px] text-slate-400 italic block mt-0.5">(Ký và xác nhận đã thu đủ)</span>
              <div className="h-16 flex items-end justify-center font-bold text-blue-700">
                Quản lý Chicstay (Đã duyệt)
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-100">
            Cảm ơn quý khách đã tin tưởng và lựa chọn Chicstay Homestay. Hẹn gặp lại quý khách!
          </div>
        </div>
      </div>
    </div>
  );
};
