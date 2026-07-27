import { ReceiptItem } from '../types';
import { auth, db, ensureAuth } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

const DB_NAME = 'BudzetMamyDB';
const DB_VERSION = 1;
const STORE_NAME = 'receipts';

// Local IndexedDB fallback / local cache
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
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('category', 'category', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// Save list locally to IndexedDB as cache
async function saveLocalCache(items: ReceiptItem[]): Promise<void> {
  try {
    const idb = await openDB();
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const item of items) {
      store.put(item);
    }
  } catch (err) {
    console.warn('Nie udało się zapisać lokalnej pamięci podręcznej:', err);
  }
}

// Get local cache
async function getLocalCache(): Promise<ReceiptItem[]> {
  try {
    const idb = await openDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items: ReceiptItem[] = req.result || [];
        items.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return b.createdAt - a.createdAt;
        });
        resolve(items);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

export async function getAllReceipts(): Promise<ReceiptItem[]> {
  try {
    const user = await ensureAuth();
    if (user) {
      const receiptsRef = collection(db, 'receipts');
      const q = query(receiptsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const items: ReceiptItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          store: data.store || data.category || 'Wydatek',
          date: data.date || new Date().toISOString().split('T')[0],
          total: Number(data.total) || 0,
          category: data.category || 'Inne',
          notes: data.notes || '',
          items: Array.isArray(data.items) ? data.items : [],
          imageUrl: data.imageUrl || undefined,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      items.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt - a.createdAt;
      });

      // Save to local cache for instant offline view
      await saveLocalCache(items);
      return items;
    }
  } catch (err) {
    console.warn('Firebase pobieranie nie powiodło się, używam pamięci lokalnej:', err);
  }

  // Fallback to local cache if offline or error
  return await getLocalCache();
}

export async function addReceipt(
  receipt: Omit<ReceiptItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<ReceiptItem> {
  const now = Date.now();
  const id = receipt.id || `rec_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem: ReceiptItem = {
    ...receipt,
    id,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const user = await ensureAuth();
    if (user) {
      const docRef = doc(db, 'receipts', id);
      await setDoc(docRef, {
        ...newItem,
        userId: user.uid,
      });
    }
  } catch (err) {
    console.warn('Zapis do Firebase nie powiódł się, zapisuję lokalnie:', err);
  }

  // Save to local IndexedDB
  try {
    const idb = await openDB();
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(newItem);
  } catch (err) {
    console.warn('Błąd zapisu do IndexedDB:', err);
  }

  return newItem;
}

export async function updateReceipt(receipt: ReceiptItem): Promise<ReceiptItem> {
  const updatedItem: ReceiptItem = {
    ...receipt,
    updatedAt: Date.now(),
  };

  try {
    const user = await ensureAuth();
    if (user) {
      const docRef = doc(db, 'receipts', receipt.id);
      await setDoc(
        docRef,
        {
          ...updatedItem,
          userId: user.uid,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Aktualizacja w Firebase nie powiodła się:', err);
  }

  try {
    const idb = await openDB();
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(updatedItem);
  } catch (err) {
    console.warn('Błąd aktualizacji w IndexedDB:', err);
  }

  return updatedItem;
}

export async function deleteReceipt(id: string): Promise<boolean> {
  try {
    const user = await ensureAuth();
    if (user) {
      const docRef = doc(db, 'receipts', id);
      await deleteDoc(docRef);
    }
  } catch (err) {
    console.warn('Usuwanie z Firebase nie powiodło się:', err);
  }

  try {
    const idb = await openDB();
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (err) {
    console.warn('Błąd usuwania z IndexedDB:', err);
  }

  return true;
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

    let importedCount = 0;
    for (const item of receiptsToImport) {
      if (item && typeof item.total === 'number') {
        await addReceipt({
          id: item.id,
          store: item.store || item.category || 'Wydatek',
          date: item.date || new Date().toISOString().split('T')[0],
          total: Number(item.total) || 0,
          category: item.category || 'Inne',
          notes: item.notes || '',
          items: Array.isArray(item.items) ? item.items : [],
          imageUrl: item.imageUrl || undefined,
        });
        importedCount++;
      }
    }
    return importedCount;
  } catch (err: any) {
    throw new Error(`Błąd odczytu pliku kopii zapasowej: ${err.message}`);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const user = await ensureAuth();
    if (user) {
      const receiptsRef = collection(db, 'receipts');
      const q = query(receiptsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    }
  } catch (err) {
    console.warn('Błąd czyszczenia Firebase:', err);
  }

  try {
    const idb = await openDB();
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('Błąd czyszczenia IndexedDB:', err);
  }
}
