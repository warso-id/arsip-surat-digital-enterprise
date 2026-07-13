/**
 * BACKGROUND SYNC WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

let isSyncing = false;
let syncTimer = null;

// Handle messages from main thread
self.onmessage = (event) => {
  const { action } = event.data;
  
  switch (action) {
    case 'start':
      startSync();
      break;
    case 'stop':
      stopSync();
      break;
    case 'syncNow':
      performSync();
      break;
    case 'getStatus':
      getStatus();
      break;
  }
};

/**
 * Start periodic sync
 */
function startSync() {
  stopSync();
  
  syncTimer = setInterval(() => {
    performSync();
  }, SYNC_INTERVAL);
  
  self.postMessage({ type: 'status', data: { running: true, interval: SYNC_INTERVAL } });
}

/**
 * Stop periodic sync
 */
function stopSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  
  self.postMessage({ type: 'status', data: { running: false } });
}

/**
 * Perform sync
 */
async function performSync() {
  if (isSyncing) return;
  
  isSyncing = true;
  self.postMessage({ type: 'sync:start' });
  
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    if (pendingActions.length === 0) {
      self.postMessage({ type: 'sync:complete', data: { synced: 0, failed: 0 } });
      return;
    }
    
    self.postMessage({ type: 'sync:progress', data: { total: pendingActions.length, current: 0 } });
    
    let synced = 0;
    let failed = 0;
    
    for (let i = 0; i < pendingActions.length; i++) {
      const action = pendingActions[i];
      
      try {
        const result = await executeAction(action);
        
        if (result.success) {
          await removePendingAction(action.id);
          synced++;
        } else {
          await updatePendingAction(action, result.error);
          failed++;
        }
      } catch (error) {
        await updatePendingAction(action, error.message);
        failed++;
      }
      
      self.postMessage({ 
        type: 'sync:progress', 
        data: { total: pendingActions.length, current: i + 1, synced, failed } 
      });
    }
    
    self.postMessage({ type: 'sync:complete', data: { synced, failed } });
    
  } catch (error) {
    self.postMessage({ type: 'sync:error', data: { error: error.message } });
  } finally {
    isSyncing = false;
  }
}

/**
 * Get pending actions from IndexedDB
 */
async function getPendingActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('asd_offline_db', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingActions'], 'readonly');
      const store = transaction.objectStore('pendingActions');
      const index = store.index('status');
      const getAll = index.getAll('pending');
      
      getAll.onsuccess = () => resolve(getAll.result || []);
      getAll.onerror = () => reject(getAll.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Execute pending action
 */
async function executeAction(action) {
  const { action: actionType, data } = action;
  
  // Build fetch request
  const url = `${APP_CONFIG.API.BASE_URL}?action=${actionType}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    return {
      success: result.status === 'success',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Remove pending action
 */
async function removePendingAction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('asd_offline_db', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update pending action (increment retries)
 */
async function updatePendingAction(action, error) {
  const retries = (action.retries || 0) + 1;
  
  if (retries >= (action.maxRetries || MAX_RETRIES)) {
    // Remove if max retries exceeded
    return removePendingAction(action.id);
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('asd_offline_db', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      
      const updated = {
        ...action,
        retries,
        lastError: error,
        nextRetry: Date.now() + (RETRY_DELAY * Math.pow(2, retries))
      };
      
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve(true);
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get token from storage
 */
function getToken() {
  // Workers don't have access to localStorage directly
  // Token is passed via messages from main thread
  return '';
}

/**
 * Get sync status
 */
function getStatus() {
  self.postMessage({
    type: 'status',
    data: {
      running: !!syncTimer,
      isSyncing,
      interval: SYNC_INTERVAL
    }
  });
}

console.log('✅ Sync Worker initialized');
