import React from 'react';
import type { DictationMode } from '../types';
import { Target, Zap, FileText } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: DictationMode;
  onChangeMode: (mode: DictationMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onChangeMode,
  disabled = false,
}) => {
  const modes: { id: DictationMode; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'MEDIUM',
      title: 'Trung bình',
      desc: 'Điền từ khóa chính (30-40%)',
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: 'HARD',
      title: 'Nâng cao',
      desc: 'Điền hầu hết các từ (70%)',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: 'FULL_SENTENCE',
      title: 'Cả câu',
      desc: 'Tự nghe và gõ nguyên câu',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-card border border-slate-800">
      <span className="text-xs font-semibold text-slate-400 px-3 hidden sm:inline">
        Chế độ luyện:
      </span>
      {modes.map((m) => {
        const isActive = currentMode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            onClick={() => onChangeMode(m.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-brand-600 text-white shadow-glow-indigo'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            title={m.desc}
          >
            {m.icon}
            <span>{m.title}</span>
          </button>
        );
      })}
    </div>
  );
};
