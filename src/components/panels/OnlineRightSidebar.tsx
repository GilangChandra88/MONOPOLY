import React from 'react';
import OnlineLeaderboardUI from './OnlineLeaderboardUI';
import OnlinePlayerInspector from './OnlinePlayerInspector';
import OnlineGameLog from './OnlineGameLog';
import OnlineActionPanel from './OnlineActionPanel';

export default function OnlineRightSidebar() {
  return (
    <div className="absolute top-12 right-0 bottom-0 w-[360px] flex flex-col p-4 pt-2 gap-4 pointer-events-none z-40 overflow-y-auto custom-scrollbar">
      <OnlineLeaderboardUI />
      <OnlinePlayerInspector />
      <OnlineGameLog />
      <OnlineActionPanel />
    </div>
  );
}
