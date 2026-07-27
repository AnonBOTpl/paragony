import React from 'react';
import { Camera, ReceiptText, Sparkles, Settings } from 'lucide-react';

export type TabType = 'add' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'add' as TabType,
      label: 'Dodaj / Zrób zdjęcie',
      shortLabel: 'Dodaj',
      icon: Camera,
    },
    {
      id: 'history' as TabType,
      label: 'Wydatki i Historia',
      shortLabel: 'Historia',
      icon: ReceiptText,
    },
    {
      id: 'settings' as TabType,
      label: 'Ustawienia i Kopia',
      shortLabel: 'Ustawienia',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-30 pb-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 touch-manipulation min-h-[56px] ${
                isActive
                  ? 'text-blue-700 bg-blue-50/90 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-full transition-transform ${
                  isActive ? 'scale-110 bg-blue-100 text-blue-700' : ''
                }`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="text-[11px] sm:text-xs mt-0.5 leading-tight text-center">
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
