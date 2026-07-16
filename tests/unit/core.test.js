/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Unit Tests - Core System
 * ============================================================
 */

describe('EnterpriseCore', () => {
    // ==================== BASE64 TESTS ====================
    describe('EnterpriseBase64', () => {
        test('should encode string to Base64', () => {
            const input = 'Hello World';
            const encoded = EnterpriseBase64.encode(input);
            expect(encoded).toBe('SGVsbG8gV29ybGQ=');
        });

        test('should decode Base64 to string', () => {
            const encoded = 'SGVsbG8gV29ybGQ=';
            const decoded = EnterpriseBase64.decode(encoded);
            expect(decoded).toBe('Hello World');
        });

        test('should encode and decode object', () => {
            const obj = { name: 'Test', value: 123 };
            const encoded = EnterpriseBase64.encodeObject(obj);
            const decoded = EnterpriseBase64.decodeObject(encoded);
            expect(decoded).toEqual(obj);
        });

        test('should handle UTF-8 characters', () => {
            const input = 'Halo Dunia! 🚀';
            const encoded = EnterpriseBase64.encode(input);
            const decoded = EnterpriseBase64.decode(encoded);
            expect(decoded).toBe(input);
        });

        test('should handle empty string', () => {
            const encoded = EnterpriseBase64.encode('');
            const decoded = EnterpriseBase64.decode(encoded);
            expect(decoded).toBe('');
        });

        test('should handle null/undefined gracefully', () => {
            expect(() => EnterpriseBase64.encode(null)).toThrow();
            expect(() => EnterpriseBase64.encode(undefined)).toThrow();
        });

        test('should validate Base64 strings', () => {
            expect(EnterpriseBase64.isBase64('SGVsbG8=')).toBe(true);
            expect(EnterpriseBase64.isBase64('not-base64!!!')).toBe(false);
            expect(EnterpriseBase64.isBase64('')).toBe(false);
            expect(EnterpriseBase64.isBase64(null)).toBe(false);
        });

        test('should encode file to Base64', async () => {
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
            const result = await EnterpriseBase64.encodeFile(file);
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('fileName', 'test.txt');
            expect(result).toHaveProperty('mimeType', 'text/plain');
        });

        test('should decode Base64 to Blob', () => {
            const base64 = btoa('test content');
            const blob = EnterpriseBase64.decodeToBlob(base64, 'text/plain');
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('text/plain');
        });
    });

    // ==================== STATE MANAGER TESTS ====================
    describe('StateManager', () => {
        let stateManager;

        beforeEach(() => {
            stateManager = new StateManager();
            localStorage.clear();
        });

        test('should set and get state', () => {
            stateManager.set('user', { name: 'Test' });
            expect(stateManager.get('user')).toEqual({ name: 'Test' });
        });

        test('should return default value for non-existent key', () => {
            expect(stateManager.get('nonexistent', 'default')).toBe('default');
        });

        test('should remove state', () => {
            stateManager.set('temp', 'value');
            stateManager.remove('temp');
            expect(stateManager.get('temp')).toBeNull();
        });

        test('should notify listeners on state change', () => {
            const listener = jest.fn();
            stateManager.watch('counter', listener);
            stateManager.set('counter', 1);
            expect(listener).toHaveBeenCalledWith(1, undefined);
        });

        test('should unsubscribe listeners', () => {
            const listener = jest.fn();
            const unsubscribe = stateManager.watch('counter', listener);
            unsubscribe();
            stateManager.set('counter', 1);
            expect(listener).not.toHaveBeenCalled();
        });

        test('should persist state to localStorage', () => {
            stateManager.set('persisted', 'value');
            
            const newStateManager = new StateManager();
            expect(newStateManager.get('persisted')).toBe('value');
        });

        test('should clear all state', () => {
            stateManager.set('key1', 'value1');
            stateManager.set('key2', 'value2');
            stateManager.clear();
            expect(stateManager.get('key1')).toBeNull();
            expect(stateManager.get('key2')).toBeNull();
        });
    });

    // ==================== EVENT BUS TESTS ====================
    describe('EventBus', () => {
        let eventBus;

        beforeEach(() => {
            eventBus = new EventBus();
        });

        test('should register and emit events', () => {
            const handler = jest.fn();
            eventBus.on('test', handler);
            eventBus.emit('test', 'data');
            expect(handler).toHaveBeenCalledWith('data');
        });

        test('should handle multiple listeners', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            eventBus.on('test', handler1);
            eventBus.on('test', handler2);
            eventBus.emit('test');
            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });

        test('should handle once events', () => {
            const handler = jest.fn();
            eventBus.once('test', handler);
            eventBus.emit('test');
            eventBus.emit('test');
            expect(handler).toHaveBeenCalledTimes(1);
        });

        test('should remove event listeners', () => {
            const handler = jest.fn();
            eventBus.on('test', handler);
            eventBus.off('test', handler);
            eventBus.emit('test');
            expect(handler).not.toHaveBeenCalled();
        });

        test('should handle errors in handlers gracefully', () => {
            const errorHandler = jest.fn(() => { throw new Error('Test error'); });
            const normalHandler = jest.fn();
            eventBus.on('test', errorHandler);
            eventBus.on('test', normalHandler);
            expect(() => eventBus.emit('test')).not.toThrow();
            expect(normalHandler).toHaveBeenCalled();
        });

        test('should clear specific events', () => {
            const handler = jest.fn();
            eventBus.on('test1', handler);
            eventBus.on('test2', handler);
            eventBus.clear('test1');
            eventBus.emit('test1');
            eventBus.emit('test2');
            expect(handler).toHaveBeenCalledTimes(1);
        });

        test('should clear all events', () => {
            const handler = jest.fn();
            eventBus.on('test1', handler);
            eventBus.on('test2', handler);
            eventBus.clear();
            eventBus.emit('test1');
            eventBus.emit('test2');
            expect(handler).not.toHaveBeenCalled();
        });
    });

    // ==================== STORAGE MANAGER TESTS ====================
    describe('StorageManager', () => {
        beforeEach(() => {
            localStorage.clear();
        });

        test('should store and retrieve string values', () => {
            StorageManager.set('key', 'value');
            expect(StorageManager.get('key')).toBe('value');
        });

        test('should store and retrieve objects', () => {
            const obj = { name: 'Test', count: 42 };
            StorageManager.set('obj', obj);
            expect(StorageManager.get('obj')).toEqual(obj);
        });

        test('should handle Base64 encoding', () => {
            StorageManager.set('encoded', 'secret', true);
            const raw = localStorage.getItem('encoded');
            expect(raw).not.toBe('secret');
            expect(StorageManager.get('encoded', null, true)).toBe('secret');
        });

        test('should return default value for missing keys', () => {
            expect(StorageManager.get('missing', 'default')).toBe('default');
        });

        test('should remove items', () => {
            StorageManager.set('temp', 'value');
            StorageManager.remove('temp');
            expect(StorageManager.get('temp')).toBeNull();
        });

        test('should get all items', () => {
            StorageManager.set('key1', 'value1');
            StorageManager.set('key2', 'value2');
            const all = StorageManager.getAll();
            expect(all).toHaveProperty('key1');
            expect(all).toHaveProperty('key2');
        });
    });
});
