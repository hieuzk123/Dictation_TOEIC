import React, { useState, useMemo, useEffect } from 'react';
import type { ToeicTest, AudioItemSummary } from '../types';
import { ItemCard } from './ItemCard';
import {
  BookOpen,
  Sparkles,
  Filter,
  CheckCircle2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface TestSelectorProps {
  tests: ToeicTest[];
  selectedTest: ToeicTest | null;
  onSelectTest: (test: ToeicTest) => void;
  items: AudioItemSummary[];
  loadingItems: boolean;
  onSelectItem: (item: AudioItemSummary) => void;
}

const ITEMS_PER_PAGE = 6;

export const TestSelector: React.FC<TestSelectorProps> = ({
  tests,
  selectedTest,
  onSelectTest,
  items,
  loadingItems,
  onSelectItem,
}) => {
  const [activePartFilter, setActivePartFilter] = useState<'ALL' | 3 | 4>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset to page 1 whenever filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activePartFilter, searchQuery]);

  // Filter items based on active Part and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesPart = activePartFilter === 'ALL' || item.part === activePartFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        String(item.itemNumber).includes(query);
      return matchesPart && matchesSearch;
    });
  }, [items, activePartFilter, searchQuery]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handleResetFilters = () => {
    setActivePartFilter('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

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
              {selectedTest?.description ||
                'Chọn đề thi và bài nghe bên dưới để bắt đầu luyện tập nghe chép chính tả chuẩn đề thi thật.'}
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

      {/* Search Bar & Part Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, số câu (vd: Toner, Delay, 32-34)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl glass-input text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Part Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start md:self-auto">
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

        {/* Status & Results Summary Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-300">
              Hiển thị {paginatedItems.length} / {filteredItems.length} bài
            </span>
            {filteredItems.length !== items.length && (
              <span className="text-slate-500">(tổng số {items.length} bài)</span>
            )}
          </div>

          {(searchQuery || activePartFilter !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Items Grid */}
      {loadingItems ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl glass-card animate-pulse"></div>
          ))}
        </div>
      ) : paginatedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-2xl glass-card border border-dashed border-slate-800">
          <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-300 font-medium">Không tìm thấy bài nghe phù hợp</p>
          <p className="text-xs text-slate-500 mt-1">
            Hãy thử từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ bài nghe.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại bộ lọc & tìm kiếm</span>
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {!loadingItems && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trước</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? 'bg-brand-600 text-white shadow-glow-indigo'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
          >
            <span>Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
