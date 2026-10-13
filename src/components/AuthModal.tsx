import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Mail, CheckCircle2, AlertCircle, X, LogIn, UserPlus } from 'lucide-react';
import { useHomestay } from '../context/HomestayContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, users } = useHomestay();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Quản lý' | 'Admin'>('Quản lý');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      const ok = login(email, password);
      if (ok) {
        onClose();
      } else {
        setErrorMsg('Email hoặc mật khẩu không chính xác.');
      }
    } else {
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setErrorMsg('Vui lòng điền đầy đủ các trường thông tin.');
        return;
      }
      const ok = register(fullName, email, password, role);
      if (ok) {
        onClose();
      } else {
        setErrorMsg('Email này đã được sử dụng.');
      }
    }
  };

  const handleQuickLogin = (emailPreset: string, passPreset: string) => {
    login(emailPreset, passPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="sticky top-0 z-10 bg-white -mx-6 -mt-6 px-6 pt-6 flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              {mode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' : 'TẠO TÀI KHOẢN MỚI'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Demo Accounts */}
        {mode === 'login' && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-blue-900 block">
              Tài khoản mẫu:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('haiyen05tb@gmail.com', '1234567')}
                className="w-full py-1.5 px-3 rounded-lg bg-white border border-blue-200 hover:border-blue-500 text-left text-xs text-slate-800 font-semibold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
              >
                <span>Hải Yến Trần (Admin)</span>
                <span className="text-[10px] text-blue-600 font-mono">1234567</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('minh.quanly@chicstay.com', '1234567')}
                className="w-full py-1.5 px-3 rounded-lg bg-white border border-blue-200 hover:border-blue-500 text-left text-xs text-slate-800 font-semibold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
              >
                <span>Nguyễn Minh Châu (Quản lý)</span>
                <span className="text-[10px] text-blue-600 font-mono">1234567</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên (*):</label>
                <input
                  type="text"
                  required
                  placeholder="Hải Yến Trần"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vai trò:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer"
                >
                  <option value="Quản lý">Quản lý</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email đăng nhập (*):</label>
            <input
              type="email"
              required
              placeholder="admin@chicstay.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mật khẩu (*):</label>
            <input
              type="password"
              required
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {mode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
