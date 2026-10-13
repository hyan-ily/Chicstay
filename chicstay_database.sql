-- CHICSTAY HOMESTAY MANAGEMENT SYSTEM - SEED DATA

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `HOADON`;
DROP TABLE IF EXISTS `CHITIETDICHVU`;
DROP TABLE IF EXISTS `PHIEUTHANHTOAN`;
DROP TABLE IF EXISTS `DONDATPHONG`;
DROP TABLE IF EXISTS `DICHVU`;
DROP TABLE IF EXISTS `KHACHHANG`;
DROP TABLE IF EXISTS `NGUOIDUNG`;
DROP TABLE IF EXISTS `PHONG`;

-- ----------------------------
-- TABLE: PHONG
-- ----------------------------
CREATE TABLE `PHONG` (
  `MaPhong` VARCHAR(10) NOT NULL,
  `TenPhong` NVARCHAR(100) NOT NULL,
  `LoaiPhong` NVARCHAR(50) NOT NULL,
  `GiaPhong` DECIMAL(18,0) NOT NULL,
  `SucChua` INT NOT NULL,
  `TrangThaiPhong` NVARCHAR(50) NOT NULL DEFAULT N'Sẵn sàng',
  `MoTa` NVARCHAR(500) NULL,
  PRIMARY KEY (`MaPhong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- TABLE: NGUOIDUNG
-- ----------------------------
CREATE TABLE `NGUOIDUNG` (
  `MaND` VARCHAR(10) NOT NULL,
  `HoTen` NVARCHAR(100) NOT NULL,
  `Email` VARCHAR(100) NOT NULL,
  `VaiTro` NVARCHAR(50) NOT NULL,
  `MatKhau` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`MaND`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- TABLE: KHACHHANG
-- ----------------------------
CREATE TABLE `KHACHHANG` (
  `MaKH` VARCHAR(10) NOT NULL,
  `HoTen` NVARCHAR(100) NOT NULL,
  `SoDienThoai` VARCHAR(15) NOT NULL,
  `Email` VARCHAR(100) NULL,
  `CCCD` VARCHAR(20) NULL,
  `DiaChi` NVARCHAR(255) NULL,
  `GhiChu` NVARCHAR(500) NULL,
  PRIMARY KEY (`MaKH`),
  UNIQUE KEY `UQ_KHACHHANG_CCCD` (`CCCD`),
  CONSTRAINT `CHK_KH_HoTen`
  CHECK (
        CHAR_LENGTH(TRIM(`HoTen`)) > 0
        AND CHAR_LENGTH(`HoTen`) = CHAR_LENGTH(TRIM(`HoTen`))
        AND REGEXP_LIKE(`HoTen`, '^[[:alpha:] \'’-]+$')
  ),

  CONSTRAINT `CHK_KH_SoDienThoai`
  CHECK (
        REGEXP_LIKE(`SoDienThoai`, '^0[0-9]{9}$', 'c')
  ),

  CONSTRAINT `CHK_KH_Email`
  CHECK (
        `Email` IS NULL
        OR REGEXP_LIKE(
            `Email`,
            '^[^[:space:]@]+@[^[:space:]@.]+([.][^[:space:]@.]+)+$',
            'c'
      )
  ),

  CONSTRAINT `CHK_KH_CCCD`
  CHECK (
        `CCCD` IS NULL
        OR REGEXP_LIKE(`CCCD`, '^[0-9]{12}$', 'c')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- TABLE: DICHVU
-- ----------------------------
CREATE TABLE `DICHVU` (
  `MaDV` VARCHAR(10) NOT NULL,
  `TenDichVu` NVARCHAR(100) NOT NULL,
  `NhomDichVu` NVARCHAR(50) NOT NULL,
  `DonViTinh` NVARCHAR(20) NOT NULL,
  `DonGia` DECIMAL(18,0) NOT NULL,
  `ThoiDiemApDung` NVARCHAR(20) NOT NULL,
  `TrangThai` NVARCHAR(30) NOT NULL DEFAULT N'Đang hoạt động',
  PRIMARY KEY (`MaDV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- TABLE: DONDATPHONG
-- ----------------------------
CREATE TABLE `DONDATPHONG` (
  `MaDon` VARCHAR(15) NOT NULL,
  `MaND` VARCHAR(10) NOT NULL,
  `MaKH` VARCHAR(10) NOT NULL,
  `MaPhong` VARCHAR(10) NOT NULL,
  `NgayNhanPhong` DATE NOT NULL,
  `NgayTraPhong` DATE NOT NULL,
  `SoKhach` INT NOT NULL,
  `SoDem` INT NOT NULL,
  `TienPhong` DECIMAL(18,0) NOT NULL,
  `TienCocYeuCau` DECIMAL(18,0) NOT NULL,
  `TienDichVu` DECIMAL(18,0) NOT NULL DEFAULT 0,
  `TongTien` DECIMAL(18,0) NOT NULL,
  `DaThu` DECIMAL(18,0) NOT NULL DEFAULT 0,
  `ConLai` DECIMAL(18,0) NOT NULL DEFAULT 0,
  `TrangThaiDon` NVARCHAR(30) NOT NULL,
  `ThoiGianTaoDon` DATETIME NOT NULL,
  `ThoiGianCheckInThucTe` DATETIME NULL,
  `ThoiGianCheckOutThucTe` DATETIME NULL,
  `YeuCauDacBiet` NVARCHAR(500) NULL,
  PRIMARY KEY (`MaDon`),
  CONSTRAINT `FK_Don_NguoiDung` FOREIGN KEY (`MaND`) REFERENCES `NGUOIDUNG` (`MaND`),
  CONSTRAINT `FK_Don_KhachHang` FOREIGN KEY (`MaKH`) REFERENCES `KHACHHANG` (`MaKH`),
  CONSTRAINT `FK_Don_Phong` FOREIGN KEY (`MaPhong`) REFERENCES `PHONG` (`MaPhong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- TABLE: PHIEUTHANHTOAN
-- ----------------------------
CREATE TABLE `PHIEUTHANHTOAN` (
  `MaPhieu` VARCHAR(15) NOT NULL,
  `MaDon` VARCHAR(15) NOT NULL,
  `LoaiPhieu` NVARCHAR(20) NOT NULL,
  `SoTien` DECIMAL(18,0) NOT NULL,
  `PhuongThuc` NVARCHAR(20) NOT NULL,
  `MaGiaoDichNganHang` VARCHAR(50) NULL,
  `TrangThaiThanhToan` NVARCHAR(30) NOT NULL,
  `NgayLap` DATETIME NOT NULL,
  `NguoiLap` VARCHAR(10) NOT NULL,
  `GhiChu` NVARCHAR(255) NULL,
  PRIMARY KEY (`MaPhieu`),
  CONSTRAINT `FK_Phieu_Don` FOREIGN KEY (`MaDon`) REFERENCES `DONDATPHONG` (`MaDon`),
  CONSTRAINT `FK_Phieu_NguoiDung` FOREIGN KEY (`NguoiLap`) REFERENCES `NGUOIDUNG` (`MaND`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- TABLE: CHITIETDICHVU
-- ----------------------------
CREATE TABLE `CHITIETDICHVU` (
  `MaChiTiet` VARCHAR(15) NOT NULL,
  `MaDon` VARCHAR(15) NOT NULL,
  `MaDV` VARCHAR(10) NOT NULL,
  `SoLuong` INT NOT NULL,
  `DonGiaTaiThoiDiem` DECIMAL(18,0) NOT NULL,
  `ThanhTien` DECIMAL(18,0) NOT NULL,
  `ThoiDiemThem` DATETIME NOT NULL,
  `GhiChu` NVARCHAR(255) NULL,
  PRIMARY KEY (`MaChiTiet`),
  CONSTRAINT `FK_CTDV_Don` FOREIGN KEY (`MaDon`) REFERENCES `DONDATPHONG` (`MaDon`),
  CONSTRAINT `FK_CTDV_DichVu` FOREIGN KEY (`MaDV`) REFERENCES `DICHVU` (`MaDV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- TABLE: HOADON
-- ----------------------------
CREATE TABLE `HOADON` (
  `MaHoaDon` VARCHAR(15) NOT NULL,
  `MaDon` VARCHAR(15) NOT NULL,
  `TienPhong` DECIMAL(18,0) NOT NULL,
  `TienDichVu` DECIMAL(18,0) NOT NULL DEFAULT 0,
  `TienCocDaTra` DECIMAL(18,0) NOT NULL,
  `TienThanhToanKhiCheckOut` DECIMAL(18,0) NOT NULL,
  `TongTienDaThanhToan` DECIMAL(18,0) NOT NULL,
  `PhuongThuc` NVARCHAR(20) NOT NULL,
  `NgayXuat` DATETIME NOT NULL,
  `NguoiXuat` VARCHAR(10) NOT NULL,
  `GhiChu` NVARCHAR(255) NULL,
  PRIMARY KEY (`MaHoaDon`),
  UNIQUE KEY `UK_HoaDon_Don` (`MaDon`),
  CONSTRAINT `FK_HoaDon_Don` FOREIGN KEY (`MaDon`) REFERENCES `DONDATPHONG` (`MaDon`),
  CONSTRAINT `FK_HoaDon_NguoiDung` FOREIGN KEY (`NguoiXuat`) REFERENCES `NGUOIDUNG` (`MaND`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- INSERT: PHONG (12 records)
-- ----------------------------
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P101', 'Phòng 101', 'Standard', 450000, 2, 'Sẵn sàng', 'Phòng Standard tầng 1, phù hợp cặp đôi / công tác');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P102', 'Phòng 102', 'Standard', 450000, 2, 'Sẵn sàng', 'Phòng Standard tầng 1, gần sảnh');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P103', 'Phòng 103', 'Standard', 480000, 2, 'Sẵn sàng', 'Phòng Standard có cửa sổ lớn');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P104', 'Phòng 104', 'Standard', 480000, 2, 'Sẵn sàng', 'Phòng Standard yên tĩnh');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P201', 'Phòng 201', 'Deluxe', 650000, 2, 'Sẵn sàng', 'Phòng Deluxe có ban công, view đẹp');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P202', 'Phòng 202', 'Deluxe', 650000, 2, 'Sẵn sàng', 'Phòng Deluxe tầng 2');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P203', 'Phòng 203', 'Deluxe', 680000, 2, 'Sẵn sàng', 'Phòng Deluxe tầng cao, yên tĩnh');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P204', 'Phòng 204', 'Deluxe', 700000, 2, 'Sẵn sàng', 'Phòng Deluxe góc, view toàn cảnh');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P301', 'Phòng 301', 'Family', 850000, 4, 'Sẵn sàng', 'Phòng Family 2 giường, phù hợp gia đình');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P302', 'Phòng 302', 'Family', 880000, 4, 'Sẵn sàng', 'Phòng Family rộng, có ghế sofa');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P303', 'Phòng 303', 'Family', 900000, 4, 'Sẵn sàng', 'Phòng Family tầng cao, view đẹp');
INSERT INTO `PHONG` (`MaPhong`, `TenPhong`, `LoaiPhong`, `GiaPhong`, `SucChua`, `TrangThaiPhong`, `MoTa`) VALUES ('P401', 'Bungalow 01', 'Bungalow', 950000, 3, 'Sẵn sàng', 'Bungalow riêng biệt, có sân BBQ, không gian riêng');

-- ----------------------------
-- INSERT: NGUOIDUNG (3 records)
-- ----------------------------
INSERT INTO `NGUOIDUNG` (`MaND`, `HoTen`, `Email`, `VaiTro`, `MatKhau`) VALUES ('ND001', 'Nguyễn Minh CHâu', 'minh.quanly@chicstay.com', 'Quản lý', '1234567');
INSERT INTO `NGUOIDUNG` (`MaND`, `HoTen`, `Email`, `VaiTro`, `MatKhau`) VALUES ('ND002', 'Trần Thu Hương', 'huong.quanly@chicstay.com', 'Quản lý', '1234567');
INSERT INTO `NGUOIDUNG` (`MaND`, `HoTen`, `Email`, `VaiTro`, `MatKhau`) VALUES ('ND003', 'Hải Yến Trần', 'haiyen05tb@gmail.com', 'Admin', '1234567');

-- ----------------------------
-- INSERT: KHACHHANG (45 records)
-- ----------------------------
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH001', 'Bùi Thị An', '0946913810', 'bùi.thị.an18@gmail.com', '034832269481', 'Đà Lạt', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH002', 'Đặng Quốc Bình', '0913999315', NULL, '034050052120', 'Quảng Ninh', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH003', 'Võ Thanh Hương', '0966306997', 'võ.thanh.hương76@gmail.com', '034253050256', 'Hà Nội', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH004', 'Hồ Minh Tâm', '0955667651', 'hồ.minh.tâm28@gmail.com', '034629821539', 'Nha Trang', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH005', 'Trần Quốc Dũng', '0958181396', 'trần.quốc.dũng78@gmail.com', '034899371430', 'Hà Nội', 'Khách quen');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH006', 'Vũ Thị Hồng Dũng', '0960806024', NULL, '034304820142', 'Nha Trang', 'Dị ứng hải sản');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH007', 'Phạm Thị Bình', '0998753260', 'phạm.thị.bình38@gmail.com', '034130840140', 'Hải Phòng', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH008', 'Trần Quốc Nam', '0970855700', 'trần.quốc.nam47@gmail.com', '034425519849', 'Nha Trang', 'Thích phòng yên tĩnh');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH009', 'Bùi Hữu Cường', '0991756179', 'bùi.hữu.cường69@gmail.com', '034419548116', 'Đà Nẵng', 'Yêu cầu giường đôi');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH010', 'Phan Hữu Hương', '0939476249', 'phan.hữu.hương99@gmail.com', '034462436409', 'Hải Phòng', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH011', 'Nguyễn Đức Sơn', '0945935572', NULL, '034680801999', 'Hải Phòng', 'Khách quen');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH012', 'Vũ Quốc Uyên', '0929175900', 'vũ.quốc.uyên32@gmail.com', '034380026649', 'Đà Lạt', 'Có trẻ nhỏ');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH013', 'Đỗ Thị Lan Tâm', '0988320463', 'đỗ.thị.lan.tâm29@gmail.com', '034939878788', 'Vũng Tàu', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH014', 'Hồ Văn Dũng', '0930514014', 'hồ.văn.dũng88@gmail.com', '034648192232', 'TP. Hồ Chí Minh', 'Yêu cầu giường đôi');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH015', 'Phan Thị Lan Uyên', '0981016525', 'phan.thị.lan.uyên71@gmail.com', '034373620112', 'TP. Hồ Chí Minh', 'Khách quen');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH016', 'Dương Thị Hồng Nam', '0996028436', 'dương.thị.hồng.nam38@gmail.com', '034665994394', 'Vũng Tàu', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH017', 'Đỗ Hữu Yến', '0933978249', 'đỗ.hữu.yến14@gmail.com', '034933616150', 'Cần Thơ', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH018', 'Bùi Thị Hồng Trang', '0936697396', NULL, '034368618081', 'Đà Lạt', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH019', 'Dương Thị Hồng An', '0990388981', 'dương.thị.hồng.an3@gmail.com', '034472520493', 'Hải Phòng', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH020', 'Phạm Thị Lan Cường', '0921496211', 'phạm.thị.lan.cường9@gmail.com', '034424066816', 'Đà Lạt', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH021', 'Lê Minh Vân', '0983793389', NULL, '034461768998', 'Hải Phòng', 'Dị ứng hải sản');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH022', 'Hồ Thanh Oanh', '0963551839', 'hồ.thanh.oanh84@gmail.com', '034640166001', 'Đà Lạt', 'Yêu cầu giường đôi');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH023', 'Trần Thanh Mai', '0918593410', 'trần.thanh.mai76@gmail.com', '034487177987', 'Quảng Ninh', 'Thích phòng yên tĩnh');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH024', 'Nguyễn Thị Bình', '0940728046', NULL, '034728590908', 'Đà Lạt', 'Thích phòng yên tĩnh');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH025', 'Hoàng Anh Lan', '0982374753', NULL, '034812803930', 'Vũng Tàu', 'Thích phòng yên tĩnh');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH026', 'Hồ Anh Tâm', '0935556386', NULL, '034276711930', 'Nha Trang', 'Yêu cầu giường đôi');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH027', 'Phan Anh Bình', '0997705310', 'phan.anh.bình13@gmail.com', '034641960943', 'Nha Trang', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH028', 'Ngô Thị Mai', '0935714784', NULL, '034250635901', 'Huế', 'Thích phòng yên tĩnh');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH029', 'Hoàng Anh Mai', '0920117988', 'hoàng.anh.mai71@gmail.com', '034960122341', 'Đà Lạt', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH030', 'Nguyễn Thị Mai', '0932321899', 'nguyễn.thị.mai62@gmail.com', '034640463568', 'Huế', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH031', 'Phan Hữu Uyên', '0948285503', 'phan.hữu.uyên94@gmail.com', '034268767101', 'Đà Lạt', 'Khách quen');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH032', 'Đỗ Anh Hà', '0935487660', 'đỗ.anh.hà8@gmail.com', '034941412032', 'Đà Lạt', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH033', 'Đỗ Đức Bình', '0916729990', 'đỗ.đức.bình65@gmail.com', '034079861243', 'Hà Nội', 'Dị ứng hải sản');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH034', 'Trần Minh Cường', '0989864260', NULL, '034399523052', 'Huế', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH035', 'Dương Thị Lan Mai', '0987701200', 'dương.thị.lan.mai80@gmail.com', '034913616724', 'Quảng Ninh', 'Dị ứng hải sản');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH036', 'Võ Đức Nam', '0937415205', 'võ.đức.nam41@gmail.com', '034787957213', 'Huế', 'Thích phòng yên tĩnh');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH037', 'Bùi Hữu Uyên', '0952436584', 'bùi.hữu.uyên10@gmail.com', '034551183219', 'Quảng Ninh', 'Dị ứng hải sản');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH038', 'Trần Thị Hương', '0938609087', 'trần.thị.hương17@gmail.com', '034260407870', 'TP. Hồ Chí Minh', 'Thích phòng yên tĩnh');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH039', 'Huỳnh Hữu Hùng', '0968812137', 'huỳnh.hữu.hùng91@gmail.com', '034314199398', 'Đà Lạt', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH040', 'Bùi Thị Hồng Oanh', '0999038526', NULL, '034800414661', 'Cần Thơ', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH041', 'Dương Thị Hương', '0930863865', 'dương.thị.hương78@gmail.com', '034883662637', 'Nha Trang', 'Thích phòng yên tĩnh');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH042', 'Bùi Hữu Yến', '0975569635', 'bùi.hữu.yến7@gmail.com', '034181120841', 'Huế', NULL);
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH043', 'Hoàng Văn An', '0954769200', 'hoàng.văn.an82@gmail.com', '034971008994', 'Đà Nẵng', 'Khách quen');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH044', 'Vũ Thị Hồng Tâm', '0985283645', NULL, '034707157168', 'Đà Nẵng', 'Dị ứng hải sản');
INSERT INTO `KHACHHANG` (`MaKH`, `HoTen`, `SoDienThoai`, `Email`, `CCCD`, `DiaChi`, `GhiChu`) VALUES ('KH045', 'Nguyễn Đức Linh', '0984158663', NULL, '034497047298', 'Cần Thơ', 'Có trẻ nhỏ');

-- ----------------------------
-- INSERT: DICHVU (12 records)
-- ----------------------------
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D001', 'Dịch vụ giặt ủi', 'Tiện ích & Vệ sinh', 'Bộ', 50000, 'Chỉ In-house', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D002', 'Đưa đón sân bay Liên Khương', 'Di chuyển & Phương tiện', 'Lượt', 350000, 'Cả hai', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D003', 'Đưa đón bến xe Đà Lạt', 'Di chuyển & Phương tiện', 'Lượt', 150000, 'Cả hai', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D004', 'Ăn sáng tại phòng', 'Ăn uống & Tiện ích', 'Suất', 80000, 'Cả hai', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D005', 'Thuê xe máy (xe số/Tay ga)', 'Di chuyển & Phương tiện', 'Ngày', 150000, 'Cả hai', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D006', 'Giường phụ (Extra Bed)', 'Tiện nghi phòng', 'Đêm', 150000, 'Cả hai', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D007', 'Set BBQ ngoài trời', 'Ăn uống & Trải nghiệm', 'Set', 450000, 'Cả hai', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D008', 'Phụ thu nhận phòng sớm', 'Phụ thu thời gian', '1 giờ', 150000, 'Chỉ Pre-stay', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D009', 'Phụ thu trả phòng muộn', 'Phụ thu thời gian', '1 giờ', 150000, 'Chỉ In-house', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D010', 'Set up Romantic Date', 'Trải nghiệm theo Vibe', 'Gói', 350000, 'Chỉ Pre-stay', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D011', 'Thuê máy chiếu HD / Galaxy Chill', 'Giải trí tại phòng', 'Lượt', 100000, 'Cả hai', 'Đang hoạt động');
INSERT INTO `DICHVU` (`MaDV`, `TenDichVu`, `NhomDichVu`, `DonViTinh`, `DonGia`, `ThoiDiemApDung`, `TrangThai`) VALUES ('D012', 'Minibar (Nước ngọt + Đồ ăn nhẹ)', 'Minibar', 'Set', 30000, 'Chỉ In-house', 'Đang hoạt động');

-- ----------------------------
-- INSERT: DONDATPHONG (50 records)
-- ----------------------------
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250001', 'ND001', 'KH023', 'P102', '2025-07-02', '2025-07-03', 2, 1, 450000, 135000, 0, 450000, 0, 450000, 'Chờ đặt cọc', '2025-06-02 10:00:00', NULL, NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250002', 'ND003', 'KH010', 'P202', '2025-07-01', '2025-07-05', 1, 4, 2600000, 780000, 0, 2600000, 0, 2600000, 'Đã hủy', '2025-06-29 14:00:00', NULL, NULL, NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250003', 'ND003', 'KH016', 'P102', '2025-09-09', '2025-09-11', 2, 2, 900000, 270000, 0, 900000, 270000, 630000, 'Đã hủy', '2025-08-11 09:00:00', NULL, NULL, 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250004', 'ND001', 'KH002', 'P301', '2025-07-22', '2025-07-25', 3, 3, 2850000, 855000, 0, 2850000, 0, 2850000, 'Đã hủy', '2025-06-26 12:00:00', NULL, NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250005', 'ND002', 'KH002', 'P201', '2025-07-04', '2025-07-05', 2, 1, 650000, 195000, 30000, 680000, 680000, 0, 'Đã hoàn thành', '2025-06-13 10:00:00', '2025-07-04 14:40:00', '2025-07-05 11:27:00', 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250006', 'ND001', 'KH043', 'P301', '2025-08-19', '2025-08-23', 1, 4, 3800000, 1140000, 0, 3800000, 1140000, 2660000, 'Đã check-in', '2025-08-08 08:00:00', '2025-08-19 15:25:00', NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250007', 'ND003', 'KH009', 'P302', '2025-08-25', '2025-08-26', 2, 1, 980000, 294000, 0, 980000, 294000, 686000, 'Đã check-in', '2025-08-14 10:00:00', '2025-08-25 15:46:00', NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250008', 'ND002', 'KH038', 'P401', '2025-07-12', '2025-07-15', 4, 3, 2550000, 765000, 0, 2550000, 765000, 1785000, 'Đã xác nhận', '2025-07-04 08:00:00', NULL, NULL, 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250009', 'ND003', 'KH041', 'P202', '2025-06-12', '2025-06-15', 3, 3, 1950000, 585000, 0, 1950000, 1950000, 0, 'Đã hoàn thành', '2025-05-16 13:00:00', '2025-06-12 14:03:00', '2025-06-15 11:02:00', 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250010', 'ND003', 'KH037', 'P302', '2025-08-29', '2025-08-30', 4, 1, 980000, 294000, 30000, 1010000, 1010000, 0, 'Đã hoàn thành', '2025-08-23 06:00:00', '2025-08-29 14:00:00', '2025-08-30 11:57:00', NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250011', 'ND002', 'KH043', 'P204', '2025-08-11', '2025-08-13', 2, 2, 1400000, 420000, 0, 1400000, 420000, 980000, 'No-show', '2025-07-12 09:00:00', NULL, NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250012', 'ND001', 'KH031', 'P202', '2025-09-05', '2025-09-07', 3, 2, 1300000, 390000, 0, 1300000, 1300000, 0, 'Đã hoàn thành', '2025-08-10 08:00:00', '2025-09-05 15:20:00', '2025-09-07 11:15:00', 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250013', 'ND003', 'KH006', 'P302', '2025-06-30', '2025-07-01', 2, 1, 980000, 294000, 0, 980000, 294000, 686000, 'Đã check-in', '2025-06-26 10:00:00', '2025-06-30 14:42:00', NULL, 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250014', 'ND002', 'KH038', 'P204', '2025-06-03', '2025-06-07', 2, 4, 2800000, 840000, 0, 2800000, 840000, 1960000, 'Đã xác nhận', '2025-05-21 12:00:00', NULL, NULL, 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250015', 'ND003', 'KH015', 'P302', '2025-07-05', '2025-07-07', 4, 2, 1960000, 588000, 0, 1960000, 1960000, 0, 'Đã hoàn thành', '2025-06-23 06:00:00', '2025-07-05 14:51:00', '2025-07-07 11:46:00', NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250016', 'ND003', 'KH043', 'P401', '2025-08-22', '2025-08-23', 2, 1, 850000, 255000, 0, 850000, 255000, 595000, 'Đã hủy', '2025-08-15 16:00:00', NULL, NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250017', 'ND002', 'KH027', 'P103', '2025-06-11', '2025-06-13', 1, 2, 960000, 288000, 0, 960000, 0, 960000, 'Chờ đặt cọc', '2025-06-08 11:00:00', NULL, NULL, 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250018', 'ND003', 'KH005', 'P101', '2025-08-23', '2025-08-26', 1, 3, 1350000, 405000, 0, 1350000, 405000, 945000, 'No-show', '2025-08-15 16:00:00', NULL, NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250019', 'ND003', 'KH008', 'P401', '2025-06-28', '2025-06-30', 3, 2, 1700000, 510000, 0, 1700000, 0, 1700000, 'Chờ đặt cọc', '2025-06-21 07:00:00', NULL, NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250020', 'ND003', 'KH008', 'P203', '2025-06-21', '2025-06-24', 1, 3, 2040000, 612000, 0, 2040000, 612000, 1428000, 'Đã xác nhận', '2025-05-21 12:00:00', NULL, NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250021', 'ND001', 'KH038', 'P202', '2025-08-20', '2025-08-23', 1, 3, 1950000, 585000, 0, 1950000, 585000, 1365000, 'Đã check-in', '2025-08-09 06:00:00', '2025-08-20 15:43:00', NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250022', 'ND002', 'KH035', 'P102', '2025-07-18', '2025-07-20', 2, 2, 900000, 270000, 310000, 1210000, 1210000, 0, 'Đã hoàn thành', '2025-07-03 09:00:00', '2025-07-18 14:55:00', '2025-07-20 11:23:00', NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250023', 'ND001', 'KH006', 'P202', '2025-07-28', '2025-07-30', 2, 2, 1300000, 390000, 0, 1300000, 390000, 910000, 'Đã xác nhận', '2025-07-05 10:00:00', NULL, NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250024', 'ND002', 'KH014', 'P203', '2025-07-04', '2025-07-06', 2, 2, 1360000, 408000, 0, 1360000, 408000, 952000, 'Đã hủy', '2025-06-10 12:00:00', NULL, NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250025', 'ND002', 'KH036', 'P103', '2025-08-28', '2025-08-31', 2, 3, 1440000, 432000, 0, 1440000, 432000, 1008000, 'Đã xác nhận', '2025-08-26 15:00:00', NULL, NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250026', 'ND003', 'KH038', 'P103', '2025-08-10', '2025-08-12', 2, 2, 960000, 288000, 0, 960000, 288000, 672000, 'Đã xác nhận', '2025-07-16 08:00:00', NULL, NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250027', 'ND002', 'KH015', 'P301', '2025-06-25', '2025-06-26', 1, 1, 950000, 285000, 0, 950000, 0, 950000, 'Chờ đặt cọc', '2025-05-30 05:00:00', NULL, NULL, 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250028', 'ND001', 'KH014', 'P204', '2025-07-06', '2025-07-09', 3, 3, 2100000, 630000, 0, 2100000, 2100000, 0, 'Đã hoàn thành', '2025-07-01 13:00:00', '2025-07-06 14:29:00', '2025-07-09 11:23:00', 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250029', 'ND002', 'KH045', 'P302', '2025-08-21', '2025-08-25', 1, 4, 3920000, 1176000, 0, 3920000, 1176000, 2744000, 'Đã hủy', '2025-08-01 12:00:00', NULL, NULL, 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250030', 'ND002', 'KH031', 'P302', '2025-06-09', '2025-06-10', 4, 1, 980000, 294000, 410000, 1390000, 1390000, 0, 'Đã hoàn thành', '2025-05-18 06:00:00', '2025-06-09 14:19:00', '2025-06-10 11:09:00', NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250031', 'ND003', 'KH028', 'P101', '2025-08-19', '2025-08-21', 1, 2, 900000, 270000, 0, 900000, 270000, 630000, 'No-show', '2025-08-11 06:00:00', NULL, NULL, 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250032', 'ND001', 'KH036', 'P302', '2025-06-01', '2025-06-02', 4, 1, 980000, 294000, 0, 980000, 294000, 686000, 'Đã check-in', '2025-05-15 12:00:00', '2025-06-01 14:29:00', NULL, NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250033', 'ND001', 'KH044', 'P204', '2025-07-04', '2025-07-05', 3, 1, 700000, 210000, 0, 700000, 210000, 490000, 'Đã xác nhận', '2025-06-07 13:00:00', NULL, NULL, 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250034', 'ND002', 'KH010', 'P301', '2025-06-22', '2025-06-23', 3, 1, 950000, 285000, 0, 950000, 285000, 665000, 'Đã xác nhận', '2025-06-06 05:00:00', NULL, NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250035', 'ND002', 'KH029', 'P302', '2025-06-06', '2025-06-07', 3, 1, 980000, 294000, 0, 980000, 294000, 686000, 'Đã check-in', '2025-06-04 15:00:00', '2025-06-06 15:26:00', NULL, 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250036', 'ND003', 'KH003', 'P204', '2025-06-23', '2025-06-26', 3, 3, 2100000, 630000, 0, 2100000, 630000, 1470000, 'Đã check-in', '2025-05-23 12:00:00', '2025-06-23 15:14:00', NULL, 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250037', 'ND002', 'KH023', 'P102', '2025-07-12', '2025-07-14', 1, 2, 900000, 270000, 150000, 1050000, 1050000, 0, 'Đã hoàn thành', '2025-06-18 09:00:00', '2025-07-12 15:24:00', '2025-07-14 12:00:00', 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250038', 'ND002', 'KH027', 'P301', '2025-08-06', '2025-08-07', 4, 1, 950000, 285000, 0, 950000, 285000, 665000, 'Đã check-in', '2025-07-11 16:00:00', '2025-08-06 14:34:00', NULL, 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250039', 'ND001', 'KH002', 'P201', '2025-08-17', '2025-08-22', 1, 5, 3250000, 975000, 150000, 3400000, 3400000, 0, 'Đã hoàn thành', '2025-08-15 08:00:00', '2025-08-17 14:11:00', '2025-08-22 11:14:00', 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250040', 'ND002', 'KH031', 'P201', '2025-08-10', '2025-08-11', 2, 1, 650000, 195000, 0, 650000, 650000, 0, 'Đã hoàn thành', '2025-07-20 08:00:00', '2025-08-10 14:17:00', '2025-08-11 11:55:00', NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250041', 'ND003', 'KH020', 'P401', '2025-08-14', '2025-08-17', 2, 3, 2550000, 765000, 0, 2550000, 765000, 1785000, 'Đã xác nhận', '2025-07-28 11:00:00', NULL, NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250042', 'ND003', 'KH016', 'P103', '2025-06-30', '2025-07-02', 1, 2, 960000, 288000, 150000, 1110000, 1110000, 0, 'Đã hoàn thành', '2025-06-13 05:00:00', '2025-06-30 14:49:00', '2025-07-02 11:42:00', 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250043', 'ND001', 'KH010', 'P202', '2025-08-23', '2025-08-25', 1, 2, 1300000, 390000, 0, 1300000, 390000, 910000, 'Đã xác nhận', '2025-08-13 11:00:00', NULL, NULL, 'Có mang theo thú cưng nhỏ');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250044', 'ND003', 'KH035', 'P204', '2025-07-11', '2025-07-13', 3, 2, 1400000, 420000, 0, 1400000, 1400000, 0, 'Đã hoàn thành', '2025-07-07 13:00:00', '2025-07-11 15:27:00', '2025-07-13 11:58:00', NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250045', 'ND003', 'KH020', 'P301', '2025-06-06', '2025-06-10', 1, 4, 3800000, 1140000, 250000, 4050000, 4050000, 0, 'Đã hoàn thành', '2025-05-24 10:00:00', '2025-06-06 14:31:00', '2025-06-10 11:33:00', 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250046', 'ND003', 'KH017', 'P102', '2025-08-25', '2025-08-27', 2, 2, 900000, 270000, 0, 900000, 270000, 630000, 'Đã hủy', '2025-08-02 08:00:00', NULL, NULL, 'Muốn phòng tầng cao');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250047', 'ND003', 'KH017', 'P202', '2025-07-09', '2025-07-11', 2, 2, 1300000, 390000, 0, 1300000, 0, 1300000, 'Đã hủy', '2025-07-04 13:00:00', NULL, NULL, 'Đón sớm nếu được');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250048', 'ND003', 'KH019', 'P302', '2025-09-15', '2025-09-16', 3, 1, 980000, 294000, 380000, 1360000, 1360000, 0, 'Đã hoàn thành', '2025-08-17 06:00:00', '2025-09-15 14:06:00', '2025-09-16 11:58:00', NULL);
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250049', 'ND001', 'KH020', 'P203', '2025-06-05', '2025-06-08', 2, 3, 2040000, 612000, 0, 2040000, 0, 2040000, 'Chờ đặt cọc', '2025-06-01 12:00:00', NULL, NULL, 'Cần thêm gối');
INSERT INTO `DONDATPHONG` (`MaDon`, `MaND`, `MaKH`, `MaPhong`, `NgayNhanPhong`, `NgayTraPhong`, `SoKhach`, `SoDem`, `TienPhong`, `TienCocYeuCau`, `TienDichVu`, `TongTien`, `DaThu`, `ConLai`, `TrangThaiDon`, `ThoiGianTaoDon`, `ThoiGianCheckInThucTe`, `ThoiGianCheckOutThucTe`, `YeuCauDacBiet`) VALUES ('DP20250050', 'ND003', 'KH027', 'P103', '2025-06-17', '2025-06-18', 2, 1, 480000, 144000, 0, 480000, 144000, 336000, 'Đã xác nhận', '2025-05-17 12:00:00', NULL, NULL, 'Muốn phòng tầng cao');

SET FOREIGN_KEY_CHECKS = 1;
