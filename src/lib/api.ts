import { CategoryType, ReceiptItem } from '../types';
import { getCustomApiKey } from './storage';

export interface ScanResult {
  store: string;
  date: string;
  total: number;
  category: CategoryType;
  notes?: string;
  items?: Array<{ name: string; price?: number }>;
}

export async function scanReceiptImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<ScanResult> {
  const customApiKey = getCustomApiKey();

  const response = await fetch('/api/scan-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      customApiKey,
    }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Nie udało się przeanalizować zdjęcia paragonu.');
  }

  return json.data as ScanResult;
}

export async function generateMonthlyAnalysis(monthLabel: string, receipts: ReceiptItem[]): Promise<string> {
  const customApiKey = getCustomApiKey();

  const simplifiedReceipts = receipts.map((r) => ({
    sklep: r.store,
    data: r.date,
    kwotaPLN: r.total,
    kategoria: r.category,
    uwagi: r.notes || '',
  }));

  const response = await fetch('/api/analyze-month', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      month: monthLabel,
      receipts: simplifiedReceipts,
      customApiKey,
    }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Nie udało się wygenerować analizy miesięcznej.');
  }

  return json.analysis as string;
}
