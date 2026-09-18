import React from 'react';
import { useUIStore } from '../../store/useUIStore';

export default function MobileNavBar() {
  const { mobileTab, setMobileTab } = useUIStore();

  const navItems = [
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'properti', label: 'Properti', icon: '🏠' },
    { id: 'log', label: 'Log', icon: '📝' },
  ] as const;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-slate-900 border-t border-slate-700 z-[100] flex justify-around items-center px-2 pb-2 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const isActive = mobileTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setMobileTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`text-2xl transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
