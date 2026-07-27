import { StorageStatus } from '../types';

const CUSTOM_API_KEY_STORAGE = 'budzet_mamy_custom_gemini_key';

export async function checkStoragePersistence(): Promise<StorageStatus> {
  let isPersisted = false;
  let usageMB: number | undefined;
  let quotaMB: number | undefined;

  if (navigator.storage && navigator.storage.persisted) {
    try {
      isPersisted = await navigator.storage.persisted();
    } catch (e) {
      console.warn('Błąd przy sprawdzaniu trwałości pamięci:', e);
    }
  }

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined) {
        usageMB = Math.round((estimate.usage / (1024 * 1024)) * 100) / 100;
      }
      if (estimate.quota !== undefined) {
        quotaMB = Math.round((estimate.quota / (1024 * 1024)) * 100) / 100;
      }
    } catch (e) {
      console.warn('Błąd przy szacowaniu pamięci:', e);
    }
  }

  return { isPersisted, usageMB, quotaMB };
}

export async function requestStoragePersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (e) {
      console.warn('Błąd przy proszeniu o trwałe przechowywanie:', e);
      return false;
    }
  }
  return false;
}

export function getCustomApiKey(): string {
  return localStorage.getItem(CUSTOM_API_KEY_STORAGE) || '';
}

export function saveCustomApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(CUSTOM_API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(CUSTOM_API_KEY_STORAGE);
  }
}

export function formatPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMonthName(monthKey: string): string {
  // monthKey format YYYY-MM
  if (!monthKey || monthKey.length !== 7) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const monthNum = parseInt(monthStr, 10) - 1;
  const monthNamesPL = [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień',
  ];
  if (monthNum >= 0 && monthNum < 12) {
    return `${monthNamesPL[monthNum]} ${yearStr}`;
  }
  return monthKey;
}
