// SuratMasukTest.js - Unit Tests for Surat Masuk
const SuratMasuk = require('../../src/app/Models/SuratMasuk');
const SuratMasukController = require('../../src/app/Http/Controllers/SuratMasukController');

describe('SuratMasuk Model', () => {
    let suratMasuk;

    beforeEach(() => {
        suratMasuk = new SuratMasuk();
        
        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn().mockReturnValue('test-token'),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        global.localStorage = localStorageMock;
    });

    test('should create a new instance', () => {
        expect(suratMasuk).toBeInstanceOf(SuratMasuk);
        expect(suratMasuk.table).toBe('surat_masuk');
        expect(suratMasuk.primaryKey).toBe('id');
    });

    test('should have correct fillable fields', () => {
        const expectedFields = [
            'no_agenda', 'tanggal_terima', 'pengirim', 'instansi_id',
            'perihal', 'kategori_id', 'sifat', 'status', 'file_path',
            'created_by', 'updated_by'
        ];
        
        expectedFields.forEach(field => {
            expect(suratMasuk.fillable).toContain(field);
        });
    });

    test('should encode data to base64', () => {
        const testData = { name: 'Test', value: 123 };
        const encoded = suratMasuk.encode(testData);
        
        expect(encoded).toBeTruthy();
        expect(typeof encoded).toBe('string');
        
        const decoded = suratMasuk.decode(encoded);
        expect(decoded).toEqual(testData);
    });

    test('should decode base64 data', () => {
        const testData = { id: 1, no_agenda: 'AGD/0001/01/2026' };
        const encoded = btoa(encodeURIComponent(JSON.stringify(testData)));
        const decoded = suratMasuk.decode(encoded);
        
        expect(decoded).toEqual(testData);
    });

    test('should find surat by id', async () => {
        const mockResponse = {
            json: jest.fn().mockResolvedValue({
                data: btoa(encodeURIComponent(JSON.stringify({
                    id: 1,
                    no_agenda: 'AGD/0001/01/2026',
                    pengirim: 'Test Pengirim'
                })))
            })
        };
        
        global.fetch = jest.fn().mockResolvedValue(mockResponse);
        
        const result = await suratMasuk.find(1);
        expect(result).toBeTruthy();
        expect(fetch).toHaveBeenCalled();
    });
});

describe('SuratMasukController', () => {
    let controller;

    beforeEach(() => {
        controller = new SuratMasukController();
        
        global.localStorage = {
            getItem: jest.fn().mockReturnValue('test-token')
        };
    });

    test('should create a new instance', () => {
        expect(controller).toBeInstanceOf(SuratMasukController);
    });

    test('should have index method', () => {
        expect(typeof controller.index).toBe('function');
    });

    test('should have store method', () => {
        expect(typeof controller.store).toBe('function');
    });

    test('should have show method', () => {
        expect(typeof controller.show).toBe('function');
    });

    test('should have update method', () => {
        expect(typeof controller.update).toBe('function');
    });

    test('should have destroy method', () => {
        expect(typeof controller.destroy).toBe('function');
    });
});
