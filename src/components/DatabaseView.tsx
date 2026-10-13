import React, { useState } from 'react';
import {
  Database,
  Download,
  Table,
  Play,
  RotateCcw,
  CheckCircle,
  FileCode,
  Layers,
  Key,
  Shield,
  Search,
  ExternalLink
} from 'lucide-react';
import { useHomestay } from '../context/HomestayContext';
import { formatVND } from '../utils/helpers';

export const DatabaseView: React.FC = () => {
  const {
    rooms,
    users,
    customers,
    services,
    bookings,
    paymentReceipts,
    serviceItems,
    invoices,
    resetDatabase,
    getRawSQL,
  } = useHomestay();

  const [selectedTable, setSelectedTable] = useState<string>('DONDATPHONG');
  const [activeSubTab, setActiveSubTab] = useState<'tables' | 'erd' | 'queries'>('tables');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Sample SQL query simulator
  const [selectedQueryIndex, setSelectedQueryIndex] = useState(0);
  const sampleQueries = [
    {
      title: '1. Thống kê tình trạng phòng homestay hiện tại',
      sql: `SELECT TrangThaiPhong, COUNT(*) AS SoLuong \nFROM PHONG \nGROUP BY TrangThaiPhong;`,
      result: [
        { TrangThaiPhong: 'Sẵn sàng', SoLuong: rooms.filter((r) => r.TrangThaiPhong === 'Sẵn sàng').length },
        { TrangThaiPhong: 'Đang sử dụng', SoLuong: rooms.filter((r) => r.TrangThaiPhong === 'Đang sử dụng').length },
        { TrangThaiPhong: 'Đã được đặt', SoLuong: rooms.filter((r) => r.TrangThaiPhong === 'Đã được đặt').length },
        { TrangThaiPhong: 'Tạm giữ', SoLuong: rooms.filter((r) => r.TrangThaiPhong === 'Tạm giữ').length },
        { TrangThaiPhong: 'Chờ dọn phòng', SoLuong: rooms.filter((r) => r.TrangThaiPhong === 'Chờ dọn phòng').length },
      ],
    },
    {
      title: '2. Thống kê tổng doanh thu thực tế đã thu',
      sql: `SELECT LoaiPhieu, COUNT(*) AS SoPhieu, SUM(SoTien) AS TongTienThu \nFROM PHIEUTHANHTOAN \nGROUP BY LoaiPhieu;`,
      result: [
        {
          LoaiPhieu: 'Cọc (30%)',
          SoPhieu: paymentReceipts.filter((p) => p.LoaiPhieu === 'Cọc').length,
          TongTienThu: formatVND(paymentReceipts.filter((p) => p.LoaiPhieu === 'Cọc').reduce((s, p) => s + p.SoTien, 0)),
        },
        {
          LoaiPhieu: 'Tất toán khi check-out',
          SoPhieu: paymentReceipts.filter((p) => p.LoaiPhieu === 'Tất toán').length,
          TongTienThu: formatVND(paymentReceipts.filter((p) => p.LoaiPhieu === 'Tất toán').reduce((s, p) => s + p.SoTien, 0)),
        },
        {
          LoaiPhieu: 'Hoàn cọc',
          SoPhieu: paymentReceipts.filter((p) => p.LoaiPhieu === 'Hoàn cọc').length,
          TongTienThu: formatVND(paymentReceipts.filter((p) => p.LoaiPhieu === 'Hoàn cọc').reduce((s, p) => s + p.SoTien, 0)),
        },
      ],
    },
    {
      title: '3. Tra cứu khách hàng có tổng chi tiêu cao nhất',
      sql: `SELECT kh.MaKH, kh.HoTen, kh.SoDienThoai, COUNT(dp.MaDon) AS SoLanDat, SUM(dp.TongTien) AS TongChiTieu\nFROM KHACHHANG kh\nJOIN DONDATPHONG dp ON kh.MaKH = dp.MaKH\nGROUP BY kh.MaKH, kh.HoTen, kh.SoDienThoai\nORDER BY TongChiTieu DESC;`,
      result: customers.map((c) => {
        const cBookings = bookings.filter((b) => b.MaKH === c.MaKH);
        return {
          MaKH: c.MaKH,
          HoTen: c.HoTen,
          SoDienThoai: c.SoDienThoai,
          SoLanDat: cBookings.length,
          TongChiTieu: formatVND(cBookings.reduce((sum, b) => sum + b.TongTien, 0)),
        };
      }),
    },
  ];

  const handleDownloadSQL = () => {
    const rawSql = getRawSQL();
    const blob = new Blob([rawSql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'chicstay_database.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Live Table Data
  const renderTableData = () => {
    switch (selectedTable) {
      case 'PHONG':
        return {
          headers: ['MaPhong (PK)', 'TenPhong', 'LoaiPhong', 'GiaPhong', 'SucChua', 'TrangThaiPhong', 'MoTa'],
          rows: rooms.map((r) => [r.MaPhong, r.TenPhong, r.LoaiPhong, formatVND(r.GiaPhong), r.SucChua, r.TrangThaiPhong, r.MoTa || '']),
        };
      case 'NGUOIDUNG':
        return {
          headers: ['MaND (PK)', 'HoTen', 'Email', 'VaiTro', 'MatKhau'],
          rows: users.map((u) => [u.MaND, u.HoTen, u.Email, u.VaiTro, '******']),
        };
      case 'KHACHHANG':
        return {
          headers: ['MaKH (PK)', 'HoTen', 'SoDienThoai', 'Email', 'CCCD', 'DiaChi', 'GhiChu'],
          rows: customers.map((c) => [c.MaKH, c.HoTen, c.SoDienThoai, c.Email || '', c.CCCD || '', c.DiaChi || '', c.GhiChu || '']),
        };
      case 'DICHVU':
        return {
          headers: ['MaDV (PK)', 'TenDichVu', 'NhomDichVu', 'DonViTinh', 'DonGia', 'ThoiDiemApDung', 'TrangThai'],
          rows: services.map((s) => [s.MaDV, s.TenDichVu, s.NhomDichVu, s.DonViTinh, formatVND(s.DonGia), s.ThoiDiemApDung, s.TrangThai]),
        };
      case 'DONDATPHONG':
        return {
          headers: ['MaDon (PK)', 'MaND (FK)', 'MaKH (FK)', 'MaPhong (FK)', 'NgayNhan', 'NgayTra', 'SoDem', 'TienPhong', 'TienCocYeuCau', 'TienDichVu', 'TongTien', 'DaThu', 'ConLai', 'TrangThaiDon'],
          rows: bookings.map((b) => [
            b.MaDon,
            b.MaND,
            b.MaKH,
            b.MaPhong,
            b.NgayNhanPhong,
            b.NgayTraPhong,
            b.SoDem,
            formatVND(b.TienPhong),
            formatVND(b.TienCocYeuCau),
            formatVND(b.TienDichVu),
            formatVND(b.TongTien),
            formatVND(b.DaThu),
            formatVND(b.ConLai),
            b.TrangThaiDon,
          ]),
        };
      case 'PHIEUTHANHTOAN':
        return {
          headers: ['MaPhieu (PK)', 'MaDon (FK)', 'LoaiPhieu', 'SoTien', 'PhuongThuc', 'MaGiaoDichNganHang', 'TrangThaiThanhToan', 'NgayLap', 'NguoiLap'],
          rows: paymentReceipts.map((p) => [
            p.MaPhieu,
            p.MaDon,
            p.LoaiPhieu,
            formatVND(p.SoTien),
            p.PhuongThuc,
            p.MaGiaoDichNganHang || '',
            p.TrangThaiThanhToan,
            p.NgayLap.substring(0, 16),
            p.NguoiLap,
          ]),
        };
      case 'CHITIETDICHVU':
        return {
          headers: ['MaChiTiet (PK)', 'MaDon (FK)', 'MaDV (FK)', 'TenDichVu', 'SoLuong', 'DonGiaTaiThoiDiem', 'ThanhTien', 'ThoiDiemThem'],
          rows: serviceItems.map((c) => [
            c.MaChiTiet || c.id,
            c.MaDon,
            c.MaDV,
            c.TenDichVu,
            c.SoLuong,
            formatVND(c.DonGiaTaiThoiDiem),
            formatVND(c.ThanhTien),
            c.ThoiDiemThem.substring(0, 16),
          ]),
        };
      case 'HOADON':
        return {
          headers: ['MaHoaDon (PK)', 'MaDon (FK)', 'TienPhong', 'TienDichVu', 'TienCocDaTra', 'TienCheckOut', 'TongTienDaThanhToan', 'PhuongThuc', 'NgayXuat'],
          rows: invoices.map((h) => [
            h.MaHoaDon,
            h.MaDon,
            formatVND(h.TienPhong),
            formatVND(h.TienDichVu),
            formatVND(h.TienCocDaTra),
            formatVND(h.TienThanhToanKhiCheckOut),
            formatVND(h.TongTienDaThanhToan),
            h.PhuongThuc,
            h.NgayXuat.substring(0, 16),
          ]),
        };
      default:
        return { headers: [], rows: [] };
    }
  };

  const currentTableData = renderTableData();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5 leading-tight">
            <Database className="w-7 h-7 text-blue-600" />
            CƠ SỞ DỮ LIỆU CSDL HOMESTAY (8 BẢNG QUAN HỆ)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duyệt dữ liệu thực tế, kiểm tra ràng buộc khóa ngoại (FK/PK) và tải tập tin chicstay_database.sql
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSQL}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>TẢI TẬP TIN chicstay_database.sql</span>
          </button>

          <button
            onClick={() => setResetConfirmOpen(true)}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Khôi phục CSDL gốc (Factory Reset)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveSubTab('tables')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'tables'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Duyệt Dữ Liệu Các Bảng (Live Table)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('erd')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'erd'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Sơ Đồ Thực Thể Quan Hệ (ERD & Cấu Trúc)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('queries')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'queries'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Truy Vấn Mẫu (SQL Queries)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-VIEW 1: LIVE TABLE DATA VIEWER */}
      {/* ============================================================== */}
      {activeSubTab === 'tables' && (
        <div className="space-y-4">
          {/* Table Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            {[
              { name: 'DONDATPHONG', label: '1. DONDATPHONG (Đơn đặt phòng)', count: bookings.length },
              { name: 'PHONG', label: '2. PHONG (Phòng nghỉ)', count: rooms.length },
              { name: 'KHACHHANG', label: '3. KHACHHANG (Khách hàng)', count: customers.length },
              { name: 'DICHVU', label: '4. DICHVU (Dịch vụ)', count: services.length },
              { name: 'PHIEUTHANHTOAN', label: '5. PHIEUTHANHTOAN (Phiếu thu)', count: paymentReceipts.length },
              { name: 'CHITIETDICHVU', label: '6. CHITIETDICHVU (Chi tiết DV)', count: serviceItems.length },
              { name: 'HOADON', label: '7. HOADON (Hóa đơn)', count: invoices.length },
              { name: 'NGUOIDUNG', label: '8. NGUOIDUNG (Tài khoản)', count: users.length },
            ].map((tbl) => (
              <button
                key={tbl.name}
                onClick={() => setSelectedTable(tbl.name)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedTable === tbl.name
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-white/60'
                }`}
              >
                <span>{tbl.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedTable === tbl.name ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tbl.count}
                </span>
              </button>
            ))}
          </div>

          {/* Table Data Grid */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-700">
                BẢNG: <strong className="text-blue-700">{selectedTable}</strong> ({currentTableData.rows.length} bản ghi)
              </span>
              <span className="text-slate-400 text-[11px]">Đồng bộ dữ liệu thời gian thực</span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    {currentTableData.headers.map((h, idx) => (
                      <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTableData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={currentTableData.headers.length} className="py-8 text-center text-slate-400">
                        Chưa có bản ghi nào trong bảng này.
                      </td>
                    </tr>
                  ) : (
                    currentTableData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="py-2 px-3 whitespace-nowrap tabular-nums text-slate-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-VIEW 2: ERD & SCHEMA CẤU TRÚC */}
      {/* ============================================================== */}
      {activeSubTab === 'erd' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              table: 'PHONG',
              pk: 'MaPhong',
              fk: '',
              fields: ['TenPhong: NVARCHAR', 'LoaiPhong: NVARCHAR', 'GiaPhong: DECIMAL', 'SucChua: INT', 'TrangThaiPhong: NVARCHAR', 'MoTa: NVARCHAR'],
            },
            {
              table: 'NGUOIDUNG',
              pk: 'MaND',
              fk: '',
              fields: ['HoTen: NVARCHAR', 'Email: VARCHAR (UNIQUE)', 'VaiTro: NVARCHAR', 'MatKhau: VARCHAR'],
            },
            {
              table: 'KHACHHANG',
              pk: 'MaKH',
              fk: '',
              fields: ['HoTen: NVARCHAR', 'SoDienThoai: VARCHAR', 'CCCD: VARCHAR (UNIQUE)', 'Email: VARCHAR', 'DiaChi: NVARCHAR', 'GhiChu: NVARCHAR'],
            },
            {
              table: 'DICHVU',
              pk: 'MaDV',
              fk: '',
              fields: ['TenDichVu: NVARCHAR', 'NhomDichVu: NVARCHAR', 'DonViTinh: NVARCHAR', 'DonGia: DECIMAL', 'ThoiDiemApDung: NVARCHAR', 'TrangThai: NVARCHAR'],
            },
            {
              table: 'DONDATPHONG',
              pk: 'MaDon',
              fk: 'MaND, MaKH, MaPhong',
              fields: ['NgayNhan: DATE', 'NgayTra: DATE', 'SoDem: INT', 'TienPhong: DECIMAL', 'TienCocYeuCau: DECIMAL', 'TienDichVu: DECIMAL', 'TongTien: DECIMAL', 'DaThu: DECIMAL', 'ConLai: DECIMAL', 'TrangThaiDon: NVARCHAR'],
            },
            {
              table: 'PHIEUTHANHTOAN',
              pk: 'MaPhieu',
              fk: 'MaDon, NguoiLap',
              fields: ['LoaiPhieu: NVARCHAR', 'SoTien: DECIMAL', 'PhuongThuc: NVARCHAR', 'MaGiaoDichNganHang: VARCHAR', 'TrangThaiThanhToan: NVARCHAR', 'NgayLap: DATETIME'],
            },
            {
              table: 'CHITIETDICHVU',
              pk: 'MaChiTiet',
              fk: 'MaDon, MaDV',
              fields: ['SoLuong: INT', 'DonGiaTaiThoiDiem: DECIMAL', 'ThanhTien: DECIMAL', 'ThoiDiemThem: DATETIME', 'GhiChu: NVARCHAR'],
            },
            {
              table: 'HOADON',
              pk: 'MaHoaDon',
              fk: 'MaDon, NguoiXuat',
              fields: ['TienPhong: DECIMAL', 'TienDichVu: DECIMAL', 'TienCocDaTra: DECIMAL', 'TienThanhToanKhiCheckOut: DECIMAL', 'TongTienDaThanhToan: DECIMAL', 'PhuongThuc: NVARCHAR', 'NgayXuat: DATETIME'],
            },
          ].map((item) => (
            <div key={item.table} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-mono font-extrabold text-blue-700 text-sm">
                  {item.table}
                </span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                  Bảng CSDL
                </span>
              </div>
              <div className="text-xs space-y-1 mt-2.5">
                <div className="font-mono text-emerald-700 font-bold">
                  PK: {item.pk}
                </div>
                {item.fk && (
                  <div className="font-mono text-amber-700 font-semibold text-[11px]">
                    FK: {item.fk}
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 space-y-0.5 text-[11px] text-slate-500 font-mono">
                  {item.fields.map((f, i) => (
                    <div key={i}>{f}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-VIEW 3: TRUY VẤN MẪU (SQL QUERIES) */}
      {/* ============================================================== */}
      {activeSubTab === 'queries' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedQueryIndex(idx)}
                className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  selectedQueryIndex === idx
                    ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {q.title}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-xs space-y-2">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-bold block">
              Câu lệnh SQL chạy thử nghiệm:
            </span>
            <pre className="whitespace-pre-wrap">{sampleQueries[selectedQueryIndex].sql}</pre>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Kết Quả Trả Về ({sampleQueries[selectedQueryIndex].result.length} hàng):
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-slate-800">
                {JSON.stringify(sampleQueries[selectedQueryIndex].result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 text-center">
            <RotateCcw className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">
              Khôi phục Cơ Sở Dữ Liệu gốc?
            </h3>
            <p className="text-xs text-slate-600">
              Hành động này sẽ đặt lại toàn bộ phòng, đơn đặt phòng, phiếu thu, hóa đơn về trạng thái khởi tạo ban đầu.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  resetDatabase();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-xs cursor-pointer"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
