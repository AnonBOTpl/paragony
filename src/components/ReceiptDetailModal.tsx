import React, { useState } from 'react';
import { X, Edit2, Trash2, Calendar, Store, Tag, FileText, Check, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { CategoryType, CATEGORIES, ReceiptItem } from '../types';
import { formatPLN } from '../lib/storage';
import { CATEGORY_INFO } from '../lib/categories';

interface ReceiptDetailModalProps {
  receipt: ReceiptItem;
  onClose: () => void;
  onUpdate: (updated: ReceiptItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receipt,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Edit form states
  const [store, setStore] = useState(receipt.store);
  const [date, setDate] = useState(receipt.date);
  const [total, setTotal] = useState(String(receipt.total));
  const [category, setCategory] = useState<CategoryType>(receipt.category);
  const [notes, setNotes] = useState(receipt.notes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseFloat(total.replace(',', '.'));
    if (isNaN(numTotal) || numTotal <= 0) {
      alert('Proszę podać prawidłową kwotę.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate({
        ...receipt,
        store: store.trim(),
        date,
        total: numTotal,
        category,
        notes: notes.trim(),
      });
      setIsEditing(false);
    } catch (err: any) {
      alert(`Błąd edycji: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(receipt.id);
      onClose();
    } catch (err: any) {
      alert(`Błąd usuwania: ${err.message}`);
      setIsDeleting(false);
    }
  };

  const catMeta = CATEGORY_INFO[receipt.category] || CATEGORY_INFO['Inne'];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight">{receipt.store}</h3>
            <p className="text-emerald-100 text-sm mt-0.5 font-medium">{receipt.date}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Delete Confirmation Alert */}
          {showConfirmDelete ? (
            <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-rose-800">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
                <h4 className="font-bold text-lg">Czy na pewno usunąć?</h4>
              </div>
              <p className="text-xs sm:text-sm text-rose-700 font-medium">
                Ten paragon ze sklepu <strong>{receipt.store}</strong> ({formatPLN(receipt.total)}) zostanie trwale usunięty z pamięci urządzenia.
              </p>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition flex-1"
                >
                  {isDeleting ? 'Usuwanie...' : 'Tak, usuń paragon'}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={isDeleting}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-sm transition flex-1"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <h4 className="font-bold text-lg text-slate-900 border-b pb-2">Edytuj dane paragonu</h4>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sklep</label>
                <input
                  type="text"
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-semibold text-sm bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kwota (PLN)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-sm bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Uwagi</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex-1 flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Zapisz zmiany</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-sm"
                >
                  Anuluj
                </button>
              </div>
            </form>
          ) : (
            /* View Details */
            <div className="space-y-5">
              {/* Total Amount Hero Display */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Kwota całkowita</span>
                  <div className="text-3xl font-black text-emerald-900 mt-0.5">{formatPLN(receipt.total)}</div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl font-bold text-xs ${catMeta.bgColor} ${catMeta.color} ${catMeta.borderColor} border`}>
                  {receipt.category}
                </span>
              </div>

              {/* Details grid */}
              <div className="space-y-3 text-sm text-slate-700 font-medium">
                <div className="flex items-center space-x-3">
                  <Store className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>Sklep: <strong className="text-slate-900">{receipt.store}</strong></span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>Data zakupu: <strong className="text-slate-900">{receipt.date}</strong></span>
                </div>
                {receipt.notes && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <span>Uwagi: <span className="text-slate-900">{receipt.notes}</span></span>
                  </div>
                )}
              </div>

              {/* Items List if available */}
              {receipt.items && receipt.items.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Pozycje na paragonie ({receipt.items.length})
                  </p>
                  <ul className="divide-y divide-slate-200 text-xs sm:text-sm">
                    {receipt.items.map((it, idx) => (
                      <li key={idx} className="py-1.5 flex justify-between">
                        <span className="text-slate-800">{it.name}</span>
                        {it.price !== undefined && (
                          <span className="font-semibold text-slate-900">{formatPLN(it.price)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Image Preview if available */}
              {receipt.imageUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-emerald-600" /> Zdjęcie paragonu
                  </p>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 bg-slate-100 flex items-center justify-center p-2">
                    <img
                      src={receipt.imageUrl}
                      alt="Zdjęcie paragonu"
                      className="max-h-60 object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-2xl transition flex items-center justify-center space-x-2 text-sm"
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                  <span>Edytuj</span>
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-3 px-4 rounded-2xl transition flex items-center justify-center space-x-2 text-sm"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Usuń</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
