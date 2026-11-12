// IndexedDB Audio Storage for client-side recording persistence
// Guarantees audio playback works immediately even offline or without cloud storage

const DB_NAME = 'beTalkyAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an audio blob associated with a session ID
 */
export async function saveAudioBlob(sessionId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, sessionId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[AudioStorage] Could not save audio to IndexedDB:', err);
  }
}

/**
 * Retrieve an audio blob by session ID
 */
export async function getAudioBlob(sessionId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(sessionId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[AudioStorage] Could not retrieve audio from IndexedDB:', err);
    return null;
  }
}

/**
 * Create a playback object URL for a session ID
 */
export async function getAudioPlaybackUrl(sessionId: string, fallbackUrl?: string): Promise<string | undefined> {
  try {
    const blob = await getAudioBlob(sessionId);
    if (blob && blob.size > 0) {
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.warn('[AudioStorage] Error generating object URL:', err);
  }
  return fallbackUrl;
}

