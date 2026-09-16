import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';

export default function OnlineGameLog() {
  const { log } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah setiap ada log baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  if (log.length === 0) return null;

  return (
    <div className="w-full flex-1 min-h-[100px] bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg p-3 flex flex-col pointer-events-auto">
      <div className="text-white/50 text-[10px] font-bold mb-2 uppercase tracking-widest border-b border-white/10 pb-1">
        📜 Log Permainan
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1"
      >
        {log.slice(-15).map((l, i) => (
          <div key={i} className="text-xs text-white/80 leading-tight bg-black/20 p-1.5 rounded border border-white/5">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
