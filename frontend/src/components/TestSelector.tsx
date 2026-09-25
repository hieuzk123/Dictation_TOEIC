import React, { useState } from 'react';
import type { ToeicTest, AudioItemSummary } from '../types';
import { ItemCard } from './ItemCard';
import { BookOpen, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

interface TestSelectorProps {
  tests: ToeicTest[];
  selectedTest: ToeicTest | null;
  onSelectTest: (test: ToeicTest) => void;
  items: AudioItemSummary[];
  loadingItems: boolean;
  onSelectItem: (item: AudioItemSummary) => void;
}

export const TestSelector: React.FC<TestSelectorProps> = ({
  tests,
  selectedTest,
  onSelectTest,
  items,
  loadingItems,
  onSelectItem,
}) => {
  const [activePartFilter, setActivePartFilter] = useState<'ALL' | 3 | 4>('ALL');

  const filteredItems = items.filter((item) => {
    if (activePartFilter === 'ALL') return true;
    return item.part === activePartFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Test Hero / Header */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-glow-indigo">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phương pháp Dictation Ngắt câu Tự động (Whisper AI)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {selectedTest ? selectedTest.title : 'Đề thi TOEIC Listening'}
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {selectedTest?.description || 'Chọn đề thi và bài nghe bên dưới để bắt đầu luyện tập nghe chép chính tả chuẩn đề thi thật.'}
            </p>
          </div>

          {/* Test dropdown if multiple tests */}
          {tests.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Chọn bộ đề:</span>
              <select
                value={selectedTest?.id || ''}
                onChange={(e) => {
                  const found = tests.find((t) => t.id === Number(e.target.value));
                  if (found) onSelectTest(found);
                }}
                className="glass-input rounded-xl px-3 py-2 text-xs font-semibold text-slate-200"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Phát audio 1 file duy nhất với mốc Seek chính xác</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>3 chế độ đục lỗ: Trung bình, Khó, Toàn câu</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Tự động chấm điểm từ khóa và so khớp tức thì</span>
          </div>
        </div>
      </div>

      {/* Part Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Danh sách bài nghe
          </h2>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-400">
            {filteredItems.length} bài
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActivePartFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePartFilter === 'ALL'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActivePartFilter(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePartFilter === 3
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Part 3 (Hội thoại)
          </button>
          <button
            onClick={() => setActivePartFilter(4)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePartFilter === 4
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Part 4 (Bài nói ngắn)
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {loadingItems ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl glass-card animate-pulse"></div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-2xl glass-card border border-dashed border-slate-800">
          <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Không có bài nghe nào phù hợp bộ lọc.</p>
        </div>
      )}
    </div>
  );
};
