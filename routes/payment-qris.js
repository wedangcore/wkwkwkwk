const axios = require('axios');
const express = require('express');
const User = require('../model/user');
const mailer = require('../controller/sendMail');
const uploadToWbk = require('../lib/uploader/cdnwbk');
const { encrypt } = require('./help/payment-url'); 
const logApiRequest = require('./help/log-api');

const router = express.Router();

router.post('/payment/qris', logApiRequest, async (req, res) => {
    console.log(`[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Menerima request ke /payment/qris:`, req.body);
    // DITAMBAHKAN: 'paymentMethod' diambil dari body
    const { action, amount, apikey, app, notification, paymentMethod } = req.body;
    
    if (!apikey) {
        return res.status(401).json({ success: false, message: 'Otentikasi gagal. Parameter "apikey" dibutuhkan.' });
    }

    let user;
    try {
        user = await User.findOne({ apiKey: apikey });
        if (!user) {
            return res.status(401).json({ success: false, message: 'API Key tidak valid.' });
        }
    } catch (error) {
        console.error("Database error during user lookup:", error);
        return res.status(500).json({ success: false, message: 'Kesalahan internal server.' });
    }

    switch (action) {
        case 'create':
            try {
                // PERUBAHAN LOGIKA: Membutuhkan 'paymentMethod' untuk memilih QRIS
                if (!paymentMethod) {
                    return res.status(400).json({ success: false, message: "Parameter 'paymentMethod' untuk ID QRIS dibutuhkan." });
                }
                
                // PERUBAHAN LOGIKA: Mencari QRIS berdasarkan ID yang diberikan
                const method = user.paymentMethods.find(m => m.id === paymentMethod && m.category === 'QRIS' && m.isEnabled);
                if (!method) {
                    return res.status(400).json({ success: false, message: `Metode pembayaran QRIS dengan ID '${paymentMethod}' tidak aktif atau tidak ditemukan.` });
                }
                
                const qris_statis = method.qrisString;
                if (!qris_statis) {
                    return res.status(400).json({ success: false, message: "String QRIS statis untuk metode ini belum diatur." });
                }

                const baseAmount = parseInt(amount);
                
                if (!baseAmount || isNaN(baseAmount) || baseAmount <= 0) {
                    return res.status(400).json({ success: false, message: "Parameter 'amount' harus berupa angka positif yang valid." });
                }
                if (method.minAmount > 0 && baseAmount < method.minAmount) {
                    return res.status(400).json({ success: false, message: `Jumlah transaksi minimum adalah Rp ${method.minAmount.toLocaleString('id-ID')}.` });
                }
                if (method.maxAmount > 0 && baseAmount > method.maxAmount) {
                    return res.status(400).json({ success: false, message: `Jumlah transaksi maksimum adalah Rp ${method.maxAmount.toLocaleString('id-ID')}.` });
                }

                const feeAmount = (method.feeType === 'Persen') 
                    ? Math.round(baseAmount * (method.fee / 100)) 
                    : (method.fee || 0);

                let finalAmount;
                let uniqueNumber;
                let isDuplicate;
                do {
                    uniqueNumber = Math.floor(Math.random() * 499) + 1;
                    finalAmount = baseAmount + feeAmount + uniqueNumber;
                    const duplicateTx = user.riwayatTransaksi.find(tx => tx.status === 'pending' && tx.amount === finalAmount);
                    isDuplicate = !!duplicateTx;
                } while (isDuplicate);
                
                const qrApi = "https://qrisku.my.id/api";
                const payload = { amount: finalAmount, qris_statis: qris_statis };
                const qrResponse = await axios.post(qrApi, payload, { headers: { "Content-Type": "application/json" } });
                
                if (!qrResponse.data || !qrResponse.data.qris_base64) {
                     return res.status(500).json({ success: false, message: "Gagal membuat QRIS dari API eksternal." });
                }

                const qrBase64 = qrResponse.data.qris_base64;
                const qrBuffer = Buffer.from(qrBase64, 'base64');
                const fileName = `qris-${user.username}-${Date.now()}.png`;
                const qrUrl = await uploadToWbk(qrBuffer, fileName);                
                
                const newTransactionId = `TRX-${Date.now()}`;
                const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
                
                const encryptedId = encrypt(newTransactionId);
                const paymentUrl = `${req.protocol}://${req.get('host')}/payment/${encryptedId}`;

                const newTransaction = {
                    transactionId: newTransactionId,
                    baseAmount: baseAmount,
                    feeAmount: feeAmount,
                    uniqueNumber: uniqueNumber,
                    amount: finalAmount,
                    status: 'pending',
                    description: `Pembayaran via QRIS`,
                    paymentMethod: method.id,
                    paymentUrl: paymentUrl,
                    qr_base64: qrBase64,
                    qr_url: qrUrl,
                    expiredAt: fifteenMinutesFromNow
                };

                user.riwayatTransaksi.push(newTransaction);
                user.transaksi.pending += 1;
                user.transaksi.total += 1;
                user.transaksi.uang_pending += finalAmount;
                await user.save();

                setTimeout(async () => {
                    try {
                        const userToCheck = await User.findById(user._id);
                        const txToExpire = userToCheck.riwayatTransaksi.find(tx => tx.transactionId === newTransactionId && tx.status === 'pending');
                        if (txToExpire) {
                            txToExpire.status = 'gagal';
                            userToCheck.transaksi.pending -= 1;
                            userToCheck.transaksi.gagal += 1;
                            userToCheck.transaksi.uang_pending -= txToExpire.amount;
                            await userToCheck.save();
                            console.log(`Transaksi QRIS ${newTransactionId} telah kedaluwarsa.`);
                        }
                    } catch (err) {
                        console.error(`Gagal mengupdate transaksi QRIS kedaluwarsa ${newTransactionId}:`, err);
                    }
                }, 15 * 60 * 1000);

                res.json({
                    success: true,
                    message: "QRIS berhasil dibuat",
                    data: {
                        transactionId: newTransactionId,
                        paymentUrl: paymentUrl,
                        amount: finalAmount,
                        paymentMethod: method.id, // Menggunakan ID dari metode QRIS yang dipilih
                        qr_base64: qrBase64,
                        qr_url: qrUrl,
                        expiredAt: fifteenMinutesFromNow.toISOString()
                    }
                });
            } catch (error) {
                console.error("QRIS creation error:", error);
                res.status(500).json({ success: false, message: "Terjadi kesalahan saat membuat QRIS." });
            }
            break;

        case 'update':
            if (!app || !notification) {
                return res.status(400).json({ success: false, message: 'Body request harus berisi apikey, action, app, dan notification.' });
            }
            try {
                const notificationString = notification.toString();
                const nominalMatch = notificationString.match(/(\d[\d.,]*)/);
                if (!nominalMatch) {
                    return res.status(400).json({ success: false, message: 'Tidak ada nominal angka dalam notifikasi.' });
                }
                const nominalFromNotif = parseInt(nominalMatch[0].replace(/[.,]/g, ''));
                
                const txToUpdate = user.riwayatTransaksi.find(
                    tx => tx.status === 'pending' && tx.amount === nominalFromNotif
                );

                if (!txToUpdate) {
                    console.log(`Webhook (QRIS): Tidak ada transaksi pending untuk user ${user.username} dengan nominal ${nominalFromNotif}.`);
                    return res.status(200).json({ success: true, message: 'Tidak ada transaksi yang cocok untuk diupdate.' });
                }

                txToUpdate.status = 'sukses';
                user.transaksi.sukses += 1;
                user.transaksi.pending -= 1;
                user.transaksi.uang_sukses_hari_ini += txToUpdate.amount;
                user.transaksi.uang_sukses_bulan_ini += txToUpdate.amount;
                user.transaksi.uang_pending -= txToUpdate.amount;
                user.transaksi.uang_sukses_total += txToUpdate.amount;
                user.transaksi.omset_total += (txToUpdate.feeAmount + txToUpdate.uniqueNumber);
                await user.save();

                if (user.telegram.token_bot && user.telegram.chat_id) {
                    const notifMessage = `✅ *Pembayaran QRIS Berhasil Diterima*\n\n*ID Transaksi:* \`${txToUpdate.transactionId}\`\n*Jumlah:* *Rp ${txToUpdate.amount.toLocaleString('id-ID')}*\n*Tanggal:* ${new Date().toLocaleString('id-ID')}\n\nTerima kasih!`;
                    await mailer.sendTelegramMessage(user.telegram.token_bot, user.telegram.chat_id, notifMessage);
                }
                console.log(`Webhook (QRIS): Transaksi ${txToUpdate.transactionId} untuk ${user.username} diupdate.`);
                return res.status(200).json({ success: true, message: 'Status transaksi berhasil diperbarui.' });
            } catch (error) {
                console.error("QRIS Webhook Error:", error);
                res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat webhook.' });
            }
            break;
        default:
            res.status(400).json({ message: "Aksi tidak valid. Gunakan 'create' atau 'update'." });
            break;
    }
});

router.get('/payment/qris/status/:transactionId', logApiRequest, async (req, res) => {
    try {
        const { transactionId } = req.params;
        if (!transactionId) {
            return res.status(400).json({ success: false, message: 'Transaction ID harus disertakan.' });
        }
        const userWithTransaction = await User.findOne({
            'riwayatTransaksi.transactionId': transactionId
        });
        if (!userWithTransaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        }
        const transaction = userWithTransaction.riwayatTransaksi.find(
            trx => trx.transactionId === transactionId
        );
        if (transaction) {
            res.status(200).json({
                success: true,
                message: "detail Traksaksi ditemukan",
                data: {
                    transactionId: transaction.transactionId,
                    status: transaction.status,
                    amount: transaction.amount,
                    method: transaction.paymentMethod
                }
            });
        } else {
            return res.status(404).json({ success: false, message: 'Detail transaksi tidak ditemukan.' });
        }
    } catch (error) {
        console.error("Public status check error:", error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

module.exports = router;