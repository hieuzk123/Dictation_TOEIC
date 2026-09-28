import React from 'react';
import type { ClozeDensity } from '../types';
import { Sliders } from 'lucide-react';

interface ClozeDensitySelectorProps {
  density: ClozeDensity;
  onChangeDensity: (density: ClozeDensity) => void;
  disabled?: boolean;
}

export const ClozeDensitySelector: React.FC<ClozeDensitySelectorProps> = ({
  density,
  onChangeDensity,
  disabled = false,
}) => {
  const options: ClozeDensity[] = [30, 50, 70];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
      <div className="flex items-center gap-1 pl-2 pr-1 text-slate-400 text-xs font-semibold">
        <Sliders className="w-3.5 h-3.5 text-brand-400" />
        <span className="hidden sm:inline">Đục lỗ:</span>
      </div>

      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const isActive = density === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChangeDensity(opt)}
              title={`Đục lỗ ~${opt}% số từ`}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-brand-500 text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt}%
            </button>
          );
        })}
      </div>
    </div>
  );
};
