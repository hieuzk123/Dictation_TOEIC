import React, { useState } from 'react';
import { X, Keyboard, BookOpen, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { storage } from '../services/storage';

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutModal: React.FC<ShortcutModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'guide'>('shortcuts');

  if (!isOpen) return null;

  const handleClose = () => {
    storage.setOnboardingSeen();
    onClose();
  };

  const shortcuts = [
    {
      keys: ['Space'],
      desc: 'Phát / Tạm dừng câu hiện tại (khi không focus ô gõ)',
      extra: 'Ctrl + Space hoạt động ở mọi nơi',
    },
    {
      keys: ['Enter'],
      desc: 'Kiểm tra câu hiện tại / Chuyển câu tiếp theo',
      extra: 'Tự động tính đúng/sai tức thì',
    },
    {
      keys: ['Ctrl', '→'],
      desc: 'Chuyển sang câu tiếp theo',
      extra: 'Duyệt nhanh danh sách câu',
    },
    {
      keys: ['Ctrl', '←'],
      desc: 'Quay lại câu trước đó',
      extra: 'Nghe lại ngữ cảnh câu trước',
    },
    {
      keys: ['Ctrl', 'H'],
      desc: 'Bật / Ẩn đáp án gợi ý (Reveal)',
      extra: 'Trợ giúp khi không nghe ra từ',
    },
    {
      keys: ['Tab'],
      desc: 'Di chuyển sang ô nhập từ tiếp theo',
      extra: 'Shift + Tab để lùi lại ô trước',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Hướng dẫn & Phím tắt Luyện nghe</h2>
              <p className="text-[11px] text-slate-400">Tối ưu hóa thao tác để đạt điểm TOEIC tối đa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'shortcuts'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Bảng phím tắt (Hotkeys)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'guide'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Quy trình học hiệu quả
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'shortcuts' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                {shortcuts.map((sc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{sc.desc}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{sc.extra}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="px-2.5 py-1 text-[11px] font-mono font-bold text-slate-200 bg-slate-800 border border-slate-700 rounded-lg shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-brand-300">
                  <Volume2 className="w-4 h-4 text-brand-400" />
                  3 Bước nghe chép chính tả TOEIC chuẩn
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>
                    <strong className="text-white">Nghe tổng quan câu</strong>: Bấm <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">Space</kbd> để nghe trọn vẹn câu, nắm ý chính của người nói.
                  </li>
                  <li>
                    <strong className="text-white">Điền vào chỗ trống</strong>: Gõ các từ bạn nghe được. Hệ thống đã tự động lọc các từ khóa (Keywords) quan trọng hay xuất hiện trong bài thi.
                  </li>
                  <li>
                    <strong className="text-white">Kiểm tra & Sửa lỗi</strong>: Bấm <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">Enter</kbd>. Từ đúng sẽ sáng xanh, từ sai hiển thị đỏ để bạn nghe lại và hoàn thiện.
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs font-bold text-emerald-400 mb-1">1. Chế độ Trung bình</div>
                  <div className="text-[11px] text-slate-400">Đục lỗ 30-40% từ khóa. Phù hợp làm quen từ mới và cấu trúc câu.</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs font-bold text-amber-400 mb-1">2. Chế độ Khó</div>
                  <div className="text-[11px] text-slate-400">Đục lỗ 70-80% số từ. Rèn luyện phản xạ nghe nối âm và từ loại.</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs font-bold text-rose-400 mb-1">3. Chế độ Cả câu</div>
                  <div className="text-[11px] text-slate-400">Ẩn toàn bộ câu. Thử thách đỉnh cao cho mục tiêu 800+ TOEIC.</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hệ thống tự động lưu bản nháp liên tục, an tâm không sợ mất tiến độ khi rớt mạng hoặc tải lại trang!</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/30">
          <span className="text-[11px] text-slate-400">Bấm phím <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Esc</kbd> để đóng</span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-500/20"
          >
            Đã hiểu & Bắt đầu luyện tập
          </button>
        </div>
      </div>
    </div>
  );
};
