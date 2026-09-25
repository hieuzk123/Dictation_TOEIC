import React, { useState, useEffect } from 'react';
import type { StudyHistory } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { History, X, Clock, Award, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose }) => {
  const { user, openAuthModal } = useAuth();
  const [histories, setHistories] = useState<StudyHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.study.getHistory();
        setHistories(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải lịch sử làm bài.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-bold text-white">Lịch sử Luyện Nghe</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User not logged in notice */}
          {!user ? (
            <div className="text-center py-12 px-4 rounded-2xl glass-card border border-slate-800 space-y-4">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Chưa đăng nhập tài khoản
                </p>
                <p className="text-xs text-slate-400">
                  Đăng nhập để tự động lưu và theo dõi tiến độ luyện nghe trên mọi thiết bị.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="w-full py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-indigo transition-all"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
              <p className="text-xs text-slate-400">Đang tải lịch sử...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          ) : histories.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Bạn chưa có lịch sử làm bài nào. Hãy chọn một bài nghe và bắt đầu luyện tập!
            </div>
          ) : (
            <div className="space-y-3">
              {histories.map((h) => {
                const rate = Number(h.accuracyRate);
                const isHigh = rate >= 80;

                return (
                  <div
                    key={h.id}
                    className="p-4 rounded-2xl glass-card border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {h.itemTitle || `Bài nghe #${h.itemId}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                          isHigh
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {h.accuracyRate}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-slate-500" />
                          {h.mode}
                        </span>
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          x{h.replaysCount}
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(h.completedAt).toLocaleDateString('vi-VN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Hệ thống lưu trữ tự động trên MySQL Server
          </p>
        </div>
      </div>
    </div>
  );
};
