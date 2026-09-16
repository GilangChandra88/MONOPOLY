import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';

export default function LogPanel() {
  const { log } = useGameStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="flex flex-col h-full">
      <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2 px-1">
        📜 Log Kejadian
      </div>
      <div className="flex-1 overflow-y-auto pr-1 space-y-0.5" style={{ maxHeight: '200px' }}>
        {log.map((entry, i) => (
          <div
            key={i}
            className={`
              text-xs px-2 py-0.5 rounded
              ${i === log.length - 1 ? 'text-white bg-white/10' : 'text-white/50'}
              leading-snug
            `}
          >
            {entry}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
