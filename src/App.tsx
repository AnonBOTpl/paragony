import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { ScanAndAddView } from './components/ScanAndAddView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ReceiptItem, StorageStatus } from './types';
import { getAllReceipts, addReceipt, updateReceipt, deleteReceipt } from './lib/db';
import { checkStoragePersistence, requestStoragePersistence } from './lib/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('add');
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    isPersisted: false,
  });

  // Fetch receipts from IndexedDB
  const loadReceipts = useCallback(async () => {
    try {
      const items = await getAllReceipts();
      setReceipts(items);
    } catch (e) {
      console.error('Błąd ładowania danych z bazy:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch storage persistence status
  const loadStorageStatus = useCallback(async () => {
    const status = await checkStoragePersistence();
    setStorageStatus(status);
  }, []);

  // Initial setup
  useEffect(() => {
    loadReceipts();
    loadStorageStatus();

    // Auto-request persistence on first visit if available
    requestStoragePersistence().then(() => {
      loadStorageStatus();
    });
  }, [loadReceipts, loadStorageStatus]);

  // Handlers
  const handleSaveReceipt = async (
    receiptData: Omit<ReceiptItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    await addReceipt(receiptData);
    await loadReceipts();
    await loadStorageStatus();
  };

  const handleUpdateReceipt = async (updated: ReceiptItem) => {
    await updateReceipt(updated);
    await loadReceipts();
  };

  const handleDeleteReceipt = async (id: string) => {
    await deleteReceipt(id);
    await loadReceipts();
    await loadStorageStatus();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-900 pb-20">
      {/* Top Header */}
      <Header storageStatus={storageStatus} receiptCount={receipts.length} />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-bold text-base">Ładowanie Twojego budżetu...</p>
          </div>
        ) : (
          <>
            {activeTab === 'add' && (
              <ScanAndAddView
                onSaveReceipt={handleSaveReceipt}
                onNavigateToHistory={() => setActiveTab('history')}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                receipts={receipts}
                onUpdateReceipt={handleUpdateReceipt}
                onDeleteReceipt={handleDeleteReceipt}
                onNavigateToAdd={() => setActiveTab('add')}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                storageStatus={storageStatus}
                refreshStorageStatus={loadStorageStatus}
                refreshReceipts={loadReceipts}
                totalReceiptsCount={receipts.length}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
