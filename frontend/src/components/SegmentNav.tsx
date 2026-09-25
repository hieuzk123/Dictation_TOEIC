import React from 'react';
import type { AudioSegment } from '../types';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface SegmentNavProps {
  segments: AudioSegment[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  checkedSegmentIds: Set<number>;
}

export const SegmentNav: React.FC<SegmentNavProps> = ({
  segments,
  activeIndex,
  onSelectIndex,
  checkedSegmentIds,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 w-full py-2">
      {/* Prev button */}
      <button
        type="button"
        disabled={activeIndex === 0}
        onClick={() => onSelectIndex(activeIndex - 1)}
        className="p-2 rounded-xl glass-card text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        title="Câu trước (Ctrl + Mũi tên Trái)"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Segment Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        {segments.map((seg, idx) => {
          const isActive = activeIndex === idx;
          const isChecked = checkedSegmentIds.has(seg.id);

          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-glow-indigo border border-brand-400/50 scale-105'
                  : isChecked
                  ? 'glass-card border-emerald-500/40 text-emerald-400 hover:border-emerald-500'
                  : 'glass-card text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span>{idx + 1}</span>
              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        type="button"
        disabled={activeIndex === segments.length - 1}
        onClick={() => onSelectIndex(activeIndex + 1)}
        className="p-2 rounded-xl glass-card text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        title="Câu tiếp theo (Ctrl + Mũi tên Phải)"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
