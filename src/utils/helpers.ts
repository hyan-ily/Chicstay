import type { TrangThaiDon, ThoiDiemApDung, ChiTietDichVu } from '../types';

export const formatVND = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

// Làm tròn đến nghìn đồng: cọcYêuCầu = làm_tròn_1000(tỷLệCọc × tiềnPhòng)
export const calculateDeposit = (roomPrice: number, rate = 0.3): number => {
  const raw = roomPrice * rate;
  return Math.round(raw / 1000) * 1000;
};

// Kiểm tra quá hạn đặt cọc 12 giờ
export const isBookingOverdue12Hours = (createdAt: string): boolean => {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffHours = (now - created) / (1000 * 60 * 60);
  return diffHours >= 12;
};

// Kiểm tra hủy >= 48 giờ trước 14:00 ngày check-in
export const isEligibleForRefund48Hours = (checkInDate: string): boolean => {
  // Mốc là 14:00 của ngày check-in
  const checkInTarget = new Date(`${checkInDate}T14:00:00`).getTime();
  const now = new Date().getTime();
  const diffHours = (checkInTarget - now) / (1000 * 60 * 60);
  return diffHours >= 48;
};

// Sinh mã khóa chính theo quy chuẩn
export const generateMaDon = (existingCodes: string[]): string => {
  const year = new Date().getFullYear();
  const prefix = `DP${year}`;
  let maxNum = 0;
  for (const code of existingCodes) {
    if (code.startsWith(prefix)) {
      const numPart = parseInt(code.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    } else if (code.startsWith('DP2025')) {
      const numPart = parseInt(code.slice(6), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = (maxNum + 1).toString().padStart(4, '0');
  return `${prefix}${nextNum}`;
};

export const generateMaPhieu = (existingCodes: string[]): string => {
  const prefix = 'PT';
  let maxNum = 0;
  for (const code of existingCodes) {
    if (code.startsWith(prefix)) {
      const numPart = parseInt(code.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = (maxNum + 1).toString().padStart(5, '0');
  return `${prefix}${nextNum}`;
};

export const generateMaHoaDon = (existingCodes: string[]): string => {
  const year = new Date().getFullYear();
  const prefix = `HD${year}`;
  let maxNum = 0;
  for (const code of existingCodes) {
    if (code.startsWith(prefix)) {
      const numPart = parseInt(code.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    } else if (code.startsWith('HD2025')) {
      const numPart = parseInt(code.slice(6), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = (maxNum + 1).toString().padStart(4, '0');
  return `${prefix}${nextNum}`;
};

export const generateMaKH = (existingCodes: string[]): string => {
  const prefix = 'KH';
  let maxNum = 0;
  for (const code of existingCodes) {
    if (code.startsWith(prefix)) {
      const numPart = parseInt(code.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  return `${prefix}${nextNum}`;
};

export const generateMaDV = (existingCodes: string[]): string => {
  const prefix = 'D';
  let maxNum = 0;
  for (const code of existingCodes) {
    if (code.startsWith(prefix)) {
      const numPart = parseInt(code.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  return `${prefix}${nextNum}`;
};

// Sinh URL VietQR chuẩn
export const generateVietQRUrl = (
  bankCode = 'ICB', // VietinBank
  accountNo = '108876543210',
  accountName = 'CHICSTAY HOMESTAY',
  amount = 0,
  description = ''
): string => {
  const encodedAccountName = encodeURIComponent(accountName);
  const encodedDescription = encodeURIComponent(description);
  return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodedDescription}&accountName=${encodedAccountName}`;
};

// ===== QUẢN LÝ DỊCH VỤ: ràng buộc trạng thái đơn (Business Rules) =====
// Chỉ khi đơn "Đã xác nhận" hoặc "Đã check-in" mới được thêm / sửa số lượng / xóa dịch vụ.
// Các trạng thái còn lại (Chờ đặt cọc, Đã hoàn thành, Đã hủy, No-show) đều bị khóa.
export const SERVICE_EDITABLE_STATUSES: TrangThaiDon[] = ['Đã xác nhận', 'Đã check-in'];

export const canEditBookingServices = (status: TrangThaiDon): boolean =>
  SERVICE_EDITABLE_STATUSES.includes(status);

export const getServiceLockReason = (status: TrangThaiDon): string | null => {
  if (canEditBookingServices(status)) return null;
  return status === 'Đã hoàn thành'
    ? 'Đơn đã hoàn thành: dữ liệu dịch vụ đã bị khóa để bảo toàn lịch sử giao dịch.'
    : `Đơn ở trạng thái "${status}": không thể thêm, sửa hoặc xóa dịch vụ.`;
};

// "Chỉ Pre-stay" -> chỉ khi Đã xác nhận; "Chỉ In-house" -> chỉ khi Đã check-in; "Cả hai" -> cả hai.
export const isServiceAllowedAtStatus = (when: ThoiDiemApDung, status: TrangThaiDon): boolean => {
  if (status === 'Đã xác nhận') return when === 'Chỉ Pre-stay' || when === 'Cả hai';
  if (status === 'Đã check-in') return when === 'Chỉ In-house' || when === 'Cả hai';
  return false;
};

export const sumServiceAmount = (items: ChiTietDichVu[], maDon: string): number =>
  items.filter((x) => x.MaDon === maDon).reduce((sum, x) => sum + x.ThanhTien, 0);

// =====================================================================
// ===== GIỚI HẠN SỐ LƯỢNG DỊCH VỤ (Service Limits) ====================
// Tổng số lượng của MỘT MaDV trong MỘT đơn không được vượt quá `max`.
// Dùng chung cho frontend (cap + cảnh báo đỏ) và backend (addServiceToBooking).
// =====================================================================
interface LimitCtx { sucChua: number; soDem: number }
interface ServiceLimitRule { max: (c: LimitCtx) => number; label: (c: LimitCtx) => string }

const perNight = (n: number, unit: string): ServiceLimitRule => ({
  max: (c) => n * c.soDem,
  label: (c) => `${n} ${unit} × ${c.soDem} đêm = ${n * c.soDem}`,
});
const perOrder = (n: number, unit: string): ServiceLimitRule => ({
  max: () => n,
  label: () => `${n} ${unit} / đơn`,
});

export const SERVICE_LIMIT_RULES: Record<string, ServiceLimitRule> = {
  // Hệ số x3: dự trù khách ăn khỏe gọi thêm 2-3 suất/người/đêm
  D001: {
    max: (c) => c.sucChua * c.soDem * 3,
    label: (c) => `${c.sucChua} người × ${c.soDem} đêm × 3 = ${c.sucChua * c.soDem * 3}`,
  },
  D002: perOrder(4, 'chuyến'),
  D003: perOrder(4, 'chuyến'),
  D004: perNight(4, 'xe'),
  D005: perNight(20, 'kg'),
  D006: perNight(1, 'giường'),
  D007: perNight(5, 'set'),
  D008: perOrder(5, 'giờ'),
  D009: perOrder(5, 'giờ'),
  D010: perOrder(1, 'lần'),
  D011: perNight(1, 'bộ'),
  D012: perNight(10, 'combo'),
};

// Dịch vụ do quản lý tự tạo thêm (D013+) chưa có quy tắc -> chặn cứng để tránh gõ nhầm hàng nghìn
export const DEFAULT_SERVICE_MAX = 50;

export const getServiceMaxQuantity = (maDV: string, sucChua: number, soDem: number): number => {
  const ctx = { sucChua: Math.max(1, sucChua || 1), soDem: Math.max(1, soDem || 1) };
  const rule = SERVICE_LIMIT_RULES[maDV];
  return rule ? rule.max(ctx) : DEFAULT_SERVICE_MAX;
};

export const getServiceLimitLabel = (maDV: string, sucChua: number, soDem: number): string => {
  const ctx = { sucChua: Math.max(1, sucChua || 1), soDem: Math.max(1, soDem || 1) };
  const rule = SERVICE_LIMIT_RULES[maDV];
  return rule ? rule.label(ctx) : `${DEFAULT_SERVICE_MAX} / đơn`;
};

// Tổng SL đã có của maDV trong đơn (loại trừ 1 dòng khi đang sửa số lượng dòng đó)
export const getUsedServiceQuantity = (
  items: ChiTietDichVu[],
  maDon: string,
  maDV: string,
  excludeItemId?: string
): number =>
  items
    .filter((x) => x.MaDon === maDon && x.MaDV === maDV && x.id !== excludeItemId)
    .reduce((s, x) => s + x.SoLuong, 0);

// Kiểm tra dùng chung: trả về chuỗi lỗi hoặc null nếu hợp lệ
export const validateServiceQuantity = (params: {
  items: ChiTietDichVu[];
  maDon: string;
  maDV: string;
  tenDV: string;
  soLuong: number;
  sucChua: number;
  soDem: number;
  excludeItemId?: string;
}): string | null => {
  const { items, maDon, maDV, tenDV, soLuong, sucChua, soDem, excludeItemId } = params;
  const max = getServiceMaxQuantity(maDV, sucChua, soDem);
  const used = getUsedServiceQuantity(items, maDon, maDV, excludeItemId);
  if (used + soLuong > max) {
    const left = Math.max(0, max - used);
    return `Vượt giới hạn dịch vụ "${tenDV}": tối đa ${max} (${getServiceLimitLabel(maDV, sucChua, soDem)}), đơn đã có ${used}, chỉ còn thêm được ${left}.`;
  }
  return null;
};

// =====================================================================
// ===== RÀNG BUỘC NGÀY & TIỀN ==========================================
// =====================================================================
export const MAX_SERVICE_PRICE = 10_000_000;

// Trả về chuỗi lỗi hoặc null. allowPast=true khi cập nhật đơn cũ (ngày nhận có thể đã qua)
export const validateStayDates = (checkIn: string, checkOut: string, allowPast = false): string | null => {
  if (!checkIn || !checkOut) return 'Vui lòng chọn đầy đủ ngày nhận và ngày trả phòng.';
  if (isNaN(new Date(checkIn).getTime()) || isNaN(new Date(checkOut).getTime())) return 'Ngày không hợp lệ.';
  if (checkOut <= checkIn) return 'Ngày nhận phòng phải trước ngày trả phòng (tối thiểu 1 đêm).';
  const today = new Date().toISOString().split('T')[0];
  if (!allowPast && checkIn < today) return 'Ngày nhận phòng không được ở quá khứ.';
  return null;
};

// Số tiền thực nhận tối thiểu khi đặt cọc = 30% tiền phòng (làm tròn nghìn)
export const getMinDepositAmount = (tienPhong: number): number => calculateDeposit(tienPhong, 0.3);

// Tất toán: phải thu đủ phần còn lại (đơn được chốt "Đã thanh toán"); đồng thời luôn >= 30% tiền phòng
// khi tổng đã thu (cọc + thực nhận) được tính -> kiểm tra song song để đồng bộ với đặt cọc.
export const validateSettlementAmount = (params: {
  amount: number;
  tienPhong: number;
  daThu: number;
  conLai: number;
}): string | null => {
  const { amount, tienPhong, daThu, conLai } = params;
  if (!Number.isFinite(amount) || amount < 0) return 'Số tiền thực nhận không hợp lệ.';
  if (amount < conLai) return `Số tiền thực nhận phải ≥ số còn lại cần thu (${formatVND(conLai)}).`;
  if (amount > conLai) return `Số tiền thực nhận không được vượt quá số còn lại (${formatVND(conLai)}).`;
  const min30 = getMinDepositAmount(tienPhong);
  if (daThu + amount < min30) return `Tổng đã thu phải ≥ 30% tiền phòng (${formatVND(min30)}).`;
  return null;
};
