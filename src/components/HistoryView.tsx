import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  ChevronRight,
  ReceiptText,
  ArrowLeft,
  Plus,
  Tag,
  Clock,
} from 'lucide-react';
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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [activeReceiptModal, setActiveReceiptModal] = useState<ReceiptItem | null>(null);

  // Group all receipts by month YYYY-MM
  const monthsData = useMemo(() => {
    const map = new Map<
      string,
      {
        monthKey: string;
        monthLabel: string;
        totalAmount: number;
        count: number;
        categoryBreakdown: Record<CategoryType, number>;
        receipts: ReceiptItem[];
      }
    >();

    receipts.forEach((r) => {
      const monthKey = r.date && r.date.length >= 7 ? r.date.substring(0, 7) : 'Inne';
      if (!map.has(monthKey)) {
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
        map.set(monthKey, {
          monthKey,
          monthLabel: formatMonthName(monthKey),
          totalAmount: 0,
          count: 0,
          categoryBreakdown: breakdown,
          receipts: [],
        });
      }
      const entry = map.get(monthKey)!;
      entry.totalAmount += r.total || 0;
      entry.count += 1;
      if (entry.categoryBreakdown[r.category] !== undefined) {
        entry.categoryBreakdown[r.category] += r.total || 0;
      } else {
        entry.categoryBreakdown['Inne'] += r.total || 0;
      }
      entry.receipts.push(r);
    });

    // Sort months descending (e.g. 2026-07, 2026-06...)
    const sorted = Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    return sorted;
  }, [receipts]);

  // Overall total
  const totalAllTime = useMemo(() => {
    return receipts.reduce((acc, r) => acc + (r.total || 0), 0);
  }, [receipts]);

  // Active month data if selected
  const activeMonthData = useMemo(() => {
    if (!selectedMonth) return null;
    return monthsData.find((m) => m.monthKey === selectedMonth) || null;
  }, [monthsData, selectedMonth]);

  // Filter receipts inside selected month
  const filteredMonthReceipts = useMemo(() => {
    if (!activeMonthData) return [];
    return activeMonthData.receipts.filter((r) => {
      // Category filter
      if (selectedCategoryFilter !== 'ALL' && r.category !== selectedCategoryFilter) {
        return false;
      }
      // Search query filter (notes or category name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const categoryMatch = r.category.toLowerCase().includes(q);
        const notesMatch = r.notes ? r.notes.toLowerCase().includes(q) : false;
        if (!categoryMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [activeMonthData, selectedCategoryFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-8">
      {/* CASE 1: NO RECEIPTS AT ALL */}
      {receipts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 p-8 sm:p-12 rounded-3xl text-center space-y-4 shadow-sm animate-fade-in">
          <div className="inline-flex p-5 bg-blue-50 text-blue-600 rounded-full">
            <ReceiptText className="w-12 h-12" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            Brak zapisanych paragonów
          </h3>
          <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            Nie masz jeszcze żadnych zapisanych paragonów w pamięci urządzenia. Dodaj swój pierwszy wydatek, aby zobaczyć zestawienie!
          </p>
          <button
            onClick={onNavigateToAdd}
            className="mt-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold px-6 py-3.5 rounded-2xl text-sm sm:text-base transition inline-flex items-center gap-2 shadow-md touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj pierwszy wydatek</span>
          </button>
        </div>
      ) : selectedMonth === null ? (
        /* CASE 2: MAIN VIEW - LIST OF ALL MONTHS WITH TOTALS & CATEGORIES */
        <div className="space-y-6 animate-fade-in">
          {/* Section Title */}
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xl font-black text-slate-900">
              Historia miesięcy ({monthsData.length})
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              Kliknij miesiąc, aby zobaczyć wpisy
            </span>
          </div>

          {/* List of Months Cards */}
          <div className="space-y-4">
            {monthsData.map((m) => (
              <div
                key={m.monthKey}
                onClick={() => {
                  setSelectedMonth(m.monthKey);
                  setSelectedCategoryFilter('ALL');
                  setSearchQuery('');
                }}
                className="group bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer space-y-4 touch-manipulation"
              >
                {/* Month Card Top Header: Month Label & Month Total */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 capitalize">
                        {m.monthLabel}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-1 block">
                      Zarejestrowano: {m.count} {m.count === 1 ? 'wydatek' : 'wydatków'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-blue-900 block leading-tight">
                      {formatPLN(m.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Category breakdown inside Month Card */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Rozbicie na kategorie:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const amount = m.categoryBreakdown[cat] || 0;
                      if (amount <= 0) return null;
                      const info = CATEGORY_INFO[cat] || CATEGORY_INFO['Inne'];
                      return (
                        <div
                          key={cat}
                          className={`p-2.5 rounded-xl border text-xs font-bold ${info.bgColor} ${info.color} ${info.borderColor} flex justify-between items-center`}
                        >
                          <span className="truncate mr-1">{cat}</span>
                          <span className="font-extrabold shrink-0">{formatPLN(amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 flex items-center justify-between text-xs font-extrabold text-blue-700 group-hover:text-blue-800">
                  <span>Przeglądaj paragony z tego miesiąca</span>
                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full group-hover:bg-blue-100 transition">
                    <span>Otwórz</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* CASE 3: DETAILED VIEW FOR SELECTED MONTH */
        <div className="space-y-6 animate-fade-in">
          {/* Back Button */}
          <button
            onClick={() => setSelectedMonth(null)}
            className="inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-black px-4 py-3 rounded-2xl text-sm transition touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
            <span>← Powrót do wszystkich miesięcy</span>
          </button>

          {/* Selected Month Header Banner */}
          {activeMonthData && (
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black capitalize">
                    {activeMonthData.monthLabel}
                  </h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-0.5 font-medium">
                    Szczegółowa lista paragonów z tego miesiąca
                  </p>
                </div>
                <div className="bg-white/15 px-4 py-2 rounded-2xl border border-white/20 text-right self-start sm:self-auto">
                  <span className="text-xs uppercase text-blue-200 font-bold block">Suma za miesiąc</span>
                  <span className="text-2xl sm:text-3xl font-black text-white">{formatPLN(activeMonthData.totalAmount)}</span>
                </div>
              </div>

              {/* Category breakdown bar for selected month */}
              <div className="pt-2 border-t border-blue-800/60 space-y-2">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                  Suma według kategorii:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const amount = activeMonthData.categoryBreakdown[cat] || 0;
                    if (amount <= 0) return null;
                    return (
                      <div key={cat} className="bg-blue-950/70 p-2.5 rounded-xl border border-blue-700/50">
                        <div className="text-xs font-bold text-blue-100 truncate">{cat}</div>
                        <div className="text-sm font-extrabold text-white mt-0.5">{formatPLN(amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="glass-card p-4 rounded-2xl space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj po uwagach lub kategorii..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Wszystkie ({activeMonthData?.receipts.length || 0})
              </button>
              {CATEGORIES.map((cat) => {
                const count = activeMonthData?.receipts.filter((r) => r.category === cat).length || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition ${
                      selectedCategoryFilter === cat
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receipts list for selected month */}
          {filteredMonthReceipts.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-2">
              <p className="font-bold text-slate-700">Brak paragonów dla wybranego filtra.</p>
              <p className="text-xs text-slate-500">Zmień filtr kategorii lub wpisaną frazę w wyszukiwarce.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Lista wydatków ({filteredMonthReceipts.length})</span>
                <span>Kliknij, aby otworzyć / edytować</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredMonthReceipts.map((r) => {
                  const info = CATEGORY_INFO[r.category] || CATEGORY_INFO['Inne'];
                  return (
                    <div
                      key={r.id}
                      onClick={() => setActiveReceiptModal(r)}
                      className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between touch-manipulation"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${info.bgColor} ${info.color} border ${info.borderColor}`}
                        >
                          {r.category.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-base sm:text-lg truncate leading-tight">
                            {r.category}
                          </h4>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                            <span>{r.date}</span>
                            {r.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate italic max-w-[150px] sm:max-w-xs text-slate-600">
                                  {r.notes}
                                </span>
                              </>
                            )}
                            {r.imageUrl && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-bold">Zdjęcie</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 ml-3">
                        <span className="text-base sm:text-xl font-black text-blue-900 block leading-tight">
                          {formatPLN(r.total)}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
