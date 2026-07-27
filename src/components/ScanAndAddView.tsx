import React, { useState, useRef } from 'react';
import { Camera, Edit3, Image as ImageIcon, CheckCircle2, X, ZoomIn, Loader2 } from 'lucide-react';
import { CategoryType, CATEGORIES, ReceiptItem } from '../types';
import { COMMON_STORES } from '../lib/categories';
import { formatPLN } from '../lib/storage';

interface ScanAndAddViewProps {
  onSaveReceipt: (receipt: Omit<ReceiptItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onNavigateToHistory: () => void;
}

export const ScanAndAddView: React.FC<ScanAndAddViewProps> = ({
  onSaveReceipt,
  onNavigateToHistory,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // States
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [total, setTotal] = useState('');
  const [category, setCategory] = useState<CategoryType>('Spożywcze');
  const [notes, setNotes] = useState('');
  const [items] = useState<Array<{ name: string; price?: number }>>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Trigger file camera/upload
  const handleTriggerUpload = () => {
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle selected image file
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again
    event.target.value = '';

    // Convert file to base64 and open form for quick manual confirmation
    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setPreviewImage(base64Str);
      setShowForm(true);
    };
    reader.readAsDataURL(file);
  };

  // Open clean form manually
  const handleOpenManual = () => {
    setPreviewImage(null);
    setSuccessMessage(null);
    setDate(new Date().toISOString().split('T')[0]);
    setTotal('');
    setCategory('Spożywcze');
    setNotes('');
    setShowForm(true);
  };

  // Submit and save receipt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseFloat(total.replace(',', '.'));
    if (isNaN(numTotal) || numTotal <= 0) {
      alert('Proszę podać prawidłową kwotę wydatku w PLN.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveReceipt({
        store: category,
        date: date || new Date().toISOString().split('T')[0],
        total: numTotal,
        category,
        notes: notes.trim(),
        items: items.length > 0 ? items : undefined,
        imageUrl: previewImage || undefined,
      });

      setSuccessMessage(`Zapisano wydatek (${category}) na kwotę ${formatPLN(numTotal)}!`);
      setShowForm(false);
      setPreviewImage(null);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      alert(`Błąd zapisu: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-900 p-4 rounded-2xl flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-base sm:text-lg leading-tight">{successMessage}</p>
              <p className="text-xs sm:text-sm text-emerald-700 font-medium">
                Paragon został bezpowrotnie dodany do Twojej pamięci lokalnej.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToHistory}
            className="ml-3 bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs sm:text-sm hover:bg-emerald-800 transition shrink-0"
          >
            Zobacz historię
          </button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Dodaj nowy paragon
        </h2>
        <p className="text-blue-100 text-sm sm:text-base mt-1.5 leading-relaxed">
          Wybierz opcję poniżej, aby wpisać dane z paragonu. Możesz też załączyć zdjęcie z aparatu lub galerii.
        </p>
      </div>

      {/* Main Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Camera / Upload Button */}
        <button
          type="button"
          onClick={handleTriggerUpload}
          className="group relative bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-6 sm:p-8 rounded-3xl shadow-md hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between border border-blue-400/40 touch-manipulation min-h-[160px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="bg-white/20 group-hover:bg-white/30 p-3.5 rounded-2xl transition-transform group-hover:scale-105 border border-white/20">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <span className="bg-blue-900/80 text-blue-100 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-400/30 shadow-sm">
              Aparat / Zdjęcie
            </span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black mt-4 leading-tight">
              Załącz zdjęcie paragonu
            </h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Zrób zdjęcie z aparatu lub wybierz plik z galerii
            </p>
          </div>
        </button>

        {/* Manual Add Button */}
        <button
          type="button"
          onClick={handleOpenManual}
          className="group relative glass-card glass-card-hover hover:bg-slate-50 active:bg-slate-100 text-slate-800 p-6 sm:p-8 rounded-3xl text-left flex flex-col justify-between touch-manipulation min-h-[160px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="bg-blue-50 group-hover:bg-blue-100 p-3.5 rounded-2xl transition-transform group-hover:scale-105 border border-blue-100">
              <Edit3 className="w-10 h-10 text-blue-700" />
            </div>
            <span className="bg-slate-100 text-slate-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Tryb Ręczny
            </span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black mt-4 text-slate-900 leading-tight">
              Dodaj ręcznie
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Wpisz dane w czystym formularzu bez zdjęcia
            </p>
          </div>
        </button>
      </div>

      {/* Form / Preview Modal Card */}
      {showForm && (
        <div className="bg-white rounded-3xl shadow-xl border-2 border-blue-500/40 p-5 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {previewImage ? 'Wypełnij dane z paragonu' : 'Formularz wydatek'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {previewImage
                  ? 'Zdjęcie paragonu zostało załączone. Wpisz datę, kwotę i wybierz kategorię poniżej.'
                  : 'Podaj kwotę, wybierz kategorię i datę zakupu.'}
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setPreviewImage(null);
              }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              title="Zamknij"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image Thumbnail & Zoom button if uploaded */}
          {previewImage && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <img
                  src={previewImage}
                  alt="Podgląd paragonu"
                  className="w-16 h-16 object-cover rounded-xl border border-slate-300 shrink-0 cursor-pointer"
                  onClick={() => setShowImageZoom(true)}
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">Załączone zdjęcie paragonu</p>
                  <p className="text-xs text-slate-500">
                    Kliknij, aby powiększyć i sprawdzić cyfry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImageZoom(true)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 p-2.5 rounded-xl font-medium text-xs flex items-center gap-1 shrink-0"
              >
                <ZoomIn className="w-4 h-4" />
                <span>Powiększ</span>
              </button>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Data i Kwota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                  Data Zakupu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full text-base font-semibold px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-emerald-600 focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Kwota w PLN */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                  Kwota całkowita (PLN) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full text-xl sm:text-2xl font-extrabold px-4 py-3 pr-12 bg-emerald-50/50 border-2 border-emerald-400 rounded-2xl text-emerald-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-emerald-800 text-lg">
                    zł
                  </span>
                </div>
              </div>
            </div>

            {/* Kategoria */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-800 mb-2">
                Kategoria Wydatku <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-2xl border text-left font-extrabold text-xs sm:text-sm flex flex-col justify-between transition-all touch-manipulation ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="block truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Uwagi / Notatki */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Dodatkowe uwagi / opis (opcjonalnie)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="np. zakupy na niedzielny obiad, proszek do prania"
                className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-lg py-4 px-6 rounded-2xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 touch-manipulation"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Zapisywanie...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Zapisz paragon</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setPreviewImage(null);
                }}
                disabled={isSaving}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-4 px-6 rounded-2xl transition touch-manipulation"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Zoom Modal */}
      {showImageZoom && previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3">
              <h4 className="font-bold text-lg">Podgląd zdjęcia paragonu</h4>
              <button
                onClick={() => setShowImageZoom(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center">
              <img
                src={previewImage}
                alt="Powiększone zdjęcie paragonu"
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>
            <div className="text-center">
              <button
                onClick={() => setShowImageZoom(false)}
                className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition"
              >
                Zamknij podgląd
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
