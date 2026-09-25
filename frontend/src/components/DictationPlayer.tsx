import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioItemDetail, DictationMode, SubmitStudyRequest, SegmentAnswerDto, WordAnswerDto } from '../types';
import { useAudioSegmentPlayer } from '../hooks/useAudioSegmentPlayer';
import { AudioPlayerBar } from './AudioPlayerBar';
import { ModeSelector } from './ModeSelector';
import { SegmentNav } from './SegmentNav';
import { storage } from '../services/storage';
import {
  Eye,
  EyeOff,
  CheckCircle,
  HelpCircle,
  Trophy,
  ArrowRight,
  Send,
  User as SpeakerIcon,
  RotateCcw,
} from 'lucide-react';

interface DictationPlayerProps {
  item: AudioItemDetail;
  onFinishSession: (submission: SubmitStudyRequest) => void;
  onBack: () => void;
  onOpenShortcuts?: () => void;
}

export const DictationPlayer: React.FC<DictationPlayerProps> = ({
  item,
  onFinishSession,
  onBack,
  onOpenShortcuts,
}) => {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [mode, setMode] = useState<DictationMode>('MEDIUM');
  const [userInputs, setUserInputs] = useState<Record<number, Record<number, string>>>({});
  const [fullTextInputs, setFullTextInputs] = useState<Record<number, string>>({});
  const [checkedSegmentIds, setCheckedSegmentIds] = useState<Set<number>>(new Set());
  const [revealedSegmentIds, setRevealedSegmentIds] = useState<Set<number>>(new Set());
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Initialize from LocalStorage draft if exists
  useEffect(() => {
    const draft = storage.getDraft(item.id);
    if (draft) {
      if (draft.mode) setMode(draft.mode);
      if (typeof draft.activeSegmentIndex === 'number' && draft.activeSegmentIndex < item.segments.length) {
        setActiveSegmentIndex(draft.activeSegmentIndex);
      }
      if (draft.userInputs) setUserInputs(draft.userInputs);
      if (draft.fullTextInputs) setFullTextInputs(draft.fullTextInputs);
      if (draft.checkedSegmentIds) setCheckedSegmentIds(new Set(draft.checkedSegmentIds));
      if (draft.revealedSegmentIds) setRevealedSegmentIds(new Set(draft.revealedSegmentIds));

      const timeStr = new Date(draft.updatedAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setDraftSavedTime(timeStr);
    }
  }, [item.id, item.segments.length]);

  // Debounced auto-save to LocalStorage whenever inputs change
  useEffect(() => {
    const hasAnyInput =
      Object.keys(userInputs).length > 0 ||
      Object.keys(fullTextInputs).length > 0 ||
      checkedSegmentIds.size > 0;

    if (!hasAnyInput) return;

    const timer = setTimeout(() => {
      storage.saveDraft(item.id, {
        mode,
        activeSegmentIndex,
        userInputs,
        fullTextInputs,
        checkedSegmentIds,
        revealedSegmentIds,
      });
      const timeStr = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setDraftSavedTime(timeStr);
    }, 600);

    return () => clearTimeout(timer);
  }, [item.id, mode, activeSegmentIndex, userInputs, fullTextInputs, checkedSegmentIds, revealedSegmentIds]);

  const handleResetSession = () => {
    if (confirm('Bạn có chắc chắn muốn xóa bản nháp và làm lại từ đầu không?')) {
      storage.clearDraft(item.id);
      setUserInputs({});
      setFullTextInputs({});
      setCheckedSegmentIds(new Set());
      setRevealedSegmentIds(new Set());
      setActiveSegmentIndex(0);
      setDraftSavedTime(null);
    }
  };

  const currentSegment = item.segments[activeSegmentIndex] || item.segments[0];

  // Audio Segment Hook
  const {
    isPlaying,
    currentTime,
    playbackRate,
    autoLoop,
    replayCount,
    volume,
    isMuted,
    togglePlay,
    replay,
    changeSpeed,
    setAutoLoop,
    seekRelative,
    changeVolume,
    toggleMute,
  } = useAudioSegmentPlayer({
    audioUrl: item.audioUrl,
    startTime: currentSegment ? Number(currentSegment.startTime) : 0,
    endTime: currentSegment ? Number(currentSegment.endTime) : 0,
  });

  const normalize = (w: string): string => {
    if (!w) return '';
    return w.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  };

  // Determine if a token should be blanked based on current mode
  const isTokenBlank = useCallback(
    (token: { isKeyword: boolean }, wordIndex: number): boolean => {
      if (mode === 'MEDIUM') {
        return token.isKeyword;
      }
      if (mode === 'HARD') {
        return token.isKeyword || wordIndex % 2 === 0;
      }
      return true; // FULL_SENTENCE mode
    },
    [mode]
  );

  // Focus the first input field on segment switch
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [activeSegmentIndex, mode]);

  // Handle word input change
  const handleWordChange = (segmentId: number, wordIndex: number, val: string) => {
    setUserInputs((prev) => ({
      ...prev,
      [segmentId]: {
        ...(prev[segmentId] || {}),
        [wordIndex]: val,
      },
    }));
  };

  // Handle full text change
  const handleFullTextChange = (segmentId: number, val: string) => {
    setFullTextInputs((prev) => ({
      ...prev,
      [segmentId]: val,
    }));
  };

  // Check current segment answer
  const handleCheckSegment = () => {
    if (!currentSegment) return;
    setCheckedSegmentIds((prev) => new Set(prev).add(currentSegment.id));
  };

  // Toggle reveal answer for current segment
  const handleToggleReveal = () => {
    if (!currentSegment) return;
    setRevealedSegmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentSegment.id)) {
        next.delete(currentSegment.id);
      } else {
        next.add(currentSegment.id);
      }
      return next;
    });
  };

  // Navigate to next segment or submit
  const handleNextOrFinish = () => {
    if (activeSegmentIndex < item.segments.length - 1) {
      setActiveSegmentIndex((prev) => prev + 1);
    } else {
      // Build submission request
      const answers: SegmentAnswerDto[] = item.segments.map((seg) => {
        if (mode === 'FULL_SENTENCE') {
          return {
            segmentId: seg.id,
            fullText: fullTextInputs[seg.id] || '',
          };
        } else {
          const segAnswers = userInputs[seg.id] || {};
          const wordAnswers: WordAnswerDto[] = (seg.tokens || []).map((tok, idx) => ({
            wordIndex: idx,
            targetWord: tok.word,
            userWord: segAnswers[idx] || '',
          }));
          return {
            segmentId: seg.id,
            wordAnswers,
          };
        }
      });

      const submission: SubmitStudyRequest = {
        itemId: item.id,
        mode,
        replaysCount: replayCount,
        answers,
      };

      storage.clearDraft(item.id);
      onFinishSession(submission);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + ArrowLeft / Right for segment navigation
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeSegmentIndex > 0) setActiveSegmentIndex((i) => i - 1);
        return;
      }
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeSegmentIndex < item.segments.length - 1) {
          setActiveSegmentIndex((i) => i + 1);
        }
        return;
      }

      // Ctrl + Space always toggles audio
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Ctrl + H toggles reveal answer
      if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handleToggleReveal();
        return;
      }

      // Space when not typing in text fields
      const isInput =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (!isInput && e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Enter to check or advance
      if (e.key === 'Enter' && !e.shiftKey) {
        if (checkedSegmentIds.has(currentSegment.id)) {
          handleNextOrFinish();
        } else {
          handleCheckSegment();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSegmentIndex, item.segments.length, checkedSegmentIds, currentSegment, togglePlay]);

  const isChecked = checkedSegmentIds.has(currentSegment.id);
  const isRevealed = revealedSegmentIds.has(currentSegment.id);
  const isLastSegment = activeSegmentIndex === item.segments.length - 1;

  // Calculate live segment score if checked
  let segmentTotalWords = 0;
  let segmentCorrectWords = 0;
  if (currentSegment && currentSegment.tokens) {
    currentSegment.tokens.forEach((tok, idx) => {
      const isBlank = isTokenBlank(tok, idx);
      if (isBlank) {
        segmentTotalWords++;
        const typed = (userInputs[currentSegment.id] || {})[idx] || '';
        if (normalize(typed) === normalize(tok.word)) {
          segmentCorrectWords++;
        }
      }
    });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Bar: Back, Shortcuts, Auto-save Badge & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            &larr; Chọn bài khác
          </button>

          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-300 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 transition-all hover:bg-brand-500/20"
              title="Xem bảng phím tắt & hướng dẫn"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Phím tắt</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {draftSavedTime && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Tự động lưu vào trình duyệt"></span>
              <span className="hidden sm:inline">Lưu nháp: {draftSavedTime}</span>
              <button
                type="button"
                onClick={handleResetSession}
                className="text-slate-400 hover:text-rose-400 font-medium flex items-center gap-1 ml-1 pl-2 border-l border-slate-800 transition-colors"
                title="Xóa nháp và làm lại từ đầu"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden md:inline">Làm lại</span>
              </button>
            </div>
          )}

          <ModeSelector currentMode={mode} onChangeMode={setMode} disabled={isChecked} />
        </div>
      </div>

      {/* Segment Navigation */}
      <SegmentNav
        segments={item.segments}
        activeIndex={activeSegmentIndex}
        onSelectIndex={setActiveSegmentIndex}
        checkedSegmentIds={checkedSegmentIds}
      />

      {/* Audio Controller Bar */}
      <AudioPlayerBar
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onReplay={replay}
        replayCount={replayCount}
        autoLoop={autoLoop}
        onToggleAutoLoop={() => setAutoLoop(!autoLoop)}
        playbackRate={playbackRate}
        onChangeSpeed={changeSpeed}
        currentTime={currentTime}
        startTime={Number(currentSegment.startTime)}
        endTime={Number(currentSegment.endTime)}
        volume={volume}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onChangeVolume={changeVolume}
        onSeekRelative={seekRelative}
      />

      {/* Workspace Panel */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative shadow-2xl">
        {/* Segment Meta */}
        <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
              Câu {activeSegmentIndex + 1} / {item.segments.length}
            </span>
            {currentSegment.speaker && (
              <span className="flex items-center gap-1 text-xs text-slate-400 font-medium px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
                <SpeakerIcon className="w-3.5 h-3.5 text-slate-500" />
                {currentSegment.speaker}
              </span>
            )}
          </div>

          {/* Reveal answer button */}
          <button
            type="button"
            onClick={handleToggleReveal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isRevealed
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'glass-card border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isRevealed ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
          </button>
        </div>

        {/* Revealed Transcript Box */}
        {isRevealed && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-sm leading-relaxed animate-in fade-in">
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Đáp án Transcript ETS:
            </p>
            <p className="font-medium italic">"{currentSegment.fullTranscript}"</p>
          </div>
        )}

        {/* Interactive Input Form */}
        {mode === 'FULL_SENTENCE' ? (
          /* Full Sentence Mode */
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-400">
              Nghe và gõ lại toàn bộ câu nói bằng tiếng Anh:
            </label>
            <textarea
              rows={3}
              value={fullTextInputs[currentSegment.id] || ''}
              onChange={(e) => handleFullTextChange(currentSegment.id, e.target.value)}
              placeholder="Gõ toàn bộ câu nghe được vào đây..."
              className="w-full p-4 rounded-2xl glass-input text-base text-slate-100 placeholder-slate-600 resize-none font-medium leading-relaxed"
              autoFocus
            />

            {isChecked && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-sm">
                <p className="text-xs text-slate-400 font-semibold">Đối chiếu câu gốc:</p>
                <p className="text-emerald-400 font-medium">"{currentSegment.fullTranscript}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Cloze Modes (Medium / Hard) */
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-3.5 text-base sm:text-lg leading-loose py-2">
            {(currentSegment.tokens || []).map((tok, idx) => {
              const isBlank = isTokenBlank(tok, idx);

              if (!isBlank) {
                // Static visible word
                return (
                  <span key={idx} className="text-slate-300 font-medium">
                    {tok.word}
                  </span>
                );
              }

              // Blank input word
              const typedVal = (userInputs[currentSegment.id] || {})[idx] || '';
              const isMatch = normalize(typedVal) === normalize(tok.word);

              return (
                <div key={idx} className="inline-flex flex-col items-center relative group">
                  <input
                    ref={idx === 0 ? firstInputRef : undefined}
                    type="text"
                    value={typedVal}
                    onChange={(e) => handleWordChange(currentSegment.id, idx, e.target.value)}
                    placeholder={mode === 'HARD' ? `${tok.word.charAt(0)}...` : '___'}
                    style={{ width: `${Math.max(tok.word.length * 14 + 16, 56)}px` }}
                    className={`px-2.5 py-1 text-center rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      isChecked
                        ? isMatch
                          ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-300 shadow-glow-emerald'
                          : 'bg-rose-950/60 border border-rose-500 text-rose-300 line-through'
                        : 'glass-input text-slate-100 focus:border-brand-500 focus:shadow-glow-indigo'
                    }`}
                  />

                  {/* Show target word above if checked and wrong */}
                  {isChecked && !isMatch && (
                    <span className="text-[11px] font-bold text-emerald-400 mt-1">
                      {tok.word}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Live score if checked */}
        {isChecked && mode !== 'FULL_SENTENCE' && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Kết quả: Đúng {segmentCorrectWords}/{segmentTotalWords} từ
            </span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                segmentCorrectWords === segmentTotalWords
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {segmentTotalWords > 0
                ? `${Math.round((segmentCorrectWords / segmentTotalWords) * 100)}% Chính xác`
                : '100% Chính xác'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Mẹo: Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Space</kbd> để nghe lại,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Enter</kbd> để kiểm tra
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isChecked ? (
              <button
                type="button"
                onClick={handleCheckSegment}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-glow-indigo active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Kiểm tra câu này (Enter)</span>
              </button>
            ) : isLastSegment ? (
              <button
                type="button"
                onClick={handleNextOrFinish}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs transition-all shadow-glow-emerald active:scale-95 flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Nộp bài & Xem kết quả</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextOrFinish}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-glow-indigo active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
