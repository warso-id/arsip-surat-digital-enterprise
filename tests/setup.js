/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Test Setup File
 * ============================================================
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = String(value); }),
        removeItem: jest.fn((key) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: jest.fn((index) => Object.keys(store)[index] || null),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Mock IndexedDB
const indexedDBMock = {
    open: jest.fn(() => ({
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        result: {
            objectStoreNames: {
                contains: jest.fn(() => false),
            },
            createObjectStore: jest.fn(() => ({
                createIndex: jest.fn(),
            })),
            transaction: jest.fn(() => ({
                objectStore: jest.fn(() => ({
                    add: jest.fn(() => ({
                        onsuccess: null,
                        onerror: null,
                        result: 1,
                    })),
                    get: jest.fn(() => ({
                        onsuccess: null,
                        onerror: null,
                        result: null,
                    })),
                    getAll: jest.fn(() => ({
                        onsuccess: null,
                        onerror: null,
                        result: [],
                    })),
                    put: jest.fn(() => ({
                        onsuccess: null,
                        onerror: null,
                    })),
                    delete: jest.fn(() => ({
                        onsuccess: null,
                        onerror: null,
                    })),
                    clear: jest.fn(() => ({
                        onsuccess: null,
                        onerror: null,
                    })),
                    count: jest.fn(() => ({
                        onsuccess: null,
                        onerror: null,
                        result: 0,
                    })),
                    index: jest.fn(() => ({
                        getAll: jest.fn(() => ({
                            onsuccess: null,
                            onerror: null,
                            result: [],
                        })),
                    })),
                })),
            })),
        },
    })),
    deleteDatabase: jest.fn(() => ({
        onsuccess: null,
        onerror: null,
    })),
};

Object.defineProperty(window, 'indexedDB', { value: indexedDBMock });

// Mock navigator
Object.defineProperty(window, 'navigator', {
    value: {
        onLine: true,
        userAgent: 'Mozilla/5.0 Test',
        platform: 'Test',
        language: 'id-ID',
        cookieEnabled: true,
        serviceWorker: {
            register: jest.fn(() => Promise.resolve()),
            ready: Promise.resolve(),
        },
        storage: {
            estimate: jest.fn(() => Promise.resolve({ usage: 0, quota: 1000000 })),
        },
    },
    writable: true,
});

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
    })
);

// Mock Performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    timing: {
        navigationStart: Date.now(),
        loadEventEnd: Date.now() + 1000,
        domContentLoadedEventEnd: Date.now() + 500,
    },
    memory: {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 50000000,
        jsHeapSizeLimit: 100000000,
    },
    getEntriesByType: jest.fn(() => []),
};

// Mock crypto
global.crypto = {
    getRandomValues: jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return array;
    }),
    subtle: {
        digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Suppress console during tests
const originalConsole = { ...console };
global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

// Restore console after tests
afterAll(() => {
    global.console = originalConsole;
});
