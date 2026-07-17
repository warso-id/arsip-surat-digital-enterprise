// FileServiceTest.js - Unit Tests for File Service
const FileService = require('../../src/app/Services/FileService');
const FileHelper = require('../../src/app/Helpers/FileHelper');

describe('FileService', () => {
    let fileService;

    beforeEach(() => {
        fileService = new FileService();
        
        global.localStorage = {
            getItem: jest.fn().mockReturnValue('test-token')
        };
        
        global.fetch = jest.fn();
    });

    test('should create a new instance', () => {
        expect(fileService).toBeInstanceOf(FileService);
    });

    test('should validate file', () => {
        const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const validResult = fileService.validateFile(validFile);
        expect(validResult.valid).toBe(true);
        
        const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
        const invalidResult = fileService.validateFile(invalidFile);
        expect(invalidResult.valid).toBe(false);
    });

    test('should validate file size', () => {
        const smallFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        Object.defineProperty(smallFile, 'size', { value: 1024 });
        
        const result = fileService.validateFile(smallFile);
        expect(result.valid).toBe(true);
    });

    test('should generate filename', () => {
        const filename = fileService.generateFilename('test.pdf');
        expect(filename).toContain('file_');
        expect(filename).toContain('.pdf');
    });

    test('should format file size', () => {
        expect(fileService.formatFileSize(0)).toBe('0 Bytes');
        expect(fileService.formatFileSize(1024)).toContain('KB');
        expect(fileService.formatFileSize(1048576)).toContain('MB');
    });

    test('should get file icon', () => {
        expect(fileService.getFileIcon('test.pdf')).toBe('📕');
        expect(fileService.getFileIcon('test.docx')).toBe('📘');
        expect(fileService.getFileIcon('test.xlsx')).toBe('📗');
        expect(fileService.getFileIcon('test.jpg')).toBe('🖼️');
        expect(fileService.getFileIcon('test.unknown')).toBe('📎');
    });

    test('should read file as base64', async () => {
        const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
        
        const base64 = await fileService.readFileAsBase64(file);
        expect(base64).toBeTruthy();
        expect(typeof base64).toBe('string');
    });
});

describe('FileHelper', () => {
    let fileHelper;

    beforeEach(() => {
        fileHelper = new FileHelper();
    });

    test('should format file size', () => {
        expect(fileHelper.formatFileSize(0)).toBe('0 Bytes');
        expect(fileHelper.formatFileSize(1024)).toBe('1 KB');
        expect(fileHelper.formatFileSize(1048576)).toBe('1 MB');
    });

    test('should get file extension', () => {
        expect(fileHelper.getFileExtension('test.pdf')).toBe('pdf');
        expect(fileHelper.getFileExtension('document.docx')).toBe('docx');
    });

    test('should check if file is image', () => {
        const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
        expect(fileHelper.isImage(imageFile)).toBe(true);
        
        const docFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        expect(fileHelper.isImage(docFile)).toBe(false);
    });

    test('should check if file is document', () => {
        const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        expect(fileHelper.isDocument(pdfFile)).toBe(true);
        
        const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
        expect(fileHelper.isDocument(imageFile)).toBe(false);
    });
});
