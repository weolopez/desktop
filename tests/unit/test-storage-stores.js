// Unit tests for StorageService object store creation
// Verify object stores are created with correct keyPaths and indexes

import StorageService from '../../src/services/storage-service.js';

(async () => {

  const storage = new StorageService();
  try {
    await storage.openDB();

    // Test preferences store
    const prefStore = storage.db.transaction('preferences').objectStore('preferences');
    if (prefStore.keyPath !== 'key') {
      throw new Error('Preferences store keyPath should be "key"');
    }
    if (prefStore.indexNames.length !== 0) {
      throw new Error('Preferences store should have no indexes');
    }

    // Test sessions store
    const sessionsStore = storage.db.transaction('sessions').objectStore('sessions');
    if (sessionsStore.keyPath !== 'id') {
      throw new Error('Sessions store keyPath should be "id"');
    }
    if (sessionsStore.indexNames.length !== 1 || sessionsStore.indexNames[0] !== 'created') {
      throw new Error('Sessions store should have "created" index');
    }

    // Test extended store
    const extendedStore = storage.db.transaction('extended').objectStore('extended');
    if (extendedStore.keyPath !== 'id') {
      throw new Error('Extended store keyPath should be "id"');
    }
    if (extendedStore.indexNames.length !== 2 || !extendedStore.indexNames.includes('type') || !extendedStore.indexNames.includes('created')) {
      throw new Error('Extended store should have "type" and "created" indexes');
    }

    console.log('Unit tests passed: Object stores created correctly');
  } catch (error) {
    console.error('Unit test failed:', error.message);
  }
})();