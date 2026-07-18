const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ResponseHelper = require('../../Helpers/ResponseHelper');

class FileUploadMiddleware {
    /**
     * Create multer instance
     */
    static createUploader(options = {}) {
        const {
            destination = 'uploads',
            maxSize = 10 * 1024 * 1024, // 10MB
            allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'],
            fieldName = 'file',
            maxFiles = 1
        } = options;

        const storage = multer.memoryStorage();

        const fileFilter = (req, file, cb) => {
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Tipe file ${file.mimetype} tidak diizinkan. Tipe yang diizinkan: ${allowedMimes.join(', ')}`), false);
            }
        };

        return multer({
            storage: storage,
            fileFilter: fileFilter,
            limits: {
                fileSize: maxSize,
                files: maxFiles
            }
        });
    }

    /**
     * Upload single file
     */
    static single(fieldName = 'file', options = {}) {
        const uploader = this.createUploader({ ...options, fieldName });
        
        return (req, res, next) => {
            uploader.single(fieldName)(req, res, (err) => {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            return ResponseHelper.error(res, 'Ukuran file terlalu besar', 400);
                        }
                        if (err.code === 'LIMIT_FILE_COUNT') {
                            return ResponseHelper.error(res, 'Terlalu banyak file', 400);
                        }
                        return ResponseHelper.error(res, err.message, 400);
                    }
                    return ResponseHelper.error(res, err.message, 400);
                }
                next();
            });
        };
    }

    /**
     * Upload multiple files
     */
    static multiple(fieldName = 'files', maxCount = 5, options = {}) {
        const uploader = this.createUploader({ ...options, fieldName, maxFiles: maxCount });
        
        return (req, res, next) => {
            uploader.array(fieldName, maxCount)(req, res, (err) => {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            return ResponseHelper.error(res, 'Ukuran file terlalu besar', 400);
                        }
                        if (err.code === 'LIMIT_FILE_COUNT') {
                            return ResponseHelper.error(res, `Maksimal ${maxCount} file`, 400);
                        }
                        return ResponseHelper.error(res, err.message, 400);
                    }
                    return ResponseHelper.error(res, err.message, 400);
                }
                next();
            });
        };
    }

    /**
     * Upload any files
     */
    static any(options = {}) {
        const uploader = this.createUploader(options);
        
        return (req, res, next) => {
            uploader.any()(req, res, (err) => {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        return ResponseHelper.error(res, err.message, 400);
                    }
                    return ResponseHelper.error(res, err.message, 400);
                }
                next();
            });
        };
    }

    /**
     * Validate uploaded file
     */
    static validateFile(req, res, next) {
        if (!req.file && !req.files) {
            return ResponseHelper.error(res, 'File tidak ditemukan', 400);
        }

        const files = req.files || [req.file];

        for (const file of files) {
            // Check file size
            const maxSize = process.env.MAX_FILE_SIZE || 10485760;
            if (file.size > maxSize) {
                return ResponseHelper.error(res, `Ukuran file melebihi batas maksimal ${maxSize / 1024 / 1024}MB`, 400);
            }

            // Check file extension
            const allowedExts = (process.env.ALLOWED_EXTENSIONS || 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png').split(',');
            const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
            
            if (!allowedExts.includes(ext)) {
                return ResponseHelper.error(res, `Ekstensi file .${ext} tidak diizinkan`, 400);
            }
        }

        next();
    }
}

module.exports = FileUploadMiddleware;
