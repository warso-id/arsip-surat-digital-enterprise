// ==================== QR CODE SERVICE ====================
// Arsip Surat Digital Enterprise
// Generate dan verifikasi QR Code dengan Base64

const QRCode = require('qrcode');
const crypto = require('crypto');
const config = require('../config/app');

class QrCodeService {
    constructor() {
        this.encryptionService = require('./EncryptionService');
    }

    /**
     * Generate QR Code untuk surat
     */
    async generateSuratQR(nomorAgenda, suratId) {
        try {
            // Buat payload dengan data terenkripsi
            const payload = {
                id: suratId,
                nomor_agenda: nomorAgenda,
                timestamp: Date.now(),
                version: config.app.version,
                hash: this.generateHash(nomorAgenda, suratId),
            };

            // Encode payload ke base64
            const encodedPayload = this.encryptionService.encodeBase64(
                JSON.stringify(payload)
            );

            // Buat verification URL dengan base64 payload
            const verificationUrl = `${config.app.url}/verify?d=${encodedPayload}`;

            // Generate QR Code sebagai base64 data URL
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#1a56db',
                    light: '#ffffff',
                },
                errorCorrectionLevel: 'H',
            });

            return {
                qrCode: qrDataUrl,
                payload: encodedPayload,
                verificationUrl: verificationUrl,
            };
        } catch (error) {
            console.error('Generate QR error:', error);
            throw error;
        }
    }

    /**
     * Generate QR untuk print
     */
    async generatePrintQR(nomorAgenda, suratId) {
        try {
            const payload = this.encryptionService.encodeBase64(
                JSON.stringify({
                    id: suratId,
                    no: nomorAgenda,
                    t: Date.now(),
                })
            );

            const qrBuffer = await QRCode.toBuffer(payload, {
                width: 200,
                margin: 1,
                type: 'png',
                errorCorrectionLevel: 'M',
            });

            return qrBuffer.toString('base64');
        } catch (error) {
            console.error('Generate print QR error:', error);
            throw error;
        }
    }

    /**
     * Verifikasi QR Code
     */
    async verifyQR(encodedPayload) {
        try {
            // Decode payload
            const jsonStr = this.encryptionService.decodeBase64(encodedPayload);
            const payload = JSON.parse(jsonStr);

            // Verifikasi hash
            const expectedHash = this.generateHash(
                payload.nomor_agenda,
                payload.id
            );

            if (payload.hash !== expectedHash) {
                return {
                    valid: false,
                    message: 'QR Code tidak valid - hash mismatch',
                };
            }

            // Check timestamp (optional: expire after 30 days)
            const age = Date.now() - payload.timestamp;
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            const expired = age > maxAge;

            return {
                valid: !expired,
                expired: expired,
                data: {
                    id: payload.id,
                    nomor_agenda: payload.nomor_agenda,
                    timestamp: new Date(payload.timestamp).toISOString(),
                },
                message: expired ? 'QR Code sudah kadaluarsa' : 'QR Code valid',
            };
        } catch (error) {
            return {
                valid: false,
                message: 'QR Code tidak valid - format error',
            };
        }
    }

    /**
     * Generate hash untuk verifikasi
     */
    generateHash(nomorAgenda, suratId) {
        const data = `${nomorAgenda}:${suratId}:${config.app.key}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Generate QR untuk tracking
     */
    async generateTrackingQR(trackingId, data) {
        const encodedData = this.encryptionService.encodeBase64(
            JSON.stringify({
                trackingId: trackingId,
                ...data,
                timestamp: Date.now(),
            })
        );

        return await QRCode.toDataURL(encodedData, {
            width: 200,
            margin: 1,
        });
    }
}

module.exports = new QrCodeService();
