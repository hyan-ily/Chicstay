import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  X
} from 'lucide-react';
import { useHomestay } from '../context/HomestayContext';
import { useToast } from '../context/ToastContext';
import { DichVu, NhomDichVu, ThoiDiemApDung } from '../types';
import { formatVND, MAX_SERVICE_PRICE } from '../utils/helpers';

export const ServicesView: React.FC = () => {
  const { services, createService, updateService, toggleServiceStatus } = useHomestay();
  const toast = useToast();

  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<DichVu | null>(null);
  const [confirmToggleService, setConfirmToggleService] = useState<DichVu | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formGroup, setFormGroup] = useState<NhomDichVu>('Ăn uống & Tiện ích');
  const [formUnit, setFormUnit] = useState('Lần');
  const [formPrice, setFormPrice] = useState<number>(50000);
  const [formTiming, setFormTiming] = useState<ThoiDiemApDung>('Cả hai');
  const [errorMsg, setErrorMsg] = useState('');
  const fail = (msg: string) => {
    setErrorMsg(msg);
    toast.error(msg);
  };

  const groups: NhomDichVu[] = [
    'Ăn uống & Tiện ích',
    'Ăn uống & Trải nghiệm',
    'Di chuyển & Phương tiện',
    'Tiện ích & Vệ sinh',
    'Tiện nghi phòng',
    'Phụ thu thời gian',
    'Trải nghiệm theo Vibe',
    'Giải trí tại phòng',
    'Minibar',
  ];

  // Filter list
  const filteredServices = services.filter((s) => {
    if (selectedGroup !== 'ALL' && s.NhomDichVu !== selectedGroup) return false;
    if (selectedStatus !== 'ALL' && s.TrangThai !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.TenDichVu.toLowerCase().includes(q) ||
        s.MaDV.toLowerCase().includes(q) ||
        s.NhomDichVu.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setFormName('');
    setFormGroup('Ăn uống & Tiện ích');
    setFormUnit('Lần');
    setFormPrice(50000);
    setFormTiming('Cả hai');
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (service: DichVu) => {
    setEditingService(service);
    setFormName(service.TenDichVu);
    setFormGroup(service.NhomDichVu);
    setFormUnit(service.DonViTinh);
    setFormPrice(service.DonGia);
    setFormTiming(service.ThoiDiemApDung);
    setErrorMsg('');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      fail('Vui lòng nhập tên dịch vụ.');
      return;
    }
    if (formPrice <= 0) {
      fail('Đơn giá dịch vụ phải lớn hơn 0.');
      return;
    }
    if (formPrice > MAX_SERVICE_PRICE) {
      fail(`Đơn giá dịch vụ không được vượt quá ${MAX_SERVICE_PRICE.toLocaleString('vi-VN')} ₫.`);
      return;
    }

    const res = createService({
      TenDichVu: formName.trim(),
      NhomDichVu: formGroup,
      DonViTinh: formUnit.trim(),
      DonGia: formPrice,
      ThoiDiemApDung: formTiming,
      TrangThai: 'Đang hoạt động',
    });

    if (res.success) {
      toast.success(res.message);
      setIsAddModalOpen(false);
    } else {
      fail(res.message);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!formName.trim()) {
      fail('Vui lòng nhập tên dịch vụ.');
      return;
    }
    if (formPrice <= 0) {
      fail('Đơn giá dịch vụ phải lớn hơn 0.');
      return;
    }
    if (formPrice > MAX_SERVICE_PRICE) {
      fail(`Đơn giá dịch vụ không được vượt quá ${MAX_SERVICE_PRICE.toLocaleString('vi-VN')} ₫.`);
      return;
    }

    const res = updateService(editingService.MaDV, {
      TenDichVu: formName.trim(),
      NhomDichVu: formGroup,
      DonViTinh: formUnit.trim(),
      DonGia: formPrice,
      ThoiDiemApDung: formTiming,
    });

    if (res.success) {
      toast.success(res.message);
      setEditingService(null);
    } else {
      fail(res.message);
    }
  };

  const handleConfirmToggle = () => {
    if (!confirmToggleService) return;
    const r = toggleServiceStatus(confirmToggleService.MaDV);
    toast.success(r.message);
    setConfirmToggleService(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5 leading-tight">
            <Package className="w-7 h-7 text-blue-600" />
            QUẢN LÝ DỊCH VỤ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh mục dịch vụ lưu trú, phụ thu và tiện ích gia tăng homestay Chicstay
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>THÊM MỚI DỊCH VỤ</span>
        </button>
      </div>

      {/* Group Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
        <button
          onClick={() => setSelectedGroup('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            selectedGroup === 'ALL'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tất cả nhóm ({services.length})
        </button>
        {groups.map((grp) => {
          const count = services.filter((s) => s.NhomDichVu === grp).length;
          return (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedGroup === grp
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {grp} ({count})
            </button>
          );
        })}
      </div>

      {/* Search and Status Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tra cứu tên dịch vụ hoặc mã (D001, D008...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 bg-white shadow-xs outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white focus:border-blue-500 outline-hidden cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Đang hoạt động">Đang hoạt động</option>
            <option value="Ngừng hoạt động">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">MÃ DV</th>
                <th className="py-3 px-4">TÊN DỊCH VỤ</th>
                <th className="py-3 px-4">NHÓM DỊCH VỤ</th>
                <th className="py-3 px-4 text-center">ĐƠN VỊ TÍNH</th>
                <th className="py-3 px-4 text-right">ĐƠN GIÁ HIỆN HÀNH</th>
                <th className="py-3 px-4 text-center">THỜI ĐIỂM ÁP DỤNG</th>
                <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy dịch vụ nào phù hợp điều kiện tra cứu.
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => {
                  const isActive = s.TrangThai === 'Đang hoạt động';
                  return (
                    <tr key={s.MaDV} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{s.MaDV}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.TenDichVu}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {s.NhomDichVu}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">{s.DonViTinh}</td>
                      <td className="py-3 px-4 text-right font-extrabold tabular-nums text-slate-900 text-sm">
                        {formatVND(s.DonGia)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {s.ThoiDiemApDung}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setConfirmToggleService(s)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Gạt công tắc trạng thái dịch vụ (UC-2.2)"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-emerald-600' : 'bg-slate-500'
                            }`}
                          />
                          <span>{s.TrangThai}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="px-2.5 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md font-semibold text-xs flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Sửa
                        </button>
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
      {/* MODAL: THÊM DỊCH VỤ MỚI (UC-2.1) */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                THÊM MỚI DỊCH VỤ VÀO DANH MỤC (UC-2.1)
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên dịch vụ (*):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Set nướng BBQ sân vườn, Thuê xe máy..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nhóm dịch vụ:
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as NhomDichVu)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer"
                  >
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Đơn vị tính (*):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Lần, Ngày, Suất, Lon, Kg..."
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Đơn giá hiện hành (&gt; 0) (*):
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={MAX_SERVICE_PRICE}
                    step={1000}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Thời điểm áp dụng:
                  </label>
                  <select
                    value={formTiming}
                    onChange={(e) => setFormTiming(e.target.value as ThoiDiemApDung)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer"
                  >
                    <option value="Cả hai">Cả hai giai đoạn</option>
                    <option value="Chỉ Pre-stay">Chỉ Pre-stay (Đặt trước)</option>
                    <option value="Chỉ In-house">Chỉ In-house (Khi lưu trú)</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                Mã dịch vụ sẽ tự động sinh (D001, D002...). Trạng thái mặc định là &quot;Đang hoạt động&quot;.
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
                  Lưu Dịch Vụ Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SỬA DỊCH VỤ (UC-2.2) */}
      {/* ============================================================== */}
      {editingService && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                CẬP NHẬT THÔNG TIN DỊCH VỤ ({editingService.MaDV})
              </h3>
              <button
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mã dịch vụ (Chỉ đọc):
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={editingService.MaDV}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên dịch vụ:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nhóm dịch vụ:
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as NhomDichVu)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer"
                  >
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Đơn vị tính:
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Đơn giá mới (&gt; 0):
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={MAX_SERVICE_PRICE}
                    step={1000}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Thời điểm áp dụng:
                  </label>
                  <select
                    value={formTiming}
                    onChange={(e) => setFormTiming(e.target.value as ThoiDiemApDung)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer"
                  >
                    <option value="Cả hai">Cả hai</option>
                    <option value="Chỉ Pre-stay">Chỉ Pre-stay</option>
                    <option value="Chỉ In-house">Chỉ In-house</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                ⚠ Thay đổi đơn giá chỉ áp dụng cho các lần thêm dịch vụ về sau; các đơn đã ghi nhận trước đó giữ nguyên đơn giá chốt cứng (BR-3).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: XÁC NHẬN CHUYỂN TRẠNG THÁI DỊCH VỤ */}
      {/* ============================================================== */}
      {confirmToggleService && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              XÁC NHẬN CHUYỂN TRẠNG THÁI
            </h3>

            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn chuyển trạng thái dịch vụ{' '}
              <strong>{confirmToggleService.TenDichVu}</strong> sang{' '}
              <strong className="text-rose-600">
                {confirmToggleService.TrangThai === 'Đang hoạt động'
                  ? 'Ngừng hoạt động'
                  : 'Đang hoạt động'}
              </strong>
              ?
            </p>

            {confirmToggleService.TrangThai === 'Đang hoạt động' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                Dịch vụ sẽ <strong>không thể thêm vào đơn mới</strong>. Các đơn cũ đã ghi nhận dịch vụ này vẫn giữ nguyên lịch sử giao dịch.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmToggleService(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
