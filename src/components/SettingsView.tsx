import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Upload,
  Key,
  HardDrive,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StorageStatus } from '../types';
import { requestStoragePersistence, saveCustomApiKey, getCustomApiKey } from '../lib/storage';
import { exportAllData, importData, clearAllData } from '../lib/db';

interface SettingsViewProps {
  storageStatus: StorageStatus;
  refreshStorageStatus: () => Promise<void>;
  refreshReceipts: () => Promise<void>;
  totalReceiptsCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  storageStatus,
  refreshStorageStatus,
  refreshReceipts,
  totalReceiptsCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom API Key states
  const [apiKeyInput, setApiKeyInput] = useState<string>(getCustomApiKey());
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeySavedNotice, setApiKeySavedNotice] = useState<boolean>(false);

  // Status messages
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Handle persistence button
  const handleEnablePersistence = async () => {
    const success = await requestStoragePersistence();
    await refreshStorageStatus();
    if (success) {
      setStatusMsg({
        type: 'success',
        text: 'Ochrona pamięci została pomyślnie włączona! Dane są trwale chronione przed czyszczeniem.',
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Przeglądarka lub system nie udzielił zgody na trwałe przechowywanie. Skorzystaj z funkcji pobrania kopii zapasowej JSON.',
      });
    }
  };

  // Export JSON backup
  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportAllData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `budzet_mamy_kopia_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: `Kopia zapasowa w pliku JSON została pobrana na Twój telefon! (${totalReceiptsCount} paragonów)`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Błąd eksportu kopii zapasowej: ${err.message}`,
      });
    }
  };

  // Import JSON backup
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const jsonContent = reader.result as string;
        const count = await importData(jsonContent);
        await refreshReceipts();
        setStatusMsg({
          type: 'success',
          text: `Pomyślnie zaimportowano ${count} paragonów z pliku kopii zapasowej!`,
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: `Błąd importu pliku kopii: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Save Custom Gemini Key
  const handleSaveApiKey = () => {
    saveCustomApiKey(apiKeyInput);
    setApiKeySavedNotice(true);
    setTimeout(() => setApiKeySavedNotice(false), 4000);
  };

  // Clear all database
  const handleClearAll = async () => {
    try {
      await clearAllData();
      await refreshReceipts();
      setShowClearConfirm(false);
      setStatusMsg({
        type: 'success',
        text: 'Wszystkie dane zostały pomyślnie wyczyszczone z pamięci lokalnej.',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Błąd czyszczenia: ${err.message}`,
      });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hidden File Input for Restoration */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Bezpieczeństwo danych i Ustawienia
        </h2>
        <p className="text-blue-100 text-sm sm:text-base mt-1.5 leading-relaxed">
          Zarządzaj trwałą ochroną pamięci, twórz pliki kopii zapasowej (JSON) i opcjonalnie dodaj własny klucz API.
        </p>
      </div>

      {/* Alert Status */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-start space-x-3 text-sm font-bold animate-fade-in ${
            statusMsg.type === 'success'
              ? 'bg-blue-50 border-blue-400 text-blue-900'
              : 'bg-rose-50 border-rose-400 text-rose-900'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p>{statusMsg.text}</p>
        </div>
      )}

      {/* Section 1: Local-First & Memory Cleaner Protection */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-800">
            <HardDrive className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Local-First & Ochrona Pamięci
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Wszystkie Twoje paragony są przechowywane wyłącznie w telefonie (IndexedDB)
            </p>
          </div>
        </div>

        {/* Persistence Status Box */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Status pamięci podręcznej:
            </span>
            {storageStatus.isPersisted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Ochrona aktywna
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Standardowa pamięć
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            System Android czasami usuwa pliki starych stron internetowych. Włączenie trwałej ochrony nakazuje przeglądarce chronić pliki domowego budżetu przed czyszczeniem.
          </p>

          {storageStatus.usageMB !== undefined && (
            <p className="text-xs text-slate-500 font-semibold">
              Zajęte miejsce w telefonie: <strong>{storageStatus.usageMB} MB</strong>
            </p>
          )}

          {!storageStatus.isPersisted && (
            <button
              onClick={handleEnablePersistence}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition shadow"
            >
              Poproś o trwałą ochronę pamięci
            </button>
          )}
        </div>
      </div>

      {/* Section 2: Backup & Restore (JSON) */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-800">
            <Download className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Kopia Zapasowa (JSON)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Zapisz dane do pliku na telefonie lub wgraj z pliku
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Download JSON */}
          <button
            onClick={handleExportBackup}
            className="bg-blue-700 hover:bg-blue-800 text-white font-extrabold py-4 px-5 rounded-2xl shadow transition flex items-center justify-center space-x-2 text-sm sm:text-base touch-manipulation"
          >
            <Download className="w-5 h-5 text-blue-200" />
            <span>Pobierz kopię zapasową (.json)</span>
          </button>

          {/* Restore JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-4 px-5 rounded-2xl transition flex items-center justify-center space-x-2 text-sm sm:text-base touch-manipulation border border-slate-300"
          >
            <Upload className="w-5 h-5 text-slate-600" />
            <span>Przywróć kopię z pliku</span>
          </button>
        </div>
      </div>

      {/* Section 3: Optional Custom Gemini API Key */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-3 rounded-2xl text-purple-800">
            <Key className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Własny Klucz Gemini API Key (Opcjonalnie)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Aplikacja posiada wbudowany klucz. Wpisz własny tylko jeśli chcesz korzystać z płatnego limitu.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Wklej swój klucz API (np. AIzaSy...)"
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSaveApiKey}
              className="bg-blue-700 hover:bg-blue-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition"
            >
              Zapisz Klucz
            </button>
            {apiKeyInput && (
              <button
                onClick={() => {
                  setApiKeyInput('');
                  saveCustomApiKey('');
                  setApiKeySavedNotice(true);
                  setTimeout(() => setApiKeySavedNotice(false), 3000);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition"
              >
                Usuń Klucz
              </button>
            )}
          </div>

          {apiKeySavedNotice && (
            <p className="text-xs font-bold text-blue-700">
              Ustawienia klucza API zostały zaktualizowane w localStorage!
            </p>
          )}
        </div>
      </div>

      {/* Danger Zone: Clear database */}
      <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 space-y-3">
        <h4 className="font-bold text-rose-900 text-base">Czyszczenie pamięci</h4>
        <p className="text-xs sm:text-sm text-rose-700 font-medium">
          Usuwa wszystkie paragonów z bazy w telefonie. Przed usunięciem zalecamy pobranie kopii JSON.
        </p>

        {showClearConfirm ? (
          <div className="bg-white p-4 rounded-2xl border-2 border-rose-400 space-y-3">
            <p className="text-xs font-bold text-rose-900">
              Na pewno usunąć wszystkie {totalReceiptsCount} paragonów z telefonu?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleClearAll}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-xl text-xs hover:bg-rose-700 transition"
              >
                Tak, wyczyść wszystko
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-300 transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Wyczyść całą bazę paragonów</span>
          </button>
        )}
      </div>
    </div>
  );
};
