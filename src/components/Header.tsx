import React from 'react';
import { Wallet, ShieldCheck, ShieldAlert } from 'lucide-react';
import { StorageStatus } from '../types';

interface HeaderProps {
  storageStatus: StorageStatus;
  receiptCount: number;
}

export const Header: React.FC<HeaderProps> = ({ storageStatus, receiptCount }) => {
  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-lg sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner flex items-center justify-center border border-white/20">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight flex items-center gap-2">
              Budżet Mamy
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm font-medium">
              Skaner paragonów • Local-First (PWA)
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {storageStatus.isPersisted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-800/80 text-blue-100 border border-blue-400/40 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Pamięć chroniona</span>
              <span className="sm:hidden">Chroniona</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-amber-950 border border-amber-300/60 backdrop-blur-md">
              <ShieldAlert className="w-4 h-4 text-amber-900" />
              <span>Pamięć lokalna</span>
            </div>
          )}
          <span className="text-[11px] text-blue-100/90 font-medium">
            Zapisano: {receiptCount} {receiptCount === 1 ? 'paragon' : receiptCount < 5 && receiptCount > 1 ? 'paragony' : 'paragonów'}
          </span>
        </div>
      </div>
    </header>
  );
};
