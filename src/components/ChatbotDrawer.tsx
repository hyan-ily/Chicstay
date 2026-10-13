import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  HelpCircle,
  Calendar,
  BedDouble,
  DollarSign,
  Clock,
  RotateCcw
} from 'lucide-react';
import { useHomestay } from '../context/HomestayContext';
import { formatVND } from '../utils/helpers';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNavigateToTab: (tab: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isOpen,
  onOpen,
  onClose,
  onNavigateToTab,
}) => {
  const { rooms, bookings, customers, services, serviceItems, paymentReceipts } = useHomestay();

  // ===== Vị trí widget: mặc định cố định góc dưới-phải; kéo header để di chuyển (offset so với góc) =====
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return; // không kéo khi bấm nút X
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = panelRef.current;
    if (!d || !el) return;
    // Kẹp trong viewport: widget neo ở bottom-24/right-6 nên offset âm = lên trên/sang trái
    const minX = -(window.innerWidth - el.offsetWidth - 24 - 8);
    const minY = -(window.innerHeight - el.offsetHeight - 96 - 8);
    setPos({
      x: Math.min(16, Math.max(minX, d.ox + e.clientX - d.sx)),
      y: Math.min(72, Math.max(minY, d.oy + e.clientY - d.sy)),
    });
  };
  const onDragEnd = () => { dragRef.current = null; };

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: 'Xin chào Quản lý! Tôi là Chatbot hỗ trợ quản lý homestay Chicstay. Tôi có thể hỗ trợ bạn tra cứu phòng trống thời gian thực, kiểm tra đơn đặt phòng, doanh thu, hướng dẫn phụ thu D008/D009 hoặc chính sách đặt cọc 30% & hoàn tiền 48h.',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'Hôm nay có bao nhiêu phòng trống?',
    'Tổng doanh thu thực tế đã thu?',
    'Chính sách đặt cọc và hoàn cọc?',
    'Quy định phụ thu check-in sớm D008?',
    'Quy định trả phòng muộn D009?',
    'Có đơn nào quá hạn cọc 12h không?',
    'Top 5 dịch vụ được dùng nhiều nhất?',
    'Top 5 phòng được thuê nhiều nhất?',
    'Khách hàng quay lại trên 3 lần?',
    'Doanh thu cao nhất theo ngày/tháng/mùa?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const totalRev = paymentReceipts
      .filter((p) => p.LoaiPhieu === 'Cọc' || p.LoaiPhieu === 'Tất toán')
      .reduce((s, p) => s + p.SoTien, 0);

    const contextPayload = {
      totalRooms: rooms.length,
      rooms: rooms.map((r) => ({
        MaPhong: r.MaPhong,
        TenPhong: r.TenPhong,
        TrangThaiPhong: r.TrangThaiPhong,
        GiaPhong: r.GiaPhong,
      })),
      totalBookings: bookings.length,
      bookings: bookings.map((b) => ({
        MaDon: b.MaDon,
        MaPhong: b.MaPhong,
        TrangThaiDon: b.TrangThaiDon,
        TongTien: b.TongTien,
        DaThu: b.DaThu,
        ConLai: b.ConLai,
        NgayNhanPhong: b.NgayNhanPhong,
        NgayTraPhong: b.NgayTraPhong,
        ThoiGianTaoDon: b.ThoiGianTaoDon,
        // Bổ sung cho các truy vấn phân tích nâng cao (server tính top/lặp lại/doanh thu)
        MaKH: b.MaKH,
        SoDem: b.SoDem,
        TienPhong: b.TienPhong,
        TienDichVu: b.TienDichVu,
      })),
      customers: customers.map((c) => ({ MaKH: c.MaKH, HoTen: c.HoTen, SoDienThoai: c.SoDienThoai })),
      serviceItems: serviceItems.map((x) => ({
        MaDon: x.MaDon, MaDV: x.MaDV, TenDichVu: x.TenDichVu, SoLuong: x.SoLuong, ThanhTien: x.ThanhTien,
      })),
      receipts: paymentReceipts.map((p) => ({
        MaDon: p.MaDon, LoaiPhieu: p.LoaiPhieu, SoTien: p.SoTien, NgayLap: p.NgayLap,
      })),
      totalRevenue: totalRev,
    };

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: contextPayload,
        }),
      });

      const data = await response.json();
      const replyText = data.reply || 'Xin lỗi, trợ lý chưa xử lý được câu hỏi lúc này.';

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: `Tình trạng phòng Chicstay hiện tại:\n- Sẵn sàng: ${rooms.filter((r) => r.TrangThaiPhong === 'Sẵn sàng').length} phòng\n- Đang sử dụng: ${rooms.filter((r) => r.TrangThaiPhong === 'Đang sử dụng').length} phòng\n- Chờ dọn: ${rooms.filter((r) => r.TrangThaiPhong === 'Chờ dọn phòng').length} phòng.\n\nTổng doanh thu đã thu: ${formatVND(totalRev)}.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ===== Bong bóng mở/đóng cố định góc dưới-phải ===== */}
      <button
        onClick={isOpen ? onClose : onOpen}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
        title={isOpen ? 'Thu nhỏ trợ lý' : 'Chatbot hỗ trợ quản lý'}
        aria-label="Chatbot hỗ trợ quản lý"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* ===== Cửa sổ chat dạng floating widget (không chặn thao tác phần còn lại của trang) ===== */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
          className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] sm:w-[380px] h-[70vh] max-h-[560px] bg-white flex flex-col rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Header = tay nắm kéo thả */}
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="p-3.5 bg-blue-600 text-white flex items-center justify-between cursor-move select-none touch-none shrink-0"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Chatbot hỗ trợ quản lý</h3>
                <span className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Trực tuyến · kéo để di chuyển
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto whitespace-nowrap flex gap-1.5 text-xs shrink-0">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/50 transition-all text-[11px] font-medium shrink-0 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-lg p-3 text-xs shadow-2xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg w-fit text-xs text-slate-500">
                <Bot className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Đang xử lý câu hỏi...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Hỏi về phòng trống, doanh thu, top dịch vụ..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
