import React from 'react';
import OnlineLeaderboardUI from './OnlineLeaderboardUI';
import OnlinePlayerInspector from './OnlinePlayerInspector';
import OnlineGameLog from './OnlineGameLog';
import OnlineActionPanel from './OnlineActionPanel';
import { useUIStore } from '../../store/useUIStore';

export default function OnlineRightSidebar() {
  const { mobileTab } = useUIStore();

  return (
    <>
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex absolute top-12 right-0 bottom-0 w-[360px] flex-col p-4 pt-2 gap-4 pointer-events-none z-40 overflow-y-auto custom-scrollbar">
        <OnlineLeaderboardUI />
        <OnlinePlayerInspector />
        <OnlineGameLog />
        <OnlineActionPanel />
      </div>

      {/* Mobile Views */}
      <div className="md:hidden absolute inset-0 pointer-events-none z-40 flex flex-col pt-12 pb-28 px-2 overflow-hidden">
        
        {/* TAB: LOG */}
        {mobileTab === 'log' && (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pointer-events-auto bg-slate-900/90 backdrop-blur-md rounded-xl p-4 shadow-xl mb-2">
            <OnlineLeaderboardUI />
            <OnlineGameLog />
          </div>
        )}

        {/* TAB: PROPERTI */}
        {mobileTab === 'properti' && (
          <div className="flex-1 flex flex-col overflow-y-auto pointer-events-auto bg-slate-900/90 backdrop-blur-md rounded-xl p-2 shadow-xl mb-2">
            <OnlinePlayerInspector />
          </div>
        )}

        {/* TAB: MAP (Hanya memunculkan Action Panel di bagian bawah) */}
        {mobileTab === 'map' && (
          <div className="mt-auto pointer-events-none flex flex-col justify-end pb-2">
             <OnlineActionPanel />
          </div>
        )}

      </div>
    </>
  );
}
