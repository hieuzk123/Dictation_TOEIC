import React, { useState } from 'react';
import type { SubmitStudyResponse } from '../types';
import {
  Trophy,
  Award,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  X
} from 'lucide-react';

interface ResultModalProps {
  result: SubmitStudyResponse | null;
  onClose: () => void;
  onRetry: () => void;
  onBackToTests: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  onClose,
  onRetry,
  onBackToTests,
}) => {
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);

  if (!result) return null;

  const rate = Number(result.accuracyRate);
  let gradeText = 'Cần cố gắng';
  let gradeColor = 'text-amber-400 bg-amber-500/20 border-amber-500/30';
  if (rate >= 90) {
    gradeText = 'Xuất sắc';
    gradeColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
  } else if (rate >= 75) {
    gradeText = 'Tốt';
    gradeColor = 'text-brand-300 bg-brand-500/20 border-brand-500/30';
  } else if (rate >= 50) {
    gradeText = 'Đạt';
    gradeColor = 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30';
  }

  const toggleExpand = (segmentId: number) => {
    setExpandedSegment((prev) => (prev === segmentId ? null : segmentId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel p-6 sm:p-8 border border-slate-700/60 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Score Banner */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 shadow-glow-indigo text-white mb-1">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Kết Quả Luyện Nghe Dictation
          </h2>

          <div className="flex items-center justify-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${gradeColor}`}>
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              {gradeText}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Chế độ: {result.mode}
            </span>
          </div>

          {/* Accuracy Big Number */}
          <div className="py-2">
            <span className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-brand-300 to-indigo-300 bg-clip-text text-transparent">
              {result.accuracyRate}%
            </span>
            <p className="text-xs text-slate-400 mt-1 font-medium">Độ chính xác từ vựng</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-brand-400" />
              Số từ đúng
            </p>
            <p className="text-lg font-bold text-slate-100">
              {result.correctWords} / {result.totalWords}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              Nghe lại
            </p>
            <p className="text-lg font-bold text-slate-100">
              {result.replaysCount} lần
            </p>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              Câu có lỗi
            </p>
            <p className="text-lg font-bold text-slate-100">
              {result.wrongSegmentsCount} câu
            </p>
          </div>
        </div>

        {/* Detailed Breakdown per Segment */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Chi tiết từng câu trong bài:</span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {result.results.map((seg) => {
              const isExpanded = expandedSegment === seg.segmentId;

              return (
                <div
                  key={seg.segmentId}
                  className="rounded-xl glass-card border border-slate-800/80 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(seg.segmentId)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {seg.isPerfect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-200">
                        Câu {seg.segmentIndex}
                      </span>
                      <span className="text-xs text-slate-400 line-clamp-1 max-w-[280px]">
                        "{seg.fullTranscript}"
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className={seg.isPerfect ? 'text-emerald-400' : 'text-amber-400'}>
                        {seg.correctWords}/{seg.totalWords} từ
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Word Match Breakdown */}
                  {isExpanded && (
                    <div className="p-3.5 pt-1 border-t border-slate-800/80 bg-slate-950/60 text-xs space-y-2">
                      <p className="text-slate-400 font-medium">Chi tiết so khớp từ:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seg.wordResults.map((w, wIdx) => (
                          <span
                            key={wIdx}
                            className={`px-2 py-0.5 rounded-lg font-mono text-[11px] ${
                              w.isCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                            title={!w.isCorrect ? `Bạn gõ: "${w.userWord}"` : 'Đúng'}
                          >
                            {w.targetWord}
                            {!w.isCorrect && (
                              <span className="ml-1 opacity-70 line-through">
                                ({w.userWord || 'trống'})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl glass-card text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Luyện tập lại</span>
          </button>

          <button
            type="button"
            onClick={onBackToTests}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-indigo transition-all flex items-center justify-center gap-2"
          >
            <span>Chọn bài nghe khác</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
