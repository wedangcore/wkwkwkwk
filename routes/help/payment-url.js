const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../../model/user');
const logApiRequest = require('./log-api');

// Kunci dan IV untuk enkripsi/dekripsi. Simpan ini di environment variables pada aplikasi production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwx_1234567'; // Harus 32 byte
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// Fungsi untuk enkripsi
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Fungsi untuk dekripsi
function decrypt(text) {
    try {
        const textParts = text.split(':');
        if (textParts.length !== 2) return null;
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Dekripsi gagal:", error);
        return null;
    }
}

// Route untuk menampilkan halaman pembayaran publik
router.get('/payment/:encryptedId', logApiRequest, async (req, res) => {
    try {
        const { encryptedId } = req.params;
        const transactionId = decrypt(encryptedId);
        if (!transactionId) {
            return res.status(400).render('payment/payment-error', { message: 'URL pembayaran tidak valid atau rusak.' });
        }
        const user = await User.findOne({ 'riwayatTransaksi.transactionId': transactionId });
        if (!user) {
            return res.status(404).render('payment/payment-error', { message: 'Transaksi tidak ditemukan.' });
        }
        const transaction = user.riwayatTransaksi.find(tx => tx.transactionId === transactionId);
        if (!transaction) {
             return res.status(404).render('payment/payment-error', { message: 'Detail transaksi tidak ditemukan.' });
        }
        res.render('payment/payment-page', {
            transaction,
            merchant: user.store,
            paymentMethods: user.paymentMethods.filter(pm => pm.isEnabled),
            pageTitle: 'Laman Pembayaran'
        });
    } catch (error) {
        console.error("Kesalahan saat merender halaman pembayaran:", error);
        res.status(500).render('payment/payment-error', { message: 'Terjadi kesalahan pada server.' });
    }
});

// Route untuk AJAX check status dari halaman pembayaran publik
router.get('/payment/status/:encryptedId', logApiRequest, async (req, res) => {
    try {
        const { encryptedId } = req.params;
        const transactionId = decrypt(encryptedId);
        if (!transactionId) {
            return res.status(400).json({ success: false, message: 'ID tidak valid.' });
        }
        const user = await User.findOne({ 'riwayatTransaksi.transactionId': transactionId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        }
        const transaction = user.riwayatTransaksi.find(tx => tx.transactionId === transactionId);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Detail transaksi tidak ditemukan.' });
        }
        res.json({
            success: true,
            status: transaction.status,
            amount: transaction.amount
        });
    } catch (error) {
        console.error("Kesalahan saat memeriksa status pembayaran:", error);
        res.status(500).json({ success: false, message: 'Kesalahan server.' });
    }
});

module.exports = { router, encrypt, decrypt };
