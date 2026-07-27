import { ReceiptItem } from '../types';

const DB_NAME = 'BudzetMamyDB';
const DB_VERSION = 1;
const STORE_NAME = 'receipts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB nie jest wspierany w tej przeglądarce.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Błąd otwierania bazy IndexedDB.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('category', 'category', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function getAllReceipts(): Promise<ReceiptItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items: ReceiptItem[] = request.result || [];
      // Sort descending by date, then by createdAt
      items.sort((a, b) => {
        if (b.date !== a.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt - a.createdAt;
      });
      resolve(items);
    };

    request.onerror = () => {
      reject(request.error || new Error('Błąd odczytu danych z bazy.'));
    };
  });
}

export async function addReceipt(receipt: Omit<ReceiptItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ReceiptItem> {
  const db = await openDB();
  const now = Date.now();
  const newItem: ReceiptItem = {
    ...receipt,
    id: receipt.id || `rec_${now}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(newItem);

    request.onsuccess = () => {
      resolve(newItem);
    };

    request.onerror = () => {
      reject(request.error || new Error('Błąd dodawania paragonu do bazy.'));
    };
  });
}

export async function updateReceipt(receipt: ReceiptItem): Promise<ReceiptItem> {
  const db = await openDB();
  const updatedItem: ReceiptItem = {
    ...receipt,
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(updatedItem);

    request.onsuccess = () => {
      resolve(updatedItem);
    };

    request.onerror = () => {
      reject(request.error || new Error('Błąd aktualizacji paragonu.'));
    };
  });
}

export async function deleteReceipt(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error || new Error('Błąd usuwania paragonu.'));
    };
  });
}

export async function exportAllData(): Promise<string> {
  const items = await getAllReceipts();
  const backup = {
    version: 1,
    appName: 'Budżet Domowy Mamy',
    exportDate: new Date().toISOString(),
    receiptsCount: items.length,
    receipts: items,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importData(jsonString: string): Promise<number> {
  try {
    const parsed = JSON.parse(jsonString);
    const receiptsToImport: ReceiptItem[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.receipts)
      ? parsed.receipts
      : null;

    if (!receiptsToImport) {
      throw new Error('Nieprawidłowy format pliku JSON kopii zapasowej.');
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      let importedCount = 0;
      for (const item of receiptsToImport) {
        if (item && item.store && typeof item.total === 'number') {
          const validItem: ReceiptItem = {
            id: item.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            store: item.store || 'Sklep',
            date: item.date || new Date().toISOString().split('T')[0],
            total: Number(item.total) || 0,
            category: item.category || 'Inne',
            notes: item.notes || '',
            items: Array.isArray(item.items) ? item.items : [],
            imageUrl: item.imageUrl || undefined,
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || Date.now(),
          };
          store.put(validItem);
          importedCount++;
        }
      }

      tx.oncomplete = () => {
        resolve(importedCount);
      };

      tx.onerror = () => {
        reject(tx.error || new Error('Błąd przywracania danych do bazy.'));
      };
    });
  } catch (err: any) {
    throw new Error(`Błąd odczytu pliku kopii zapasowej: ${err.message}`);
  }
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Błąd czyszczenia bazy.'));
  });
}
