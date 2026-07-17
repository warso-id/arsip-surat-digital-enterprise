/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * TypeScript Declarations
 * ============================================================
 */

// ==================== GLOBAL CONFIGURATION ====================
declare const ENTERPRISE_CONFIG: {
    version: string;
    build: string;
    gas: {
        url: string;
        encoding: string;
        protocol: string;
        timeout: number;
        retries: number;
    };
    features: Record<string, boolean>;
    debug: boolean;
    logLevel: string;
};

// ==================== BASE64 UTILITIES ====================
declare const __BASE64: {
    encode(data: string | object): string | null;
    decode(encoded: string): string | null;
    encodeObject(obj: object): string | null;
    decodeObject(encoded: string): object | null;
};

// ==================== GAS CONNECTOR ====================
declare const __GAS: {
    request(action: string, data: object, callback?: Function): Promise<any>;
    ping(): Promise<any>;
};

// ==================== STORAGE ====================
declare const __STORE: {
    set(key: string, value: any): boolean;
    get(key: string, defaultValue?: any): any;
    remove(key: string): void;
    clear(): void;
};

// ==================== LOGGER ====================
declare const __LOG: {
    levels: Record<string, number>;
    currentLevel: number;
    log(level: string, message: string, data?: any): void;
    info(msg: string, data?: any): void;
    warn(msg: string, data?: any): void;
    error(msg: string, data?: any): void;
    debug(msg: string, data?: any): void;
};

// ==================== AUTH ====================
declare const __AUTH: {
    isAuthenticated: boolean;
    token: string | null;
    user: any | null;
    hasPermission(perm: string): boolean;
};

// ==================== ENTERPRISE CORE ====================
declare namespace EnterpriseCore {
    const version: string;
    const config: any;
    const state: any;
    const storage: any;
    const events: any;
    const notifications: any;
    function init(): Promise<any>;
    function isAuthenticated(): boolean;
    function getCurrentUser(): any;
    function hasPermission(perm: string): boolean;
}

// ==================== ENTERPRISE CONNECTOR ====================
declare namespace EnterpriseConnector {
    function connect(): Promise<any>;
    function disconnect(): void;
    function ping(): Promise<any>;
    function getStatus(): object;
    function request(action: string, data: object, options?: object): Promise<any>;
    function encode(data: any): string;
    function decode(encoded: string): any;
    function processQueue(): Promise<void>;
    const base64: any;
    const api: {
        login(email: string, password: string): Promise<any>;
        logout(): Promise<any>;
        getSuratMasuk(params?: object): Promise<any>;
        createSuratMasuk(data: object): Promise<any>;
        getSuratKeluar(params?: object): Promise<any>;
        createSuratKeluar(data: object): Promise<any>;
        getDisposisi(params?: object): Promise<any>;
        createDisposisi(data: object): Promise<any>;
        getDashboardStats(): Promise<any>;
        ping(): Promise<any>;
        getVersion(): Promise<any>;
    };
}

// ==================== ENTERPRISE DATABASE ====================
declare namespace EnterpriseDB {
    function init(): Promise<any>;
    function add(table: string, data: object): Promise<any>;
    function get(table: string, id: number): Promise<any>;
    function getAll(table: string, index?: string, value?: any): Promise<any[]>;
    function update(table: string, id: number, data: object): Promise<any>;
    function delete(table: string, id: number): Promise<boolean>;
    function clear(table: string): Promise<boolean>;
    function count(table: string, index?: string, value?: any): Promise<number>;
    function search(table: string, field: string, query: string, limit?: number): Promise<any[]>;
    const tables: Record<string, string>;
    const sync: any;
}

// ==================== ENTERPRISE AUTH ====================
declare namespace EnterpriseAuth {
    function login(email: string, password: string, remember?: boolean): Promise<any>;
    function logout(): Promise<void>;
    function isAuthenticated(): boolean;
    function getCurrentUser(): any;
    function hasPermission(perm: string): boolean;
    function hasRole(role: string): boolean;
    function refreshToken(): Promise<string>;
    function changePassword(oldPass: string, newPass: string): Promise<any>;
    function getUserFullName(): string;
    function getUserInitials(): string;
}

// ==================== UTILITY NAMESPACES ====================
declare namespace EnterpriseUtils {
    const date: any;
    const number: any;
    const string: any;
    const validation: any;
    const dom: any;
    const storage: any;
    const network: any;
    const performance: any;
}

declare namespace EnterpriseI18n {
    function t(key: string, params?: object): string;
    function setLocale(locale: string): void;
    function getLocale(): string;
    function formatDate(date: any, options?: object): string;
    function formatNumber(num: number, options?: object): string;
}

declare namespace EnterpriseTheme {
    function apply(theme: string): boolean;
    function toggle(): string;
    function getCurrent(): object;
    function getThemes(): object;
    function isDark(): boolean;
}

declare namespace EnterpriseSecurity {
    function sanitize(str: string): string;
    function validate(formData: object, rules: object): { valid: boolean; errors: object };
    function encrypt(data: any, key?: string): string;
    function decrypt(data: string, key?: string): any;
    function getCSRFToken(): string;
}

declare namespace EnterpriseCache {
    function get(key: string): any;
    function set(key: string, data: any, options?: object): void;
    function has(key: string): boolean;
    function delete(key: string): void;
    function clear(): void;
    function getStats(): object;
}

declare namespace EnterprisePerformance {
    function debounce(fn: Function, delay?: number): Function;
    function throttle(fn: Function, delay?: number): Function;
    const lazy: any;
    const rateLimit: any;
    const memoize: any;
    const batch: any;
}

declare namespace EnterpriseLogger {
    function info(msg: string, data?: any): void;
    function warn(msg: string, data?: any): void;
    function error(msg: string, data?: any): void;
    function debug(msg: string, data?: any): void;
    function getLogs(level?: string, limit?: number): any[];
    function clear(): void;
    function getStats(): object;
}

declare namespace EnterpriseRealtime {
    function notify(type: string, title: string, message: string, options?: object): any;
    function success(title: string, message: string): any;
    function error(title: string, message: string): any;
    function warning(title: string, message: string): any;
    function info(title: string, message: string): any;
    function getUnreadCount(): number;
}

declare namespace EnterpriseErrorBoundary {
    function handleError(error: object): void;
    function wrap(fn: Function, context?: object): Function;
    function safeExecute(fn: Function, fallback?: any): Promise<any>;
    function getStats(): object;
}

declare namespace EnterpriseOfflineSync {
    function addToSync(action: string, data: object, options?: object): string;
    function processSync(): Promise<object>;
    function getSyncStats(): object;
    function retryFailed(): void;
}

declare namespace EnterpriseBackup {
    function create(options?: object): Promise<any>;
    function restore(backupId: string): Promise<boolean>;
    function list(): any[];
    function download(backupId: string): Promise<void>;
}

declare namespace EnterpriseMonitor {
    function info(msg: string, data?: any): void;
    function error(msg: string, data?: any): void;
    function healthCheck(): Promise<object>;
    function getMetrics(): object;
}

declare namespace EnterpriseDevTools {
    function toggle(): void;
    function clearAll(): void;
    function exportLogs(): void;
    function runPerformanceTest(): void;
}

declare namespace EnterpriseAnalytics {
    function trackPageView(page?: string, title?: string): void;
    function trackEvent(category: string, action: string, label?: string, value?: number): void;
    function getSummary(): object;
}

declare namespace EnterpriseAutoUpdate {
    function check(): Promise<void>;
    function getStatus(): object;
    function applyUpdate(): void;
}

// ==================== GOOGLE APPS SCRIPT TYPES ====================
declare namespace google {
    namespace script {
        namespace run {
            function withSuccessHandler(callback: Function): any;
            function withFailureHandler(callback: Function): any;
        }
    }
}

declare const SpreadsheetApp: any;
declare const Utilities: any;
declare const ContentService: any;
declare const UrlFetchApp: any;
declare const Session: any;
declare const PropertiesService: any;
