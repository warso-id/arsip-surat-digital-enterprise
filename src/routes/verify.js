// ==================== VERIFICATION ROUTES ====================
// Arsip Surat Digital Enterprise

const express = require('express');
const router = express.Router();
const QrCodeService = require('../app/Services/QrCodeService');

/**
 * GET /verify - Verifikasi surat dari QR Code
 */
router.get('/', async (req, res) => {
    const encodedData = req.query.d;
    
    if (!encodedData) {
        return res.render('verify', {
            title: 'Verifikasi Surat',
            layout: false,
            error: 'Data verifikasi tidak ditemukan',
        });
    }

    try {
        const result = await QrCodeService.verifyQR(encodedData);
        
        res.render('verify', {
            title: 'Verifikasi Surat',
            layout: false,
            result: result,
            encodedData: encodedData,
        });
    } catch (error) {
        res.render('verify', {
            title: 'Verifikasi Surat',
            layout: false,
            error: 'Gagal memverifikasi surat',
        });
    }
});

/**
 * POST /api/verify - API endpoint untuk verifikasi
 */
router.post('/api/verify', async (req, res) => {
    try {
        const { payload, gasUrl } = req.body;
        
        // Decode GAS URL jika dikirim
        if (gasUrl) {
            const decodedGasUrl = Buffer.from(gasUrl, 'base64').toString('utf-8');
            console.log('GAS URL decoded for verification');
        }
        
        const result = await QrCodeService.verifyQR(payload);
        
        return res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Verification failed',
            error: error.message,
        });
    }
});

module.exports = router;
