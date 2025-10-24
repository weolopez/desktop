class StorageService {
  constructor() {
    this.db = null;
    this.dbName = 'WEOS_DESKTOP';
    this.dbVersion = 1;
    this.supported = 'indexedDB' in window;
    this.writePaused = false;
    if (!this.supported) {
      console.error('IndexedDB not supported in this browser. Storage features disabled.');
      // Optional: Dispatch event for UI notification
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('storage:unsupported', { detail: { message: 'Storage disabled: IndexedDB not supported' } }));
      }
    }
  }

  async openDB() {
    if (!this.supported) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }
  
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
  
      request.onerror = () => {
        const error = request.error;
        if (error.name === 'AbortError' || error.name === 'UnknownError') {
          // Browser denial or access issue
          this.supported = false;
          if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('storage:denied', { detail: { message: 'Storage access denied by browser' } }));
          }
        }
        reject(error);
      };
  
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
  
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
  
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('created', 'created', { unique: false });
        }
  
        if (!db.objectStoreNames.contains('extended')) {
          const extendedStore = db.createObjectStore('extended', { keyPath: 'id' });
          extendedStore.createIndex('type', 'type', { unique: false });
          extendedStore.createIndex('created', 'created', { unique: false });
        }
      };
    });
  }

  _runTransaction(store, mode, op) {
    if (!this.supported || !this.db) {
      return Promise.reject(new Error('Storage not available'));
    }

    if (mode === 'readwrite' && this.writePaused) {
      return Promise.reject(new Error('Writes paused due to quota exceeded'));
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], mode);
      const objectStore = transaction.objectStore(store);
      const request = op(objectStore);
      request.onsuccess = () => {
        document.dispatchEvent(new CustomEvent('storage:updated', { detail: { store, status: 'ok' } }));
        resolve(request.result);
      };
      request.onerror = () => {
        const error = request.error;
        if (error.name === 'QuotaExceededError') {
          this.writePaused = true;
          if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('storage:quotaExceeded', { detail: { message: 'Storage quota exceeded. Please clear space or restart.' } }));
          }
        }
        document.dispatchEvent(new CustomEvent('storage:error', { detail: { store, error: error.name } }));
        reject(error);
      };
    });
  }

  async setItem(key, value, store = 'preferences') {

    const timestamp = Date.now();
    let item;

    if (store === 'preferences') {
      item = { key, value, timestamp };
    } else if (store === 'sessions') {
      item = { id: key, data: value, created: timestamp, updated: timestamp };
    } else if (store === 'extended') {
      item = { id: key, type: value.type || 'unknown', content: value.content, metadata: { ...value.metadata, created: timestamp, modified: timestamp } };
    } else {
      return Promise.reject(new Error('Invalid store type'));
    }

    return this._runTransaction(store, 'readwrite', (os) => os.put(item)).then(() => ({ status: 'ok' }));
  }

  async getItem(key, store = 'preferences') {

    return this._runTransaction(store, 'readonly', (os) => os.get(key)).then(item => {
      if (!item) {
        return null;
      }

      let value;
      if (store === 'preferences') {
        value = item.value;
      } else if (store === 'sessions') {
        value = item.data;
      } else if (store === 'extended') {
        value = item.content;
      } else {
        return item; // Default to full item for unknown stores
      }

      return value;
    });
  }

  async removeItem(key, store = 'preferences') {
    return this._runTransaction(store, 'readwrite', (os) => os.delete(key)).then(() => ({ status: 'ok' }));
  }
}

// Export for use in other modules
export default StorageService;