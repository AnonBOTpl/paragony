import React, { useState, useMemo } from 'react';
import { Sparkles, Calendar, Loader2, RefreshCw, Copy, Check, MessageSquareQuote, ShoppingBag, HeartHandshake } from 'lucide-react';
import { ReceiptItem } from '../types';
import { generateMonthlyAnalysis } from '../lib/api';
import { formatMonthName, formatPLN } from '../lib/storage';

interface AiAnalysisViewProps {
  receipts: ReceiptItem[];
}

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({ receipts }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Extract available months
  const availableMonths = useMemo(() => {
    const setM = new Set<string>();
    receipts.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        setM.add(r.date.substring(0, 7));
      }
    });
    return Array.from(setM).sort().reverse();
  }, [receipts]);

  // Set default month to latest
  useMemo(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths]);

  // Receipts in selected month
  const monthReceipts = useMemo(() => {
    if (!selectedMonth) return [];
    return receipts.filter((r) => r.date && r.date.substring(0, 7) === selectedMonth);
  }, [receipts, selectedMonth]);

  const monthTotal = useMemo(() => {
    return monthReceipts.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [monthReceipts]);

  // Trigger AI generation
  const handleRunAnalysis = async () => {
    if (monthReceipts.length === 0) return;

    setIsLoading(true);
    setErrorMsg(null);
    setAnalysisText(null);

    try {
      const monthLabel = formatMonthName(selectedMonth);
      const result = await generateMonthlyAnalysis(monthLabel, monthReceipts);
      setAnalysisText(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Błąd wywoływania AI. Sprawdź połączenie.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisText) return;
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-white/20 p-2.5 rounded-2xl border border-white/20">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider bg-blue-700/80 px-3 py-1 rounded-full text-blue-100 border border-blue-400/30">
            Inteligentny Asystent
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Analiza i Podsumowanie AI
        </h2>
        <p className="text-blue-100 text-sm sm:text-base mt-1.5 leading-relaxed">
          Gemini stworzy dla Ciebie ciepłe, proste i zrozumiałe podsumowanie wydatków z danego miesiąca, wskaże gdzie poszło najwięcej pieniędzy i podpowie praktyczne porady.
        </p>
      </div>

      {/* Month Selector Card */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Wybierz miesiąc do analizy:
            </label>
            {availableMonths.length > 0 ? (
              <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-2xl border border-slate-300">
                <Calendar className="w-5 h-5 text-blue-700 shrink-0 ml-1" />
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setAnalysisText(null);
                  }}
                  className="bg-transparent text-slate-900 font-extrabold text-base focus:outline-none cursor-pointer pr-2"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthName(m)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Brak zarejestrowanych miesięcy.</p>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 block">Wydatki w tym miesiącu:</span>
            <span className="text-2xl font-black text-blue-900">{formatPLN(monthTotal)}</span>
            <span className="text-xs text-slate-500 block">({monthReceipts.length} paragonów)</span>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleRunAnalysis}
          disabled={isLoading || monthReceipts.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-lg transition duration-200 flex items-center justify-center space-x-3 touch-manipulation"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <span>Sztuczna Inteligencja analizuje dane...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-amber-300" />
              <span>Przeanalizuj ten miesiąc z AI</span>
            </>
          )}
        </button>

        {monthReceipts.length === 0 && availableMonths.length > 0 && (
          <p className="text-center text-xs text-slate-500">
            Brak paragonów dla wybranego miesiąca. Dodaj paragony w zakładek Dodaj.
          </p>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-2xl text-sm font-medium">
          <strong>Błąd analizy:</strong> {errorMsg}
        </div>
      )}

      {/* Analysis Result Card */}
      {analysisText && !isLoading && (
        <div className="glass-card rounded-3xl border-2 border-indigo-500/40 p-6 sm:p-8 space-y-6 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-800">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Podsumowanie dla Mamy
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Wygenerowane przez Gemini na podstawie Twoich paragonów ({formatMonthName(selectedMonth)})
                </p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              title="Kopiuj podsumowanie"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Skopiowano!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopiuj</span>
                </>
              )}
            </button>
          </div>

          {/* Formatted Text Box */}
          <div className="prose max-w-none text-slate-800 text-base sm:text-lg leading-relaxed space-y-3 whitespace-pre-wrap font-medium bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {analysisText}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunAnalysis}
              className="text-xs sm:text-sm font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Wygeneruj analizę ponownie</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
