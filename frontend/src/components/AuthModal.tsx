import React, { useState } from 'react';
import { X, Lock, User, Mail, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        if (!usernameOrEmail.trim() || !email.trim() || !password) {
          setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
          setIsSubmitting(false);
          return;
        }
        await register({
          username: usernameOrEmail.trim(),
          email: email.trim(),
          password,
          fullName: fullName.trim() || undefined,
        });
      } else {
        if (!usernameOrEmail.trim() || !password) {
          setError('Vui lòng nhập tên đăng nhập/email và mật khẩu.');
          setIsSubmitting(false);
          return;
        }
        await login({
          usernameOrEmail: usernameOrEmail.trim(),
          password,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = () => {
    setIsRegister(false);
    setUsernameOrEmail('demo_user');
    setPassword('ToeicDictation@2026!');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700/50">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`text-lg font-bold transition-colors ${
              !isRegister ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1 -mb-3.5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`text-lg font-bold transition-colors ${
              isRegister ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1 -mb-3.5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Quick Demo Button */}
        {!isRegister && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-200 transition-all shadow-glow-indigo"
            >
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
              Dùng tài khoản mẫu (demo_user / ToeicDictation@2026!)
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isRegister ? 'Tên đăng nhập (Username)' : 'Tên đăng nhập hoặc Email'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={isRegister ? 'student_01' : 'demo_user hoặc email...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500"
                autoFocus
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Họ và tên (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-glow-indigo flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : isRegister ? (
              'Tạo tài khoản'
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
