import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
  Repeat,
} from 'lucide-react';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  replayCount: number;
  autoLoop: boolean;
  onToggleAutoLoop: () => void;
  playbackRate: number;
  onChangeSpeed: (rate: number) => void;
  currentTime: number;
  startTime: number;
  endTime: number;
  volume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onChangeVolume: (vol: number) => void;
  onSeekRelative: (seconds: number) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  onTogglePlay,
  onReplay,
  replayCount,
  autoLoop,
  onToggleAutoLoop,
  playbackRate,
  onChangeSpeed,
  currentTime,
  startTime,
  endTime,
  volume,
  isMuted,
  onToggleMute,
  onChangeVolume,
  onSeekRelative,
}) => {
  const segmentDuration = Math.max(endTime - startTime, 0.1);
  const currentInSegment = Math.max(0, Math.min(currentTime - startTime, segmentDuration));
  const progressPercent = Math.min((currentInSegment / segmentDuration) * 100, 100);

  const formatSecs = (sec: number): string => {
    const s = Math.max(0, sec);
    const m = Math.floor(s / 60);
    const remaining = (s % 60).toFixed(1);
    return `${m}:${remaining.padStart(4, '0')}`;
  };

  const speeds = [0.75, 0.9, 1.0, 1.25];

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background glowing gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-indigo-500/5 to-purple-500/5 pointer-events-none"></div>

      {/* Progress Bar within Segment */}
      <div className="relative mb-4">
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden relative cursor-pointer group">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 rounded-full transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
          </div>
        </div>

        {/* Time stamps */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 px-0.5">
          <span>{formatSecs(currentInSegment)}</span>
          <span className="text-slate-500 text-[10px]">
            Đoạn: {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
          </span>
          <span>{formatSecs(segmentDuration)}</span>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Replay & Skip */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReplay}
            className="relative px-3 py-2 rounded-xl glass-card text-xs font-semibold text-slate-200 hover:text-white hover:border-brand-500/50 transition-all flex items-center gap-1.5 active:scale-95"
            title="Nghe lại câu này từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
            <span>Nghe lại</span>
            {replayCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-mono font-bold border border-brand-500/30">
                x{replayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSeekRelative(-2)}
            className="px-2.5 py-2 rounded-xl glass-card text-xs font-semibold text-slate-400 hover:text-white transition-all active:scale-95"
            title="Tua lùi 2s"
          >
            -2s
          </button>
          <button
            onClick={() => onSeekRelative(2)}
            className="px-2.5 py-2 rounded-xl glass-card text-xs font-semibold text-slate-400 hover:text-white transition-all active:scale-95"
            title="Tua tới 2s"
          >
            +2s
          </button>
        </div>

        {/* Center: Large Play/Pause Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className={`w-13 h-13 p-3.5 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow-amber'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-indigo'
            }`}
            title="Phát / Tạm dừng (Phím Space)"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Auto Loop Toggle */}
          <button
            onClick={onToggleAutoLoop}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              autoLoop
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-sm'
                : 'glass-card border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Tự động lặp lại câu này khi phát hết"
          >
            <Repeat className={`w-3.5 h-3.5 ${autoLoop ? 'text-indigo-400 animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            <span className="hidden sm:inline">Lặp lại</span>
          </button>
        </div>

        {/* Right: Speed & Volume */}
        <div className="flex items-center gap-3">
          {/* Speed Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5 hidden sm:block" />
            {speeds.map((rate) => (
              <button
                key={rate}
                onClick={() => onChangeSpeed(rate)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  playbackRate === rate
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 hidden sm:block"
              title="Âm lượng"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
