import React from 'react';
import type { AudioItemSummary } from '../types';
import { Play, Clock, Layers, MessageSquare, Volume2, ArrowRight } from 'lucide-react';

interface ItemCardProps {
  item: AudioItemSummary;
  onSelect: (item: AudioItemSummary) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPart3 = item.part === 3;

  return (
    <div className="group relative rounded-2xl glass-card p-5 border border-slate-800/80 hover:border-brand-500/40 transition-all duration-300 hover:shadow-glow-indigo flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
              isPart3
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isPart3 ? <MessageSquare className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            Part {item.part} • Short {isPart3 ? 'Conversations' : 'Talks'}
          </span>

          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {formatDuration(item.totalDuration)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2 mb-2">
          {item.title}
        </h3>

        {/* Details row */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-5">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{item.totalSegments} câu chép chính tả</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onSelect(item)}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 group-hover:bg-brand-600 text-slate-200 group-hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700/60 group-hover:border-brand-500 shadow-sm"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Bắt đầu luyện tập</span>
        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </button>
    </div>
  );
};
