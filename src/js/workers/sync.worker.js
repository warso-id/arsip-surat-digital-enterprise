/**
 * ============================================
 * BACKGROUND SYNC WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL BACKGROUND SYNC - SIAP PRODUKSI
 * Mendukung: Periodic, On-demand, Retry, Queue,
 * Priority, Offline Detection, API Integration
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

const SYNC_INTERVAL = 30000; // 30 seconds default
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 2000;
const DB_NAME = 'asd_offline_db';
const DB_VERSION = 1;

let isSyncing = false;
let syncTimer = null;
let currentInterval = SYNC_INTERVAL;
let authToken = '';
let apiBaseUrl = '';
let syncStats = {
  totalSyncs: 0,
  totalSynced: 0,
  totalFailed: 0,
  lastSyncTime: null,
  lastSyncDuration: 0
};

// ============================================
// MESSAGE HANDLER
// ============================================
self.onmessage = (event) => {
  const { action, data } = event.data;

  switch (action) {
    case 'start':
      startSync(data);
      break;
    case 'stop':
      stopSync();
      break;
    case 'syncNow':
      performSync({ priority: data?.priority || 'all' });
      break;
    case 'setConfig':
      setConfig(data);
      break;
    case 'setToken':
      authToken = data?.token || '';
      break;
    case 'getStatus':
      getStatus();
      break;
    case 'clearStats':
      syncStats = { totalSyncs: 0, totalSynced: 0, totalFailed: 0, lastSyncTime: null, lastSyncDuration: 0 };
      self.postMessage({ type: 'stats:cleared' });
      break;
    default:
      self.postMessage({ type: 'error', error: `Unknown action: ${action}` });
  }
};

// ============================================
// CONFIGURATION
// ============================================
function setConfig(data) {
  if (data?.interval) currentInterval = data.interval;
  if (data?.apiBaseUrl) apiBaseUrl = data.apiBaseUrl;
  if (data?.token) authToken = data.token;
  self.postMessage({ type: 'config:updated', data: { interval: currentInterval, hasToken: !!authToken } });
}

// ============================================
// SYNC CONTROL
// ============================================
function startSync(data) {
  stopSync();
  if (data?.interval) currentInterval = data.interval;

  syncTimer = setInterval(() => performSync(), currentInterval);

  self.postMessage({
    type: 'status',
    data: { running: true, interval: currentInterval, isSyncing }
  });
  console.log(`Sync worker started (interval: ${currentInterval}ms)`);
}

function stopSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  self.postMessage({ type: 'status', data: { running: false, isSyncing } });
}

// ============================================
// MAIN SYNC LOGIC
// ============================================
async function performSync(options = {}) {
  if (isSyncing) {
    self.postMessage({ type: 'sync:skipped', data: { reason: 'Already syncing' } });
    return;
  }

  isSyncing = true;
  const startTime = Date.now();

  self.postMessage({ type: 'sync:start', data: { timestamp: startTime } });

  try {
    // Get pending actions
    const pendingActions = await getPendingActions(options.priority);

    if (pendingActions.length === 0) {
      self.postMessage({ type: 'sync:complete', data: { synced: 0, failed: 0, pending: 0 } });
      updateStats(0, 0, startTime);
      return;
    }

    self.postMessage({
      type: 'sync:progress',
      data: { total: pendingActions.length, current: 0, synced: 0, failed: 0 }
    });

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < pendingActions.length; i++) {
      const action = pendingActions[i];

      // Skip if next retry is in the future
      if (action.nextRetry && Date.now() < action.nextRetry) continue;

      self.postMessage({
        type: 'sync:item:start',
        data: { id: action.id, action: action.action, current: i + 1, total: pendingActions.length }
      });

      try {
        const result = await executeAction(action);

        if (result.success) {
          await removePendingAction(action.id);
          synced++;
          self.postMessage({
            type: 'sync:item:complete',
            data: { id: action.id, action: action.action, success: true, duration: result.duration }
          });
        } else {
          await handleFailedAction(action, result.error);
          failed++;
          self.postMessage({
            type: 'sync:item:failed',
            data: { id: action.id, action: action.action, error: result.error }
          });
        }
      } catch (error) {
        await handleFailedAction(action, error.message);
        failed++;
        self.postMessage({
          type: 'sync:item:failed',
          data: { id: action.id, action: action.action, error: error.message }
        });
      }

      self.postMessage({
        type: 'sync:progress',
        data: { total: pendingActions.length, current: i + 1, synced, failed }
      });
    }

    updateStats(synced, failed, startTime);

    self.postMessage({
      type: 'sync:complete',
      data: {
        synced,
        failed,
        pending: pendingActions.length - synced - failed,
        duration: Date.now() - startTime
      }
    });

  } catch (error) {
    self.postMessage({ type: 'sync:error', data: { error: error.message } });
  } finally {
    isSyncing = false;
  }
}

// ============================================
// ACTION EXECUTION
// ============================================
async function executeAction(action) {
  const startTime = Date.now();
  const url = `${apiBaseUrl}?action=${action.action}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(action.data)
    });

    const duration = Date.now() - startTime;
    const result = await response.json();

    return {
      success: result.status === 'success',
      data: result,
      duration,
      statusCode: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
      statusCode: 0
    };
  }
}

async function handleFailedAction(action, error) {
  const retries = (action.retries || 0) + 1;

  if (retries >= (action.maxRetries || MAX_RETRIES)) {
    // Max retries exceeded - remove from queue and log
    await removePendingAction(action.id);
    await logFailedAction(action, error);
    self.postMessage({
      type: 'sync:item:maxretries',
      data: { id: action.id, action: action.action, retries }
    });
  } else {
    // Update with retry info
    const nextRetry = Date.now() + (BASE_RETRY_DELAY * Math.pow(2, retries));
    await updatePendingAction(action.id, {
      retries,
      lastError: error,
      nextRetry,
      status: 'pending'
    });
  }
}

// ============================================
// INDEXEDDB OPERATIONS
// ============================================
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingActions')) {
        const store = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('action', 'action', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('syncLog')) {
        const store = db.createObjectStore('syncLog', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

async function getPendingActions(priority = 'all') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['pendingActions'], 'readonly');
    const store = tx.objectStore('pendingActions');
    const request = store.getAll();

    request.onsuccess = () => {
      let items = request.result || [];
      // Filter by status pending
      items = items.filter(i => i.status === 'pending');
      // Sort by priority
      if (priority !== 'all') {
        items = items.filter(i => i.priority === priority);
      }
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      items.sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1));
      // Then by timestamp
      items.sort((a, b) => a.timestamp - b.timestamp);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

async function updatePendingAction(id, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['pendingActions'], 'readwrite');
    const store = tx.objectStore('pendingActions');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (!item) { resolve(false); return; }
      Object.assign(item, updates, { updatedAt: Date.now() });
      const putReq = store.put(item);
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

async function removePendingAction(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['pendingActions'], 'readwrite');
    const store = tx.objectStore('pendingActions');
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function logFailedAction(action, error) {
  try {
    const db = await openDB();
    const tx = db.transaction(['syncLog'], 'readwrite');
    const store = tx.objectStore('syncLog');
    store.add({
      action: action.action,
      data: action.data,
      error,
      retries: action.retries,
      timestamp: Date.now(),
      status: 'failed'
    });
  } catch (e) {
    console.error('Failed to log sync failure:', e);
  }
}

// ============================================
// STATS & STATUS
// ============================================
function updateStats(synced, failed, startTime) {
  syncStats.totalSyncs++;
  syncStats.totalSynced += synced;
  syncStats.totalFailed += failed;
  syncStats.lastSyncTime = Date.now();
  syncStats.lastSyncDuration = Date.now() - startTime;
}

function getStatus() {
  self.postMessage({
    type: 'status',
    data: {
      running: !!syncTimer,
      isSyncing,
      interval: currentInterval,
      stats: syncStats,
      hasToken: !!authToken,
      hasApiUrl: !!apiBaseUrl
    }
  });
}

console.log('✅ Sync Worker v3 initialized');
