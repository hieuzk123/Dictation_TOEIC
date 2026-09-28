import React, { useState, useEffect, useRef } from 'react';
import type { AudioItemDetail, ClozeDensity } from '../types';
import { calculateBlankIndices } from '../utils/cloze';
import { ClozeDensitySelector } from './ClozeDensitySelector';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Send,
  HelpCircle,
  User as SpeakerIcon,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  RotateCw,
} from 'lucide-react';

interface FullPassageDictationProps {
  item: AudioItemDetail;
  clozeDensity: ClozeDensity;
  onChangeDensity: (density: ClozeDensity) => void;
  userInputs: Record<number, Record<number, string>>;
  onChangeWord: (segmentId: number, wordIndex: number, val: string) => void;
  questionAnswers: Record<number, string>;
  onChangeQuestionAnswer: (questionId: number, option: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  onBack: () => void;
  onOpenShortcuts?: () => void;
  modeSelectorNode?: React.ReactNode;
}

export const FullPassageDictation: React.FC<FullPassageDictationProps> = ({
  item,
  clozeDensity,
  onChangeDensity,
  userInputs,
  onChangeWord,
  questionAnswers,
  onChangeQuestionAnswer,
  onSubmit,
  isSubmitting = false,
  onBack,
  onOpenShortcuts,
  modeSelectorNode,
}) => {
  // Continuous audio state for the full passage
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(Number(item.totalDuration) || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio(item.audioUrl);
    audioRef.current = audio;
    audio.preload = 'auto';

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      audio.currentTime = 0;
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [item.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn('Audio play error:', e));
    }
  };

  const seekRelative = (seconds: number) => {
    if (!audioRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const nextTime = parseFloat(e.target.value);
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const changeSpeed = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeVolume = (val: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = val;
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const formatTime = (timeInSec: number): string => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pre-calculate blanks per segment based on clozeDensity
  const blanksPerSegment = React.useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const seg of item.segments) {
      const blanks = calculateBlankIndices(seg.tokens || [], clozeDensity);
      map.set(seg.id, blanks);
    }
    return map;
  }, [item.segments, clozeDensity]);

  // Questions verification
  const questions = item.questions || [];
  const totalQuestions = questions.length;
  const answeredQuestionsCount = questions.filter((q) => Boolean(questionAnswers[q.id])).length;
  const allQuestionsAnswered = totalQuestions === 0 || answeredQuestionsCount === totalQuestions;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
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

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ClozeDensitySelector
            density={clozeDensity}
            onChangeDensity={onChangeDensity}
          />

          {modeSelectorNode}
        </div>
      </div>

      {/* Full Continuous Audio Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 text-[11px]">
              Part {item.part} &bull; Câu {item.itemNumber}
            </span>
            <span className="font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
              {item.title}
            </span>
          </div>

          <div className="text-slate-400 font-mono text-xs">
            <span className="text-brand-400 font-semibold">{formatTime(currentTime)}</span>
            <span className="mx-1 text-slate-600">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="w-full flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-2 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        {/* Player Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => seekRelative(-5)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700"
              title="Lùi 5s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="px-4 py-2 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-bold flex items-center gap-2 shadow-glow-indigo transition-all transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span className="text-xs">{isPlaying ? 'Tạm dừng' : 'Phát toàn bài'}</span>
            </button>

            <button
              type="button"
              onClick={() => seekRelative(5)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700"
              title="Tua 5s"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
              {[0.75, 1.0, 1.25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => changeSpeed(rate)}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition-all ${
                    playbackRate === rate
                      ? 'bg-slate-700 text-brand-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="text-slate-400 hover:text-slate-200 p-1"
                title={isMuted ? 'Bật âm' : 'Tắt tiếng'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-16 h-1.5 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-brand-500 hidden sm:block"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Script Passage Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse"></span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Toàn bộ bài nghe (Full Passage Dictation - Đục lỗ {clozeDensity}%)
            </h2>
          </div>
          <span className="text-xs text-slate-400 italic">
            Gõ các từ còn thiếu vào ô trống, không cần viết hoa/thường
          </span>
        </div>

        {/* Dialogue / Talk Script Lines */}
        <div className="space-y-4 text-base sm:text-lg leading-loose py-2">
          {item.segments.map((seg) => {
            const blanks = blanksPerSegment.get(seg.id) || new Set();
            const segInputs = userInputs[seg.id] || {};

            return (
              <div
                key={seg.id}
                className="p-3.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/60 transition-colors"
              >
                {/* Optional Speaker header */}
                {seg.speaker && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs text-brand-400 font-semibold">
                    <SpeakerIcon className="w-3.5 h-3.5 text-brand-400/80" />
                    <span>{seg.speaker}:</span>
                  </div>
                )}

                {/* Tokens and Input Blanks */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-3">
                  {(seg.tokens || []).map((tok, tokIdx) => {
                    const isBlank = blanks.has(tokIdx);

                    if (!isBlank) {
                      return (
                        <span key={tokIdx} className="text-slate-200 font-medium">
                          {tok.word}
                        </span>
                      );
                    }

                    const val = segInputs[tokIdx] || '';
                    const calcWidth = Math.max(tok.word.length * 13 + 20, 56);

                    return (
                      <input
                        key={tokIdx}
                        type="text"
                        value={val}
                        onChange={(e) => onChangeWord(seg.id, tokIdx, e.target.value)}
                        placeholder=""
                        style={{ width: `${calcWidth}px` }}
                        className="px-2 py-0.5 text-center rounded-xl text-sm font-semibold transition-all shadow-sm glass-input text-slate-100 focus:border-brand-500 focus:shadow-glow-indigo"
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOEIC ETS Multiple-Choice Questions Card */}
      {questions.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-900/40 shadow-2xl relative bg-gradient-to-b from-indigo-950/20 to-slate-950/40">
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-indigo-900/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <FileQuestion className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Câu hỏi trắc nghiệm TOEIC (ETS Part {item.part})
                </h3>
                <p className="text-xs text-slate-400">
                  Trả lời đủ cả {totalQuestions} câu hỏi dưới đây trước khi nộp bài.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  allQuestionsAnswered
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                Đã làm: {answeredQuestionsCount} / {totalQuestions} câu
              </span>
            </div>
          </div>

          {/* 3 Questions List */}
          <div className="space-y-6">
            {questions.map((q) => {
              const selectedOption = questionAnswers[q.id];
              const options = [
                { key: 'A', text: q.optionA },
                { key: 'B', text: q.optionB },
                { key: 'C', text: q.optionC },
                { key: 'D', text: q.optionD },
              ];

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-3"
                >
                  <p className="text-sm font-bold text-slate-100 flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-black border border-brand-500/30">
                      {q.questionNumber}
                    </span>
                    <span>{q.questionText}</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {options.map((opt) => {
                      const isSelected = selectedOption === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => onChangeQuestionAnswer(q.id, opt.key)}
                          className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            isSelected
                              ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow-indigo'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-brand-500 text-white border-brand-400'
                                : 'bg-slate-900 text-slate-400 border-slate-700'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="text-xs font-medium leading-relaxed pt-0.5">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submission Footer Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          {!allQuestionsAnswered ? (
            <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Vui lòng chọn đáp án cho đủ {totalQuestions} câu hỏi trắc nghiệm để nộp bài.</span>
            </p>
          ) : (
            <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã hoàn thành toàn bộ câu hỏi trắc nghiệm! Sẵn sàng nộp bài.</span>
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!allQuestionsAnswered || isSubmitting}
          onClick={onSubmit}
          className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all transform ${
            allQuestionsAnswered && !isSubmitting
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-glow-emerald cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Đang nộp bài...' : 'Nộp bài & Xem kết quả'}</span>
        </button>
      </div>
    </div>
  );
};
