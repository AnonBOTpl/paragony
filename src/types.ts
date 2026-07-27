export type CategoryType =
  | 'Spożywcze'
  | 'Chemia/Kosmetyki'
  | 'Dom'
  | 'Zdrowie'
  | 'Odzież'
  | 'Rozrywka'
  | 'Rachunki/Usługi'
  | 'Inne';

export const CATEGORIES: CategoryType[] = [
  'Spożywcze',
  'Chemia/Kosmetyki',
  'Dom',
  'Zdrowie',
  'Odzież',
  'Rozrywka',
  'Rachunki/Usługi',
  'Inne',
];

export interface ReceiptProduct {
  name: string;
  price?: number;
}

export interface ReceiptItem {
  id: string;
  store: string;
  date: string; // YYYY-MM-DD
  total: number; // PLN
  category: CategoryType;
  notes?: string;
  items?: ReceiptProduct[];
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MonthSummary {
  monthKey: string; // e.g. "2026-07"
  monthLabel: string; // e.g. "Lipiec 2026"
  totalAmount: number;
  count: number;
  categoryBreakdown: Partial<Record<CategoryType, number>>;
  topStore: { store: string; amount: number } | null;
}

export interface StorageStatus {
  isPersisted: boolean;
  quotaMB?: number;
  usageMB?: number;
}
