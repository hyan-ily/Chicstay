import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API: Download/Get Raw SQL Database
app.get('/api/database/sql', (req: Request, res: Response) => {
  try {
    const sqlPath = path.resolve(process.cwd(), 'chicstay_database.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="chicstay_database.sql"');
      return res.send(sqlContent);
    } else {
      return res.status(404).json({ error: 'SQL file not found' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// PHÂN TÍCH NÂNG CAO CHO CHATBOT (tính bằng code, KHÔNG để LLM tự cộng số)
//   1. TOP 5 dịch vụ / phòng được sử dụng nhiều nhất
//   2. Khách quay lại > 3 lần
//   3. Doanh thu cao nhất theo ngày / tháng / mùa
// =====================================================================
const fmtVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' ₫';
const isValidBooking = (b: any) => b.TrangThaiDon !== 'Đã hủy' && b.TrangThaiDon !== 'No-show';

// Giờ Việt Nam (UTC+7) để ngày/tháng không bị lệch khi phiếu lập sau 17:00 UTC
const vnDate = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);

// Mùa theo dương lịch Việt Nam (chỉnh tại đây nếu homestay dùng mùa du lịch riêng)
const seasonOf = (month: number) =>
  month <= 3 ? 'Xuân (T1–T3)' : month <= 6 ? 'Hè (T4–T6)' : month <= 9 ? 'Thu (T7–T9)' : 'Đông (T10–T12)';

const topN = <T extends Record<string, any>>(arr: T[], key: keyof T, n = 5): T[] =>
  [...arr].sort((a, b) => b[key] - a[key]).slice(0, n);

function buildAnalytics(ctx: any) {
  const rooms: any[] = ctx?.rooms || [];
  const bookings: any[] = (ctx?.bookings || []).filter(isValidBooking);
  const validIds = new Set(bookings.map((b) => b.MaDon));
  const customers: any[] = ctx?.customers || [];
  const items: any[] = (ctx?.serviceItems || []).filter((x: any) => validIds.has(x.MaDon));
  const receipts: any[] = ctx?.receipts || [];

  // --- 1a. Top phòng: xếp theo số lượt thuê, đồng hạng thì theo số đêm ---
  const roomMap = new Map<string, { MaPhong: string; TenPhong: string; luotThue: number; soDem: number; tienPhong: number }>();
  for (const b of bookings) {
    const r = roomMap.get(b.MaPhong) || {
      MaPhong: b.MaPhong,
      TenPhong: rooms.find((x) => x.MaPhong === b.MaPhong)?.TenPhong || b.MaPhong,
      luotThue: 0, soDem: 0, tienPhong: 0,
    };
    r.luotThue += 1; r.soDem += b.SoDem || 0; r.tienPhong += b.TienPhong || 0;
    roomMap.set(b.MaPhong, r);
  }
  const topRooms = [...roomMap.values()]
    .sort((a, b) => b.luotThue - a.luotThue || b.soDem - a.soDem)
    .slice(0, 5);

  // --- 1b. Top dịch vụ: xếp theo số đơn sử dụng, đồng hạng thì theo tổng số lượng ---
  const svcMap = new Map<string, { MaDV: string; TenDichVu: string; soDon: Set<string>; tongSL: number; doanhThu: number }>();
  for (const x of items) {
    const v = svcMap.get(x.MaDV) || { MaDV: x.MaDV, TenDichVu: x.TenDichVu, soDon: new Set<string>(), tongSL: 0, doanhThu: 0 };
    v.soDon.add(x.MaDon); v.tongSL += x.SoLuong || 0; v.doanhThu += x.ThanhTien || 0;
    svcMap.set(x.MaDV, v);
  }
  const topServices = [...svcMap.values()]
    .map((v) => ({ MaDV: v.MaDV, TenDichVu: v.TenDichVu, soDonSuDung: v.soDon.size, tongSoLuong: v.tongSL, doanhThu: v.doanhThu }))
    .sort((a, b) => b.soDonSuDung - a.soDonSuDung || b.tongSoLuong - a.tongSoLuong)
    .slice(0, 5);

  // --- 2. Khách quay lại > 3 lần (đếm đơn hợp lệ, không tính đơn hủy / no-show) ---
  const custMap = new Map<string, { soLan: number; tongChi: number; lanCuoi: string }>();
  for (const b of bookings) {
    const c = custMap.get(b.MaKH) || { soLan: 0, tongChi: 0, lanCuoi: '' };
    c.soLan += 1; c.tongChi += b.TongTien || 0;
    if (b.NgayNhanPhong > c.lanCuoi) c.lanCuoi = b.NgayNhanPhong;
    custMap.set(b.MaKH, c);
  }
  const returningCustomers = [...custMap.entries()]
    .filter(([, c]) => c.soLan > 3)
    .map(([maKH, c]) => {
      const kh = customers.find((x) => x.MaKH === maKH);
      return { MaKH: maKH, HoTen: kh?.HoTen || maKH, SoDienThoai: kh?.SoDienThoai || '', soLanDat: c.soLan, tongChiTieu: c.tongChi, lanGanNhat: c.lanCuoi };
    })
    .sort((a, b) => b.soLanDat - a.soLanDat);

  // --- 3. Doanh thu thực thu = Cọc + Tất toán − Hoàn cọc, gom theo ngày / tháng / mùa ---
  const byDay = new Map<string, number>(), byMonth = new Map<string, number>(), bySeason = new Map<string, number>();
  let total = 0;
  for (const r of receipts) {
    const amt = r.LoaiPhieu === 'Hoàn cọc' ? -r.SoTien : r.LoaiPhieu === 'Cọc' || r.LoaiPhieu === 'Tất toán' ? r.SoTien : 0;
    if (!amt || !r.NgayLap) continue;
    const d = vnDate(r.NgayLap), [y, m] = d.split('-');
    byDay.set(d, (byDay.get(d) || 0) + amt);
    byMonth.set(`${m}/${y}`, (byMonth.get(`${m}/${y}`) || 0) + amt);
    const se = `${seasonOf(parseInt(m, 10))} ${y}`;
    bySeason.set(se, (bySeason.get(se) || 0) + amt);
    total += amt;
  }
  const toRows = (m: Map<string, number>) => topN([...m.entries()].map(([ky, doanhThu]) => ({ ky, doanhThu })), 'doanhThu', 3);

  return {
    topRooms, topServices, returningCustomers,
    revenue: { total, topNgay: toRows(byDay), topThang: toRows(byMonth), topMua: toRows(bySeason) },
  };
}

type AnalyticsIntent = 'top' | 'returning' | 'revenue';
function detectAnalyticsIntents(message: string): AnalyticsIntent[] {
  const l = (message || '').toLowerCase();
  const out: AnalyticsIntent[] = [];
  if (/\btop\b|nhiều nhất|phổ biến|được dùng|được thuê|được sử dụng/.test(l) && /dịch vụ|phòng/.test(l)) out.push('top');
  if (/quay lại|quay trở lại|trên 3 lần|thân thiết|đặt nhiều lần/.test(l)) out.push('returning');
  if (/doanh thu/.test(l) && /cao nhất|ngày|tháng|mùa|đỉnh/.test(l)) out.push('revenue');
  return out;
}

function renderAnalytics(intents: AnalyticsIntent[], a: ReturnType<typeof buildAnalytics>): string {
  const parts: string[] = [];
  if (intents.includes('top')) {
    parts.push(
      'TOP 5 PHÒNG ĐƯỢC THUÊ NHIỀU NHẤT:\n' +
        (a.topRooms.map((r, i) => `${i + 1}. ${r.MaPhong} - ${r.TenPhong}: ${r.luotThue} lượt (${r.soDem} đêm, tiền phòng ${fmtVND(r.tienPhong)})`).join('\n') || 'Chưa có dữ liệu.') +
        '\n\nTOP 5 DỊCH VỤ ĐƯỢC DÙNG NHIỀU NHẤT:\n' +
        (a.topServices.map((s, i) => `${i + 1}. ${s.MaDV} - ${s.TenDichVu}: ${s.soDonSuDung} đơn, tổng SL ${s.tongSoLuong}, doanh thu ${fmtVND(s.doanhThu)}`).join('\n') || 'Chưa có dữ liệu.')
    );
  }
  if (intents.includes('returning')) {
    parts.push(
      'KHÁCH HÀNG QUAY LẠI TRÊN 3 LẦN (đã loại đơn hủy / no-show):\n' +
        (a.returningCustomers.map((c, i) => `${i + 1}. ${c.HoTen} (${c.MaKH}${c.SoDienThoai ? ' · ' + c.SoDienThoai : ''}): ${c.soLanDat} lần, tổng chi ${fmtVND(c.tongChiTieu)}, gần nhất ${c.lanGanNhat}`).join('\n') ||
          'Hiện chưa có khách nào đặt phòng trên 3 lần.')
    );
  }
  if (intents.includes('revenue')) {
    const f = (rows: { ky: string; doanhThu: number }[]) => rows.map((r, i) => `  ${i + 1}. ${r.ky}: ${fmtVND(r.doanhThu)}`).join('\n') || '  Chưa có dữ liệu.';
    parts.push(
      `DOANH THU THỰC THU CAO NHẤT (Cọc + Tất toán − Hoàn cọc; tổng ${fmtVND(a.revenue.total)}):\n- Theo ngày:\n${f(a.revenue.topNgay)}\n- Theo tháng:\n${f(a.revenue.topThang)}\n- Theo mùa:\n${f(a.revenue.topMua)}`
    );
  }
  return parts.join('\n\n');
}

// API: Chatbot Assistant for Chicstay Homestay
app.post('/api/chatbot', async (req: Request, res: Response) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Số liệu phân tích đã tính sẵn bằng code (chính xác, không phụ thuộc LLM)
  const analytics = buildAnalytics(context);
  const analyticsIntents = detectAnalyticsIntents(message);

  // Real-time homestay context summary
  const summaryPrompt = `
Bạn là "Chatbot hỗ trợ quản lý" của hệ thống quản lý homestay Chicstay.
Hãy trả lời ngắn gọn, chuẩn xác, chuyên nghiệp bằng tiếng Việt.
Dưới đây là dữ liệu thực tế thời gian thực của homestay Chicstay:
${JSON.stringify(context || {}, null, 2)}

SỐ LIỆU PHÂN TÍCH ĐÃ TÍNH SẴN (top 5 phòng/dịch vụ, khách quay lại >3 lần, doanh thu cao nhất theo ngày/tháng/mùa).
Khi câu hỏi liên quan, PHẢI dùng đúng các số liệu này, không tự tính lại từ dữ liệu thô:
${JSON.stringify(analytics, null, 2)}

Quy tắc nghiệp vụ của homestay Chicstay cần tuân thủ:
1. Đặt cọc: 30% tiền phòng (làm tròn đến nghìn đồng, không tính tiền dịch vụ). Hạn đặt cọc 12 giờ kể từ khi tạo đơn.
2. Hoàn cọc khi hủy: 
   - Hủy trước 14:00 ngày check-in ít nhất 48 giờ: HOÀN 100% TIỀN CỌC.
   - Hủy dưới 48 giờ hoặc khách không đến (No-show): KHÔNG HOÀN CỌC theo chính sách homestay.
   - Đơn đã check-in không được hủy.
3. Phụ thu nhận phòng sớm: D008 - 150.000 ₫ (trước 14:00 nếu phòng trống).
4. Phụ thu trả phòng muộn: D009 - 150.000 ₫ (sau 12:00 nếu không trùng đơn sau).
5. Trạng thái phòng: Sẵn sàng, Tạm giữ, Đã được đặt, Đang sử dụng, Chờ dọn phòng.

Khi quản lý hỏi về phòng trống, doanh thu, danh sách đơn, khách hàng, hoặc cách thao tác, hãy phân tích dữ liệu trên và trả lời chi tiết, có thể kèm theo gợi ý thao tác tiếp theo.
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${summaryPrompt}\n\nNgười dùng hỏi: "${message}"` }],
          },
        ],
        config: {
          systemInstruction:
            'Bạn là Chatbot hỗ trợ quản lý của hệ thống Quản lý Homestay Chicstay. Hãy hỗ trợ tra cứu dữ liệu phòng, đơn đặt, doanh thu và hướng dẫn quy trình nghiệp vụ rõ ràng, súc tích.',
          temperature: 0.4,
        },
      });

      const reply = response.text || 'Xin lỗi, trợ lý chưa nhận được phản hồi.';
      return res.json({ reply });
    } catch (error: any) {
      console.warn('Gemini API call failed, falling back to smart local assistant:', error?.message);
    }
  }

  // Fallback intelligent response logic
  const lower = (message || '').toLowerCase();
  let fallbackReply = '';

  if (analyticsIntents.length > 0) {
    fallbackReply = renderAnalytics(analyticsIntents, analytics);
  } else if (lower.includes('phòng trống') || lower.includes('bao nhiêu phòng') || lower.includes('tình trạng phòng')) {
    const available = context?.rooms?.filter((r: any) => r.TrangThaiPhong === 'Sẵn sàng') || [];
    const inUse = context?.rooms?.filter((r: any) => r.TrangThaiPhong === 'Đang sử dụng') || [];
    const cleaning = context?.rooms?.filter((r: any) => r.TrangThaiPhong === 'Chờ dọn phòng') || [];
    const reserved = context?.rooms?.filter((r: any) => r.TrangThaiPhong === 'Đã được đặt') || [];
    fallbackReply = `Tình trạng phòng Chicstay hiện tại:\n- Sẵn sàng đón khách (${available.length} phòng): ${available.map((r: any) => r.TenPhong).join(', ') || 'Hết phòng trống'}\n- Đang có khách lưu trú (${inUse.length} phòng): ${inUse.map((r: any) => r.TenPhong).join(', ') || 'Không có'}\n- Đã được đặt trước (${reserved.length} phòng): ${reserved.map((r: any) => r.TenPhong).join(', ') || 'Không có'}\n- Chờ dọn phòng (${cleaning.length} phòng): ${cleaning.map((r: any) => r.TenPhong).join(', ') || '0 phòng'}`;
  } else if (lower.includes('cọc') || lower.includes('hoàn cọc') || lower.includes('chính sách')) {
    fallbackReply = `Chính sách đặt cọc & hoàn cọc Chicstay:\n1. Tiền đặt cọc: Bắt buộc 30% tiền phòng (làm tròn nghìn, không tính dịch vụ). Hạn đóng cọc là trong vòng 12 giờ.\n2. Hoàn cọc:\n- Hủy trước 14:00 ngày check-in ≥ 48 giờ: Hoàn 100% tiền cọc.\n- Hủy < 48 giờ hoặc No-show: Không hoàn cọc theo chính sách.\n- Đơn đã check-in không được phép hủy (phải thực hiện check-out).`;
  } else if (lower.includes('doanh thu') || lower.includes('tiền')) {
    const rev = context?.totalRevenue || 0;
    fallbackReply = `Tổng doanh thu thực tế ghi nhận: ${new Intl.NumberFormat('vi-VN').format(rev)} ₫.\nBạn có thể vào mục Báo cáo hoặc Thanh toán để xem chi tiết từng phiếu thu và hóa đơn tổng hợp.`;
  } else if (lower.includes('d008') || lower.includes('nhận phòng sớm')) {
    fallbackReply = `Quy định nhận phòng sớm (D008):\n- Giờ check-in tiêu chuẩn: 14:00.\n- Nếu khách đến trước 14:00 và phòng đã ở trạng thái "Sẵn sàng", Quản lý có thể chọn check-in sớm với phụ thu D008: 150.000 ₫/lượt.`;
  } else if (lower.includes('d009') || lower.includes('trả phòng muộn')) {
    fallbackReply = `Quy định trả phòng muộn (D009):\n- Giờ check-out tiêu chuẩn: 12:00.\n- Nếu khách trả phòng sau 12:00 (và không bị vướng khách đặt tiếp theo), phụ thu D009 là 150.000 ₫/lượt. Khoản này sẽ được cộng vào hóa đơn tất toán.`;
  } else if (lower.includes('nguyễn') || lower.includes('khách') || lower.includes('booking') || lower.includes('đơn')) {
    const recent = context?.bookings?.[0];
    fallbackReply = `Tìm kiếm thông tin:\nĐơn gần nhất trong hệ thống là ${recent?.MaDon || 'DP20260001'} (Phòng ${recent?.MaPhong || 'P102'}, Trạng thái: ${recent?.TrangThaiDon || 'Đã check-in'}). Bạn có thể vào tab Đơn đặt phòng và dùng thanh tìm kiếm để lọc theo Tên, SĐT hoặc Mã đơn!`;
  } else {
    fallbackReply = `Chào bạn! Tôi là chatbot hỗ trợ quản lý Chicstay. Tôi có thể giúp bạn:\n1. Tra cứu tình trạng phòng trống hôm nay\n2. Báo cáo doanh thu & công nợ các đơn\n3. Hướng dẫn chính sách cọc 30%, hoàn cọc 48h\n4. Hướng dẫn phụ thu check-in sớm D008 / check-out muộn D009\n5. Tìm kiếm đơn đặt phòng & thông tin khách hàng.\n\nBạn cần tra cứu thông tin nào?`;
  }

  return res.json({ reply: fallbackReply });
});

// Setup Vite development middlewares or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chicstay Homestay Management Server is running on http://localhost:${PORT}`);
  });
}

startServer();
