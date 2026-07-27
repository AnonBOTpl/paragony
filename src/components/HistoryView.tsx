import React, { useState, useMemo } from 'react';
import { Search, Calendar, Filter, ChevronRight, ReceiptText, ArrowUpDown, Plus } from 'lucide-react';
import { CategoryType, CATEGORIES, ReceiptItem } from '../types';
import { formatPLN, formatMonthName } from '../lib/storage';
import { CATEGORY_INFO } from '../lib/categories';
import { ReceiptDetailModal } from './ReceiptDetailModal';

interface HistoryViewProps {
  receipts: ReceiptItem[];
  onUpdateReceipt: (receipt: ReceiptItem) => Promise<void>;
  onDeleteReceipt: (id: string) => Promise<void>;
  onNavigateToAdd: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  receipts,
  onUpdateReceipt,
  onDeleteReceipt,
  onNavigateToAdd,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [activeReceiptModal, setActiveReceiptModal] = useState<ReceiptItem | null>(null);

  // Extract all unique months YYYY-MM present in receipts
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    receipts.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        monthsSet.add(r.date.substring(0, 7));
      }
    });
    const sorted = Array.from(monthsSet).sort().reverse();
    return sorted;
  }, [receipts]);

  // Set default selected month to current or latest month if not set
  useMemo(() => {
    if (selectedMonth === 'ALL' && availableMonths.length > 0) {
      const currentMonthKey = new Date().toISOString().substring(0, 7);
      if (availableMonths.includes(currentMonthKey)) {
        setSelectedMonth(currentMonthKey);
      } else {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [availableMonths]);

  // Filter receipts based on month, category, search query
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Month filter
      if (selectedMonth !== 'ALL') {
        const itemMonth = r.date ? r.date.substring(0, 7) : '';
        if (itemMonth !== selectedMonth) return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        if (r.category !== selectedCategoryFilter) return false;
      }

      // Search query filter (store or notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const storeMatch = r.store.toLowerCase().includes(q);
        const notesMatch = r.notes ? r.notes.toLowerCase().includes(q) : false;
        if (!storeMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [receipts, selectedMonth, selectedCategoryFilter, searchQuery]);

  // Calculate totals and category breakdown for the filtered/month view
  const monthStats = useMemo(() => {
    const monthItems =
      selectedMonth === 'ALL'
        ? receipts
        : receipts.filter((r) => r.date && r.date.substring(0, 7) === selectedMonth);

    const totalSum = monthItems.reduce((acc, curr) => acc + (curr.total || 0), 0);

    const breakdown: Record<CategoryType, number> = {
      Spożywcze: 0,
      'Chemia/Kosmetyki': 0,
      Dom: 0,
      Zdrowie: 0,
      Odzież: 0,
      Rozrywka: 0,
      'Rachunki/Usługi': 0,
      Inne: 0,
    };

    monthItems.forEach((r) => {
      if (breakdown[r.category] !== undefined) {
        breakdown[r.category] += r.total || 0;
      } else {
        breakdown['Inne'] += r.total || 0;
      }
    });

    return {
      totalSum,
      count: monthItems.length,
      breakdown,
    };
  }, [receipts, selectedMonth]);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Historia wydatków
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
              Wszystkie zapisane paragony w pamięci urządzenia
            </p>
          </div>

          {/* Month Selector Dropdown */}
          <div className="flex items-center space-x-2 bg-blue-950/80 border border-blue-400/30 p-2.5 rounded-2xl backdrop-blur-md">
            <Calendar className="w-5 h-5 text-blue-300 shrink-0 ml-1" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-black text-sm sm:text-base focus:outline-none cursor-pointer pr-2"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white font-semibold">
                  {formatMonthName(m)}
                </option>
              ))}
              <option value="ALL" className="bg-slate-900 text-white font-semibold">
                Wszystkie miesiące
              </option>
            </select>
          </div>
        </div>

        {/* Total Spending Hero Metric */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
          <div>
            <span className="text-xs uppercase font-extrabold text-blue-200 tracking-wider">
              {selectedMonth === 'ALL'
                ? 'Suma ze wszystkich paragonów'
                : `Suma za ${formatMonthName(selectedMonth)}`}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white mt-0.5">
              {formatPLN(monthStats.totalSum)}
            </div>
          </div>
          <div className="text-blue-100 text-xs sm:text-sm font-extrabold bg-white/15 px-3.5 py-1.5 rounded-xl self-start sm:self-center border border-white/10">
            Zarejestrowano {monthStats.count} {monthStats.count === 1 ? 'paragon' : 'paragonów'}
          </div>
        </div>

        {/* Category Breakdown Progress Bars */}
        {monthStats.totalSum > 0 && (
          <div className="space-y-2 pt-2 border-t border-blue-800/60">
            <p className="text-xs font-black text-blue-200 uppercase tracking-wider">
              Rozbicie na kategorie w tym miesiącu:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const amount = monthStats.breakdown[cat] || 0;
                if (amount <= 0) return null;
                const percent = Math.round((amount / monthStats.totalSum) * 100);
                return (
                  <div key={cat} className="bg-blue-950/70 p-2.5 rounded-xl border border-blue-700/50 backdrop-blur-sm">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span className="truncate">{cat}</span>
                      <span className="text-blue-300 font-extrabold">{percent}%</span>
                    </div>
                    <div className="text-xs text-blue-100 font-semibold mt-0.5">
                      {formatPLN(amount)}
                    </div>
                    <div className="w-full bg-blue-900/90 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-blue-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj po nazwie sklepu lub uwagach..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Wszystkie kateg.
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition ${
                selectedCategoryFilter === cat
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List of Receipts */}
      {filteredReceipts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 p-8 rounded-3xl text-center space-y-3">
          <div className="inline-flex p-4 bg-slate-100 rounded-full text-slate-400">
            <ReceiptText className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Brak paragonów dla wybranego filtra
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
            {receipts.length === 0
              ? 'Nie masz jeszcze zarejestrowanych paragonów. Kliknij przycisk poniżej, aby dodać pierwszy!'
              : 'Zmień wybrany miesiąc lub filtr kategorii, aby zobaczyć pozostałe wpisy.'}
          </p>
          {receipts.length === 0 && (
            <button
              onClick={onNavigateToAdd}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-sm transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Dodaj pierwszy paragon</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Lista paragonów ({filteredReceipts.length})</span>
            <span>Kliknij, aby edytować</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredReceipts.map((r) => {
              const info = CATEGORY_INFO[r.category] || CATEGORY_INFO['Inne'];
              return (
                <div
                  key={r.id}
                  onClick={() => setActiveReceiptModal(r)}
                  className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between touch-manipulation"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${info.bgColor} ${info.color} border ${info.borderColor}`}
                    >
                      {r.store.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-900 text-base sm:text-lg truncate leading-tight">
                          {r.store}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${info.bgColor} ${info.color} shrink-0 hidden sm:inline`}
                        >
                          {r.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                        <span>{r.date}</span>
                        {r.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate italic max-w-[140px] sm:max-w-xs">{r.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black text-emerald-900 block leading-tight">
                        {formatPLN(r.total)}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Receipt Details & Editing */}
      {activeReceiptModal && (
        <ReceiptDetailModal
          receipt={activeReceiptModal}
          onClose={() => setActiveReceiptModal(null)}
          onUpdate={async (updated) => {
            await onUpdateReceipt(updated);
            setActiveReceiptModal(null);
          }}
          onDelete={async (id) => {
            await onDeleteReceipt(id);
            setActiveReceiptModal(null);
          }}
        />
      )}
    </div>
  );
};
