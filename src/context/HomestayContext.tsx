import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Phong,
  NguoiDung,
  KhachHang,
  DichVu,
  DonDatPhong,
  PhieuThanhToan,
  ChiTietDichVu,
  HoaDon,
  BankConfig,
  PhuongThucThanhToan,
} from '../types';
import {
  INITIAL_ROOMS,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_SERVICES,
  INITIAL_BOOKINGS,
  INITIAL_PAYMENT_RECEIPTS,
  INITIAL_SERVICE_ITEMS,
  INITIAL_INVOICES,
  INITIAL_BANK_CONFIG,
} from '../data/initialData';
import {
  calculateNights,
  calculateDeposit,
  isEligibleForRefund48Hours,
  generateMaDon,
  generateMaPhieu,
  generateMaHoaDon,
  generateMaKH,
  generateMaDV,
  canEditBookingServices,
  getServiceLockReason,
  isServiceAllowedAtStatus,
  sumServiceAmount,
  validateServiceQuantity,
  validateStayDates,
  validateSettlementAmount,
  getUsedServiceQuantity,
  MAX_SERVICE_PRICE,
} from '../utils/helpers';

interface HomestayContextType {
  currentUser: NguoiDung | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  register: (hoTen: string, email: string, matKhau: string, vaiTro?: 'Quản lý' | 'Admin') => boolean;
  switchUser: (maND: string) => void;
  users: NguoiDung[];

  rooms: Phong[];
  customers: KhachHang[];
  services: DichVu[];
  bookings: DonDatPhong[];
  serviceItems: ChiTietDichVu[];
  paymentReceipts: PhieuThanhToan[];
  invoices: HoaDon[];
  bankConfig: BankConfig;
  updateBankConfig: (config: BankConfig) => void;

  // Bookings actions
  createBooking: (data: {
    maPhong: string;
    maKH?: string;
    newCustomer?: { hoTen: string; soDienThoai: string; cccd?: string; email?: string; diaChi?: string; ghiChu?: string };
    ngayNhanPhong: string;
    ngayTraPhong: string;
    soKhach: number;
    yeuCauDacBiet?: string;
  }) => { success: boolean; message: string; maDon?: string };

  confirmDeposit: (
    maDon: string,
    phuongThuc: PhuongThucThanhToan,
    soTien: number,
    maGiaoDich?: string,
    ghiChu?: string
  ) => { success: boolean; message: string; receipt?: PhieuThanhToan };

  updateBooking: (
    maDon: string,
    data: {
      maPhong?: string;
      ngayNhanPhong?: string;
      ngayTraPhong?: string;
      soKhach?: number;
      yeuCauDacBiet?: string;
    }
  ) => { success: boolean; message: string };

  cancelBooking: (maDon: string, lyDo?: string) => { success: boolean; message: string; eligibleForRefund?: boolean };

  processRefund: (
    maDon: string,
    maGiaoDichHoan?: string,
    ghiChu?: string
  ) => { success: boolean; message: string; receipt?: PhieuThanhToan };

  checkInBooking: (
    maDon: string,
    applyEarlyFee?: boolean
  ) => { success: boolean; message: string };

  noShowBooking: (maDon: string) => { success: boolean; message: string };

  checkOutBooking: (
    maDon: string,
    phuongThuc: PhuongThucThanhToan,
    maGiaoDich?: string,
    applyLateFee?: boolean,
    ghiChu?: string,
    soTienThucNhan?: number // số tiền thực nhận khi tất toán (kiểm tra >= còn lại & >= 30% tiền phòng)
  ) => { success: boolean; message: string; invoice?: HoaDon };

  cleanRoom: (maPhong: string) => { success: boolean; message: string };

  // Services actions
  createService: (data: Omit<DichVu, 'MaDV'>) => { success: boolean; message: string };
  updateService: (maDV: string, data: Partial<DichVu>) => { success: boolean; message: string };
  toggleServiceStatus: (maDV: string) => { success: boolean; message: string };
  addServiceToBooking: (
    maDon: string,
    maDV: string,
    soLuong: number,
    ghiChu?: string
  ) => { success: boolean; message: string };
  updateServiceItemQuantity: (id: string, soLuong: number) => { success: boolean; message: string };
  removeServiceFromBooking: (id: string) => { success: boolean; message: string };

  // Customer actions
  createCustomer: (data: Omit<KhachHang, 'MaKH'>) => { success: boolean; message: string; maKH?: string };
  updateCustomer: (maKH: string, data: Partial<KhachHang>) => { success: boolean; message: string };

  // Database actions
  resetDatabase: () => void;
  getRawSQL: () => string;

  // View helpers
  checkRoomAvailability: (maPhong: string, checkIn: string, checkOut: string, excludeMaDon?: string) => boolean;
  getAvailableRoomsForDates: (checkIn: string, checkOut: string, capacity?: number, excludeMaDon?: string) => Phong[];
  getBookingDetails: (maDon: string) => DonDatPhong | undefined;
}

const HomestayContext = createContext<HomestayContextType | null>(null);

const STORAGE_PREFIX = 'chicstay_seed2025_';

export const HomestayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence state
  const [users, setUsers] = useState<NguoiDung[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<NguoiDung | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}current_user`);
    return saved
      ? JSON.parse(saved)
      : (INITIAL_USERS.find((u) => u.Email === 'haiyen05tb@gmail.com') || INITIAL_USERS[0]);
  });

  const [rooms, setRooms] = useState<Phong[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}rooms`);
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [customers, setCustomers] = useState<KhachHang[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [services, setServices] = useState<DichVu[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}services`);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [bookings, setBookings] = useState<DonDatPhong[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}bookings`);
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const serviceItemsRef = useRef<ChiTietDichVu[]>([]);
  const [serviceItems, setServiceItems] = useState<ChiTietDichVu[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}service_items`);
    return saved ? JSON.parse(saved) : INITIAL_SERVICE_ITEMS;
  });
  serviceItemsRef.current = serviceItems;

  const [paymentReceipts, setPaymentReceipts] = useState<PhieuThanhToan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}payment_receipts`);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_RECEIPTS;
  });

  const [invoices, setInvoices] = useState<HoaDon[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [bankConfig, setBankConfig] = useState<BankConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}bank_config`);
    return saved ? JSON.parse(saved) : INITIAL_BANK_CONFIG;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}current_user`, JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}rooms`, JSON.stringify(rooms));
  }, [rooms]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}services`, JSON.stringify(services));
  }, [services]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}bookings`, JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    serviceItemsRef.current = serviceItems;
    localStorage.setItem(`${STORAGE_PREFIX}service_items`, JSON.stringify(serviceItems));
  }, [serviceItems]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}payment_receipts`, JSON.stringify(paymentReceipts));
  }, [paymentReceipts]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}invoices`, JSON.stringify(invoices));
  }, [invoices]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}bank_config`, JSON.stringify(bankConfig));
  }, [bankConfig]);

  // Auth methods
  const login = (email: string, pass: string): boolean => {
    const user = users.find((u) => u.Email.toLowerCase() === email.trim().toLowerCase() && u.MatKhau === pass);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = (hoTen: string, email: string, matKhau: string, vaiTro: 'Quản lý' | 'Admin' = 'Quản lý'): boolean => {
    const exists = users.some((u) => u.Email.toLowerCase() === email.trim().toLowerCase());
    if (exists) return false;
    const nextMaND = `ND${(users.length + 1).toString().padStart(3, '0')}`;
    const newUser: NguoiDung = {
      MaND: nextMaND,
      HoTen: hoTen.trim(),
      Email: email.trim(),
      VaiTro: vaiTro,
      MatKhau: matKhau,
    };
    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    setCurrentUser(newUser);
    return true;
  };

  const switchUser = (maND: string) => {
    const u = users.find((x) => x.MaND === maND);
    if (u) setCurrentUser(u);
  };

  const updateBankConfig = (config: BankConfig) => {
    setBankConfig(config);
  };

  // Check Room Availability
  const checkRoomAvailability = (maPhong: string, checkIn: string, checkOut: string, excludeMaDon?: string): boolean => {
    const targetStart = new Date(checkIn).getTime();
    const targetEnd = new Date(checkOut).getTime();

    // Check against active bookings
    for (const b of bookings) {
      if (b.MaPhong !== maPhong) continue;
      if (excludeMaDon && b.MaDon === excludeMaDon) continue;
      // Skip cancelled or no-show bookings
      if (b.TrangThaiDon === 'Đã hủy' || b.TrangThaiDon === 'No-show') continue;

      const bStart = new Date(b.NgayNhanPhong).getTime();
      const bEnd = new Date(b.NgayTraPhong).getTime();

      // Overlap condition: targetStart < bEnd AND targetEnd > bStart
      if (targetStart < bEnd && targetEnd > bStart) {
        return false;
      }
    }
    return true;
  };

  const getAvailableRoomsForDates = (checkIn: string, checkOut: string, capacity?: number, excludeMaDon?: string): Phong[] => {
    if (!checkIn || !checkOut) return rooms;
    return rooms.filter((r) => {
      if (capacity && r.SucChua < capacity) return false;
      return checkRoomAvailability(r.MaPhong, checkIn, checkOut, excludeMaDon);
    });
  };

  // Helper: get enriched booking
  const getBookingDetails = (maDon: string): DonDatPhong | undefined => {
    const b = bookings.find((x) => x.MaDon === maDon);
    if (!b) return undefined;
    const kh = customers.find((c) => c.MaKH === b.MaKH);
    const p = rooms.find((r) => r.MaPhong === b.MaPhong);
    const dv = serviceItems.filter((s) => s.MaDon === b.MaDon);
    return {
      ...b,
      tenKhachHang: kh?.HoTen,
      soDienThoai: kh?.SoDienThoai,
      tenPhong: p?.TenPhong,
      loaiPhong: p?.LoaiPhong,
      dichVuList: dv,
    };
  };

  // UC-1.1: Tạo đơn đặt phòng
  const createBooking = (data: {
    maPhong: string;
    maKH?: string;
    newCustomer?: { hoTen: string; soDienThoai: string; cccd?: string; email?: string; diaChi?: string; ghiChu?: string };
    ngayNhanPhong: string;
    ngayTraPhong: string;
    soKhach: number;
    yeuCauDacBiet?: string;
  }): { success: boolean; message: string; maDon?: string } => {
      // Kiểm tra và chuẩn hóa thông tin khách hàng mới
    if (data.newCustomer) {
      const customer = data.newCustomer;
      const hoTen = customer.hoTen.trim();
      const soDienThoai = customer.soDienThoai.trim().replace(/^\+84/, '0');
      const cccd = customer.cccd?.trim() || undefined;
      const email = customer.email?.trim() || undefined;

      if (
        !hoTen ||
        hoTen.length > 100 ||
        !/^[\p{L}\p{M} '’-]+$/u.test(hoTen) ||
        !/\p{L}/u.test(hoTen)
      ) {
        return {
          success: false,
          message: 'Họ tên không hợp lệ: phải có chữ cái, tối đa 100 ký tự.',
        };
      }

      if (!/^0[0-9]{9}$/.test(soDienThoai)) {
        return {
          success: false,
          message: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.',
        };
      }

      if (cccd && !/^[0-9]{12}$/.test(cccd)) {
        return {
          success: false,
          message: 'CCCD phải gồm đúng 12 chữ số hoặc để trống.',
        };
      }

      if (
        email &&
        (email.length > 100 ||
          !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email))
      ) {
        return {
          success: false,
          message: 'Email không hợp lệ hoặc vượt quá 100 ký tự.',
        };
      }

      // Dùng dữ liệu đã chuẩn hóa cho phần tạo khách hàng phía dưới
      data = {
        ...data,
        newCustomer: {
          ...customer,
          hoTen,
          soDienThoai,
          cccd,
          email,
        },
      };
    }
    // 0. Validate ngày (nhận < trả, không ở quá khứ)
    const dateErr = validateStayDates(data.ngayNhanPhong, data.ngayTraPhong);
    if (dateErr) return { success: false, message: dateErr };

    // 1. Verify availability
    const isAvail = checkRoomAvailability(data.maPhong, data.ngayNhanPhong, data.ngayTraPhong);
    if (!isAvail) {
      return { success: false, message: 'Phòng đã có đơn đặt trong khoảng thời gian này. Vui lòng chọn phòng hoặc ngày khác!' };
    }

    const room = rooms.find((r) => r.MaPhong === data.maPhong);
    if (!room) return { success: false, message: 'Không tìm thấy thông tin phòng đã chọn.' };
    if (!Number.isInteger(data.soKhach) || data.soKhach < 1) {
      return { success: false, message: 'Số khách phải là số nguyên từ 1 trở lên.' };
    }
    if (data.soKhach > room.SucChua) {
      return { success: false, message: `Phòng ${room.MaPhong} chỉ chứa tối đa ${room.SucChua} khách (đang nhập ${data.soKhach}).` };
    }

    // 2. Handle customer
    let targetMaKH = data.maKH;

    if (!targetMaKH && data.newCustomer) {
      const customer = data.newCustomer;

      // Chỉ kiểm tra trùng khi có CCCD
      if (
        customer.cccd &&
        customers.some((c) => c.CCCD === customer.cccd)
      ) {
        return {
          success: false,
          message: 'CCCD đã tồn tại. Vui lòng chọn khách hàng có sẵn.',
        };
      }

      // Cho phép trùng SĐT vì khách có thể dùng chung số liên hệ
      const newCode = generateMaKH(customers.map((c) => c.MaKH));

      const newCust: KhachHang = {
        MaKH: newCode,
        HoTen: customer.hoTen,
        SoDienThoai: customer.soDienThoai,
        CCCD: customer.cccd,
        Email: customer.email,
        DiaChi: customer.diaChi,
        GhiChu: customer.ghiChu,
      };

      setCustomers((prev) => [...prev, newCust]);
      targetMaKH = newCode;
    }

    if (!targetMaKH) {
      return {
        success: false,
        message: 'Vui lòng chọn hoặc nhập thông tin khách hàng.',
      };
    }

    // 3. Calculate finances
    const nights = calculateNights(data.ngayNhanPhong, data.ngayTraPhong);
    const tienPhong = room.GiaPhong * nights;
    const tienCocYeuCau = calculateDeposit(tienPhong, 0.3);
    const tongTien = tienPhong; // initially no extra service
    const conLai = tongTien;

    const maDon = generateMaDon(bookings.map((b) => b.MaDon));
    const newBooking: DonDatPhong = {
      MaDon: maDon,
      MaND: currentUser?.MaND || 'ND001',
      MaKH: targetMaKH,
      MaPhong: data.maPhong,
      NgayNhanPhong: data.ngayNhanPhong,
      NgayTraPhong: data.ngayTraPhong,
      SoKhach: data.soKhach,
      SoDem: nights,
      TienPhong: tienPhong,
      TienCocYeuCau: tienCocYeuCau,
      TienDichVu: 0,
      TongTien: tongTien,
      DaThu: 0,
      ConLai: conLai,
      TrangThaiDon: 'Chờ đặt cọc',
      TrangThaiThanhToan: 'Chưa thanh toán',
      ThoiGianTaoDon: new Date().toISOString(),
      YeuCauDacBiet: data.yeuCauDacBiet,
    };

    // Update Room to 'Tạm giữ'
    setRooms((prev) =>
      prev.map((r) => (r.MaPhong === data.maPhong ? { ...r, TrangThaiPhong: 'Tạm giữ' } : r))
    );

    setBookings((prev) => [newBooking, ...prev]);

    return {
      success: true,
      message: `Tạo đơn đặt phòng ${maDon} thành công! Số tiền cọc cần thu: ${tienCocYeuCau.toLocaleString('vi-VN')} ₫ (30%).`,
      maDon: maDon,
    };
  };

  // UC-1.2 & UC-3.1: Ghi nhận đặt cọc và xác nhận đơn
  const confirmDeposit = (
    maDon: string,
    phuongThuc: PhuongThucThanhToan,
    soTien: number,
    maGiaoDich?: string,
    ghiChu?: string
  ): { success: boolean; message: string; receipt?: PhieuThanhToan } => {
    const booking = bookings.find((b) => b.MaDon === maDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };

    if (booking.TrangThaiDon !== 'Chờ đặt cọc') {
      return { success: false, message: `Đơn đặt phòng đang ở trạng thái "${booking.TrangThaiDon}", không thể thu cọc.` };
    }

    if (soTien < booking.TienCocYeuCau) {
      return {
        success: false,
        message: `Số tiền cọc thực nhận (${soTien.toLocaleString('vi-VN')} ₫) chưa đủ 30% tiền phòng (${booking.TienCocYeuCau.toLocaleString('vi-VN')} ₫).`,
      };
    }

    // MAX: không thu cọc vượt quá tổng tiền còn lại của đơn
    if (soTien > booking.TongTien - booking.DaThu) {
      return {
        success: false,
        message: `Số tiền cọc (${soTien.toLocaleString('vi-VN')} ₫) vượt quá tổng tiền đơn (${booking.TongTien.toLocaleString('vi-VN')} ₫).`,
      };
    }

    const maPhieu = generateMaPhieu(paymentReceipts.map((p) => p.MaPhieu));
    const receipt: PhieuThanhToan = {
      MaPhieu: maPhieu,
      MaDon: maDon,
      LoaiPhieu: 'Cọc',
      SoTien: soTien,
      PhuongThuc: phuongThuc,
      MaGiaoDichNganHang: maGiaoDich,
      TrangThaiThanhToan: 'Đã đặt cọc',
      NgayLap: new Date().toISOString(),
      NguoiLap: currentUser?.MaND || 'ND001',
      GhiChu: ghiChu || `Ghi nhận đặt cọc 30% qua ${phuongThuc}`,
    };

    const newDaThu = booking.DaThu + soTien;
    const newConLai = Math.max(0, booking.TongTien - newDaThu);

    // Atomically update
    setPaymentReceipts((prev) => [receipt, ...prev]);

    setBookings((prev) =>
      prev.map((b) =>
        b.MaDon === maDon
          ? {
              ...b,
              DaThu: newDaThu,
              ConLai: newConLai,
              TrangThaiDon: 'Đã xác nhận',
              TrangThaiThanhToan: 'Đã đặt cọc',
            }
          : b
      )
    );

    setRooms((prev) =>
      prev.map((r) => (r.MaPhong === booking.MaPhong ? { ...r, TrangThaiPhong: 'Đã được đặt' } : r))
    );

    return {
      success: true,
      message: `Xác nhận đặt cọc thành công! Đã lập phiếu ${maPhieu}. Đơn chuyển sang "Đã xác nhận".`,
      receipt,
    };
  };

  // UC-1.3: Cập nhật đơn đặt phòng
  const updateBooking = (
    maDon: string,
    data: {
      maPhong?: string;
      ngayNhanPhong?: string;
      ngayTraPhong?: string;
      soKhach?: number;
      yeuCauDacBiet?: string;
    }
  ): { success: boolean; message: string } => {
    const booking = bookings.find((b) => b.MaDon === maDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };

    if (booking.TrangThaiDon !== 'Chờ đặt cọc' && booking.TrangThaiDon !== 'Đã xác nhận') {
      return { success: false, message: 'Chỉ có thể cập nhật đơn chưa check-in (Chờ đặt cọc hoặc Đã xác nhận).' };
    }

    const FAIL = 'Không đủ điều kiện thay đổi';
    const newPhong = data.maPhong || booking.MaPhong;
    const newNhan = data.ngayNhanPhong || booking.NgayNhanPhong;
    const newTra = data.ngayTraPhong || booking.NgayTraPhong;
    const newKhach = data.soKhach ?? booking.SoKhach;

    // Ngày hợp lệ (cho phép ngày nhận đã qua nếu không đổi ngày nhận)
    const dateErr = validateStayDates(newNhan, newTra, newNhan === booking.NgayNhanPhong);
    if (dateErr) return { success: false, message: `${FAIL}: ${dateErr}` };

    const targetRoom = rooms.find((r) => r.MaPhong === newPhong);
    if (!targetRoom) return { success: false, message: `${FAIL}: không tìm thấy phòng ${newPhong}.` };
    if (!Number.isInteger(newKhach) || newKhach < 1) {
      return { success: false, message: `${FAIL}: số khách phải là số nguyên ≥ 1.` };
    }
    if (newKhach > targetRoom.SucChua) {
      return { success: false, message: `${FAIL}: phòng ${newPhong} chỉ chứa tối đa ${targetRoom.SucChua} khách.` };
    }

    // Luôn kiểm tra phòng trống (loại trừ chính đơn này) khi đổi phòng/ngày
    if (newPhong !== booking.MaPhong || newNhan !== booking.NgayNhanPhong || newTra !== booking.NgayTraPhong) {
      const isAvail = checkRoomAvailability(newPhong, newNhan, newTra, maDon);
      if (!isAvail) {
        return { success: false, message: `${FAIL}: phòng ${newPhong} đã có đơn khác trong khoảng ${newNhan} → ${newTra}.` };
      }
    }

    // Dịch vụ đã thêm phải còn nằm trong giới hạn mới (đổi số đêm / đổi phòng làm đổi giới hạn)
    const newNights = calculateNights(newNhan, newTra);
    const itemsOfBooking = serviceItemsRef.current.filter((x) => x.MaDon === maDon);
    for (const maDV of Array.from(new Set(itemsOfBooking.map((x) => x.MaDV)))) {
      const used = getUsedServiceQuantity(serviceItemsRef.current, maDon, maDV);
      const err = validateServiceQuantity({
        items: serviceItemsRef.current.filter((x) => x.MaDV !== maDV || x.MaDon !== maDon),
        maDon, maDV,
        tenDV: itemsOfBooking.find((x) => x.MaDV === maDV)!.TenDichVu,
        soLuong: used, sucChua: targetRoom.SucChua, soDem: newNights,
      });
      if (err) return { success: false, message: `${FAIL}: ${err}` };
    }

    const room = targetRoom;
    const nights = newNights;
    const roomPrice = room ? room.GiaPhong * nights : booking.TienPhong;
    const newDepositReq = calculateDeposit(roomPrice, 0.3);
    const newTongTien = roomPrice + booking.TienDichVu;
    const newConLai = Math.max(0, newTongTien - booking.DaThu);

    // If room changed, adjust old room state and new room state
    if (newPhong !== booking.MaPhong) {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.MaPhong === booking.MaPhong) return { ...r, TrangThaiPhong: 'Sẵn sàng' };
          if (r.MaPhong === newPhong)
            return {
              ...r,
              TrangThaiPhong: booking.TrangThaiDon === 'Đã xác nhận' ? 'Đã được đặt' : 'Tạm giữ',
            };
          return r;
        })
      );
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.MaDon === maDon
          ? {
              ...b,
              MaPhong: newPhong,
              NgayNhanPhong: newNhan,
              NgayTraPhong: newTra,
              SoKhach: data.soKhach ?? b.SoKhach,
              SoDem: nights,
              TienPhong: roomPrice,
              TienCocYeuCau: newDepositReq,
              TongTien: newTongTien,
              ConLai: newConLai,
              YeuCauDacBiet: data.yeuCauDacBiet ?? b.YeuCauDacBiet,
            }
          : b
      )
    );

    return { success: true, message: `Cập nhật đơn đặt phòng ${maDon} thành công.` };
  };

  // UC-1.4: Hủy đơn đặt phòng
  const cancelBooking = (maDon: string, lyDo?: string): { success: boolean; message: string; eligibleForRefund?: boolean } => {
    const booking = bookings.find((b) => b.MaDon === maDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };

    if (booking.TrangThaiDon === 'Đã check-in') {
      return { success: false, message: 'Đơn đã check-in không được phép hủy! Phải tiếp tục quy trình Check-out.' };
    }
    if (booking.TrangThaiDon === 'Đã hoàn thành' || booking.TrangThaiDon === 'Đã hủy') {
      return { success: false, message: 'Đơn đã kết thúc hoặc đã hủy trước đó.' };
    }

    // 1. Chưa cọc (Chờ đặt cọc)
    if (booking.TrangThaiDon === 'Chờ đặt cọc' || booking.DaThu === 0) {
      setBookings((prev) =>
        prev.map((b) =>
          b.MaDon === maDon
            ? { ...b, TrangThaiDon: 'Đã hủy', YeuCauDacBiet: `${b.YeuCauDacBiet || ''} [Hủy: ${lyDo || 'Khách hủy hoặc quá hạn cọc'}]` }
            : b
        )
      );
      setRooms((prev) =>
        prev.map((r) => (r.MaPhong === booking.MaPhong ? { ...r, TrangThaiPhong: 'Sẵn sàng' } : r))
      );
      return { success: true, message: `Đã hủy đơn ${maDon}. Phòng được giải phóng. Không phát sinh hoàn cọc.`, eligibleForRefund: false };
    }

    // 2. Đã cọc -> Kiểm tra điều kiện 48h
    const eligible = isEligibleForRefund48Hours(booking.NgayNhanPhong);

    setBookings((prev) =>
      prev.map((b) =>
        b.MaDon === maDon
          ? {
              ...b,
              TrangThaiDon: 'Đã hủy',
              YeuCauDacBiet: `${b.YeuCauDacBiet || ''} [Hủy: ${lyDo || 'Theo yêu cầu khách'}. ${eligible ? 'Đủ điều kiện hoàn cọc' : 'Không hoàn cọc (< 48h)'}]`,
            }
          : b
      )
    );

    // Giải phóng phòng
    setRooms((prev) =>
      prev.map((r) =>
        r.MaPhong === booking.MaPhong
          ? { ...r, TrangThaiPhong: eligible ? 'Sẵn sàng' : 'Chờ dọn phòng' }
          : r
      )
    );

    if (eligible) {
      return {
        success: true,
        message: `Đã hủy đơn ${maDon}. Đơn đủ điều kiện HOÀN CỌC (hủy trước >= 48 giờ). Vui lòng chuyển khoản hoàn tiền và xác nhận ở chức năng Xử lý hoàn cọc.`,
        eligibleForRefund: true,
      };
    } else {
      return {
        success: true,
        message: `Đã hủy đơn ${maDon}. Hủy dưới 48 giờ trước giờ check-in: KHÔNG HOÀN CỌC theo chính sách. Homestay giữ lại khoản cọc.`,
        eligibleForRefund: false,
      };
    }
  };

  // UC-3.3: Xử lý hoàn cọc (lập phiếu Hoàn cọc)
  const processRefund = (
    maDon: string,
    maGiaoDichHoan?: string,
    ghiChu?: string
  ): { success: boolean; message: string; receipt?: PhieuThanhToan } => {
    const booking = bookings.find((b) => b.MaDon === maDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };

    if (booking.TrangThaiDon !== 'Đã hủy') {
      return { success: false, message: 'Chỉ có thể xử lý hoàn cọc cho đơn ở trạng thái Đã hủy.' };
    }
    if (booking.TrangThaiThanhToan === 'Đã hoàn tiền') {
      return { success: false, message: 'Đơn này đã được lập phiếu hoàn cọc trước đó!' };
    }
    if (booking.DaThu <= 0) {
      return { success: false, message: 'Đơn chưa có khoản tiền cọc nào được ghi nhận.' };
    }

    const maPhieu = generateMaPhieu(paymentReceipts.map((p) => p.MaPhieu));
    const refundReceipt: PhieuThanhToan = {
      MaPhieu: maPhieu,
      MaDon: maDon,
      LoaiPhieu: 'Hoàn cọc',
      SoTien: booking.DaThu,
      PhuongThuc: 'VietQR',
      MaGiaoDichNganHang: maGiaoDichHoan,
      TrangThaiThanhToan: 'Đã hoàn tiền',
      NgayLap: new Date().toISOString(),
      NguoiLap: currentUser?.MaND || 'ND001',
      GhiChu: ghiChu || `Hoàn cọc theo chính sách hủy trước >= 48h`,
    };

    setPaymentReceipts((prev) => [refundReceipt, ...prev]);

    setBookings((prev) =>
      prev.map((b) =>
        b.MaDon === maDon
          ? {
              ...b,
              TrangThaiThanhToan: 'Đã hoàn tiền',
            }
          : b
      )
    );

    return {
      success: true,
      message: `Đã lập phiếu Hoàn cọc ${maPhieu} (${booking.DaThu.toLocaleString('vi-VN')} ₫). Trạng thái thanh toán: Đã hoàn tiền.`,
      receipt: refundReceipt,
    };
  };

  // UC-1.5: Thực hiện Check-in
  const checkInBooking = (
    maDon: string,
    applyEarlyFee = false
  ): { success: boolean; message: string } => {
    const booking = bookings.find((b) => b.MaDon === maDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };

    if (booking.TrangThaiDon !== 'Đã xác nhận') {
      return { success: false, message: 'Chỉ có thể check-in đối với đơn ở trạng thái "Đã xác nhận".' };
    }

    let extraServiceFee = 0;
    // Nếu đơn đã có D008 (quản lý thêm thủ công) thì KHÔNG cộng thêm lần nữa
    const alreadyHasD008 = serviceItemsRef.current.some((x) => x.MaDon === maDon && x.MaDV === 'D008');
    // Early check-in fee D008: 150.000đ
    if (applyEarlyFee && !alreadyHasD008) {
      const d008 = services.find((s) => s.MaDV === 'D008') || {
        MaDV: 'D008',
        TenDichVu: 'Phụ thu nhận phòng sớm (trước 14:00)',
        DonGia: 150000,
      };
      extraServiceFee = d008.DonGia;
      const newServiceItem: ChiTietDichVu = {
        id: `ct-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        MaDon: maDon,
        MaDV: 'D008',
        TenDichVu: d008.TenDichVu,
        SoLuong: 1,
        DonGiaTaiThoiDiem: d008.DonGia,
        ThanhTien: d008.DonGia,
        ThoiDiemThem: new Date().toISOString(),
        GhiChu: 'Phụ thu check-in sớm trước 14:00',
        GiaiDoan: 'In-house',
      };
      commitServiceItems((prev) => [...prev, newServiceItem]);
    }

    const newTienDichVu = booking.TienDichVu + extraServiceFee;
    const newTongTien = booking.TienPhong + newTienDichVu;
    const newConLai = Math.max(0, newTongTien - booking.DaThu);

    setBookings((prev) =>
      prev.map((b) =>
        b.MaDon === maDon
          ? {
              ...b,
              TrangThaiDon: 'Đã check-in',
              ThoiGianCheckInThucTe: new Date().toISOString(),
              TienDichVu: newTienDichVu,
              TongTien: newTongTien,
              ConLai: newConLai,
            }
          : b
      )
    );

    setRooms((prev) =>
      prev.map((r) => (r.MaPhong === booking.MaPhong ? { ...r, TrangThaiPhong: 'Đang sử dụng' } : r))
    );

    return {
      success: true,
      message: `Check-in thành công cho đơn ${maDon}! Phòng chuyển sang "Đang sử dụng".${applyEarlyFee && !alreadyHasD008 ? ' (Đã áp dụng phụ thu D008: 150.000 ₫)' : ''}`,
    };
  };

  // Xử lý No-show
  const noShowBooking = (maDon: string): { success: boolean; message: string } => {
    const booking = bookings.find((b) => b.MaDon === maDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };

    setBookings((prev) =>
      prev.map((b) =>
        b.MaDon === maDon
          ? {
              ...b,
              TrangThaiDon: 'No-show',
              YeuCauDacBiet: `${b.YeuCauDacBiet || ''} [Khách không đến nhận phòng, giữ cọc theo quy định]`,
            }
          : b
      )
    );

    setRooms((prev) =>
      prev.map((r) => (r.MaPhong === booking.MaPhong ? { ...r, TrangThaiPhong: 'Chờ dọn phòng' } : r))
    );

    return {
      success: true,
      message: `Đã xác nhận đơn ${maDon} là No-show. Phòng chuyển sang "Chờ dọn phòng". Tiền cọc được giữ lại.`,
    };
  };

  // UC-1.6 & UC-3.2: Check-out và Tất toán
  const checkOutBooking = (
    maDon: string,
    phuongThuc: PhuongThucThanhToan,
    maGiaoDich?: string,
    applyLateFee = false,
    ghiChu?: string,
    soTienThucNhan?: number
  ): { success: boolean; message: string; invoice?: HoaDon } => {
    const booking = bookings.find((b) => b.MaDon === maDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };

    if (booking.TrangThaiDon !== 'Đã check-in') {
      return { success: false, message: 'Chỉ có thể check-out cho đơn đang ở trạng thái "Đã check-in".' };
    }

    let extraServiceFee = 0;
    let lateItem: ChiTietDichVu | null = null;
    // Nếu đơn đã có D009 (quản lý thêm thủ công) thì KHÔNG cộng thêm lần nữa
    const alreadyHasD009 = serviceItemsRef.current.some((x) => x.MaDon === maDon && x.MaDV === 'D009');
    const willApplyLate = applyLateFee && !alreadyHasD009;

    // Kiểm tra số tiền thực nhận TRƯỚC khi ghi bất kỳ dữ liệu nào (tránh commit dở dang)
    if (soTienThucNhan !== undefined) {
      const dueNow = Math.max(0, booking.TongTien + (willApplyLate ? 150000 : 0) - booking.DaThu);
      const err = validateSettlementAmount({
        amount: soTienThucNhan, tienPhong: booking.TienPhong, daThu: booking.DaThu, conLai: dueNow,
      });
      if (err) return { success: false, message: err };
    }

    // Late checkout fee D009: 150.000đ
    if (willApplyLate) {
      const d009 = services.find((s) => s.MaDV === 'D009') || {
        MaDV: 'D009',
        TenDichVu: 'Phụ thu trả phòng muộn (sau 12:00)',
        DonGia: 150000,
      };
      extraServiceFee = d009.DonGia;
      lateItem = {
        id: `ct-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        MaDon: maDon,
        MaDV: 'D009',
        TenDichVu: d009.TenDichVu,
        SoLuong: 1,
        DonGiaTaiThoiDiem: d009.DonGia,
        ThanhTien: d009.DonGia,
        ThoiDiemThem: new Date().toISOString(),
        GhiChu: 'Phụ thu trả phòng muộn sau 12:00',
        GiaiDoan: 'In-house',
      };
      commitServiceItems((prev) => [...prev, lateItem!]);
    }

    const finalTienDichVu = booking.TienDichVu + extraServiceFee;
    const finalTongTien = booking.TienPhong + finalTienDichVu;
    const amountToSettle = Math.max(0, finalTongTien - booking.DaThu);

    // 1. Tạo Phiếu Tất toán
    const maPhieu = generateMaPhieu(paymentReceipts.map((p) => p.MaPhieu));
    const receipt: PhieuThanhToan = {
      MaPhieu: maPhieu,
      MaDon: maDon,
      LoaiPhieu: 'Tất toán',
      SoTien: amountToSettle,
      PhuongThuc: phuongThuc,
      MaGiaoDichNganHang: maGiaoDich,
      TrangThaiThanhToan: 'Đã thanh toán',
      NgayLap: new Date().toISOString(),
      NguoiLap: currentUser?.MaND || 'ND001',
      GhiChu: ghiChu || `Tất toán check-out qua ${phuongThuc}`,
    };

    // 2. Tạo Hóa đơn tổng hợp
    const maHoaDon = generateMaHoaDon(invoices.map((h) => h.MaHoaDon));
    const invoice: HoaDon = {
      MaHoaDon: maHoaDon,
      MaDon: maDon,
      TienPhong: booking.TienPhong,
      TienDichVu: finalTienDichVu,
      TienCocDaTra: booking.DaThu,
      TienThanhToanKhiCheckOut: amountToSettle,
      TongTienDaThanhToan: finalTongTien,
      PhuongThuc: phuongThuc,
      NgayXuat: new Date().toISOString(),
      NguoiXuat: currentUser?.MaND || 'ND001',
      GhiChu: ghiChu || `Hóa đơn tất toán check-out đơn ${maDon}`,
    };

    // Atomically commit
    setPaymentReceipts((prev) => [receipt, ...prev]);
    setInvoices((prev) => [invoice, ...prev]);

    setBookings((prev) =>
      prev.map((b) =>
        b.MaDon === maDon
          ? {
              ...b,
              TrangThaiDon: 'Đã hoàn thành',
              TrangThaiThanhToan: 'Đã thanh toán',
              ThoiGianCheckOutThucTe: new Date().toISOString(),
              TienDichVu: finalTienDichVu,
              TongTien: finalTongTien,
              DaThu: finalTongTien,
              ConLai: 0,
            }
          : b
      )
    );

    setRooms((prev) =>
      prev.map((r) => (r.MaPhong === booking.MaPhong ? { ...r, TrangThaiPhong: 'Chờ dọn phòng' } : r))
    );

    return {
      success: true,
      message: `Tất toán và Check-out thành công! Lập phiếu tất toán ${maPhieu} và Hóa đơn ${maHoaDon}. Phòng chuyển sang "Chờ dọn phòng".`,
      invoice,
    };
  };

  // Dọn phòng
  const cleanRoom = (maPhong: string): { success: boolean; message: string } => {
    setRooms((prev) =>
      prev.map((r) => (r.MaPhong === maPhong ? { ...r, TrangThaiPhong: 'Sẵn sàng' } : r))
    );
    return { success: true, message: `Phòng ${maPhong} đã được dọn sạch và chuyển về trạng thái "Sẵn sàng"!` };
  };

  // Quản lý Dịch vụ
  const createService = (data: Omit<DichVu, 'MaDV'>): { success: boolean; message: string } => {
    if (!data.TenDichVu?.trim()) return { success: false, message: 'Vui lòng nhập tên dịch vụ.' };
    if (!(data.DonGia > 0)) return { success: false, message: 'Đơn giá dịch vụ phải lớn hơn 0.' };
    if (data.DonGia > MAX_SERVICE_PRICE) {
      return { success: false, message: `Đơn giá dịch vụ không được vượt quá ${MAX_SERVICE_PRICE.toLocaleString('vi-VN')} ₫.` };
    }
    const maDV = generateMaDV(services.map((s) => s.MaDV));
    const newService: DichVu = {
      ...data,
      MaDV: maDV,
      TrangThai: 'Đang hoạt động',
    };
    setServices((prev) => [...prev, newService]);
    return { success: true, message: `Đã thêm mới dịch vụ ${newService.TenDichVu} (Mã: ${maDV}).` };
  };

  const updateService = (maDV: string, data: Partial<DichVu>): { success: boolean; message: string } => {
    if (data.DonGia !== undefined) {
      if (!(data.DonGia > 0)) return { success: false, message: 'Đơn giá dịch vụ phải lớn hơn 0.' };
      if (data.DonGia > MAX_SERVICE_PRICE) {
        return { success: false, message: `Đơn giá dịch vụ không được vượt quá ${MAX_SERVICE_PRICE.toLocaleString('vi-VN')} ₫.` };
      }
    }
    setServices((prev) => prev.map((s) => (s.MaDV === maDV ? { ...s, ...data } : s)));
    return { success: true, message: `Cập nhật dịch vụ ${maDV} thành công!` };
  };

  const toggleServiceStatus = (maDV: string): { success: boolean; message: string } => {
    let nextStatus: 'Đang hoạt động' | 'Ngừng hoạt động' = 'Đang hoạt động';
    setServices((prev) =>
      prev.map((s) => {
        if (s.MaDV === maDV) {
          nextStatus = s.TrangThai === 'Đang hoạt động' ? 'Ngừng hoạt động' : 'Đang hoạt động';
          return { ...s, TrangThai: nextStatus };
        }
        return s;
      })
    );
    return {
      success: true,
      message: `Dịch vụ ${maDV} đã chuyển sang trạng thái "${nextStatus}".`,
    };
  };

  // ===== QUẢN LÝ DỊCH VỤ TRONG ĐƠN =====
  // Nguồn sự thật duy nhất: danh sách dòng dịch vụ. Mọi thay đổi đi qua commitServiceItems
  // (dùng ref nên bấm liên tiếp không bị đọc state cũ), sau đó tiền dịch vụ/tổng tiền/còn lại
  // của đơn luôn được TÍNH LẠI từ danh sách dòng thay vì cộng/trừ dồn.
  const commitServiceItems = (updater: (prev: ChiTietDichVu[]) => ChiTietDichVu[]): ChiTietDichVu[] => {
    const next = updater(serviceItemsRef.current);
    serviceItemsRef.current = next;
    setServiceItems(next);
    return next;
  };

  const recalcBookingTotals = (maDon: string, items: ChiTietDichVu[]) => {
    const tienDichVu = sumServiceAmount(items, maDon);
    setBookings((prev) =>
      prev.map((b) => {
        if (b.MaDon !== maDon) return b;
        const tongTien = b.TienPhong + tienDichVu;
        return { ...b, TienDichVu: tienDichVu, TongTien: tongTien, ConLai: Math.max(0, tongTien - b.DaThu) };
      })
    );
  };

  // UC-2.4: Thêm dịch vụ vào đơn
  const addServiceToBooking = (
    maDon: string,
    maDV: string,
    soLuong: number,
    ghiChu?: string
  ): { success: boolean; message: string } => {
    const booking = bookings.find((b) => b.MaDon === maDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };

    if (!canEditBookingServices(booking.TrangThaiDon)) {
      return { success: false, message: getServiceLockReason(booking.TrangThaiDon)! };
    }

    const service = services.find((s) => s.MaDV === maDV);
    if (!service) return { success: false, message: 'Không tìm thấy dịch vụ đã chọn.' };
    if (service.TrangThai !== 'Đang hoạt động') {
      return { success: false, message: 'Dịch vụ đã ngừng hoạt động, không thể thêm vào đơn.' };
    }
    if (!Number.isInteger(soLuong) || soLuong < 1) {
      return { success: false, message: 'Số lượng phải là số nguyên từ 1 trở lên.' };
    }
    if (!isServiceAllowedAtStatus(service.ThoiDiemApDung, booking.TrangThaiDon)) {
      return {
        success: false,
        message:
          booking.TrangThaiDon === 'Đã xác nhận'
            ? 'Dịch vụ "Chỉ In-house" chỉ được thêm khi đơn đã check-in.'
            : 'Dịch vụ "Chỉ Pre-stay" chỉ được thêm khi đơn ở trạng thái Đã xác nhận.',
      };
    }

    // Giới hạn số lượng theo bảng quy tắc (tính TỔNG SL của MaDV trong đơn)
    const roomOfBooking = rooms.find((r) => r.MaPhong === booking.MaPhong);
    const limitErr = validateServiceQuantity({
      items: serviceItemsRef.current,
      maDon, maDV, tenDV: service.TenDichVu, soLuong,
      sucChua: roomOfBooking?.SucChua ?? booking.SoKhach, soDem: booking.SoDem,
    });
    if (limitErr) return { success: false, message: limitErr };

    const newItem: ChiTietDichVu = {
      id: `ct-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      MaDon: maDon,
      MaDV: maDV,
      TenDichVu: service.TenDichVu,
      SoLuong: soLuong,
      DonGiaTaiThoiDiem: service.DonGia, // chốt giá tại thời điểm thêm
      ThanhTien: service.DonGia * soLuong,
      ThoiDiemThem: new Date().toISOString(),
      GhiChu: ghiChu?.trim() || undefined,
      GiaiDoan: booking.TrangThaiDon === 'Đã xác nhận' ? 'Pre-stay' : 'In-house',
    };

    const next = commitServiceItems((prev) => [...prev, newItem]);
    recalcBookingTotals(maDon, next);

    return {
      success: true,
      message: `Đã thêm dịch vụ "${service.TenDichVu}" (${soLuong} ${service.DonViTinh}) vào đơn ${maDon}.`,
    };
  };

  // UC-2.5: Điều chỉnh số lượng dịch vụ
  const updateServiceItemQuantity = (id: string, soLuong: number): { success: boolean; message: string } => {
    const item = serviceItemsRef.current.find((x) => x.id === id);
    if (!item) return { success: false, message: 'Không tìm thấy dòng dịch vụ.' };

    const booking = bookings.find((b) => b.MaDon === item.MaDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };
    if (!canEditBookingServices(booking.TrangThaiDon)) {
      return { success: false, message: getServiceLockReason(booking.TrangThaiDon)! };
    }
    if (!Number.isInteger(soLuong) || soLuong < 1) {
      return { success: false, message: 'Số lượng tối thiểu là 1. Dùng nút Xóa để bỏ dịch vụ khỏi đơn.' };
    }

    const roomOfItem = rooms.find((r) => r.MaPhong === booking.MaPhong);
    const limitErr = validateServiceQuantity({
      items: serviceItemsRef.current,
      maDon: item.MaDon, maDV: item.MaDV, tenDV: item.TenDichVu, soLuong,
      sucChua: roomOfItem?.SucChua ?? booking.SoKhach, soDem: booking.SoDem,
      excludeItemId: id,
    });
    if (limitErr) return { success: false, message: limitErr };

    const next = commitServiceItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, SoLuong: soLuong, ThanhTien: soLuong * x.DonGiaTaiThoiDiem } : x))
    );
    recalcBookingTotals(item.MaDon, next);
    return { success: true, message: `Đã cập nhật số lượng "${item.TenDichVu}" thành ${soLuong}.` };
  };

  // UC-2.5: XÓA dịch vụ khỏi đơn (chỉ khi đơn Đã xác nhận / Đã check-in)
  const removeServiceFromBooking = (id: string): { success: boolean; message: string } => {
    const item = serviceItemsRef.current.find((x) => x.id === id);
    if (!item) return { success: false, message: 'Không tìm thấy dòng dịch vụ (có thể đã được xóa).' };

    const booking = bookings.find((b) => b.MaDon === item.MaDon);
    if (!booking) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };
    if (!canEditBookingServices(booking.TrangThaiDon)) {
      return { success: false, message: getServiceLockReason(booking.TrangThaiDon)! };
    }

    const next = commitServiceItems((prev) => prev.filter((x) => x.id !== id));
    recalcBookingTotals(item.MaDon, next);
    return { success: true, message: `Đã xóa dịch vụ "${item.TenDichVu}" khỏi đơn ${item.MaDon}. Tổng tiền đã được tính lại.` };
  };

  // Quản lý Khách hàng
  const createCustomer = (data: Omit<KhachHang, 'MaKH'>): { success: boolean; message: string; maKH?: string } => {
    const dup = customers.find(
      (c) => (c.CCCD ?? "").trim() === (data.CCCD ?? "").trim() || c.SoDienThoai.trim() === data.SoDienThoai.trim()
    );
    if (dup) {
      return {
        success: false,
        message: `Khách hàng đã tồn tại trong hệ thống (Mã: ${dup.MaKH} - ${dup.HoTen}, trùng SĐT hoặc CCCD).`,
        maKH: dup.MaKH,
      };
    }

    const maKH = generateMaKH(customers.map((c) => c.MaKH));
    const newCustomer: KhachHang = {
      ...data,
      MaKH: maKH,
    };

    setCustomers((prev) => [...prev, newCustomer]);
    return { success: true, message: `Tạo hồ sơ khách hàng ${data.HoTen} (${maKH}) thành công!`, maKH };
  };

  const updateCustomer = (maKH: string, data: Partial<KhachHang>): { success: boolean; message: string } => {
    setCustomers((prev) => prev.map((c) => (c.MaKH === maKH ? { ...c, ...data } : c)));
    return { success: true, message: `Cập nhật thông tin khách hàng ${maKH} thành công!` };
  };

  // Reset database
  const resetDatabase = () => {
    localStorage.removeItem(`${STORAGE_PREFIX}rooms`);
    localStorage.removeItem(`${STORAGE_PREFIX}users`);
    localStorage.removeItem(`${STORAGE_PREFIX}customers`);
    localStorage.removeItem(`${STORAGE_PREFIX}services`);
    localStorage.removeItem(`${STORAGE_PREFIX}bookings`);
    localStorage.removeItem(`${STORAGE_PREFIX}service_items`);
    localStorage.removeItem(`${STORAGE_PREFIX}payment_receipts`);
    localStorage.removeItem(`${STORAGE_PREFIX}invoices`);
    localStorage.removeItem(`${STORAGE_PREFIX}bank_config`);

    setRooms(INITIAL_ROOMS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setCustomers(INITIAL_CUSTOMERS);
    setServices(INITIAL_SERVICES);
    setBookings(INITIAL_BOOKINGS);
    setServiceItems(INITIAL_SERVICE_ITEMS);
    setPaymentReceipts(INITIAL_PAYMENT_RECEIPTS);
    setInvoices(INITIAL_INVOICES);
    setBankConfig(INITIAL_BANK_CONFIG);
  };

  // Build raw SQL string for real-time download
  const getRawSQL = (): string => {
    let sql = `-- ====================================================================\n`;
    sql += `-- CHICSTAY HOMESTAY MANAGEMENT SYSTEM - SEED DATA\n`;
    sql += `-- Xuất bản lúc: ${new Date().toISOString()}\n`;
    sql += `-- ====================================================================\n\n`;
    sql += `SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

    sql += `-- 1. PHONG (${rooms.length} phòng)\n`;
    sql += `INSERT INTO \`PHONG\` (\`MaPhong\`, \`TenPhong\`, \`LoaiPhong\`, \`GiaPhong\`, \`SucChua\`, \`TrangThaiPhong\`, \`MoTa\`) VALUES\n`;
    sql += rooms
      .map(
        (r) =>
          `('${r.MaPhong}', '${r.TenPhong.replace(/'/g, "''")}', '${r.LoaiPhong}', ${r.GiaPhong}, ${r.SucChua}, '${r.TrangThaiPhong}', ${r.MoTa ? `'${r.MoTa.replace(/'/g, "''")}'` : 'NULL'})`
      )
      .join(',\n') + ';\n\n';

    sql += `-- 2. NGUOIDUNG (${users.length} tài khoản)\n`;
    sql += `INSERT INTO \`NGUOIDUNG\` (\`MaND\`, \`HoTen\`, \`Email\`, \`VaiTro\`, \`MatKhau\`) VALUES\n`;
    sql += users
      .map(
        (u) =>
          `('${u.MaND}', '${u.HoTen.replace(/'/g, "''")}', '${u.Email}', '${u.VaiTro}', '${u.MatKhau}')`
      )
      .join(',\n') + ';\n\n';

    sql += `-- 3. KHACHHANG (${customers.length} khách hàng)\n`;
    sql += `INSERT INTO \`KHACHHANG\` (\`MaKH\`, \`HoTen\`, \`SoDienThoai\`, \`Email\`, \`CCCD\`, \`DiaChi\`, \`GhiChu\`) VALUES\n`;
    sql += customers
      .map(
        (c) =>
          `('${c.MaKH}', '${c.HoTen.replace(/'/g, "''")}', '${c.SoDienThoai}', ${c.Email ? `'${c.Email}'` : 'NULL'}, ${c.CCCD ? `'${c.CCCD}'` : 'NULL'}, ${c.DiaChi ? `'${c.DiaChi.replace(/'/g, "''")}'` : 'NULL'}, ${c.GhiChu ? `'${c.GhiChu.replace(/'/g, "''")}'` : 'NULL'})`
      )
      .join(',\n') + ';\n\n';

    sql += `-- 4. DICHVU (${services.length} dịch vụ)\n`;
    sql += `INSERT INTO \`DICHVU\` (\`MaDV\`, \`TenDichVu\`, \`NhomDichVu\`, \`DonViTinh\`, \`DonGia\`, \`ThoiDiemApDung\`, \`TrangThai\`) VALUES\n`;
    sql += services
      .map(
        (s) =>
          `('${s.MaDV}', '${s.TenDichVu.replace(/'/g, "''")}', '${s.NhomDichVu}', '${s.DonViTinh}', ${s.DonGia}, '${s.ThoiDiemApDung}', '${s.TrangThai}')`
      )
      .join(',\n') + ';\n\n';

    sql += `-- 5. DONDATPHONG (${bookings.length} đơn)\n`;
    sql += `INSERT INTO \`DONDATPHONG\` (\`MaDon\`, \`MaND\`, \`MaKH\`, \`MaPhong\`, \`NgayNhanPhong\`, \`NgayTraPhong\`, \`SoKhach\`, \`SoDem\`, \`TienPhong\`, \`TienCocYeuCau\`, \`TienDichVu\`, \`TongTien\`, \`DaThu\`, \`ConLai\`, \`TrangThaiDon\`, \`ThoiGianTaoDon\`, \`ThoiGianCheckInThucTe\`, \`ThoiGianCheckOutThucTe\`, \`YeuCauDacBiet\`) VALUES\n`;
    sql += bookings
      .map(
        (b) =>
          `('${b.MaDon}', '${b.MaND}', '${b.MaKH}', '${b.MaPhong}', '${b.NgayNhanPhong}', '${b.NgayTraPhong}', ${b.SoKhach}, ${b.SoDem}, ${b.TienPhong}, ${b.TienCocYeuCau}, ${b.TienDichVu}, ${b.TongTien}, ${b.DaThu}, ${b.ConLai}, '${b.TrangThaiDon}', '${b.ThoiGianTaoDon}', ${b.ThoiGianCheckInThucTe ? `'${b.ThoiGianCheckInThucTe}'` : 'NULL'}, ${b.ThoiGianCheckOutThucTe ? `'${b.ThoiGianCheckOutThucTe}'` : 'NULL'}, ${b.YeuCauDacBiet ? `'${b.YeuCauDacBiet.replace(/'/g, "''")}'` : 'NULL'})`
      )
      .join(',\n') + ';\n\n';

    sql += `-- 6. PHIEUTHANHTOAN (${paymentReceipts.length} phiếu)\n`;
    sql += `INSERT INTO \`PHIEUTHANHTOAN\` (\`MaPhieu\`, \`MaDon\`, \`LoaiPhieu\`, \`SoTien\`, \`PhuongThuc\`, \`MaGiaoDichNganHang\`, \`TrangThaiThanhToan\`, \`NgayLap\`, \`NguoiLap\`, \`GhiChu\`) VALUES\n`;
    sql += paymentReceipts
      .map(
        (p) =>
          `('${p.MaPhieu}', '${p.MaDon}', '${p.LoaiPhieu}', ${p.SoTien}, '${p.PhuongThuc}', ${p.MaGiaoDichNganHang ? `'${p.MaGiaoDichNganHang}'` : 'NULL'}, '${p.TrangThaiThanhToan}', '${p.NgayLap}', '${p.NguoiLap}', ${p.GhiChu ? `'${p.GhiChu.replace(/'/g, "''")}'` : 'NULL'})`
      )
      .join(',\n') + ';\n\n';

    sql += `-- 7. CHITIETDICHVU (${serviceItems.length} dịch vụ phát sinh)\n`;
    sql += `INSERT INTO \`CHITIETDICHVU\` (\`MaChiTiet\`, \`MaDon\`, \`MaDV\`, \`SoLuong\`, \`DonGiaTaiThoiDiem\`, \`ThanhTien\`, \`ThoiDiemThem\`, \`GhiChu\`) VALUES\n`;
    sql += serviceItems
      .map(
        (si) =>
          `('${si.MaChiTiet || si.id}', '${si.MaDon}', '${si.MaDV}', ${si.SoLuong}, ${si.DonGiaTaiThoiDiem}, ${si.ThanhTien}, '${si.ThoiDiemThem}', ${si.GhiChu ? `'${si.GhiChu.replace(/'/g, "''")}'` : 'NULL'})`
      )
      .join(',\n') + ';\n\n';

    sql += `-- 8. HOADON (${invoices.length} hóa đơn tất toán)\n`;
    sql += `INSERT INTO \`HOADON\` (\`MaHoaDon\`, \`MaDon\`, \`TienPhong\`, \`TienDichVu\`, \`TienCocDaTra\`, \`TienThanhToanKhiCheckOut\`, \`TongTienDaThanhToan\`, \`PhuongThuc\`, \`NgayXuat\`, \`NguoiXuat\`, \`GhiChu\`) VALUES\n`;
    sql += invoices
      .map(
        (h) =>
          `('${h.MaHoaDon}', '${h.MaDon}', ${h.TienPhong}, ${h.TienDichVu}, ${h.TienCocDaTra}, ${h.TienThanhToanKhiCheckOut}, ${h.TongTienDaThanhToan}, '${h.PhuongThuc}', '${h.NgayXuat}', '${h.NguoiXuat}', ${h.GhiChu ? `'${h.GhiChu.replace(/'/g, "''")}'` : 'NULL'})`
      )
      .join(',\n') + ';\n\n';

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    return sql;
  };

  return (
    <HomestayContext.Provider
      value={{
        currentUser,
        login,
        logout,
        register,
        switchUser,
        users,
        rooms,
        customers,
        services,
        bookings,
        serviceItems,
        paymentReceipts,
        invoices,
        bankConfig,
        updateBankConfig,
        createBooking,
        confirmDeposit,
        updateBooking,
        cancelBooking,
        processRefund,
        checkInBooking,
        noShowBooking,
        checkOutBooking,
        cleanRoom,
        createService,
        updateService,
        toggleServiceStatus,
        addServiceToBooking,
        updateServiceItemQuantity,
        removeServiceFromBooking,
        createCustomer,
        updateCustomer,
        resetDatabase,
        getRawSQL,
        checkRoomAvailability,
        getAvailableRoomsForDates,
        getBookingDetails,
      }}
    >
      {children}
    </HomestayContext.Provider>
  );
};

export const useHomestay = (): HomestayContextType => {
  const ctx = useContext(HomestayContext);
  if (!ctx) throw new Error('useHomestay must be used within HomestayProvider');
  return ctx;
};
