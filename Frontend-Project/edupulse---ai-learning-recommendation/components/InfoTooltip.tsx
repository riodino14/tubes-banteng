import React from 'react';
import { Info } from 'lucide-react';

interface Props {
  text: string;
}

const InfoTooltip: React.FC<Props> = ({ text }) => {
  return (
    <div className="group relative inline-block ml-2 align-middle">
      <Info className="w-4 h-4 text-slate-400 cursor-help hover:text-red-500 transition-colors" />
      {/* Tooltip Bubble */}
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-[11px] leading-relaxed rounded-lg shadow-xl z-50 pointer-events-none text-center">
        {text}
        {/* Panah Kecil */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

export default InfoTooltip;