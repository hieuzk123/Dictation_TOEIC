import React from 'react';
import { Headphones, LogOut, History, LogIn } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenHistory?: () => void;
  onHomeClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHistory, onHomeClick }) => {
  const { user, logout, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-glow-indigo group-hover:scale-105 transition-transform">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight group-hover:text-brand-300 transition-colors">
                TOEIC Dictation
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Luyện nghe chép chính tả chuyên sâu Part 3 & 4
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* History Button */}
          {user && (
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-card text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-all active:scale-95"
              title="Xem lịch sử học tập"
            >
              <History className="w-4 h-4 text-brand-400" />
              <span className="hidden sm:inline">Lịch sử làm bài</span>
            </button>
          )}

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-brand-300 shadow-sm">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-indigo transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
